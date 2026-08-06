import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../../api/api';

export default function PostProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', budget: '',
    durationDays: '', requiredSkills: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createProject({ 
        ...form, 
        budgetMin: Number(form.budget), 
        budgetMax: Number(form.budget), 
        durationDays: Number(form.durationDays),
        skillsRequired: form.requiredSkills.split(',').map(s => s.trim()).filter(s => s)
      });
      navigate('/client/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Post a New Project</h1>
        <p>Describe your project and let freelancers apply.</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error mb-md">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input className="form-input" required
              placeholder="e.g. Build a Food Delivery Website"
              value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={4}
              placeholder="Describe the project scope, goals, and any special requirements…"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Budget (₹) *</label>
              <input className="form-input" type="number" min="1" required
                placeholder="e.g. 40000"
                value={form.budget} onChange={e => set('budget', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (days) *</label>
              <input className="form-input" type="number" min="1" required
                placeholder="e.g. 25"
                value={form.durationDays} onChange={e => set('durationDays', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Required Skills *</label>
            <input className="form-input" required
              placeholder="React, Spring Boot, MySQL  (comma-separated)"
              value={form.requiredSkills} onChange={e => set('requiredSkills', e.target.value)} />
            <span className="form-hint">These skills are used by the AI to match and notify freelancers.</span>
          </div>

          <div className="flex gap-sm" style={{ marginTop: '.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting…' : '🚀 Post Project'}
            </button>
            <button type="button" className="btn btn-ghost"
              onClick={() => navigate('/client/projects')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}