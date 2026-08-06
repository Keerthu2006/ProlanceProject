import { severityColor } from '../../utils/helpers';

export default function ScoreBar({ score = 0, severity }) {
  const color = severity ? severityColor(severity)
    : score >= 80 ? '#ef4444' : score >= 55 ? '#f97316' : score >= 30 ? '#f59e0b' : '#10b981';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-row">
        <span>Risk Score</span>
        <span style={{ fontWeight: 700, color }}>{Math.round(score)}/100</span>
      </div>
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{ width: `${Math.min(score, 100)}%`, background: color }} />
      </div>
    </div>
  );
}