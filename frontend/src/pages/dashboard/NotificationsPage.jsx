import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Sparkles, Briefcase, DollarSign, Circle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [category, setCategory] = useState('All');
  const [readState, setReadState] = useState({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const storageKey = `teamlance_notif_read_${user?.email}`;
      const storedRead = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setReadState(storedRead);

      let genNotifs = [];

      if (user?.role === 'ROLE_CLIENT') {
        const projRes = await api.get('/projects/mine');
        const projects = projRes.data.content || projRes.data || [];
        
        projects.forEach(p => {
          if (p.status === 'IN_PROGRESS') {
            genNotifs.push({
              id: `p_prog_${p.id}`,
              type: 'Project',
              color: '#997E67', // primary
              icon: <Briefcase size={20} />,
              title: 'Project In Progress',
              message: `Your project "${p.title}" is currently in progress.`,
              date: p.updatedAt || new Date().toISOString()
            });
          } else if (p.status === 'OPEN' && (!p.bids || p.bids.length === 0)) {
            genNotifs.push({
              id: `p_nobid_${p.id}`,
              type: 'Project',
              color: '#d32f2f', // red/warning
              icon: <Bell size={20} />,
              title: 'No Bids Yet',
              message: `No bids yet on "${p.title}" - consider updating the description or budget.`,
              date: p.createdAt || new Date().toISOString()
            });
          }
        });
      } else {
        // FREELANCER
        const assignRes = await api.get('/projects/assigned');
        const assigned = assignRes.data.content || assignRes.data || [];
        assigned.forEach(p => {
          if (p.status === 'IN_PROGRESS') {
            genNotifs.push({
              id: `a_prog_${p.id}`,
              type: 'Project',
              color: '#997E67',
              icon: <Briefcase size={20} />,
              title: 'Project In Progress',
              message: `The project "${p.title}" you are assigned to is in progress.`,
              date: p.updatedAt || new Date().toISOString()
            });
          }
        });

        try {
          const appRes = await api.get('/projects/my-applications');
          const apps = appRes.data.content || appRes.data || [];
          apps.forEach(app => {
            if (app.status === 'ACCEPTED') {
              genNotifs.push({
                id: `b_acc_${app.id}`,
                type: 'Bids',
                color: '#2e7d32', // green
                icon: <DollarSign size={20} />,
                title: 'Bid Accepted!',
                message: `Your bid on a project was accepted!`,
                date: app.updatedAt || new Date().toISOString()
              });
            } else if (app.status === 'REJECTED') {
              genNotifs.push({
                id: `b_rej_${app.id}`,
                type: 'Bids',
                color: '#d32f2f',
                icon: <DollarSign size={20} />,
                title: 'Bid Not Selected',
                message: `Your bid was not selected this time.`,
                date: app.updatedAt || new Date().toISOString()
              });
            }
          });
        } catch (e) {
          console.log('No applications endpoint or error fetching', e);
        }
      }

      // Add AI Insight
      genNotifs.push({
        id: 'ai_insight_1',
        type: 'AI Insights',
        color: '#664930', // brown
        icon: <Sparkles size={20} />,
        title: 'Market Insight',
        message: 'AI suggests increasing your profile completeness to attract 30% more clients.',
        date: new Date().toISOString()
      });

      // Sort by date desc
      genNotifs.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(genNotifs);

    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (id) => {
    const newState = { ...readState, [id]: true };
    setReadState(newState);
    const storageKey = `teamlance_notif_read_${user?.email}`;
    localStorage.setItem(storageKey, JSON.stringify(newState));
  };

  const handleMarkAllRead = () => {
    const newState = { ...readState };
    notifications.forEach(n => newState[n.id] = true);
    setReadState(newState);
    const storageKey = `teamlance_notif_read_${user?.email}`;
    localStorage.setItem(storageKey, JSON.stringify(newState));
  };

  const filtered = category === 'All' ? notifications : notifications.filter(n => n.type === category);
  const unreadCount = notifications.filter(n => !readState[n.id]).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#997E67' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: '1000px', margin: '0 auto', color: '#FFDBBB' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#997E67', color: '#0D0A07' } }}>
            <Bell color="#997E67" size={32} />
          </Badge>
          Notifications
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<CheckCheck size={18} />}
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          sx={{ 
            borderColor: 'rgba(153,126,103,0.5)', 
            color: '#FFDBBB',
            '&:hover': { borderColor: '#997E67', bgcolor: 'rgba(153,126,103,0.1)' }
          }}
        >
          Mark all as read
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'rgba(153,126,103,0.2)', mb: 4 }}>
        <Tabs 
          value={category} 
          onChange={(e, v) => setCategory(v)}
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#997E67' },
            '& .MuiTab-root': { color: 'rgba(255,219,187,0.5)', textTransform: 'none', fontSize: '1rem', fontWeight: 500 },
            '& .Mui-selected': { color: '#FFDBBB !important' },
          }}
        >
          <Tab label="All" value="All" />
          <Tab label="Project" value="Project" />
          <Tab label="Bids" value="Bids" />
          <Tab label="AI Insights" value="AI Insights" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card sx={{ bgcolor: 'rgba(255,219,187,0.02)', backdropFilter: 'blur(10px)', border: '1px dashed rgba(153,126,103,0.2)', borderRadius: 3, p: 6, textAlign: 'center' }}>
                <Bell size={48} color="#997E67" style={{ opacity: 0.3, marginBottom: '16px' }} />
                <Typography variant="h6" sx={{ color: 'rgba(255,219,187,0.7)', mb: 1 }}>
                  No Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.4)' }}>
                  You're all caught up on the latest updates.
                </Typography>
              </Card>
            </motion.div>
          ) : (
            filtered.map((notif, i) => {
              const isUnread = !readState[notif.id];
              return (
                <motion.div 
                  key={notif.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, height: 0 }} 
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <Card 
                    sx={{ 
                      bgcolor: isUnread ? 'rgba(153,126,103,0.1)' : 'rgba(255,219,187,0.02)',
                      border: '1px solid rgba(153,126,103,0.1)',
                      borderLeft: `4px solid ${notif.color}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(153,126,103,0.15)' }
                    }}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <CardContent sx={{ p: '24px !important', display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                      <Box sx={{ 
                        p: 1.5, 
                        bgcolor: 'rgba(255,219,187,0.05)', 
                        borderRadius: '50%',
                        color: notif.color,
                        display: 'flex'
                      }}>
                        {notif.icon}
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ color: '#FFDBBB', fontWeight: isUnread ? 'bold' : 'normal' }}>
                            {notif.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,219,187,0.4)' }}>
                            {new Date(notif.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,219,187,0.7)' }}>
                          {notif.message}
                        </Typography>
                      </Box>

                      {isUnread && (
                        <Box sx={{ alignSelf: 'center' }}>
                          <Circle size={12} fill="#997E67" color="#997E67" />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default NotificationsPage;
