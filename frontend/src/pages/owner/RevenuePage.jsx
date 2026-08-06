import { useState, useEffect } from 'react';
import { getRevenueHistory } from '../../api/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import Spinner from '../../components/common/Spinner';
import { currency } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler);

export default function RevenuePage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueHistory()
      .then(r => setHistory([...r.data].reverse()))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Spinner /></div>;
  if (!history.length) return (
    <div className="page">
      <div className="card"><Spinner label="No revenue data yet." /></div>
    </div>
  );

  const labels = history.map(r => {
    const d = new Date(r.period);
    return d.toLocaleString('default', { month: 'short', year: '2-digit' });
  });

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Gross Revenue (₹)',
        data: history.map(r => r.gross),
        borderColor: '#6c63ff', backgroundColor: 'rgba(108,99,255,.1)',
        fill: true, tension: .4, pointRadius: 5, pointHoverRadius: 7,
      },
      {
        label: 'Commission (₹)',
        data: history.map(r => r.commission),
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.07)',
        fill: true, tension: .4, borderDash: [5, 5],
      },
    ],
  };

  const barData = {
    labels,
    datasets: [
      { label: 'Refunds (₹)',     data: history.map(r => r.refunds),        backgroundColor: 'rgba(239,68,68,.7)' },
      { label: 'Repeat Clients',  data: history.map(r => r.repeatClients),  backgroundColor: 'rgba(59,130,246,.7)', yAxisID: 'y1' },
    ],
  };

  const opts = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { ticks: { callback: v => `₹${(v/1000).toFixed(0)}k` } } },
  };
  const barOpts = {
    ...opts,
    scales: {
      y:  { ticks: { callback: v => `₹${(v/1000).toFixed(0)}k` } },
      y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Clients' } },
    },
  };

  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const momPct = prev ? (((last.gross - prev.gross) / prev.gross) * 100).toFixed(1) : null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Revenue Analytics</h1>
        <p>Monthly data tracked by the Financial Neglect Agent.</p>
      </div>

      {momPct !== null && (
        <div className={`alert ${parseFloat(momPct) < 0 ? 'alert-error' : 'alert-success'} mb-lg`}>
          Month-over-month change: <strong>{momPct}%</strong>
          {parseFloat(momPct) < -5 && ' — The Financial Agent may have already raised a recommendation.'}
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-4 mb-lg">
        {[
          { label: 'Latest Gross',        value: currency(last.gross)      },
          { label: 'Commission',          value: currency(last.commission) },
          { label: 'Refunds',             value: currency(last.refunds)    },
          { label: 'Repeat Clients',      value: last.repeatClients        },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-val">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 gap-lg">
        <div className="card">
          <div className="section-title">Revenue Trend</div>
          <Line data={lineData} options={opts} />
        </div>
        <div className="card">
          <div className="section-title">Refunds &amp; Repeat Clients</div>
          <Bar data={barData} options={barOpts} />
        </div>
      </div>
    </div>
  );
}