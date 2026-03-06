/**
 * ===========================================
 * Chat Page (Real-Time)
 * ===========================================
 *
 * Real-time chat page for investors.
 * Connects to Socket.IO on mount, auto-joins
 * the room from the URL or defaults to 'general'.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import SEO from '../components/ui/SEO';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

function Chat() {
  const params = useParams();
  const roomId = params['*'] || params.roomId || null;
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { currentRoom, setCurrentRoom, connect, disconnect, isConnected } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Connect socket on mount
  useEffect(() => {
    if (token) {
      connect(token);
    }
    return () => {
      // Don't disconnect on unmount so quick navigations don't drop the socket.
      // The store handles reconnects. disconnect() is called on logout from authStore.
    };
  }, [token, connect]);

  // Sync URL → currentRoom (URL is the source of truth)
  useEffect(() => {
    // Redirect bare /chat to /chat/general
    if (!roomId) {
      navigate('/chat/general', { replace: true });
      return;
    }

    // Restrict unsubscribed users to general room only
    const isSubscribed = user?.role === 'vip' || user?.role === 'admin';
    if (!isSubscribed && roomId !== 'general') {
      navigate('/chat/general', { replace: true });
      return;
    }

    if (roomId !== currentRoom) {
      setCurrentRoom(roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return (
    <div className="container-custom py-2 sm:py-4 md:py-6">
      <SEO
        title="Investor Chat"
        description="Connect with fellow CineVest investors in real-time."
        noIndex
      />

      <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-100px)] bg-card rounded-none md:rounded-xl overflow-hidden border-x-0 md:border border-border shadow-none md:shadow-sm">
        {/* Sidebar - Chat Rooms */}
        <div className="hidden xs:block">
          <ChatSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentRoom ? (
            <>
              <ChatWindow roomId={currentRoom} />
              <ChatInput roomId={currentRoom} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary-500" />
                </div>
                <p className="text-lg font-medium text-foreground mb-1">Investor Chat</p>
                <p className="text-sm">Select a room to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
