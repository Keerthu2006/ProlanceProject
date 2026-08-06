import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, 
  Modal, Backdrop, Fade, CircularProgress, Button, Stack
} from '@mui/material';
import { FileText, CheckCircle2, Clock, DollarSign, Eye, AlertCircle } from 'lucide-react';

const ContractsPage = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = user?.role === 'ROLE_FREELANCER' ? '/projects/assigned' : '/projects/mine';
        const response = await api.get(endpoint);
        const allProjects = response.data.content || response.data || [];
        // Assuming response is an array or paginated object with content
        const activeContracts = allProjects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'UNDER_REVIEW' || p.status === 'COMPLETED');
        setContracts(activeContracts);
      } catch (err) {
        setError('Failed to fetch contracts. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const handleOpenModal = (contract) => setSelectedContract(contract);
  const handleCloseModal = () => setSelectedContract(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: '#997E67' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
      <Typography variant="h4" sx={{ color: '#FFDBBB', mb: 1, fontWeight: 'bold' }}>
        Active Contracts
      </Typography>
      <Typography variant="body1" sx={{ color: 'rgba(255,219,187,0.7)', mb: 4 }}>
        Manage your ongoing and completed projects
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 4, bgcolor: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
          <AlertCircle color="#ff4444" />
          <Typography color="#ff4444">{error}</Typography>
        </Paper>
      )}

      {contracts.length === 0 ? (
        <Box sx={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          p: 8, bgcolor: 'rgba(255,219,187,0.02)', borderRadius: 4, border: '1px dashed rgba(153,126,103,0.3)' 
        }}>
          <Typography variant="h1" sx={{ mb: 2 }}>📝</Typography>
          <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 1 }}>No Contracts Yet</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.6)' }}>
            {user?.role === 'ROLE_FREELANCER' ? "You haven't been assigned to any projects yet." : "You haven't started any projects yet."}
          </Typography>
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            bgcolor: 'rgba(255,219,187,0.03)', 
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            border: '1px solid rgba(153,126,103,0.2)',
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHead sx={{ background: 'linear-gradient(90deg, rgba(153,126,103,0.1) 0%, rgba(255,219,187,0.05) 100%)' }}>
              <TableRow>
                <TableCell sx={{ color: '#FFDBBB', fontWeight: 'bold', borderBottom: '1px solid rgba(153,126,103,0.2)' }}>Project Title</TableCell>
                <TableCell sx={{ color: '#FFDBBB', fontWeight: 'bold', borderBottom: '1px solid rgba(153,126,103,0.2)' }}>Budget</TableCell>
                <TableCell sx={{ color: '#FFDBBB', fontWeight: 'bold', borderBottom: '1px solid rgba(153,126,103,0.2)' }}>Duration (Days)</TableCell>
                <TableCell sx={{ color: '#FFDBBB', fontWeight: 'bold', borderBottom: '1px solid rgba(153,126,103,0.2)' }}>Status</TableCell>
                <TableCell align="center" sx={{ color: '#FFDBBB', fontWeight: 'bold', borderBottom: '1px solid rgba(153,126,103,0.2)' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody component={motion.tbody} variants={containerVariants} initial="hidden" animate="show">
              {contracts.map((contract) => (
                <TableRow 
                  key={contract.id}
                  component={motion.tr}
                  variants={itemVariants}
                  sx={{ 
                    '&:hover': { bgcolor: 'rgba(153,126,103,0.08)' },
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <TableCell sx={{ color: '#E0E0E0', borderBottom: '1px solid rgba(153,126,103,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FileText size={18} color="#997E67" />
                      {contract.title}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#E0E0E0', borderBottom: '1px solid rgba(153,126,103,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DollarSign size={16} color="#997E67" />
                      ${contract.budgetMin} - ${contract.budgetMax}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#E0E0E0', borderBottom: '1px solid rgba(153,126,103,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Clock size={16} color="#997E67" />
                      {contract.durationDays || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#E0E0E0', borderBottom: '1px solid rgba(153,126,103,0.1)' }}>
                    <Chip 
                      label={contract.status.replace('_', ' ')}
                      size="small"
                      icon={contract.status === 'COMPLETED' ? <CheckCircle2 size={14} /> : undefined}
                      sx={{ 
                        bgcolor: contract.status === 'COMPLETED' ? 'rgba(76,175,80,0.15)' : contract.status === 'UNDER_REVIEW' ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                        color: contract.status === 'COMPLETED' ? '#4caf50' : contract.status === 'UNDER_REVIEW' ? '#2196f3' : '#ff9800',
                        border: `1px solid ${contract.status === 'COMPLETED' ? 'rgba(76,175,80,0.5)' : contract.status === 'UNDER_REVIEW' ? 'rgba(33,150,243,0.5)' : 'rgba(255,152,0,0.5)'}`
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(153,126,103,0.1)' }}>
                    <IconButton 
                      onClick={() => handleOpenModal(contract)}
                      sx={{ color: '#997E67', '&:hover': { color: '#FFDBBB', bgcolor: 'rgba(255,219,187,0.1)' } }}
                    >
                      <Eye size={20} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Contract Detail Modal */}
      <Modal
        open={Boolean(selectedContract)}
        onClose={handleCloseModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: { timeout: 500, sx: { backgroundColor: 'rgba(0,0,0,0.8)' } },
        }}
      >
        <Fade in={Boolean(selectedContract)}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 500 },
            bgcolor: '#0D0A07',
            border: '1px solid rgba(153,126,103,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            p: 4, borderRadius: 4,
            outline: 'none'
          }}>
            {selectedContract && (
              <>
                <Typography variant="h5" sx={{ color: '#FFDBBB', mb: 2, fontWeight: 'bold' }}>
                  {selectedContract.title}
                </Typography>
                
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,219,187,0.05)', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#E0E0E0', mb: 1 }}>
                    {selectedContract.description || 'No description provided.'}
                  </Typography>
                </Box>

                <Stack spacing={2} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255,219,187,0.7)' }}>Budget</Typography>
                    <Typography sx={{ color: '#FFDBBB', fontWeight: 'bold' }}>${selectedContract.budgetMin} - ${selectedContract.budgetMax}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255,219,187,0.7)' }}>Duration</Typography>
                    <Typography sx={{ color: '#FFDBBB' }}>{selectedContract.durationDays} days</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: 'rgba(255,219,187,0.7)' }}>Status</Typography>
                    <Chip 
                      label={selectedContract.status === 'IN_PROGRESS' ? 'Active' : 'Completed'}
                      size="small"
                      sx={{ 
                        bgcolor: selectedContract.status === 'IN_PROGRESS' ? 'rgba(52,211,153,0.2)' : 'rgba(153,126,103,0.2)',
                        color: selectedContract.status === 'IN_PROGRESS' ? '#34d399' : '#FFDBBB'
                      }}
                    />
                  </Box>
                </Stack>

                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={handleCloseModal}
                  sx={{ 
                    borderColor: '#997E67', color: '#FFDBBB',
                    '&:hover': { borderColor: '#FFDBBB', bgcolor: 'rgba(255,219,187,0.05)' }
                  }}
                >
                  Close
                </Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ContractsPage;
