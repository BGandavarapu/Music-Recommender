module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        sp: {
          green: "#1DB954",
          "green-bright": "#1ED760",
          black: "#000000",
          bg: "#121212",
          elevated: "#181818",
          "elevated-hover": "#1F1F1F",
          surface: "#1A1A1A",
          border: "#2A2A2A",
          text: "#FFFFFF",
          "text-subdued": "#B3B3B3",
          "text-mute": "#6A6A6A",
          red: "#E91429",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "eq-bar": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.65" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "eq-1": "eq-bar 1.1s ease-in-out infinite",
        "eq-2": "eq-bar 0.9s ease-in-out infinite 0.15s",
        "eq-3": "eq-bar 1.3s ease-in-out infinite 0.3s",
        "eq-4": "eq-bar 1.0s ease-in-out infinite 0.45s",
        "glow-pulse": "glow-pulse 6s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out",
      },
    },
  },
  plugins: [],
};
