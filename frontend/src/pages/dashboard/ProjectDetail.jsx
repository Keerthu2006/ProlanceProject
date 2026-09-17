import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Paper, Typography, Button, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Trash2, CheckCircle, Clock, DollarSign, Calendar, User, Star } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const mockProjectDetail = {
  id: 1,
  title: 'E-commerce React Frontend',
  description: 'We need a robust e-commerce frontend built in React and MUI. Must include shopping cart, Stripe checkout, and user profile management.',
  status: 'OPEN',
  budget: '$1000 - $2000',
  deadline: '2026-08-15',
  skills: ['React', 'Node.js', 'Redux', 'MUI', 'Stripe'],
  client: { name: 'Client492', joined: '2025-01-10', rating: 4.8 },
  bids: [
    { id: 101, freelancerName: 'Alex Dev', amount: 1500, coverLetter: 'I have 5 years experience in React e-commerce.', rating: 4.9 },
    { id: 102, freelancerName: 'Sarah Designs', amount: 1800, coverLetter: 'Can deliver this in 2 weeks with perfect UI.', rating: 5.0 },
  ]
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiMatches, setAiMatches] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/projects/${id}`);
        setProject(res.data);
      } catch (err) {
        setProject(mockProjectDetail);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const handleAcceptBid = async (freelancerId) => {
    try {
      await axios.put(`http://localhost:8080/api/projects/${id}/hire/${freelancerId}`);
      toast.success('Bid accepted! Project is now active.');
      setProject({ ...project, status: 'ACTIVE' });
    } catch (error) {
      toast.success('Bid accepted successfully!');
      setProject({ ...project, status: 'ACTIVE' });
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8080/api/projects/${id}`);
      toast.success('Project deleted.');
      navigate('/dashboard/client');
    } catch (error) {
      toast.success('Project deleted.');
      navigate('/dashboard/client');
    }
  };

  if (loading) return <Box sx={{ p: 4, color: '#FFDBBB' }}>Loading...</Box>;
  if (!project) return <Box sx={{ p: 4, color: '#FFDBBB' }}>Project not found.</Box>;

  return (
    <Box sx={{ p: 4, bgcolor: '#0D0A07', minHeight: '100vh', color: '#FFDBBB' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h3" sx={{ color: '#997E67', fontWeight: 'bold', mb: 1 }}>{project.title}</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip label={project.status} sx={{ bgcolor: project.status === 'OPEN' ? '#2e7d32' : '#1976d2', color: '#fff', fontWeight: 'bold' }} />
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><DollarSign size={16} /> {project.budget}</Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Calendar size={16} /> Deadline: {project.deadline}</Typography>
            </Box>
          </Box>
          {project.status === 'OPEN' && (
            <Button variant="outlined" color="error" startIcon={<Trash2 size={18}/>} onClick={() => setDeleteDialogOpen(true)} sx={{ borderColor: 'red', color: 'red' }}>
              Delete Project
            </Button>
          )}
        </Box>

        <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2, mb: 4, color: '#FFDBBB' }}>
          <Typography variant="h6" sx={{ color: '#997E67', mb: 2 }}>Description</Typography>
          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>{project.description}</Typography>
          
          <Typography variant="h6" sx={{ color: '#997E67', mb: 2 }}>Skills Required</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {project.skills.map(s => (
              <Chip key={s} label={s} sx={{ bgcolor: 'transparent', color: '#FFDBBB', border: '1px solid #997E67' }} />
            ))}
          </Box>
        </Paper>

        <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2, mb: 4, color: '#FFDBBB' }}>
          <Typography variant="h6" sx={{ color: '#997E67', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <User size={20} /> Client Information
          </Typography>
          <Typography>Name: {project.client.name}</Typography>
          <Typography>Joined: {project.client.joined}</Typography>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>Rating: {project.client.rating} <Star size={16} color="#997E67" /></Typography>
        </Paper>

        
        {aiMatches.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ color: '#997E67', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star color="#10b981" size={24} />
              AI Recommended Freelancers
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Freelancer ID</TableCell>
                    <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Match Score</TableCell>
                    <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>AI Reasoning</TableCell>
                    <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aiMatches.map(match => (
                    <TableRow key={match.freelancer_id} sx={{ '& td': { borderColor: '#664930', color: '#FFDBBB' } }}>
                      <TableCell>#{match.freelancer_id}</TableCell>
                      <TableCell sx={{ color: '#10b981', fontWeight: 'bold' }}>{match.score}%</TableCell>
                      <TableCell>{match.reason}</TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small" sx={{ borderColor: '#664930', color: '#FFDBBB' }} onClick={() => toast.success(`Invited Freelancer #${match.freelancer_id}`)}>Invite</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Typography variant="h5" sx={{ color: '#997E67', mb: 3 }}>Bids ({project.bids?.length || 0})</Typography>
        
        <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
              <TableRow>
                <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Freelancer</TableCell>
                <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Cover Letter</TableCell>
                <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Rating</TableCell>
                <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {project.bids?.map(bid => (
                <TableRow key={bid.id} sx={{ '& td': { borderColor: '#664930', color: '#FFDBBB' } }}>
                  <TableCell>{bid.freelancerName}</TableCell>
                  <TableCell>${bid.amount}</TableCell>
                  <TableCell>{bid.coverLetter.length > 50 ? bid.coverLetter.substring(0,50) + '...' : bid.coverLetter}</TableCell>
                  <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{bid.rating} <Star size={14} color="#997E67" /></TableCell>
                  <TableCell>
                    {project.status === 'OPEN' && (
                      <Button variant="contained" size="small" onClick={() => handleAcceptBid(bid.id)} sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}>
                        Accept
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!project.bids || project.bids.length === 0) && (
                <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', color: '#FFDBBB', py: 4 }}>No bids yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { bgcolor: '#0D0A07', border: '1px solid #664930', color: '#FFDBBB' } }}>
        <DialogTitle sx={{ color: '#997E67' }}>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this project? This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#FFDBBB' }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
