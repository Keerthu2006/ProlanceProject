import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Typography, Paper, Grid, Button, Modal, Backdrop, Fade, 
  TextField, MenuItem, Stack, Chip, Divider, Avatar
} from '@mui/material';
import { Plus, CheckCircle2, AlertCircle, ArrowRight, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

export default function MilestonesPage() {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [milestones, setMilestones] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '', description: '', amount: '', dueDate: ''
  });

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [feedback, setFeedback] = useState('');
  
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');

  // Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const endpoint = user?.role === 'ROLE_FREELANCER' ? '/projects/assigned' : '/projects/mine';
        const res = await api.get(endpoint);
        const data = res.data.content || res.data || [];
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0].id);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    if (user) fetchProjects();
  }, [user]);

  // Fetch Milestones when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    fetchMilestones();
  }, [selectedProjectId]);

  const fetchMilestones = async () => {
    try {
      const res = await api.get(`/projects/${selectedProjectId}/milestones`);
      setMilestones(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load milestones');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      // Safely parse date that might be DD-MM-YYYY or YYYY-MM-DD
      let parsedDate = null;
      if (newMilestone.dueDate) {
        const parts = newMilestone.dueDate.split('-');
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
          // DD-MM-YYYY
          parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          // Default YYYY-MM-DD or ISO
          parsedDate = new Date(newMilestone.dueDate);
        }
      }

      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (selectedProject?.dueDate && parsedDate) {
        const projDate = new Date(selectedProject.dueDate);
        if (parsedDate > projDate) {
          toast.error("Milestone due date cannot exceed project deadline.");
          return;
        }
      }

      const formattedMilestone = {
        ...newMilestone,
        dueDate: parsedDate ? parsedDate.toISOString() : null
      };
      await api.post(`/projects/${selectedProjectId}/milestones`, formattedMilestone);
      toast.success('Milestone created!');
      setIsModalOpen(false);
      setNewMilestone({ title: '', description: '', amount: '', dueDate: '' });
      fetchMilestones();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create milestone');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/projects/${selectedProjectId}/milestones/${id}/status`, { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
      fetchMilestones();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleClientReview = async (action) => {
    try {
      if (action === 'approve') {
        await api.put(`/projects/${selectedProjectId}/milestones/${selectedMilestone.id}/approve`);
        toast.success('Milestone Approved & Payment Processed!');
      } else {
        await api.put(`/projects/${selectedProjectId}/milestones/${selectedMilestone.id}/reject`, { feedback });
        toast.warning('Milestone sent back for revision');
      }
      setReviewModalOpen(false);
      setFeedback('');
      fetchMilestones();
    } catch (err) {
      toast.error(`Failed to ${action} milestone`);
    }
  };
  const handleAcceptExtra = async (mid) => {
    try {
      await api.put(`/projects/${selectedProjectId}/milestones/${mid}/accept-extra`);
      toast.success('Extra Milestone Accepted! Budget updated.');
      fetchMilestones();
      fetchProjects(); // refresh budget
    } catch (err) {
      toast.error('Failed to accept extra milestone');
    }
  };

  const handleRejectExtra = async (mid) => {
    try {
      await api.delete(`/projects/${selectedProjectId}/milestones/${mid}/reject-extra`);
      toast.info('Extra Milestone Declined');
      fetchMilestones();
    } catch (err) {
      toast.error('Failed to decline milestone');
    }
  };

  const isClient = user?.role === 'ROLE_CLIENT';
  const isFreelancer = user?.role === 'ROLE_FREELANCER';

  const columns = [
    { id: 'TODO', title: 'To Do', color: '#ef4444' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#f59e0b' },
    { id: 'REVIEW_REQUESTED', title: 'Under Review', color: '#a855f7' },
    { id: 'DONE', title: 'Done / Paid', color: '#10b981' }
  ];

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const isProjectOpen = selectedProject?.status === 'OPEN';

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#FFDBBB', mb: 1, fontWeight: 'bold' }}>
            Milestones & Payments
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,219,187,0.7)' }}>
            Track project deliverables and release payments securely.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            sx={{ 
              width: 200, 
              '& .MuiOutlinedInput-root': { color: '#FFDBBB', bgcolor: 'rgba(255,255,255,0.05)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#664930' }
            }}
          >
            {projects.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
            ))}
          </TextField>

          {isClient && !isProjectOpen && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setIsModalOpen(true)}
              sx={{ bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold', '&:hover': { bgcolor: '#FFDBBB' } }}
            >
              Add Milestone
            </Button>
          )}
        </Box>
      </Box>

      {/* Project Metrics Tracker */}
      {selectedProjectId && (
        <Paper sx={{ mb: 4, p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
          <Grid container spacing={3}>
            {(() => {
              if (!selectedProject) return null;
              const p = selectedProject;
              const remaining = (p.budgetMax || 0) - (p.totalPaid || 0);
              return (
                <>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" sx={{ color: '#997E67' }}>Total Budget</Typography>
                    <Typography variant="h6" sx={{ color: '#10b981' }}>${p.budgetMax || 0}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" sx={{ color: '#997E67' }}>Total Paid</Typography>
                    <Typography variant="h6" sx={{ color: '#FFDBBB' }}>${p.totalPaid || 0}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" sx={{ color: '#997E67' }}>Remaining Budget</Typography>
                    <Typography variant="h6" sx={{ color: remaining >= 0 ? '#FFDBBB' : '#ef4444' }}>${remaining}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" sx={{ color: '#997E67' }}>Project Deadline</Typography>
                    <Typography variant="h6" sx={{ color: '#FFDBBB' }}>
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : (p.durationDays ? `${p.durationDays} Days` : 'N/A')}
                    </Typography>
                    {p.numberOfMilestones && (
                      <Typography variant="caption" sx={{ color: '#a855f7', display: 'block', mt: 1 }}>
                        Milestones Goal: {p.numberOfMilestones}
                      </Typography>
                    )}
                  </Grid>
                </>
              );
            })()}
          </Grid>
        </Paper>
      )}

      {projects.length === 0 ? (
        <Typography sx={{ color: '#997E67' }}>No active projects found.</Typography>
      ) : isProjectOpen ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
          <AlertCircle size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 1 }}>
            Project Not Yet Undertaken
          </Typography>
          <Typography sx={{ color: '#997E67' }}>
            Milestones and payments can only be managed after a freelancer has been hired for this project.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ minHeight: '600px' }}>
          {columns.map(col => (
            <Grid item xs={12} md={3} key={col.id} sx={{ flex: 1, minWidth: 250 }}>
              <Paper sx={{ 
                p: 2, 
                bgcolor: 'rgba(255,219,187,0.03)', 
                border: '1px solid rgba(153,126,103,0.1)',
                borderTop: `4px solid ${col.color}`,
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: '#E0E0E0', fontWeight: 'bold' }}>
                    {col.title}
                  </Typography>
                  <Chip size="small" label={milestones.filter(m => m.status === col.id || (col.id === 'TODO' && m.status === 'PENDING_FREELANCER_APPROVAL')).length} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#FFDBBB' }} />
                </Box>

                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                  <AnimatePresence>
                    {milestones.filter(m => m.status === col.id || (col.id === 'TODO' && m.status === 'PENDING_FREELANCER_APPROVAL')).map(m => (
                      <motion.div key={m.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: 'rgba(13,10,7,0.8)', 
                          border: `1px solid ${m.feedback && m.status === 'IN_PROGRESS' ? '#ef4444' : 'rgba(153,126,103,0.3)'}`,
                          borderRadius: 2 
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#FFDBBB', fontWeight: 'bold', mb: 1 }}>
                            {m.title}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography variant="caption" sx={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <DollarSign size={12}/> {m.amount}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#997E67', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Calendar size={12}/> {new Date(m.dueDate).toLocaleDateString()}
                            </Typography>
                          </Box>

                          {m.feedback && m.status === 'IN_PROGRESS' && (
                            <Box sx={{ bgcolor: 'rgba(239,68,68,0.1)', p: 1, borderRadius: 1, mb: 1 }}>
                              <Typography variant="caption" sx={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AlertCircle size={12}/> Needs Revision: {m.feedback}
                              </Typography>
                            </Box>
                          )}

                          <Divider sx={{ borderColor: 'rgba(153,126,103,0.2)', my: 1 }} />
                          
                          {/* Pending Extra Actions */}
                          {m.status === 'PENDING_FREELANCER_APPROVAL' && isFreelancer && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size="small" fullWidth variant="contained" color="success" onClick={() => handleAcceptExtra(m.id)}>
                                Accept
                              </Button>
                              <Button size="small" fullWidth variant="outlined" color="error" onClick={() => handleRejectExtra(m.id)}>
                                Decline
                              </Button>
                            </Box>
                          )}
                          {m.status === 'PENDING_FREELANCER_APPROVAL' && isClient && (
                            <Typography variant="caption" sx={{ color: '#f59e0b', textAlign: 'center', display: 'block' }}>
                              Awaiting Freelancer Approval
                            </Typography>
                          )}

                          {/* Freelancer Actions */}
                          {isFreelancer && m.status === 'TODO' && (
                            <Button size="small" fullWidth onClick={() => updateStatus(m.id, 'IN_PROGRESS')} sx={{ color: '#60a5fa' }}>
                              Start Work
                            </Button>
                          )}
                          {isFreelancer && m.status === 'IN_PROGRESS' && (
                            <Button size="small" fullWidth onClick={() => { setSelectedMilestone(m); setSubmissionModalOpen(true); }} sx={{ color: '#a855f7' }}>
                              Submit for Review
                            </Button>
                          )}
                          
                          {/* Client Actions */}
                          {isClient && m.status === 'REVIEW_REQUESTED' && (
                            <Button size="small" fullWidth variant="contained" 
                              onClick={() => { setSelectedMilestone(m); setReviewModalOpen(true); }} 
                              sx={{ bgcolor: '#a855f7', '&:hover': { bgcolor: '#9333ea' } }}>
                              Review & Pay
                            </Button>
                          )}

                          {m.status === 'DONE' && (
                            <Typography variant="caption" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                              <CheckCircle2 size={14}/> Paid to Freelancer
                            </Typography>
                          )}
                        </Paper>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* New Milestone Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 500 } }}>
        <Fade in={isModalOpen}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, p: 4, boxShadow: 24,
          }}>
            <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3 }}>Add New Milestone</Typography>
            <form onSubmit={handleAddMilestone}>
              <Stack spacing={3}>
                <TextField label="Milestone Title" required variant="outlined" value={newMilestone.title} onChange={e => setNewMilestone({...newMilestone, title: e.target.value})} sx={{ input: { color: '#E0E0E0' }, label: { color: '#997E67' } }} />
                <TextField label="Description" multiline rows={2} variant="outlined" value={newMilestone.description} onChange={e => setNewMilestone({...newMilestone, description: e.target.value})} sx={{ textarea: { color: '#E0E0E0' }, label: { color: '#997E67' } }} />
                <TextField label="Amount ($)" type="number" required variant="outlined" value={newMilestone.amount} onChange={e => setNewMilestone({...newMilestone, amount: e.target.value})} sx={{ input: { color: '#E0E0E0' }, label: { color: '#997E67' } }} />
                <TextField label="Due Date" type="date" required slotProps={{ inputLabel: { shrink: true } }} variant="outlined" value={newMilestone.dueDate} onChange={e => setNewMilestone({...newMilestone, dueDate: e.target.value})} sx={{ input: { color: '#E0E0E0' }, label: { color: '#997E67' } }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button onClick={() => setIsModalOpen(false)} sx={{ color: '#997E67' }}>Cancel</Button>
                  <Button type="submit" variant="contained" sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}>Create Milestone</Button>
                </Box>
              </Stack>
            </form>
          </Box>
        </Fade>
      </Modal>

      {/* Review & Pay Modal */}
      <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 500 } }}>
        <Fade in={reviewModalOpen}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, p: 4, boxShadow: 24,
          }}>
            <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 2 }}>Review Milestone</Typography>
            <Typography variant="body2" sx={{ color: '#E0E0E0', mb: 3 }}>
              {selectedMilestone?.title} - <strong style={{color:'#10b981'}}>${selectedMilestone?.amount}</strong>
            </Typography>
            
            {selectedMilestone?.submissionNote && (
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1, mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#997E67' }}>Freelancer Notes / Links:</Typography>
                <Typography variant="body2" sx={{ color: '#FFDBBB', mt: 1, whiteSpace: 'pre-wrap' }}>
                  {selectedMilestone.submissionNote}
                </Typography>
              </Box>
            )}

            <Stack spacing={3}>
              <TextField 
                label="Feedback / Revision Notes (if rejecting)" 
                multiline rows={3} variant="outlined" 
                value={feedback} onChange={e => setFeedback(e.target.value)} 
                sx={{ textarea: { color: '#E0E0E0' }, label: { color: '#997E67' } }} 
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button variant="outlined" color="error" onClick={() => handleClientReview('reject')}>Request Revision</Button>
                <Button variant="contained" color="success" onClick={() => handleClientReview('approve')}>Approve & Pay</Button>
              </Box>
            </Stack>
          </Box>
        </Fade>
      </Modal>

      {/* Submit for Review Modal (Freelancer) */}
      <Modal open={submissionModalOpen} onClose={() => setSubmissionModalOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 500 } }}>
        <Fade in={submissionModalOpen}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, p: 4, boxShadow: 24,
          }}>
            <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 2 }}>Submit for Review</Typography>
            <Typography variant="body2" sx={{ color: '#E0E0E0', mb: 3 }}>
              {selectedMilestone?.title}
            </Typography>
            <Stack spacing={3}>
              <TextField 
                label="Deliverables Link / Notes" 
                multiline rows={3} variant="outlined" 
                value={submissionNote} onChange={e => setSubmissionNote(e.target.value)} 
                sx={{ textarea: { color: '#E0E0E0' }, label: { color: '#997E67' } }} 
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button onClick={() => setSubmissionModalOpen(false)} sx={{ color: '#997E67' }}>Cancel</Button>
                <Button variant="contained" color="success" onClick={async () => {
                  try {
                    await api.put(`/projects/${selectedProjectId}/milestones/${selectedMilestone.id}/status`, { status: 'REVIEW_REQUESTED', submissionNote });
                    toast.success('Submitted for review!');
                    setSubmissionModalOpen(false);
                    setSubmissionNote('');
                    fetchMilestones();
                  } catch(e) {
                    toast.error('Failed to submit');
                  }
                }}>Submit</Button>
              </Box>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}
