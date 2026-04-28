import { useMemo } from "react";
import EqualizerBars from "../landing/EqualizerBars";
import type { SpotifyUser } from "../../types/user";
import type { Message } from "../../types/chat";
import { logout } from "../../services/api";

interface Props {
  user: SpotifyUser | null;
  messages: Message[];
  onClearChat: () => void;
  onLogout: () => void;
}

function summarizeChat(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  const text = firstUser.text.trim();
  if (text.length <= 36) return text;
  return text.slice(0, 36).trimEnd() + "…";
}

export default function SideNav({ user, messages, onClearChat, onLogout }: Props) {
  const hasChat = messages.length > 0;
  const title = useMemo(() => summarizeChat(messages), [messages]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    onLogout();
  };

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-sp-black border-r border-sp-border h-screen sticky top-0">
      {/* Wordmark */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sp-border/60">
        <EqualizerBars size="sm" />
        <span className="font-display font-bold text-sp-text tracking-tight text-[15px]">
          Music Recommender
        </span>
      </div>

      {/* New chat */}
      <div className="px-3 py-4 border-b border-sp-border/60">
        <button
          onClick={onClearChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sp-text bg-sp-elevated hover:bg-sp-elevated-hover border border-sp-border transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M7 2v10M2 7h10" />
          </svg>
          New chat
        </button>
      </div>

      {/* Recent chats */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        <div className="text-[10px] tracking-[0.2em] uppercase text-sp-text-mute font-semibold px-2 mb-2">
          Today
        </div>
        {hasChat ? (
          <div className="space-y-0.5">
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm text-sp-text bg-sp-elevated hover:bg-sp-elevated-hover border border-sp-border/40 truncate"
              title={title}
            >
              {title}
            </button>
          </div>
        ) : (
          <div className="px-3 py-2 text-xs text-sp-text-mute leading-relaxed">
            Start a conversation to see it here.
          </div>
        )}
      </div>

      {/* Profile + logout */}
      <div className="border-t border-sp-border/60 p-3">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover ring-1 ring-sp-border"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-sp-elevated border border-sp-border flex items-center justify-center text-sp-text-subdued font-semibold text-sm">
                {user.display_name?.[0]?.toUpperCase() ?? "·"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-sp-text truncate">{user.display_name}</div>
              <div className="text-[11px] text-sp-text-mute flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sp-green" />
                Spotify connected
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-sp-red hover:bg-sp-red/10 transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
