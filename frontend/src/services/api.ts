import type { SpotifyUser } from "../types/user";

export async function getMe(): Promise<SpotifyUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`/api/auth/me failed: ${res.status}`);
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function getPlaylists() {
  const res = await fetch("/api/playlists", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch playlists");
  return res.json();
}
