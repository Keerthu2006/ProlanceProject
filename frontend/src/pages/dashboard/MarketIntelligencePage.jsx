import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Chip, LinearProgress, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { Globe, TrendingUp, Brain, Lightbulb, ArrowRight, BookOpen, Star, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const card = { hidden:{opacity:0,y:20,scale:0.97}, show:{opacity:1,y:0,scale:1,transition:{duration:0.4,ease:[0.22,1,0.36,1]}} };
const stagger = { show:{ transition:{ staggerChildren:0.08 } } };

const trendingSkills = [
  { skill:'AI/ML Engineering',demand:98,growth:'+45%',jobs:1240,avg:'$145/hr',color:'#4ade80'},
  { skill:'React / Next.js',demand:92,growth:'+28%',jobs:980,avg:'$95/hr',color:'#FFDBBB'},
  { skill:'Spring Boot / Java',demand:85,growth:'+18%',jobs:720,avg:'$90/hr',color:'#997E67'},
  { skill:'Flutter / Mobile',demand:79,growth:'+32%',jobs:540,avg:'$85/hr',color:'#a5b4fc'},
  { skill:'DevOps / Kubernetes',demand:88,growth:'+38%',jobs:630,avg:'$120/hr',color:'#facc15'},
  { skill:'Blockchain / Web3',demand:65,growth:'+21%',jobs:290,avg:'$110/hr',color:'#f87171'},
];
const marketData = [
  {month:'Jan',ai:62,web:78,mobile:55},{month:'Feb',ai:68,web:80,mobile:60},
  {month:'Mar',ai:75,web:79,mobile:65},{month:'Apr',ai:82,web:83,mobile:70},
  {month:'May',ai:89,web:85,mobile:74},{month:'Jun',ai:96,web:87,mobile:79},
];
const opportunities = [
  {title:'AI Chatbot Development',demand:'Very High',earning:'$8,000-$15,000',timeline:'30 days',match:94,skills:['Python','LangChain','FastAPI'],color:'#4ade80'},
  {title:'React Dashboard Contracts',demand:'High',earning:'$5,000-$10,000',timeline:'45 days',match:88,skills:['React','TypeScript','Recharts'],color:'#FFDBBB'},
  {title:'Cloud Migration Projects',demand:'Growing',earning:'$12,000-$25,000',timeline:'60 days',match:71,skills:['AWS','Docker','Kubernetes'],color:'#facc15'},
];
const learningPaths = [
  {title:'Generative AI with LangChain',provider:'Coursera',duration:'4 weeks',rating:4.9,income:'+$40/hr'},
  {title:'Advanced React Patterns',provider:'Frontend Masters',duration:'2 weeks',rating:4.8,income:'+$20/hr'},
  {title:'Spring Boot Microservices',provider:'Udemy',duration:'6 weeks',rating:4.7,income:'+$25/hr'},
];

export default function MarketIntelligencePage() {
  const [activeSkill, setActiveSkill] = useState(null);

  return (
    <Box sx={{ pb:6 }}>
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
        <Paper sx={{ p:4,mb:4,background:'linear-gradient(135deg,rgba(99,102,241,0.1) 0%,rgba(153,126,103,0.1) 100%)',border:'1px solid rgba(165,180,252,0.15)',position:'relative',overflow:'hidden' }}>
          <Box sx={{ position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'radial-gradient(circle,rgba(165,180,252,0.15) 0%,transparent 70%)' }} />
          <Box sx={{ display:'flex',alignItems:'center',gap:2,mb:1 }}>
            <Box sx={{ p:1.5,borderRadius:2,background:'rgba(165,180,252,0.15)',color:'#a5b4fc' }}><Globe size={24} /></Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight:900,color:'#F5EDE4' }}>Market Intelligence</Typography>
              <Typography sx={{ color:'text.secondary' }}>AI-powered market trend analysis • Skill gap detection • Opportunity discovery</Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex',gap:2,mt:2,flexWrap:'wrap' }}>
            {['AI scanning 500+ job boards','Updated hourly','6 High-opportunity skills detected'].map(b => (
              <Chip key={b} label={b} size="small" sx={{ bgcolor:'rgba(165,180,252,0.12)',color:'#a5b4fc',border:'1px solid rgba(165,180,252,0.2)',fontWeight:700 }} />
            ))}
          </Box>
        </Paper>
      </motion.div>

      {/* Trending Skills */}
      <motion.div variants={card} initial="hidden" animate="show">
        <Paper sx={{ p:3,mb:4 }}>
          <Box sx={{ display:'flex',alignItems:'center',gap:1.5,mb:3 }}>
            <Box sx={{ p:1,borderRadius:1.5,background:'rgba(74,222,128,0.12)',color:'#4ade80' }}><TrendingUp size={18} /></Box>
            <Typography variant="h6" sx={{ fontWeight:800 }}>Trending Skills — Market Demand</Typography>
          </Box>
          <Grid container spacing={2}>
            {trendingSkills.map((s, i) => (
              <Grid key={s.skill} item xs={12} sm={6}>
                <motion.div
                  initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}}
                  whileHover={{ scale:1.02 }}
                  onClick={() => setActiveSkill(activeSkill===s.skill ? null : s.skill)}
                  style={{ cursor:'pointer' }}
                >
                  <Box sx={{ p:2.5,borderRadius:2,background:activeSkill===s.skill?`${s.color}08`:'rgba(255,219,187,0.02)',border:`1px solid ${activeSkill===s.skill?s.color:'rgba(255,219,187,0.07)'}`,transition:'all 0.25s' }}>
                    <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'center',mb:1 }}>
                      <Typography sx={{ fontWeight:700,color:'#F5EDE4',fontSize:'0.9rem' }}>{s.skill}</Typography>
                      <Chip label={s.growth} size="small" sx={{ bgcolor:`${s.color}15`,color:s.color,fontWeight:800,fontSize:'0.7rem',height:22 }} />
                    </Box>
                    <Box sx={{ display:'flex',alignItems:'center',gap:1,mb:1.5 }}>
                      <Box sx={{ flex:1,height:6,borderRadius:9999,background:'rgba(255,219,187,0.08)',overflow:'hidden' }}>
                        <motion.div initial={{width:0}} animate={{width:`${s.demand}%`}} transition={{duration:0.8,delay:i*0.1+0.3}} style={{height:'100%',background:`linear-gradient(90deg,${s.color}88,${s.color})`,borderRadius:9999}} />
                      </Box>
                      <Typography variant="caption" sx={{ color:s.color,fontWeight:700,flexShrink:0 }}>{s.demand}%</Typography>
                    </Box>
                    {activeSkill === s.skill && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                        <Box sx={{ display:'flex',gap:2,pt:1,borderTop:'1px solid rgba(255,219,187,0.08)' }}>
                          <Box sx={{ textAlign:'center' }}><Typography sx={{ fontSize:'0.82rem',fontWeight:800,color:s.color }}>{s.jobs.toLocaleString()}</Typography><Typography variant="caption" sx={{ color:'text.secondary' }}>Open Jobs</Typography></Box>
                          <Box sx={{ textAlign:'center' }}><Typography sx={{ fontSize:'0.82rem',fontWeight:800,color:s.color }}>{s.avg}</Typography><Typography variant="caption" sx={{ color:'text.secondary' }}>Avg Rate</Typography></Box>
                        </Box>
                      </motion.div>
                    )}
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </motion.div>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          {/* Market Chart */}
          <motion.div variants={card} initial="hidden" animate="show" transition={{delay:0.1}}>
            <Paper sx={{ p:3,mb:4 }}>
              <Typography variant="h6" sx={{ fontWeight:800,mb:3 }}>Demand Trends by Category</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={marketData}>
                  <defs>
                    <linearGradient id="aiG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.35} /><stop offset="95%" stopColor="#a5b4fc" stopOpacity={0} /></linearGradient>
                    <linearGradient id="webG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFDBBB" stopOpacity={0.3} /><stop offset="95%" stopColor="#FFDBBB" stopOpacity={0} /></linearGradient>
                    <linearGradient id="mobG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} /><stop offset="95%" stopColor="#4ade80" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#7D6A5C" tick={{fontSize:12}} />
                  <YAxis stroke="#7D6A5C" tick={{fontSize:12}} />
                  <Tooltip contentStyle={{background:'rgba(10,7,4,0.9)',border:'1px solid rgba(255,219,187,0.15)',borderRadius:8,color:'#F5EDE4'}} />
                  <Area type="monotone" dataKey="ai" stroke="#a5b4fc" fill="url(#aiG)" strokeWidth={2} name="AI/ML" />
                  <Area type="monotone" dataKey="web" stroke="#FFDBBB" fill="url(#webG)" strokeWidth={2} name="Web Dev" />
                  <Area type="monotone" dataKey="mobile" stroke="#4ade80" fill="url(#mobG)" strokeWidth={2} name="Mobile" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>

          {/* Opportunities */}
          <motion.div variants={card} initial="hidden" animate="show" transition={{delay:0.2}}>
            <Paper sx={{ p:3 }}>
              <Box sx={{ display:'flex',alignItems:'center',gap:1.5,mb:3 }}>
                <Box sx={{ p:1,borderRadius:1.5,background:'rgba(153,126,103,0.15)',color:'#FFDBBB' }}><Lightbulb size={18} /></Box>
                <Typography variant="h6" sx={{ fontWeight:800 }}>High-Value Opportunities Detected</Typography>
              </Box>
              <Box sx={{ display:'flex',flexDirection:'column',gap:2.5 }}>
                {opportunities.map((o,i) => (
                  <motion.div key={o.title} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:i*0.12}}>
                    <Box sx={{ p:3,borderRadius:3,background:`${o.color}07`,border:`1px solid ${o.color}20`,position:'relative',overflow:'hidden' }}>
                      <Box sx={{ position:'absolute',left:0,top:0,bottom:0,width:4,background:o.color,borderRadius:'4px 0 0 4px' }} />
                      <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',mb:1.5 }}>
                        <Box>
                          <Typography sx={{ fontWeight:700,color:'#F5EDE4',mb:0.5 }}>{o.title}</Typography>
                          <Box sx={{ display:'flex',gap:1,flexWrap:'wrap' }}>
                            {o.skills.map(s => <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize:'0.68rem',height:20 }} />)}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign:'right',ml:2,flexShrink:0 }}>
                          <Box sx={{ px:1.5,py:0.5,borderRadius:9999,background:`${o.color}18`,mb:0.5 }}>
                            <Typography sx={{ fontSize:'0.8rem',fontWeight:800,color:o.color }}>{o.match}% AI Match</Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ display:'flex',gap:3,flexWrap:'wrap' }}>
                        <Box><Typography variant="caption" sx={{ color:'text.secondary' }}>Earning</Typography><Typography sx={{ fontWeight:700,color:o.color,fontSize:'0.85rem' }}>{o.earning}</Typography></Box>
                        <Box><Typography variant="caption" sx={{ color:'text.secondary' }}>Avg Timeline</Typography><Typography sx={{ fontWeight:700,color:'#F5EDE4',fontSize:'0.85rem' }}>{o.timeline}</Typography></Box>
                        <Box><Typography variant="caption" sx={{ color:'text.secondary' }}>Demand</Typography><Typography sx={{ fontWeight:700,color:'#F5EDE4',fontSize:'0.85rem' }}>{o.demand}</Typography></Box>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={4}>
          {/* AI Career Recommendations */}
          <motion.div variants={card} initial="hidden" animate="show" transition={{delay:0.15}}>
            <Paper sx={{ p:3,mb:3 }}>
              <Box sx={{ display:'flex',alignItems:'center',gap:1,mb:2.5 }}>
                <Box sx={{ p:1,borderRadius:1.5,background:'rgba(153,126,103,0.15)',color:'#FFDBBB' }}><Brain size={16} /></Box>
                <Typography variant="h6" sx={{ fontWeight:800 }}>AI Career Roadmap</Typography>
              </Box>
              <Box sx={{ display:'flex',flexDirection:'column',gap:1.5 }}>
                {learningPaths.map((l, i) => (
                  <Box key={l.title} sx={{ p:2.5,borderRadius:2,background:'rgba(255,219,187,0.03)',border:'1px solid rgba(255,219,187,0.08)','&:hover':{border:'1px solid rgba(255,219,187,0.18)'},transition:'all 0.25s',cursor:'pointer' }}>
                    <Typography sx={{ fontWeight:700,color:'#F5EDE4',fontSize:'0.88rem',mb:0.75 }}>{l.title}</Typography>
                    <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color:'text.secondary' }}>{l.provider} • {l.duration}</Typography>
                        <Box sx={{ display:'flex',alignItems:'center',gap:0.5,mt:0.25 }}><Star size={11} color="#facc15" fill="#facc15" /><Typography variant="caption" sx={{ color:'#facc15',fontWeight:700 }}>{l.rating}</Typography></Box>
                      </Box>
                      <Chip label={l.income} size="small" sx={{ bgcolor:'rgba(74,222,128,0.12)',color:'#4ade80',fontWeight:800,fontSize:'0.72rem',height:24 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={card} initial="hidden" animate="show" transition={{delay:0.25}}>
            <Paper sx={{ p:3 }}>
              <Typography variant="h6" sx={{ fontWeight:800,mb:2 }}>Market Summary</Typography>
              {[
                {label:'Total Jobs Analysed',value:'12,400+',color:'#FFDBBB'},
                {label:'Avg Platform Hourly Rate',value:'$67/hr',color:'#4ade80'},
                {label:'Fastest Growing Skill',value:'AI/ML (+45%)',color:'#a5b4fc'},
                {label:'Most In-Demand Location',value:'Remote (78%)',color:'#997E67'},
              ].map(s => (
                <Box key={s.label} sx={{ display:'flex',justifyContent:'space-between',alignItems:'center',py:1.5,borderBottom:'1px solid rgba(255,219,187,0.06)','&:last-child':{borderBottom:'none'} }}>
                  <Typography variant="body2" sx={{ color:'text.secondary',fontSize:'0.83rem' }}>{s.label}</Typography>
                  <Typography sx={{ fontWeight:800,color:s.color,fontSize:'0.88rem' }}>{s.value}</Typography>
                </Box>
              ))}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
