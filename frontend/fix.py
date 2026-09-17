import os
import re

file_path = 'src/pages/dashboard/ProjectDetail.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add state for aiMatches
content = content.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const [aiMatches, setAiMatches] = useState([]);'
)

# Add fetch for ai-matches
fetch_code = """
        try {
          const res = await axios.get(`http://localhost:8080/api/projects/${id}`);
          setProject(res.data);
          
          try {
             const aiRes = await axios.get(`http://localhost:8080/api/projects/${id}/ai-matches`);
             if (aiRes.data && aiRes.data.matches) {
                 setAiMatches(aiRes.data.matches);
             }
          } catch(e) {
             console.error('Failed to fetch AI matches', e);
          }
"""

content = content.replace(
    """        try {
          const res = await axios.get(`http://localhost:8080/api/projects/${id}`);
          setProject(res.data);""",
    fetch_code
)

# Add UI for AI Matches
ui_code = """
      {aiMatches.length > 0 && (
        <Paper sx={{ p: 4, mb: 4, bgcolor: 'rgba(20,20,30,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star color="#10b981" size={20} />
            AI Recommended Freelancers
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Freelancer ID</TableCell>
                  <TableCell sx={{ color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Match Score</TableCell>
                  <TableCell sx={{ color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>AI Reasoning</TableCell>
                  <TableCell sx={{ color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {aiMatches.map(match => (
                  <TableRow key={match.freelancer_id}>
                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>#{match.freelancer_id}</TableCell>
                    <TableCell sx={{ color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>{match.score}%</TableCell>
                    <TableCell sx={{ color: '#d1d5db', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{match.reason}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <Button variant="outlined" size="small" sx={{ borderColor: '#6366f1', color: '#6366f1' }} onClick={() => toast.success(`Invited Freelancer #${match.freelancer_id}`)}>Invite</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
"""

content = content.replace(
    "      <Paper sx={{ p: 4, mb: 4, bgcolor: 'rgba(20,20,30,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>\n        <Typography variant=\"h6\" sx={{ color: '#fff', mb: 3 }}>Bids & Applications</Typography>",
    ui_code + "\n      <Paper sx={{ p: 4, mb: 4, bgcolor: 'rgba(20,20,30,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>\n        <Typography variant=\"h6\" sx={{ color: '#fff', mb: 3 }}>Bids & Applications</Typography>"
)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
