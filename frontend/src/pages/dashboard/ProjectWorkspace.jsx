import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const initialData = {
  columns: {
    'todo': { id: 'todo', title: 'To Do', taskIds: ['task-1', 'task-2'] },
    'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: ['task-3'] },
    'done': { id: 'done', title: 'Done', taskIds: ['task-4'] }
  },
  tasks: {
    'task-1': { id: 'task-1', content: 'Design landing page' },
    'task-2': { id: 'task-2', content: 'Setup database' },
    'task-3': { id: 'task-3', content: 'Build authentication' },
    'task-4': { id: 'task-4', content: 'Gather requirements' }
  },
  columnOrder: ['todo', 'in-progress', 'done']
};

export default function ProjectWorkspace() {
  const [data, setData] = useState(initialData);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, taskIds: newTaskIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    setData({
      ...data,
      columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish }
    });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" mb={4}>Project Workspace</Typography>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2 }}>
          {data.columnOrder.map(columnId => {
            const column = data.columns[columnId];
            const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

            return (
              <Box key={column.id} sx={{ minWidth: 300, maxWidth: 300 }}>
                <Paper className="glass-panel" sx={{ p: 2, bgcolor: 'background.paper', height: '100%', minHeight: 400 }}>
                  <Typography variant="h6" mb={2}>{column.title}</Typography>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ minHeight: 100, height: '100%' }}>
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{ p: 2, mb: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}
                              >
                                {task.content}
                              </Paper>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              </Box>
            );
          })}
        </Box>
      </DragDropContext>
    </Box>
  );
}
