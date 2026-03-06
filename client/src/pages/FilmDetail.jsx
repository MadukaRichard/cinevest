/**
 * ===========================================
 * Film Detail Page
 * ===========================================
 *
 * Displays detailed information about a single film
 * and provides an investment form for funding films.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Film,
  TrendingUp,
  Users,
  Play,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import SEO from '../components/ui/SEO';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

function FilmDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [film, setFilm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Investment state
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investForm, setInvestForm] = useState({
    amount: '',
    currency: 'USD',
    paymentMethod: 'card',
    transactionHash: '',
  });
  const [investing, setInvesting] = useState(false);

  useEffect(() => {
    fetchFilm();
  }, [id]);

  const fetchFilm = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/films/${id}`);
      setFilm(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Film not found');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async (e) => {
    e.preventDefault();

    if (!investForm.amount || Number(investForm.amount) <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    if (film.minInvestment && Number(investForm.amount) < film.minInvestment) {
      toast.error(`Minimum investment is $${film.minInvestment.toLocaleString()}`);
      return;
    }

    if (investForm.paymentMethod === 'crypto' && !investForm.transactionHash) {
      toast.error('Please paste your transaction hash — the unique ID from your crypto payment (starts with 0x)');
      return;
    }

    try {
      setInvesting(true);
      const { data } = await api.post('/investments', {
        filmId: id,
        amount: Number(investForm.amount),
        currency: investForm.currency,
        paymentMethod: investForm.paymentMethod,
        transactionHash: investForm.transactionHash || undefined,
      });

      toast.success('Investment submitted — pending admin approval.');

      setShowInvestModal(false);
      setInvestForm({ amount: '', currency: 'USD', paymentMethod: 'card', transactionHash: '' });
      fetchFilm(); // Refresh to show updated funding
    } catch (err) {
      toast.error(err.response?.data?.message || 'Investment failed');
    } finally {
      setInvesting(false);
    }
  };

  const fundingProgress = film
    ? Math.round((film.currentFunding / film.targetBudget) * 100)
    : 0;

  const daysLeft = film?.fundingDeadline
    ? Math.ceil(
        (new Date(film.fundingDeadline) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const statusColors = {
    upcoming: 'bg-blue-500/20 text-blue-400',
    funding: 'bg-green-500/20 text-green-400',
    'in-production': 'bg-amber-500/20 text-amber-400',
    completed: 'bg-purple-500/20 text-purple-400',
    released: 'bg-emerald-500/20 text-emerald-400',
  };

  if (loading) {
    return (
      <div className="container-custom py-10">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="container-custom py-20 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {error || 'Film Not Found'}
        </h2>
        <p className="text-muted-foreground mb-6">
          The film you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/films"
          className="inline-flex items-center text-primary-500 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Films
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      <SEO
        title={film.title}
        description={film.description?.slice(0, 160)}
        image={film.poster}
        type="article"
      />

      {/* Back link */}
      <Link
        to="/films"
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Films
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Poster / Trailer */}
          <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
            {film.poster ? (
              <img
                src={film.poster}
                alt={film.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Film className="w-16 h-16" />
              </div>
            )}
            {film.trailer && (
              <a
                href={film.trailer}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </a>
            )}
            <span
              className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[film.status] || 'bg-muted text-muted-foreground'
              }`}
            >
              {film.status}
            </span>
          </div>

          {/* Title & Genre */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {film.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {film.genre?.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <Card>
            <Card.Header>
              <Card.Title>About This Film</Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {film.description}
              </p>
            </Card.Body>
          </Card>

          {/* Details */}
          <Card>
            <Card.Header>
              <Card.Title>Production Details</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Director</p>
                  <p className="font-medium text-foreground">
                    {film.director || 'TBA'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cast</p>
                  <p className="font-medium text-foreground">
                    {film.cast?.length ? film.cast.join(', ') : 'TBA'}
                  </p>
                </div>
                {film.releaseDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Release Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(film.releaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Funding Deadline
                  </p>
                  <p className="font-medium text-foreground">
                    {new Date(film.fundingDeadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding Card */}
          <Card className="sticky top-24">
            <Card.Header>
              <Card.Title>Funding Progress</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-foreground">
                      ${film.currentFunding?.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      of ${film.targetBudget?.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(fundingProgress, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {fundingProgress}% funded
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <TrendingUp className="w-5 h-5 mx-auto text-green-500 mb-1" />
                    <p className="text-lg font-bold text-foreground">
                      {film.expectedROI}%
                    </p>
                    <p className="text-xs text-muted-foreground">Expected ROI</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-bold text-foreground">
                      {film.totalInvestors}
                    </p>
                    <p className="text-xs text-muted-foreground">Investors</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <DollarSign className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                    <p className="text-lg font-bold text-foreground">
                      ${film.minInvestment?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Min. Investment</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                    <p className="text-lg font-bold text-foreground">
                      {daysLeft > 0 ? daysLeft : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Days Left</p>
                  </div>
                </div>

                {/* Invest Button */}
                {film.status === 'funding' && daysLeft > 0 ? (
                  isAuthenticated ? (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => setShowInvestModal(true)}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Invest Now
                    </Button>
                  ) : (
                    <Link to="/login" className="block">
                      <Button variant="primary" className="w-full">
                        Login to Invest
                      </Button>
                    </Link>
                  )
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    {film.status === 'funding'
                      ? 'Funding Period Ended'
                      : `Status: ${film.status}`}
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <Card.Header>
              <div className="flex justify-between items-center">
                <Card.Title>Invest in {film.title}</Card.Title>
                <button
                  onClick={() => setShowInvestModal(false)}
                  className="text-muted-foreground hover:text-foreground text-xl leading-none"
                >
                  &times;
                </button>
              </div>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleInvest} className="space-y-4">
                <Input
                  label="Investment Amount ($)"
                  type="number"
                  min={film.minInvestment || 1}
                  step="1"
                  value={investForm.amount}
                  onChange={(e) =>
                    setInvestForm({ ...investForm, amount: e.target.value })
                  }
                  placeholder={`Min: $${film.minInvestment?.toLocaleString()}`}
                  icon={<DollarSign className="w-5 h-5" />}
                  required
                />

                {/* Live ROI Preview */}
                {Number(investForm.amount) > 0 && (() => {
                  const amt = Number(investForm.amount);
                  const ownership = (amt / film.targetBudget) * 100;
                  const projectedRevenue = film.targetBudget * (1 + film.expectedROI / 100);
                  const yourReturn = (ownership / 100) * projectedRevenue;
                  const profit = yourReturn - amt;
                  // ROI = ((Return - Investment) / Investment) × 100
                  const roi = amt > 0 ? ((yourReturn - amt) / amt) * 100 : 0;

                  return (
                  <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-primary-500">Your Investment Breakdown</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ownership Stake</span>
                        <span className="text-foreground font-bold">
                          {ownership.toFixed(3)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Film Budget</span>
                        <span className="text-foreground font-medium">
                          ${film.targetBudget?.toLocaleString()}
                        </span>
                      </div>
                      <hr className="border-border" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Projected Film Revenue</span>
                        <span className="text-foreground font-medium">
                          ${projectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Your Return</span>
                        <span className="text-green-500 font-bold text-base">
                          ${yourReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Projected Profit</span>
                        <span className={`font-semibold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {profit >= 0 ? '+' : ''}${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ROI</span>
                        <span className={`font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * ROI = ((Return − Investment) ÷ Investment) × 100. Projected returns based on expected performance — actual returns depend on real film revenue.
                    </p>
                  </div>
                  );
                })()}

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setInvestForm({ ...investForm, paymentMethod: 'card', currency: 'USD' })
                      }
                      className={`p-3 rounded-lg border text-center text-sm font-medium transition ${
                        investForm.paymentMethod === 'card'
                          ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                          : 'border-border bg-muted text-muted-foreground hover:border-foreground/30'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 mx-auto mb-1" />
                      Card / Fiat
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setInvestForm({ ...investForm, paymentMethod: 'crypto', currency: 'ETH' })
                      }
                      className={`p-3 rounded-lg border text-center text-sm font-medium transition ${
                        investForm.paymentMethod === 'crypto'
                          ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                          : 'border-border bg-muted text-muted-foreground hover:border-foreground/30'
                      }`}
                    >
                      <Wallet className="w-5 h-5 mx-auto mb-1" />
                      Crypto
                    </button>
                  </div>
                </div>

                {/* Currency (for crypto) */}
                {investForm.paymentMethod === 'crypto' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Currency
                      </label>
                      <select
                        value={investForm.currency}
                        onChange={(e) =>
                          setInvestForm({ ...investForm, currency: e.target.value })
                        }
                        className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2.5"
                      >
                        <option value="ETH">ETH</option>
                        <option value="BTC">BTC</option>
                        <option value="USDT">USDT</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                    <div>
                      <Input
                        label="Transaction Hash (Tx Hash)"
                        value={investForm.transactionHash}
                        onChange={(e) =>
                          setInvestForm({
                            ...investForm,
                            transactionHash: e.target.value,
                          })
                        }
                        placeholder="0x1a2b3c4d..."
                        required
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                        A transaction hash is a unique ID for your crypto payment on the blockchain. 
                        After sending your payment, you'll find it in your wallet app under transaction 
                        details — it starts with <code className="bg-muted px-1 py-0.5 rounded text-xs">0x</code> and 
                        looks like a long string of letters and numbers. Paste it here so we can verify your payment.
                      </p>
                    </div>
                  </>
                )}

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Film</span>
                    <span className="text-foreground font-medium">
                      {film.title}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground font-medium">
                      ${Number(investForm.amount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ownership</span>
                    <span className="text-primary-500 font-medium">
                      {Number(investForm.amount) > 0
                        ? ((Number(investForm.amount) / film.targetBudget) * 100).toFixed(3)
                        : '0'}%
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={investing}
                >
                  {investing ? 'Processing...' : 'Confirm Investment'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By confirming, you agree to our{' '}
                  <Link to="/terms" className="text-primary-500 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and acknowledge the investment risks.
                </p>
              </form>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}

export default FilmDetail;
