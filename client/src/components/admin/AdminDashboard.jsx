/**
 * ===========================================
 * Admin Dashboard Component
 * ===========================================
 * 
 * Main admin dashboard with real platform statistics.
 */

import { useState, useEffect } from 'react';
import { Users, Film, DollarSign, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import api from '../../utils/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentInvestments, setRecentInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsRes, usersRes, investmentsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users?limit=5'),
          api.get('/admin/investments?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecentUsers(usersRes.data.users || []);
        setRecentInvestments(investmentsRes.data.investments || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-4 w-20 bg-muted rounded mb-3" />
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">Failed to load dashboard</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers?.toLocaleString() || '0'}
          subValue={`${stats?.vipUsers || 0} VIP members`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Total Films"
          value={stats?.totalFilms || 0}
          subValue={`${stats?.activeFilms || 0} actively funding`}
          icon={<Film className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Total Investments"
          value={stats?.totalInvestments?.toLocaleString() || '0'}
          subValue="Confirmed"
          icon={<Activity className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total Funding"
          value={`$${((stats?.totalFunding || 0) / 1000000).toFixed(1)}M`}
          subValue="Raised to date"
          icon={<DollarSign className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Active Films"
          value={stats?.activeFilms || 0}
          subValue="Currently funding"
          icon={<TrendingUp className="w-6 h-6" />}
          color="primary"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <Card.Header>
            <Card.Title>Recent Registrations</Card.Title>
          </Card.Header>
          <Card.Body>
            {recentUsers.length > 0 ? (
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {u.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                      u.role === 'vip' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>No recent registrations</p>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Recent Investments</Card.Title>
          </Card.Header>
          <Card.Body>
            {recentInvestments.length > 0 ? (
              <div className="space-y-3">
                {recentInvestments.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.film?.title || 'Unknown Film'}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold text-foreground">${inv.amount?.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                        inv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>No recent investments</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, subValue, icon, color }) {
  const colorClasses = {
    primary: 'bg-primary-500/20 text-primary-500',
    blue: 'bg-blue-500/20 text-blue-500',
    green: 'bg-green-500/20 text-green-500',
    yellow: 'bg-yellow-500/20 text-yellow-500',
    purple: 'bg-purple-500/20 text-purple-500',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}

export default AdminDashboard;
