import { motion } from "framer-motion";
import EqualizerBars from "./EqualizerBars";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient radial glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-radial-glow animate-glow-pulse" />
      {/* Subtle grid lines for texture */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 lg:pt-32 lg:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-sp-border bg-sp-elevated/60 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-sp-green animate-pulse" />
                <span className="text-[11px] tracking-[0.2em] uppercase text-sp-text-subdued font-medium">
                  Powered by Spotify
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: "easeOut" }}
              className="font-display font-bold text-balance leading-[1.02] tracking-tight text-sp-text text-5xl sm:text-6xl lg:text-7xl xl:text-8xl"
            >
              Your music,
              <br />
              <span className="text-sp-green">intelligently</span> curated.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="mt-7 max-w-xl text-base sm:text-lg leading-relaxed text-sp-text-subdued"
            >
              An assistant that reads your taste, your mood, even your weather — and pulls Spotify
              tracks that fit. Just say what you're feeling.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <a
                href="/api/auth/login"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-sp-green text-black font-semibold text-[15px] hover:bg-sp-green-bright hover:scale-[1.02] active:scale-[0.99] transition-all"
              >
                Connect Spotify
                <span aria-hidden="true">→</span>
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-sp-text-subdued hover:text-sp-text transition-colors"
              >
                How it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-14 flex items-center gap-6 text-xs text-sp-text-mute"
            >
              <span>No account creation</span>
              <span className="w-px h-3 bg-sp-border" />
              <span>Read-only Spotify access</span>
              <span className="w-px h-3 bg-sp-border" />
              <span>Free forever</span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-4 hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 -m-12 rounded-full bg-sp-green/10 blur-3xl" />
              <EqualizerBars size="xl" className="relative scale-150" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
