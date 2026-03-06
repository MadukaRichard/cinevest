/**
 * ===========================================
 * Chat Sidebar Component (Real-Time)
 * ===========================================
 *
 * Displays list of available chat rooms with
 * search, active highlight, and collapse toggle.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Hash, MessageCircle, Crown, Megaphone, Clapperboard, Coins, Lock } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

/* ── Icon map for rooms ── */
const ROOM_ICONS = {
  general: MessageCircle,
  vip: Crown,
  announcements: Megaphone,
  film: Clapperboard,
  crypto: Coins,
};

function ChatSidebar({ isOpen, onToggle }) {
  const { rooms, currentRoom, isConnected } = useChatStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const isSubscribed = user?.role === 'vip' || user?.role === 'admin';

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoomSelect = (roomId) => {
    if (roomId === currentRoom) return;

    // Block unsubscribed users from accessing non-general rooms
    const room = rooms.find((r) => r.id === roomId);
    if (room?.requiresSubscription && !isSubscribed) {
      return; // locked — do nothing
    }

    navigate(`/chat/${roomId}`);
  };

  return (
    <div
      className={`
        bg-card border-r border-border transition-all duration-300
        ${isOpen ? 'w-72' : 'w-0 lg:w-16'}
        overflow-hidden flex flex-col flex-shrink-0
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
        {isOpen && (
          <div>
            <h2 className="font-semibold text-foreground text-sm">Rooms</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-accent rounded-lg hidden lg:block text-muted-foreground transition-colors"
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Search */}
      {isOpen && (
        <div className="p-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search rooms…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto scrollbar-custom py-1">
        {filteredRooms.map((room) => {
          const isActive = currentRoom === room.id;
          const isLocked = room.requiresSubscription && !isSubscribed;
          return (
            <button
              key={room.id}
              onClick={() => handleRoomSelect(room.id)}
              title={isLocked ? 'Subscription required' : (!isOpen ? room.name : undefined)}
              className={`
                w-full px-3 py-2.5 flex items-center gap-3 transition-colors
                ${isLocked
                  ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                  : isActive
                    ? 'bg-primary-500/10 border-l-2 border-primary-500 text-foreground'
                    : 'border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-accent'
                }
                ${!isLocked && !isActive ? 'border-l-2' : ''}
              `}
            >
              {/* Icon */}
              {(() => {
                const IconComponent = ROOM_ICONS[room.icon] || Hash;
                return (
                  <div
                    className={`
                      w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                      ${isActive ? 'bg-primary-500/20 text-primary-500' : 'bg-muted text-muted-foreground'}
                    `}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                );
              })()}

              {/* Name & description */}
              {isOpen && (
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {room.name}
                    </p>
                    {isLocked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                  </div>
                  {room.description && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {isLocked ? 'Invest $20k+ to unlock' : room.description}
                    </p>
                  )}
                </div>
              )}

              {/* Lock icon for collapsed state */}
              {!isOpen && isLocked && (
                <Lock className="w-3 h-3 text-muted-foreground absolute bottom-1 right-1" />
              )}
            </button>
          );
        })}

        {filteredRooms.length === 0 && isOpen && (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground">No rooms found</p>
          </div>
        )}
      </div>

      {/* VIP threshold hint for non-subscribed users */}
      {isOpen && !isSubscribed && (
        <div className="px-3 py-3 border-t border-border flex-shrink-0">
          <div className="bg-primary-500/5 border border-primary-500/20 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="w-3.5 h-3.5 text-primary-500" />
              <p className="text-xs font-semibold text-foreground">Unlock VIP Access</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Invest $20,000+ to unlock all chat rooms and exclusive VIP features.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatSidebar;
