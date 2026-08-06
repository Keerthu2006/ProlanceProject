import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Card, CardContent, LinearProgress, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { Activity, Server, Database, Cpu, Globe, Wifi, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const SERVICES = [
  {name:'Backend API (Spring Boot)', port:8080, status:'ONLINE',  latency:'142ms'},
  {name:'AI Engine (FastAPI)',        port:8001, status:'ONLINE',  latency:'287ms'},
  {name:'MySQL Database',             port:3306, status:'ONLINE',  latency:'8ms'},
  {name:'Redis Cache',                port:6379, status:'OFFLINE', latency:'N/A'},
  {name:'LLM Gateway (Gemini)',       port:443,  status:'ONLINE',  latency:'680ms'},
  {name:'WebSocket Server',           port:8080, status:'ONLINE',  latency:'12ms'},
];

const ERROR_LOG = [
  {time:'00:04:39', level:'WARN',  message:'Redis connection refused - using in-memory fallback'},
  {time:'23:55:04', level:'ERROR', message:'LLM timeout for CustomerNeglectAgent - retried 2x'},
  {time:'22:13:51', level:'INFO',  message:'DatabaseSeeder completed - 50 records inserted'},
];

export default function SystemHealth() {
  const [metrics, setMetrics] = useState({
    cpu: 34, ram: 61, storage: 48, apiResponseTime: 142,
    dbConnections: 23, uptime: 99.97
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(100, prev.cpu + (Math.random() * 10 - 5))),
        ram: Math.max(20, Math.min(95, prev.ram + (Math.random() * 4 - 2))),
        apiResponseTime: Math.floor(Math.max(50, prev.apiResponseTime + (Math.random() * 40 - 20)))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (val) => val > 85 ? '#f87171' : val > 70 ? '#fbbf24' : '#34d399';

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Activity /> System Health Monitor
          </Typography>
          <Typography sx={{ color: '#997E67', mt: 1 }}>Last updated: Just now</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Chip icon={<CheckCircle size={16}/>} label="99.97% Uptime ✓" sx={{ bgcolor: 'rgba(52, 211, 153, 0.2)', color: '#34d399', fontWeight: 'bold' }} />
          <Button startIcon={<RefreshCw size={16} />} sx={{ color: '#997E67' }}>Refresh</Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'CPU Usage', val: metrics.cpu, suffix: '%', icon: <Cpu/> },
          { label: 'RAM Usage', val: metrics.ram, suffix: '%', icon: <Server/> },
          { label: 'Storage', val: metrics.storage, suffix: '%', icon: <Database/> },
          { label: 'API Latency', val: metrics.apiResponseTime, suffix: 'ms', icon: <Globe/> },
        ].map((m, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, color: '#997E67' }}>
                  {m.label} {m.icon}
                </Box>
                <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold', mb: 2 }}>
                  {Math.round(m.val)}{m.suffix}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={m.val} 
                  sx={{ 
                    height: 8, borderRadius: 4, bgcolor: 'rgba(102, 73, 48, 0.3)',
                    '& .MuiLinearProgress-bar': { bgcolor: getMetricColor(m.val) }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3 }}>Services Status</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { color: '#997E67', borderBottom: '1px solid #664930' } }}>
                      <TableCell>Service</TableCell>
                      <TableCell>Port</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Latency</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {SERVICES.map((s, i) => (
                      <TableRow key={i} sx={{ '& td': { color: '#FFDBBB', borderBottom: '1px solid rgba(102, 73, 48, 0.3)' } }}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell sx={{ color: '#997E67' }}>{s.port}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: s.status === 'ONLINE' ? '#34d399' : '#f87171' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.status === 'ONLINE' ? '#34d399' : '#f87171' }} />
                            {s.status}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#997E67' }}>{s.latency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AlertTriangle size={20} color="#fbbf24"/> System Events Log
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ERROR_LOG.map((log, i) => (
                  <Box key={i} sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${log.level==='ERROR'?'#f87171':log.level==='WARN'?'#fbbf24':'#60a5fa'}`, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#997E67' }}>{log.time}</Typography>
                      <Typography variant="caption" sx={{ color: log.level==='ERROR'?'#f87171':log.level==='WARN'?'#fbbf24':'#60a5fa', fontWeight: 'bold' }}>{log.level}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#FFDBBB', fontFamily: 'monospace' }}>{log.message}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
