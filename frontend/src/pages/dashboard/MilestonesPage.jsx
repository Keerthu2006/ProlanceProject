import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { motion } from 'framer-motion';
import { 
  Box, Typography, Paper, Grid, IconButton, Button, 
  Modal, Backdrop, Fade, TextField, MenuItem, Stack, Tooltip 
} from '@mui/material';
import { Plus, Target, Calendar, DollarSign, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const MilestonesPage = () => {
  const { user } = useAuth();
  const storageKey = `teamlance_milestones_${user?.email || 'default'}`;
  
  const [milestones, setMilestones] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '', projectId: '', dueDate: '', amount: '', description: '', status: 'Todo'
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(milestones));
  }, [milestones, storageKey]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const endpoint = user?.role === 'ROLE_FREELANCER' ? '/projects/assigned' : '/projects/mine';
        const res = await api.get(endpoint);
        const data = res.data.content || res.data || [];
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    if (user) fetchProjects();
  }, [user]);

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.projectId) return;
    
    const project = projects.find(p => p.id === newMilestone.projectId);
    
    const milestone = {
      id: generateId(),
      ...newMilestone,
      projectName: project ? project.title : 'Unknown Project',
      createdAt: new Date().toISOString()
    };

    setMilestones([...milestones, milestone]);
    setIsModalOpen(false);
    setNewMilestone({ title: '', projectId: '', dueDate: '', amount: '', description: '', status: 'Todo' });
  };

  const moveMilestone = (id, newStatus) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
  };

  const columns = [
    { id: 'Todo', title: 'To Do', color: '#ef4444' }, // red
    { id: 'In Progress', title: 'In Progress', color: '#f59e0b' }, // amber
    { id: 'Done', title: 'Done', color: '#10b981' } // green
  ];

  const getMilestonesByStatus = (status) => milestones.filter(m => m.status === status);

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#FFDBBB', mb: 1, fontWeight: 'bold' }}>
            Milestones Kanban
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,219,187,0.7)' }}>
            Track project deliverables and payments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setIsModalOpen(true)}
          sx={{ 
            bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold',
            '&:hover': { bgcolor: '#FFDBBB' },
            borderRadius: 2, px: 3, py: 1
          }}
        >
          New Milestone
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ height: 'calc(100% - 100px)' }}>
        {columns.map(col => (
          <Grid item xs={12} md={4} key={col.id}>
            <Paper sx={{ 
              p: 2, 
              bgcolor: 'rgba(255,219,187,0.03)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(153,126,103,0.1)',
              borderTop: `4px solid ${col.color}`,
              borderRadius: 3,
              height: '100%',
              minHeight: 500,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#E0E0E0', fontWeight: 'bold' }}>
                  {col.title}
                </Typography>
                <Box sx={{ 
                  bgcolor: 'rgba(255,219,187,0.1)', color: '#FFDBBB', 
                  px: 1.5, py: 0.5, borderRadius: 4, fontSize: '0.875rem' 
                }}>
                  {getMilestonesByStatus(col.id).length}
                </Box>
              </Box>

              <Stack spacing={2} sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                {getMilestonesByStatus(col.id).map(milestone => (
                  <motion.div
                    key={milestone.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(153,126,103,0.2)',
                      borderRadius: 2,
                      '&:hover': { borderColor: 'rgba(153,126,103,0.5)' }
                    }}>
                      <Typography variant="subtitle1" sx={{ color: '#FFDBBB', fontWeight: 'bold', mb: 1 }}>
                        {milestone.title}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'rgba(255,219,187,0.6)' }}>
                        <Target size={14} />
                        <Typography variant="caption">{milestone.projectName}</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#997E67' }}>
                          <DollarSign size={14} />
                          <Typography variant="caption">{milestone.amount || '0'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#997E67' }}>
                          <Calendar size={14} />
                          <Typography variant="caption">{milestone.dueDate || 'No date'}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', pt: 1, mt: 1 }}>
                        {col.id !== 'Todo' ? (
                          <Tooltip title="Move Back">
                            <IconButton 
                              size="small" 
                              onClick={() => moveMilestone(milestone.id, col.id === 'Done' ? 'In Progress' : 'Todo')}
                              sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#FFDBBB' } }}
                            >
                              <ArrowLeft size={16} />
                            </IconButton>
                          </Tooltip>
                        ) : <Box />}
                        
                        {col.id !== 'Done' ? (
                          <Tooltip title="Move Forward">
                            <IconButton 
                              size="small"
                              onClick={() => moveMilestone(milestone.id, col.id === 'Todo' ? 'In Progress' : 'Done')}
                              sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#FFDBBB' } }}
                            >
                              <ArrowRight size={16} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <CheckCircle2 size={18} color="#10b981" style={{ alignSelf: 'center' }} />
                        )}
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Add Milestone Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500, sx: { backgroundColor: 'rgba(0,0,0,0.8)' } } }}
      >
        <Fade in={isModalOpen}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 },
            bgcolor: '#0D0A07', border: '1px solid rgba(153,126,103,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            p: 4, borderRadius: 4, outline: 'none'
          }}>
            <Typography variant="h5" sx={{ color: '#FFDBBB', mb: 3, fontWeight: 'bold' }}>
              Create Milestone
            </Typography>

            <form onSubmit={handleAddMilestone}>
              <Stack spacing={3}>
                <TextField 
                  fullWidth label="Milestone Title" required
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                  sx={{ input: { color: '#E0E0E0' }, label: { color: 'rgba(255,219,187,0.7)' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(153,126,103,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#997E67' }
                    }
                  }}
                />
                
                <TextField 
                  select fullWidth label="Project" required
                  value={newMilestone.projectId}
                  onChange={(e) => setNewMilestone({...newMilestone, projectId: e.target.value})}
                  sx={{ 
                    '& .MuiSelect-select': { color: '#E0E0E0' }, label: { color: 'rgba(255,219,187,0.7)' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(153,126,103,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#997E67' }
                    }
                  }}
                  SelectProps={{ MenuProps: { PaperProps: { sx: { bgcolor: '#1A1410', color: '#E0E0E0', border: '1px solid rgba(153,126,103,0.3)' } } } }}
                >
                  {projects.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                  ))}
                  {projects.length === 0 && (
                    <MenuItem value="" disabled>No active projects found</MenuItem>
                  )}
                </TextField>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth label="Amount ($)" type="number"
                      value={newMilestone.amount}
                      onChange={(e) => setNewMilestone({...newMilestone, amount: e.target.value})}
                      sx={{ input: { color: '#E0E0E0' }, label: { color: 'rgba(255,219,187,0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                          '&.Mui-focused fieldset': { borderColor: '#997E67' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth label="Due Date" type="date" InputLabelProps={{ shrink: true }}
                      value={newMilestone.dueDate}
                      onChange={(e) => setNewMilestone({...newMilestone, dueDate: e.target.value})}
                      sx={{ input: { color: '#E0E0E0' }, label: { color: 'rgba(255,219,187,0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                          '&.Mui-focused fieldset': { borderColor: '#997E67' }
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField 
                  fullWidth label="Description (Optional)" multiline rows={3}
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                  sx={{ textarea: { color: '#E0E0E0' }, label: { color: 'rgba(255,219,187,0.7)' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#997E67' }
                    }
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                  <Button 
                    fullWidth variant="outlined" 
                    onClick={() => setIsModalOpen(false)}
                    sx={{ borderColor: 'rgba(153,126,103,0.5)', color: '#E0E0E0', '&:hover': { borderColor: '#FFDBBB' } }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    fullWidth variant="contained" type="submit"
                    sx={{ bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold', '&:hover': { bgcolor: '#FFDBBB' } }}
                  >
                    Add Milestone
                  </Button>
                </Box>
              </Stack>
            </form>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default MilestonesPage;
