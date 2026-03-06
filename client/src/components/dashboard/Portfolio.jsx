/**
 * ===========================================
 * Portfolio Component
 * ===========================================
 * 
 * Displays portfolio analytics powered by the
 * ownership-based ROI model from GET /api/investments/roi.
 */

import { useState, useEffect } from 'react';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  Film,
  BarChart3,
  Percent,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import Card from '../ui/Card';
import { Skeleton } from '../ui';
import api from '../../utils/api';

const CHART_COLORS = [
  '#f04438', '#3b82f6', '#22c55e', '#f59e0b',
  '#a855f7', '#06b6d4', '#ec4899', '#84cc16',
];

function Portfolio() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/investments/roi');
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
        setError('Unable to load portfolio data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  /* ---------- Loading state ---------- */
  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-56" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card"><Skeleton className="h-64 w-full" /></div>
          <div className="card"><Skeleton className="h-64 w-full" /></div>
        </div>
      </div>
    );
  }

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary-500 hover:underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  /* ---------- Empty state ---------- */
  if (!stats || stats.investmentCount === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <PieChartIcon className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold text-foreground">No Investments Yet</h2>
        <p className="text-muted-foreground">
          Browse films and make your first investment to see portfolio analytics here.
        </p>
        <a href="/films" className="inline-block mt-2 text-primary-500 hover:underline text-sm">
          Browse Films →
        </a>
      </div>
    );
  }

  /* --- Derived data for charts --- */
  const portfolioValue = stats.totalInvested + stats.totalReturns - stats.totalInvested; // net = returns
  const netProfit = stats.totalReturns - stats.totalInvested;

  // Pie: investment distribution by film
  const filmMap = {};
  stats.investments.forEach((inv) => {
    const title = inv.filmTitle || 'Unknown';
    filmMap[title] = (filmMap[title] || 0) + inv.invested;
  });
  const total = Object.values(filmMap).reduce((s, v) => s + v, 0);
  const pieData = Object.entries(filmMap)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Bar: per-film invested vs return
  const barData = stats.investments.map((inv) => ({
    name: inv.filmTitle?.length > 14 ? inv.filmTitle.slice(0, 12) + '…' : inv.filmTitle,
    invested: inv.invested,
    return: inv.returnAmount,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Portfolio Analytics</h1>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Invested"
          value={`$${stats.totalInvested.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="primary"
        />
        <SummaryCard
          title="Total Returns"
          value={`$${stats.totalReturns.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          title="Overall ROI"
          value={`${stats.totalROI >= 0 ? '+' : ''}${stats.totalROI}%`}
          icon={<Percent className="w-5 h-5" />}
          color={stats.totalROI >= 0 ? 'green' : 'red'}
        />
        <SummaryCard
          title="Avg Ownership"
          value={`${stats.averageOwnership}%`}
          icon={<PieChartIcon className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pie Chart — Investment Distribution */}
        <Card>
          <Card.Header>
            <Card.Title>Investment Distribution</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="h-64 flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2 overflow-auto max-h-64 pr-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="truncate text-foreground">{item.name}</span>
                    <span className="ml-auto text-muted-foreground whitespace-nowrap">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Bar Chart — Invested vs Return per film */}
        <Card>
          <Card.Header>
            <Card.Title>Invested vs Return</Card.Title>
          </Card.Header>
          <Card.Body>
            {barData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-raw, #333)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-fg-raw, #888)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-fg-raw, #888)' }} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="invested" name="Invested" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="return" name="Return" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>No data to display</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Per-film detail table */}
      <Card>
        <Card.Header>
          <Card.Title>Investment Details</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-3 pr-4">Film</th>
                  <th className="pb-3 pr-4">Invested</th>
                  <th className="pb-3 pr-4">Ownership</th>
                  <th className="pb-3 pr-4">Film Revenue</th>
                  <th className="pb-3 pr-4">Return</th>
                  <th className="pb-3 pr-4">ROI</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.investments.map((inv) => (
                  <tr
                    key={inv.investmentId}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">{inv.filmTitle}</td>
                    <td className="py-3 pr-4 text-foreground">${inv.invested.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-foreground">{inv.ownershipPercentage}%</td>
                    <td className="py-3 pr-4 text-foreground">
                      {inv.filmRevenue > 0 ? `$${inv.filmRevenue.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 pr-4 text-foreground">${inv.returnAmount.toLocaleString()}</td>
                    <td className={`py-3 pr-4 font-semibold ${inv.currentROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {inv.currentROI >= 0 ? '+' : ''}{inv.currentROI}%
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inv.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-500'
                            : inv.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

/* ---------- Tooltip components ---------- */
function PieTooltip({ active, payload }) {
  if (active && payload?.[0]) {
    const d = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{d.name}</p>
        <p className="text-xs text-muted-foreground">
          ${d.value.toLocaleString()} ({d.payload.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

function BarTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-xs text-muted-foreground">
            {p.name}: ${p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/* ---------- Summary Card ---------- */
function SummaryCard({ title, value, icon, color }) {
  const colorClasses = {
    primary: 'bg-primary-500/20 text-primary-500',
    blue: 'bg-blue-500/20 text-blue-500',
    green: 'bg-green-500/20 text-green-500',
    yellow: 'bg-yellow-500/20 text-yellow-500',
    red: 'bg-red-500/20 text-red-500',
  };

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default Portfolio;
