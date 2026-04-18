import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:  "#2D9DA0", // teal — buttons, active states, accents
          hover:    "#278e91", // slightly darker teal for hover
          secondary:"#00484A", // dark teal — hover, depth
          tertiary: "#0F2833", // navy — header, sidebar
          neutral:  "#737878", // warm gray — muted text, borders
          surface:  "#f0f9f9", // whisper teal — light body bg
          "dark-bg":"#081d26", // deep navy — dark mode body
        },
      },
    },
  },
  plugins: [],
};

export default config;
