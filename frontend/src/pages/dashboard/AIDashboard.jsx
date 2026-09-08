import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Button
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Cpu, Database, CheckCircle, XCircle } from 'lucide-react';

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

const ENGINE_HEALTH = [
  { name: 'Customer Neglect Model', status: 'Healthy', accuracy: '94.2%' },
  { name: 'Product Neglect Model', status: 'Healthy', accuracy: '89.5%' },
  { name: 'Financial Neglect Model', status: 'Training', accuracy: '91.8%' },
  { name: 'Opportunity Neglect Model', status: 'Healthy', accuracy: '95.1%' },
];

export default function AIDashboard() {
const [feed, setFeed] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, recRes, evRes] = await Promise.all([
          api.get('/owner/summary'),
          api.get('/owner/recommendations/pending'),
          api.get('/owner/events')
        ]);
        setSummary(sumRes.data);
        setRecommendations(recRes.data);
        setFeed(evRes.data);
      } catch (err) {
        console.error("Failed to load AI data:", err);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (id, action) => {
    try {
      if (action === 'APPROVED') {
        await api.post(`/owner/recommendations/${id}/approve`);
      } else {
        await api.post(`/owner/recommendations/${id}/reject`);
      }
      setRecommendations(recommendations.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getScore = (agent) => summary[`${agent}_score`] || 0;

const trendData = Array.from({ length: 20 }, (_, i) => ({ time: i, load: 40 + Math.random() * 40 }));

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: themeStyles.bg, color: themeStyles.cream }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Cpu size={40} color={themeStyles.primary} />
        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>AI Intelligence Center</Typography>
      </Box>

      {/* Engine Health */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {ENGINE_HEALTH.map((engine, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ ...themeStyles.glass, color: themeStyles.cream }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: themeStyles.primary, mb: 1 }}>{engine.name}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5">{engine.accuracy}</Typography>
                  <Chip 
                    label={engine.status} 
                    size="small" 
                    color={engine.status === 'Healthy' ? 'success' : 'warning'} 
                    variant="outlined" 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Recommendation Engine */}
        <Grid item xs={12} md={7}>
          <Card sx={{ ...themeStyles.glass, color: themeStyles.cream, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>Pending AI Recommendations</Typography>
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: themeStyles.primary }}>Recommendation</TableCell>
                      <TableCell sx={{ color: themeStyles.primary }}>Confidence</TableCell>
                      <TableCell align="right" sx={{ color: themeStyles.primary }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recommendations.map(rec => (
                      <TableRow key={rec.id}>
                        <TableCell sx={{ color: themeStyles.cream, maxWidth: 200 }}>{rec.text}</TableCell>
                        <TableCell sx={{ color: '#4caf50' }}>{rec.confidence}</TableCell>
                        <TableCell align="right">
                          {rec.status === 'PENDING' ? (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button size="small" variant="contained" color="success" onClick={() => handleAction(rec.id, 'APPROVED')}><CheckCircle size={16}/></Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => handleAction(rec.id, 'REJECTED')}><XCircle size={16}/></Button>
                            </Box>
                          ) : (
                            <Chip label={rec.status} color={rec.status === 'APPROVED' ? 'success' : 'error'} size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time feed & Server load */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Card sx={{ ...themeStyles.glass, color: themeStyles.cream }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Activity size={20} color={themeStyles.primary} /> Real-time Inference Feed
                </Typography>
                <Box sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {feed.length === 0 ? <Typography variant="body2" sx={{ color: themeStyles.primary }}>Waiting for events...</Typography> : null}
                  {feed.map(f => (
                    <Box key={f.id} sx={{ p: 1, borderLeft: `2px solid ${themeStyles.primary}`, bgcolor: 'rgba(255,255,255,0.02)' }}>
                      <Typography variant="caption" sx={{ color: themeStyles.primary }}>{f.time}</Typography>
                      <Typography variant="body2">{f.text}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ ...themeStyles.glass, color: themeStyles.cream }}>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Database size={20} color={themeStyles.primary} /> Model Compute Load
                </Typography>
                <Box sx={{ height: 150, width: '100%' }}>
                  <ResponsiveContainer>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <YAxis domain={[0, 100]} hide />
                      <Line type="monotone" dataKey="load" stroke={themeStyles.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
