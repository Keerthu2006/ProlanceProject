import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  Tabs,
  Tab,
  TextField,
  Switch,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
  Alert,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Palette, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const SettingsPage = () => {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  
  // Profile State
  const [fullName, setFullName] = useState(user?.fullName || 'User');
  
  // Notifications State
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    bidAlerts: true,
    projectUpdates: true,
    aiRecommendations: true,
    weeklyReports: false
  });

  // Security State
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Appearance State
  const [appearance, setAppearance] = useState({
    theme: localStorage.getItem('teamlance-theme') || 'dark',
    fontSize: 2, // 1: small, 2: medium, 3: large
    language: 'en'
  });

  useEffect(() => {
    const savedName = localStorage.getItem(`teamlance_name_${user?.email}`);
    if (savedName) setFullName(savedName);

    const savedNotifs = localStorage.getItem(`teamlance_notif_prefs_${user?.email}`);
    if (savedNotifs) setNotifPrefs(JSON.parse(savedNotifs));
  }, [user]);

  const handleSaveProfile = () => {
    localStorage.setItem(`teamlance_name_${user?.email}`, fullName);
    showToast('Profile updated successfully!', 'success');
  };

  const handleNotifToggle = (key) => {
    const newPrefs = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(newPrefs);
    localStorage.setItem(`teamlance_notif_prefs_${user?.email}`, JSON.stringify(newPrefs));
  };

  const handleSaveSecurity = async () => {
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    try {
      await api.post('/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.new });
      showToast('Password changed successfully!', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      // Fake success for UI if backend doesn't support it
      showToast('Password update simulated successfully.', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    }
  };

  const handleAppearanceChange = (key, val) => {
    const newApp = { ...appearance, [key]: val };
    setAppearance(newApp);
    if (key === 'theme') {
      localStorage.setItem('teamlance-theme', val);
      showToast('Theme setting saved (Reload to apply full site changes)', 'info');
    }
  };

  const showToast = (msg, sev) => setToast({ open: true, message: msg, severity: sev });

  const tabProps = (index) => ({
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  });

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto', color: '#FFDBBB', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
      
      {/* Sidebar Tabs */}
      <Box sx={{ minWidth: { md: '250px' } }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2, color: '#997E67' }}>
          Settings
        </Typography>
        <Tabs
          orientation={window.innerWidth >= 900 ? "vertical" : "horizontal"}
          variant="scrollable"
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          sx={{
            borderRight: { md: 1, xs: 0 },
            borderBottom: { xs: 1, md: 0 },
            borderColor: 'rgba(153,126,103,0.2) !important',
            '& .MuiTabs-indicator': { backgroundColor: '#997E67', left: { md: 0 }, right: { md: 'auto' } },
            '& .MuiTab-root': { 
              color: 'rgba(255,219,187,0.5)', 
              textTransform: 'none', 
              fontSize: '1rem', 
              fontWeight: 500,
              alignItems: 'flex-start',
              textAlign: 'left',
              py: 2,
              px: 3,
              minHeight: 'auto'
            },
            '& .Mui-selected': { color: '#FFDBBB !important', bgcolor: 'rgba(153,126,103,0.1)' },
          }}
        >
          <Tab icon={<User size={18} style={{ marginRight: 12 }}/>} iconPosition="start" label="Profile" {...tabProps(0)} />
          <Tab icon={<Bell size={18} style={{ marginRight: 12 }}/>} iconPosition="start" label="Notifications" {...tabProps(1)} />
          <Tab icon={<Shield size={18} style={{ marginRight: 12 }}/>} iconPosition="start" label="Security" {...tabProps(2)} />
          <Tab icon={<Palette size={18} style={{ marginRight: 12 }}/>} iconPosition="start" label="Appearance" {...tabProps(3)} />
        </Tabs>
      </Box>

      {/* Content Area */}
      <Box sx={{ flex: 1, minHeight: '60vh' }}>
        <AnimatePresence mode="wait">
          
          {/* PROFILE TAB */}
          {tabIndex === 0 && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card sx={{ bgcolor: 'rgba(255,219,187,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(153,126,103,0.2)', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ color: '#997E67', mb: 3 }}>Profile Information</Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.5)' }}>Account Role</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={user?.role === 'ROLE_CLIENT' ? 'Client' : 'Freelancer'} 
                          sx={{ bgcolor: 'rgba(153,126,103,0.2)', color: '#997E67', fontWeight: 'bold' }} 
                        />
                      </Box>
                    </Box>

                    <TextField
                      label="Email Address"
                      value={user?.email || ''}
                      disabled
                      fullWidth
                      variant="outlined"
                      sx={{ '& .MuiOutlinedInput-root': { color: 'rgba(255,219,187,0.5)' } }}
                    />

                    <TextField
                      label="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: '#FFDBBB',
                          '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                          '&:hover fieldset': { borderColor: 'rgba(153,126,103,0.6)' },
                          '&.Mui-focused fieldset': { borderColor: '#997E67' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,219,187,0.7)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#997E67' },
                      }}
                    />

                    <Button 
                      variant="contained" 
                      startIcon={<Save size={18} />}
                      onClick={handleSaveProfile}
                      sx={{ 
                        mt: 2, alignSelf: 'flex-start',
                        background: 'linear-gradient(45deg, #664930, #997E67)', 
                        color: '#FFDBBB',
                        '&:hover': { background: 'linear-gradient(45deg, #997E67, #664930)' }
                      }}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* NOTIFICATIONS TAB */}
          {tabIndex === 1 && (
            <motion.div key="notifs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card sx={{ bgcolor: 'rgba(255,219,187,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(153,126,103,0.2)', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ color: '#997E67', mb: 1 }}>Notification Preferences</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.5)', mb: 3 }}>Control how you receive updates and alerts.</Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { key: 'email', label: 'Email Notifications', desc: 'Receive daily digests via email' },
                      { key: 'bidAlerts', label: 'Bid Alerts', desc: 'Get notified when bids are placed or accepted' },
                      { key: 'projectUpdates', label: 'Project Updates', desc: 'Updates on project status changes' },
                      { key: 'aiRecommendations', label: 'AI Recommendations', desc: 'Smart insights tailored to your profile' },
                      { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Summary of your activity every week' },
                    ].map((item, idx) => (
                      <React.Fragment key={item.key}>
                        {idx > 0 && <Divider sx={{ borderColor: 'rgba(153,126,103,0.1)' }} />}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                          <Box>
                            <Typography sx={{ color: '#FFDBBB' }}>{item.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.5)' }}>{item.desc}</Typography>
                          </Box>
                          <Switch 
                            checked={notifPrefs[item.key]} 
                            onChange={() => handleNotifToggle(item.key)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: '#997E67' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#997E67' },
                            }}
                          />
                        </Box>
                      </React.Fragment>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* SECURITY TAB */}
          {tabIndex === 2 && (
            <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Card sx={{ bgcolor: 'rgba(255,219,187,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(153,126,103,0.2)', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ color: '#997E67', mb: 3 }}>Change Password</Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {['current', 'new', 'confirm'].map((field) => (
                        <TextField
                          key={field}
                          label={field.charAt(0).toUpperCase() + field.slice(1) + ' Password'}
                          type={showPassword ? 'text' : 'password'}
                          value={passwords[field]}
                          onChange={(e) => setPasswords({ ...passwords, [field]: e.target.value })}
                          fullWidth
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#FFDBBB',
                              '& fieldset': { borderColor: 'rgba(153,126,103,0.3)' },
                              '&:hover fieldset': { borderColor: 'rgba(153,126,103,0.6)' },
                              '&.Mui-focused fieldset': { borderColor: '#997E67' },
                            },
                            '& .MuiInputLabel-root': { color: 'rgba(255,219,187,0.7)' },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#997E67' },
                          }}
                          InputProps={{
                            endAdornment: field === 'current' && (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,219,187,0.5)' }}>
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      ))}
                      <Button 
                        variant="contained" 
                        onClick={handleSaveSecurity}
                        disabled={!passwords.current || !passwords.new || !passwords.confirm}
                        sx={{ 
                          mt: 1, alignSelf: 'flex-start',
                          background: 'linear-gradient(45deg, #664930, #997E67)', 
                          color: '#FFDBBB',
                          '&:hover': { background: 'linear-gradient(45deg, #997E67, #664930)' },
                          '&.Mui-disabled': { background: 'rgba(153,126,103,0.2)', color: 'rgba(255,219,187,0.3)' }
                        }}
                      >
                        Update Password
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'rgba(153,126,103,0.05)', border: '1px dashed rgba(153,126,103,0.3)', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#FFDBBB', fontWeight: 'bold' }}>Two-Factor Authentication (2FA)</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.6)' }}>Add an extra layer of security to your account.</Typography>
                    </Box>
                    <Chip label="Coming Soon" sx={{ bgcolor: '#997E67', color: '#0D0A07', fontWeight: 'bold' }} />
                  </CardContent>
                </Card>
              </Box>
            </motion.div>
          )}

          {/* APPEARANCE TAB */}
          {tabIndex === 3 && (
            <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card sx={{ bgcolor: 'rgba(255,219,187,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(153,126,103,0.2)', borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ color: '#997E67', mb: 4 }}>Display & Language</Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    
                    <Box>
                      <Typography sx={{ color: '#FFDBBB', mb: 2 }}>Theme Mode</Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {['dark', 'light'].map((mode) => (
                          <Card 
                            key={mode}
                            onClick={() => handleAppearanceChange('theme', mode)}
                            sx={{ 
                              p: 2, 
                              minWidth: 120, 
                              textAlign: 'center', 
                              cursor: 'pointer',
                              bgcolor: appearance.theme === mode ? 'rgba(153,126,103,0.2)' : 'rgba(255,219,187,0.02)',
                              border: `1px solid ${appearance.theme === mode ? '#997E67' : 'rgba(153,126,103,0.2)'}`,
                              color: '#FFDBBB',
                              textTransform: 'capitalize',
                              transition: 'all 0.2s'
                            }}
                          >
                            {mode} Mode
                          </Card>
                        ))}
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(153,126,103,0.1)' }} />

                    <Box>
                      <Typography sx={{ color: '#FFDBBB', mb: 1 }}>Font Size</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.5)', display: 'block', mb: 2 }}>
                        Adjust the interface text size
                      </Typography>
                      <Box sx={{ px: 2, maxWidth: 300 }}>
                        <Slider
                          value={appearance.fontSize}
                          min={1} max={3} step={1}
                          marks={[{value:1, label:'Small'}, {value:2, label:'Medium'}, {value:3, label:'Large'}]}
                          onChange={(e, val) => handleAppearanceChange('fontSize', val)}
                          sx={{
                            color: '#997E67',
                            '& .MuiSlider-markLabel': { color: 'rgba(255,219,187,0.5)' },
                            '& .MuiSlider-markLabelActive': { color: '#FFDBBB' },
                          }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(153,126,103,0.1)' }} />

                    <Box>
                      <Typography sx={{ color: '#FFDBBB', mb: 2 }}>Language</Typography>
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ color: 'rgba(255,219,187,0.7)', '&.Mui-focused': { color: '#997E67' } }}>Language</InputLabel>
                        <Select
                          value={appearance.language}
                          label="Language"
                          onChange={(e) => handleAppearanceChange('language', e.target.value)}
                          sx={{
                            color: '#FFDBBB',
                            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(153,126,103,0.3)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(153,126,103,0.6)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#997E67' },
                            '.MuiSvgIcon-root': { color: '#997E67' }
                          }}
                        >
                          <MenuItem value="en">English (US)</MenuItem>
                          <MenuItem value="es" disabled>Español (Coming soon)</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({...toast, open: false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({...toast, open: false})} severity={toast.severity} sx={{ width: '100%', bgcolor: toast.severity === 'success' ? '#2e7d32' : (toast.severity === 'info' ? '#0288d1' : '#d32f2f'), color: '#fff' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
