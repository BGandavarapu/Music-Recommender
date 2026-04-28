import { useEffect, useState } from "react";
import { SPLASH_DURATION_MS } from "../constants/animations";

export function useSplash(): boolean {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);
  return showSplash;
}
