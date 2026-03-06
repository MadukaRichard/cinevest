/**
 * ===========================================
 * Featured Opportunities Management
 * ===========================================
 *
 * Admin page to manage which films appear in
 * the "Featured Opportunities" section on the
 * homepage. Supports:
 *  - Viewing all films with featured toggle
 *  - Drag-to-reorder featured films
 *  - Search / filter
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  StarOff,
  Search,
  Loader2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Save,
  Image,
  AlertTriangle,
} from 'lucide-react';
import api from '../../utils/api';

function FeaturedManagement() {
  // ──── State ────
  const [allFilms, setAllFilms] = useState([]);
  const [featuredFilms, setFeaturedFilms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null); // film id being toggled
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [orderDirty, setOrderDirty] = useState(false);

  // ──── Fetch ────
  const fetchFilms = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/films');
      const films = res.data;
      setAllFilms(films);
      setFeaturedFilms(
        films
          .filter((f) => f.featured)
          .sort((a, b) => a.featuredOrder - b.featuredOrder)
      );
    } catch {
      setError('Failed to load films');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilms();
  }, [fetchFilms]);

  // ──── Toggle featured ────
  const handleToggle = async (film) => {
    setToggling(film._id);
    try {
      const newFeatured = !film.featured;
      await api.put(`/films/${film._id}/featured`, {
        featured: newFeatured,
        featuredOrder: newFeatured ? featuredFilms.length : 0,
      });

      // Update local state
      setAllFilms((prev) =>
        prev.map((f) =>
          f._id === film._id
            ? { ...f, featured: newFeatured, featuredOrder: newFeatured ? featuredFilms.length : 0 }
            : f
        )
      );

      if (newFeatured) {
        setFeaturedFilms((prev) => [
          ...prev,
          { ...film, featured: true, featuredOrder: prev.length },
        ]);
      } else {
        setFeaturedFilms((prev) => prev.filter((f) => f._id !== film._id));
      }
    } catch {
      setError('Failed to update featured status');
    } finally {
      setToggling(null);
    }
  };

  // ──── Reorder helpers ────
  const moveUp = (index) => {
    if (index === 0) return;
    setFeaturedFilms((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setOrderDirty(true);
  };

  const moveDown = (index) => {
    if (index === featuredFilms.length - 1) return;
    setFeaturedFilms((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setOrderDirty(true);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const items = featuredFilms.map((f, i) => ({ id: f._id, featuredOrder: i }));
      await api.put('/films/featured/reorder', { items });
      setOrderDirty(false);
    } catch {
      setError('Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  // ──── Filtered non-featured films for the "Add" table ────
  const nonFeaturedFilms = allFilms
    .filter((f) => !f.featured)
    .filter(
      (f) =>
        f.title?.toLowerCase().includes(search.toLowerCase()) ||
        f.director?.toLowerCase().includes(search.toLowerCase())
    );

  // ──── Render ────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Featured Opportunities</h1>
        <p className="text-muted-foreground mt-1">
          Choose which films appear in the homepage "Featured Opportunities" section and set their display order.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ═══════════ Currently Featured ═══════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Currently Featured ({featuredFilms.length})
          </h2>
          {orderDirty && (
            <button
              onClick={saveOrder}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Order
            </button>
          )}
        </div>

        {featuredFilms.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <StarOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No featured films yet. Add some from the list below.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {featuredFilms.map((film, index) => (
              <div
                key={film._id}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary-500/30 transition-colors"
              >
                {/* Grip / order */}
                <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-xs font-mono">{index + 1}</span>
                </div>

                {/* Poster thumbnail */}
                <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                  {film.poster ? (
                    <img src={film.poster} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{film.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {film.genre?.join(', ')} · {film.status}
                  </p>
                </div>

                {/* Move buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === featuredFilms.length - 1}
                    className="p-1.5 rounded hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleToggle(film)}
                  disabled={toggling === film._id}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                >
                  {toggling === film._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <StarOff className="w-3.5 h-3.5" />
                  )}
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════ All Films (add to featured) ═══════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            All Films ({nonFeaturedFilms.length} available)
          </h2>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or director..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 text-sm transition-colors"
          />
        </div>

        {nonFeaturedFilms.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
            {search ? 'No films match your search.' : 'All films are already featured, or none have been created yet.'}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Film</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Genre</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Funding</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {nonFeaturedFilms.map((film) => (
                    <tr key={film._id} className="hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-7 rounded overflow-hidden bg-muted flex-shrink-0">
                            {film.poster ? (
                              <img src={film.poster} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Image className="w-3 h-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{film.title}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">{film.genre?.slice(0, 2).join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                        {film.genre?.slice(0, 2).join(', ')}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <StatusBadge status={film.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        {film.targetBudget
                          ? `$${(film.currentFunding || 0).toLocaleString()} / $${film.targetBudget.toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggle(film)}
                          disabled={toggling === film._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 disabled:opacity-50 transition-colors font-medium"
                        >
                          {toggling === film._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Star className="w-3.5 h-3.5" />
                          )}
                          Feature
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    upcoming: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    funding: 'bg-green-500/10 text-green-500 border-green-500/30',
    'in-production': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    completed: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    released: 'bg-primary-500/10 text-primary-500 border-primary-500/30',
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${colors[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
}

export default FeaturedManagement;
