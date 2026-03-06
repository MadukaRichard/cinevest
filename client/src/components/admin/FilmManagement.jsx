/**
 * ===========================================
 * Film Management CMS Component
 * ===========================================
 * 
 * Full CMS for managing film projects.
 * Create, edit, delete, search, and filter films.
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Eye, Image, AlertCircle, Loader2, X } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-500/20 text-blue-500' },
  { value: 'funding', label: 'Funding', color: 'bg-green-500/20 text-green-500' },
  { value: 'in-production', label: 'In Production', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500/20 text-purple-500' },
  { value: 'released', label: 'Released', color: 'bg-primary-500/20 text-primary-500' },
];

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation',
];

function FilmManagement() {
  const [films, setFilms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilm, setEditingFilm] = useState(null);
  const [previewFilm, setPreviewFilm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchFilms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/films', { params });
      setFilms(res.data);
    } catch (err) {
      toast.error('Failed to load films');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchFilms();
  }, [fetchFilms]);

  const handleCreateFilm = () => {
    setEditingFilm(null);
    setIsModalOpen(true);
  };

  const handleEditFilm = (film) => {
    setEditingFilm(film);
    setIsModalOpen(true);
  };

  const handleDeleteFilm = async (filmId) => {
    try {
      await api.delete(`/films/${filmId}`);
      toast.success('Film deleted successfully');
      setDeleteConfirm(null);
      fetchFilms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete film');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingFilm) {
        await api.put(`/films/${editingFilm._id}`, formData);
        toast.success('Film updated successfully');
      } else {
        await api.post('/films', formData);
        toast.success('Film created successfully');
      }
      setIsModalOpen(false);
      fetchFilms();
    } catch (err) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors.map((e) => e.msg).join(', ')
        : err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    }
  };

  // Client-side search
  const filteredFilms = films.filter((film) =>
    film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    film.director?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Film Management</h1>
          <p className="text-muted-foreground text-sm">{films.length} total films</p>
        </div>
        <Button variant="primary" onClick={handleCreateFilm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Film
        </Button>
      </div>

      {/* Search + Filter bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by title or director..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Films Table / Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredFilms.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFilms.map((film) => (
            <FilmCMSCard
              key={film._id}
              film={film}
              onEdit={() => handleEditFilm(film)}
              onDelete={() => setDeleteConfirm(film)}
              onPreview={() => setPreviewFilm(film)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-16">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-1">
              {searchQuery || statusFilter ? 'No matching films found' : 'No films yet'}
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Create your first film project to get started'}
            </p>
            {!searchQuery && !statusFilter && (
              <Button variant="primary" onClick={handleCreateFilm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Film
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFilm ? 'Edit Film' : 'Create New Film'}
        size="full"
      >
        <FilmForm
          film={editingFilm}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewFilm}
        onClose={() => setPreviewFilm(null)}
        title="Film Preview"
        size="lg"
      >
        {previewFilm && <FilmPreview film={previewFilm} />}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <span className="text-foreground font-semibold">{deleteConfirm.title}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteFilm(deleteConfirm._id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Film
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Film CMS Card                                */
/* ──────────────────────────────────────────── */
function FilmCMSCard({ film, onEdit, onDelete, onPreview }) {
  const statusCfg = STATUS_OPTIONS.find((s) => s.value === film.status) || STATUS_OPTIONS[0];
  const progress = film.targetBudget ? Math.round((film.currentFunding / film.targetBudget) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Poster */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {film.poster ? (
          <img src={film.poster} alt={film.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Image className="w-10 h-10" />
          </div>
        )}
        <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 truncate">{film.title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{film.director} • {film.genre?.join(', ')}</p>

        {/* Funding progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>${(film.currentFunding || 0).toLocaleString()}</span>
            <span>${(film.targetBudget || 0).toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}% funded • {film.totalInvestors || 0} investors</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Film Preview                                 */
/* ──────────────────────────────────────────── */
function FilmPreview({ film }) {
  const statusCfg = STATUS_OPTIONS.find((s) => s.value === film.status) || STATUS_OPTIONS[0];
  const progress = film.targetBudget ? Math.round((film.currentFunding / film.targetBudget) * 100) : 0;

  return (
    <div className="space-y-4">
      {film.poster && (
        <img src={film.poster} alt={film.title} className="w-full rounded-lg object-cover max-h-64" />
      )}
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold text-foreground">{film.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>
      <p className="text-muted-foreground">{film.description}</p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Director:</span>
          <span className="ml-2 text-foreground font-medium">{film.director}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Genre:</span>
          <span className="ml-2 text-foreground font-medium">{film.genre?.join(', ')}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Target Budget:</span>
          <span className="ml-2 text-foreground font-medium">${film.targetBudget?.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Min Investment:</span>
          <span className="ml-2 text-foreground font-medium">${film.minInvestment?.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Expected ROI:</span>
          <span className="ml-2 text-foreground font-medium">{film.expectedROI}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Funding Progress:</span>
          <span className="ml-2 text-foreground font-medium">{progress}%</span>
        </div>
        {film.fundingDeadline && (
          <div>
            <span className="text-muted-foreground">Deadline:</span>
            <span className="ml-2 text-foreground font-medium">
              {new Date(film.fundingDeadline).toLocaleDateString()}
            </span>
          </div>
        )}
        {film.releaseDate && (
          <div>
            <span className="text-muted-foreground">Release Date:</span>
            <span className="ml-2 text-foreground font-medium">
              {new Date(film.releaseDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {film.cast?.length > 0 && (
        <div>
          <span className="text-muted-foreground text-sm">Cast:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {film.cast.map((c, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-muted rounded-full text-foreground">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  Film Form - Full CMS editor                  */
/* ──────────────────────────────────────────── */
function FilmForm({ film, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: film?.title || '',
    description: film?.description || '',
    director: film?.director || '',
    genre: film?.genre || [],
    cast: film?.cast?.join(', ') || '',
    poster: film?.poster || '',
    trailer: film?.trailer || '',
    targetBudget: film?.targetBudget || '',
    minInvestment: film?.minInvestment || '',
    expectedROI: film?.expectedROI || '',
    status: film?.status || 'upcoming',
    fundingDeadline: film?.fundingDeadline ? new Date(film.fundingDeadline).toISOString().split('T')[0] : '',
    releaseDate: film?.releaseDate ? new Date(film.releaseDate).toISOString().split('T')[0] : '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGenre = (genre) => {
    setFormData((prev) => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter((g) => g !== genre)
        : [...prev.genre, genre],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...formData,
      cast: formData.cast ? formData.cast.split(',').map((c) => c.trim()).filter(Boolean) : [],
      targetBudget: Number(formData.targetBudget),
      minInvestment: Number(formData.minInvestment),
      expectedROI: Number(formData.expectedROI),
    };
    await onSubmit(payload);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Poster preview */}
      {formData.poster && (
        <div className="relative rounded-lg overflow-hidden bg-muted max-h-48">
          <img src={formData.poster} alt="Preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={() => handleChange('poster', '')}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Input
        label="Poster URL"
        placeholder="https://example.com/poster.jpg"
        value={formData.poster}
        onChange={(e) => handleChange('poster', e.target.value)}
      />

      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Description <span className="text-primary-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 min-h-[120px] resize-y"
          placeholder="Describe the film project, its vision, and why investors should be interested..."
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Director"
          value={formData.director}
          onChange={(e) => handleChange('director', e.target.value)}
          required
        />
        <Input
          label="Cast"
          placeholder="Actor 1, Actor 2, ..."
          value={formData.cast}
          onChange={(e) => handleChange('cast', e.target.value)}
        />
      </div>

      {/* Genre multi-select */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Genre <span className="text-primary-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {GENRE_OPTIONS.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                formData.genre.includes(genre)
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-background text-muted-foreground border-border hover:border-primary-500'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
        {formData.genre.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">Select at least one genre</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleChange('status', s.value)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                formData.status === s.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-background text-muted-foreground border-border hover:border-primary-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Target Budget ($)"
          type="number"
          value={formData.targetBudget}
          onChange={(e) => handleChange('targetBudget', e.target.value)}
          required
        />
        <Input
          label="Min Investment ($)"
          type="number"
          value={formData.minInvestment}
          onChange={(e) => handleChange('minInvestment', e.target.value)}
          required
        />
        <Input
          label="Expected ROI (%)"
          type="number"
          value={formData.expectedROI}
          onChange={(e) => handleChange('expectedROI', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Funding Deadline"
          type="date"
          value={formData.fundingDeadline}
          onChange={(e) => handleChange('fundingDeadline', e.target.value)}
          required
        />
        <Input
          label="Release Date"
          type="date"
          value={formData.releaseDate}
          onChange={(e) => handleChange('releaseDate', e.target.value)}
        />
      </div>

      <Input
        label="Trailer URL"
        placeholder="https://youtube.com/watch?v=..."
        value={formData.trailer}
        onChange={(e) => handleChange('trailer', e.target.value)}
      />

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {film ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            film ? 'Update Film' : 'Create Film'
          )}
        </Button>
      </div>
    </form>
  );
}

export default FilmManagement;
