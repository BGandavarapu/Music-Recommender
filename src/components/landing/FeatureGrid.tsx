import { motion } from "framer-motion";

interface Feature {
  num: string;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    num: "01",
    title: "Built on your taste.",
    body: "Pulls from your Liked Songs, top artists, and recent listening to recommend tracks that actually sound like you.",
  },
  {
    num: "02",
    title: "Mood aware.",
    body: "Say you want something rainy, energetic, or for a 2 a.m. drive — the assistant translates the vibe into audio that matches.",
  },
  {
    num: "03",
    title: "Weather sensitive.",
    body: "Optionally shares your location to soundtrack the day in real time. Sunny tracks when it's sunny, low-tempo when it's gloomy.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="how-it-works" className="border-t border-sp-border bg-sp-bg">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div className="mb-14 max-w-2xl">
          <div className="text-[11px] tracking-[0.2em] uppercase text-sp-green font-semibold mb-3">
            How it works
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-sp-text leading-tight tracking-tight">
            Three signals.
            <br />
            <span className="text-sp-text-subdued">One conversation.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-sp-border rounded-lg overflow-hidden">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className="bg-sp-elevated p-8 lg:p-10 group hover:bg-sp-elevated-hover transition-colors"
            >
              <div className="flex items-start justify-between mb-12">
                <div className="font-display font-bold text-sp-text-mute text-2xl tracking-tight">
                  {f.num}
                </div>
                <span className="block w-12 h-px bg-sp-border group-hover:bg-sp-green transition-colors" />
              </div>
              <h3 className="font-display text-xl lg:text-2xl font-semibold text-sp-text mb-3 tracking-tight">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-sp-text-subdued">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
