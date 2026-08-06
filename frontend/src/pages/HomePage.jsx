import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 50], ['rgba(13, 10, 7, 0)', 'rgba(13, 10, 7, 0.8)']);
  const navBackdrop = useTransform(scrollY, [0, 50], ['blur(0px)', 'blur(12px)']);
  const navBorder = useTransform(scrollY, [0, 50], ['border-bottom: 1px solid rgba(255, 219, 187, 0)', 'border-bottom: 1px solid rgba(255, 219, 187, 0.1)']);

  return (
    <div className="home-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap');

        :root {
          --bg-dark: #0D0A07;
          --primary-cream: #FFDBBB;
          --warm: #997E67;
          --accent: #664930;
          --glass-bg: rgba(255,219,187,0.04);
          --glass-border: rgba(255,219,187,0.10);
        }

        body, html {
          margin: 0;
          padding: 0;
          background-color: var(--bg-dark);
          color: var(--primary-cream);
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Poppins', sans-serif;
          margin: 0;
        }

        a {
          text-decoration: none;
          color: inherit;
        }

        * {
          box-sizing: border-box;
        }

        .home-container {
          width: 100%;
          min-height: 100vh;
        }

        .glass-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 24px;
        }

        /* 14. Sticky Navbar */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5%;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .nav-logo {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-cream);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--primary-cream), var(--warm));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--bg-dark);
          font-weight: 800;
          font-size: 1.2rem;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
        }

        .nav-link {
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          color: var(--warm);
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: var(--primary-cream);
        }

        .nav-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .btn-ghost {
          background: transparent;
          border: none;
          color: var(--primary-cream);
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 16px;
        }

        .btn-ghost:hover {
          color: #fff;
        }

        .btn-primary {
          background: var(--primary-cream);
          color: var(--bg-dark);
          border: none;
          padding: 10px 24px;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255,219,187,0.2);
        }

        /* 1. Hero Section */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 120px 5% 60px;
          position: relative;
          overflow: hidden;
        }

        .hero-glow {
          position: absolute;
          top: 20%;
          right: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
          opacity: 0.3;
          filter: blur(80px);
          z-index: 0;
        }

        .hero-content {
          flex: 1;
          z-index: 1;
          padding-right: 40px;
        }

        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 20px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--primary-cream);
          margin-bottom: 24px;
        }

        .hero-title {
          font-size: 4.5rem;
          line-height: 1.1;
          margin-bottom: 24px;
          background: linear-gradient(to right, #fff, var(--primary-cream), var(--warm));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          line-height: 1.6;
          color: var(--warm);
          margin-bottom: 40px;
          max-width: 600px;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
        }

        .btn-secondary {
          background: var(--glass-bg);
          color: var(--primary-cream);
          border: 1px solid var(--glass-border);
          padding: 12px 28px;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: rgba(255,219,187,0.1);
        }

        .btn-primary.lg {
          padding: 12px 32px;
          font-size: 1rem;
        }

        .hero-visual {
          flex: 1;
          z-index: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        /* 2. Trust Stats */
        .stats-section {
          padding: 60px 5%;
          border-top: 1px solid var(--glass-border);
          border-bottom: 1px solid var(--glass-border);
          background: linear-gradient(to right, transparent, var(--glass-bg), transparent);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          text-align: center;
        }

        .stat-item h3 {
          font-size: 3rem;
          color: var(--primary-cream);
          margin-bottom: 8px;
        }

        .stat-item p {
          color: var(--warm);
          font-size: 0.95rem;
          font-weight: 500;
          margin: 0;
        }

        /* Section Global */
        .section {
          padding: 120px 5%;
        }

        .section-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .section-title {
          font-size: 2.5rem;
          margin-bottom: 16px;
        }

        .section-subtitle {
          color: var(--warm);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        /* 3, 4, 5. Story, Vision, Mission */
        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          margin-bottom: 64px;
        }

        .about-card {
          padding: 40px;
        }
        
        .timeline-item {
          display: flex;
          gap: 20px;
          margin-bottom: 32px;
        }

        .timeline-marker {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--primary-cream);
          flex-shrink: 0;
        }

        .timeline-content h4 {
          font-size: 1.25rem;
          margin-bottom: 8px;
        }
        
        .timeline-content p {
          color: var(--warm);
          line-height: 1.6;
          margin: 0;
        }

        /* 6. Neglect Problem Cards */
        .neglect-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .neglect-card {
          padding: 32px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .neglect-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
        }

        .neglect-customer::before { background: #FF5A5F; }
        .neglect-product::before { background: #A05CFF; }
        .neglect-financial::before { background: #00D084; }
        .neglect-opportunity::before { background: #00B2FF; }

        .neglect-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 0;
          transition: margin 0.3s ease;
        }

        .neglect-card:hover .neglect-header {
          margin-bottom: 24px;
        }

        .neglect-title {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .neglect-details {
          height: 0;
          opacity: 0;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .neglect-card:hover .neglect-details {
          height: auto;
          opacity: 1;
        }

        .neglect-details p {
          margin: 0 0 12px 0;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .neglect-details strong {
          color: var(--primary-cream);
        }

        /* 7. AI Workflow */
        .workflow-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 60px 0;
        }

        .workflow-step {
          padding: 16px 24px;
          border-radius: 16px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .workflow-arrow {
          color: var(--warm);
          font-size: 1.5rem;
        }

        /* 8. AI Features */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .feature-card {
          padding: 32px 24px;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary-cream);
        }

        .feature-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          border-radius: 16px;
          background: rgba(255,219,187,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .feature-title {
          font-size: 1.25rem;
          margin-bottom: 12px;
        }

        .feature-desc {
          color: var(--warm);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* 9. Comparison Table */
        .comparison-table-wrapper {
          overflow-x: auto;
          border-radius: 24px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .comparison-table th, .comparison-table td {
          padding: 24px;
          border-bottom: 1px solid var(--glass-border);
        }
        
        .comparison-table th {
          font-family: 'Poppins', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .comparison-table tr:last-child td {
          border-bottom: none;
        }

        .th-teamlance {
          background: rgba(255,219,187,0.05);
          color: var(--primary-cream);
        }

        .td-teamlance {
          background: rgba(255,219,187,0.05);
          font-weight: 600;
          color: #00D084;
        }

        .td-trad {
          color: #FF5A5F;
        }

        /* 10. Tech Stack */
        .tech-track {
          display: flex;
          gap: 40px;
          justify-content: center;
          flex-wrap: wrap;
          padding: 40px 0;
        }

        .tech-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          border-radius: 30px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          font-weight: 600;
          color: var(--warm);
        }

        /* 11. Testimonials */
        .testimonials-carousel {
          display: flex;
          gap: 32px;
          overflow-x: auto;
          padding: 20px 0 40px;
          scrollbar-width: none;
        }
        
        .testimonials-carousel::-webkit-scrollbar {
          display: none;
        }

        .testimonial-card {
          min-width: 400px;
          padding: 40px;
        }

        .test-text {
          font-size: 1.1rem;
          line-height: 1.6;
          font-style: italic;
          margin-bottom: 24px;
        }

        .test-author {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .test-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--warm);
        }

        /* 12. CTA */
        .cta-section {
          text-align: center;
          padding: 120px 5%;
          background: radial-gradient(circle at center, rgba(102,73,48,0.2) 0%, transparent 70%);
        }

        .cta-title {
          font-size: 3.5rem;
          margin-bottom: 24px;
        }

        /* 13. Footer */
        .footer {
          border-top: 1px solid var(--glass-border);
          padding: 80px 5% 40px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 64px;
          margin-bottom: 64px;
        }

        .footer-brand h4 {
          font-size: 1.5rem;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .footer-brand p {
          color: var(--warm);
          line-height: 1.6;
          max-width: 300px;
        }

        .footer-col h5 {
          font-size: 1.1rem;
          margin-bottom: 24px;
          color: var(--primary-cream);
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-col li {
          margin-bottom: 12px;
        }

        .footer-col a {
          color: var(--warm);
          transition: color 0.2s;
        }

        .footer-col a:hover {
          color: var(--primary-cream);
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 32px;
          border-top: 1px solid var(--glass-border);
          color: var(--warm);
          font-size: 0.9rem;
        }
        
        .social-icons {
          display: flex;
          gap: 16px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero { flex-direction: column; text-align: center; padding-top: 160px; }
          .hero-content { padding-right: 0; margin-bottom: 60px; }
          .hero-title { font-size: 3.5rem; }
          .hero-subtitle { margin: 0 auto 40px; }
          .hero-actions { justify-content: center; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .about-grid, .neglect-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .features-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .hero-title { font-size: 2.5rem; }
          .section-title { font-size: 2rem; }
          .testimonial-card { min-width: 300px; }
        }
      `}</style>

      {/* 14. Sticky Navbar */}
      <motion.nav 
        className="navbar"
        style={{ 
          backgroundColor: navBg,
          backdropFilter: navBackdrop,
          WebkitBackdropFilter: navBackdrop,
          borderBottom: navBorder
        }}
      >
        <div className="nav-logo" onClick={() => scrollTo('hero')}>
          <div className="nav-logo-icon">T</div>
          TeamLance
        </div>
        <div className="nav-links">
          <span className="nav-link" onClick={() => scrollTo('features')}>Features</span>
          <span className="nav-link" onClick={() => scrollTo('solutions')}>Solutions</span>
          <span className="nav-link" onClick={() => scrollTo('engine')}>AI Engine</span>
          <span className="nav-link" onClick={() => scrollTo('about')}>About</span>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </motion.nav>

      {/* 1. Hero Section */}
      <section id="hero" className="hero">
        <div className="hero-glow"></div>
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="trust-badge">
            <span style={{color: '#FFDBBB'}}>⚡</span> Powered by Advanced AI
          </div>
          <h1 className="hero-title">
            The AI That Doesn't Just Connect Freelancers. It Helps Businesses Think.
          </h1>
          <p className="hero-subtitle">
            TeamLance predicts risks, automates workflows, analyses business health, and recommends intelligent actions — before problems occur.
          </p>
          <div className="hero-actions">
            <button className="btn-primary lg" onClick={() => navigate('/register')}>
              Get Started Free
            </button>
            <button className="btn-secondary" onClick={() => scrollTo('features')}>
              Explore AI Features
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          {/* Animated AI Brain Illustration (SVG) */}
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <motion.circle cx="200" cy="200" r="100" stroke="rgba(255,219,187,0.2)" strokeWidth="2" strokeDasharray="5 5" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
            <motion.circle cx="200" cy="200" r="150" stroke="rgba(153,126,103,0.2)" strokeWidth="1" animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
            
            {/* Center Brain Node */}
            <circle cx="200" cy="200" r="40" fill="var(--glass-bg)" stroke="var(--primary-cream)" strokeWidth="2" />
            <text x="200" y="205" fill="var(--primary-cream)" fontSize="14" fontWeight="bold" textAnchor="middle">AI CORE</text>

            {/* Nodes */}
            <g>
              <line x1="200" y1="200" x2="100" y2="100" stroke="var(--warm)" strokeWidth="2" />
              <circle cx="100" cy="100" r="30" fill="var(--bg-dark)" stroke="var(--warm)" strokeWidth="2" />
              <text x="100" y="105" fill="#fff" fontSize="10" textAnchor="middle">Client</text>
            </g>
            <g>
              <line x1="200" y1="200" x2="300" y2="100" stroke="var(--warm)" strokeWidth="2" />
              <circle cx="300" cy="100" r="30" fill="var(--bg-dark)" stroke="var(--warm)" strokeWidth="2" />
              <text x="300" y="105" fill="#fff" fontSize="10" textAnchor="middle">Freelancer</text>
            </g>
            <g>
              <line x1="200" y1="200" x2="100" y2="300" stroke="var(--accent)" strokeWidth="2" />
              <circle cx="100" cy="300" r="30" fill="var(--bg-dark)" stroke="var(--accent)" strokeWidth="2" />
              <text x="100" y="305" fill="#fff" fontSize="10" textAnchor="middle">Analytics</text>
            </g>
            <g>
              <line x1="200" y1="200" x2="300" y2="300" stroke="var(--accent)" strokeWidth="2" />
              <circle cx="300" cy="300" r="30" fill="var(--bg-dark)" stroke="var(--accent)" strokeWidth="2" />
              <text x="300" y="305" fill="#fff" fontSize="10" textAnchor="middle">Automation</text>
            </g>

            {/* Floating Particles */}
            <motion.circle cx="150" cy="150" r="4" fill="var(--primary-cream)" animate={{ cx: [150, 200, 150], cy: [150, 200, 150] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.circle cx="250" cy="250" r="4" fill="var(--primary-cream)" animate={{ cx: [250, 200, 250], cy: [250, 200, 250] }} transition={{ duration: 2.5, repeat: Infinity }} />
            <motion.circle cx="250" cy="150" r="4" fill="var(--primary-cream)" animate={{ cx: [250, 200, 250], cy: [150, 200, 150] }} transition={{ duration: 2.2, repeat: Infinity }} />
            <motion.circle cx="150" cy="250" r="4" fill="var(--primary-cream)" animate={{ cx: [150, 200, 150], cy: [250, 200, 250] }} transition={{ duration: 1.8, repeat: Infinity }} />
          </svg>
        </motion.div>
      </section>

      {/* 2. Trust Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          {[
            { value: "98%", label: "Predictive Accuracy" },
            { value: "5x", label: "Faster Workflows" },
            { value: "10k+", label: "Tasks Automated" },
            { value: "$2M+", label: "Revenue Protected" }
          ].map((stat, idx) => (
            <motion.div 
              key={idx} 
              className="stat-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3, 4, 5. About, Vision, Mission */}
      <section id="about" className="section">
        <div className="about-grid">
          <motion.div 
            className="glass-card about-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Why TeamLance Exists</h2>
            <div className="timeline-item">
              <div className="timeline-marker">1</div>
              <div className="timeline-content">
                <h4>The Broken Model</h4>
                <p>Traditional platforms just introduced people. They didn't care if the project succeeded, failed, or stalled.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">2</div>
              <div className="timeline-content">
                <h4>The Missing Intelligence</h4>
                <p>Businesses were drowning in data but starving for insights. Nobody was connecting the dots between hiring and revenue.</p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-marker">3</div>
              <div className="timeline-content">
                <h4>The AI Evolution</h4>
                <p>We built an engine that thinks. It monitors, predicts, and guides businesses to guaranteed successful outcomes.</p>
              </div>
            </div>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <motion.div 
              className="glass-card about-card" style={{ flex: 1 }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="section-title">Our Vision</h2>
              <p style={{ color: 'var(--warm)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                To create a world where every business decision is augmented by autonomous intelligence, eliminating project failure and operational friction entirely.
              </p>
            </motion.div>
            <motion.div 
              className="glass-card about-card" style={{ flex: 1 }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="section-title">Our Mission</h2>
              <p style={{ color: 'var(--warm)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                To transform the freelance economy from a passive marketplace into an active, intelligent partner that actively drives business growth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Four Neglect Problem Cards */}
      <section id="solutions" className="section" style={{ background: 'rgba(255,219,187,0.02)' }}>
        <div className="section-header">
          <h2 className="section-title">Solving The Four Pillars of Neglect</h2>
          <p className="section-subtitle">Our AI identifies and resolves the hidden failures that destroy business growth before they happen.</p>
        </div>
        
        <div className="neglect-grid">
          {/* Customer Neglect */}
          <motion.div className="glass-card neglect-card neglect-customer" whileHover={{ scale: 1.02 }}>
            <div className="neglect-header">
              <span style={{ fontSize: '2rem' }}>👥</span>
              <h3 className="neglect-title">Customer Neglect</h3>
            </div>
            <div className="neglect-details">
              <p><strong>Problem:</strong> Clients becoming inactive or churning without warning.</p>
              <p><strong>Impact:</strong> Massive loss of recurring revenue and brand loyalty.</p>
              <p><strong>AI Solution:</strong> Sentiment analysis and engagement tracking predicts churn 30 days out.</p>
              <p><strong>Outcome:</strong> Automated re-engagement workflows save 40% of at-risk clients.</p>
            </div>
          </motion.div>

          {/* Product Neglect */}
          <motion.div className="glass-card neglect-card neglect-product" whileHover={{ scale: 1.02 }}>
            <div className="neglect-header">
              <span style={{ fontSize: '2rem' }}>📦</span>
              <h3 className="neglect-title">Product Neglect</h3>
            </div>
            <div className="neglect-details">
              <p><strong>Problem:</strong> Users ignoring key features or dropping off during onboarding.</p>
              <p><strong>Impact:</strong> Wasted development cycles and poor ROI.</p>
              <p><strong>AI Solution:</strong> Usage pattern detection identifies friction points instantly.</p>
              <p><strong>Outcome:</strong> Real-time UI adaptations and targeted tutorials increase feature adoption.</p>
            </div>
          </motion.div>

          {/* Financial Neglect */}
          <motion.div className="glass-card neglect-card neglect-financial" whileHover={{ scale: 1.02 }}>
            <div className="neglect-header">
              <span style={{ fontSize: '2rem' }}>💰</span>
              <h3 className="neglect-title">Financial Neglect</h3>
            </div>
            <div className="neglect-details">
              <p><strong>Problem:</strong> Blind spots in cash flow and unpredictable revenue spikes/dips.</p>
              <p><strong>Impact:</strong> Inability to scale or survive market downturns.</p>
              <p><strong>AI Solution:</strong> Predictive modeling analyzes historical data and market trends.</p>
              <p><strong>Outcome:</strong> 98% accurate 6-month revenue forecasting and automated budget optimization.</p>
            </div>
          </motion.div>

          {/* Opportunity Neglect */}
          <motion.div className="glass-card neglect-card neglect-opportunity" whileHover={{ scale: 1.02 }}>
            <div className="neglect-header">
              <span style={{ fontSize: '2rem' }}>🎯</span>
              <h3 className="neglect-title">Opportunity Neglect</h3>
            </div>
            <div className="neglect-details">
              <p><strong>Problem:</strong> Freelancers and businesses missing emerging market trends.</p>
              <p><strong>Impact:</strong> Stagnation and losing ground to agile competitors.</p>
              <p><strong>AI Solution:</strong> Global market scraping matches skills to emerging demands.</p>
              <p><strong>Outcome:</strong> First-mover advantage in new niches, increasing rates by up to 30%.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. How TeamLance AI Works (Workflow) */}
      <section id="engine" className="section">
        <div className="section-header">
          <h2 className="section-title">The Intelligence Engine</h2>
          <p className="section-subtitle">A continuous loop of analysis, prediction, and automation.</p>
        </div>

        <div className="workflow-container">
          {[
            { icon: "🗄️", text: "Database" },
            { icon: "🔍", text: "Feature Extraction" },
            { icon: "🧠", text: "AI Analysis" },
            { icon: "⚙️", text: "Machine Learning" },
            { icon: "💡", text: "Recommendation Engine" },
            { icon: "⚡", text: "Automation Engine" },
            { icon: "📊", text: "Dashboard" }
          ].map((step, idx, arr) => (
            <React.Fragment key={idx}>
              <motion.div 
                className="workflow-step"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <span>{step.icon}</span> {step.text}
              </motion.div>
              {idx < arr.length - 1 && (
                <motion.div 
                  className="workflow-arrow"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 + 0.1 }}
                >
                  →
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* 8. AI Features */}
      <section id="features" className="section" style={{ background: 'rgba(255,219,187,0.02)' }}>
        <div className="section-header">
          <h2 className="section-title">Supercharged Capabilities</h2>
          <p className="section-subtitle">Everything you need to run an autonomous, hyper-efficient business.</p>
        </div>

        <div className="features-grid">
          {[
            { icon: "🔮", title: "Predictive Analytics", desc: "Forecast project success and revenue streams with unparalleled accuracy." },
            { icon: "🤖", title: "AI Chat Assistant", desc: "24/7 intelligent agent handling client queries and project management." },
            { icon: "⚡", title: "Smart Automations", desc: "Trigger workflows based on AI-detected events and thresholds." },
            { icon: "❤️", title: "Health Scoring", desc: "Real-time health scores for clients, projects, and freelancers." },
            { icon: "📈", title: "Market Intelligence", desc: "Stay ahead with AI-curated insights on industry trends." },
            { icon: "🛡️", title: "Risk Prevention", desc: "Identify and neutralize operational bottlenecks before they occur." },
            { icon: "🧩", title: "Perfect Matching", desc: "Neural network matching for flawless client-freelancer pairing." },
            { icon: "📝", title: "Smart Contracts", desc: "Auto-generating, adaptive agreements based on project scope." }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              className="glass-card feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 9. Comparison Table */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Why Choose TeamLance?</h2>
          <p className="section-subtitle">Stop using dumb platforms. Upgrade to an intelligent partner.</p>
        </div>

        <motion.div 
          className="comparison-table-wrapper"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Traditional Platform</th>
                <th className="th-teamlance">TeamLance ⚡</th>
              </tr>
            </thead>
            <tbody>
              {[
                "AI Recommendations",
                "Business Automation",
                "Revenue Prediction",
                "Customer Health Score",
                "Market Intelligence",
                "Opportunity Detection",
                "AI Chat Assistant",
                "Neglect Prevention"
              ].map((feature, idx) => (
                <tr key={idx}>
                  <td>{feature}</td>
                  <td className="td-trad">✗</td>
                  <td className="td-teamlance">✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </section>

      {/* 10. Tech Stack */}
      <section className="section" style={{ borderTop: '1px solid var(--glass-border)', padding: '60px 5%' }}>
        <p style={{ textAlign: 'center', color: 'var(--warm)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.85rem' }}>Powered by Industry-Leading Technology</p>
        <div className="tech-track">
          {['React', 'Node.js', 'Python AI Models', 'TensorFlow', 'PostgreSQL', 'Redis', 'AWS'].map((tech, idx) => (
            <div key={idx} className="tech-item">
              <span style={{ color: 'var(--primary-cream)' }}>✦</span> {tech}
            </div>
          ))}
        </div>
      </section>

      {/* 11. Testimonials */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Built for the Top 1%</h2>
        </div>
        
        <div className="testimonials-carousel">
          {[
            { quote: "TeamLance's predictive engine warned us about a key client churning 3 weeks before they sent the email. We saved a $50k contract.", author: "Sarah J.", role: "Agency Owner" },
            { quote: "It's not a marketplace. It's an AI co-founder that actively finds opportunities and automates my entire freelance workflow.", author: "Marcus T.", role: "Senior Developer" },
            { quote: "The financial forecasting model is scary accurate. It told me exactly when to hire and when to lean out based on market data.", author: "Elena R.", role: "Startup Founder" }
          ].map((test, idx) => (
            <motion.div 
              key={idx}
              className="glass-card testimonial-card"
              whileHover={{ y: -10 }}
            >
              <div style={{ color: 'var(--accent)', fontSize: '3rem', lineHeight: 1, marginBottom: '16px' }}>"</div>
              <p className="test-text">{test.quote}</p>
              <div className="test-author">
                <div className="test-avatar"></div>
                <div>
                  <div style={{ fontWeight: 600 }}>{test.author}</div>
                  <div style={{ color: 'var(--warm)', fontSize: '0.85rem' }}>{test.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 12. CTA Section */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="cta-title">Ready to build the future?</h2>
          <p className="section-subtitle" style={{ marginBottom: '40px' }}>Join the autonomous revolution and let AI scale your business.</p>
          <button className="btn-primary lg" style={{ fontSize: '1.2rem', padding: '16px 48px' }} onClick={() => navigate('/register')}>
            Start For Free
          </button>
        </motion.div>
      </section>

      {/* 13. Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h4>
              <div className="nav-logo-icon" style={{ width: 24, height: 24, fontSize: '0.9rem' }}>T</div>
              TeamLance
            </h4>
            <p>The AI That Doesn't Just Connect Freelancers. It Helps Businesses Think.</p>
          </div>
          
          <div className="footer-col">
            <h5>Product</h5>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); scrollTo('features'); }}>Features</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); scrollTo('solutions'); }}>Solutions</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); scrollTo('engine'); }}>AI Engine</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); scrollTo('about'); }}>About Us</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Login</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Register</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Legal</h5>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 TeamLance AI. All rights reserved.</div>
          <div className="social-icons">
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
