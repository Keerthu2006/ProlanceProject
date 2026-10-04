import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, TextField, CircularProgress, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Send, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import api from '../api/api';

const PROLANCE_SYSTEM_PROMPTS = {
  '/dashboard/client':     'You are ProLance AI, an intelligent business consultant for a client on the ProLance freelance platform. Help with project creation, team management, budget optimization, and understanding AI recommendations. Be concise, helpful, and proactive.',
  '/dashboard/freelancer': 'You are ProLance AI, a career intelligence assistant for a freelancer on the ProLance platform. Help with finding projects, improving proposals, skill development, and market intelligence. Be motivating and data-driven.',
  '/dashboard/owner':      'You are ProLance AI, an executive business intelligence assistant. Help analyze platform metrics, AI engine outputs, automation logs, and system health. Provide strategic insights.',
  '/dashboard/ai':         'You are ProLance AI, your intelligent companion for the AI Intelligence dashboard. Explain AI recommendations, neglect scores, and machine learning predictions.',
  '/dashboard/market-intel': 'You are ProLance AI Market Intelligence assistant. Help interpret trending skills, market demand, opportunity gaps, and career recommendations.',
  'default':               'You are ProLance AI, an intelligent assistant for the ProLance AI-Powered Freelance Intelligence Platform. Help users with projects, freelancers, AI recommendations, market intelligence, and platform features.',
};

const QUICK_PROMPTS = [
  'What AI insights do I have?',
  'Show me trending skills',
  'How to improve my profile?',
  'Explain my risk score',
];

export default function AIChatAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: `Hello! I'm **ProLance AI**, your intelligent business assistant. 🚀\n\nI can help you with:\n• Project recommendations & risk analysis\n• Market intelligence & trending skills\n• AI-powered insights & automation\n• Profile optimization tips\n\nWhat would you like to explore today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const getSystemPrompt = () => {
    const path = location.pathname;
    return PROLANCE_SYSTEM_PROMPTS[path] || PROLANCE_SYSTEM_PROMPTS['default'];
  };

  const getRealTimeContext = async () => {
    let context = "";
    try {
        if (user?.role === 'ROLE_CLIENT') {
            // 1. All projects with full details
            try {
                const res = await api.get('/projects/mine');
                const projects = res.data;
                if (projects.length > 0) {
                    context += `Client's Active Projects (${projects.length} total):\n`;
                    for (let p of projects) {
                        context += `- "${p.title}" | ID: ${p.id} | Status: ${p.status} | Budget: $${p.budgetMin}-$${p.budgetMax} | Duration: ${p.durationDays || 'N/A'} days | Type: ${p.projectType || 'INDIVIDUAL'}\n`;
                        context += `  Skills Required: ${p.skillsRequired ? p.skillsRequired.join(', ') : 'None'}\n`;

                        // Bids per project with freelancer names
                        try {
                            const bidsRes = await api.get(`/projects/${p.id}/applications`);
                            if (bidsRes.data && bidsRes.data.length > 0) {
                                context += `  Bids Received (${bidsRes.data.length}):\n`;
                                bidsRes.data.forEach(b => {
                                    const fname = b.freelancer?.fullName || b.freelancerName || 'Unknown Freelancer';
                                    context += `    * ${fname} bid $${b.proposedAmount} — Status: ${b.status}\n`;
                                });
                            } else {
                                context += `  No bids received yet.\n`;
                            }
                        } catch(err){}

                        // Milestones per project
                        try {
                            const msRes = await api.get(`/projects/${p.id}/milestones`);
                            if (msRes.data && msRes.data.length > 0) {
                                context += `  Milestones (${msRes.data.length}):\n`;
                                msRes.data.forEach(m => {
                                    context += `    * "${m.title}" — Status: ${m.status} | Amount: $${m.amount} | Due: ${m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}\n`;
                                });
                            }
                        } catch(err){}
                    }
                } else {
                    context += "Client has no active projects yet.\n";
                }
            } catch(err){}

            // 2. Payments / Contracts
            try {
                const paymentsRes = await api.get('/payments/mine');
                if (paymentsRes.data && paymentsRes.data.length > 0) {
                    context += `\nPayments & Contracts (${paymentsRes.data.length}):\n`;
                    paymentsRes.data.forEach(pay => {
                        context += `- $${pay.amount} | Status: ${pay.status}\n`;
                    });
                }
            } catch(err){}

            // 3. Reviews
            try {
                const reviewsRes = await api.get('/reviews/mine');
                if (reviewsRes.data && reviewsRes.data.length > 0) {
                    context += `\nReviews Given/Received (${reviewsRes.data.length}):\n`;
                    reviewsRes.data.forEach(r => {
                        context += `- Rating: ${r.rating}/5 — "${r.comment}"\n`;
                    });
                }
            } catch(err){}

            // 4. Available freelancers for browsing
            try {
                const flRes = await api.get('/freelancers');
                if (flRes.data && flRes.data.length > 0) {
                    context += `\nAvailable Freelancers on Platform (${flRes.data.length} total):\n`;
                    flRes.data.slice(0, 8).forEach(f => {
                        const name = f.user?.fullName || f.fullName || 'Unknown';
                        const skills = f.skills ? f.skills.join(', ') : 'No skills listed';
                        context += `- ${name} | Rate: $${f.hourlyRate || 0}/hr | Skills: ${skills} | Headline: ${f.headline || 'N/A'}\n`;
                    });
                }
            } catch(err){}

        } else if (user?.role === 'ROLE_FREELANCER') {
            // Profile
            try {
                const profileRes = await api.get('/freelancers/me');
                const profile = profileRes.data;
                context += `My Freelancer Profile:\n- Name: ${user?.fullName || 'N/A'}\n- Headline: ${profile.headline || 'Not set'}\n- Rate: $${profile.hourlyRate || 0}/hr\n- Skills: ${profile.skills ? profile.skills.join(', ') : 'None'}\n- Availability: ${profile.availability || 'N/A'}\n`;
            } catch(err){}

            // My Bids
            try {
                const bidsRes = await api.get('/projects/my-applications');
                if (bidsRes.data && bidsRes.data.length > 0) {
                    context += `\nMy Bids (${bidsRes.data.length}):\n`;
                    bidsRes.data.forEach(b => {
                        context += `- Project: "${b.projectTitle || b.projectId}" | Bid: $${b.proposedAmount} | Status: ${b.status}\n`;
                    });
                } else {
                    context += "\nNo active bids placed yet.\n";
                }
            } catch(err){}

            // Assigned work + milestones
            try {
                const assignRes = await api.get('/projects/assigned');
                if (assignRes.data && assignRes.data.length > 0) {
                    context += `\nActive Work (${assignRes.data.length} projects):\n`;
                    for (let p of assignRes.data) {
                        context += `- "${p.title}" | Status: ${p.status} | Budget: $${p.budgetMin}-$${p.budgetMax}\n`;
                        try {
                            const msRes = await api.get(`/projects/${p.id}/milestones`);
                            if (msRes.data && msRes.data.length > 0) {
                                msRes.data.forEach(m => {
                                    context += `  * Milestone: "${m.title}" — ${m.status}\n`;
                                });
                            }
                        } catch(err){}
                    }
                } else {
                    context += "\nNo projects currently assigned.\n";
                }
            } catch(err){}

            // Reviews
            try {
                const reviewsRes = await api.get('/reviews/mine');
                if (reviewsRes.data && reviewsRes.data.length > 0) {
                    const avg = (reviewsRes.data.reduce((a,r) => a + r.rating, 0) / reviewsRes.data.length).toFixed(1);
                    context += `\nReviews Received: ${reviewsRes.data.length} reviews, Avg: ${avg}/5\n`;
                    reviewsRes.data.slice(0,3).forEach(r => {
                        context += `- "${r.comment}" — ${r.rating}/5\n`;
                    });
                }
            } catch(err){}

        } else if (user?.role === 'ROLE_OWNER' || user?.role === 'ROLE_ADMIN') {
            try {
                const summaryRes = await api.get('/owner/summary');
                const summary = summaryRes.data;
                context += `Platform Admin Summary:\n- Total Revenue: $${summary.totalRevenue}\n- Total Users: ${summary.totalUsers}\n- Total Projects: ${summary.totalProjects}\n`;
            } catch(err){}
            try {
                const recRes = await api.get('/owner/recommendations/pending');
                if (recRes.data && recRes.data.length > 0) {
                    context += `\nPending AI Recommendations: ${recRes.data.length}\n`;
                    recRes.data.slice(0, 5).forEach(r => {
                        context += `- [${r.status}] ${r.problem || r.recommendedAction || 'Recommendation'}\n`;
                    });
                }
            } catch(err){}
            try {
                const neglectRes = await api.get('/owner/neglect/customers');
                if (neglectRes.data) {
                    context += `\nCustomer Neglect: ${neglectRes.data.atRiskCount || 0} at-risk clients\n`;
                }
            } catch(err){}
        }
    } catch (e) {
        console.warn("Could not fetch real-time context for AI", e);
    }
    return context;
  };


  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text: text.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit',minute:'2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const realTimeContextRaw = await getRealTimeContext();
      
      const platformKnowledge = `
--- PLATFORM KNOWLEDGE BASE ---
- ProLance uses an AI Neglect Engine with 4 models: Customer Neglect, Product Neglect, Financial Neglect, and Opportunity Neglect.
- "Product Neglect" means a user hasn't used a key feature (like the AI Chat, Bidding, Escrow). If they ask how to use the platform, guide them!
- How to post a project: Click "Post Project" in the sidebar, fill out the details (Category, Budget, Skills), and view the AI preview before submitting.
- Escrow system: When a freelancer is hired, the budget is held securely in escrow. It auto-releases upon milestone approval.
- TeamLancers: Freelancers can group up into Teams to bid on larger enterprise projects.
- AI Action Center: Only Admins/Owners see this. It allows them to approve AI-generated automations like discount codes and email campaigns.
--- END PLATFORM KNOWLEDGE BASE ---

${realTimeContextRaw}
`;

      const res = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: text.trim(), 
            role: user?.role || 'user',
            user_name: user?.fullName || user?.username || 'User',
            dashboard_context: platformKnowledge
        }),
      });
      if (!res.ok) throw new Error('Service unavailable');
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now()+1, role: 'assistant', text: data.response, time: new Date().toLocaleTimeString([], { hour:'2-digit',minute:'2-digit' }) }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now()+1, role: 'assistant',
        text: "I'm having trouble connecting to the AI service right now. Please ensure the AI service is running at port 8001, or check your Gemini API key configuration.\n\nIn the meantime, I can still help you navigate ProLance features!",
        time: new Date().toLocaleTimeString([], { hour:'2-digit',minute:'2-digit' }),
      }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };

  // Format markdown-like text
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((p, j) => p.startsWith('**') ? <strong key={j} style={{ color: '#FFDBBB' }}>{p.slice(2,-2)}</strong> : p)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999 }}
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, #997E67, #664930)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 0 rgba(153,126,103,0.7)',
                animation: 'chat-pulse 2.5s infinite',
              }}
            >
              <Brain size={26} color="#FFDBBB" />
            </motion.button>
            <style>{`
              @keyframes chat-pulse {
                0% { box-shadow: 0 0 0 0 rgba(153,126,103,0.7), 0 8px 32px rgba(102,73,48,0.5); }
                70% { box-shadow: 0 0 0 14px rgba(153,126,103,0), 0 8px 32px rgba(102,73,48,0.5); }
                100% { box-shadow: 0 0 0 0 rgba(153,126,103,0), 0 8px 32px rgba(102,73,48,0.5); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, width: 380 }}
          >
            <Paper sx={{ bgcolor: '#0D0A07', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,219,187,0.18)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
              {/* Header */}
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, rgba(153,126,103,0.2), rgba(102,73,48,0.15))', borderBottom: '1px solid rgba(255,219,187,0.1)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, background: 'rgba(153,126,103,0.25)', color: '#FFDBBB' }}><Brain size={18} /></Box>
                </motion.div>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#F5EDE4', lineHeight: 1.2 }}>ProLance AI</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#4ade80', animation: 'pulse-dot 2s infinite' }} />
                    <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: 600 }}>Online & context-aware</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => setMinimized(!minimized)} sx={{ color: 'text.secondary' }}>
                  {minimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                </IconButton>
                <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
                  <X size={16} />
                </IconButton>
              </Box>

              <AnimatePresence>
                {!minimized && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                    {/* Messages */}
                    <Box sx={{ height: 380, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {messages.map(msg => (
                        <motion.div key={msg.id} initial={{ opacity:0,y:12,scale:0.95 }} animate={{ opacity:1,y:0,scale:1 }} transition={{ duration:0.3 }}>
                          <Box sx={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 1, alignItems: 'flex-start' }}>
                            {msg.role === 'assistant' && (
                              <Box sx={{ p: 0.75, borderRadius: '50%', background: 'rgba(153,126,103,0.2)', color: '#FFDBBB', flexShrink: 0, mt: 0.25 }}><Brain size={14} /></Box>
                            )}
                            <Box sx={{ maxWidth: '85%', p: 1.75, borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, #997E67, #664930)' : 'rgba(255,219,187,0.06)', border: msg.role === 'assistant' ? '1px solid rgba(255,219,187,0.1)' : 'none' }}>
                              <Typography sx={{ fontSize: '0.875rem', color: msg.role === 'user' ? '#fff' : '#F5EDE4', lineHeight: 1.65 }}>
                                {formatText(msg.text)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : '#7D6A5C', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>{msg.time}</Typography>
                            </Box>
                          </Box>
                        </motion.div>
                      ))}
                      {loading && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Box sx={{ p: 0.75, borderRadius: '50%', background: 'rgba(153,126,103,0.2)', color: '#FFDBBB' }}><Brain size={14} /></Box>
                          <Box sx={{ p: 1.75, borderRadius: '18px 18px 18px 4px', background: 'rgba(255,219,187,0.06)', border: '1px solid rgba(255,219,187,0.1)', display: 'flex', gap: 0.75 }}>
                            {[0,1,2].map(i => <motion.div key={i} animate={{ y:[0,-5,0] }} transition={{ duration:0.7,repeat:Infinity,delay:i*0.15 }} style={{ width:7,height:7,borderRadius:'50%',background:'#997E67' }} />)}
                          </Box>
                        </Box>
                      )}
                      <div ref={bottomRef} />
                    </Box>

                    {/* Quick Prompts */}
                    {messages.length <= 2 && (
                      <Box sx={{ px: 2, pb: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {QUICK_PROMPTS.map(p => (
                          <Chip key={p} label={p} size="small" onClick={() => sendMessage(p)} sx={{ cursor: 'pointer', fontSize: '0.72rem', height: 24, bgcolor: 'rgba(153,126,103,0.1)', color: '#FFDBBB', border: '1px solid rgba(255,219,187,0.15)', '&:hover': { bgcolor: 'rgba(153,126,103,0.2)' } }} />
                        ))}
                      </Box>
                    )}

                    {/* Input */}
                    <Box sx={{ p: 2, pt: 1, borderTop: '1px solid rgba(255,219,187,0.08)' }}>
                      <Box sx={{ display: 'flex', gap: 1, background: 'rgba(255,219,187,0.05)', border: '1px solid rgba(255,219,187,0.12)', borderRadius: 3, p: 0.75, '&:focus-within': { border: '1px solid rgba(255,219,187,0.3)', boxShadow: '0 0 0 3px rgba(153,126,103,0.1)' }, transition: 'all 0.25s' }}>
                        <textarea
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={handleKey}
                          placeholder="Ask ProLance AI anything..."
                          rows={1}
                          disabled={loading}
                          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F5EDE4', fontFamily: 'Inter,sans-serif', fontSize: '0.875rem', resize: 'none', padding: '6px 8px', lineHeight: 1.5 }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendMessage(input)}
                          disabled={!input.trim() || loading}
                          style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? 'linear-gradient(135deg, #997E67, #664930)' : 'rgba(255,219,187,0.1)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                        >
                          {loading ? <CircularProgress size={14} sx={{ color: '#FFDBBB' }} /> : <Send size={15} color={input.trim() ? '#fff' : '#7D6A5C'} />}
                        </motion.button>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#7D6A5C', display: 'block', textAlign: 'center', mt: 1, fontSize: '0.68rem' }}>
                        ProLance AI • Context-aware for this page
                      </Typography>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Paper>
            <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
