import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Skeleton, Divider, Alert
} from '@mui/material';
import { Search, DollarSign, Calendar, Users, Tag, Send, Briefcase } from 'lucide-react';
import api from '../../api/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const categories = ['All', 'Web Dev', 'Mobile', 'AI/ML', 'UI/UX Design', 'Marketing', 'Data Science', 'Blockchain', 'Cloud', 'Cybersecurity'];

export default function BrowseProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/projects/open');
        setProjects(res.data || []);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('Failed to load projects. Please ensure you are logged in and the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Normalize field names: real API uses skillsRequired, budgetMin/Max; mock used skills, budget
  const normalizeProject = (p) => ({
    ...p,
    skills: p.skillsRequired || p.skills || [],
    budget: p.budgetMin != null
      ? (p.budgetMax && p.budgetMax !== p.budgetMin ? `$${p.budgetMin} – $${p.budgetMax}` : `$${p.budgetMin}`)
      : (p.budget || 'Negotiable'),
    deadline: p.dueDate
      ? new Date(p.dueDate).toLocaleDateString()
      : (p.durationDays ? `${p.durationDays} days` : p.deadline || 'Flexible'),
    client: p.clientName || p.ownerName || p.client?.fullName || p.client || 'Client',
    category: p.projectType || p.category || 'General',
  });

  const filteredProjects = projects
    .map(normalizeProject)
    .filter(p =>
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === 'All' || p.category === categoryFilter)
    );

  const handleBidSubmit = async () => {
    if (!bidAmount || !coverLetter.trim()) {
      toast.warning('Please fill in both your bid amount and cover letter.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/projects/${selectedProject.id}/apply`, {
        proposedAmount: parseFloat(bidAmount),
        coverLetter: coverLetter.trim(),
      });
      toast.success('🎉 Bid placed successfully!');
      setBidModalOpen(false);
      setBidAmount('');
      setCoverLetter('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place bid. You may have already bid on this project.');
    } finally {
      setSubmitting(false);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      color: '#FFDBBB',
      '& fieldset': { borderColor: '#664930' },
      '&:hover fieldset': { borderColor: '#997E67' },
      '&.Mui-focused fieldset': { borderColor: '#997E67' },
    },
    '& .MuiInputLabel-root': { color: '#997E67' },
    '& .MuiSelect-icon': { color: '#997E67' },
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#0D0A07', minHeight: '100vh', color: '#FFDBBB' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold', mb: 1 }}>
          Browse Projects
        </Typography>
        <Typography variant="body2" sx={{ color: '#997E67' }}>
          Find your next opportunity from {projects.length} open project{projects.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(211,47,47,0.1)', color: '#ff8a80', border: '1px solid rgba(211,47,47,0.3)' }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search projects..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ ...textFieldStyle, flexGrow: 1, minWidth: 200 }}
          InputProps={{ startAdornment: <Search size={20} color="#997E67" style={{ marginRight: 10 }} /> }}
        />
        <TextField
          select
          size="small"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ ...textFieldStyle, minWidth: 160 }}
          label="Category"
        >
          {categories.map(c => <MenuItem key={c} value={c} sx={{ color: '#FFDBBB', bgcolor: '#1a1208' }}>{c}</MenuItem>)}
        </TextField>
      </Box>

      {!loading && !error && filteredProjects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Briefcase size={48} color="#664930" style={{ marginBottom: 16, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ color: '#997E67', mb: 1 }}>No projects found</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(153,126,103,0.6)' }}>
            {searchTerm || categoryFilter !== 'All' ? 'Try adjusting your search filters.' : 'No open projects at this time. Check back later!'}
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {loading
          ? Array.from(new Array(6)).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
                <CardContent>
                  <Skeleton variant="text" width="80%" height={30} sx={{ bgcolor: 'rgba(102,73,48,0.4)' }} />
                  <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: 'rgba(102,73,48,0.3)', mt: 1 }} />
                  <Skeleton variant="rectangular" height={60} sx={{ bgcolor: 'rgba(102,73,48,0.2)', mt: 2, borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={36} sx={{ bgcolor: 'rgba(153,126,103,0.2)', mt: 2, borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))
          : filteredProjects.map((project, idx) => (
            <Grid item xs={12} sm={6} md={4} key={project.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{ height: '100%' }}
              >
                <Card sx={{
                  bgcolor: 'rgba(255,255,255,0.02)',
                  border: '1px solid #664930',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.2s, transform 0.2s',
                  '&:hover': { borderColor: '#997E67', transform: 'translateY(-2px)' }
                }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Typography variant="h6" sx={{ color: '#FFDBBB', fontWeight: 'bold', lineHeight: 1.3 }}>
                        {project.title}
                      </Typography>
                      <Chip
                        label={project.category}
                        size="small"
                        sx={{ bgcolor: '#664930', color: '#FFDBBB', fontWeight: 'bold', flexShrink: 0 }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#997E67', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Users size={14} /> {project.client}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DollarSign size={14} color="#34d399" /> {project.budget}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FFDBBB', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={14} color="#997E67" /> {project.deadline}
                      </Typography>
                    </Box>

                    {project.description && (
                      <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.6)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                        {project.description.length > 100 ? project.description.slice(0, 100) + '…' : project.description}
                      </Typography>
                    )}

                    <Box>
                      {project.skills.slice(0, 3).map(s => (
                        <Chip key={s} label={s} size="small" sx={{ mr: 0.5, mb: 0.5, color: '#FFDBBB', borderColor: '#664930' }} variant="outlined" />
                      ))}
                      {project.skills.length > 3 && (
                        <Chip label={`+${project.skills.length - 3}`} size="small" sx={{ mb: 0.5, color: '#997E67', borderColor: 'transparent' }} variant="outlined" />
                      )}
                    </Box>

                    <Box sx={{ mt: 'auto', pt: 1 }}>
                      <Divider sx={{ borderColor: 'rgba(102,73,48,0.3)', mb: 1.5 }} />
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<Send size={16} />}
                        sx={{ bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold', '&:hover': { bgcolor: '#FFDBBB' } }}
                        onClick={() => { setSelectedProject(project); setBidModalOpen(true); }}
                      >
                        Place Bid
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
      </Grid>

      {/* Bid Modal */}
      <Dialog
        open={bidModalOpen}
        onClose={() => { if (!submitting) { setBidModalOpen(false); setBidAmount(''); setCoverLetter(''); } }}
        PaperProps={{ sx: { bgcolor: '#0D0A07', border: '1px solid #664930', borderRadius: 2, minWidth: 440, color: '#FFDBBB' } }}
      >
        <DialogTitle sx={{ color: '#FFDBBB', borderBottom: '1px solid #664930', fontWeight: 'bold' }}>
          📋 Place Bid — {selectedProject?.title}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ p: 2, bgcolor: 'rgba(153,126,103,0.08)', borderRadius: 1, border: '1px solid rgba(102,73,48,0.3)' }}>
            <Typography variant="caption" sx={{ color: '#997E67' }}>Budget Range</Typography>
            <Typography variant="body1" sx={{ color: '#34d399', fontWeight: 'bold' }}>{selectedProject?.budget}</Typography>
          </Box>
          <TextField
            fullWidth
            label="Your Proposed Amount ($)"
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            sx={textFieldStyle}
            inputProps={{ min: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Cover Letter"
            placeholder="Describe your experience, why you're a great fit, and your approach to this project..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            sx={textFieldStyle}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #664930' }}>
          <Button onClick={() => { setBidModalOpen(false); setBidAmount(''); setCoverLetter(''); }} sx={{ color: '#997E67' }} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBidSubmit}
            startIcon={<Send size={16} />}
            disabled={submitting}
            sx={{ bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold', '&:hover': { bgcolor: '#FFDBBB' } }}
          >
            {submitting ? 'Submitting…' : 'Submit Bid'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
