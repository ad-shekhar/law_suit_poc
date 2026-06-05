import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary":   "#0A0F1E",
        "bg-secondary": "#111827",
        "bg-card":      "#1a2235",
        "accent-indigo": "#4F46E5",
        "accent-gold":   "#D97706",
        "accent-emerald":"#10B981",
        "accent-red":    "#EF4444",
        "accent-cyan":   "#06B6D4",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        thinking: "thinking 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
