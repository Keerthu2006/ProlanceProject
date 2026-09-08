import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

/* ── Brand Tokens ────────────────────────────────────────────── */
const C = {
  bg:     '#0D0A07',
  bg2:    '#130E09',
  panel:  '#111009',
  border: 'rgba(255,219,187,0.10)',
  cream:  '#FFDBBB',
  warm:   '#997E67',
  brown:  '#664930',
  muted:  'rgba(255,219,187,0.45)',
};

const inputStyle = (focused) => ({
  width: '100%', boxSizing: 'border-box',
  padding: '13px 16px 13px 44px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${focused ? C.warm : C.border}`,
  borderRadius: 10, color: C.cream, fontSize: 14,
  outline: 'none', transition: 'border-color 0.2s',
});

/* ── Google SVG ─────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.4 3 29.5 1 24 1 14.8 1 7 6.7 3.7 14.6l7 5.4C12.4 13.8 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.4 5.5-5 7.2l7.7 6c4.5-4.2 7.1-10.3 7.1-17.2z"/>
    <path fill="#FBBC05" d="M10.7 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6l-7-5.4A23 23 0 0 0 1 24c0 3.7.9 7.2 2.4 10.3l7.3-5.7z"/>
    <path fill="#34A853" d="M24 47c5.5 0 10.1-1.8 13.5-4.9l-7.7-6c-1.9 1.3-4.3 2-5.8 2-6.3 0-11.6-4.2-13.5-10L3.4 33.7C6.8 41.4 14.8 47 24 47z"/>
  </svg>
);

/* ── Smart Input component ──────────────────────────────────── */
function SmartInput({ icon, type = 'text', name, placeholder, value, onChange, onToggle, showToggle }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', marginBottom: 14 }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.warm, fontSize: 16, pointerEvents: 'none' }}>
        {icon}
      </span>
      <input
        type={type} name={name} placeholder={placeholder} value={value} onChange={onChange}
        required style={inputStyle(focused)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
      {showToggle && (
        <button type="button" onClick={onToggle} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: C.warm, fontSize: 14,
        }}>
          {type === 'password' ? '👁️' : '🙈'}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function AuthPages({ initialRegister }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(!initialRegister);
  const [loading, setLoading]  = useState(false);
  const [showPw, setShowPw]    = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: '',
    role: 'ROLE_FREELANCER',
  });

  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.margin = '0';
    document.body.style.fontFamily = "'Inter','Segoe UI',sans-serif";
    return () => { document.body.style.background = ''; };
  }, []);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const setCookie = (name, value, days) => {
    const exp = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/`;
  };

  const redirectByRole = (role) => {
    if (role === 'ROLE_CLIENT') navigate('/dashboard/client');
    else if (role === 'ROLE_OWNER' || role === 'ROLE_ADMIN') navigate('/dashboard/admin');
    else navigate('/dashboard/freelancer');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin
        ? 'http://localhost:8080/api/auth/login'
        : 'http://localhost:8080/api/auth/register';

      let payload = {};
      if (isLogin) {
        payload = { email: formData.email, password: formData.password, role: formData.role };
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords don't match"); setLoading(false); return;
        }
        payload = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          username: formData.email.split('@')[0] + Math.floor(Math.random() * 1000)
        };
      }

      const res = await axios.post(endpoint, payload);
      if (res.data?.accessToken) {
        const userRole = res.data?.user?.role || formData.role;
        const actualFullName = res.data?.user?.fullName || formData.fullName || formData.email?.split('@')[0];
        const userData = { email: formData.email, role: userRole, fullName: actualFullName };
        login(res.data.accessToken, userData);
        if (!isLogin) {
          toast.success('Account created! 🎉');
          if (userRole === 'ROLE_FREELANCER') navigate('/onboarding');
          else navigate('/dashboard/client');
        } else {
          toast.success('Welcome back! 🚀');
          redirectByRole(userRole);
        }
      } else {
        toast.error('Invalid response from server.');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && data.message === "Validation failed") {
        const errors = Object.values(data).filter(v => v !== "Validation failed").join(" | ");
        toast.error(`Error: ${errors}`);
      } else {
        toast.error(data?.message || 'An error occurred. Please check your credentials.');
      }
    } finally { setLoading(false); }
  };

  const handleGoogleAuth = () => {
    setCookie('selected_role', formData.role, 1);
    window.location.href = `http://localhost:8080/api/oauth2/authorization/google?role=${encodeURIComponent(formData.role)}`;
  };

  const handleOwnerBypass = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/auth/login', {
        email: 'admin@prolance.ai',
        password: 'admin123',
        role: 'ROLE_OWNER'
      });
      if (res.data?.accessToken) {
        login(res.data.accessToken, { email: 'admin@prolance.ai', role: 'ROLE_OWNER', fullName: 'System Admin' });
        navigate('/dashboard/admin');
        toast.success('System Administrator Access Granted');
      }
    } catch (err) {
      toast.error('Admin login failed. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const pw = formData.password;
  const strength = !pw ? 0 : pw.length < 6 ? 33 : pw.length < 10 ? 66 : 100;
  const strengthColor = strength < 50 ? '#ef4444' : strength < 80 ? '#eab308' : '#22c55e';
  const strengthLabel = strength < 50 ? 'Weak' : strength < 80 ? 'Medium' : 'Strong';

  const features = [
    { icon: '🧠', title: 'AI-Powered Recommendations', desc: 'Smart matching algorithms ensure perfect project fits.' },
    { icon: '🛡️', title: 'Risk Prevention Engine',     desc: 'Proactive dispute resolution and secure escrow.' },
    { icon: '📈', title: 'Market Intelligence',         desc: 'Real-time rate insights and demand forecasting.' },
  ];

  /* ── RENDER ──────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: C.bg, color: C.cream, fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── LEFT PANEL ───────────────────────────────────────── */}
      <div style={{
        flex: '0 0 58%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px',
        background: `linear-gradient(135deg, #0D0A07 0%, #150D07 50%, #0D0A07 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated background circles */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12, pointerEvents: 'none' }} viewBox="0 0 800 700">
          <circle cx="400" cy="350" r="200" stroke="#997E67" strokeWidth="1" fill="none" />
          <circle cx="400" cy="350" r="120" stroke="#664930" strokeWidth="1" fill="none" />
          <circle cx="400" cy="350" r="40" fill="#997E67" opacity="0.3" />
          {[[200,150],[600,150],[150,550],[650,550],[400,80],[400,620]].map(([x,y],i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="8" fill="#997E67" opacity="0.6" />
              <line x1="400" y1="350" x2={x} y2={y} stroke="#664930" strokeWidth="1.5" strokeDasharray="6,6" opacity="0.5" />
            </g>
          ))}
        </svg>

        {/* ProLance Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, position: 'relative', zIndex: 2 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${C.warm}, ${C.brown})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, color: '#fff', boxShadow: `0 4px 20px rgba(153,126,103,0.4)` }}>P</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22, color: C.cream, letterSpacing: -0.5 }}>ProLance</div>
            <div style={{ fontSize: 12, color: C.warm, marginTop: 2 }}>AI-Powered Freelance Intelligence</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 440 }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.15, margin: '0 0 16px', color: '#fff' }}>
            The Smartest Way to<br />
            <span style={{ background: `linear-gradient(135deg, ${C.cream}, ${C.warm})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Freelance with AI
            </span>
          </h1>
          <p style={{ margin: '0 0 40px', fontSize: 16, color: C.muted, lineHeight: 1.7 }}>
            ProLance continuously monitors your ecosystem using AI agents to prevent neglect, predict risks, and discover opportunities.
          </p>

          {/* Feature bullets */}
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: 'rgba(153,126,103,0.1)', border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.cream }}>{f.title}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{f.desc}</div>
              </div>
            </motion.div>
          ))}

          {/* Floating badges */}
          <motion.div
            animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: -40, right: -60,
              background: 'rgba(13,10,7,0.9)', border: `1px solid ${C.border}`,
              borderRadius: 50, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: C.cream,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
            <span>👥</span> 1,200+ Freelancers
          </motion.div>
          <motion.div
            animate={{ y: [0, 8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', bottom: -20, right: -80,
              background: 'rgba(13,10,7,0.9)', border: `1px solid ${C.border}`,
              borderRadius: 50, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600, color: C.cream,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
            <span style={{ color: '#22c55e' }}>✓</span> 95% Success Rate
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Auth Card) ───────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 32px', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{
            width: '100%', maxWidth: 440,
            background: 'rgba(255,219,187,0.04)', backdropFilter: 'blur(20px)',
            border: `1px solid ${C.border}`, borderRadius: 20, padding: 36,
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}>

          {/* Heading */}
          <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: C.muted, textAlign: 'center' }}>
            Select your role to continue
          </p>

          {/* Role Toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
            {[
              { r: 'ROLE_CLIENT', label: 'Client', emoji: '🏢', sub: 'Post projects & hire' },
              { r: 'ROLE_FREELANCER', label: 'Freelancer', emoji: '💼', sub: 'Find projects & earn' },
            ].map(({ r, label, emoji, sub }) => (
              <button key={r} type="button" onClick={() => setFormData({ ...formData, role: r })} style={{
                flex: 1, padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
                borderRadius: 10, background: formData.role === r ? 'rgba(153,126,103,0.12)' : 'transparent',
                border: formData.role === r ? `2px solid ${C.warm}` : `1px solid ${C.border}`,
                color: formData.role === r ? C.cream : C.muted,
                transform: formData.role === r ? 'scale(1.02)' : 'scale(1)',
                boxShadow: formData.role === r ? `0 0 20px rgba(153,126,103,0.2)` : 'none',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{sub}</div>
              </button>
            ))}
          </div>

          {/* Login / Register Tab */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 3, marginBottom: 22 }}>
            {['Sign In', 'Create Account'].map((t, i) => (
              <button key={t} type="button" onClick={() => setIsLogin(i === 0)} style={{
                flex: 1, padding: '9px 6px', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontWeight: 600, fontSize: 13,
                background: isLogin === (i === 0) ? `linear-gradient(135deg, ${C.warm}, ${C.brown})` : 'transparent',
                color: isLogin === (i === 0) ? '#fff' : C.muted, transition: 'all 0.2s',
              }}>{t}</button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form key={isLogin ? 'login' : 'reg'} onSubmit={handleSubmit}
              initial={{ opacity: 0, x: isLogin ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? -20 : 20 }}
              transition={{ duration: 0.25 }}>

              {!isLogin && (
                <SmartInput icon="👤" type="text" name="fullName" placeholder="Full Name"
                  value={formData.fullName} onChange={handleChange} />
              )}

              <SmartInput icon="✉️" type="email" name="email" placeholder="Email Address"
                value={formData.email} onChange={handleChange} />

              <SmartInput icon="🔒" type={showPw ? 'text' : 'password'} name="password" placeholder="Password"
                value={formData.password} onChange={handleChange}
                showToggle onToggle={() => setShowPw(!showPw)} />

              {/* Password strength (register only) */}
              {!isLogin && pw && (
                <div style={{ marginBottom: 14, marginTop: -8 }}>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${strength}%`, height: '100%', background: strengthColor, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor, textAlign: 'right', marginTop: 4 }}>{strengthLabel}</div>
                </div>
              )}

              {!isLogin && (
                <SmartInput icon="🔒" type={showPw ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password"
                  value={formData.confirmPassword} onChange={handleChange} />
              )}

              {isLogin && (
                <div style={{ textAlign: 'right', marginBottom: 16, marginTop: -8 }}>
                  <a href="#" style={{ fontSize: 12, color: C.warm, textDecoration: 'none' }}>Forgot password?</a>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', border: 'none', borderRadius: 10,
                background: `linear-gradient(135deg, ${C.warm}, ${C.brown})`,
                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                opacity: loading ? 0.7 : 1, letterSpacing: 0.3, transition: 'opacity 0.2s',
              }}>
                {loading ? '⏳ Please wait...' : isLogin
                  ? `Sign In as ${formData.role === 'ROLE_CLIENT' ? 'Client' : 'Freelancer'} →`
                  : `Create ${formData.role === 'ROLE_CLIENT' ? 'Client' : 'Freelancer'} Account →`}
              </button>

              {/* Toggle mode */}
              <p style={{ textAlign: 'center', margin: '14px 0 0', fontSize: 13, color: C.muted }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" onClick={() => setIsLogin(!isLogin)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: C.warm, fontWeight: 700, fontSize: 13,
                }}>
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </motion.form>
          </AnimatePresence>

          {/* Google */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: 'rgba(255,219,187,0.3)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          <button type="button" onClick={handleGoogleAuth} style={{
            width: '100%', padding: '12px', background: '#fff', border: '1px solid #ddd',
            borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            color: '#333', transition: 'box-shadow 0.2s',
          }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
             onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <GoogleIcon />
            Continue with Google as {formData.role === 'ROLE_CLIENT' ? 'Client' : 'Freelancer'}
          </button>

          {/* Owner bypass */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" onClick={handleOwnerBypass} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,219,187,0.15)', fontSize: 11, transition: 'color 0.2s',
            }} onMouseEnter={e => e.target.style.color = 'rgba(255,219,187,0.5)'}
               onMouseLeave={e => e.target.style.color = 'rgba(255,219,187,0.15)'}>
              System Administrator Access
            </button>
          </div>
        </motion.div>

        {/* Back to home */}
        <button type="button" onClick={() => navigate('/')} style={{
          marginTop: 20, background: 'none', border: 'none', cursor: 'pointer',
          color: C.muted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s',
        }} onMouseEnter={e => e.currentTarget.style.color = C.cream}
           onMouseLeave={e => e.currentTarget.style.color = C.muted}>
          ← Back to Home
        </button>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,219,187,0.25) !important; }
        input { font-family: 'Inter','Segoe UI',sans-serif; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0D0A07; }
        ::-webkit-scrollbar-thumb { background: #664930; border-radius: 3px; }
      `}</style>
    </div>
  );
}
