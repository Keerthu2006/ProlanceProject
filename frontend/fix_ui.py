import os
import re

file_path = 'src/pages/dashboard/ProjectDetail.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add UI for AI Matches
ui_code = """
        {aiMatches.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ color: '#997E67', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star color="#10b981" size={24} />
              AI Recommended Freelancers
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid #664930', borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Freelancer ID</TableCell>
                    <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Match Score</TableCell>
                    <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>AI Reasoning</TableCell>
                    <TableCell sx={{ color: '#997E67', fontWeight: 'bold' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aiMatches.map(match => (
                    <TableRow key={match.freelancer_id} sx={{ '& td': { borderColor: '#664930', color: '#FFDBBB' } }}>
                      <TableCell>#{match.freelancer_id}</TableCell>
                      <TableCell sx={{ color: '#10b981', fontWeight: 'bold' }}>{match.score}%</TableCell>
                      <TableCell>{match.reason}</TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small" sx={{ borderColor: '#664930', color: '#FFDBBB' }} onClick={() => toast.success(`Invited Freelancer #${match.freelancer_id}`)}>Invite</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
"""

content = content.replace(
    """<Typography variant="h5" sx={{ color: '#997E67', mb: 3 }}>Bids""",
    ui_code + """\n        <Typography variant="h5" sx={{ color: '#997E67', mb: 3 }}>Bids"""
)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
