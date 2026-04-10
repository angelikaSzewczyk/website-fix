import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  corePlugins: {
    preflight: false, // keep existing inline styles intact
  },
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060912",
          900: "#070A12",
          850: "#0A0E1A",
          800: "#0D1117",
          700: "#111827",
          600: "#1C2333",
        },
      },
      fontFamily: {
        mono: ["'SF Mono'", "'Fira Code'", "'Cascadia Code'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
