import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Grid } from '@mui/material';
import { Zap, Mail, Bell, FileText, RefreshCw, Check, X, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const MOCK_LOGS = [
  {id:1,  type:'EMAIL',    trigger:'Customer Neglect', target:'client@company.com', status:'SUCCESS', time:'2 min ago',  action:'Re-engagement email sent'},
  {id:2,  type:'NOTIF',   trigger:'Bid Accepted',     target:'freelancer@dev.io',  status:'SUCCESS', time:'8 min ago',  action:'Push notification sent'},
  {id:3,  type:'REPORT',  trigger:'Weekly Schedule',  target:'admin@prolance.ai',  status:'SUCCESS', time:'1 hr ago',   action:'Revenue report emailed'},
  {id:4,  type:'EMAIL',   trigger:'Opportunity Alert', target:'dev@techpro.io',    status:'FAILED',  time:'2 hr ago',   action:'SMTP timeout - retrying'},
  {id:5,  type:'EMAIL',   trigger:'Product Neglect',  target:'user@startup.com',  status:'PENDING', time:'5 min ago',  action:'Feature guide queued'},
  {id:6,  type:'REPORT',  trigger:'Financial Neglect', target:'cfo@company.com',  status:'SUCCESS', time:'3 hr ago',   action:'Risk report generated'},
  {id:7,  type:'NOTIF',   trigger:'Market Alert',     target:'all_freelancers',   status:'SUCCESS', time:'4 hr ago',   action:'AI/ML trend notification'},
  {id:8,  type:'EMAIL',   trigger:'Discount Offer',   target:'inactive@client.io', status:'SUCCESS', time:'6 hr ago',  action:'10% discount coupon sent'},
  {id:9,  type:'EMAIL',   trigger:'Milestone Overdue', target:'dev@agency.com',   status:'FAILED',  time:'8 hr ago',   action:'Email bounce - invalid addr'},
  {id:10, type:'REPORT',  trigger:'Daily Schedule',   target:'admin@prolance.ai',  status:'SUCCESS', time:'1 day ago',  action:'Activity report generated'},
];

const getStatusColor = (status) => {
  if (status === 'SUCCESS') return { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' };
  if (status === 'FAILED') return { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' };
  return { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' };
};

const getTypeIcon = (type) => {
  if (type === 'EMAIL') return <Mail size={16} />;
  if (type === 'NOTIF') return <Bell size={16} />;
  return <FileText size={16} />;
};

export default function AutomationMonitor() {
  const [filter, setFilter] = useState('All');

  const filteredLogs = filter === 'All' ? MOCK_LOGS : MOCK_LOGS.filter(l => l.type === filter.toUpperCase());

  const handleAction = (msg) => {
    toast.success(msg);
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Zap /> Automation Monitor
        </Typography>
        <Button startIcon={<RefreshCw size={16} />} sx={{ color: '#997E67' }}>Refresh Data</Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Today', value: 10, color: '#60a5fa' },
          { label: 'Success Rate', value: '80%', color: '#34d399' },
          { label: 'Failed', value: 2, color: '#f87171' },
          { label: 'Pending', value: 1, color: '#fbbf24' },
        ].map((stat, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: '#997E67', mb: 1 }}>{stat.label}</Typography>
                <Typography variant="h3" sx={{ color: stat.color, fontWeight: 'bold' }}>{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['All', 'Email', 'Notification', 'Report'].map(f => (
            <Chip
              key={f} label={f} onClick={() => setFilter(f)}
              sx={{
                bgcolor: filter === f ? 'rgba(153, 126, 103, 0.3)' : 'transparent',
                color: filter === f ? '#FFDBBB' : '#997E67',
                border: '1px solid', borderColor: filter === f ? '#997E67' : '#664930',
                cursor: 'pointer'
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => handleAction('Re-engagement queued!')} sx={{ color: '#997E67', borderColor: '#664930' }}>Send Re-engagement</Button>
          <Button variant="outlined" onClick={() => handleAction('Report generation started!')} sx={{ color: '#997E67', borderColor: '#664930' }}>Run Report</Button>
          <Button variant="outlined" onClick={() => handleAction('Market alert sent!')} sx={{ color: '#997E67', borderColor: '#664930' }}>Send Market Alert</Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(13, 10, 7, 0.5)', border: '1px solid #664930', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(13, 10, 7, 0.9)' }}>
            <TableRow>
              <TableCell sx={{ color: '#997E67' }}>Type</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Trigger</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Target</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Action</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Status</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log, i) => (
              <TableRow key={log.id} sx={{ '& td': { borderColor: 'rgba(102, 73, 48, 0.3)' } }}>
                <TableCell sx={{ color: '#FFDBBB' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{getTypeIcon(log.type)} {log.type}</Box>
                </TableCell>
                <TableCell sx={{ color: '#FFDBBB' }}>{log.trigger}</TableCell>
                <TableCell sx={{ color: '#997E67' }}>{log.target}</TableCell>
                <TableCell sx={{ color: '#FFDBBB' }}>{log.action}</TableCell>
                <TableCell>
                  <Chip 
                    label={log.status} size="small" 
                    icon={log.status === 'SUCCESS' ? <Check size={14}/> : (log.status === 'FAILED' ? <X size={14}/> : <Clock size={14}/>)}
                    sx={{ bgcolor: getStatusColor(log.status).bg, color: getStatusColor(log.status).color, fontWeight: 'bold' }} 
                  />
                </TableCell>
                <TableCell sx={{ color: '#997E67' }}>{log.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
