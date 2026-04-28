import { motion } from "framer-motion";
import type { Message, ToolStatus } from "../../types/chat";
import TrackListCard from "./TrackListCard";
import EqualizerBars from "../landing/EqualizerBars";

const TOOL_LABELS: Record<string, string> = {
  search_catalog: "Searching Spotify",
  get_recommendations: "Curating recommendations",
  show_tracks: "Building your mix",
  get_user_playlists: "Loading your playlists",
  analyze_playlist: "Analyzing playlist profile",
  get_playlist_tracks: "Reading playlist songs",
  get_current_playback: "Checking playback",
  get_weather: "Reading the weather",
  get_liked_songs: "Loading liked songs",
  get_top_items: "Reading your taste",
  get_recently_played: "Reading recent plays",
};

interface Props {
  message: Message;
}

function StatusDot({ status }: { status: ToolStatus["status"] }) {
  if (status === "running") {
    return <span className="w-1.5 h-1.5 rounded-full bg-sp-green animate-pulse shrink-0" />;
  }
  if (status === "error") {
    return <span className="w-1.5 h-1.5 rounded-full bg-sp-red shrink-0" />;
  }
  return <span className="w-1.5 h-1.5 rounded-full bg-sp-green/60 shrink-0" />;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const showThinking =
    !isUser && message.streaming && !message.text && (message.toolStatuses ?? []).length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] flex flex-col ${isUser ? "items-end" : "items-start"} gap-2`}
      >
        {/* Thinking indicator */}
        {showThinking && (
          <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-md bg-sp-surface border border-sp-border/60">
            <EqualizerBars size="xs" />
            <span className="text-xs text-sp-text-subdued">Thinking…</span>
          </div>
        )}

        {/* Tool status chips */}
        {!isUser && (message.toolStatuses ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolStatuses!.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sp-surface border border-sp-border/60 text-[11px] font-medium text-sp-text-subdued"
                title={s.message}
              >
                <StatusDot status={s.status} />
                {TOOL_LABELS[s.tool] ?? s.tool}
              </span>
            ))}
          </div>
        )}

        {/* Message bubble — only render if there's actual text */}
        {(message.text || (message.streaming && !showThinking)) && (
          <div
            className={`px-4 py-3 rounded-xl text-[14px] leading-relaxed whitespace-pre-wrap ${
              isUser
                ? "bg-sp-green text-black font-medium"
                : "bg-sp-elevated text-sp-text border border-sp-border/60"
            }`}
          >
            {message.text}
            {message.streaming && message.text && (
              <span className="inline-block w-1.5 h-3.5 bg-sp-text-subdued ml-1 align-middle animate-pulse rounded-[1px]" />
            )}
          </div>
        )}

        {/* Track list card */}
        {message.trackList && <TrackListCard trackList={message.trackList} />}
      </div>
    </motion.div>
  );
}
