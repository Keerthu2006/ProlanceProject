import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Grid } from '@mui/material';
import { Zap, Mail, Bell, FileText, RefreshCw, Check, X, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/api';

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
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/owner/automation-log');
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch automation logs", err);
      }
    };
    fetchData();
  }, []);

  const filteredLogs = filter === 'All' ? logs : logs.filter(l => (l.actionType || '').toUpperCase().includes(filter.toUpperCase()));

  const successCount = logs.filter(l => l.success).length;
  const failedCount = logs.filter(l => !l.success && l.errorMessage).length;
  const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) + '%' : '0%';
  const stats = [
    { label: 'Total Today', value: logs.length, color: '#60a5fa' },
    { label: 'Success Rate', value: successRate, color: '#34d399' },
    { label: 'Failed', value: failedCount, color: '#f87171' },
    { label: 'Pending', value: 0, color: '#fbbf24' },
  ];

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
        {stats.map((stat, i) => (
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
            {filteredLogs.map((log) => (
              <TableRow key={log.id} sx={{ '& td': { borderColor: 'rgba(102, 73, 48, 0.3)', color: '#FFDBBB' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileText size={16} />
                    {log.actionType}
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#997E67' }}>System Event</TableCell>
                <TableCell>System</TableCell>
                <TableCell sx={{ color: '#997E67' }}>{log.actionDetail || log.actionType}</TableCell>
                <TableCell>
                  <Chip 
                    label={log.success ? 'SUCCESS' : 'FAILED'} 
                    size="small" 
                    sx={getStatusColor(log.success ? 'SUCCESS' : 'FAILED')} 
                  />
                </TableCell>
                <TableCell sx={{ color: '#997E67' }}>{new Date(log.executedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
