import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Button, Tabs, Tab, Card, CardContent, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Briefcase, DollarSign, Bot, Download, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const themeStyles = {
  bg: '#0D0A07',
  primary: '#997E67',
  cream: '#FFDBBB',
  brown: '#664930',
  glass: {
    background: 'rgba(255, 219, 187, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(153, 126, 103, 0.2)',
    borderRadius: '16px',
  }
};

const KPIS = [
  { label: 'Total Users', value: '14,205', icon: Users, color: '#4caf50' },
  { label: 'Total Projects', value: '3,842', icon: Briefcase, color: '#2196f3' },
  { label: 'Total Revenue', value: '$2.4M', icon: DollarSign, color: '#ff9800' },
  { label: 'AI Actions Taken', value: '842', icon: Bot, color: '#e91e63' }
];

const ACTIVITY_FEED = [
  { id: 1, user: 'TechCorp', role: 'Client', action: 'Posted Project', time: '10 mins ago' },
  { id: 2, user: 'Alex Rivera', role: 'Freelancer', action: 'Placed Bid', time: '15 mins ago' },
  { id: 3, user: 'Startup Inc', role: 'Client', action: 'Completed Project', time: '1 hour ago' },
  { id: 4, user: 'Quantum Devs', role: 'Team', action: 'Joined Platform', time: '2 hours ago' },
];

const REVENUE_DATA = [
  { month: 'Jan', rev: 120000 }, { month: 'Feb', rev: 135000 }, { month: 'Mar', rev: 150000 },
  { month: 'Apr', rev: 180000 }, { month: 'May', rev: 210000 }, { month: 'Jun', rev: 240000 },
  { month: 'Jul', rev: 260000, predicted: 260000 }, { month: 'Aug', predicted: 290000 },
  { month: 'Sep', predicted: 320000 }
];

const DOMAIN_DATA = [
  { domain: 'AI/ML', demand: 98 }, { domain: 'React', demand: 92 },
  { domain: 'Flutter', demand: 79 }, { domain: 'Blockchain', demand: 71 },
  { domain: 'UI/UX', demand: 65 }
];

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  const handleDownload = () => {
    const content = "Date,Revenue,New Users,Projects\n2026-07-01,$50000,120,45\n";
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weekly_report.csv';
    a.click();
  };

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: themeStyles.bg, color: themeStyles.cream }}>
      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 4 }}>Platform Admin Hub</Typography>

      {/* SECTION A: Executive KPIs */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {KPIS.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ ...themeStyles.glass, color: themeStyles.cream }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: themeStyles.primary }}>{kpi.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>{kpi.value}</Typography>
                </Box>
                <kpi.icon size={40} color={kpi.color} opacity={0.8} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* SECTION B: User Activity Feed */}
        <Grid item xs={12} md={4}>
          <Card sx={{ ...themeStyles.glass, color: themeStyles.cream, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Live Activity Feed</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ACTIVITY_FEED.map(feed => (
                  <Box key={feed.id} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">{feed.user}</Typography>
                      <Typography variant="caption" sx={{ color: themeStyles.primary }}>{feed.time}</Typography>
                    </Box>
                    <Typography variant="body2">
                      <Chip label={feed.role} size="small" sx={{ mr: 1, height: 20, fontSize: '0.65rem', bgcolor: themeStyles.primary, color: themeStyles.bg }} />
                      {feed.action}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* SECTION D: Automation Log */}
        <Grid item xs={12} md={8}>
          <Card sx={{ ...themeStyles.glass, color: themeStyles.cream, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent AI Automations</Typography>
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: themeStyles.primary }}>Time</TableCell>
                      <TableCell sx={{ color: themeStyles.primary }}>Action</TableCell>
                      <TableCell sx={{ color: themeStyles.primary }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: themeStyles.cream }}>10:30 AM</TableCell>
                      <TableCell sx={{ color: themeStyles.cream }}>Email sent to 45 inactive clients</TableCell>
                      <TableCell><Chip label="Success" color="success" size="small" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: themeStyles.cream }}>09:15 AM</TableCell>
                      <TableCell sx={{ color: themeStyles.cream }}>Generated weekly financial report</TableCell>
                      <TableCell><Chip label="Completed" color="info" size="small" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: themeStyles.cream }}>08:00 AM</TableCell>
                      <TableCell sx={{ color: themeStyles.cream }}>Alert: High neglect risk for User #892</TableCell>
                      <TableCell><Chip label="Triggered" color="warning" size="small" /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SECTION C: NEGLECT MODEL DASHBOARD */}
      <Box sx={{ ...themeStyles.glass, p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Bot color={themeStyles.cream} /> AI Neglect Intelligence Models
        </Typography>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 4, '& .MuiTab-root': { color: themeStyles.primary }, '& .Mui-selected': { color: `${themeStyles.cream} !important` }, '& .MuiTabs-indicator': { bgcolor: themeStyles.cream } }}>
          <Tab label="I. Customer Neglect" />
          <Tab label="II. Product Neglect" />
          <Tab label="III. Financial Neglect" />
          <Tab label="IV. Opportunity Neglect" />
        </Tabs>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            
            {/* Tab I: Customer Neglect */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid #f44336', color: themeStyles.cream, textAlign: 'center', p: 4, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ color: '#f44336', mb: 2 }}>System Neglect Score</Typography>
                    <Typography variant="h1" sx={{ fontWeight: 'bold' }}>24</Typography>
                    <Typography variant="body2" sx={{ mt: 2 }}>/ 100 (Lower is better)</Typography>
                  </Card>
                  <Box sx={{ mt: 3, p: 3, ...themeStyles.glass }}>
                    <Typography variant="subtitle1" sx={{ color: themeStyles.primary, mb: 1 }}>LLM Recommendation</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>"15 high-value clients haven't posted in 30 days. Recommend sending a 10% platform fee discount."</Typography>
                    <Button variant="contained" size="small" sx={{ bgcolor: themeStyles.primary }}>Execute Automation</Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: themeStyles.primary }}>Client</TableCell>
                          <TableCell sx={{ color: themeStyles.primary }}>Last Active</TableCell>
                          <TableCell sx={{ color: themeStyles.primary }}>Projects (30d)</TableCell>
                          <TableCell sx={{ color: themeStyles.primary }}>Risk</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ color: themeStyles.cream }}>Enterprise Corp</TableCell>
                          <TableCell sx={{ color: themeStyles.cream }}>45 days ago</TableCell>
                          <TableCell sx={{ color: themeStyles.cream }}>0</TableCell>
                          <TableCell><Chip label="HIGH" color="error" size="small" /></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ color: themeStyles.cream }}>Startup Hub</TableCell>
                          <TableCell sx={{ color: themeStyles.cream }}>20 days ago</TableCell>
                          <TableCell sx={{ color: themeStyles.cream }}>1</TableCell>
                          <TableCell><Chip label="MEDIUM" color="warning" size="small" /></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}

            {/* Tab II: Product Neglect */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" mb={2}>Feature Adoption Heatmap</Typography>
                <Grid container spacing={3}>
                  {['AI Chat', 'Market Intel', 'Team Formation', 'Auto-Reviews'].map(feat => (
                    <Grid item xs={12} md={3} key={feat}>
                      <Card sx={{ ...themeStyles.glass, p: 2, textAlign: 'center' }}>
                        <Typography variant="subtitle1" sx={{ color: themeStyles.cream }}>{feat}</Typography>
                        <Typography variant="h4" sx={{ color: themeStyles.primary, my: 1 }}>{Math.floor(Math.random() * 40 + 40)}%</Typography>
                        <Typography variant="caption" sx={{ color: 'gray' }}>Adoption Rate</Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1">Users ignoring AI Chat: 1,204</Typography>
                    <Typography variant="body2" sx={{ color: themeStyles.primary }}>Send them an interactive guide to boost productivity.</Typography>
                  </Box>
                  <Button variant="contained" sx={{ bgcolor: themeStyles.primary }}>Send Guide Email</Button>
                </Box>
              </Box>
            )}

            {/* Tab III: Financial Neglect */}
            {activeTab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">12-Month Revenue & AI Projection</Typography>
                  <Button variant="outlined" startIcon={<Download />} onClick={handleDownload} sx={{ color: themeStyles.cream, borderColor: themeStyles.primary }}>Weekly Report</Button>
                </Box>
                <Box sx={{ height: 350, width: '100%', mb: 4 }}>
                  <ResponsiveContainer>
                    <AreaChart data={REVENUE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke={themeStyles.primary} />
                      <YAxis stroke={themeStyles.primary} />
                      <Tooltip contentStyle={{ backgroundColor: themeStyles.bg, border: `1px solid ${themeStyles.primary}` }} />
                      <Area type="monotone" dataKey="rev" stroke={themeStyles.cream} fill={themeStyles.primary} fillOpacity={0.5} name="Actual Revenue" />
                      <Area type="monotone" dataKey="predicted" stroke="#4caf50" strokeDasharray="5 5" fill="transparent" name="AI Predicted Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ ...themeStyles.glass, p: 2 }}><Typography variant="subtitle2" sx={{ color: themeStyles.primary }}>MoM Growth</Typography><Typography variant="h5" color="success.main">+14.2%</Typography></Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ ...themeStyles.glass, p: 2 }}><Typography variant="subtitle2" sx={{ color: themeStyles.primary }}>Avg Contract</Typography><Typography variant="h5" color="info.main">$4,250</Typography></Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ ...themeStyles.glass, p: 2 }}><Typography variant="subtitle2" sx={{ color: themeStyles.primary }}>Projected Q-End</Typography><Typography variant="h5" color="warning.main">$870,000</Typography></Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab IV: Opportunity Neglect */}
            {activeTab === 3 && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" mb={2}>Trending IT Domains</Typography>
                  <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer>
                      <BarChart data={DOMAIN_DATA} layout="vertical" margin={{ left: 40 }}>
                        <XAxis type="number" stroke={themeStyles.primary} hide />
                        <YAxis dataKey="domain" type="category" stroke={themeStyles.cream} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: themeStyles.bg }} />
                        <Bar dataKey="demand" fill={themeStyles.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" mb={2}>AI Action Plan</Typography>
                  {DOMAIN_DATA.slice(0, 3).map(domain => (
                    <Box key={domain.domain} sx={{ ...themeStyles.glass, p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{domain.domain}</Typography>
                        <Typography variant="body2" sx={{ color: themeStyles.primary }}>Demand at {domain.demand}%. High opportunity.</Typography>
                      </Box>
                      <Button variant="outlined" size="small" sx={{ color: themeStyles.cream, borderColor: themeStyles.primary }}>Notify Top Talent</Button>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            )}

          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
