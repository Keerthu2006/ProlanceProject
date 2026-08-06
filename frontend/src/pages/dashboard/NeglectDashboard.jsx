import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress, Grid } from '@mui/material';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Users, Eye, DollarSign, Lightbulb, AlertTriangle, Mail, Download, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

const NEGLECT_CUSTOMERS = [
  {name:'TechCorp Ltd', lastActive:78, projects30d:0, risk:'CRITICAL', score:82},
  {name:'StartupABC',   lastActive:45, projects30d:1, risk:'HIGH',     score:65},
  {name:'MegaInc',      lastActive:12, projects30d:3, risk:'LOW',      score:20},
  {name:'DevAgency',    lastActive:30, projects30d:2, risk:'MEDIUM',   score:45},
];

const FEATURE_ADOPTION = [
  {feature:'AI Chat',      adoption:45},{feature:'Market Intel',adoption:32},
  {feature:'Bid System',   adoption:78},{feature:'Teams',        adoption:18},
  {feature:'Reviews',      adoption:65},{feature:'Reports',      adoption:28},
];

const REVENUE_DATA = [
  {month:'Jan',actual:85000},{month:'Feb',actual:92000},{month:'Mar',actual:78000},
  {month:'Apr',actual:105000},{month:'May',actual:118000},{month:'Jun',actual:134000},
  {month:'Jul',actual:156000},{month:'Aug',predicted:162000},{month:'Sep',predicted:171000},{month:'Oct',predicted:185000},
];

const TRENDING_DOMAINS = [
  {domain:'AI/ML',        demand:98, predicted6m:99},{domain:'React/Next',demand:92,predicted6m:94},
  {domain:'DevOps/Cloud', demand:88, predicted6m:91},{domain:'Flutter',   demand:79,predicted6m:83},
  {domain:'Blockchain',   demand:65, predicted6m:72},{domain:'AR/VR',     demand:45,predicted6m:62},
];

export default function NeglectDashboard() {
  const [tab, setTab] = useState(0);

  const notifyAction = (msg) => {
    toast.success(msg);
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'CRITICAL': return '#f87171';
      case 'HIGH': return '#fbbf24';
      case 'MEDIUM': return '#fcd34d';
      default: return '#34d399';
    }
  };

  const downloadRevenueCSV = () => {
    const csv = 'Month,Actual Revenue,Predicted Revenue\n' +
      REVENUE_DATA.map(r => `${r.month},${r.actual||''},${r.predicted||''}`).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='revenue-forecast.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold', mb: 4 }}>AI Neglect Intelligence</Typography>

      <Box sx={{ borderBottom: 1, borderColor: '#664930', mb: 4 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="inherit" sx={{ '& .MuiTab-root': { color: '#997E67' }, '& .Mui-selected': { color: '#FFDBBB' }, '& .MuiTabs-indicator': { backgroundColor: '#FFDBBB' } }}>
          <Tab icon={<Users size={16}/>} iconPosition="start" label="Customer Neglect" />
          <Tab icon={<Eye size={16}/>} iconPosition="start" label="Product Neglect" />
          <Tab icon={<DollarSign size={16}/>} iconPosition="start" label="Financial Neglect" />
          <Tab icon={<Lightbulb size={16}/>} iconPosition="start" label="Opportunity Neglect" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2, textAlign: 'center', p: 3, height: '100%' }}>
              <Typography sx={{ color: '#997E67', mb: 2 }}>Overall Neglect Score</Typography>
              <Typography variant="h2" sx={{ color: '#fbbf24', fontWeight: 'bold', mb: 1 }}>62 <span style={{fontSize:'1.5rem', color:'#997E67'}}>/ 100</span></Typography>
              <Chip label="MEDIUM RISK" sx={{ bgcolor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontWeight: 'bold' }} />
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Typography sx={{ color: '#FFDBBB', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><AlertTriangle size={18} color="#a78bfa" /> LLM Recommendation</Typography>
                <Typography sx={{ color: '#997E67', mb: 1 }}><strong>Problem:</strong> 2 clients inactive 45+ days.</Typography>
                <Typography sx={{ color: '#997E67', mb: 1 }}><strong>Reason:</strong> Declining project frequency + low engagement.</Typography>
                <Typography sx={{ color: '#FFDBBB', mb: 2 }}><strong>Optimization:</strong> Send personalized re-engagement email with project suggestions.</Typography>
                <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 'bold' }}>Confidence: 87%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(13, 10, 7, 0.5)', border: '1px solid #664930' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(13, 10, 7, 0.9)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#997E67' }}>Client Name</TableCell>
                    <TableCell sx={{ color: '#997E67' }}>Last Active (Days)</TableCell>
                    <TableCell sx={{ color: '#997E67' }}>Projects (30d)</TableCell>
                    <TableCell sx={{ color: '#997E67' }}>Risk Level</TableCell>
                    <TableCell sx={{ color: '#997E67' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {NEGLECT_CUSTOMERS.map(c => (
                    <TableRow key={c.name}>
                      <TableCell sx={{ color: '#FFDBBB' }}>{c.name}</TableCell>
                      <TableCell sx={{ color: '#997E67' }}>{c.lastActive}</TableCell>
                      <TableCell sx={{ color: '#997E67' }}>{c.projects30d}</TableCell>
                      <TableCell>
                        <Chip label={c.risk} size="small" sx={{ bgcolor: `${getRiskColor(c.risk)}20`, color: getRiskColor(c.risk), fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => notifyAction('Reminder Email Sent')} sx={{ color: '#997E67' }}>Send Reminder</Button>
                        <Button size="small" onClick={() => notifyAction('Discount Offer Sent')} sx={{ color: '#997E67' }}>Send Discount</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3 }}>Feature Adoption Rates (%)</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={FEATURE_ADOPTION}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 73, 48, 0.2)" vertical={false} />
                      <XAxis dataKey="feature" stroke="#997E67" />
                      <YAxis stroke="#997E67" />
                      <Tooltip contentStyle={{ backgroundColor: '#0D0A07', borderColor: '#664930' }} />
                      <Bar dataKey="adoption" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3 }}>Low Adoption Features</Typography>
                {FEATURE_ADOPTION.filter(f => f.adoption < 40).map(f => (
                  <Box key={f.feature} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ color: '#FFDBBB' }}>{f.feature}</Typography>
                      <Typography sx={{ color: '#f87171', fontWeight: 'bold' }}>{f.adoption}%</Typography>
                    </Box>
                    <Button fullWidth variant="outlined" onClick={() => notifyAction(`Feature Guide sent for ${f.feature}`)} sx={{ color: '#997E67', borderColor: '#664930', mb: 1 }}>Send Feature Guide</Button>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#FFDBBB' }}>Revenue Projection vs Actual</Typography>
                  <Button startIcon={<Download size={16}/>} onClick={downloadRevenueCSV} sx={{ color: '#997E67' }}>Export CSV</Button>
                </Box>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REVENUE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 73, 48, 0.2)" vertical={false} />
                      <XAxis dataKey="month" stroke="#997E67" />
                      <YAxis stroke="#997E67" />
                      <Tooltip contentStyle={{ backgroundColor: '#0D0A07', borderColor: '#664930' }} />
                      <Area type="monotone" dataKey="actual" stroke="#60a5fa" fillOpacity={0.2} fill="#60a5fa" />
                      <Area type="monotone" dataKey="predicted" stroke="#fbbf24" strokeDasharray="5 5" fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 2 }}>AI Growth Tactics</Typography>
            <Grid container spacing={3}>
              {['Launch referral bonus for top 10% users', 'Upsell premium tier to active free users', 'Automate invoice reminders for overdue payments'].map((tactic, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.4)', border: '1px solid #664930', borderRadius: 2 }}>
                    <CardContent>
                      <Typography sx={{ color: '#FFDBBB', mb: 2 }}>{tactic}</Typography>
                      <Chip label={`Impact: +${Math.floor(Math.random()*15)+5}% Revenue`} size="small" sx={{ bgcolor: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      {tab === 3 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3 }}>Trending Skill Domains</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={TRENDING_DOMAINS} layout="vertical" margin={{ left: 40 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="domain" type="category" stroke="#997E67" />
                      <Tooltip contentStyle={{ backgroundColor: '#0D0A07', borderColor: '#664930' }} />
                      <Bar dataKey="demand" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(13, 10, 7, 0.5)', border: '1px solid #664930' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(13, 10, 7, 0.9)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#997E67' }}>Domain</TableCell>
                    <TableCell sx={{ color: '#997E67' }}>Current Demand</TableCell>
                    <TableCell sx={{ color: '#997E67' }}>Predicted (6m)</TableCell>
                    <TableCell sx={{ color: '#997E67' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TRENDING_DOMAINS.map(d => (
                    <TableRow key={d.domain}>
                      <TableCell sx={{ color: '#FFDBBB' }}>{d.domain}</TableCell>
                      <TableCell sx={{ color: '#997E67' }}>{d.demand}</TableCell>
                      <TableCell sx={{ color: '#34d399', fontWeight: 'bold' }}>{d.predicted6m}</TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => notifyAction(`Notified top freelancers for ${d.domain}`)} sx={{ color: '#997E67' }}>Notify Top Freelancers</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
