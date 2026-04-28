import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, TrackList, ToolStatus } from "../types/chat";

let idCounter = 0;
const uid = () => String(++idCounter);

// Bumped when the Message shape changes (e.g. playlist → trackList in v2).
const STORAGE_KEY = "mr_chat_v2";

function loadMessages(): Message[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [loading, setLoading] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const geoRef = useRef<{ lat: number; lon: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore conversation history from saved messages on mount
  useEffect(() => {
    const saved = loadMessages();
    if (saved.length > 0) {
      historyRef.current = saved
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.text }));
    }
  }, []);

  // Persist messages to localStorage on every update (strip streaming state)
  useEffect(() => {
    const toSave = messages.map((m) => ({ ...m, streaming: false }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [messages]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          geoRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        },
        () => { /* denied — weather requests fall back to stated mood */ }
      );
    }
  }, []);

  const updateLast = (updater: (m: Message) => Message) => {
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = updater(next[next.length - 1]);
      return next;
    });
  };

  const sendMessage = useCallback(async (text: string) => {
    if (loading) return;

    const userMsg: Message = { id: uid(), role: "user", text };
    const assistantMsg: Message = {
      id: uid(),
      role: "assistant",
      text: "",
      streaming: true,
      toolStatuses: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: text },
    ];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyRef.current.slice(0, -1),
          location: geoRef.current,
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        updateLast((m) => ({ ...m, text: "Your Spotify session expired. Please reconnect.", streaming: false }));
        setLoading(false);
        window.dispatchEvent(new CustomEvent("auth:expired"));
        return;
      }

      if (!res.ok || !res.body) {
        updateLast((m) => ({ ...m, text: "Something went wrong. Please try again.", streaming: false }));
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let event = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            event = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (event === "text_delta") {
              fullText += data.text;
              updateLast((m) => ({ ...m, text: fullText }));
            } else if (event === "tool_status") {
              const status: ToolStatus = data;
              updateLast((m) => {
                const statuses = m.toolStatuses ?? [];
                const existing = statuses.find((s) => s.tool === status.tool);
                if (existing) {
                  return { ...m, toolStatuses: statuses.map((s) => s.tool === status.tool ? status : s) };
                }
                return { ...m, toolStatuses: [...statuses, status] };
              });
            } else if (event === "tracks_ready") {
              const tl: TrackList = data;
              updateLast((m) => ({ ...m, trackList: tl }));
            } else if (event === "done") {
              updateLast((m) => ({ ...m, streaming: false }));
            } else if (event === "error") {
              const errText = data.text || "Something went wrong. Please try again.";
              updateLast((m) => ({ ...m, text: errText, streaming: false }));
            }
          }
        }
      }

      historyRef.current = [...historyRef.current, { role: "assistant", content: fullText }];
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        updateLast((m) => ({ ...m, streaming: false }));
      } else {
        updateLast((m) => ({ ...m, text: "Connection error. Check that the server is running.", streaming: false }));
      }
    }

    setLoading(false);
  }, [loading]);

  const stopMessage = useCallback(() => {
    abortRef.current?.abort();
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant" && last.streaming) {
        next[next.length - 1] = { ...last, streaming: false };
      }
      return next;
    });
    setLoading(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, loading, sendMessage, stopMessage, clearChat };
}
