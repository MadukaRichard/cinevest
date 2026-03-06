/**
 * ===========================================
 * Chat Store (Real-Time)
 * ===========================================
 *
 * Zustand store for chat state management.
 * Manages Socket.IO connection, rooms, messages,
 * online users, and typing indicators.
 */

import { create } from 'zustand';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from './authStore';

/* ── Socket singleton ── */
let socket = null;
let listenersAttached = false;

// In dev the Vite proxy forwards /socket.io → localhost:5001,
// so we connect to the page origin (undefined). In production,
// set VITE_SOCKET_URL to the actual server URL.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : undefined); // undefined = same origin → uses Vite proxy in dev

const createSocket = (token) => {
  // Always destroy existing socket when creating a new one
  // (e.g. different user logs in after logout).
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    listenersAttached = false;
  }

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
};

/* ── Default rooms ── */
const DEFAULT_ROOMS = [
  { id: 'general', name: 'General Discussion', description: 'Open chat for all investors', icon: 'general', requiresSubscription: false },
  { id: 'vip-lounge', name: 'VIP Lounge', description: 'Exclusive VIP investor chat', icon: 'vip', requiresSubscription: true },
  { id: 'announcements', name: 'Announcements', description: 'Official CineVest updates', icon: 'announcements', requiresSubscription: true },
  { id: 'film-talk', name: 'Film Talk', description: 'Discuss upcoming film projects', icon: 'film', requiresSubscription: true },
  { id: 'crypto', name: 'Crypto & Payments', description: 'Crypto investment discussion', icon: 'crypto', requiresSubscription: true },
];

export const useChatStore = create((set, get) => ({
  /* ── State ── */
  rooms: DEFAULT_ROOMS,
  messages: [],
  currentRoom: null,
  isConnected: false,
  isLoading: false,
  error: null,
  onlineUsers: [],
  typingUsers: [],

  /* ── Socket connection ── */
  connect: (token) => {
    if (!token) return;

    // If there's an existing socket with a different token, destroy it
    // so the new user gets a fresh authenticated connection.
    if (socket && socket.auth?.token !== token) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      listenersAttached = false;
    }

    // Create socket if needed
    if (!socket) {
      createSocket(token);
    }

    const sock = socket;

    if (sock.connected) {
      set({ isConnected: true });
      return;
    }

    sock.auth = { token };

    // Attach listeners only once per socket instance
    if (!listenersAttached) {
      listenersAttached = true;

      sock.on('connect', () => {
        set({ isConnected: true, error: null });

        // Re-join current room after reconnect
        const { currentRoom } = get();
        if (currentRoom) {
          sock.emit('joinRoom', currentRoom);
        }
      });

      sock.on('disconnect', () => {
        set({ isConnected: false });
      });

      sock.on('connect_error', (err) => {
        console.error('[Chat] Connection error:', err.message);
        set({ isConnected: false, error: err.message });
      });

    /* ── Room history (initial load on join) ── */
    sock.on('roomHistory', ({ roomId, messages: history }) => {
      const { currentRoom } = get();
      if (roomId === currentRoom) {
        set({ messages: history, isLoading: false });
      }
    });

    /* ── New message ── */
    sock.on('newMessage', (message) => {
      const { currentRoom, messages } = get();
      if (message.roomId !== currentRoom) return;

      const exists = messages.some((m) => m._id === message._id);
      if (!exists) {
        set({ messages: [...messages, message] });
      }

      // Clear sender from typing
      set((state) => ({
        typingUsers: state.typingUsers.filter(
          (u) => u._id !== message.sender?._id
        ),
      }));
    });

    /* ── Replace temp message with confirmed one ── */
    sock.on('messageConfirmed', ({ tempId, message: confirmed }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === tempId ? { ...confirmed } : m
        ),
      }));
    });

    /* ── Online users ── */
    sock.on('onlineUsers', ({ roomId, users }) => {
      const { currentRoom } = get();
      if (roomId === currentRoom) {
        set({ onlineUsers: users });
      }
    });

    /* ── User joined / left system messages ── */
    sock.on('userJoined', ({ roomId, user }) => {
      const { currentRoom, messages } = get();
      if (roomId !== currentRoom) return;
      set({
        messages: [
          ...messages,
          {
            _id: `sys-join-${Date.now()}`,
            roomId,
            message: `${user.name} joined the chat`,
            messageType: 'system',
            sender: user,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    });

    sock.on('userLeft', ({ roomId, user }) => {
      const { currentRoom, messages } = get();
      if (roomId !== currentRoom) return;
      set({
        messages: [
          ...messages,
          {
            _id: `sys-leave-${Date.now()}`,
            roomId,
            message: `${user.name} left the chat`,
            messageType: 'system',
            sender: user,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    });

    /* ── Typing indicators ── */
    sock.on('userTyping', ({ roomId, user }) => {
      const { currentRoom, typingUsers } = get();
      if (roomId !== currentRoom) return;
      const exists = typingUsers.some((u) => u._id === user._id);
      if (!exists) {
        set({ typingUsers: [...typingUsers, user] });
      }
    });

    sock.on('userStoppedTyping', ({ roomId, user }) => {
      const { currentRoom } = get();
      if (roomId !== currentRoom) return;
      set((state) => ({
        typingUsers: state.typingUsers.filter((u) => u._id !== user._id),
      }));
    });

    /* ── Message edited ── */
    sock.on('messageEdited', ({ roomId, message: edited }) => {
      const { currentRoom } = get();
      if (roomId !== currentRoom) return;
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === edited._id ? { ...edited } : m
        ),
      }));
    });

    /* ── Message deleted ── */
    sock.on('messageDeleted', ({ roomId, messageId }) => {
      const { currentRoom } = get();
      if (roomId !== currentRoom) return;
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    });

    /* ── Room access denied (subscription required) ── */
    sock.on('roomAccessDenied', ({ roomId, message }) => {
      toast.error(message || 'Subscription required to access this room');
      // Reset loading state if we were trying to join
      const { currentRoom } = get();
      if (roomId === currentRoom) {
        set({ currentRoom: null, isLoading: false });
      }
    });

    /* ── Role updated (VIP promotion/demotion pushed from server) ── */
    sock.on('roleUpdated', ({ role }) => {
      // Sync the auth store so the whole app reflects the new role
      useAuthStore.getState().setUserRole(role);

      // Update the rooms' locked state based on the new role
      const isSubscribed = role === 'vip' || role === 'admin';
      set((state) => ({
        rooms: state.rooms.map((room) => ({
          ...room,
          locked: room.requiresSubscription && !isSubscribed,
        })),
      }));

      if (isSubscribed) {
        toast.success('VIP access unlocked! All chat rooms are now available.');
      } else {
        toast.error('VIP access has been paused. Only General chat is available.');
        // If currently in a restricted room, leave it
        const { currentRoom } = get();
        if (currentRoom && currentRoom !== 'general') {
          set({ currentRoom: null, messages: [], isLoading: false });
        }
      }
    });

    } // end if (!listenersAttached)

    sock.connect();
  },

  disconnect: () => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
      listenersAttached = false;
    }
    set({ isConnected: false, onlineUsers: [], typingUsers: [], messages: [], currentRoom: null });
  },

  /* ── Room management ── */
  setCurrentRoom: (roomId) => {
    const { currentRoom } = get();

    // Leave previous room
    if (currentRoom && socket) {
      socket.emit('leaveRoom', currentRoom);
    }

    set({ currentRoom: roomId, messages: [], isLoading: true, onlineUsers: [], typingUsers: [] });

    // Join new room
    if (roomId && socket?.connected) {
      socket.emit('joinRoom', roomId);
    }
  },

  /* ── Send message ── */
  sendMessage: (roomId, message, { messageType, attachments } = {}) => {
    if (!socket?.connected) {
      throw new Error('Not connected to chat server');
    }
    socket.emit('sendMessage', {
      roomId,
      message,
      messageType: messageType || 'text',
      attachments: attachments || [],
    });
  },

  /* ── Typing indicators ── */
  emitTyping: (roomId) => {
    if (socket?.connected) {
      socket.emit('typing', roomId);
    }
  },

  emitStopTyping: (roomId) => {
    if (socket?.connected) {
      socket.emit('stopTyping', roomId);
    }
  },

  /* ── Edit message (via socket for real-time) ── */
  editMessage: (messageId, newText) => {
    if (!socket?.connected) {
      throw new Error('Not connected to chat server');
    }
    socket.emit('editMessage', { messageId, newText });
  },

  /* ── Delete message (via socket for real-time) ── */
  deleteMessage: (messageId) => {
    if (!socket?.connected) {
      throw new Error('Not connected to chat server');
    }
    socket.emit('deleteMessage', { messageId });
  },

  /* ── Cleanup ── */
  clearMessages: () => {
    set({ messages: [], currentRoom: null, onlineUsers: [], typingUsers: [] });
  },
}));
