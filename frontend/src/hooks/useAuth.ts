import { useEffect, useState } from "react";
import { getMe } from "../services/api";
import type { SpotifyUser } from "../types/user";

export function useAuth() {
  const [user, setUser] = useState<SpotifyUser | null | undefined>(undefined);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return { user, loading: user === undefined, setUser };
}
