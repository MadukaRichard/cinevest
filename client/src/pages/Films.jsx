/**
 * ===========================================
 * Films Browse Page
 * ===========================================
 * 
 * Public page for browsing all film investment
 * opportunities. Fetches from GET /api/films
 * with search, genre filter, status filter, and sort.
 */

import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Film, X } from 'lucide-react';
import FilmCard from '../components/ui/FilmCard';
import SEO from '../components/ui/SEO';
import { FilmGridSkeleton } from '../components/ui/Skeleton';
import api from '../utils/api';

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation',
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'funding', label: 'Now Funding' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in-production', label: 'In Production' },
  { value: 'completed', label: 'Completed' },
  { value: 'released', label: 'Released' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'funding', label: 'Most Funded' },
  { value: 'deadline', label: 'Ending Soon' },
];

function Films() {
  const [films, setFilms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchFilms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (genreFilter) params.genre = genreFilter;
      if (sortBy) params.sort = sortBy;
      const res = await api.get('/films', { params });
     setFilms(res.data.films);
    } catch (err) {
      setError('Failed to load films. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, genreFilter, sortBy]);

  useEffect(() => {
    fetchFilms();
  }, [fetchFilms]);

  // Client-side search (server already filters by status/genre/sort)
  const filteredFilms = films.filter((film) =>
    film.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    film.director?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFilterCount = [statusFilter, genreFilter, sortBy].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('');
    setGenreFilter('');
    setSortBy('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen">
      <SEO title="Browse Films" description="Discover and invest in upcoming film projects. Filter by genre, status, and expected ROI." />

      {/* Hero Banner */}
      <section className="bg-card/50 border-b border-border">
        <div className="container-custom py-12 md:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Browse Film Projects
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover curated investment opportunities in cinema. Each project is
              vetted for quality, market potential, and transparency.
            </p>
          </div>
        </div>
      </section>

      {/* Search + Filter Bar */}
      <section className="sticky top-16 z-20 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title or director..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter toggle (mobile) + Sort (always visible) */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors sm:hidden ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-background border-border text-foreground hover:bg-accent'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-white/20 text-xs rounded-full px-1.5 py-0.5 font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Desktop filters inline */}
              <div className="hidden sm:flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                <select
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="">All Genres</option>
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary-500"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mobile filters panel */}
          {showFilters && (
            <div className="sm:hidden mt-3 pt-3 border-t border-border space-y-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">All Genres</option>
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary-500"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-sm text-primary-500 hover:text-primary-400 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Active filters summary */}
          {activeFilterCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {statusFilter && (
                <FilterChip
                  label={STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label || statusFilter}
                  onRemove={() => setStatusFilter('')}
                />
              )}
              {genreFilter && (
                <FilterChip label={genreFilter} onRemove={() => setGenreFilter('')} />
              )}
              {sortBy && (
                <FilterChip
                  label={SORT_OPTIONS.find((s) => s.value === sortBy)?.label || sortBy}
                  onRemove={() => setSortBy('')}
                />
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-primary-500 hover:text-primary-400 font-medium ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="container-custom py-8">
        {isLoading ? (
          <FilmGridSkeleton count={6} />
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchFilms}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredFilms.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              Showing {filteredFilms.length} film{filteredFilms.length !== 1 ? 's' : ''}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFilms.map((film) => (
                <FilmCard key={film._id} film={film} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Film className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery || activeFilterCount > 0
                ? 'No films match your criteria'
                : 'No films available yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Check back soon — new investment opportunities are added regularly.'}
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-500/10 text-primary-500 text-sm rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-primary-300 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default Films;
