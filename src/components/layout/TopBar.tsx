import type { Message } from "../../types/chat";
import type { SpotifyUser } from "../../types/user";
import { logout } from "../../services/api";

interface Props {
  user: SpotifyUser | null;
  messages: Message[];
  onClearChat: () => void;
  onLogout: () => void;
}

function summarize(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  const t = firstUser.text.trim();
  return t.length <= 60 ? t : t.slice(0, 60).trimEnd() + "…";
}

export default function TopBar({ user, messages, onClearChat, onLogout }: Props) {
  const hasChat = messages.length > 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    onLogout();
  };

  return (
    <div className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-sp-border/60 bg-sp-bg/80 backdrop-blur-sm">
      <div className="min-w-0 flex-1 truncate">
        <span className="text-sm font-medium text-sp-text truncate">{summarize(messages)}</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <span className="hidden sm:inline-flex items-center gap-2 text-xs text-sp-text-subdued">
          <span className="w-1.5 h-1.5 rounded-full bg-sp-green animate-pulse" />
          Connected
        </span>
        {hasChat && (
          <button
            onClick={onClearChat}
            className="text-xs text-sp-text-mute hover:text-sp-text-subdued transition-colors"
          >
            Clear
          </button>
        )}
        {/* Mobile-only logout (sidebar is hidden below lg). Desktop has it in the SideNav footer. */}
        {user && (
          <button
            onClick={handleLogout}
            className="lg:hidden text-xs font-medium text-sp-red hover:text-sp-red/80 transition-colors"
          >
            Log out
          </button>
        )}
      </div>
    </div>
  );
}
