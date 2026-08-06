import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Card, CardContent, Button, Chip, LinearProgress, Grid } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, TrendingUp, Award, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

const TRENDING_SKILLS = [
  {skill:'AI/ML Engineering', demand:98, growth:'+45%', salary:'$140k'},
  {skill:'React.js',          demand:92, growth:'+18%', salary:'$115k'},
  {skill:'Cloud DevOps',       demand:88, growth:'+32%', salary:'$130k'},
  {skill:'Flutter/Dart',       demand:79, growth:'+28%', salary:'$105k'},
  {skill:'Blockchain/Web3',    demand:65, growth:'+55%', salary:'$150k'},
  {skill:'Cybersecurity',      demand:85, growth:'+22%', salary:'$120k'},
];

const LEARNING_PATHS = [
  {name:'AI Engineering Bootcamp', provider:'Coursera', duration:'12 weeks', boost:'+35%', chip:'HOT', color:'#f87171'},
  {name:'AWS Solutions Architect', provider:'AWS Training', duration:'8 weeks', boost:'+28%', chip:'TRENDING', color:'#fbbf24'},
  {name:'React Advanced Patterns', provider:'Udemy', duration:'4 weeks', boost:'+20%', chip:'POPULAR', color:'#60a5fa'},
  {name:'LangChain & LLMs',        provider:'DeepLearning.AI', duration:'6 weeks', boost:'+42%', chip:'HOT', color:'#f87171'},
  {name:'Flutter Masterclass',     provider:'Udemy', duration:'10 weeks', boost:'+25%', chip:'TRENDING', color:'#fbbf24'},
  {name:'Kubernetes & Docker',     provider:'Linux Foundation', duration:'6 weeks', boost:'+30%', chip:'GROWING', color:'#34d399'},
];

export default function SkillDevelopment() {
  const handleEnroll = () => {
    toast.success('Redirecting to course... 🚀');
  };

  return (
    <Box sx={{ p: 4, maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" sx={{ color: '#FFDBBB', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp /> AI-Powered Skill Development
        </Typography>
        <Typography sx={{ color: '#997E67', mt: 1 }}>Market intelligence and personalized learning paths to maximize your earnings.</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3 }}>Trending Skills Demand</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TRENDING_SKILLS} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="skill" type="category" stroke="#997E67" tick={{ fill: '#997E67' }} />
                    <Tooltip cursor={{ fill: 'rgba(153, 126, 103, 0.1)' }} contentStyle={{ backgroundColor: '#0D0A07', borderColor: '#664930', color: '#FFDBBB' }} />
                    <Bar dataKey="demand" fill="#997E67" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.7)', border: '1px solid #664930', borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3 }}>Your Skill Gap Analysis</Typography>
              
              <Typography sx={{ color: '#997E67', mb: 1, fontWeight: 'bold' }}>Your Current Skills</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <Chip label="React" sx={{ bgcolor: 'rgba(153, 126, 103, 0.2)', color: '#FFDBBB' }} />
                <Chip label="Node.js" sx={{ bgcolor: 'rgba(153, 126, 103, 0.2)', color: '#FFDBBB' }} />
                <Chip label="Python" sx={{ bgcolor: 'rgba(153, 126, 103, 0.2)', color: '#FFDBBB' }} />
              </Box>

              <Typography sx={{ color: '#997E67', mb: 1, fontWeight: 'bold' }}>High-Demand Market Skills</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <Chip label="AI/ML" sx={{ bgcolor: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.5)' }} />
                <Chip label="DevOps" sx={{ bgcolor: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.5)' }} />
                <Chip label="Cloud (AWS)" sx={{ bgcolor: 'rgba(248, 113, 113, 0.2)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.5)' }} />
              </Box>

              <Typography variant="body2" sx={{ color: '#997E67', fontStyle: 'italic' }}>
                * Learning AI/ML and Cloud could increase your bidding success by up to 45%.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ color: '#FFDBBB', mb: 3, mt: 2 }}>Recommended Learning Paths</Typography>
          <Grid container spacing={3}>
            {LEARNING_PATHS.map((path, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card sx={{ bgcolor: 'rgba(13, 10, 7, 0.4)', border: '1px solid #664930', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip label={path.chip} size="small" sx={{ bgcolor: `${path.color}20`, color: path.color, fontWeight: 'bold' }} />
                        <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><TrendingUp size={14} style={{ marginRight: 4 }}/> {path.boost} Income</Typography>
                      </Box>
                      <Typography sx={{ color: '#FFDBBB', fontWeight: 'bold', mb: 1 }}>{path.name}</Typography>
                      <Typography variant="body2" sx={{ color: '#997E67', mb: 2 }}>{path.provider}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={16} color="#664930" />
                        <Typography variant="body2" sx={{ color: '#997E67' }}>{path.duration}</Typography>
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 2, borderTop: '1px solid rgba(102, 73, 48, 0.3)' }}>
                      <Button fullWidth endIcon={<ExternalLink size={16} />} onClick={handleEnroll} sx={{ color: '#997E67', '&:hover': { bgcolor: 'rgba(153, 126, 103, 0.1)', color: '#FFDBBB' } }}>Enroll Now</Button>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
