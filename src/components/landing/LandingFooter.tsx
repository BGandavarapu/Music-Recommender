import EqualizerBars from "./EqualizerBars";

export default function LandingFooter() {
  return (
    <footer className="border-t border-sp-border bg-sp-bg">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <EqualizerBars size="sm" />
          <span className="font-display font-bold text-sp-text tracking-tight">Music Recommender</span>
        </div>
        <div className="text-xs text-sp-text-mute">
          Built with the Spotify Web API. Not affiliated with Spotify AB.
        </div>
      </div>
    </footer>
  );
}
