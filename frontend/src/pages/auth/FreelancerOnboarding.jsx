import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Paper, Typography, Button, TextField, Chip, 
  LinearProgress, MenuItem, CircularProgress, Avatar 
} from '@mui/material';
import { 
  User, BookOpen, Code, Briefcase, ChevronRight, 
  ChevronLeft, Check, Plus, X, Upload, GitBranch, 
  Link2, Globe 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
// Adjust path to your actual AuthContext
import { useAuth } from '../../context/AuthContext';

const SUGGESTED_SKILLS = ['React', 'Node.js', 'Python', 'Java', 'Flutter', 'UI/UX', 'AI/ML', 'DevOps', 'AWS', 'Docker', 'GraphQL'];

export default function FreelancerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  
  const [formData, setFormData] = useState({
    // Step 1
    profession: '',
    hourlyRate: '',
    experienceLevel: '',
    yearsOfExperience: '',
    
    // Step 2
    skills: [],
    
    // Step 3
    education: {
      degree: '',
      institution: '',
      fieldOfStudy: '',
      graduationYear: ''
    },
    
    // Step 4
    bio: '',
    availability: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: ''
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEducationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      education: { ...prev.education, [name]: value }
    }));
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSubmit = async () => {
    if (formData.skills.length < 2) {
      toast.error('Please add at least 2 skills');
      return;
    }
    if (formData.bio.length < 100) {
      toast.error('Bio must be at least 100 characters');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('pl_token');
      await axios.put('http://localhost:8080/api/freelancers/me', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile created! Welcome to ProLance 🚀');
      navigate('/dashboard/freelancer');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Form rendering helpers
  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      color: '#FFDBBB',
      backgroundColor: 'rgba(13, 10, 7, 0.5)',
      '& fieldset': { borderColor: 'rgba(102, 73, 48, 0.4)' },
      '&:hover fieldset': { borderColor: 'rgba(153, 126, 103, 0.6)' },
      '&.Mui-focused fieldset': { borderColor: '#997E67' }
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 219, 187, 0.7)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#997E67' },
    '& .MuiSelect-icon': { color: '#997E67' }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="text-[#997E67]" size={28} />
              <Typography variant="h5" fontWeight="bold">Professional Identity</Typography>
            </div>
            <TextField
              fullWidth label="Profession Title" name="profession" value={formData.profession} onChange={handleChange}
              placeholder="e.g. Full Stack Developer" required sx={textFieldStyles}
            />
            <TextField
              fullWidth label="Hourly Rate ($)" name="hourlyRate" type="number" value={formData.hourlyRate} onChange={handleChange}
              required sx={textFieldStyles}
            />
            <TextField
              select fullWidth label="Experience Level" name="experienceLevel" value={formData.experienceLevel} onChange={handleChange}
              required sx={textFieldStyles}
            >
              {['Beginner', 'Intermediate', 'Expert'].map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth label="Years of Experience" name="yearsOfExperience" type="number" value={formData.yearsOfExperience} onChange={handleChange}
              required sx={textFieldStyles}
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Code className="text-[#997E67]" size={28} />
              <Typography variant="h5" fontWeight="bold">Your Skills</Typography>
            </div>
            
            <Box display="flex" gap={2}>
              <TextField
                fullWidth label="Add Skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))}
                sx={textFieldStyles}
              />
              <Button 
                variant="contained" onClick={() => addSkill(skillInput)}
                sx={{ bgcolor: '#997E67', '&:hover': { bgcolor: '#664930' }, minWidth: '100px' }}
              >
                <Plus size={20} />
              </Button>
            </Box>

            <Box>
              <Typography variant="caption" color="rgba(255, 219, 187, 0.6)" display="block" mb={1}>
                Suggested:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {SUGGESTED_SKILLS.map(skill => (
                  <Chip 
                    key={skill} label={skill} onClick={() => addSkill(skill)}
                    sx={{ bgcolor: 'rgba(153, 126, 103, 0.1)', color: '#997E67', border: '1px solid rgba(153, 126, 103, 0.3)', '&:hover': { bgcolor: 'rgba(153, 126, 103, 0.2)' } }}
                  />
                ))}
              </Box>
            </Box>

            <Box mt={4}>
              <Typography variant="subtitle2" mb={2}>Selected Skills ({formData.skills.length}) - Min 2 required</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {formData.skills.map(skill => (
                  <Chip
                    key={skill} label={skill} onDelete={() => removeSkill(skill)} deleteIcon={<X size={14} />}
                    sx={{ bgcolor: '#997E67', color: 'white', '& .MuiChip-deleteIcon': { color: 'white' } }}
                  />
                ))}
                {formData.skills.length === 0 && (
                  <Typography variant="body2" color="rgba(255, 219, 187, 0.4)">No skills added yet.</Typography>
                )}
              </Box>
            </Box>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="text-[#997E67]" size={28} />
              <Typography variant="h5" fontWeight="bold">Education</Typography>
            </div>
            <TextField
              select fullWidth label="Degree" name="degree" value={formData.education.degree} onChange={handleEducationChange}
              sx={textFieldStyles}
            >
              {['BSc', 'MSc', 'MBA', 'BCA', 'MCA', 'BE', 'PhD', 'Diploma', 'Other'].map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth label="Institution Name" name="institution" value={formData.education.institution} onChange={handleEducationChange}
              sx={textFieldStyles}
            />
            <TextField
              fullWidth label="Field of Study" name="fieldOfStudy" value={formData.education.fieldOfStudy} onChange={handleEducationChange}
              sx={textFieldStyles}
            />
            <TextField
              fullWidth label="Graduation Year" name="graduationYear" type="number" value={formData.education.graduationYear} onChange={handleEducationChange}
              sx={textFieldStyles}
            />
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <User className="text-[#997E67]" size={28} />
              <Typography variant="h5" fontWeight="bold">Bio & Details</Typography>
            </div>

            <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
              <Box position="relative">
                <Avatar sx={{ width: 100, height: 100, bgcolor: 'rgba(153, 126, 103, 0.2)', border: '2px dashed #997E67' }}>
                  <User size={40} color="#997E67" />
                </Avatar>
                <Box position="absolute" bottom={0} right={0} bgcolor="#997E67" p={1} borderRadius="50%" sx={{ cursor: 'pointer' }}>
                  <Upload size={16} color="white" />
                </Box>
              </Box>
              <Typography variant="caption" mt={1} color="rgba(255, 219, 187, 0.6)">Upload Profile Photo</Typography>
            </Box>

            <TextField
              fullWidth multiline rows={4} label="Professional Bio" name="bio" value={formData.bio} onChange={handleChange}
              placeholder="Tell clients about yourself..." required sx={textFieldStyles}
              helperText={`${formData.bio.length} chars (min 100)`}
              FormHelperTextProps={{ sx: { color: formData.bio.length < 100 ? '#ef4444' : 'rgba(255,219,187,0.5)' } }}
            />
            <TextField
              select fullWidth label="Availability" name="availability" value={formData.availability} onChange={handleChange}
              required sx={textFieldStyles}
            >
              {['Full-time', 'Part-time', 'Weekends', 'Flexible'].map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            
            <Box display="flex" gap={2} mt={2}>
              <TextField
                fullWidth placeholder="GitHub URL" name="githubUrl" value={formData.githubUrl} onChange={handleChange}
                InputProps={{ startAdornment: <GitBranch size={20} className="text-[#997E67] mr-2" /> }} sx={textFieldStyles}
              />
              <TextField
                fullWidth placeholder="LinkedIn URL" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange}
                InputProps={{ startAdornment: <Link2 size={20} className="text-[#997E67] mr-2" /> }} sx={textFieldStyles}
              />
            </Box>
            <TextField
              fullWidth placeholder="Portfolio URL" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleChange}
              InputProps={{ startAdornment: <Globe size={20} className="text-[#997E67] mr-2" /> }} sx={textFieldStyles}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !formData.profession || !formData.hourlyRate || !formData.experienceLevel || !formData.yearsOfExperience;
    if (step === 2) return formData.skills.length < 2;
    if (step === 3) return false; // Education optional for progressing? Let's say yes for UX, though fields are there
    return false;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0D0A07', color: '#FFDBBB', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Box sx={{ width: '100%', maxWidth: 700 }}>
        
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" fontWeight="bold" sx={{ background: 'linear-gradient(to right, #FFDBBB, #997E67)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Complete Your Profile
          </Typography>
          <Typography variant="body1" color="rgba(255, 219, 187, 0.7)" mt={1}>
            Let's get you set up to discover amazing freelance opportunities.
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box mb={6}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="rgba(255, 219, 187, 0.7)">Step {step} of 4</Typography>
            <Typography variant="body2" color="#997E67" fontWeight="bold">
              {step === 1 && 'Identity'}
              {step === 2 && 'Skills'}
              {step === 3 && 'Education'}
              {step === 4 && 'Details'}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" value={(step / 4) * 100} 
            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(102, 73, 48, 0.3)', '& .MuiLinearProgress-bar': { bgcolor: '#997E67', borderRadius: 4 } }}
          />
        </Box>

        {/* Form Card */}
        <Paper elevation={0} sx={{ bgcolor: 'rgba(26, 20, 16, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(102, 73, 48, 0.3)', borderRadius: 4, p: { xs: 3, md: 5 }, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <Box display="flex" justifyContent="space-between" mt={6} pt={3} borderTop="1px solid rgba(102, 73, 48, 0.2)">
            <Button
              onClick={handleBack} disabled={step === 1 || loading}
              startIcon={<ChevronLeft size={18} />}
              sx={{ color: '#FFDBBB', '&:hover': { bgcolor: 'rgba(255, 219, 187, 0.1)' } }}
            >
              Back
            </Button>
            
            {step < 4 ? (
              <Button
                onClick={handleNext} disabled={isNextDisabled()}
                endIcon={<ChevronRight size={18} />}
                variant="contained"
                sx={{ bgcolor: '#997E67', '&:hover': { bgcolor: '#664930' }, '&.Mui-disabled': { bgcolor: 'rgba(153, 126, 103, 0.3)', color: 'rgba(255, 219, 187, 0.3)' } }}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit} disabled={loading || formData.bio.length < 100 || !formData.availability}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Check size={18} />}
                variant="contained"
                sx={{ bgcolor: '#997E67', '&:hover': { bgcolor: '#664930' }, '&.Mui-disabled': { bgcolor: 'rgba(153, 126, 103, 0.3)', color: 'rgba(255, 219, 187, 0.3)' } }}
              >
                Complete Profile
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
