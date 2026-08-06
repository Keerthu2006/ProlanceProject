import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Rating, 
  TextField, 
  CircularProgress,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const ReviewsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [error, setError] = useState('');
  const [reviewingProject, setReviewingProject] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch completed projects for review
      const endpoint = user?.role === 'ROLE_CLIENT' ? '/projects/mine' : '/projects/assigned';
      const response = await api.get(endpoint);
      const allProjects = response.data.content || response.data || [];
      
      const completed = allProjects.filter(p => p.status === 'COMPLETED');

      // 2. Load stored reviews from localStorage
      const storageKey = `teamlance_reviews_${user?.email}`;
      const storedReviewsStr = localStorage.getItem(storageKey);
      const storedReviews = storedReviewsStr ? JSON.parse(storedReviewsStr) : [];
      setGivenReviews(storedReviews);

      // 3. Filter pending projects (those not yet reviewed)
      const reviewedProjectIds = storedReviews.map(r => r.projectId);
      const pending = completed.filter(p => !reviewedProjectIds.includes(p.id));
      
      setPendingProjects(pending);

      // 4. Fetch received reviews from backend (for Freelancers)
      if (user?.role === 'ROLE_FREELANCER') {
        try {
          const profileRes = await api.get('/freelancers/me');
          if (profileRes.data?.id) {
            const revRes = await api.get(`/freelancers/${profileRes.data.id}/reviews`);
            setReceivedReviews(revRes.data || []);
          }
        } catch (e) {
          console.warn('Could not fetch received reviews', e);
        }
      }

    } catch (err) {
      console.error('Failed to load review data:', err);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      setToast({ open: true, message: 'Please select a rating', severity: 'error' });
      return;
    }
    
    try {
      // API call (if backend supports it, else it will fail but we'll try)
      try {
         const targetId = user?.role === 'ROLE_CLIENT' ? reviewingProject.hiredFreelancerId : reviewingProject.client?.id;
         await api.post(`/projects/${reviewingProject.id}/reviews`, { 
            revieweeId: targetId,
            rating, 
            comment 
         });
      } catch (apiErr) {
         console.warn('API submission failed, storing locally', apiErr);
      }

      // Store in localStorage
      const newReview = {
        id: Date.now(),
        projectId: reviewingProject.id,
        projectTitle: reviewingProject.title,
        rating,
        comment,
        date: new Date().toISOString()
      };
      
      const storageKey = `teamlance_reviews_${user?.email}`;
      const updatedReviews = [newReview, ...givenReviews];
      localStorage.setItem(storageKey, JSON.stringify(updatedReviews));
      
      setGivenReviews(updatedReviews);
      setPendingProjects(prev => prev.filter(p => p.id !== reviewingProject.id));
      
      setToast({ open: true, message: 'Review submitted successfully!', severity: 'success' });
      setReviewingProject(null);
      setRating(0);
      setComment('');
    } catch (err) {
      setToast({ open: true, message: 'Failed to submit review.', severity: 'error' });
    }
  };

  const handleCloseToast = () => setToast({ ...toast, open: false });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#997E67' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto', color: '#FFDBBB' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
        <Star color="#997E67" size={32} /> Reviews & Ratings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff8a80' }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
        
        {/* Pending Reviews Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#997E67' }}>
            <Clock size={20} /> Pending Reviews ({pendingProjects.length})
          </Typography>
          
          <AnimatePresence>
            {pendingProjects.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card sx={{ bgcolor: 'rgba(255,219,187,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(153,126,103,0.2)', borderRadius: 3, p: 4, textAlign: 'center' }}>
                  <CheckCircle2 size={48} color="#997E67" style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <Typography color="text.secondary" sx={{ color: 'rgba(255,219,187,0.6)' }}>
                    You're all caught up! No pending reviews.
                  </Typography>
                </Card>
              </motion.div>
            ) : (
              pendingProjects.map((project) => (
                <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                  <Card sx={{ 
                    mb: 2, 
                    bgcolor: 'rgba(255,219,187,0.05)', 
                    backdropFilter: 'blur(10px)', 
                    border: '1px solid rgba(153,126,103,0.2)', 
                    borderRadius: 3,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', border: '1px solid rgba(153,126,103,0.5)' }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {reviewingProject?.id === project.id ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Typography variant="h6" sx={{ color: '#FFDBBB' }}>Reviewing: {project.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'rgba(255,219,187,0.8)' }}>Rating:</Typography>
                            <Rating 
                              value={rating} 
                              onChange={(event, newValue) => setRating(newValue)} 
                              sx={{ 
                                '& .MuiRating-iconFilled': { color: '#997E67' },
                                '& .MuiRating-iconEmpty': { color: 'rgba(153,126,103,0.3)' }
                              }} 
                            />
                          </Box>
                          <TextField
                            multiline
                            rows={3}
                            placeholder="Share your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            variant="outlined"
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                color: '#FFDBBB',
                                '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                                '&:hover fieldset': { borderColor: 'rgba(153,126,103,0.6)' },
                                '&.Mui-focused fieldset': { borderColor: '#997E67' },
                              },
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 1 }}>
                            <Button 
                              onClick={() => { setReviewingProject(null); setRating(0); setComment(''); }}
                              sx={{ color: 'rgba(255,219,187,0.7)' }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="contained" 
                              onClick={handleSubmitReview}
                              sx={{ 
                                background: 'linear-gradient(45deg, #664930, #997E67)', 
                                color: '#FFDBBB',
                                '&:hover': { background: 'linear-gradient(45deg, #997E67, #664930)' }
                              }}
                            >
                              Submit Review
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 1 }}>{project.title}</Typography>
                            <Chip label="Completed" size="small" sx={{ bgcolor: 'rgba(153,126,103,0.2)', color: '#997E67' }} />
                          </Box>
                          <Button 
                            variant="outlined" 
                            startIcon={<MessageSquare size={18} />}
                            onClick={() => setReviewingProject(project)}
                            sx={{ 
                              borderColor: '#997E67', 
                              color: '#997E67',
                              '&:hover': { borderColor: '#FFDBBB', color: '#FFDBBB' }
                            }}
                          >
                            Leave Review
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </Box>

        {/* Given Reviews Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#997E67' }}>
            <Star size={20} /> My Reviews Given
          </Typography>
          
          {givenReviews.length === 0 ? (
            <Card sx={{ bgcolor: 'rgba(255,219,187,0.02)', backdropFilter: 'blur(10px)', border: '1px dashed rgba(153,126,103,0.2)', borderRadius: 3, p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary" sx={{ color: 'rgba(255,219,187,0.4)' }}>
                You haven't given any reviews yet.
              </Typography>
            </Card>
          ) : (
            givenReviews.map((review, index) => (
              <motion.div key={review.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                <Card sx={{ mb: 2, bgcolor: 'rgba(13,10,7,0.6)', border: '1px solid rgba(153,126,103,0.1)', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: '#FFDBBB', fontWeight: 'bold', mb: 1 }}>
                      {review.projectTitle}
                    </Typography>
                    <Rating 
                      value={review.rating} 
                      readOnly 
                      size="small"
                      sx={{ mb: 1, '& .MuiRating-iconFilled': { color: '#997E67' } }} 
                    />
                    {review.comment && (
                      <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.8)', mt: 1, fontStyle: 'italic', bgcolor: 'rgba(255,219,187,0.03)', p: 1.5, borderRadius: 1 }}>
                        "{review.comment}"
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.4)', display: 'block', mt: 2 }}>
                      {new Date(review.date).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}

          {/* Received Reviews Section for Freelancers */}
          {user?.role === 'ROLE_FREELANCER' && (
            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: '#997E67' }}>
                <Star size={20} /> Reviews Received
              </Typography>
              
              {receivedReviews.length === 0 ? (
                <Card sx={{ bgcolor: 'rgba(255,219,187,0.02)', backdropFilter: 'blur(10px)', border: '1px dashed rgba(153,126,103,0.2)', borderRadius: 3, p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary" sx={{ color: 'rgba(255,219,187,0.4)' }}>
                    No reviews received from clients yet.
                  </Typography>
                </Card>
              ) : (
                receivedReviews.map((review, index) => (
                  <motion.div key={review.id || index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                    <Card sx={{ mb: 2, bgcolor: 'rgba(33,150,243,0.08)', border: '1px solid rgba(33,150,243,0.2)', borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                            {review.project?.title || 'Client Project'}
                          </Typography>
                          <Chip label="Received" size="small" sx={{ bgcolor: 'rgba(33,150,243,0.1)', color: '#2196f3' }} />
                        </Box>
                        
                        <Rating 
                          value={review.rating} 
                          readOnly 
                          size="small"
                          sx={{ mb: 1, '& .MuiRating-iconFilled': { color: '#2196f3' } }} 
                        />
                        {review.comment && (
                          <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.9)', mt: 1, fontStyle: 'italic', bgcolor: 'rgba(255,219,187,0.03)', p: 1.5, borderRadius: 1 }}>
                            "{review.comment}"
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.5)', display: 'block', mt: 2 }}>
                          From: {review.reviewer?.fullName || 'Client'} • {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </Box>
          )}
        </Box>

      </Box>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%', bgcolor: toast.severity === 'success' ? '#2e7d32' : '#d32f2f', color: '#fff' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReviewsPage;
