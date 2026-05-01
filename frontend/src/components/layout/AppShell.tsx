import type { ReactNode } from "react";
import type { SpotifyUser } from "../../types/user";
import type { Message } from "../../types/chat";
import SideNav from "./SideNav";
import TopBar from "./TopBar";

interface Props {
  user: SpotifyUser | null;
  messages: Message[];
  onClearChat: () => void;
  onLogout: () => void;
  children: ReactNode;
}

export default function AppShell({ user, messages, onClearChat, onLogout, children }: Props) {
  return (
    <div className="flex h-screen bg-sp-bg text-sp-text">
      <SideNav user={user} messages={messages} onClearChat={onClearChat} onLogout={onLogout} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          user={user}
          messages={messages}
          onClearChat={onClearChat}
          onLogout={onLogout}
        />
        {children}
      </div>
    </div>
  );
}
