import { useState } from "react";
import { motion } from "framer-motion";

interface LandingProps {
  onStartGame: () => void;
}

export default function Landing({ onStartGame }: LandingProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen flex flex-col font-red-hat"
    >
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Frame border */}
      <div className="frame-border" />
      <div className="frame-corner-bl" />
      <div className="frame-corner-br" />

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-between px-8 pt-32 pb-16 md:px-16 lg:px-24 lg:pt-40 lg:pb-24">
        {/* Hero */}
        <div className="flex flex-col gap-4 max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hero-label"
          >
            DIG THE DATA 5.0 — Organized by NITER
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="heading-display text-5xl md:text-7xl lg:text-8xl max-w-2xl"
          >
            THE HIDDEN <br />
            <span className="opacity-60">LETTERS</span>
          </motion.h1>
        </div>

        {/* Bottom section: description + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col gap-6 mt-16 max-w-xl"
        >
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-sm">
            Five puzzles. Five letters. One final word.
          </p>
          <div>
            <button
              className="btn-cta"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onClick={onStartGame}
              style={{
                background: hovered
                  ? "rgba(255,255,255,0.06)"
                  : "transparent",
              }}
            >
              <span className="relative z-10">START GAME</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer note */}
      <div className="px-8 pb-8 md:px-16 lg:px-24">
        <p className="text-xs text-muted-foreground/40 font-red-hat">
          NITER — DIG THE DATA 5.0
        </p>
      </div>
    </motion.div>
  );
}
