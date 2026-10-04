import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Button, Tabs, Tab, Card, CardContent, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio,
  IconButton, Tooltip, Grid, LinearProgress, Rating, Snackbar, Alert
} from '@mui/material';
import {
  PlusCircle, Sparkles, Trash2, CheckCircle2, Search,
  Star, Briefcase, Clock, Users, X, Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import api from '../../api/api';

const themeStyles = {
  bg: '#0D0A07',
  primary: '#997E67',
  cream: '#FFDBBB',
  brown: '#664930',
  glass: {
    background: 'rgba(255, 219, 187, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(153, 126, 103, 0.2)',
    borderRadius: '16px',
  }
};

// Freelancer data fetched from real API


const MOCK_BIDS = {
  1: [
    { id: 201, freelancerId: 101, name: 'Alex Johnson', amount: '$4,500', coverLetter: 'I have built 3 similar AI chatbots using Python and GPT-4.', rating: 4.9 },
    { id: 202, freelancerId: 103, name: 'Sarah Lee', amount: '$5,200', coverLetter: 'NLP specialist with 5 years experience.', rating: 4.7 }
  ]
};

const getStatusColor = (status) => {
  const map = {
    'OPEN': 'primary',
    'BIDDING': 'secondary',
    'IN_PROGRESS': 'warning',
    'COMPLETED': 'success',
    'CANCELLED': 'error'
  };
  return map[status] || 'default';
};

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState([]);
  
  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postStep, setPostStep] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Post Project State
  const [newProject, setNewProject] = useState({
    title: '', category: '', budgetType: 'Fixed', budgetAmount: '',
    deadline: '', description: '', skillsRequired: '', projectType: 'Individual', teamSize: 2
  });

  // UI State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Review approval states
  const [revisionModal, setRevisionModal] = useState({ open: false, project: null });
  const [revisionNote, setRevisionNote] = useState('');

  const { user } = useAuth();
  const [projectBids, setProjectBids] = useState({});
  const [aiMatches, setAiMatches] = useState({});
  const [freelancers, setFreelancers] = useState([]);
  const [freelancerSearch, setFreelancerSearch] = useState('');
  const [reviewRating, setReviewRating] = useState(4);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewProject, setReviewProject] = useState(null);
  const [reviewedProjects, setReviewedProjects] = useState([]);
  const [escrowModal, setEscrowModal] = useState({ open: false, project: null, bid: null });
  const [escrowLoading, setEscrowLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 0 || activeTab === 2) fetchProjects();
  }, [activeTab]);

  // Pure frontend AI matching - runs whenever projects or freelancers change
  useEffect(() => {
    if (activeTab !== 2) return;
    if (projects.length === 0) return;

            const computeMatches = async () => {
      const matchesMap = {};
      const openProjs = projects.filter(p => p.status === 'OPEN');
      for (const project of openProjs) {
        try {
          console.log("Fetching matches for project:", project.id);
          const res = await api.get('/projects/' + project.id + '/ai-matches');
          console.log("Response for project", project.id, ":", res.data);
          if (res.data && res.data.matches) {
            matchesMap[project.id] = res.data.matches.map(m => ({
              freelancer_id: m.freelancer_id,
              freelancer_name: m.freelancer_name || ('Freelancer #' + m.freelancer_id),
              score: m.match_score || m.score,
              reason: Array.isArray(m.match_reasoning) ? m.match_reasoning.join(' ') : (m.match_reasoning || m.reason || 'AI Matched')
            }));
          } else {
             matchesMap[project.id] = [];
          }
        } catch (e) {
          console.error('Failed to get AI matches for project', project.id, e.response?.data || e.message);
          matchesMap[project.id] = [];
        }
      }
      console.log("Final matchesMap:", matchesMap);
      setAiMatches(matchesMap);
    };

    computeMatches();
  }, [activeTab, projects]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/mine');
      setProjects(res.data);
      const openProjs = res.data.filter(p => ['OPEN', 'BIDDING', 'IN_PROGRESS'].includes(p.status));
      const bidsMap = {};
      for (const p of openProjs) {
        try {
          const bidRes = await api.get(`/projects/${p.id}/applications`);
          bidsMap[p.id] = bidRes.data;
        } catch(e) {}
      }
      setProjectBids(bidsMap);

      // Fetch reviews given to know which projects are already reviewed
      try {
        const reviewsRes = await api.get('/projects/reviews/given');
        const given = reviewsRes.data || [];
        setReviewedProjects(given.map(r => r.projectId));
      } catch (e) {
        console.warn('Could not fetch reviews given', e);
      }
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Failed to load projects or bids', severity: 'error' });
    }
  };

  const fetchFreelancers = async () => {
    try {
      const res = await api.get('/freelancers');
      setFreelancers(res.data);
    } catch (err) {
      console.error('Failed to load freelancers', err);
    }
  };

  useEffect(() => { if (activeTab === 1) fetchFreelancers(); }, [activeTab]);

  const handleAiInvite = async (projectId, match) => {
    try {
      await api.post(`/projects/${projectId}/invite`, { freelancerId: match.freelancer_id });
      setToast({ open: true, message: `Invitation sent to ${match.freelancer_name || 'Freelancer'}!`, severity: 'success' });
    } catch (err) {
      setToast({ open: true, message: 'Failed to send invitation.', severity: 'error' });
    }
  };

  const handlePostProject = async () => {
    try {
      let bMin = 0;
      let bMax = 0;
      if (newProject.budgetAmount) {
        const parts = newProject.budgetAmount.replace(/[^0-9-]/g, '').split('-');
        bMin = parseFloat(parts[0]) || 0;
        bMax = parts.length > 1 ? (parseFloat(parts[1]) || 0) : bMin;
      }

      let diffDays = 30;
      let dueDateIso = null;
      if (newProject.deadline) {
        const d1 = new Date();
        const d2 = new Date(newProject.deadline);
        const diffTime = d2.getTime() - d1.getTime();
        diffDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 30;
        dueDateIso = d2.toISOString();
      }

      await api.post('/projects', {
        title: newProject.title,
        description: newProject.description,
        budgetMin: bMin,
        budgetMax: bMax,
        skillsRequired: newProject.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
        durationDays: diffDays,
        dueDate: dueDateIso,
        projectType: newProject.projectType.toUpperCase(),
        teamSize: newProject.projectType === 'Team' ? parseInt(newProject.teamSize) : null
      });
      
      setIsPostModalOpen(false);
      setPostStep(1);
      setNewProject({title: '', category: '', budgetType: 'Fixed', budgetAmount: '', deadline: '', description: '', skillsRequired: '', projectType: 'Individual', teamSize: 2});
      setToast({ open: true, message: 'Project posted successfully! AI has started matchmaking.', severity: 'success' });
      fetchProjects();
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Failed to post project', severity: 'error' });
    }
  };

  const handleDeleteProject = async (id, status) => {
    if (status !== 'OPEN') {
      alert('Cancel within 48 hours. Use AI Assistant or email to cancel.');
      return;
    }
    try {
      await api.post(`/projects/${id}/cancel`);
      setToast({ open: true, message: 'Project deleted.', severity: 'info' });
      fetchProjects();
    } catch (err) {
      setToast({ open: true, message: 'Failed to delete project', severity: 'error' });
    }
  };

  const handleAcceptBid = async (projectId, freelancerId) => {
    try {
      await api.post(`/projects/${projectId}/hire/${freelancerId}`);
      setToast({ open: true, message: 'Bid accepted! Project is now in progress.', severity: 'success' });
      fetchProjects();
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Failed to accept bid', severity: 'error' });
    }
  };

  const handleEscrowPay = async () => {
    if (!escrowModal.project || !escrowModal.bid) return;
    setEscrowLoading(true);
    try {
      const payeeId = escrowModal.bid.freelancer?.id || escrowModal.bid.freelancerId;
      const amount = escrowModal.bid.proposedAmount || escrowModal.project.budgetMin || 100;
      const res = await api.post('/payments/stripe/checkout', {
        projectId: escrowModal.project.id,
        payeeId: payeeId,
        amount: parseFloat(amount)
      });
      if (res.data.checkoutUrl && res.data.checkoutUrl !== 'STRIPE_DEMO_MODE') {
        window.location.href = res.data.checkoutUrl;
      } else {
        // Demo mode - simulate success
        setEscrowModal({ open: false, project: null, bid: null });
        
        // NOW ACTUALLY HIRE THE FREELANCER
        await api.post(`/projects/${escrowModal.project.id}/hire/${payeeId}`);
        fetchProjects(); // Refresh the UI state
        
        setToast({ open: true, message: '\u{1F4B3} Demo Mode: Escrow payment simulated and bid accepted! Project is now In Progress.', severity: 'success' });
      }
    } catch (err) {
      console.error('Escrow payment failed:', err);
      setToast({ open: true, message: 'Payment failed: ' + (err?.response?.data?.error || err.message), severity: 'error' });
    }
    setEscrowLoading(false);
  };

  const handleRejectBid = async (projectId, freelancerId) => {
    try {
      await api.post(`/projects/${projectId}/reject/${freelancerId}`);
      setToast({ open: true, message: 'Bid rejected.', severity: 'info' });
      fetchProjects();
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Failed to reject bid', severity: 'error' });
    }
  };

  const handleApproveCompletion = async (projectId) => {
    try {
      await api.post(`/projects/${projectId}/approve-completion`);
      setToast({ open: true, message: '🎉 Project approved & marked complete! Revenue has been recorded.', severity: 'success' });
      fetchProjects();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Failed to approve', severity: 'error' });
    }
  };

  const handleRequestRevision = async () => {
    const project = revisionModal.project;
    if (!project) return;
    try {
      await api.post(`/projects/${project.id}/request-revision`, { note: revisionNote || 'Please review and resubmit.' });
      setToast({ open: true, message: 'Revision requested. Freelancer has been notified.', severity: 'info' });
      setRevisionModal({ open: false, project: null });
      setRevisionNote('');
      fetchProjects();
    } catch (err) {
      setToast({ open: true, message: 'Failed to request revision', severity: 'error' });
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewProject) return;
    try {
      await api.post(`/projects/${reviewProject.id}/reviews`, {
        revieweeId: reviewProject.hiredFreelancerId,
        rating: reviewRating,
        comment: reviewComment
      });
      const updated = [...reviewedProjects, reviewProject.id];
      setReviewedProjects(updated);
      setIsReviewModalOpen(false);
      setReviewComment('');
      setReviewRating(4);
      setReviewProject(null);
      setToast({ open: true, message: 'Review submitted! AI has analyzed your feedback.', severity: 'success' });
    } catch (err) {
      console.error('Failed to submit review:', err);
      setToast({ open: true, message: err.response?.data?.message || 'Failed to submit review to server.', severity: 'error' });
    }
  };

  const totalPendingBids = Object.values(projectBids).flat().filter(b => b?.status === 'PENDING' || !b?.status).length;

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: themeStyles.bg, color: themeStyles.cream }}>
      {/* SECTION A: Welcome + AI greeting */}
      <Box sx={{ mb: 4, ...themeStyles.glass, p: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: themeStyles.cream }}>
          Welcome back, {user.fullName.split(' ')[0]}!
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: themeStyles.primary }}>
          <Sparkles size={20} />
          <Typography variant="subtitle1">
            AI Insight: You have {projects.filter(p => p.status === 'IN_PROGRESS').length} active projects and {totalPendingBids} bids waiting for review.
          </Typography>
        </Box>
      </Box>

      {/* SECTION B: Post Project Button */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          startIcon={<PlusCircle />}
          onClick={() => setIsPostModalOpen(true)}
          sx={{ bgcolor: themeStyles.primary, color: themeStyles.bg, '&:hover': { bgcolor: themeStyles.cream } }}
        >
          Post New Project
        </Button>
      </Box>

      <Tabs 
        value={activeTab} 
        onChange={(e, v) => setActiveTab(v)} 
        sx={{ 
          mb: 4, 
          '& .MuiTab-root': { color: themeStyles.primary },
          '& .Mui-selected': { color: `${themeStyles.cream} !important` },
          '& .MuiTabs-indicator': { bgcolor: themeStyles.cream }
        }}
      >
        <Tab label="My Projects" />
        <Tab label="Browse Freelancers" />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Review Bids
              {totalPendingBids > 0 && (
                <Chip 
                  label={totalPendingBids} 
                  size="small" 
                  sx={{ 
                    height: 18, 
                    fontSize: '0.7rem', 
                    bgcolor: themeStyles.primary, 
                    color: themeStyles.bg,
                    fontWeight: 'bold' 
                  }} 
                />
              )}
            </Box>
          } 
        />
        <Tab label="Feedback" />
      </Tabs>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* SECTION C: My Projects */}
          {activeTab === 0 && (
            <Box>
              {/* UNDER REVIEW ALERT BANNER */}
              {projects.filter(p => p.status === 'UNDER_REVIEW').length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Box sx={{ p: 2.5, mb: 3, bgcolor: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.4)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ color: '#2196f3', fontSize: '1.2rem' }}>👀</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#2196f3', fontWeight: 'bold' }}>Work Submitted for Your Review!</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.8)' }}>
                        {projects.filter(p => p.status === 'UNDER_REVIEW').length} project(s) are awaiting your approval. Review the work and approve or request revisions.
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              )}

              <Grid container spacing={3}>
                {projects.map((project) => {
                  const isUnderReview = project.status === 'UNDER_REVIEW';
                  return (
                    <Grid item xs={12} md={6} lg={4} key={project.id}>
                      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                        <Card sx={{ ...themeStyles.glass, color: themeStyles.cream, border: isUnderReview ? '1px solid rgba(33,150,243,0.5)' : 'inherit' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>{project.title}</Typography>
                              <Chip
                                label={project.status.replace('_', ' ')}
                                size="small"
                                sx={{
                                  bgcolor: isUnderReview ? 'rgba(33,150,243,0.15)' : project.status === 'COMPLETED' ? 'rgba(76,175,80,0.15)' : project.status === 'IN_PROGRESS' ? 'rgba(255,152,0,0.15)' : 'rgba(153,126,103,0.15)',
                                  color: isUnderReview ? '#2196f3' : project.status === 'COMPLETED' ? '#4caf50' : project.status === 'IN_PROGRESS' ? '#ff9800' : themeStyles.cream,
                                  fontWeight: 'bold',
                                  border: `1px solid ${isUnderReview ? '#2196f3' : project.status === 'COMPLETED' ? '#4caf50' : project.status === 'IN_PROGRESS' ? '#ff9800' : themeStyles.brown}`
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ color: themeStyles.primary, mb: 1 }}>
                              <Briefcase size={16} style={{ verticalAlign: 'middle', marginRight: 8 }}/>
                              Budget: ${project.budgetMin} - ${project.budgetMax} ({project.projectType})
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeStyles.primary, mb: 2 }}>
                              <Clock size={16} style={{ verticalAlign: 'middle', marginRight: 8 }}/>
                              Duration: {project.durationDays} days
                            </Typography>

                            {/* Submission note from freelancer */}
                            {isUnderReview && project.submissionNote && (
                              <Box sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(33,150,243,0.06)', borderRadius: 1.5, border: '1px solid rgba(33,150,243,0.2)' }}>
                                <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 'bold', display: 'block', mb: 0.5 }}>📤 Freelancer Delivery Note:</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{project.submissionNote}</Typography>
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              {isUnderReview ? (
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: '100%' }}>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<CheckCircle2 size={14} />}
                                    onClick={() => handleApproveCompletion(project.id)}
                                    sx={{ bgcolor: '#4caf50', color: '#fff', '&:hover': { bgcolor: '#43a047' }, flex: 1 }}
                                  >
                                    Approve & Complete
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => { setRevisionModal({ open: true, project }); }}
                                    sx={{ color: '#ff9800', borderColor: '#ff9800', '&:hover': { borderColor: '#ff9800', bgcolor: 'rgba(255,152,0,0.1)' }, flex: 1 }}
                                  >
                                    Request Revision
                                  </Button>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                  <Typography variant="body2">{projectBids[project.id]?.length || 0} Bids received</Typography>
                                  {project.status === 'OPEN' && (
                                    <IconButton onClick={() => handleDeleteProject(project.id, project.status)} sx={{ color: themeStyles.primary }}>
                                      <Trash2 size={20} />
                                    </IconButton>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* SECTION D: Browse Freelancers */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Search size={20} color="#997E67" />
                <input
                  placeholder="Search by name or skill..."
                  value={freelancerSearch}
                  onChange={e => setFreelancerSearch(e.target.value)}
                  style={{ background: 'rgba(255,219,187,0.05)', border: '1px solid rgba(153,126,103,0.3)', borderRadius: 8, padding: '10px 16px', color: '#FFDBBB', flex: 1, outline: 'none', fontSize: '0.95rem' }}
                />
              </Box>
              {freelancers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, ...themeStyles.glass, borderRadius: 3 }}>
                  <Typography variant="h2" sx={{ mb: 2 }}>👤</Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>Loading freelancers...</Typography>
                  <Typography variant="body2" sx={{ color: themeStyles.primary }}>Connecting to TeamLance network</Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {freelancers
                    .filter(f => {
                      const q = freelancerSearch.toLowerCase();
                      return !q || 
                        (f.user?.fullName || '').toLowerCase().includes(q) ||
                        (f.headline || '').toLowerCase().includes(q) ||
                        (f.skills || []).some(s => s.toLowerCase().includes(q));
                    })
                    .map((freelancer) => {
                      const name = freelancer.user?.fullName || freelancer.user?.email || 'Freelancer';
                      const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                      return (
                        <Grid item xs={12} sm={6} md={4} key={freelancer.id}>
                          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                            <Card sx={{ ...themeStyles.glass, color: themeStyles.cream, textAlign: 'center', p: 2, cursor: 'pointer' }}>
                              <Avatar sx={{ width: 72, height: 72, mx: 'auto', mb: 2, bgcolor: themeStyles.brown, color: themeStyles.cream, fontWeight: 'bold', fontSize: '1.5rem', border: `2px solid ${themeStyles.primary}` }}>
                                {initials}
                              </Avatar>
                              <Typography variant="h6" sx={{ mb: 0.5 }}>{name}</Typography>
                              <Typography variant="body2" sx={{ color: themeStyles.primary, mb: 2 }}>{freelancer.headline || 'Freelancer'}</Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                {(freelancer.skills || []).slice(0,4).map(s => <Chip key={s} label={s} size="small" sx={{ color: themeStyles.cream, borderColor: themeStyles.primary, fontSize: '0.7rem' }} variant="outlined" />)}
                              </Box>
                              <Typography variant="h6" sx={{ color: themeStyles.primary }}>
                                {freelancer.hourlyRate ? `$${freelancer.hourlyRate}/hr` : 'Negotiable'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.5)', display: 'block', mt: 0.5 }}>
                                {freelancer.availability || 'Available'}
                              </Typography>
                            </Card>
                          </motion.div>
                        </Grid>
                      );
                    })}
                </Grid>
              )}
            </Box>
          )}

          {/* SECTION F: Project Bids */}
          {activeTab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {projects.filter(p => ['OPEN', 'BIDDING', 'IN_PROGRESS'].includes(p.status)).map(project => {
                const bids = projectBids[project.id] || [];
                const visibleBids = bids.filter(b => b.status !== 'REJECTED');

                return (
                  <Box key={project.id} sx={{ ...themeStyles.glass, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '1px solid rgba(153, 126, 103, 0.2)' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: themeStyles.cream }}>
                        Bids for: {project.title}
                      </Typography>
                      <Chip 
                        label={project.status} 
                        color={getStatusColor(project.status)} 
                        size="small" 
                      />
                    </Box>

                    {visibleBids.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {visibleBids.map(bid => {
                          const freelancerName = bid.freelancer?.fullName || bid.freelancer?.email || 'Unknown Freelancer';
                          const initials = freelancerName
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase();
                          const isTeam = bid.freelancer?.isTeam || bid.freelancer?.type === 'TEAM' || bid.team;
                          const isAccepted = bid.status === 'ACCEPTED';

                          return (
                            <Card 
                              key={bid.id} 
                              sx={{ 
                                bgcolor: 'rgba(13, 10, 7, 0.6)', 
                                border: `1px solid ${isAccepted ? '#4caf50' : themeStyles.primary}`, 
                                borderRadius: '12px',
                                p: 2.5,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                  boxShadow: '0 4px 20px rgba(153, 126, 103, 0.15)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                {/* Left: Avatar + Details */}
                                <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: '280px' }}>
                                  <Avatar 
                                    src={bid.freelancer?.avatar} 
                                    sx={{ 
                                      width: 48, 
                                      height: 48, 
                                      bgcolor: themeStyles.brown, 
                                      color: themeStyles.cream, 
                                      fontWeight: 'bold',
                                      border: `1px solid ${themeStyles.primary}`
                                    }}
                                  >
                                    {initials}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: themeStyles.cream }}>
                                        {freelancerName}
                                      </Typography>
                                      <Chip 
                                        label={isTeam ? 'Team' : 'Individual'} 
                                        size="small" 
                                        sx={{ 
                                          height: 20, 
                                          fontSize: '0.7rem', 
                                          bgcolor: isTeam ? themeStyles.brown : 'rgba(153, 126, 103, 0.2)', 
                                          color: themeStyles.cream,
                                          border: `1px solid ${themeStyles.primary}`
                                        }} 
                                      />
                                      {bid.freelancer?.email && bid.freelancer?.fullName && (
                                        <Typography variant="caption" sx={{ color: themeStyles.primary }}>
                                          ({bid.freelancer.email})
                                        </Typography>
                                      )}
                                    </Box>

                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        mt: 1.5, 
                                        color: themeStyles.cream, 
                                        fontStyle: 'italic', 
                                        bgcolor: 'rgba(255, 219, 187, 0.03)', 
                                        p: 1.5, 
                                        borderRadius: '8px',
                                        borderLeft: `3px solid ${themeStyles.primary}`
                                      }}
                                    >
                                      "{bid.coverLetter || bid.proposal || 'No cover letter provided.'}"
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Right: Amount + Actions */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 1.5, minWidth: '140px' }}>
                                  <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                    <Typography variant="caption" sx={{ color: themeStyles.primary, display: 'block' }}>
                                      Proposed Bid
                                    </Typography>
                                    <Typography 
                                      variant="h5" 
                                      sx={{ 
                                        fontWeight: 'bold', 
                                        background: 'linear-gradient(135deg, #FFDBBB 0%, #997E67 100%)', 
                                        WebkitBackgroundClip: 'text', 
                                        WebkitTextFillColor: 'transparent' 
                                      }}
                                    >
                                      ${(bid.proposedAmount ?? bid.amount ?? 0).toLocaleString()}
                                    </Typography>
                                  </Box>

                                  {isAccepted ? (
                                    <Chip label="Accepted" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                                  ) : (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Button 
                                        variant="contained" 
                                        size="small" 
                                        startIcon={<CheckCircle2 size={16} />}
                                        sx={{ bgcolor: themeStyles.primary, color: themeStyles.bg, '&:hover': { bgcolor: themeStyles.cream } }} 
                                        onClick={() => setEscrowModal({ open: true, project, bid })}
                                      >
                                        Accept & Pay Escrow
                                      </Button>
                                      <Button 
                                        variant="outlined" 
                                        size="small" 
                                        sx={{ color: themeStyles.cream, borderColor: themeStyles.primary, '&:hover': { borderColor: themeStyles.cream } }} 
                                        onClick={() => handleRejectBid(project.id, bid.freelancer?.id || bid.freelancerId)}
                                      >
                                        Reject
                                      </Button>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </Card>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: themeStyles.primary, fontStyle: 'italic' }}>
                        No pending or accepted bids yet.
                      </Typography>
                    )}

                    {project.status === 'OPEN' && (
                      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <Typography variant="h6" sx={{ color: '#10b981', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Star size={20} /> AI Recommended Freelancers
                        </Typography>
                        {aiMatches[project.id] && aiMatches[project.id].length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {aiMatches[project.id].map(match => (
                              <Box key={match.freelancer_id} sx={{ bgcolor: 'rgba(16, 185, 129, 0.05)', p: 2, borderRadius: 2, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Box>
                                    <Typography sx={{ fontWeight: 'bold', color: '#fff' }}>
                                      {match.freelancer_name || `Freelancer #${match.freelancer_id}`}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>Match Score: {match.score}%</Typography>
                                  </Box>
                                    <Button size="small" variant="outlined" sx={{ color: '#10b981', borderColor: '#10b981' }} onClick={() => handleAiInvite(project.id, match)}>Invite</Button>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#d1d5db' }}>{match.reason}</Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : aiMatches[project.id] !== undefined ? ( <Typography variant="body2" sx={{ color: '#d1d5db', fontStyle: 'italic' }}>No exact matches found yet. Try inviting freelancers manually.</Typography> ) : ( <Typography variant="body2" sx={{ color: '#d1d5db', fontStyle: 'italic' }}>Loading AI recommendations...</Typography> )}
                      </Box>
                    )}

                    </Box>
                );
              })}
              {projects.filter(p => ['OPEN', 'BIDDING', 'IN_PROGRESS'].includes(p.status)).length === 0 && (
                <Typography variant="body1" sx={{ color: themeStyles.primary, textAlign: 'center', py: 4 }}>
                  No active projects found. Post a project to start receiving bids!
                </Typography>
              )}
            </Box>
          )}

          {/* SECTION E: Feedback */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1, color: themeStyles.primary }}>Platform Feedback & Support</Typography>
              <Typography variant="body2" sx={{ mb: 4, color: 'rgba(255,219,187,0.7)' }}>
                Help us improve ProLance! Report bugs, request features, or tell us about your experience. Your feedback is analyzed by our AI to continuously improve the platform.
              </Typography>
              
              <Box sx={{ ...themeStyles.glass, p: 4, borderRadius: 3, maxWidth: 600 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ color: themeStyles.primary }}>Feedback Type</InputLabel>
                  <Select 
                    defaultValue="USABILITY" 
                    sx={{ color: themeStyles.cream, '.MuiOutlinedInput-notchedOutline': { borderColor: themeStyles.primary } }}
                    label="Feedback Type"
                  >
                    <MenuItem value="USABILITY">Usability Issue / Confusing Feature</MenuItem>
                    <MenuItem value="BUG">Technical Bug / Error</MenuItem>
                    <MenuItem value="FEATURE_REQUEST">Feature Request</MenuItem>
                    <MenuItem value="GENERAL">General Feedback</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="Describe your feedback"
                  placeholder="E.g., I found it difficult to understand how the TeamLancer bidding system works..."
                  InputLabelProps={{ style: { color: themeStyles.primary } }}
                  InputProps={{ style: { color: themeStyles.cream } }}
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': { 
                      '& fieldset': { borderColor: themeStyles.primary }, 
                      '&:hover fieldset': { borderColor: themeStyles.cream } 
                    } 
                  }}
                />

                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={<Sparkles size={18} />}
                  onClick={() => setToast({ open: true, message: 'Feedback submitted! Our NLP Engine is analyzing your report.', severity: 'success' })}
                  sx={{ 
                    bgcolor: themeStyles.primary, 
                    color: themeStyles.bg, 
                    py: 1.5,
                    '&:hover': { bgcolor: themeStyles.cream } 
                  }}
                >
                  Submit Feedback
                </Button>
              </Box>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Post Project Modal */}
      <Dialog 
        open={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)}
        PaperProps={{ sx: { bgcolor: themeStyles.bg, color: themeStyles.cream, border: `1px solid ${themeStyles.primary}`, borderRadius: 3, minWidth: '500px' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Post a New Project - Step {postStep}/3
          <IconButton onClick={() => setIsPostModalOpen(false)} sx={{ color: themeStyles.primary }}><X /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {postStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}><TextField fullWidth label="Project Title" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} /></Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: themeStyles.primary }}>Category</InputLabel>
                  <Select value={newProject.category} onChange={e => setNewProject({...newProject, category: e.target.value})} sx={{ color: themeStyles.cream, '.MuiOutlinedInput-notchedOutline': { borderColor: themeStyles.primary } }}>
                    {['Web Dev', 'Mobile', 'AI', 'Design', 'Marketing', 'Data Science', 'Blockchain', 'Other'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <RadioGroup row value={newProject.budgetType} onChange={e => setNewProject({...newProject, budgetType: e.target.value})}>
                  <FormControlLabel value="Fixed" control={<Radio sx={{color:themeStyles.primary}}/>} label="Fixed Price" />
                  <FormControlLabel value="Hourly" control={<Radio sx={{color:themeStyles.primary}}/>} label="Hourly" />
                </RadioGroup>
              </Grid>
              <Grid item xs={12}><TextField fullWidth label="Budget Amount / Range" value={newProject.budgetAmount} onChange={e => setNewProject({...newProject, budgetAmount: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} /></Grid>
              <Grid item xs={12}><TextField fullWidth type="date" label="Deadline" slotProps={{ inputLabel: { shrink: true, style:{color:themeStyles.primary} } }} InputProps={{style:{color:themeStyles.cream}}} value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} /></Grid>
            </Grid>
          )}
          {postStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}><TextField fullWidth multiline rows={4} label="Description (min 100 chars)" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} helperText={`${newProject.description.length} chars`} FormHelperTextProps={{style:{color:themeStyles.primary}}} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Skills Required (comma separated)" value={newProject.skillsRequired} onChange={e => setNewProject({...newProject, skillsRequired: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} /></Grid>
              <Grid item xs={12}>
                <RadioGroup row value={newProject.projectType} onChange={e => setNewProject({...newProject, projectType: e.target.value})}>
                  <FormControlLabel value="Individual" control={<Radio sx={{color:themeStyles.primary}}/>} label="Individual Freelancer" />
                  <FormControlLabel value="Team" control={<Radio sx={{color:themeStyles.primary}}/>} label="Team (Teamlancer)" />
                </RadioGroup>
              </Grid>
              {newProject.projectType === 'Team' && (
                <Grid item xs={12}><TextField fullWidth type="number" label="Team Size (2-10)" value={newProject.teamSize} onChange={e => setNewProject({...newProject, teamSize: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} /></Grid>
              )}
            </Grid>
          )}
          {postStep === 3 && (
            <Box sx={{ textAlign: 'center', p: 3, ...themeStyles.glass }}>
              <Bot size={48} color={themeStyles.primary} style={{ marginBottom: 16 }} />
              <Typography variant="h5" sx={{ mb: 2 }}>AI Pre-Flight Analysis</Typography>
              <Typography variant="body1" sx={{ color: '#4caf50', mb: 1 }}>Success Probability: 92%</Typography>
              <Typography variant="body1" sx={{ color: themeStyles.primary, mb: 1 }}>Expected Proposals: 15 - 25</Typography>
              <Typography variant="body1" sx={{ color: '#ff9800', mb: 3 }}>Risk Level: LOW</Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: themeStyles.cream }}>"Your budget is well-aligned with the requested skills. Ready to post!"</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {postStep > 1 && <Button onClick={() => setPostStep(postStep - 1)} sx={{ color: themeStyles.primary }}>Back</Button>}
          {postStep < 3 ? (
            <Button variant="contained" onClick={() => setPostStep(postStep + 1)} sx={{ bgcolor: themeStyles.primary }}>Next Step</Button>
          ) : (
            <Button variant="contained" onClick={handlePostProject} sx={{ bgcolor: themeStyles.primary, display: 'flex', gap: 1 }}><Sparkles size={16} /> Post Project</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Review Modal */}
      <Dialog 
        open={isReviewModalOpen} 
        onClose={() => { setIsReviewModalOpen(false); setReviewProject(null); }}
        PaperProps={{ sx: { bgcolor: themeStyles.bg, color: themeStyles.cream, border: `1px solid ${themeStyles.primary}`, borderRadius: 3, minWidth: 420 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(153,126,103,0.2)` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star size={20} color="#997E67" />
            Leave a Review{reviewProject ? ` — ${reviewProject.title}` : ''}
          </Box>
          <IconButton onClick={() => { setIsReviewModalOpen(false); setReviewProject(null); }} sx={{ color: themeStyles.primary }}><X /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ...themeStyles.glass, p: 2, borderRadius: 2 }}>
            <Typography sx={{ minWidth: 60 }}>Rating:</Typography>
            <Rating
              value={reviewRating}
              onChange={(e, v) => setReviewRating(v)}
              sx={{ color: themeStyles.cream, fontSize: '2rem' }}
            />
            <Typography sx={{ color: themeStyles.primary, fontWeight: 'bold' }}>{reviewRating}/5</Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your feedback (helps the AI improve matching)"
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            InputLabelProps={{ style: { color: themeStyles.primary } }}
            InputProps={{ style: { color: themeStyles.cream } }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: themeStyles.primary }, '&:hover fieldset': { borderColor: themeStyles.cream } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid rgba(153,126,103,0.2)` }}>
          <Button onClick={() => { setIsReviewModalOpen(false); setReviewProject(null); }} sx={{ color: themeStyles.primary }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: themeStyles.primary, color: themeStyles.bg, '&:hover': { bgcolor: themeStyles.cream } }} onClick={handleSubmitReview}>
            <Sparkles size={16} style={{ marginRight: 8 }} /> Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Revision Modal */}
      <Dialog
        open={revisionModal.open}
        onClose={() => setRevisionModal({ open: false, project: null })}
        PaperProps={{ sx: { bgcolor: themeStyles.bg, color: themeStyles.cream, border: `1px solid ${themeStyles.primary}`, borderRadius: 3, minWidth: '480px' } }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid rgba(153,126,103,0.2)` }}>
          Request Revision
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,152,0,0.08)', borderRadius: 2, border: '1px solid rgba(255,152,0,0.2)' }}>
            <Typography variant="body2" sx={{ color: '#ff9800' }}>
              ⚠️ The project status will change back to "In Progress". The freelancer will see your note and work on the requested changes.
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Revision Instructions"
            value={revisionNote}
            onChange={e => setRevisionNote(e.target.value)}
            placeholder="e.g. Please fix the navigation menu alignment and add the missing loading states we discussed."
            InputLabelProps={{ style: { color: themeStyles.primary } }}
            InputProps={{ style: { color: themeStyles.cream } }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: themeStyles.primary }, '&:hover fieldset': { borderColor: themeStyles.cream } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid rgba(153,126,103,0.2)` }}>
          <Button onClick={() => setRevisionModal({ open: false, project: null })} sx={{ color: themeStyles.primary }}>Cancel</Button>
          <Button
            variant="outlined"
            onClick={handleRequestRevision}
            sx={{ color: '#ff9800', borderColor: '#ff9800', '&:hover': { borderColor: '#ff9800', bgcolor: 'rgba(255,152,0,0.1)' } }}
          >
            Send Revision Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stripe Escrow Payment Modal */}
      <Dialog
        open={escrowModal.open}
        onClose={() => setEscrowModal({ open: false, project: null, bid: null })}
        PaperProps={{ sx: { bgcolor: themeStyles.bg, color: themeStyles.cream, border: `1px solid ${themeStyles.primary}`, borderRadius: 3, minWidth: 480 } }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid rgba(153,126,103,0.2)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>💳</span>
            <Typography variant="h6">Escrow Payment</Typography>
          </Box>
          <IconButton onClick={() => setEscrowModal({ open: false, project: null, bid: null })} sx={{ color: themeStyles.primary }}><X /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ bgcolor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 2, p: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>🔒</span> Funds are held in secure escrow and released only when you approve project completion.
            </Typography>
          </Box>
          {escrowModal.project && escrowModal.bid && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, ...themeStyles.glass, borderRadius: 2 }}>
                <Typography sx={{ color: themeStyles.primary }}>Project</Typography>
                <Typography sx={{ fontWeight: 'bold' }}>{escrowModal.project.title}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, ...themeStyles.glass, borderRadius: 2 }}>
                <Typography sx={{ color: themeStyles.primary }}>Freelancer</Typography>
                <Typography sx={{ fontWeight: 'bold' }}>{escrowModal.bid.freelancer?.fullName || escrowModal.bid.freelancer?.email || 'Freelancer'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, ...themeStyles.glass, borderRadius: 2 }}>
                <Typography sx={{ color: themeStyles.primary }}>Bid Amount</Typography>
                <Typography sx={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.2rem' }}>
                  ${escrowModal.bid.proposedAmount || escrowModal.project.budgetMin || '—'}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: 'rgba(153,126,103,0.1)', p: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: themeStyles.primary }}>
                  ✔ By confirming, you accept the bid and initiate escrow payment via Stripe.
                  <br/>✔ The freelancer begins work immediately.
                  <br/>✔ Funds release when you click "Approve Completion".
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid rgba(153,126,103,0.2)`, gap: 2 }}>
          <Button onClick={() => setEscrowModal({ open: false, project: null, bid: null })} sx={{ color: themeStyles.primary }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={escrowLoading}
            onClick={handleEscrowPay}
            sx={{ bgcolor: '#10b981', color: '#fff', '&:hover': { bgcolor: '#059669' }, minWidth: 200, fontWeight: 'bold' }}
          >
            {escrowLoading ? 'Processing...' : '💳 Confirm & Pay Escrow'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}





