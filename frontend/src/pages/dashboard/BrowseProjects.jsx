import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Grid, Card, CardContent, Typography, Button, TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, CircularProgress, Skeleton, Divider } from '@mui/material';
import { Search, Filter, DollarSign, Calendar, Users, Tag, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const mockProjects = [
  { id: 1, title: 'E-commerce React Frontend', client: 'Client492', category: 'Web Dev', budget: '$1000 - $2000', deadline: '2026-08-15', bids: 4, skills: ['React', 'Node.js', 'Redux', 'MUI', 'Stripe'] },
  { id: 2, title: 'AI Chatbot Integration', client: 'Client112', category: 'AI/ML', budget: '$3000', deadline: '2026-09-01', bids: 12, skills: ['Python', 'OpenAI API', 'React'] },
  { id: 3, title: 'Mobile App for Delivery', client: 'Client881', category: 'Mobile', budget: '$5000 - $8000', deadline: '2026-10-15', bids: 8, skills: ['Flutter', 'Firebase', 'Google Maps API'] },
  { id: 4, title: 'UI/UX Redesign', client: 'Client333', category: 'UI/UX Design', budget: '$800', deadline: '2026-07-30', bids: 15, skills: ['Figma', 'Adobe XD', 'Prototyping'] },
  { id: 5, title: 'Smart Contract Audit', client: 'Client999', category: 'Blockchain', budget: '$4000', deadline: '2026-08-10', bids: 2, skills: ['Solidity', 'Security', 'Ethereum'] },
  { id: 6, title: 'SEO Optimization', client: 'Client002', category: 'Marketing', budget: '$500', deadline: '2026-08-01', bids: 6, skills: ['SEO', 'Google Analytics', 'Content'] },
  { id: 7, title: 'Data Pipeline Setup', client: 'Client777', category: 'Data Science', budget: '$2500', deadline: '2026-09-15', bids: 1, skills: ['Python', 'Airflow', 'AWS', 'SQL'] },
  { id: 8, title: 'Cybersecurity Assessment', client: 'Client555', category: 'Cybersecurity', budget: '$6000', deadline: '2026-08-20', bids: 0, skills: ['Pen Testing', 'Network Security', 'Report Writing'] }
];

const categories = ['All', 'Web Dev', 'Mobile', 'AI/ML', 'UI/UX Design', 'Marketing', 'Data Science', 'Blockchain', 'Cloud', 'Cybersecurity'];

export default function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/projects/open');
        setProjects(res.data);
      } catch (err) {
        setProjects(mockProjects);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (categoryFilter === 'All' || p.category === categoryFilter)
  );

  const handleBidSubmit = () => {
    toast.success('Bid placed successfully!');
    setBidModalOpen(false);
    setBidAmount('');
    setCoverLetter('');
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      color: '#FFDBBB',
      '& fieldset': { borderColor: '#664930' },
      '&:hover fieldset': { borderColor: '#997E67' },
      '&.Mui-focused fieldset': { borderColor: '#997E67' },
    },
    '& .MuiInputLabel-root': { color: '#997E67' },
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#0D0A07', minHeight: '100vh', color: '#FFDBBB' }}>
      <Typography variant="h4" sx={{ color: '#997E67', fontWeight: 'bold', mb: 4 }}>Browse Projects</Typography>
      
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
          sx={{ ...textFieldStyle, minWidth: 150 }}
        >
          {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          Array.from(new Array(6)).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
                <CardContent>
                  <Skeleton variant="text" width="80%" height={30} sx={{ bgcolor: '#664930' }} />
                  <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: '#664930' }} />
                  <Skeleton variant="rectangular" height={60} sx={{ bgcolor: '#664930', mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          filteredProjects.map((project, idx) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" sx={{ color: '#FFDBBB', fontWeight: 'bold' }}>{project.title}</Typography>
                      <Chip label={project.category} size="small" sx={{ bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#997E67', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Users size={16} /> Client: {project.client}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Typography variant="body2" sx={{ color: '#FFDBBB', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DollarSign size={16} color="#997E67" /> {project.budget}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FFDBBB', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Calendar size={16} color="#997E67" /> {project.deadline}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      {project.skills.slice(0, 3).map(s => (
                        <Chip key={s} label={s} size="small" sx={{ mr: 1, mb: 1, color: '#FFDBBB', borderColor: '#664930' }} variant="outlined" />
                      ))}
                      {project.skills.length > 3 && (
                        <Chip label={`+${project.skills.length - 3} more`} size="small" sx={{ mb: 1, color: '#997E67', borderColor: 'transparent' }} variant="outlined" />
                      )}
                    </Box>
                    
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Button 
                        variant="contained" 
                        fullWidth 
                        sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}
                        onClick={() => { setSelectedProject(project); setBidModalOpen(true); }}
                      >
                        Place Bid
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))
        )}
      </Grid>

      {/* Bid Modal */}
      <Dialog open={bidModalOpen} onClose={() => setBidModalOpen(false)} PaperProps={{ sx: { bgcolor: '#0D0A07', border: '1px solid #664930', borderRadius: 2, minWidth: 400, color: '#FFDBBB' } }}>
        <DialogTitle sx={{ color: '#997E67', borderBottom: '1px solid #664930' }}>Place Bid for: {selectedProject?.title}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField 
            fullWidth 
            label="Proposed Amount ($)" 
            type="number" 
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            sx={{ ...textFieldStyle, mb: 3 }} 
          />
          <TextField 
            fullWidth 
            multiline 
            rows={5}
            label="Cover Letter" 
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            sx={textFieldStyle} 
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #664930' }}>
          <Button onClick={() => setBidModalOpen(false)} sx={{ color: '#FFDBBB' }}>Cancel</Button>
          <Button variant="contained" onClick={handleBidSubmit} startIcon={<Send size={16}/>} sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}>Submit Bid</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
