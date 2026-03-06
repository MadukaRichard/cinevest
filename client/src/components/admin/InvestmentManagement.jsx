/**
 * ===========================================
 * Investment Management Component
 * ===========================================
 * 
 * Admin interface for managing investments.
 * Wired to real API with filters and pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function InvestmentManagement() {
  const [investments, setInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchInvestments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter) params.status = filter;
      const res = await api.get('/admin/investments', { params });
      setInvestments(res.data.investments || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load investments');
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleStatusUpdate = async (investmentId, newStatus) => {
    try {
      await api.put(`/admin/investments/${investmentId}/status`, { status: newStatus });
      toast.success(`Investment ${newStatus}`);
      fetchInvestments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filterOptions = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  // Client-side search
  const filtered = investments.filter(
    (inv) =>
      inv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.film?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investment Management</h1>
          <p className="text-muted-foreground text-sm">{total} total investments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by user or film..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => { setFilter(option.value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Investments Table */}
      <Card>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">User</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm hidden sm:table-cell">Film</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Amount</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium text-sm hidden md:table-cell">Date</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv._id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 text-foreground font-medium">{inv.user?.name || 'Unknown'}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{inv.film?.title || 'Unknown'}</td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        ${inv.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm hidden md:table-cell">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          {inv.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(inv._id, 'confirmed')}
                                className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                title="Confirm"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(inv._id, 'failed')}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No investments found</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
    confirmed: { color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
    failed: { color: 'bg-red-500/20 text-red-500', icon: XCircle },
    refunded: { color: 'bg-blue-500/20 text-blue-500', icon: null },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`${config.color} text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 w-fit`}>
      {Icon && <Icon className="w-3 h-3" />}
      {status}
    </span>
  );
}

export default InvestmentManagement;
