/**
 * ===========================================
 * Investments Component
 * ===========================================
 * 
 * Displays user's investments with filtering and sorting.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search, ArrowUpDown, TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../utils/api';

function Investments() {
  const [investments, setInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await api.get('/investments');
        setInvestments(data);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load investments';
        setError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
  ];

  const filteredInvestments = investments.filter((inv) => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (searchQuery && !inv.film?.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Summary stats
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const confirmedCount = investments.filter((inv) => inv.status === 'confirmed').length;
  const pendingCount = investments.filter((inv) => inv.status === 'pending').length;
  const totalProjectedReturn = investments.reduce((sum, inv) => {
    const ownership = inv.ownershipPercentage || 0;
    const budget = inv.film?.targetBudget || 1;
    const roi = inv.film?.expectedROI || 0;
    const revenue = inv.film?.revenue || 0;
    // Use real revenue if available, otherwise projected
    const filmEarnings = revenue > 0 ? revenue : budget * (1 + roi / 100);
    return sum + (ownership / 100) * filmEarnings;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">My Investments</h1>
        <Link to="/films">
          <Button variant="primary">Invest Now</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10">
                <DollarSign className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-xl font-bold text-foreground">${totalInvested.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected Return</p>
                <p className="text-xl font-bold text-foreground">${totalProjectedReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-xl font-bold text-foreground">{confirmedCount}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by film name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start w-full sm:w-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Investments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading investments...</p>
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      ) : filteredInvestments.length > 0 ? (
        <div className="space-y-4">
          {filteredInvestments.map((investment) => (
            <InvestmentCard key={investment._id} investment={investment} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {investments.length === 0
                ? "You haven't made any investments yet."
                : 'No investments match your filters.'}
            </p>
            {investments.length === 0 && (
              <Link to="/films">
                <Button variant="primary">Browse Films</Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// Investment Card Component
function InvestmentCard({ investment }) {
  const { film, amount, currency, status, createdAt, ownershipPercentage, dividendsPaid } = investment;

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    confirmed: 'bg-green-500/10 text-green-600 dark:text-green-400',
    completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
    refunded: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  };

  // Calculate projected return based on ownership
  const ownership = ownershipPercentage || 0;
  const filmRevenue = film?.revenue || 0;
  const targetBudget = film?.targetBudget || 1;
  const expectedROI = film?.expectedROI || 0;

  // If the film has real revenue, show actual return; otherwise show projected
  const hasRevenue = filmRevenue > 0;
  const actualReturn = (ownership / 100) * filmRevenue;
  const projectedRevenue = targetBudget * (1 + expectedROI / 100);
  const projectedReturn = (ownership / 100) * projectedRevenue;
  const displayReturn = hasRevenue ? actualReturn : projectedReturn;
  const profit = displayReturn - amount;

  return (
    <Card hover>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Film Poster */}
        <div className="w-full sm:w-32 h-48 sm:h-32 bg-accent rounded-lg overflow-hidden flex-shrink-0">
          {film?.poster ? (
            <img
              src={film.poster}
              alt={film.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No Image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{film?.title || 'Unknown Film'}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Invested {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status] || statusColors.pending}`}>
              {status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Invested</p>
              <p className="font-semibold text-foreground">
                ${amount?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Ownership</p>
              <p className="font-semibold text-primary-500">
                {ownership.toFixed(3)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Expected ROI</p>
              <p className="font-semibold text-foreground">
                {expectedROI}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                {hasRevenue ? 'Your Return' : 'Projected Return'}
              </p>
              <p className="font-semibold text-foreground">
                ${displayReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                {hasRevenue ? 'Profit' : 'Projected Profit'}
              </p>
              <p className={`font-semibold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {profit >= 0 ? '+' : ''}${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Revenue bar (if film has revenue) */}
          {hasRevenue && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Film Revenue</span>
                <span className="text-foreground font-medium">
                  ${filmRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Dividends Paid</span>
                <span className="text-foreground font-medium">
                  ${(dividendsPaid || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default Investments;
