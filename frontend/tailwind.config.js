/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0D12",
        panel: "#10151C",
        panel2: "#141B24",
        line: "#212A35",
        primary: "#E7ECF2",
        muted: "#7C8A9A",
        amber: "#E8A33D",
        on: "#3FB98A",
        off: "#E5484D",
        cyan: "#4FB3BF",
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
};
