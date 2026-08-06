import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Attach JWT ───────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-logout on 401 ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pl_token');
      localStorage.removeItem('pl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
export const apiRegister = (data)           => api.post('/auth/register', data);
export const apiLogin    = (data)           => api.post('/auth/login',    data);

// ═══════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════
export const getOpenProjects       = ()              => api.get('/projects/open');
export const createProject         = (data)          => api.post('/projects', data);
export const getMyProjects         = ()              => api.get('/projects/mine');
export const getAssignedProjects   = ()              => api.get('/projects/assigned');
export const getProject            = (id)            => api.get(`/projects/${id}`);
export const hireFreelancer        = (pid, fid)      => api.post(`/projects/${pid}/hire/${fid}`);
export const completeProject       = (id)            => api.post(`/projects/${id}/complete`);
export const cancelProject         = (id)            => api.post(`/projects/${id}/cancel`);

// ═══════════════════════════════════════════════════════════════
// APPLICATIONS
// ═══════════════════════════════════════════════════════════════
export const applyToProject          = (pid, data) => api.post(`/projects/${pid}/apply`, data);
export const getProjectApplications  = (pid)       => api.get(`/projects/${pid}/applications`);
export const getMyApplications       = ()           => api.get('/applications/mine');

// ═══════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════
export const getMessages  = (pid)       => api.get(`/projects/${pid}/messages`);
export const sendMessage  = (pid, data) => api.post(`/projects/${pid}/messages`, data);

// ═══════════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════════
export const submitReview        = (pid, data) => api.post(`/projects/${pid}/reviews`, data);
export const getFreelancerReviews= (fid)       => api.get(`/freelancers/${fid}/reviews`);

// ═══════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════
export const initiatePayment = (data) => api.post('/payments/initiate', data);
export const completePayment = (id)   => api.post(`/payments/${id}/complete`);
export const getPaymentsForProject = (pid) => api.get(`/payments/project/${pid}`);

// ═══════════════════════════════════════════════════════════════
// FREELANCER PROFILES
// ═══════════════════════════════════════════════════════════════
export const getFreelancers  = ()       => api.get('/freelancers');
export const getMyProfile    = ()       => api.get('/freelancers/me');
export const getFreelancerProfile = (id) => api.get(`/freelancers/${id}`);
export const updateProfile   = (data)   => api.put('/freelancers/me', data);
export const logFeatureUsage = (key)    => api.post(`/freelancers/feature-usage/${key}`);

// ═══════════════════════════════════════════════════════════════
// TEAMS
// ═══════════════════════════════════════════════════════════════
export const createTeam     = (data)   => api.post('/teams', data);
export const getTeam        = (id)     => api.get(`/teams/${id}`);
export const getTeamMembers = (teamId) => api.get(`/teams/${teamId}/members`);

// ═══════════════════════════════════════════════════════════════
// OWNER DASHBOARD  (TriGrowth AI)
// ═══════════════════════════════════════════════════════════════
export const getDashboardSummary      = ()      => api.get('/owner/summary');
export const getPendingRecommendations= ()      => api.get('/owner/recommendations/pending');
export const getRecommendationHistory = ()      => api.get('/owner/recommendations/history');
export const approveRecommendation    = (id)    => api.post(`/owner/recommendations/${id}/approve`);
export const rejectRecommendation     = (id)    => api.post(`/owner/recommendations/${id}/reject`);
export const getAutomationLog         = ()      => api.get('/owner/automation-log');
export const getRecentEvents          = ()      => api.get('/owner/events');
export const getRevenueHistory        = ()      => api.get('/owner/revenue');
export const getAgentResults          = (name)  => api.get(`/owner/agents/${name}/results`);

export default api;