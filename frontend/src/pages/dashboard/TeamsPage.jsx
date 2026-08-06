import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Typography, Paper, Grid, Avatar, Chip, 
  InputAdornment, TextField, Button, CircularProgress,
  Snackbar, Alert
} from '@mui/material';
import { Users, Search, Star, Briefcase, Send, Target } from 'lucide-react';

const TeamsPage = () => {
  const { user } = useAuth();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        // Using the requested GET /freelancers endpoint
        const res = await api.get('/freelancers');
        // Handle paginated or array response
        const data = res.data.content || res.data || [];
        setFreelancers(data);
      } catch (err) {
        console.error("Failed to fetch freelancers", err);
        setToast({ open: true, message: 'Failed to load freelancers.', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFreelancers();
  }, []);

  const handleInvite = (freelancerId, name) => {
    // Mocking the invite behavior as requested
    setToast({ 
      open: true, 
      message: `Invitation sent to ${name}! They will be notified.`, 
      severity: 'success' 
    });
  };

  const handleCloseToast = () => setToast({ ...toast, open: false });

  const filteredFreelancers = freelancers.filter(f => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    // Check skills
    const skillsMatch = f.skills && f.skills.some(skill => skill.toLowerCase().includes(searchLower));
    // Check name or headline
    const nameMatch = f.fullName?.toLowerCase().includes(searchLower) || f.user?.fullName?.toLowerCase().includes(searchLower);
    const headlineMatch = f.headline?.toLowerCase().includes(searchLower);
    return skillsMatch || nameMatch || headlineMatch;
  });

  const getInitials = (name) => {
    if (!name) return 'F';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#FFDBBB', mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Users size={28} />
            Browse Freelancers & Teams
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,219,187,0.7)' }}>
            Find the perfect talent for your next project
          </Typography>
        </Box>

        <TextField
          placeholder="Search by skill, name..."
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} color="#997E67" />
              </InputAdornment>
            ),
            sx: {
              bgcolor: 'rgba(255,219,187,0.05)',
              color: '#E0E0E0',
              borderRadius: 3,
              border: '1px solid rgba(153,126,103,0.3)',
              '&:hover': { border: '1px solid rgba(153,126,103,0.6)' },
              '&.Mui-focused': { border: '1px solid #FFDBBB' },
              '& fieldset': { border: 'none' }
            }
          }}
          sx={{ width: { xs: '100%', md: '300px' } }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress sx={{ color: '#997E67' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredFreelancers.length > 0 ? (
              filteredFreelancers.map((freelancer, index) => {
                const displayName = freelancer.fullName || freelancer.user?.fullName || 'Anonymous Freelancer';
                const hourlyRate = freelancer.hourlyRate || freelancer.hourlyRateMin || 0;
                
                return (
                  <Grid item xs={12} sm={6} lg={4} key={freelancer.id || index}>
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="show"
                      layout
                    >
                      <Paper sx={{
                        p: 3,
                        bgcolor: 'rgba(255,219,187,0.03)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 4,
                        border: '1px solid rgba(153,126,103,0.15)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
                          border: '1px solid rgba(153,126,103,0.4)'
                        },
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                      }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Avatar sx={{ 
                            width: 60, height: 60, 
                            bgcolor: '#997E67', color: '#0D0A07', 
                            fontWeight: 'bold', fontSize: '1.2rem' 
                          }}>
                            {getInitials(displayName)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ color: '#FFDBBB', fontWeight: 'bold', lineHeight: 1.2 }}>
                              {displayName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#997E67', mb: 0.5 }}>
                              {freelancer.headline || 'Professional Freelancer'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,219,187,0.6)' }}>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Star size={12} color="#f59e0b" />
                                {freelancer.rating ? parseFloat(freelancer.rating).toFixed(1) : 'New'}
                              </Typography>
                              <Typography variant="caption">•</Typography>
                              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Briefcase size={12} />
                                ${hourlyRate}/hr
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ mt: 1, mb: 3, flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {freelancer.bio || 'Available for exciting new projects. Contact to discuss your requirements.'}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(freelancer.skills || ['React', 'Node.js', 'Design']).slice(0, 4).map((skill, i) => (
                              <Chip 
                                key={i} 
                                label={skill} 
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(153,126,103,0.1)', 
                                  color: '#E0E0E0',
                                  border: '1px solid rgba(153,126,103,0.3)' 
                                }} 
                              />
                            ))}
                            {freelancer.skills && freelancer.skills.length > 4 && (
                              <Chip 
                                label={`+${freelancer.skills.length - 4}`} 
                                size="small"
                                sx={{ bgcolor: 'transparent', color: '#997E67' }} 
                              />
                            )}
                          </Box>
                        </Box>

                        {user?.role === 'ROLE_CLIENT' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Send size={16} />}
                            onClick={() => handleInvite(freelancer.id, displayName)}
                            sx={{
                              borderColor: 'rgba(153,126,103,0.5)',
                              color: '#FFDBBB',
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: '#FFDBBB',
                                bgcolor: 'rgba(255,219,187,0.1)'
                              }
                            }}
                          >
                            Invite to Project
                          </Button>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Box sx={{ 
                  textAlign: 'center', p: 6, 
                  bgcolor: 'rgba(255,219,187,0.02)', 
                  borderRadius: 4, border: '1px dashed rgba(153,126,103,0.3)' 
                }}>
                  <Target size={48} color="rgba(153,126,103,0.5)" style={{ marginBottom: 16 }} />
                  <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 1 }}>No Freelancers Found</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.6)' }}>
                    Try adjusting your search criteria
                  </Typography>
                </Box>
              </Grid>
            )}
          </AnimatePresence>
        </Grid>
      )}

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%', bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeamsPage;
