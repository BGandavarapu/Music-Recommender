import { useEffect } from "react";
import { getMe } from "./services/api";
import { useSplash } from "./hooks/useSplash";
import { useAuth } from "./hooks/useAuth";
import { useChat } from "./hooks/useChat";
import Splash from "./components/Splash";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./components/landing/LandingPage";
import AppShell from "./components/layout/AppShell";
import ConnectSpotify from "./components/auth/ConnectSpotify";
import ChatWindow from "./components/chat/ChatWindow";
import MessageInput from "./components/chat/MessageInput";

function CallbackHandler({ onDone }: { onDone: () => void }) {
  const { setUser } = useAuth();
  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      window.history.replaceState({}, "", "/app");
      onDone();
    });
  }, [onDone, setUser]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-sp-black text-sp-text-subdued text-sm">
      Finishing connection…
    </div>
  );
}

export default function App() {
  const showSplash = useSplash();
  const { user, loading, setUser } = useAuth();
  const { messages, loading: chatLoading, sendMessage, stopMessage, clearChat } = useChat();

  useEffect(() => {
    const handleAuthExpired = () => setUser(null);
    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [setUser]);

  if (showSplash) return <Splash />;
  if (loading) return <div className="min-h-screen bg-sp-bg" />;

  const path = window.location.pathname;

  if (path === "/callback") {
    return <CallbackHandler onDone={() => window.location.replace("/app")} />;
  }

  // Landing page at root — but if the user is already signed in, send them
  // straight to /app so they don't see "Connect Spotify" again.
  if (path === "/" || path === "") {
    if (user) {
      window.history.replaceState({}, "", "/app");
      // fall through to the app render below
    } else {
      return <LandingPage />;
    }
  }

  // /app and any other path → the chat experience
  const handleLogout = () => {
    setUser(null);
    window.history.replaceState({}, "", "/");
    window.location.replace("/");
  };

  // Not signed in: show the standalone connect card on a clean dark page
  // (no SideNav with useless "Log out" / "New chat" buttons).
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-sp-bg">
        <ConnectSpotify />
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-sp-bg flex items-center justify-center text-sp-red font-medium">
          Something went wrong. Please refresh.
        </div>
      }
    >
      <AppShell
        user={user}
        messages={messages}
        onClearChat={clearChat}
        onLogout={handleLogout}
      >
        <ChatWindow messages={messages} onSuggestion={sendMessage} />
        <MessageInput onSend={sendMessage} onStop={stopMessage} disabled={chatLoading} />
      </AppShell>
    </ErrorBoundary>
  );
}
