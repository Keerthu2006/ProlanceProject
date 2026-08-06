import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, projects: 2400 },
  { name: 'Feb', revenue: 3000, projects: 1398 },
  { name: 'Mar', revenue: 2000, projects: 9800 },
  { name: 'Apr', revenue: 2780, projects: 3908 },
  { name: 'May', revenue: 1890, projects: 4800 },
  { name: 'Jun', revenue: 2390, projects: 3800 },
  { name: 'Jul', revenue: 3490, projects: 4300 },
];

export default function AnalyticsPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight="700" mb={4}>Analytics Overview</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className="glass-panel" sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>Revenue & Projects Growth</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
