/**
 * ===========================================
 * Chat Input Component (Real-Time)
 * ===========================================
 *
 * Input field for sending chat messages with
 * typing indicator broadcasts and file attachments.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Smile, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Picker } from 'emoji-mart';
import { useChatStore } from '../../store/chatStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/* ── Allowed file types (must match server) ── */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function ChatInput({ roomId }) {
  const [message, setMessage] = useState('');
  const [pendingFile, setPendingFile] = useState(null);   // { file, preview }
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { sendMessage, emitTyping, emitStopTyping, isConnected } = useChatStore();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Focus input when room changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [roomId]);

  // Cleanup typing on unmount or room change
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        emitStopTyping(roomId);
        isTypingRef.current = false;
      }
      clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, emitStopTyping]);

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    };
  }, [pendingFile]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(roomId);
    }

    // Reset the stop-typing timer
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitStopTyping(roomId);
    }, 2000);
  }, [roomId, emitTyping, emitStopTyping]);

  /* ── File selection handler ── */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be under 5 MB');
      return;
    }

    const isImage = file.type.startsWith('image/');
    setPendingFile({
      file,
      preview: isImage ? URL.createObjectURL(file) : null,
      isImage,
      name: file.name,
      size: file.size,
    });

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const clearPendingFile = () => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  /* ── Upload file via REST then send via socket ── */
  const uploadAndSend = async () => {
    if (!pendingFile?.file) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', pendingFile.file);

      const { data } = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Send message through socket with attachment info
      sendMessage(roomId, message.trim() || pendingFile.name, {
        messageType: data.messageType,
        attachments: [JSON.stringify({
          url: data.url,
          filename: data.filename,
          mimetype: data.mimetype,
          size: data.size,
        })],
      });

      setMessage('');
      clearPendingFile();

      // Stop typing
      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitStopTyping(roomId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If there's a pending file, upload it
    if (pendingFile) {
      await uploadAndSend();
      return;
    }

    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      sendMessage(roomId, trimmed);
      setMessage('');

      // Stop typing indicator immediately
      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitStopTyping(roomId);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + (emoji.native || emoji.colons || ''));
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-card flex-shrink-0"
    >
      {/* File preview bar */}
      {pendingFile && (
        <div className="px-2 sm:px-4 pt-2 sm:pt-3 pb-1">
          <div className="flex items-center gap-2 sm:gap-3 bg-muted/50 rounded-lg px-2 sm:px-3 py-2 border border-border">
            {pendingFile.isImage && pendingFile.preview ? (
              <img
                src={pendingFile.preview}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{pendingFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(pendingFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={clearPendingFile}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-1 sm:gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
        />

        {/* Attachment Button */}
        <button
          type="button"
          disabled={isUploading}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              !isConnected
                ? 'Connecting…'
                : pendingFile
                  ? 'Add a caption (optional)…'
                  : 'Type a message…'
            }
            disabled={!isConnected || isUploading}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-muted/50 border border-border rounded-full text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 pr-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            maxLength={1000}
            autoComplete="off"
          />
          <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowEmojiPicker((v) => !v)}
              tabIndex={-1}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 z-50">
              <Picker theme="light" onSelect={handleEmojiSelect} showPreview={false} showSkinTones={false} />
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!message.trim() && !pendingFile) || !isConnected || isUploading}
          className={`
            p-2.5 rounded-full transition-all duration-200
            ${(message.trim() || pendingFile) && isConnected && !isUploading
              ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Character count (shows near limit) */}
      {message.length > 900 && (
        <p className={`text-xs px-4 pb-2 text-right ${message.length > 980 ? 'text-red-500' : 'text-muted-foreground'}`}>
          {message.length}/1000
        </p>
      )}
    </form>
  );
}

export default ChatInput;
