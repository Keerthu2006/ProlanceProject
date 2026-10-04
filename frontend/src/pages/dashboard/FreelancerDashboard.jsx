import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import {
  Box, Typography, Button, Tabs, Tab, Card, CardContent, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, LinearProgress, Snackbar, Alert, IconButton, Rating,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Edit, CheckCircle2, TrendingUp, Sparkles, Briefcase, Clock, Users, X, Star
} from 'lucide-react';

const MOCK_OPEN_PROJECTS = [
  { id: 1, title: 'AI-Powered Chatbot Integration', client: 'TechCorp', budget: '$5,000 - $8,000', deadline: '2026-08-15', skills: ['Python', 'NLP'], bids: 4 },
  { id: 2, title: 'React Native E-commerce App', client: 'ShopifyPlus', budget: '$60/hr', deadline: '2026-09-01', skills: ['React Native', 'Redux'], bids: 12 },
];

// Real bids fetched from API

const EARNINGS_DATA = [
  { name: 'Jan', amount: 4000 }, { name: 'Feb', amount: 3000 }, { name: 'Mar', amount: 5000 },
  { name: 'Apr', amount: 4500 }, { name: 'May', amount: 6000 }, { name: 'Jun', amount: 7500 },
];

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

export default function FreelancerDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [myBids, setMyBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [submitNoteModal, setSubmitNoteModal] = useState({ open: false, project: null });
  const [submitNote, setSubmitNote] = useState('');

  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.fullName || 'Loading...', profession: 'Loading...', hourlyRate: '', 
    availability: '-', completeness: 0,
    bio: 'Loading...', skills: '', avatarUrl: ''
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(4);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewProject, setReviewProject] = useState(null);
  const [reviewedProjects, setReviewedProjects] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/freelancers/me');
        const data = res.data;
        setProfile({
          name: data.user?.fullName || user?.fullName || 'Unknown',
          profession: data.headline || 'Freelancer',
          hourlyRate: data.hourlyRate ? data.hourlyRate : '',
          availability: data.availability || '-',
          completeness: 100,
          bio: data.bio || '',
          skills: data.skills ? data.skills.join(', ') : '',
          avatarUrl: data.user?.profileImageUrl || ''
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchProfile();
  }, [user]);

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/open');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const [freelancers, setFreelancers] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const fetchTeamData = async () => {
    try {
      const fRes = await api.get('/freelancers');
      // Filter out self
      setFreelancers(fRes.data.filter(f => f.user?.email !== user?.email));
      
      const tRes = await api.get('/teams/mine');
      setMyTeams(tRes.data);
    } catch (err) {
      console.error('Failed to load team data', err);
    }
  };

  const fetchMyBids = async () => {
    setBidsLoading(true);
    try {
      const res = await api.get('/projects/my-applications');
      setMyBids(res.data || []);
    } catch (err) {
      console.error('Failed to fetch bids', err);
    } finally {
      setBidsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) fetchProjects();
    if (activeTab === 1) fetchMyBids();
    if (activeTab === 2) fetchAssignedProjects();
    if (activeTab === 3) fetchTeamData();
  }, [activeTab]);

  const fetchAssignedProjects = async () => {
    setAssignedLoading(true);
    try {
      const res = await api.get('/projects/assigned');
      setAssignedProjects(res.data || []);

      // Fetch reviews given to hide completed projects that are already reviewed
      try {
        const revRes = await api.get('/projects/reviews/given');
        const given = revRes.data || [];
        setReviewedProjects(given.map(r => r.projectId));
      } catch (e) {
        console.warn('Could not fetch reviews given', e);
      }
    } catch (err) {
      console.error('Failed to fetch assigned projects', err);
    } finally {
      setAssignedLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const skillsArray = profile.skills.split(',').map(s => s.trim()).filter(s => s);
      await api.put('/freelancers/me', {
        headline: profile.profession,
        hourlyRate: profile.hourlyRate ? parseFloat(profile.hourlyRate) : null,
        bio: profile.bio,
        skills: skillsArray,
        profileImageUrl: profile.avatarUrl
      });
      setToast({open: true, message: 'Profile updated successfully!', severity: 'success'});
      setIsEditModalOpen(false);
    } catch(err) {
      console.error(err);
      setToast({open: true, message: 'Failed to update profile.', severity: 'error'});
    }
  };

  const handleSubmitForReview = async () => {
    const project = submitNoteModal.project;
    if (!project) return;
    try {
      await api.post(`/projects/${project.id}/submit-for-review`, { note: submitNote || 'Work has been submitted for your review.' });
      setToast({ open: true, message: 'Work submitted for client review! ✅', severity: 'success' });
      setSubmitNoteModal({ open: false, project: null });
      setSubmitNote('');
      fetchAssignedProjects();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.message || 'Failed to submit for review', severity: 'error' });
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewProject) return;
    try {
      await api.post(`/projects/${reviewProject.id}/reviews`, {
        revieweeId: reviewProject.owner?.id || reviewProject.client?.id || reviewProject.clientId,
        rating: reviewRating,
        comment: reviewComment
      });
      const updated = [...reviewedProjects, reviewProject.id];
      setReviewedProjects(updated);
      setIsReviewModalOpen(false);
      setReviewComment('');
      setReviewRating(4);
      setReviewProject(null);
      setToast({ open: true, message: 'Review submitted for the client! ✅', severity: 'success' });
    } catch (err) {
      console.error('Failed to submit review:', err);
      setToast({ open: true, message: err.response?.data?.message || 'Failed to submit review to server.', severity: 'error' });
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName || selectedMembers.length === 0) {
      setToast({ open: true, message: 'Provide a team name and select members.', severity: 'warning' });
      return;
    }
    try {
      await api.post('/teams', { name: teamName, memberIds: selectedMembers });
      setToast({ open: true, message: 'Team created successfully!', severity: 'success' });
      setTeamName('');
      setSelectedMembers([]);
      fetchTeamData();
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: 'Failed to create team', severity: 'error' });
    }
  };

  const [bidForm, setBidForm] = useState({ coverLetter: '', proposedAmount: '' });

  const handlePlaceBid = async () => {
    try {
      const payload = {
        coverLetter: bidForm.coverLetter,
        proposedAmount: parseFloat(bidForm.proposedAmount) || 0
      };
      if (selectedProject?.projectType === 'TEAM') {
        if (!selectedTeamId) {
          setToast({ open: true, message: 'This is a team project. Please select a team.', severity: 'warning' });
          return;
        }
        payload.teamId = selectedTeamId;
      }
      await api.post(`/projects/${selectedProject.id}/apply`, payload);
      setIsBidModalOpen(false);
      setBidForm({ coverLetter: '', proposedAmount: '' });
      setSelectedTeamId('');
      setToast({ open: true, message: 'Bid placed successfully!', severity: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: err.response?.data?.message || 'Failed to place bid', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: themeStyles.bg, color: themeStyles.cream }}>
      {/* SECTION A: Welcome + Profile Snapshot */}
      <Box sx={{ mb: 4, ...themeStyles.glass, p: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=997E67&color=fff`} sx={{ width: 100, height: 100 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">{profile.name}</Typography>
            <Typography variant="subtitle1" sx={{ color: themeStyles.primary, mb: 1 }}>{profile.profession}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <Chip label={`${profile.hourlyRate}/hr`} sx={{ bgcolor: themeStyles.brown, color: 'white' }} size="small" />
              <Chip label={profile.availability} sx={{ bgcolor: themeStyles.primary, color: themeStyles.bg }} size="small" />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption">Profile Completeness</Typography>
              <LinearProgress variant="determinate" value={profile.completeness} sx={{ width: 150, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: themeStyles.cream } }} />
              <Typography variant="caption">{profile.completeness}%</Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: '300px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: 1.5, mx: { xs: 0, md: 4 } }}>
          {profile.bio && (
            <Typography variant="body2" sx={{ color: '#d1d5db', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{profile.bio}"
            </Typography>
          )}
          {profile.skills && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.skills.split(',').map((s, i) => s.trim() && (
                <Chip key={i} label={s.trim()} size="small" sx={{ borderColor: themeStyles.primary, color: themeStyles.cream }} variant="outlined" />
              ))}
            </Box>
          )}
        </Box>

        <Button variant="outlined" startIcon={<Edit />} onClick={() => setIsEditModalOpen(true)} sx={{ color: themeStyles.cream, borderColor: themeStyles.primary }}>Edit Profile</Button>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 4, '& .MuiTab-root': { color: themeStyles.primary }, '& .Mui-selected': { color: `${themeStyles.cream} !important` }, '& .MuiTabs-indicator': { bgcolor: themeStyles.cream } }}>
        <Tab label="Browse Projects" />
        <Tab label="My Bids" />
        <Tab label="Active Work" />
        <Tab label="My Team" />
      </Tabs>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
          
          {/* SECTION B: Browse Projects */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {projects.map((project) => (
                <Grid item xs={12} md={6} key={project.id}>
                  <Card sx={{ ...themeStyles.glass, color: themeStyles.cream, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <CardContent>
                      <Typography variant="h6">{project.title}</Typography>
                      <Typography variant="body2" sx={{ color: themeStyles.primary, mb: 2 }}>{project.projectType} Project {project.teamSize ? `(Size: ${project.teamSize})` : ''}</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}><Briefcase size={16} style={{ verticalAlign: 'middle', marginRight: 8 }}/> ${project.budgetMin} - ${project.budgetMax}</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}><Clock size={16} style={{ verticalAlign: 'middle', marginRight: 8 }}/> {project.durationDays} days</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        {(project.skillsRequired || []).map(s => <Chip key={s} label={s} size="small" sx={{ color: themeStyles.cream, borderColor: themeStyles.primary }} variant="outlined" />)}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="caption" sx={{ color: themeStyles.primary }}></Typography>
                        <Button variant="contained" sx={{ bgcolor: themeStyles.primary }} onClick={() => { setSelectedProject(project); setIsBidModalOpen(true); }}>Place Bid</Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* SECTION C: My Bids/Applications */}
          {activeTab === 1 && (
            <Box>
              {bidsLoading && <Typography sx={{ color: themeStyles.primary, textAlign: 'center', py: 4 }}>Loading your bids…</Typography>}
              {!bidsLoading && myBids.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8, ...themeStyles.glass, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>No bids yet</Typography>
                  <Typography variant="body2" sx={{ color: themeStyles.primary }}>Browse open projects and place your first bid!</Typography>
                </Box>
              )}
              {myBids.map(bid => (
                <motion.div key={bid.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <Box sx={{ mb: 3, ...themeStyles.glass, p: 3, borderRadius: 2, '&:hover': { borderColor: themeStyles.primary, transition: 'border-color 0.2s' } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>{bid.project?.title || 'Project'}</Typography>
                        <Typography variant="body2" sx={{ color: themeStyles.primary, mb: 1 }}>Category: {bid.project?.projectType || 'General'}</Typography>
                        {bid.coverLetter && (
                          <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)', fontStyle: 'italic', mb: 1, maxWidth: 500 }}>
                            "{bid.coverLetter.slice(0, 120)}{bid.coverLetter.length > 120 ? '…' : ''}"
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Bid Amount: <span style={{ fontWeight: 700, background: 'linear-gradient(135deg, #FFDBBB, #997E67)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${bid.proposedAmount}</span>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.4)' }}>
                          Submitted: {bid.appliedAt ? new Date(bid.appliedAt).toLocaleDateString() : 'Recently'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                        {bid.status === 'ACCEPTED' ? (
                          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}>
                            <Box sx={{ bgcolor: 'rgba(76,175,80,0.1)', border: '1px solid #4caf50', borderRadius: 2, p: 1.5, mb: 2, color: '#4caf50' }}>
                              <Typography variant="subtitle2" fontWeight="bold">Accepted! 🎉</Typography>
                            </Box>
                          </motion.div>
                        ) : bid.status === 'REJECTED' ? (
                          <Chip label="Rejected" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid #ef4444' }} />
                        ) : (
                          <Chip label="Pending" sx={{ bgcolor: 'rgba(234,179,8,0.15)', color: '#eab308', border: '1px solid #eab308' }} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          )}

          {/* SECTION D: Active Work - Real lifecycle */}
          {activeTab === 2 && (
            <Box>
              {assignedLoading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ color: themeStyles.primary }}>Loading your active projects...</Typography>
                </Box>
              )}
              {!assignedLoading && assignedProjects.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8, ...themeStyles.glass, borderRadius: 3 }}>
                  <Typography variant="h2" sx={{ mb: 2 }}>💼</Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>No active projects yet</Typography>
                  <Typography variant="body2" sx={{ color: themeStyles.primary }}>Once a client accepts your bid, your projects will appear here</Typography>
                </Box>
              )}

              {/* === SOLO PROJECTS === */}
              {!assignedLoading && assignedProjects.filter(p => p.projectType !== 'TEAM').length > 0 && (
                <Box sx={{ mb: 5 }}>
                  <Typography variant="h5" sx={{ mb: 2, pb: 1, borderBottom: `1px solid ${themeStyles.primary}55`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🧑 My Solo Projects
                  </Typography>
                  {assignedProjects.filter(p => p.projectType !== 'TEAM').map((project, idx) => {
                    const isInProgress = project.status === 'IN_PROGRESS';
                    const isUnderReview = project.status === 'UNDER_REVIEW';
                    const isCompleted = project.status === 'COMPLETED';
                    const steps = ['Accepted', 'In Progress', 'Submitted', 'Completed'];
                    const stepIdx = isInProgress ? 1 : isUnderReview ? 2 : isCompleted ? 3 : 0;
                    return (
                      <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                        <Box sx={{ mb: 3, ...themeStyles.glass, p: 3, borderRadius: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6">{project.title}</Typography>
                              <Typography variant="body2" sx={{ color: themeStyles.primary }}>Budget: ${project.budgetMin} – ${project.budgetMax}</Typography>
                            </Box>
                            <Chip
                              label={project.status.replace('_', ' ')}
                              sx={{
                                bgcolor: isCompleted ? 'rgba(76,175,80,0.15)' : isUnderReview ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                                color: isCompleted ? '#4caf50' : isUnderReview ? '#2196f3' : '#ff9800',
                                border: `1px solid ${isCompleted ? '#4caf50' : isUnderReview ? '#2196f3' : '#ff9800'}`,
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          {/* Progress Steps */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mb: 3, mt: 1 }}>
                            {steps.map((step, i) => (
                              <React.Fragment key={step}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                  <Box sx={{
                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: i <= stepIdx ? themeStyles.primary : 'rgba(255,219,187,0.1)',
                                    border: `2px solid ${i <= stepIdx ? themeStyles.primary : 'rgba(153,126,103,0.3)'}`,
                                    color: i <= stepIdx ? themeStyles.bg : themeStyles.primary,
                                    fontWeight: 'bold', fontSize: '0.8rem', transition: 'all 0.3s'
                                  }}>
                                    {i < stepIdx ? '✓' : i + 1}
                                  </Box>
                                  <Typography variant="caption" sx={{ mt: 0.5, color: i <= stepIdx ? themeStyles.cream : themeStyles.primary, textAlign: 'center', fontSize: '0.65rem' }}>
                                    {step}
                                  </Typography>
                                </Box>
                                {i < steps.length - 1 && (
                                  <Box sx={{ flex: 2, height: 2, bgcolor: i < stepIdx ? themeStyles.primary : 'rgba(153,126,103,0.2)', mt: -2, transition: 'all 0.3s' }} />
                                )}
                              </React.Fragment>
                            ))}
                          </Box>
                          {project.revisionNote && isInProgress && (
                            <Box sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,152,0,0.08)', borderRadius: 2, border: '1px solid rgba(255,152,0,0.3)' }}>
                              <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 'bold', display: 'block', mb: 0.5 }}>⚠️ Client Revision Request:</Typography>
                              <Typography variant="body2" sx={{ color: themeStyles.cream }}>{project.revisionNote}</Typography>
                            </Box>
                          )}
                          {isUnderReview && project.submissionNote && (
                            <Box sx={{ p: 2, mb: 2, bgcolor: 'rgba(33,150,243,0.08)', borderRadius: 2, border: '1px solid rgba(33,150,243,0.3)' }}>
                              <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 'bold', display: 'block', mb: 0.5 }}>📤 Submitted to Client:</Typography>
                              <Typography variant="body2" sx={{ color: themeStyles.cream }}>{project.submissionNote}</Typography>
                              <Typography variant="caption" sx={{ color: themeStyles.primary }}>Waiting for client approval...</Typography>
                            </Box>
                          )}
                          {isCompleted && (
                            <Box sx={{ p: 2, mb: 2, bgcolor: 'rgba(76,175,80,0.08)', borderRadius: 2, border: '1px solid rgba(76,175,80,0.3)' }}>
                              <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>🎉 Project Completed! Payment has been processed.</Typography>
                            </Box>
                          )}
                          {isInProgress && (
                            <Button variant="contained" startIcon={<CheckCircle2 size={18} />} onClick={() => setSubmitNoteModal({ open: true, project })} sx={{ bgcolor: themeStyles.primary, color: themeStyles.bg, '&:hover': { bgcolor: themeStyles.cream }, mt: 1 }}>
                              Submit Work for Review
                            </Button>
                          )}
                          {isUnderReview && (
                            <Chip label="⏳ Awaiting Client Approval" sx={{ bgcolor: 'rgba(33,150,243,0.1)', color: '#2196f3', border: '1px solid #2196f3', mt: 1 }} />
                          )}
                          {isCompleted && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                              <Chip label="✅ Delivered & Approved" sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50', border: '1px solid #4caf50' }} />
                              {!reviewedProjects.includes(project.id) ? (
                                <Button variant="outlined" size="small" startIcon={<Star size={16} />} sx={{ color: themeStyles.cream, borderColor: themeStyles.primary }} onClick={() => { setReviewProject(project); setIsReviewModalOpen(true); }}>
                                  Leave Review
                                </Button>
                              ) : (
                                <Chip label="✓ Reviewed" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50', border: 'none' }} />
                              )}
                            </Box>
                          )}
                        </Box>
                      </motion.div>
                    );
                  })}
                </Box>
              )}

              {/* === TEAM PROJECTS === */}
              {!assignedLoading && assignedProjects.filter(p => p.projectType === 'TEAM').length > 0 && (
                <Box sx={{ mb: 5 }}>
                  <Typography variant="h5" sx={{ mb: 2, pb: 1, borderBottom: `1px solid ${themeStyles.primary}55`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    👥 My Team Projects
                  </Typography>
                  {assignedProjects.filter(p => p.projectType === 'TEAM').map((project, idx) => {
                    const isInProgress = project.status === 'IN_PROGRESS';
                    const isUnderReview = project.status === 'UNDER_REVIEW';
                    const isCompleted = project.status === 'COMPLETED';
                    const steps = ['Accepted', 'In Progress', 'Submitted', 'Completed'];
                    const stepIdx = isInProgress ? 1 : isUnderReview ? 2 : isCompleted ? 3 : 0;
                    // Find team to calculate milestone split
                    const teamForProject = myTeams.find(t => String(t.id) === String(project.teamId)) || { members: [] };
                    const numMembers = project.teamMemberCount || (teamForProject.members && teamForProject.members.length > 0 ? teamForProject.members.length : 1);
                    const splitMin = (parseFloat(project.budgetMin) / numMembers).toFixed(2);
                    const splitMax = (parseFloat(project.budgetMax) / numMembers).toFixed(2);
                    return (
                      <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                        <Box sx={{ mb: 3, ...themeStyles.glass, p: 3, borderRadius: 2, border: `1px solid ${themeStyles.primary}44` }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="h6">{project.title}</Typography>
                              <Typography variant="body2" sx={{ color: themeStyles.primary }}>Total Budget: ${project.budgetMin} – ${project.budgetMax}</Typography>
                            </Box>
                            <Chip
                              label={project.status.replace('_', ' ')}
                              sx={{
                                bgcolor: isCompleted ? 'rgba(76,175,80,0.15)' : isUnderReview ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                                color: isCompleted ? '#4caf50' : isUnderReview ? '#2196f3' : '#ff9800',
                                border: `1px solid ${isCompleted ? '#4caf50' : isUnderReview ? '#2196f3' : '#ff9800'}`,
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          {/* Team milestone split banner */}
                          <Box sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(76,175,80,0.08)', borderRadius: 1.5, border: '1px solid rgba(76,175,80,0.25)', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                              💵 Your Milestone Share: ${splitMin} – ${splitMax}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeStyles.primary }}>
                              (split equally among {numMembers} team member{numMembers !== 1 ? 's' : ''})
                            </Typography>
                          </Box>
                          {/* Progress Steps */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mb: 3, mt: 1 }}>
                            {steps.map((step, i) => (
                              <React.Fragment key={step}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                  <Box sx={{
                                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    bgcolor: i <= stepIdx ? themeStyles.primary : 'rgba(255,219,187,0.1)',
                                    border: `2px solid ${i <= stepIdx ? themeStyles.primary : 'rgba(153,126,103,0.3)'}`,
                                    color: i <= stepIdx ? themeStyles.bg : themeStyles.primary,
                                    fontWeight: 'bold', fontSize: '0.8rem', transition: 'all 0.3s'
                                  }}>
                                    {i < stepIdx ? '✓' : i + 1}
                                  </Box>
                                  <Typography variant="caption" sx={{ mt: 0.5, color: i <= stepIdx ? themeStyles.cream : themeStyles.primary, textAlign: 'center', fontSize: '0.65rem' }}>
                                    {step}
                                  </Typography>
                                </Box>
                                {i < steps.length - 1 && (
                                  <Box sx={{ flex: 2, height: 2, bgcolor: i < stepIdx ? themeStyles.primary : 'rgba(153,126,103,0.2)', mt: -2, transition: 'all 0.3s' }} />
                                )}
                              </React.Fragment>
                            ))}
                          </Box>
                          {isInProgress && (
                            <Button variant="contained" startIcon={<CheckCircle2 size={18} />} onClick={() => setSubmitNoteModal({ open: true, project })} sx={{ bgcolor: themeStyles.primary, color: themeStyles.bg, '&:hover': { bgcolor: themeStyles.cream }, mt: 1 }}>
                              Submit Work for Review
                            </Button>
                          )}
                          {isUnderReview && (
                            <Chip label="⏳ Awaiting Client Approval" sx={{ bgcolor: 'rgba(33,150,243,0.1)', color: '#2196f3', border: '1px solid #2196f3', mt: 1 }} />
                          )}
                          {isCompleted && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                              <Chip label="✅ Delivered & Approved" sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50', border: '1px solid #4caf50' }} />
                              {!reviewedProjects.includes(project.id) ? (
                                <Button variant="outlined" size="small" startIcon={<Star size={16} />} sx={{ color: themeStyles.cream, borderColor: themeStyles.primary }} onClick={() => { setReviewProject(project); setIsReviewModalOpen(true); }}>
                                  Leave Review
                                </Button>
                              ) : (
                                <Chip label="✓ Reviewed" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.1)', color: '#4caf50', border: 'none' }} />
                              )}
                            </Box>
                          )}
                        </Box>
                      </motion.div>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          {/* SECTION E: My Team */}
          {activeTab === 3 && (
            <Box>
              {myTeams.length > 0 ? (
                <Box>
                  <Typography variant="h5" mb={2}>My Teams</Typography>
                  {myTeams.map(team => (
                    <Card key={team.id} sx={{ mb: 2, ...themeStyles.glass, color: themeStyles.cream }}>
                      <CardContent>
                        <Typography variant="h6">{team.name}</Typography>
                        <Typography variant="body2" sx={{ color: themeStyles.primary, mb: 2 }}>Leader: {team.leader?.fullName}</Typography>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Members ({team.members?.length || 0}):</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {team.members?.map(m => (
                            <Chip key={m.id} label={m.fullName} sx={{ bgcolor: themeStyles.brown, color: 'white' }} />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ ...themeStyles.glass, p: 4 }}>
                  <Typography variant="h5" mb={2}>Create a Team</Typography>
                  <Typography variant="body2" sx={{ color: themeStyles.primary, mb: 3 }}>
                    You are not leading any teams. Create one to bid on Team Projects!
                  </Typography>
                  <TextField 
                    fullWidth 
                    label="Team Name" 
                    value={teamName} 
                    onChange={e => setTeamName(e.target.value)} 
                    InputLabelProps={{style:{color:themeStyles.primary}}} 
                    InputProps={{style:{color:themeStyles.cream}}}
                    sx={{ mb: 3 }}
                  />
                  <Typography variant="subtitle1" mb={1}>Select Members</Typography>
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 3, border: `1px solid ${themeStyles.primary}`, borderRadius: 2, p: 2 }}>
                    {freelancers.map(f => (
                      <Box key={f.user?.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 30, height: 30 }} />
                          <Typography>{f.user?.fullName} ({f.headline || 'Freelancer'})</Typography>
                        </Box>
                        <Button 
                          size="small" 
                          variant={selectedMembers.includes(f.user?.id) ? "contained" : "outlined"}
                          sx={{ 
                            bgcolor: selectedMembers.includes(f.user?.id) ? themeStyles.primary : 'transparent',
                            color: selectedMembers.includes(f.user?.id) ? themeStyles.bg : themeStyles.primary,
                            borderColor: themeStyles.primary
                          }}
                          onClick={() => {
                            if (selectedMembers.includes(f.user?.id)) {
                              setSelectedMembers(selectedMembers.filter(id => id !== f.user?.id));
                            } else {
                              setSelectedMembers([...selectedMembers, f.user?.id]);
                            }
                          }}
                        >
                          {selectedMembers.includes(f.user?.id) ? 'Selected' : 'Select'}
                        </Button>
                      </Box>
                    ))}
                    {freelancers.length === 0 && <Typography variant="body2" sx={{ color: themeStyles.primary }}>No other freelancers found.</Typography>}
                  </Box>
                  <Button variant="contained" sx={{ bgcolor: themeStyles.primary }} onClick={handleCreateTeam}>
                    Create Team
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} PaperProps={{ sx: { bgcolor: themeStyles.bg, color: themeStyles.cream, border: `1px solid ${themeStyles.primary}`, minWidth: '500px' } }}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField fullWidth label="Profile Photo URL" value={profile.avatarUrl} onChange={e=>setProfile({...profile, avatarUrl: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} placeholder="https://example.com/photo.jpg" />
          <TextField fullWidth label="Headline" value={profile.profession} onChange={e=>setProfile({...profile, profession: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} />
          <TextField fullWidth label="Hourly Rate ($)" type="number" value={profile.hourlyRate} onChange={e=>setProfile({...profile, hourlyRate: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} />
          <TextField fullWidth multiline rows={3} label="Bio" value={profile.bio} onChange={e=>setProfile({...profile, bio: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} />
          <TextField fullWidth label="Skills (comma separated)" value={profile.skills} onChange={e=>setProfile({...profile, skills: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsEditModalOpen(false)} sx={{ color: themeStyles.primary }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: themeStyles.primary }} onClick={handleSaveProfile}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Bid Modal */}
      <Dialog open={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} PaperProps={{ sx: { bgcolor: themeStyles.bg, color: themeStyles.cream, border: `1px solid ${themeStyles.primary}`, minWidth: '500px' } }}>
        <DialogTitle>Place Bid on: {selectedProject?.title}</DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField fullWidth label="Proposed Amount" value={bidForm.proposedAmount} onChange={e=>setBidForm({...bidForm, proposedAmount: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} />
          <TextField fullWidth multiline rows={5} label="Cover Letter" value={bidForm.coverLetter} onChange={e=>setBidForm({...bidForm, coverLetter: e.target.value})} InputLabelProps={{style:{color:themeStyles.primary}}} InputProps={{style:{color:themeStyles.cream}}} />
          
          {selectedProject?.projectType === 'TEAM' && (
            <Box>
              <Typography variant="caption" sx={{ color: themeStyles.primary, mb: 1, display: 'block' }}>
                👥 This is a Team Project — select the team you're bidding with:
              </Typography>
              {myTeams.length === 0 ? (
                <Alert severity="warning" sx={{ bgcolor: 'rgba(153,126,103,0.1)', color: themeStyles.cream, border: `1px solid ${themeStyles.primary}` }}>
                  You have no teams yet. Create a team first to bid on this project.
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel sx={{ color: themeStyles.primary }}>Select Team</InputLabel>
                  <Select
                    value={selectedTeamId}
                    onChange={e => setSelectedTeamId(e.target.value)}
                    label="Select Team"
                    sx={{ color: themeStyles.cream, '.MuiOutlinedInput-notchedOutline': { borderColor: themeStyles.primary } }}
                  >
                    {myTeams.filter(t => t.leader?.id === user?.id || t.leaderId === user?.id).map(t => (
                      <MenuItem key={t.id} value={t.id} sx={{ bgcolor: themeStyles.bg, color: themeStyles.cream }}>
                        {t.name} ({t.members?.length ?? '?'} members)
                        {(t.leader?.id === user?.id) && ' 👑 (You lead)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsBidModalOpen(false)} sx={{ color: themeStyles.primary }}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: themeStyles.primary }} onClick={handlePlaceBid}>Submit Bid</Button>
        </DialogActions>
      </Dialog>

      {/* Submit for Review Modal */}
      <Dialog
        open={submitNoteModal.open}
        onClose={() => setSubmitNoteModal({ open: false, project: null })}
        PaperProps={{ sx: { bgcolor: themeStyles.bg, color: themeStyles.cream, border: `1px solid ${themeStyles.primary}`, borderRadius: 3, minWidth: '480px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid rgba(153,126,103,0.2)` }}>
          <CheckCircle2 size={20} color="#997E67" />
          Submit Work for Review — {submitNoteModal.project?.title}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ p: 2, mb: 3, bgcolor: 'rgba(33,150,243,0.08)', borderRadius: 2, border: '1px solid rgba(33,150,243,0.2)' }}>
            <Typography variant="body2" sx={{ color: '#2196f3' }}>
              📋 Once submitted, the client will review your work. They can either approve (completing the project) or request revisions.
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Delivery Note (describe what you've delivered)"
            value={submitNote}
            onChange={e => setSubmitNote(e.target.value)}
            placeholder="e.g. I have completed all required features including user authentication, dashboard, and API integration. Please find the GitHub link and live demo in the attached notes."
            InputLabelProps={{ style: { color: themeStyles.primary } }}
            InputProps={{ style: { color: themeStyles.cream } }}
            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: themeStyles.primary }, '&:hover fieldset': { borderColor: themeStyles.cream } } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid rgba(153,126,103,0.2)` }}>
          <Button onClick={() => setSubmitNoteModal({ open: false, project: null })} sx={{ color: themeStyles.primary }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<CheckCircle2 size={16} />}
            onClick={handleSubmitForReview}
            sx={{ bgcolor: themeStyles.primary, color: themeStyles.bg, '&:hover': { bgcolor: themeStyles.cream } }}
          >
            Submit for Client Review
          </Button>
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
            Review Client{reviewProject ? ` — ${reviewProject.title}` : ''}
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
            label="Your feedback (helps other freelancers)"
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

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={() => setToast({...toast, open: false})}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
