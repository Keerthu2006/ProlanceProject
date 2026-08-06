import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, TextField, CircularProgress, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, Send, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

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

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text: text.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit',minute:'2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `${getSystemPrompt()}\n\nUser: ${text.trim()}`, role: user?.role || 'user' }),
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
                        Powered by Gemini AI • Context-aware for this page
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
