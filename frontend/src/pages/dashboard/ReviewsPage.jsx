import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Rating,
  TextField, CircularProgress, Chip, Snackbar, Alert, Avatar,
  Tabs, Tab, Divider, Badge, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, CheckCircle2, Users, ArrowRight, Send, Eye, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const themeStyles = {
  bg: '#0D0A07',
  primary: '#997E67',
  cream: '#FFDBBB',
  brown: '#664930',
  glass: {
    background: 'rgba(255,219,187,0.04)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(153,126,103,0.2)',
    borderRadius: '12px',
  }
};

const StarRating = ({ value, onChange, readOnly }) => (
  <Rating
    value={value}
    onChange={onChange ? (_, v) => onChange(v) : undefined}
    readOnly={readOnly}
    size={readOnly ? 'small' : 'large'}
    sx={{
      '& .MuiRating-iconFilled': { color: themeStyles.primary },
      '& .MuiRating-iconEmpty': { color: 'rgba(153,126,103,0.3)' }
    }}
  />
);

function ReviewCard({ review, badge, badgeColor = '#997E67' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        mb: 2,
        bgcolor: 'rgba(13,10,7,0.6)',
        border: `1px solid rgba(153,126,103,0.2)`,
        borderRadius: 2,
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: 'rgba(153,126,103,0.4)' }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: themeStyles.cream, fontWeight: 'bold', mb: 0.5 }}>
                {review.project?.title || review.projectTitle || 'Project'}
              </Typography>
              <StarRating value={review.rating} readOnly />
            </Box>
            <Chip
              label={badge}
              size="small"
              sx={{ bgcolor: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40`, fontWeight: 'bold' }}
            />
          </Box>

          {review.comment && (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,219,187,0.85)',
                fontStyle: 'italic',
                bgcolor: 'rgba(255,219,187,0.03)',
                p: 1.5,
                borderRadius: 1,
                borderLeft: `3px solid ${themeStyles.primary}`,
                my: 1.5
              }}
            >
              "{review.comment}"
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 26, height: 26, bgcolor: themeStyles.brown, fontSize: '0.75rem' }}>
                {(review.reviewer?.fullName || review.reviewerName || '?')[0]}
              </Avatar>
              <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.7)' }}>
                By: <strong>{review.reviewer?.fullName || review.reviewerName || 'User'}</strong>
                {review.revieweeName ? ` ➔ For: ${review.revieweeName}` : ''}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.4)' }}>
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const isClient = user?.role === 'ROLE_CLIENT';
  const isFreelancer = user?.role === 'ROLE_FREELANCER';

  const [tab, setTab] = useState(0); // 0=pending, 1=two-way, 2=given, 3=received
  const [loading, setLoading] = useState(true);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);

  // Reviewing Form State
  const [reviewingProject, setReviewingProject] = useState(null);
  const [projectTeamMembers, setProjectTeamMembers] = useState([]);
  const [selectedRevieweeId, setSelectedRevieweeId] = useState('ALL'); // 'ALL' or specific UUID
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Two-way dialog
  const [twoWayModalOpen, setTwoWayModalOpen] = useState(false);
  const [selectedProjectForTwoWay, setSelectedProjectForTwoWay] = useState(null);
  const [projectReviewsList, setProjectReviewsList] = useState([]);
  const [loadingTwoWay, setLoadingTwoWay] = useState(false);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch completed projects for this user
      const endpoint = isClient ? '/projects/mine' : '/projects/assigned';
      const projRes = await api.get(endpoint);
      const allProjects = projRes.data?.content || projRes.data || [];
      const completed = allProjects.filter(p => p.status === 'COMPLETED');
      setCompletedProjects(completed);

      // 2. Fetch reviews I have GIVEN
      let given = [];
      try {
        const givenRes = await api.get('/projects/reviews/given');
        given = givenRes.data || [];
        setGivenReviews(given);
      } catch (e) {
        console.warn('Could not fetch given reviews', e);
      }

      // Filter pending projects: exclude those the user already reviewed
      const reviewedProjectIds = given.map(r => r.projectId);
      setPendingProjects(completed.filter(p => !reviewedProjectIds.includes(p.id)));

      // 3. Fetch reviews I have RECEIVED
      try {
        const recRes = await api.get('/projects/reviews/received');
        setReceivedReviews(recRes.data || []);
      } catch (e) {
        console.warn('Could not fetch received reviews', e);
      }

    } catch (err) {
      console.error('Failed to load data:', err);
      setToast({ open: true, message: 'Could not load review data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // When opening review modal for a project
  const handleOpenReview = async (project) => {
    setReviewingProject(project);
    setRating(5);
    setComment('');
    setSelectedRevieweeId('ALL');

    // If it's a client reviewing a team project, load team members
    if (isClient && project.teamId) {
      try {
        const res = await api.get(`/teams/${project.teamId}/members`);
        setProjectTeamMembers(res.data || []);
      } catch (e) {
        setProjectTeamMembers([]);
      }
    } else {
      setProjectTeamMembers([]);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      setToast({ open: true, message: 'Please select a rating', severity: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      if (isClient) {
        // Client reviewing team or freelancer
        if (reviewingProject.teamId && projectTeamMembers.length > 0) {
          if (selectedRevieweeId === 'ALL') {
            // Review ALL team members in batch!
            const batchReqs = projectTeamMembers.map(tm => ({
              revieweeId: tm.id,
              rating,
              comment: comment || `Great work by ${tm.fullName || 'team member'} on ${reviewingProject.title}!`
            }));
            await api.post(`/projects/${reviewingProject.id}/reviews/batch`, batchReqs);
            setToast({ open: true, message: `✅ Review submitted for all ${projectTeamMembers.length} team members!`, severity: 'success' });
          } else {
            // Review single chosen member
            await api.post(`/projects/${reviewingProject.id}/reviews`, {
              revieweeId: selectedRevieweeId,
              rating,
              comment
            });
            setToast({ open: true, message: '✅ Review submitted for team member!', severity: 'success' });
          }
        } else {
          // Solo freelancer review
          const revieweeId = reviewingProject.hiredFreelancerId;
          await api.post(`/projects/${reviewingProject.id}/reviews`, {
            revieweeId,
            rating,
            comment
          });
          setToast({ open: true, message: '✅ Review submitted for freelancer!', severity: 'success' });
        }
      } else {
        // Team member / Freelancer reviewing the client
        const revieweeId = reviewingProject.clientId || reviewingProject.ownerId;
        if (!revieweeId) {
          setToast({ open: true, message: 'Cannot determine client to review.', severity: 'error' });
          setSubmitting(false);
          return;
        }
        await api.post(`/projects/${reviewingProject.id}/reviews`, {
          revieweeId,
          rating,
          comment
        });
        setToast({ open: true, message: '✅ Your review for the client has been posted!', severity: 'success' });
      }

      setReviewingProject(null);
      setRating(5);
      setComment('');
      loadData();
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: '❌ Failed to submit review.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Two-Way Project Feedback View
  const handleOpenTwoWayView = async (project) => {
    setSelectedProjectForTwoWay(project);
    setTwoWayModalOpen(true);
    setLoadingTwoWay(true);
    try {
      const res = await api.get(`/projects/${project.id}/reviews`);
      setProjectReviewsList(res.data || []);
    } catch (e) {
      console.error(e);
      setProjectReviewsList([]);
    } finally {
      setLoadingTwoWay(false);
    }
  };

  const tabLabels = [
    { label: 'Pending Reviews', count: pendingProjects.length },
    { label: 'Two-Way Project Reviews', count: completedProjects.length },
    { label: 'Reviews Given', count: givenReviews.length },
    { label: 'Reviews Received', count: receivedReviews.length },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: themeStyles.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 960, margin: '0 auto', color: themeStyles.cream }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Star color={themeStyles.primary} size={32} /> Two-Way Review & Rating System
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)' }}>
          Transparent mutual feedback for clients, team leaders, and all team freelancers after project completion.
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 4,
          borderBottom: `1px solid rgba(102,73,48,0.4)`,
          '& .MuiTab-root': { color: themeStyles.primary, textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: `${themeStyles.cream} !important` },
          '& .MuiTabs-indicator': { bgcolor: themeStyles.cream },
        }}
      >
        {tabLabels.map((t, i) => (
          <Tab
            key={i}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {t.label}
                {t.count > 0 && (
                  <Chip
                    label={t.count}
                    size="small"
                    sx={{ height: 18, fontSize: '0.7rem', bgcolor: i === tab ? themeStyles.brown : 'rgba(102,73,48,0.3)', color: themeStyles.cream }}
                  />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* TAB 0 — Pending Reviews */}
      {tab === 0 && (
        <Box>
          {pendingProjects.length === 0 ? (
            <Card sx={{ ...themeStyles.glass, p: 5, textAlign: 'center' }}>
              <CheckCircle2 size={48} color={themeStyles.primary} style={{ opacity: 0.5, marginBottom: 16 }} />
              <Typography variant="h6" sx={{ color: themeStyles.cream, mb: 1 }}>All caught up!</Typography>
              <Typography sx={{ color: 'rgba(255,219,187,0.5)' }}>No pending reviews. Complete a project to leave feedback.</Typography>
            </Card>
          ) : (
            <AnimatePresence>
              {pendingProjects.map(project => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                  <Card sx={{ mb: 3, ...themeStyles.glass, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', border: '1px solid rgba(153,126,103,0.4)' } }}>
                    <CardContent sx={{ p: 3 }}>
                      {reviewingProject?.id === project.id ? (
                        /* Inline Review Form */
                        <Box>
                          <Typography variant="h6" sx={{ color: themeStyles.cream, mb: 1 }}>
                            Reviewing: <strong>{project.title}</strong>
                          </Typography>
                          
                          {/* If Client reviewing Team project */}
                          {isClient && project.teamId && projectTeamMembers.length > 0 && (
                            <Box sx={{ my: 2.5, p: 2, bgcolor: 'rgba(153,126,103,0.1)', borderRadius: 2, border: '1px solid rgba(153,126,103,0.3)' }}>
                              <Typography variant="subtitle2" sx={{ color: '#FFDBBB', mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Users size={16} /> Team Review Options:
                              </Typography>
                              <FormControl fullWidth size="small">
                                <InputLabel sx={{ color: '#997E67' }}>Who are you rating?</InputLabel>
                                <Select
                                  value={selectedRevieweeId}
                                  label="Who are you rating?"
                                  onChange={e => setSelectedRevieweeId(e.target.value)}
                                  sx={{ color: '#FFDBBB', bgcolor: 'rgba(255,255,255,0.05)', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#664930' } }}
                                >
                                  <MenuItem value="ALL">
                                    ⭐ Entire Team ({projectTeamMembers.length} Members) — Batch Review
                                  </MenuItem>
                                  {projectTeamMembers.map(tm => (
                                    <MenuItem key={tm.id} value={tm.id}>
                                      👤 {tm.fullName || tm.email}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2.5 }}>
                            <Typography sx={{ color: 'rgba(255,219,187,0.8)', minWidth: 60 }}>Rating:</Typography>
                            <StarRating value={rating} onChange={setRating} />
                            <Typography sx={{ color: themeStyles.primary, fontWeight: 'bold' }}>{rating}/5</Typography>
                          </Box>

                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder={isClient
                              ? 'Share your experience working with this freelancer or team (code quality, communication, delivery)...'
                              : 'Share your feedback on this client (clear requirements, timely milestone release, collaboration)...'}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            variant="outlined"
                            sx={{
                              mb: 3,
                              '& .MuiOutlinedInput-root': {
                                color: themeStyles.cream,
                                '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                                '&:hover fieldset': { borderColor: themeStyles.primary },
                                '&.Mui-focused fieldset': { borderColor: themeStyles.cream },
                              }
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                              onClick={() => { setReviewingProject(null); setRating(5); setComment(''); }}
                              sx={{ color: 'rgba(255,219,187,0.6)' }}
                              disabled={submitting}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<Send size={16} />}
                              onClick={handleSubmitReview}
                              disabled={submitting || !rating}
                              sx={{ bgcolor: themeStyles.primary, color: '#0D0A07', fontWeight: 'bold', '&:hover': { bgcolor: themeStyles.cream } }}
                            >
                              {submitting ? 'Submitting…' : 'Submit Review'}
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        /* Project Card */
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ color: themeStyles.cream, mb: 0.5 }}>{project.title}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip label="Completed" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#4caf50', border: '1px solid #4caf5040' }} />
                              {project.teamId && (
                                <Chip label="👥 Team Project" size="small" sx={{ bgcolor: 'rgba(96,165,250,0.15)', color: '#60a5fa' }} />
                              )}
                              <Chip label={isClient ? 'Review Team / Freelancers' : 'Review Client'} size="small" sx={{ bgcolor: 'rgba(153,126,103,0.15)', color: themeStyles.primary }} />
                            </Box>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<MessageSquare size={16} />}
                            endIcon={<ArrowRight size={16} />}
                            onClick={() => handleOpenReview(project)}
                            sx={{ borderColor: themeStyles.primary, color: themeStyles.primary, '&:hover': { borderColor: themeStyles.cream, color: themeStyles.cream } }}
                          >
                            Leave Review
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Box>
      )}

      {/* TAB 1 — Two-Way Project Reviews View */}
      {tab === 1 && (
        <Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)', mb: 3 }}>
            Inspect full mutual feedback between Clients and Freelancers / Team Members for each completed project.
          </Typography>

          {completedProjects.length === 0 ? (
            <Card sx={{ ...themeStyles.glass, p: 5, textAlign: 'center' }}>
              <Typography sx={{ color: 'rgba(255,219,187,0.5)' }}>No completed projects yet.</Typography>
            </Card>
          ) : (
            completedProjects.map(proj => (
              <Card key={proj.id} sx={{ mb: 2.5, ...themeStyles.glass }}>
                <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: themeStyles.cream, fontWeight: 'bold' }}>
                      {proj.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.6)' }}>
                      Client: {proj.clientName || 'Client'} {proj.teamName ? `• Team: ${proj.teamName}` : ''}
                    </Typography>
                  </Box>

                  <Button
                    variant="outlined"
                    startIcon={<Eye size={16} />}
                    onClick={() => handleOpenTwoWayView(proj)}
                    sx={{ borderColor: '#60a5fa', color: '#60a5fa', '&:hover': { bgcolor: 'rgba(96,165,250,0.1)' } }}
                  >
                    View Two-Way Feedback
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}

      {/* TAB 2 — Reviews I've Given */}
      {tab === 2 && (
        <Box>
          {givenReviews.length === 0 ? (
            <Card sx={{ ...themeStyles.glass, p: 5, textAlign: 'center' }}>
              <Star size={48} color={themeStyles.primary} style={{ opacity: 0.4, marginBottom: 16 }} />
              <Typography sx={{ color: 'rgba(255,219,187,0.5)' }}>You haven't given any reviews yet.</Typography>
            </Card>
          ) : (
            givenReviews.map((review, i) => (
              <ReviewCard
                key={review.id || i}
                review={review}
                badge="Given by you"
                badgeColor={themeStyles.primary}
              />
            ))
          )}
        </Box>
      )}

      {/* TAB 3 — Reviews Received */}
      {tab === 3 && (
        <Box>
          {receivedReviews.length === 0 ? (
            <Card sx={{ ...themeStyles.glass, p: 5, textAlign: 'center' }}>
              <Star size={48} color="#2196f3" style={{ opacity: 0.4, marginBottom: 16 }} />
              <Typography sx={{ color: 'rgba(255,219,187,0.5)' }}>
                {isClient ? 'No reviews received from freelancers yet.' : 'No reviews received from clients yet.'}
              </Typography>
            </Card>
          ) : (
            <Box>
              {/* Average Rating Summary */}
              {receivedReviews.length > 0 && (() => {
                const avg = (receivedReviews.reduce((s, r) => s + (r.rating || 0), 0) / receivedReviews.length).toFixed(1);
                return (
                  <Card sx={{ mb: 3, ...themeStyles.glass, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Typography variant="h2" sx={{ color: themeStyles.cream, fontWeight: 'bold' }}>{avg}</Typography>
                      <Box>
                        <StarRating value={parseFloat(avg)} readOnly />
                        <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.6)', mt: 0.5 }}>
                          Based on {receivedReviews.length} review{receivedReviews.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                );
              })()}

              {receivedReviews.map((review, i) => (
                <ReviewCard
                  key={review.id || i}
                  review={review}
                  badge="Received"
                  badgeColor="#2196f3"
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* ── Two-Way Feedback Modal ── */}
      <Dialog 
        open={twoWayModalOpen} 
        onClose={() => setTwoWayModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, color: '#FFDBBB', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <ShieldCheck color="#10b981" size={24} />
          Two-Way Feedback: {selectedProjectForTwoWay?.title}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(153,126,103,0.2)' }}>
          {loadingTwoWay ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: themeStyles.primary }} />
            </Box>
          ) : projectReviewsList.length === 0 ? (
            <Typography sx={{ color: 'rgba(255,219,187,0.6)', textAlign: 'center', p: 4 }}>
              No reviews have been submitted for this project yet.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {projectReviewsList.map((rev, idx) => (
                <Box 
                  key={rev.id || idx}
                  sx={{ 
                    p: 2.5, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(153,126,103,0.25)' 
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: themeStyles.brown, width: 32, height: 32 }}>
                        {(rev.reviewerName || 'U')[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: themeStyles.cream }}>
                          {rev.reviewerName || 'Reviewer'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.6)' }}>
                          Reviewed: <strong>{rev.revieweeName || 'Counterparty'}</strong>
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <StarRating value={rev.rating} readOnly />
                      <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.4)', display: 'block' }}>
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                      </Typography>
                    </Box>
                  </Box>

                  {rev.comment && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.85)', fontStyle: 'italic', mt: 1.5, pl: 1, borderLeft: `3px solid ${themeStyles.primary}` }}>
                      "{rev.comment}"
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoWayModalOpen(false)} sx={{ color: themeStyles.cream }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
