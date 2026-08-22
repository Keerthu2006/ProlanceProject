import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Paper, Typography, Button, TextField, MenuItem, LinearProgress, CircularProgress, Chip, Autocomplete } from '@mui/material';
import { ChevronRight, ChevronLeft, Check, Target, FileText, Sparkles } from 'lucide-react';
import api from '../../api/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const categories = ['Web Dev', 'Mobile', 'AI/ML', 'UI/UX Design', 'Marketing', 'Data Science', 'Blockchain', 'Cloud', 'Cybersecurity', 'Other'];
const suggestedSkills = ['React', 'Node.js', 'Python', 'Java', 'Flutter', 'AI/ML', 'DevOps', 'AWS', 'Figma'];

export default function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    budgetType: 'Fixed',
    budgetAmount: '',
    deadline: '',
    description: '',
    skills: [],
    projectType: 'Individual Freelancer',
    teamSize: '2',
    numberOfMilestones: '1'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let bMin = 0;
      let bMax = 0;
      if (formData.budgetAmount) {
        const parts = formData.budgetAmount.replace(/[^0-9-]/g, '').split('-');
        bMin = parseFloat(parts[0]) || 0;
        bMax = parts.length > 1 ? (parseFloat(parts[1]) || 0) : bMin;
      }

      if (formData.deadline) {
        const d1 = new Date();
        d1.setHours(0, 0, 0, 0); // start of today
        const d2 = new Date(formData.deadline);
        if (d2 < d1) {
          toast.error('Project deadline must be a future date.');
          setLoading(false);
          return;
        }
      }

      let diffDays = 30;
      let dueDateIso = null;
      if (formData.deadline) {
        const d1 = new Date();
        const d2 = new Date(formData.deadline);
        const diffTime = d2.getTime() - d1.getTime();
        diffDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 30;
        dueDateIso = d2.toISOString();
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        budgetMin: bMin,
        budgetMax: bMax,
        skillsRequired: formData.skills,
        durationDays: diffDays,
        dueDate: dueDateIso,
        numberOfMilestones: parseInt(formData.numberOfMilestones) || 1,
        projectType: formData.projectType === 'Team (TeamLancer)' ? 'TEAM' : 'INDIVIDUAL',
        teamSize: formData.projectType === 'Team (TeamLancer)' ? parseInt(formData.teamSize) : null
      };

      await api.post('/projects', payload);
      toast.success('Project created successfully!');
      navigate('/dashboard/client');
    } catch (error) {
      toast.error('Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      color: '#FFDBBB',
      '& fieldset': { borderColor: '#664930' },
      '&:hover fieldset': { borderColor: '#997E67' },
      '&.Mui-focused fieldset': { borderColor: '#997E67' },
    },
    '& .MuiInputLabel-root': { color: '#997E67' },
    mb: 2
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0D0A07', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Paper elevation={24} sx={{ maxWidth: 700, w: '100%', p: 4, bgcolor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid #664930', borderRadius: 4, color: '#FFDBBB' }}>
        <Typography variant="h4" sx={{ color: '#997E67', fontWeight: 'bold', mb: 1, textAlign: 'center' }}>Create New Project</Typography>
        <Typography variant="body2" sx={{ color: '#FFDBBB', opacity: 0.7, mb: 4, textAlign: 'center' }}>Post a project and find the right talent</Typography>

        <LinearProgress variant="determinate" value={(step / 3) * 100} sx={{ mb: 4, bgcolor: '#0D0A07', '& .MuiLinearProgress-bar': { bgcolor: '#997E67' } }} />

        <AnimatePresence mode="wait">
          <motion.div key={step} initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }}>
            
            {step === 1 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Target size={20} color="#997E67" /> Basics
                </Typography>
                <TextField fullWidth label="Project Title" name="title" value={formData.title} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth select label="Category" name="category" value={formData.category} onChange={handleChange} sx={textFieldStyle}>
                  {categories.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
                <TextField fullWidth select label="Budget Type" name="budgetType" value={formData.budgetType} onChange={handleChange} sx={textFieldStyle}>
                  {['Fixed', 'Hourly'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="Budget Amount" name="budgetAmount" type="number" value={formData.budgetAmount} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth label="Number of Milestones" name="numberOfMilestones" type="number" value={formData.numberOfMilestones} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth label="Deadline" name="deadline" type="date" slotProps={{ inputLabel: { shrink: true } }} inputProps={{ min: new Date().toISOString().split('T')[0] }} value={formData.deadline} onChange={handleChange} sx={textFieldStyle} />
              </Box>
            )}

            {step === 2 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FileText size={20} color="#997E67" /> Details
                </Typography>
                <TextField fullWidth multiline rows={6} label="Description" name="description" value={formData.description} onChange={handleChange} sx={textFieldStyle} helperText={`${formData.description.length} chars`} FormHelperTextProps={{ sx: { color: '#997E67' } }} />
                
                <Autocomplete
                  multiple
                  options={suggestedSkills}
                  freeSolo
                  value={formData.skills}
                  onChange={(e, val) => setFormData({ ...formData, skills: val })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} sx={{ color: '#FFDBBB', borderColor: '#997E67' }} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" label="Skills Required" sx={textFieldStyle} />
                  )}
                  sx={{ mb: 2 }}
                />

                <TextField fullWidth select label="Project Type" name="projectType" value={formData.projectType} onChange={handleChange} sx={textFieldStyle}>
                  {['Individual Freelancer', 'Team (TeamLancer)'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
                {formData.projectType === 'Team (TeamLancer)' && (
                  <TextField fullWidth select label="Team Size" name="teamSize" value={formData.teamSize} onChange={handleChange} sx={textFieldStyle}>
                    {[2,3,4,5,6,7,8,9,10].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                  </TextField>
                )}
              </Box>
            )}

            {step === 3 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Sparkles size={20} color="#997E67" /> AI Preview & Stats
                </Typography>
                <Paper sx={{ p: 3, bgcolor: '#0D0A07', border: '1px solid #997E67', borderRadius: 2, mb: 3 }}>
                  <Typography sx={{ color: '#FFDBBB', mb: 1 }}><strong>Success Probability:</strong> 87%</Typography>
                  <Typography sx={{ color: '#FFDBBB', mb: 1 }}><strong>Expected Proposals:</strong> 12-18</Typography>
                  <Typography sx={{ color: '#FFDBBB', mb: 2 }}><strong>Risk Level:</strong> Low</Typography>
                  <Typography sx={{ color: '#997E67', fontStyle: 'italic' }}>
                    "AI Suggestion: Your budget is competitive for the requested skills. Adding a clearer milestone breakdown in the description could attract higher quality teams."
                  </Typography>
                </Paper>
              </Box>
            )}

          </motion.div>
        </AnimatePresence>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={step === 1} onClick={prevStep} startIcon={<ChevronLeft />} sx={{ color: '#FFDBBB' }}>Back</Button>
          {step < 3 ? (
            <Button variant="contained" onClick={nextStep} endIcon={<ChevronRight />} sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}>Next</Button>
          ) : (
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <Check />} sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}>Confirm & Post</Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
