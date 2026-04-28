import { motion } from "framer-motion";
import { useSpotifyAuth } from "../../hooks/useSpotifyAuth";
import EqualizerBars from "../landing/EqualizerBars";

export default function ConnectSpotify() {
  const { connect } = useSpotifyAuth();
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md rounded-xl border border-sp-border bg-sp-elevated p-8"
      >
        <div className="flex items-center gap-2.5 mb-6">
          <EqualizerBars size="sm" />
          <span className="font-display font-bold text-sp-text tracking-tight text-[15px]">
            Music Recommender
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-sp-text tracking-tight leading-tight">
          Connect your Spotify
          <br />
          <span className="text-sp-text-subdued">to get started.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-sp-text-subdued">
          Music Recommender reads your taste, mood, and weather to recommend tracks. We never modify your
          library — only read what you've already saved.
        </p>
        <button
          onClick={connect}
          className="mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-sp-green text-black font-semibold text-sm hover:bg-sp-green-bright transition-colors"
        >
          Connect Spotify
        </button>
        <ul className="mt-6 space-y-2 text-xs text-sp-text-mute">
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sp-text-mute" />
            Free, no account creation required
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sp-text-mute" />
            Read-only access — we cannot modify your library
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sp-text-mute" />
            Disconnect anytime from your Spotify settings
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
