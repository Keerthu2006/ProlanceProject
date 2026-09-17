import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Typography, Paper, Grid, Button, Modal, Backdrop, Fade, 
  TextField, MenuItem, Stack, Chip, Divider, Avatar, AvatarGroup,
  Drawer, IconButton, Tooltip, Badge, Select, FormControl, InputLabel
} from '@mui/material';
import { 
  Plus, CheckCircle2, AlertCircle, DollarSign, Calendar, MessageSquare, 
  Users, GitBranch, ExternalLink, Send, X, Shield, Code, Check
} from 'lucide-react';
import { toast } from 'react-toastify';

const GithubIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function MilestonesPage() {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '', description: '', amount: '', dueDate: ''
  });

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [feedback, setFeedback] = useState('');
  
  // Start Work Modal
  const [startWorkModalOpen, setStartWorkModalOpen] = useState(false);
  const [startWorkData, setStartWorkData] = useState({
    assignedFreelancerId: '',
    assignedFreelancerName: '',
    githubBranch: ''
  });

  // Submission Modal
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    submissionNote: '',
    githubPrUrl: '',
    githubBranch: ''
  });

  // GitHub Repo Modal
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [githubRepoInput, setGithubRepoInput] = useState('');

  // Team Chat (WhatsApp style)
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const chatBottomRef = useRef(null);

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

  // Fetch Milestones & Team Members when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    fetchMilestones();
    fetchProjectTeam();
    fetchMessages();
  }, [selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const isProjectOpen = selectedProject?.status === 'OPEN';
  const isClient = user?.role === 'ROLE_CLIENT';
  const isFreelancer = user?.role === 'ROLE_FREELANCER';

  // Polling for live team chat
  useEffect(() => {
    if (!chatOpen || !selectedProjectId) return;
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [chatOpen, selectedProjectId]);

  const fetchMilestones = async () => {
    try {
      const res = await api.get(`/projects/${selectedProjectId}/milestones`);
      setMilestones(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load milestones');
    }
  };

  const fetchProjectTeam = async () => {
    if (!selectedProject?.teamId) {
      setTeamMembers([]);
      return;
    }
    try {
      const res = await api.get(`/teams/${selectedProject.teamId}/members`);
      setTeamMembers(res.data || []);
    } catch (err) {
      console.warn("Could not fetch team members for teamId", selectedProject.teamId);
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!selectedProjectId) return;
    try {
      const res = await api.get(`/projects/${selectedProjectId}/messages`);
      setMessages(res.data || []);
      if (!silent) {
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      if (!silent) console.error("Failed to fetch messages", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    try {
      await api.post(`/projects/${selectedProjectId}/messages`, { content: chatText.trim() });
      setChatText('');
      fetchMessages();
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      let parsedDate = null;
      if (newMilestone.dueDate) {
        parsedDate = new Date(newMilestone.dueDate);
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

  // Open Start Work Modal
  const openStartWorkModal = (m) => {
    setSelectedMilestone(m);
    setStartWorkData({
      assignedFreelancerId: m.assignedFreelancerId || user?.id || '',
      assignedFreelancerName: m.assignedFreelancerName || user?.fullName || user?.email || '',
      githubBranch: m.githubBranch || `feature/${m.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    });
    setStartWorkModalOpen(true);
  };

  const handleConfirmStartWork = async () => {
    try {
      await api.put(`/projects/${selectedProjectId}/milestones/${selectedMilestone.id}/status`, {
        status: 'IN_PROGRESS',
        assignedFreelancerId: startWorkData.assignedFreelancerId || user?.id,
        assignedFreelancerName: startWorkData.assignedFreelancerName || user?.fullName || 'Team Developer',
        githubBranch: startWorkData.githubBranch
      });
      toast.success('Work started on milestone!');
      setStartWorkModalOpen(false);
      fetchMilestones();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleConfirmSubmission = async () => {
    try {
      await api.put(`/projects/${selectedProjectId}/milestones/${selectedMilestone.id}/status`, {
        status: 'REVIEW_REQUESTED',
        submissionNote: submissionData.submissionNote,
        githubPrUrl: submissionData.githubPrUrl,
        githubBranch: submissionData.githubBranch
      });
      toast.success('Deliverables submitted for review!');
      setSubmissionModalOpen(false);
      fetchMilestones();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit deliverables');
    }
  };

  const handleSaveRepoUrl = async () => {
    try {
      await api.put(`/projects/${selectedProjectId}/github-repo`, {
        githubRepoUrl: githubRepoInput.trim()
      });
      toast.success('GitHub repository updated!');
      setRepoModalOpen(false);
      setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, githubRepoUrl: githubRepoInput.trim() } : p));
    } catch (err) {
      toast.error('Failed to update GitHub repository');
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

  const columns = [
    { id: 'TODO', title: 'To Do / Backlog', color: '#ef4444' },
    { id: 'IN_PROGRESS', title: 'In Progress (Active)', color: '#f59e0b' },
    { id: 'REVIEW_REQUESTED', title: 'Under Review', color: '#a855f7' },
    { id: 'DONE', title: 'Completed & Paid', color: '#10b981' }
  ];

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto', bgcolor: '#0D0A07', color: '#FFDBBB' }}>
      
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold' }}>
            Milestones & Team Workspace
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)', mt: 0.5 }}>
            Collaborate on sub-modules, synchronize GitHub code commits, and release milestone payouts.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            sx={{ 
              width: 220, 
              '& .MuiOutlinedInput-root': { color: '#FFDBBB', bgcolor: 'rgba(255,255,255,0.05)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#664930' }
            }}
          >
            {projects.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.title} {p.teamId ? '👥 (Team)' : ''}
              </MenuItem>
            ))}
          </TextField>

          {/* WhatsApp Style Live Team Chat Toggle */}
          <Tooltip title="Open Team Live Discussion (WhatsApp Style)">
            <Button
              variant="outlined"
              onClick={() => setChatOpen(true)}
              startIcon={<MessageSquare size={18} />}
              sx={{ 
                borderColor: '#25D366', 
                color: '#25D366', 
                fontWeight: 'bold',
                bgcolor: 'rgba(37,211,102,0.08)',
                '&:hover': { bgcolor: 'rgba(37,211,102,0.18)', borderColor: '#25D366' } 
              }}
            >
              Team Chat {messages.length > 0 ? `(${messages.length})` : ''}
            </Button>
          </Tooltip>

          {/* GitHub Repo Quick Button */}
          <Tooltip title={selectedProject?.githubRepoUrl ? "Open Project Repository" : "Link GitHub Repository"}>
            <Button
              variant="outlined"
              onClick={() => {
                if (selectedProject?.githubRepoUrl) {
                  window.open(selectedProject.githubRepoUrl, '_blank');
                } else {
                  setGithubRepoInput('');
                  setRepoModalOpen(true);
                }
              }}
              startIcon={<GithubIcon size={18} />}
              sx={{ 
                borderColor: '#997E67', 
                color: '#FFDBBB',
                bgcolor: 'rgba(255,255,255,0.05)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } 
              }}
            >
              {selectedProject?.githubRepoUrl ? 'GitHub Repo' : 'Link GitHub'}
            </Button>
          </Tooltip>

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

      {/* Team Collaboration Banner */}
      {selectedProject && (
        <Paper sx={{ 
          mb: 3, p: 2.5, 
          bgcolor: 'rgba(153, 126, 103, 0.08)', 
          border: '1px solid rgba(153, 126, 103, 0.25)', 
          borderRadius: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#997E67', width: 44, height: 44, color: '#0D0A07' }}>
              <Users size={24} />
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#FFDBBB' }}>
                  {selectedProject.teamName ? `Team: ${selectedProject.teamName}` : 'Development Team'}
                </Typography>
                <Chip 
                  size="small" 
                  label={selectedProject.teamId ? "Multi-Developer Team" : "Solo Project"} 
                  sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#34d399', fontWeight: 600 }} 
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.6)' }}>
                All team developers can coordinate, start sub-modules, and attach GitHub code branches.
              </Typography>
            </Box>
          </Box>

          {/* Team Members List */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {teamMembers.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#997E67' }}>Members ({teamMembers.length}):</Typography>
                <AvatarGroup max={5}>
                  {teamMembers.map((tm, idx) => (
                    <Tooltip key={tm.id || idx} title={`${tm.fullName || tm.email}`}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#664930', fontSize: 13 }}>
                        {(tm.fullName || tm.email || 'U')[0].toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </Box>
            )}

            {/* GitHub Repo indicator */}
            {selectedProject.githubRepoUrl && (
              <Chip
                icon={<GithubIcon size={14} color="#FFDBBB" />}
                label={selectedProject.githubRepoUrl.replace('https://github.com/', '')}
                component="a"
                href={selectedProject.githubRepoUrl}
                target="_blank"
                clickable
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.06)', 
                  color: '#FFDBBB', 
                  border: '1px solid rgba(153,126,103,0.3)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }
                }}
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Metrics Tracker */}
      {selectedProjectId && selectedProject && (
        <Paper sx={{ mb: 4, p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
          <Grid container spacing={3}>
            {(() => {
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
                      {p.durationDays ? `${p.durationDays} Days` : 'In Progress'}
                    </Typography>
                  </Grid>
                </>
              );
            })()}
          </Grid>
        </Paper>
      )}

      {/* Kanban Board Columns */}
      {projects.length === 0 ? (
        <Typography sx={{ color: '#997E67' }}>No active projects found.</Typography>
      ) : isProjectOpen ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
          <AlertCircle size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
          <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 1 }}>
            Project Not Yet Undertaken
          </Typography>
          <Typography sx={{ color: '#997E67' }}>
            Milestones and sub-tasks can only be managed after a team or freelancer has been hired.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ minHeight: '600px' }}>
          {columns.map(col => (
            <Grid item xs={12} md={3} key={col.id} sx={{ flex: 1, minWidth: 260 }}>
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
                  <Chip 
                    size="small" 
                    label={milestones.filter(m => m.status === col.id || (col.id === 'TODO' && m.status === 'PENDING_FREELANCER_APPROVAL')).length} 
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#FFDBBB' }} 
                  />
                </Box>

                <Stack spacing={2} sx={{ flexGrow: 1 }}>
                  <AnimatePresence>
                    {milestones.filter(m => m.status === col.id || (col.id === 'TODO' && m.status === 'PENDING_FREELANCER_APPROVAL')).map(m => (
                      <motion.div key={m.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                        <Paper sx={{ 
                          p: 2, 
                          bgcolor: 'rgba(13,10,7,0.85)', 
                          border: `1px solid ${m.feedback && m.status === 'IN_PROGRESS' ? '#ef4444' : 'rgba(153,126,103,0.3)'}`,
                          borderRadius: 2,
                          position: 'relative'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#FFDBBB', fontWeight: 'bold', mb: 1 }}>
                            {m.title}
                          </Typography>

                          {m.description && (
                            <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)', fontSize: '0.8rem', mb: 1.5 }}>
                              {m.description}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold' }}>
                              <DollarSign size={13}/> {m.amount}
                            </Typography>
                            {m.dueDate && (
                              <Typography variant="caption" sx={{ color: '#997E67', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Calendar size={12}/> {new Date(m.dueDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>

                          {/* Team Assignee Tag */}
                          {m.assignedFreelancerName && (
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip 
                                size="small"
                                icon={<Users size={12} color="#FFDBBB" />}
                                label={`Assigned: ${m.assignedFreelancerName}`}
                                sx={{ bgcolor: 'rgba(153,126,103,0.15)', color: '#FFDBBB', fontSize: '0.72rem' }}
                              />
                            </Box>
                          )}

                          {/* GitHub Branch Tag */}
                          {m.githubBranch && (
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip 
                                size="small"
                                icon={<GitBranch size={12} color="#60a5fa" />}
                                label={m.githubBranch}
                                sx={{ bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', fontSize: '0.72rem' }}
                              />
                            </Box>
                          )}

                          {/* GitHub PR URL if submitted */}
                          {m.githubPrUrl && (
                            <Box sx={{ mb: 1.5 }}>
                              <Button
                                size="small"
                                variant="text"
                                component="a"
                                href={m.githubPrUrl}
                                target="_blank"
                                startIcon={<ExternalLink size={12} />}
                                sx={{ color: '#a855f7', p: 0, textTransform: 'none', fontSize: '0.75rem', '&:hover': { textDecoration: 'underline' } }}
                              >
                                View GitHub PR / Code
                              </Button>
                            </Box>
                          )}

                          {m.feedback && m.status === 'IN_PROGRESS' && (
                            <Box sx={{ bgcolor: 'rgba(239,68,68,0.1)', p: 1, borderRadius: 1, mb: 1 }}>
                              <Typography variant="caption" sx={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AlertCircle size={12}/> Revision: {m.feedback}
                              </Typography>
                            </Box>
                          )}

                          <Divider sx={{ borderColor: 'rgba(153,126,103,0.2)', my: 1.5 }} />
                          
                          {/* Pending Approval Extra Milestones */}
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

                          {/* Freelancer & Team Actions: Anyone in the team can start work or submit */}
                          {isFreelancer && m.status === 'TODO' && (
                            <Button 
                              size="small" 
                              fullWidth 
                              variant="outlined"
                              onClick={() => openStartWorkModal(m)} 
                              sx={{ borderColor: '#60a5fa', color: '#60a5fa', '&:hover': { bgcolor: 'rgba(96,165,250,0.1)' } }}
                            >
                              Start Work / Claim
                            </Button>
                          )}

                          {isFreelancer && m.status === 'IN_PROGRESS' && (
                            <Button 
                              size="small" 
                              fullWidth 
                              variant="contained"
                              onClick={() => { 
                                setSelectedMilestone(m); 
                                setSubmissionData({
                                  submissionNote: m.submissionNote || '',
                                  githubPrUrl: m.githubPrUrl || '',
                                  githubBranch: m.githubBranch || ''
                                });
                                setSubmissionModalOpen(true); 
                              }} 
                              sx={{ bgcolor: '#a855f7', color: 'white', '&:hover': { bgcolor: '#9333ea' } }}
                            >
                              Submit for Review (PR)
                            </Button>
                          )}
                          
                          {/* Client Actions */}
                          {isClient && m.status === 'REVIEW_REQUESTED' && (
                            <Button size="small" fullWidth variant="contained" 
                              onClick={() => { setSelectedMilestone(m); setReviewModalOpen(true); }} 
                              sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 'bold', '&:hover': { bgcolor: '#059669' } }}>
                              Review & Pay
                            </Button>
                          )}

                          {m.status === 'DONE' && (
                            <Typography variant="caption" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', fontWeight: 'bold' }}>
                              <CheckCircle2 size={14}/> Completed & Paid
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

      {/* ── Start Work / Claim Milestone Modal ── */}
      <Modal open={startWorkModalOpen} onClose={() => setStartWorkModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 420, bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, p: 4, boxShadow: 24,
        }}>
          <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GitBranch size={20} color="#60a5fa" /> Start Milestone Sub-Work
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)', mb: 3 }}>
            Claim this task for yourself or assign it to a teammate, and set up your GitHub feature branch.
          </Typography>

          <Stack spacing={2.5}>
            {/* Team Member Assignee Selector */}
            {teamMembers.length > 0 ? (
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#997E67' }}>Assign To Team Member</InputLabel>
                <Select
                  value={startWorkData.assignedFreelancerId}
                  label="Assign To Team Member"
                  onChange={(e) => {
                    const memberId = e.target.value;
                    const found = teamMembers.find(tm => tm.id === memberId);
                    setStartWorkData({
                      ...startWorkData,
                      assignedFreelancerId: memberId,
                      assignedFreelancerName: found ? (found.fullName || found.email) : 'Team Developer'
                    });
                  }}
                  sx={{ color: '#FFDBBB', bgcolor: 'rgba(255,255,255,0.05)', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#664930' } }}
                >
                  {teamMembers.map(tm => (
                    <MenuItem key={tm.id} value={tm.id}>
                      {tm.fullName || tm.email} {tm.id === user?.id ? '(Me)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField 
                label="Assignee Name" 
                size="small"
                variant="outlined" 
                value={startWorkData.assignedFreelancerName}
                onChange={e => setStartWorkData({ ...startWorkData, assignedFreelancerName: e.target.value })}
                sx={{ input: { color: '#E0E0E0' }, label: { color: '#997E67' } }} 
              />
            )}

            {/* GitHub Branch */}
            <TextField 
              label="GitHub Feature Branch (Optional)" 
              placeholder="e.g. feature/login-module" 
              size="small"
              variant="outlined" 
              value={startWorkData.githubBranch}
              onChange={e => setStartWorkData({ ...startWorkData, githubBranch: e.target.value })}
              sx={{ input: { color: '#E0E0E0' }, label: { color: '#997E67' } }} 
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button onClick={() => setStartWorkModalOpen(false)} sx={{ color: '#997E67' }}>Cancel</Button>
              <Button variant="contained" onClick={handleConfirmStartWork} sx={{ bgcolor: '#60a5fa', color: '#0D0A07', fontWeight: 'bold', '&:hover': { bgcolor: '#93c5fd' } }}>
                Start Work
              </Button>
            </Box>
          </Stack>
        </Box>
      </Modal>

      {/* ── Submit for Review Modal (With GitHub PR & Deliverables) ── */}
      <Modal open={submissionModalOpen} onClose={() => setSubmissionModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 440, bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, p: 4, boxShadow: 24,
        }}>
          <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GithubIcon size={20} color="#a855f7" /> Submit Milestone Deliverables
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)', mb: 3 }}>
            {selectedMilestone?.title}
          </Typography>

          <Stack spacing={2.5}>
            <TextField 
              label="GitHub Pull Request / Commit URL" 
              placeholder="https://github.com/myorg/myrepo/pull/12"
              variant="outlined" 
              size="small"
              value={submissionData.githubPrUrl} 
              onChange={e => setSubmissionData({ ...submissionData, githubPrUrl: e.target.value })} 
              sx={{ input: { color: '#E0E0E0' }, label: { color: '#997E67' } }} 
            />

            <TextField 
              label="GitHub Branch Name" 
              placeholder="e.g. main or feature/login-module"
              variant="outlined" 
              size="small"
              value={submissionData.githubBranch} 
              onChange={e => setSubmissionData({ ...submissionData, githubBranch: e.target.value })} 
              sx={{ input: { color: '#E0E0E0' }, label: { color: '#997E67' } }} 
            />

            <TextField 
              label="Deliverables Notes / Summary" 
              multiline rows={3} variant="outlined" 
              placeholder="Explain the work done, testing instructions, or deploy links..."
              value={submissionData.submissionNote} 
              onChange={e => setSubmissionData({ ...submissionData, submissionNote: e.target.value })} 
              sx={{ textarea: { color: '#E0E0E0' }, label: { color: '#997E67' } }} 
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button onClick={() => setSubmissionModalOpen(false)} sx={{ color: '#997E67' }}>Cancel</Button>
              <Button variant="contained" color="success" onClick={handleConfirmSubmission}>
                Submit to Client
              </Button>
            </Box>
          </Stack>
        </Box>
      </Modal>

      {/* ── Link Project GitHub Repository Modal ── */}
      <Modal open={repoModalOpen} onClose={() => setRepoModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 420, bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, p: 4, boxShadow: 24,
        }}>
          <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GithubIcon size={20} /> Link Team GitHub Repository
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)', mb: 3 }}>
            Connect a GitHub repository for all developers in this team to push code and open pull requests.
          </Typography>
          <TextField 
            fullWidth
            label="GitHub Repository URL" 
            placeholder="https://github.com/organization/repo"
            variant="outlined" 
            value={githubRepoInput} 
            onChange={e => setGithubRepoInput(e.target.value)} 
            sx={{ input: { color: '#E0E0E0' }, label: { color: '#997E67' }, mb: 3 }} 
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setRepoModalOpen(false)} sx={{ color: '#997E67' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveRepoUrl} sx={{ bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold' }}>
              Save Repository
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ── WhatsApp Style Live Team Discussion Drawer ── */}
      <Drawer
        anchor="right"
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            bgcolor: '#0B0E11',
            borderLeft: '1px solid #202c33',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* WhatsApp Header */}
        <Box sx={{ p: 2, bgcolor: '#202c33', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#25D366', width: 40, height: 40, color: '#0B0E11' }}>
              <Users size={20} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#E9EDEF', fontWeight: 'bold', lineHeight: 1.2 }}>
                {selectedProject?.teamName || selectedProject?.title || 'Team Chat'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#25D366' }}>
                ● Project Group ({teamMembers.length || 'Team'} members)
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setChatOpen(false)} sx={{ color: '#aebac1' }}>
            <X size={20} />
          </IconButton>
        </Box>

        {/* Message Feed */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 2, 
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 8, color: '#8696a0' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <Typography variant="body2">No messages in this team group yet.</Typography>
              <Typography variant="caption">Start coordinating tasks and sharing code updates!</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {messages.map((msg, idx) => {
                const isMe = msg.sender?.id === user?.id || msg.sender?.email === user?.email;
                return (
                  <Box 
                    key={msg.id || idx}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {!isMe && (
                      <Typography variant="caption" sx={{ color: '#25D366', fontSize: '0.7rem', ml: 1, mb: 0.2 }}>
                        {msg.sender?.fullName || msg.sender?.email || 'Teammate'}
                      </Typography>
                    )}
                    <Box sx={{
                      maxWidth: '82%',
                      p: 1.2,
                      px: 1.8,
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      bgcolor: isMe ? '#005c4b' : '#202c33',
                      color: '#e9edef',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}>
                      <Typography variant="body2" sx={{ fontSize: '0.88rem', wordBreak: 'break-word' }}>
                        {msg.content}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', display: 'block', textAlign: 'right', mt: 0.5 }}>
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
              <div ref={chatBottomRef} />
            </Stack>
          )}
        </Box>

        {/* WhatsApp Message Input */}
        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 1.5, bgcolor: '#202c33', display: 'flex', gap: 1 }}>
          <TextField 
            fullWidth
            size="small"
            placeholder="Type a message or GitHub link..."
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#2a3942',
                color: '#e9edef',
                borderRadius: 4,
                '& fieldset': { border: 'none' }
              }
            }}
          />
          <IconButton type="submit" sx={{ bgcolor: '#00a884', color: '#fff', '&:hover': { bgcolor: '#008f6f' } }}>
            <Send size={18} />
          </IconButton>
        </Box>
      </Drawer>

      {/* ── Client Review & Pay Modal ── */}
      <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 420, bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, p: 4, boxShadow: 24,
        }}>
          <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 2 }}>Review Milestone Deliverables</Typography>
          <Typography variant="body2" sx={{ color: '#E0E0E0', mb: 2 }}>
            {selectedMilestone?.title} - <strong style={{color:'#10b981'}}>${selectedMilestone?.amount}</strong>
          </Typography>

          {/* GitHub PR link if attached */}
          {selectedMilestone?.githubPrUrl && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#c084fc', display: 'block', mb: 0.5, fontWeight: 'bold' }}>
                GitHub Pull Request / Code Deliverable:
              </Typography>
              <Button
                size="small"
                variant="outlined"
                component="a"
                href={selectedMilestone.githubPrUrl}
                target="_blank"
                startIcon={<ExternalLink size={14} />}
                sx={{ color: '#c084fc', borderColor: '#c084fc', textTransform: 'none' }}
              >
                Inspect Code on GitHub
              </Button>
            </Box>
          )}
          
          {selectedMilestone?.submissionNote && (
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1, mb: 3 }}>
              <Typography variant="caption" sx={{ color: '#997E67' }}>Freelancer / Team Notes:</Typography>
              <Typography variant="body2" sx={{ color: '#FFDBBB', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {selectedMilestone.submissionNote}
              </Typography>
            </Box>
          )}

          <Stack spacing={2.5}>
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
      </Modal>

      {/* ── Add New Milestone Modal ── */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
      </Modal>

    </Box>
  );
}
