/**
 * ===========================================
 * Chat Management Component
 * ===========================================
 *
 * Admin interface for moderating chat messages.
 * View messages per room, search, delete, and view stats.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Crown,
  Megaphone,
  Clapperboard,
  Coins,
  BarChart3,
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const ROOMS = [
  { id: 'general', name: 'General Discussion', icon: MessageCircle },
  { id: 'vip-lounge', name: 'VIP Lounge', icon: Crown },
  { id: 'announcements', name: 'Announcements', icon: Megaphone },
  { id: 'film-talk', name: 'Film Talk', icon: Clapperboard },
  { id: 'crypto', name: 'Crypto & Payments', icon: Coins },
];

function ChatManagement() {
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* ── Fetch chat stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/chat/stats');
      setStats(res.data);
    } catch {
      /* silent — stats are non-critical */
    }
  }, []);

  /* ── Fetch messages for room ── */
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: 30 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get(`/admin/chat/${selectedRoom}`, { params });
      setMessages(res.data.messages || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoom, page, searchQuery]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /* Reset page when room or search changes */
  useEffect(() => {
    setPage(1);
  }, [selectedRoom, searchQuery]);

  /* ── Delete message ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/chat/${deleteTarget._id}`);
      toast.success('Message deleted');
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchMessages();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const activeRoom = ROOMS.find((r) => r.id === selectedRoom) || ROOMS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Chat Management</h1>
        <p className="text-muted-foreground text-sm">Moderate chat rooms and messages</p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalMessages?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20 text-green-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.messagesToday?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.roomStats?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Active Rooms</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20 text-orange-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.activeUsersCount?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Active (24h)</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Room Selector */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {ROOMS.map((room) => {
            const Icon = room.icon;
            const isActive = selectedRoom === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {room.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Search */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {total} message{total !== 1 ? 's' : ''} in <span className="font-medium text-foreground">{activeRoom.name}</span>
          </p>
        </div>
      </Card>

      {/* Messages Table */}
      <Card>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-64 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length > 0 ? (
          <>
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <div key={msg._id} className="flex items-start gap-3 py-3 px-2 group hover:bg-accent/30 rounded-lg transition-colors">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5">
                    {msg.sender?.name?.charAt(0) || '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-foreground text-sm">{msg.sender?.name || 'Unknown'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        msg.sender?.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                        msg.sender?.role === 'vip' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {msg.sender?.role || 'user'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                      {msg.isEdited && (
                        <span className="text-[10px] text-muted-foreground italic">(edited)</span>
                      )}
                    </div>

                    {/* Message text */}
                    <p className="text-sm text-foreground/80 break-words">{msg.message}</p>

                    {/* Attachments */}
                    {msg.attachments?.length > 0 && (
                      <div className="mt-1 flex gap-2 flex-wrap">
                        {msg.attachments.map((url, i) => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          return isImage ? (
                            <img key={i} src={url} alt="attachment" className="h-16 rounded border border-border object-cover" />
                          ) : (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-500 underline"
                            >
                              Attachment {i + 1}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => { setDeleteTarget(msg); setIsDeleteModalOpen(true); }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No messages found in this room</p>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
        title="Delete Message"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground">
                  Are you sure you want to delete this message from <strong>{deleteTarget.sender?.name || 'Unknown'}</strong>?
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-words italic">
                  "{deleteTarget.message?.slice(0, 120)}{deleteTarget.message?.length > 120 ? '…' : ''}"
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">This action cannot be undone and will be logged in the audit trail.</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ChatManagement;
