/**
 * ===========================================
 * Dashboard Home Component
 * ===========================================
 * 
 * Main dashboard overview with key metrics and recent activity.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Film, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '../ui/Card';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { Skeleton } from '../ui';
function DashboardHome() {
  const { user } = useAuthStore();

  const [stats, setStats] = useState({
    totalInvested: 0,
    totalReturns: 0,
    totalROI: 0,
    activeInvestments: 0,
    pendingReturns: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [investmentsRes, roiRes] = await Promise.all([
          api.get('/investments'),
          api.get('/investments/roi'),
        ]);

        const investments = investmentsRes.data;
        const roi = roiRes.data;

        setInvestments(investments);

        setStats({
          totalInvested: roi.totalInvested || 0,
          totalReturns: roi.totalReturns || 0,
          totalROI: roi.totalROI || 0,
          activeInvestments: investments.filter(i => i.status === 'confirmed').length,
          pendingReturns: roi.investments?.reduce((sum, i) => sum + (i.pendingReturn || 0), 0) || 0,
        });

        setRecentActivity(
          investments.slice(0, 5).map(inv => ({
            title: inv.film?.title || 'Investment',
            date: new Date(inv.createdAt).toLocaleDateString(),
            amount: `$${inv.amount.toLocaleString()}`,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);


 if (loading) {
  return (
    <div className="space-y-8">
      {/* Welcome skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats skeleton - 4 cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Two column skeleton */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="card">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome, {user?.name?.split(' ')[0]}! 
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your investment portfolio.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invested"
          value={`$${stats.totalInvested.toLocaleString()}`}
          icon={<Wallet className="w-5 h-5" />}
          trend={null}
        />
        <StatCard
          title="Projected Returns"
          value={`$${stats.totalReturns.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={`${stats.totalROI >= 0 ? '+' : ''}${stats.totalROI}% ROI`}
          trendUp={stats.totalROI >= 0}
        />
        <StatCard
          title="Active Investments"
          value={stats.activeInvestments}
          icon={<Film className="w-5 h-5" />}
          trend={null}
        />
        <StatCard
          title="Pending Returns"
          value={`$${stats.pendingReturns.toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="Expected this month"
          trendUp
        />
      </div>

      {/* Portfolio Overview */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Portfolio Breakdown */}
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center">
              <Card.Title>Portfolio Breakdown</Card.Title>
              <Link
                to="/dashboard/portfolio"
                className="text-sm text-primary-500 hover:text-primary-400 flex items-center"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </Card.Header>
          <Card.Body>
            <PortfolioChart investments={investments} />
          </Card.Body>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center">
              <Card.Title>Recent Activity</Card.Title>
              <Link
                to="/dashboard/investments"
                className="text-sm text-primary-500 hover:text-primary-400 flex items-center"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </Card.Header>
          <Card.Body>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.date}</p>
                    </div>
                    <span className="text-green-500">{activity.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>No recent activity</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              to="/films"
              className="p-4 bg-muted rounded-lg hover:bg-accent transition-colors text-center"
            >
              <Film className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="font-medium text-foreground">Browse Films</p>
              <p className="text-sm text-muted-foreground">Find new investments</p>
            </Link>
            <Link
              to="/dashboard/settings?tab=wallet"
              className="p-4 bg-muted rounded-lg hover:bg-accent transition-colors text-center"
            >
              <Wallet className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="font-medium text-foreground">Connect Wallet</p>
              <p className="text-sm text-muted-foreground">MetaMask, Coinbase & more</p>
            </Link>
            <Link
              to="/dashboard/portfolio"
              className="p-4 bg-muted rounded-lg hover:bg-accent transition-colors text-center"
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary-500" />
              <p className="font-medium text-foreground">View ROI</p>
              <p className="text-sm text-muted-foreground">Track your returns</p>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

// Chart Colors
const CHART_COLORS = ['#f04438', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#84cc16'];

// Custom tooltip for the pie chart
function ChartTooltip({ active, payload }) {
  if (active && payload?.[0]) {
    const data = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{data.name}</p>
        <p className="text-xs text-muted-foreground">
          ${data.value.toLocaleString()} ({data.payload.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

// Portfolio Chart Component
function PortfolioChart({ investments }) {
  if (!investments || investments.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p>No investments yet. Browse films to start investing!</p>
      </div>
    );
  }

  // Aggregate investments by film
  const filmMap = {};
  investments.forEach((inv) => {
    const filmTitle = inv.film?.title || 'Unknown Film';
    filmMap[filmTitle] = (filmMap[filmTitle] || 0) + inv.amount;
  });

  const total = Object.values(filmMap).reduce((s, v) => s + v, 0);
  const chartData = Object.entries(filmMap)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="h-64 flex items-center">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/2 space-y-2 overflow-auto max-h-64 pr-2">
        {chartData.map((item, i) => (
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
  );
}

// Stat Card Component
function StatCard({ title, value, icon, trend, trendUp }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-1 flex items-center ${
                trendUp ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {trendUp ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {trend}
            </p>
          )}
        </div>
        <div className="p-2 bg-primary-500/20 rounded-lg text-primary-500">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default DashboardHome;
