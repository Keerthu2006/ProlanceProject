import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Typography, IconButton,
  Badge, Tooltip, Divider, ThemeProvider, CssBaseline, InputBase
} from '@mui/material';
import {
  LayoutDashboard, Briefcase, FileText, ScrollText, Target, Users,
  Search, Brain, Bell, BarChart2, Globe, Star, BookOpen,
  FolderOpen, DollarSign, Cpu, Zap, Terminal, Activity, Menu,
  Sun, Moon, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTheme } from '../theme';

const drawerWidth = 260;
const collapsedDrawerWidth = 72;

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState('dark');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const menuItems = useMemo(() => {
    const role = user?.role || 'ROLE_CLIENT';
    
    if (role === 'ROLE_CLIENT') {
      return [
        { text: 'Dashboard',        icon: LayoutDashboard, path: '/dashboard/client' },
        { text: 'Post Project',     icon: Briefcase,       path: '/dashboard/create-project' },
        { text: 'Browse Freelancers', icon: Search,        path: '/dashboard/client' },
        { text: 'Contracts',        icon: ScrollText,      path: '/dashboard/contracts' },
        { text: 'Milestones',       icon: Target,          path: '/dashboard/milestones' },
        { text: 'Teams',            icon: Users,           path: '/dashboard/teams' },
        { text: 'Reviews',          icon: Star,            path: '/dashboard/reviews' },
        { text: 'AI Insights',      icon: Brain,           path: '/dashboard/ai' },
        { text: 'Market Intel',     icon: Globe,           path: '/dashboard/market-intel' },
        { text: 'Notifications',    icon: Bell,            path: '/dashboard/notifications' },
        { text: 'Settings',         icon: Activity,        path: '/dashboard/settings' },
      ];
    } else if (role === 'ROLE_FREELANCER') {
      return [
        { text: 'Dashboard',        icon: LayoutDashboard, path: '/dashboard/freelancer' },
        { text: 'Browse Projects',  icon: Search,          path: '/dashboard/browse-projects' },
        { text: 'Contracts',        icon: ScrollText,      path: '/dashboard/contracts' },
        { text: 'Milestones',       icon: Target,          path: '/dashboard/milestones' },
        { text: 'Reviews',          icon: Star,            path: '/dashboard/reviews' },
        { text: 'Skill Growth',     icon: BookOpen,        path: '/dashboard/skills' },
        { text: 'Market Intel',     icon: Globe,           path: '/dashboard/market-intel' },
        { text: 'AI Suggestions',   icon: Brain,           path: '/dashboard/ai' },
        { text: 'Notifications',    icon: Bell,            path: '/dashboard/notifications' },
        { text: 'Settings',         icon: Activity,        path: '/dashboard/settings' },
      ];
    } else {
      return [
        { text: 'Executive Dashboard', icon: LayoutDashboard, path: '/dashboard/admin' },
        { text: 'AI Neglect Engine', icon: Brain,          path: '/dashboard/neglect' },
        { text: 'AI Intelligence',  icon: Cpu,             path: '/dashboard/ai' },
        { text: 'Market Intel',     icon: Globe,           path: '/dashboard/market-intel' },
        { text: 'Automation',       icon: Zap,             path: '/dashboard/automation' },
        { text: 'Reports',          icon: BarChart2,       path: '/dashboard/reports' },
        { text: 'System Health',    icon: Activity,        path: '/dashboard/system-health' },
        { text: 'Notifications',    icon: Bell,            path: '/dashboard/notifications' },
        { text: 'Settings',         icon: Activity,        path: '/dashboard/settings' },
      ];
    }
  }, [user]);

  const pageTitle = useMemo(() => {
    switch (location.pathname) {
      case '/dashboard/client': return 'Client Dashboard';
      case '/dashboard/freelancer': return 'Freelancer Hub';
      case '/dashboard/ai': return 'AI Intelligence';
      case '/dashboard/owner': return 'Executive Dashboard';
      case '/dashboard/market-intel': return 'Market Intelligence';
      case '/dashboard/analytics': return 'Analytics';
      default: return 'TeamLance';
    }
  }, [location.pathname]);

  const userName = user?.name || 'User';
  const userInitials = userName.charAt(0).toUpperCase();
  const userRoleStr = (user?.role || 'CLIENT').replace('ROLE_', '').toLowerCase();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        
        {/* APP BAR */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: `calc(100% - ${sidebarOpen ? drawerWidth : collapsedDrawerWidth}px)`,
            ml: `${sidebarOpen ? drawerWidth : collapsedDrawerWidth}px`,
            backgroundColor: 'rgba(13, 10, 7, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 219, 187, 0.05)',
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar sx={{ minHeight: '72px !important' }}>
            <IconButton onClick={toggleSidebar} sx={{ color: '#FFDBBB', mr: 2 }}>
              <Menu size={24} />
            </IconButton>
            
            <Typography variant="h6" sx={{ color: '#FFDBBB', fontWeight: 600, letterSpacing: '0.5px' }}>
              {pageTitle}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            {/* Glass Search Input */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 219, 187, 0.03)',
                border: '1px solid rgba(255, 219, 187, 0.1)',
                borderRadius: '24px',
                px: 2,
                py: 0.5,
                mr: 2,
                width: searchFocused ? 240 : 48,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: searchFocused ? 'text' : 'pointer',
                overflow: 'hidden'
              }}
              onClick={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            >
              <Search size={18} color="#997E67" style={{ minWidth: 18 }} />
              <InputBase
                placeholder="Search..."
                sx={{
                  ml: 1,
                  flex: 1,
                  color: '#FFDBBB',
                  opacity: searchFocused ? 1 : 0,
                  transition: 'opacity 0.2s',
                  fontSize: '0.875rem'
                }}
              />
            </Box>

            <IconButton
              sx={{
                color: '#FFDBBB',
                mr: 1,
                '@keyframes pulseGlow': {
                  '0%': { boxShadow: '0 0 0 0 rgba(153, 126, 103, 0.7)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(153, 126, 103, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(153, 126, 103, 0)' }
                },
                animation: 'pulseGlow 2s infinite',
                backgroundColor: 'rgba(153, 126, 103, 0.1)'
              }}
              onClick={() => navigate('/dashboard/ai')}
            >
              <Brain size={20} />
            </IconButton>

            <IconButton sx={{ color: '#FFDBBB', mr: 1 }}>
              <Badge badgeContent={3} color="error">
                <Bell size={20} />
              </Badge>
            </IconButton>

            <IconButton sx={{ color: '#FFDBBB', mr: 2 }} onClick={toggleMode}>
              {mode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 2, borderLeft: '1px solid rgba(255,219,187,0.1)' }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #997E67, #664930)',
                  color: '#FFDBBB',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                {userInitials}
              </Avatar>
              <Typography variant="body2" sx={{ color: '#FFDBBB', display: { xs: 'none', md: 'block' } }}>
                {userName}
              </Typography>
              <IconButton size="small" sx={{ color: '#997E67' }} onClick={logout}>
                <LogOut size={18} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* SIDEBAR */}
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarOpen ? drawerWidth : collapsedDrawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            '& .MuiDrawer-paper': {
              width: sidebarOpen ? drawerWidth : collapsedDrawerWidth,
              backgroundColor: 'rgba(8, 5, 3, 0.95)',
              backdropFilter: 'blur(24px)',
              borderRight: '1px solid rgba(255, 219, 187, 0.07)',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            },
          }}
        >
          {/* Logo Area */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              minHeight: '72px',
              px: sidebarOpen ? 3 : 0,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #997E67, #664930)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFDBBB',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                flexShrink: 0
              }}
            >
              T
            </Box>
            {sidebarOpen && (
              <Typography
                variant="h6"
                sx={{
                  ml: 2,
                  color: '#FFDBBB',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  background: '-webkit-linear-gradient(45deg, #FFDBBB, #997E67)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                TeamLance
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,219,187,0.05)' }} />

          {/* Nav Links */}
          <List sx={{ flex: 1, px: 1.5, py: 2 }}>
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Tooltip title={!sidebarOpen ? item.text : ''} placement="right" key={item.text}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 44,
                        justifyContent: sidebarOpen ? 'initial' : 'center',
                        px: 2,
                        borderRadius: '8px',
                        background: isActive ? 'linear-gradient(135deg, rgba(153, 126, 103, 0.2), rgba(102, 73, 48, 0.15))' : 'transparent',
                        borderLeft: isActive ? '3px solid #997E67' : '3px solid transparent',
                        '&:hover': {
                          background: isActive ? 'linear-gradient(135deg, rgba(153, 126, 103, 0.2), rgba(102, 73, 48, 0.15))' : 'rgba(255, 219, 187, 0.04)',
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: sidebarOpen ? 2 : 0,
                          justifyContent: 'center',
                          color: isActive ? '#FFDBBB' : '#997E67',
                        }}
                      >
                        <item.icon size={20} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        sx={{
                          opacity: sidebarOpen ? 1 : 0,
                          color: isActive ? '#FFDBBB' : 'rgba(255,219,187,0.7)',
                          '& .MuiTypography-root': {
                            fontSize: '0.875rem',
                            fontWeight: isActive ? 600 : 400
                          }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              );
            })}
          </List>

          {/* User Profile (Bottom) */}
          {sidebarOpen && (
            <Box sx={{ p: 2, mb: 2, mx: 1.5, borderRadius: 2, backgroundColor: 'rgba(255,219,187,0.02)', border: '1px solid rgba(255,219,187,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    background: 'linear-gradient(135deg, #997E67, #664930)',
                    color: '#FFDBBB',
                    fontWeight: 'bold'
                  }}
                >
                  {userInitials}
                </Avatar>
                <Box sx={{ ml: 1.5, overflow: 'hidden' }}>
                  <Typography variant="body2" sx={{ color: '#FFDBBB', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {userName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#997E67', textTransform: 'capitalize' }}>
                    {userRoleStr}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Drawer>

        {/* MAIN CONTENT */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            pt: 10,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.97, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, scale: 1.02, y: -10, filter: 'blur(4px)', transition: { duration: 0.28 } }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
