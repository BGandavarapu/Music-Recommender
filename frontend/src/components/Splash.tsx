import { motion } from "framer-motion";
import EqualizerBars from "./landing/EqualizerBars";

export default function Splash() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-sp-black"
      aria-hidden
    >
      <div className="absolute inset-0 bg-radial-glow opacity-60 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex items-center gap-3"
      >
        <EqualizerBars size="lg" />
        <span className="font-display font-bold text-sp-text text-2xl tracking-tight">
          Music Recommender
        </span>
      </motion.div>
    </motion.div>
  );
}
