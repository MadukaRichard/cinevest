/**
 * ===========================================
 * Chat Window Component (Real-Time)
 * ===========================================
 *
 * Displays chat messages for the selected room
 * with auto-scroll, typing indicators, and
 * online user presence.
 */

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Users, FileText, Download, ExternalLink, MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

function ChatWindow({ roomId }) {
  const { messages, isLoading, onlineUsers, typingUsers, isConnected } = useChatStore();
  const { editMessage, deleteMessage } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Force scroll to bottom when room changes
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 100);
  }, [roomId]);

  if (!roomId) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card">
      {/* Room header bar */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 border-b border-border flex items-center justify-between bg-card flex-shrink-0">
        <div>
          <h3 className="font-semibold text-foreground capitalize">
            #{roomId.replace(/-/g, ' ')}
          </h3>
          {/* Connection status */}
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Reconnecting…'}
            </span>
          </div>
        </div>

        {/* Online users count */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm">{onlineUsers.length} online</span>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4 space-y-2 sm:space-y-3 scrollbar-custom"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Loading messages…</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-1">No messages yet</p>
              <p className="text-sm">Be the first to say hello!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            // Group: show date separator when day changes
            const prevDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
            const curDate = new Date(message.createdAt).toDateString();
            const showDateSep = curDate !== prevDate;

            return (
              <div key={message._id || index}>
                {showDateSep && (
                  <div className="flex items-center gap-3 my-4">
                    <hr className="flex-1 border-border" />
                    <span className="text-xs text-muted-foreground px-2">
                      {format(new Date(message.createdAt), 'MMMM d, yyyy')}
                    </span>
                    <hr className="flex-1 border-border" />
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isOwn={message.sender?._id === user?._id}
                  isAdmin={user?.role === 'admin'}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                />
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

/* ── Message Bubble ── */
function MessageBubble({ message, isOwn, isAdmin, onEdit, onDelete }) {
  const { sender, message: text, createdAt, messageType, attachments, isEdited, _id } = message;
  // Fallback for missing/invalid createdAt
  let createdTime = Date.now();
  if (createdAt) {
    const parsed = new Date(createdAt).getTime();
    if (!isNaN(parsed)) createdTime = parsed;
  }
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text || '');
  const menuRef = useRef(null);

  // Can edit: own text messages only (not temp, not system, and within 5 minutes)
  const FIVE_MINUTES = 5 * 60 * 1000;
  const canEdit =
    isOwn &&
    messageType === 'text' &&
    !_id?.startsWith('temp-') &&
    !_id?.startsWith('sys-') &&
    Date.now() - createdTime <= FIVE_MINUTES;
  // Can delete: own messages or admin can delete any
  const canDelete = (isOwn || isAdmin) && !_id?.startsWith('temp-') && !_id?.startsWith('sys-');
  const hasActions = canEdit || canDelete;

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleEdit = () => {
    setShowMenu(false);
    setIsEditing(true);
    setEditText(text || '');
  };

  const handleEditSubmit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === text) {
      setIsEditing(false);
      return;
    }
    onEdit(_id, trimmed);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(_id);
  };

  // System messages
  if (messageType === 'system') {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {text}
        </p>
      </div>
    );
  }

  // Parse attachment data
  const parsedAttachments = (attachments || []).map((a) => {
    try {
      return typeof a === 'string' ? JSON.parse(a) : a;
    } catch {
      return { url: a, filename: 'file' };
    }
  });

  const hasAttachments = parsedAttachments.length > 0;
  const isImage = messageType === 'image';

  // Build absolute URL for attachments
  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // In dev the Vite proxy sends /uploads/* to the server
    return url;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex gap-2.5 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          {sender?.avatar ? (
            <img
              src={sender.avatar}
              alt={sender.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-white">
              {sender?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className={isOwn ? 'text-right' : ''}>
          {!isOwn && (
            <p className="text-xs font-medium text-muted-foreground mb-1 ml-1">
              {sender?.name}
            </p>
          )}

          <div className="relative inline-block">
            {/* Actions menu trigger — appears on hover */}
            {hasActions && !isEditing && (
              <div
                ref={menuRef}
                className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} z-10`}
              >
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {showMenu && (
                  <div className={`absolute top-6 ${isOwn ? 'left-0' : 'right-0'} bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[120px] z-20`}>
                    {canEdit && (
                      <button
                        onClick={handleEdit}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div
              className={`
                text-left rounded-2xl overflow-hidden
                ${isOwn
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
                }
              `}
            >
              {/* Image attachment */}
              {isImage && parsedAttachments.length > 0 && (
                <a
                  href={getFileUrl(parsedAttachments[0].url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={getFileUrl(parsedAttachments[0].url)}
                    alt={parsedAttachments[0].filename || 'Shared image'}
                    className="max-w-full max-h-64 object-contain"
                    loading="lazy"
                  />
                </a>
              )}

              {/* File attachment (non-image) */}
              {!isImage && hasAttachments && parsedAttachments.map((att, i) => (
                <a
                  key={i}
                  href={getFileUrl(att.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.filename}
                  className={`
                    flex items-center gap-3 px-4 py-3 transition-colors
                    ${isOwn ? 'hover:bg-primary-600' : 'hover:bg-accent'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isOwn ? 'bg-white/20' : 'bg-primary-500/10'}
                  `}>
                    <FileText className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-primary-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.filename || 'File'}</p>
                    {att.size && (
                      <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {formatSize(att.size)}
                      </p>
                    )}
                  </div>
                  <Download className={`w-4 h-4 flex-shrink-0 ${isOwn ? 'text-white/70' : 'text-muted-foreground'}`} />
                </a>
              ))}

              {/* Edit mode */}
              {isEditing ? (
                <div className="px-3 py-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                    maxLength={1000}
                    className="w-full bg-transparent border border-white/30 rounded-lg px-2 py-1 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/60"
                  />
                  <div className="flex items-center gap-1 mt-1.5 justify-end">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-1 text-white/60 hover:text-white rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      className="p-1 text-white/60 hover:text-white rounded transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Text content (always show if present, even with attachment) */
                text && !(isImage && text === parsedAttachments[0]?.filename) && (
                  <p className={`text-sm whitespace-pre-wrap break-words px-4 ${hasAttachments ? 'pt-1 pb-2.5' : 'py-2.5'}`}>
                    {text}
                  </p>
                )
              )}
            </div>
          </div>

          <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end mr-1' : 'ml-1'}`}>
            {isEdited && (
              <span className="text-[10px] text-muted-foreground/60 italic">edited</span>
            )}
            <p className="text-[10px] text-muted-foreground/60">
              {createdAt ? format(new Date(createdAt), 'HH:mm') : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Typing Indicator ── */
function TypingIndicator({ users }) {
  const names = users.map((u) => u.name).slice(0, 3);
  let text = '';
  if (names.length === 1) text = `${names[0]} is typing`;
  else if (names.length === 2) text = `${names[0]} and ${names[1]} are typing`;
  else text = `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-muted-foreground italic">{text}</span>
    </div>
  );
}

export default ChatWindow;
