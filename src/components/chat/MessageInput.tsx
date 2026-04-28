import { KeyboardEvent, useRef, useState } from "react";
import { FaArrowUp, FaStop } from "react-icons/fa";

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onStop, disabled }: Props) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    ref.current?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-sp-border/60 bg-sp-bg">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <div className="group flex items-end gap-2 px-4 py-3 rounded-xl bg-sp-elevated border border-sp-border focus-within:border-sp-green/70 transition-colors">
          <textarea
            ref={ref}
            className="flex-1 resize-none bg-transparent border-0 focus:outline-none text-[14px] leading-relaxed text-sp-text placeholder:text-sp-text-mute max-h-40 py-1"
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Describe a mood, a moment, a vibe…"
            disabled={disabled}
            aria-label="Message input"
          />
          {disabled ? (
            <button
              onClick={onStop}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-sp-red text-white hover:brightness-110 transition-all"
              aria-label="Stop generating"
              title="Stop"
            >
              <FaStop className="text-[11px]" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-sp-green text-black hover:bg-sp-green-bright disabled:opacity-30 disabled:hover:bg-sp-green transition-all"
              aria-label="Send"
              title="Send"
            >
              <FaArrowUp className="text-[13px]" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[10px] tracking-wide uppercase text-sp-text-mute">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
