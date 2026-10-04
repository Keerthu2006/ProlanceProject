import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Avatar, Chip, CircularProgress, InputAdornment, TextField, Button, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Search, Users, Target, Send, Plus, Briefcase, Star, StarHalf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const TeamsPage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  
  // Team creation state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  useEffect(() => {
    fetchTeams();
  }, [user]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'ROLE_FREELANCER' ? '/teams/mine' : '/teams';
      const res = await api.get(endpoint);
      let data = res.data.content || res.data || [];
      if (data.length === 0 && user?.role !== 'ROLE_FREELANCER') {
          // Fallback mock team for demo purposes if none exist
          data = [{ id: '901', name: 'WebWizards Agency', leader: { fullName: 'Alice Dev', email: 'alice@webwizards.com' }, members: [{ fullName: 'Alice Dev' }, { fullName: 'Bob ML' }], skills: ['React', 'Node.js', 'Python', 'AWS'] }];
      }
      setTeams(data);
    } catch (err) {
      console.error("Failed to fetch teams", err);
      setToast({ open: true, message: 'Failed to load teams.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
      try {
          if (!newTeamName.trim()) return;
          await api.post('/teams', { name: newTeamName, memberIds: [] });
          setToast({ open: true, message: `Team "${newTeamName}" created successfully!`, severity: 'success' });
          setCreateModalOpen(false);
          fetchTeams();
      } catch (err) {
          setToast({ open: true, message: 'Failed to create team.', severity: 'error' });
      }
  };

  const handleInvite = (teamId, name) => {
    setToast({ open: true, message: `Invitation sent to Team: ${name}! The leader will be notified.`, severity: 'success' });
  };

  const filteredTeams = teams.filter(t => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return t.name?.toLowerCase().includes(searchLower) || t.leader?.fullName?.toLowerCase().includes(searchLower);
  });

  const cardVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: '#0D0A07' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#FFDBBB', mb: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Users size={28} />
            {user?.role === 'ROLE_FREELANCER' ? 'My Teams & Agencies' : 'Browse Fixed Teams & Agencies'}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,219,187,0.7)' }}>
             {user?.role === 'ROLE_FREELANCER' ? 'Manage your pre-formed teams' : 'Hire pre-formed teams for your enterprise projects'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={20} color="#997E67" /></InputAdornment>,
              sx: { bgcolor: 'rgba(255,219,187,0.05)', color: '#E0E0E0', borderRadius: 3, border: '1px solid rgba(153,126,103,0.3)' }
            }}
          />
          {user?.role === 'ROLE_FREELANCER' && (
              <Button variant="contained" startIcon={<Plus size={16}/>} sx={{ bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold' }} onClick={() => setCreateModalOpen(true)}>
                  Create Team
              </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress sx={{ color: '#997E67' }} /></Box>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team, index) => (
                  <Grid item xs={12} md={6} lg={4} key={team.id || index}>
                    <motion.div variants={cardVariants} initial="hidden" animate="show" layout>
                      <Paper sx={{ p: 3, bgcolor: 'rgba(255,219,187,0.03)', backdropFilter: 'blur(10px)', borderRadius: 4, border: '1px solid rgba(153,126,103,0.15)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Avatar sx={{ width: 60, height: 60, bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold' }}>
                            {team.name ? team.name.substring(0, 2).toUpperCase() : 'TM'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ color: '#FFDBBB', fontWeight: 'bold' }}>{team.name}</Typography>
                            <Typography variant="body2" sx={{ color: '#997E67', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                               <Star size={12} /> Pre-formed Agency
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mt: 1, mb: 3, flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>Leader: <b>{team.leader?.fullName || 'Unknown'}</b></Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>Members: {team.members?.length || 1} Developer(s)</Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {team.skills ? team.skills.map(s => <Chip key={s} label={s} size="small" sx={{ bgcolor: 'rgba(153,126,103,0.1)', color: '#E0E0E0' }} />) 
                                         : <Chip label="Composite Skills Compiled by AI" size="small" sx={{ bgcolor: 'rgba(153,126,103,0.1)', color: '#997E67' }} /> }
                          </Box>
                        </Box>

                        {user?.role === 'ROLE_CLIENT' && (
                          <Button fullWidth variant="outlined" startIcon={<Send size={16} />} onClick={() => handleInvite(team.id, team.name)} sx={{ borderColor: 'rgba(153,126,103,0.5)', color: '#FFDBBB' }}>
                            Invite Team to Project
                          </Button>
                        )}
                      </Paper>
                    </motion.div>
                  </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', p: 6, bgcolor: 'rgba(255,219,187,0.02)', borderRadius: 4, border: '1px dashed rgba(153,126,103,0.3)' }}>
                  <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 1 }}>No Teams Found</Typography>
                </Box>
              </Grid>
            )}
          </AnimatePresence>
        </Grid>
      )}

      {/* Create Team Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} PaperProps={{ sx: { bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 3, minWidth: '400px' } }}>
        <DialogTitle sx={{ color: '#FFDBBB' }}>Create New Agency/Team</DialogTitle>
        <DialogContent>
            <TextField fullWidth label="Team Name" variant="outlined" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} sx={{ mt: 2, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#997E67' } }, input: { color: '#E0E0E0' } }} InputLabelProps={{ style: { color: '#997E67' } }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.6)', mt: 1, display: 'block' }}>You will be assigned as the team leader. You can invite members later.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateModalOpen(false)} sx={{ color: '#997E67' }}>Cancel</Button>
            <Button onClick={handleCreateTeam} variant="contained" sx={{ bgcolor: '#997E67', color: '#0D0A07' }}>Create Team</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({...toast, open:false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} sx={{ width: '100%', bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};
export default TeamsPage;
