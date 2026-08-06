import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Paper, Typography, Button, TextField, MenuItem, LinearProgress, Divider, CircularProgress } from '@mui/material';
import { Building2, Mail, Lock, Phone, Globe, ChevronRight, ChevronLeft, Check, User } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const businessTypes = ['Startup', 'SME', 'Enterprise', 'Individual'];
const industries = ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Marketing', 'Other'];
const companySizes = ['1-10', '11-50', '51-200', '200+'];

export default function ClientRegistration() {
  const navigate = useNavigate();
  const { login } = useAuth() || {};
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    industry: '',
    companySize: '',
    fullName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
    businessDescription: '',
    websiteUrl: '',
    preferredCommunication: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleGoogleAuth = () => {
    document.cookie = "role=ROLE_CLIENT; path=/";
    window.location.href = 'http://localhost:8080/api/oauth2/authorization/google?role=ROLE_CLIENT';
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: 'ROLE_CLIENT',
        username: formData.email.split('@')[0] + Math.floor(Math.random() * 1000)
      });
      if (res.data?.accessToken) {
        const userData = { email: formData.email, role: 'ROLE_CLIENT', fullName: formData.fullName };
        if (login) login(res.data.accessToken, userData);
        toast.success('Registration successful!');
        navigate('/dashboard/client');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && data.message === "Validation failed") {
        const errors = Object.values(data).filter(v => v !== "Validation failed").join(" | ");
        toast.error(`Error: ${errors}`);
      } else {
        toast.error(data?.message || 'Registration failed. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
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
      <Paper elevation={24} sx={{ maxWidth: 600, w: '100%', p: 4, bgcolor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid #664930', borderRadius: 4, color: '#FFDBBB' }}>
        <Typography variant="h4" sx={{ color: '#997E67', fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
          Client Registration
        </Typography>
        <Typography variant="body2" sx={{ color: '#FFDBBB', opacity: 0.7, mb: 4, textAlign: 'center' }}>
          Join ProLance and find top talent
        </Typography>

        <LinearProgress variant="determinate" value={(step / 3) * 100} sx={{ mb: 4, bgcolor: '#0D0A07', '& .MuiLinearProgress-bar': { bgcolor: '#997E67' } }} />

        <AnimatePresence mode="wait">
          <motion.div key={step} initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3 }}>
            
            {step === 1 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Building2 size={20} color="#997E67" /> Company Details
                </Typography>
                <TextField fullWidth label="Company/Business Name" name="companyName" value={formData.companyName} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth select label="Business Type" name="businessType" value={formData.businessType} onChange={handleChange} sx={textFieldStyle}>
                  {businessTypes.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
                <TextField fullWidth select label="Industry" name="industry" value={formData.industry} onChange={handleChange} sx={textFieldStyle}>
                  {industries.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
                <TextField fullWidth select label="Company Size" name="companySize" value={formData.companySize} onChange={handleChange} sx={textFieldStyle}>
                  {companySizes.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Box>
            )}

            {step === 2 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={20} color="#997E67" /> Contact & Account
                </Typography>
                <TextField fullWidth label="Contact Person Name" name="fullName" value={formData.fullName} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth label="Location/City" name="location" value={formData.location} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} sx={textFieldStyle} />
                
                <Divider sx={{ my: 3, borderColor: '#664930' }}>
                  <Typography variant="body2" sx={{ color: '#997E67' }}>OR</Typography>
                </Divider>
                <Button fullWidth variant="contained" onClick={handleGoogleAuth} sx={{ bgcolor: '#fff', color: '#000', '&:hover': { bgcolor: '#f1f1f1' }, py: 1.5, mb: 2 }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ width: 20, height: 20, marginRight: 10 }} />
                  Sign up with Google
                </Button>
              </Box>
            )}

            {step === 3 && (
              <Box>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Globe size={20} color="#997E67" /> Business Profile
                </Typography>
                <TextField fullWidth multiline rows={4} label="Business Description" name="businessDescription" value={formData.businessDescription} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth label="Website URL (Optional)" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} sx={textFieldStyle} />
                <TextField fullWidth select label="Preferred Communication" name="preferredCommunication" value={formData.preferredCommunication} onChange={handleChange} sx={textFieldStyle}>
                  {['Email', 'Chat', 'Phone'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
              </Box>
            )}

          </motion.div>
        </AnimatePresence>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={step === 1} onClick={prevStep} startIcon={<ChevronLeft />} sx={{ color: '#FFDBBB' }}>Back</Button>
          {step < 3 ? (
            <Button variant="contained" onClick={nextStep} endIcon={<ChevronRight />} sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}>Next</Button>
          ) : (
            <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : <Check />} sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}>Submit</Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
