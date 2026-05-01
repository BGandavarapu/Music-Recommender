import { useEffect, useRef } from "react";
import type { Message } from "../../types/chat";
import ChatMessage from "./ChatMessage";

interface Props {
  messages: Message[];
  onSuggestion?: (text: string) => void;
}

const SUGGESTIONS = [
  "Create a rainy day indie set",
  "Something for a late-night drive",
  "Based on my liked songs, build me a chill mix",
  "Match my mood: focused, no lyrics",
];

export default function ChatWindow({ messages, onSuggestion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-10 p-6 text-center">
        <div className="max-w-xl">
          <div className="text-[11px] tracking-[0.2em] uppercase text-sp-green font-semibold mb-4">
            Ready when you are
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-sp-text tracking-tight leading-tight">
            What do you want to hear?
          </h2>
          <p className="mt-4 text-sm text-sp-text-subdued leading-relaxed">
            Describe a mood, a moment, or a sound. Reference your library if you want it personal.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion?.(s)}
              className="px-4 py-2 rounded-full text-xs font-medium text-sp-text-subdued bg-sp-elevated border border-sp-border hover:border-sp-green hover:text-sp-text transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="mx-auto max-w-3xl px-6 py-8 flex flex-col gap-6">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
