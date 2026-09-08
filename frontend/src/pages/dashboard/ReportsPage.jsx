import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { Box, Typography, Button, Card, CardContent, Tabs, Tab, MenuItem, Select, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Grid } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

const REVENUE_DATA = [
  {month:'Jul 25',actual:85000,predicted:88000},
  {month:'Aug 25',actual:92000,predicted:91000},
  {month:'Sep 25',actual:78000,predicted:82000},
  {month:'Oct 25',actual:105000,predicted:98000},
  {month:'Nov 25',actual:118000,predicted:112000},
  {month:'Dec 25',actual:134000,predicted:128000},
  {month:'Jan 26',actual:112000,predicted:118000},
  {month:'Feb 26',actual:126000,predicted:122000},
  {month:'Mar 26',actual:143000,predicted:138000},
  {month:'Apr 26',actual:158000,predicted:152000},
  {month:'May 26',actual:171000,predicted:165000},
  {month:'Jun 26',actual:189000,predicted:182000},
];

const REPORT_HISTORY = [
  {id:1,name:'Weekly Revenue Report',date:'2026-07-14',type:'PDF',size:'2.3 MB',status:'Ready'},
  {id:2,name:'Monthly KPI Summary',  date:'2026-07-01',type:'Excel',size:'1.8 MB',status:'Ready'},
  {id:3,name:'Q2 Financial Report',  date:'2026-06-30',type:'PDF',size:'5.1 MB',status:'Ready'},
  {id:4,name:'AI Recommendations Log',date:'2026-07-13',type:'CSV',size:'0.9 MB',status:'Ready'},
];

export default function ReportsPage() {
  const [period, setPeriod] = useState('Monthly');
  const [summary, setSummary] = useState({});
  const [revenue, setRevenue] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, revRes] = await Promise.all([
          api.get('/owner/summary'),
          api.get('/owner/revenue')
        ]);
        setSummary(sumRes.data);
        setRevenue(revRes.data);
      } catch (err) {
        console.error("Failed to load owner data:", err);
      }
    };
    fetchData();
  }, []);

  const totalRev = revenue.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalContracts = revenue.reduce((acc, curr) => acc + (curr.contractCount || 0), 0);
  const activeUsers = (summary.total_clients || 0) + (summary.total_freelancers || 0);

  const stats = [
    { label: 'Total Revenue', value: `$${totalRev}`, trend: '+12%' },
    { label: 'Contracts', value: totalContracts, trend: '+5%' },
    { label: 'Active Users', value: activeUsers, trend: '+8%' },
    { label: 'AI Accuracy', value: '94.2%', trend: '+1.2%' },
  ];

  const downloadCSV = () => {
    const csv = 'Month,Actual Revenue,Predicted Revenue\n' +
      REVENUE_DATA.map(r => `${r.month},${r.actual},${r.predicted}`).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='prolance-revenue-report.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully!');
  };

  const handleGenerate = (type) => {
    toast.success(`Generating ${type} report... will be ready in 30 seconds`);
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
          <BarChart3 /> Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Download size={16}/>} onClick={downloadCSV} sx={{ color: '#997E67', borderColor: '#664930' }}>CSV</Button>
          <Button variant="contained" startIcon={<FileText size={16}/>} onClick={() => handleGenerate('PDF')} sx={{ bgcolor: '#997E67', color: '#0D0A07', '&:hover': { bgcolor: '#FFDBBB' } }}>Export PDF</Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((kpi, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2 }}>
              <CardContent>
                <Typography sx={{ color: '#997E67', mb: 1 }}>{kpi.label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                  <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold' }}>{kpi.value}</Typography>
                  <Typography variant="body2" sx={{ color: '#34d399', fontWeight: 'bold', mb: 0.5 }}>{kpi.trend}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2, mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#FFDBBB' }}>Revenue Forecast vs Actual</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ color: '#FFDBBB', '.MuiOutlinedInput-notchedOutline': { borderColor: '#664930' } }}>
                <MenuItem value="Weekly">Weekly</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="Quarterly">Quarterly</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.map(r => ({ month: r.month, actual: r.totalRevenue, predicted: r.totalRevenue * 1.1 }))}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#997E67" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#997E67" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 73, 48, 0.2)" vertical={false} />
                <XAxis dataKey="month" stroke="#997E67" tick={{fill:'#997E67'}} />
                <YAxis stroke="#997E67" tick={{fill:'#997E67'}} />
                <Tooltip contentStyle={{ backgroundColor: '#0D0A07', borderColor: '#664930', color: '#FFDBBB' }} />
                <Area type="monotone" dataKey="actual" stroke="#997E67" fillOpacity={1} fill="url(#colorActual)" />
                <Area type="monotone" dataKey="predicted" stroke="#fbbf24" strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3 }}>Report History</Typography>
      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(13, 10, 7, 0.5)', border: '1px solid #664930', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(13, 10, 7, 0.9)' }}>
            <TableRow>
              <TableCell sx={{ color: '#997E67' }}>Report Name</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Date Generated</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Type</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Size</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Status</TableCell>
              <TableCell sx={{ color: '#997E67' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {REPORT_HISTORY.map((report) => (
              <TableRow key={report.id} sx={{ '& td': { borderColor: 'rgba(102, 73, 48, 0.3)', color: '#FFDBBB' } }}>
                <TableCell>{report.name}</TableCell>
                <TableCell sx={{ color: '#997E67' }}>{report.date}</TableCell>
                <TableCell>
                  <Chip label={report.type} size="small" sx={{ bgcolor: 'rgba(153, 126, 103, 0.2)', color: '#997E67' }} />
                </TableCell>
                <TableCell sx={{ color: '#997E67' }}>{report.size}</TableCell>
                <TableCell>
                  <Chip label={report.status} size="small" sx={{ bgcolor: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }} />
                </TableCell>
                <TableCell>
                  <Button size="small" sx={{ color: '#997E67' }}>Download</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
