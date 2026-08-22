import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Rating,
  TextField, CircularProgress, Chip, Snackbar, Alert, Avatar,
  Tabs, Tab, Divider, Badge
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, CheckCircle2, Clock, ArrowRight, Send } from 'lucide-react';
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
              <Avatar sx={{ width: 24, height: 24, bgcolor: themeStyles.brown, fontSize: '0.7rem' }}>
                {(review.reviewer?.fullName || review.reviewerName || '?')[0]}
              </Avatar>
              <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.6)' }}>
                By: {review.reviewer?.fullName || review.reviewerName || 'User'}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.4)' }}>
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : review.date ? new Date(review.date).toLocaleDateString() : ''}
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

  const [tab, setTab] = useState(0); // 0=pending, 1=given, 2=received
  const [loading, setLoading] = useState(true);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);

  const [reviewingProject, setReviewingProject] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Track reviewed project IDs locally so we don't show them as pending twice
  const [reviewedIds, setReviewedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`reviewed_${user?.email}`) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch completed projects (to show pending reviews)
      const endpoint = isClient ? '/projects/mine' : '/projects/assigned';
      const projRes = await api.get(endpoint);
      const allProjects = projRes.data?.content || projRes.data || [];
      const completed = allProjects.filter(p => p.status === 'COMPLETED');
      setPendingProjects(completed.filter(p => !reviewedIds.includes(p.id)));

      // 2. Fetch reviews I have GIVEN (from backend)
      try {
        const givenRes = await api.get('/projects/reviews/given');
        setGivenReviews(givenRes.data || []);
        // Merge with any localStorage-only reviews (for backwards compat)
        const lsKey = `teamlance_reviews_${user?.email}`;
        const ls = JSON.parse(localStorage.getItem(lsKey) || '[]');
        setGivenReviews(prev => {
          const backendIds = new Set(prev.map(r => r.id));
          return [...prev, ...ls.filter(r => !backendIds.has(r.id))];
        });
      } catch {
        const lsKey = `teamlance_reviews_${user?.email}`;
        setGivenReviews(JSON.parse(localStorage.getItem(lsKey) || '[]'));
      }

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

  const handleSubmitReview = async () => {
    if (!rating) {
      setToast({ open: true, message: 'Please select a rating', severity: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      // Determine reviewee: client reviews the hired freelancer, freelancer reviews the project client/owner
      const revieweeId = isClient
        ? reviewingProject.hiredFreelancerId
        : (reviewingProject.clientId || reviewingProject.ownerId);

      if (!revieweeId) {
        setToast({ open: true, message: 'Cannot determine who to review. Please try again.', severity: 'error' });
        setSubmitting(false);
        return;
      }

      await api.post(`/projects/${reviewingProject.id}/reviews`, {
        revieweeId,
        rating,
        comment
      });

      // Mark locally so it disappears from pending
      const newIds = [...reviewedIds, reviewingProject.id];
      setReviewedIds(newIds);
      localStorage.setItem(`reviewed_${user?.email}`, JSON.stringify(newIds));

      setToast({ open: true, message: '✅ Review submitted!', severity: 'success' });
      setReviewingProject(null);
      setRating(5);
      setComment('');
      loadData(); // refresh all data
    } catch (err) {
      // Still save locally even if API fails
      const lsKey = `teamlance_reviews_${user?.email}`;
      const newReview = {
        id: Date.now(),
        projectId: reviewingProject.id,
        projectTitle: reviewingProject.title,
        reviewerName: user?.fullName || user?.email,
        rating,
        comment,
        date: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem(lsKey) || '[]');
      localStorage.setItem(lsKey, JSON.stringify([newReview, ...existing]));

      const newIds = [...reviewedIds, reviewingProject.id];
      setReviewedIds(newIds);
      localStorage.setItem(`reviewed_${user?.email}`, JSON.stringify(newIds));

      setToast({ open: true, message: '✅ Review saved locally.', severity: 'success' });
      setReviewingProject(null);
      setRating(5);
      setComment('');
      setPendingProjects(prev => prev.filter(p => p.id !== reviewingProject.id));
    } finally {
      setSubmitting(false);
    }
  };

  const tabLabels = [
    { label: 'Pending', count: pendingProjects.length },
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
    <Box sx={{ p: 4, maxWidth: 900, margin: '0 auto', color: themeStyles.cream }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Star color={themeStyles.primary} size={32} /> Reviews & Ratings
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.6)' }}>
          {isClient ? 'Rate the freelancers you worked with and see your own ratings.' : 'Rate your clients and see what clients say about you.'}
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
              <Typography sx={{ color: 'rgba(255,219,187,0.5)' }}>No pending reviews. Complete a project to leave a review.</Typography>
            </Card>
          ) : (
            <AnimatePresence>
              {pendingProjects.map(project => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                  <Card sx={{ mb: 3, ...themeStyles.glass, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-3px)', border: '1px solid rgba(153,126,103,0.5)' } }}>
                    <CardContent sx={{ p: 3 }}>
                      {reviewingProject?.id === project.id ? (
                        /* Inline Review Form */
                        <Box>
                          <Typography variant="h6" sx={{ color: themeStyles.cream, mb: 3 }}>
                            Reviewing: <strong>{project.title}</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Typography sx={{ color: 'rgba(255,219,187,0.8)', minWidth: 60 }}>Rating:</Typography>
                            <StarRating value={rating} onChange={setRating} />
                            <Typography sx={{ color: themeStyles.primary, fontWeight: 'bold' }}>{rating}/5</Typography>
                          </Box>
                          <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder={isClient
                              ? 'How was working with this freelancer? Was the work delivered on time and as expected?'
                              : 'How was this client to work with? Clear communication, fair requirements, timely feedback?'}
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
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip label="Completed" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#4caf50', border: '1px solid #4caf5040' }} />
                              <Chip label={isClient ? 'Rate Freelancer' : 'Rate Client'} size="small" sx={{ bgcolor: 'rgba(153,126,103,0.15)', color: themeStyles.primary }} />
                            </Box>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<MessageSquare size={16} />}
                            endIcon={<ArrowRight size={16} />}
                            onClick={() => setReviewingProject(project)}
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

      {/* TAB 1 — Reviews I've Given */}
      {tab === 1 && (
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

      {/* TAB 2 — Reviews Received */}
      {tab === 2 && (
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

      <Snackbar open={toast.open} autoHideDuration={5000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
