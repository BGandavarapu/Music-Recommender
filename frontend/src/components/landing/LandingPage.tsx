import EqualizerBars from "./EqualizerBars";
import Hero from "./Hero";
import FeatureGrid from "./FeatureGrid";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-sp-bg text-sp-text">
      {/* Top nav */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-sp-bg/70 border-b border-sp-border/50">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <EqualizerBars size="sm" className="group-hover:scale-110 transition-transform" />
            <span className="font-display font-bold text-sp-text tracking-tight text-[15px]">
              Music Recommender
            </span>
          </a>
          <nav className="flex items-center gap-6">
            <a
              href="#how-it-works"
              className="hidden sm:inline text-sm text-sp-text-subdued hover:text-sp-text transition-colors"
            >
              How it works
            </a>
            <a
              href="/api/auth/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sp-green text-black text-sm font-semibold hover:bg-sp-green-bright transition-colors"
            >
              Connect Spotify
            </a>
          </nav>
        </div>
      </header>

      <main>
        <Hero />
        <FeatureGrid />
      </main>

      <LandingFooter />
    </div>
  );
}
