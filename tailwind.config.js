/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./lib/**/*.{js,jsx,ts,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bone: "#efe5d0",
        newsprint: "#d9cdb5",
        ink: "#120f0d",
        tar: "#080706",
        rust: "#bf3e24",
        cactus: "#5a7a4d",
        radio: "#f2b84b",
        arcade: "#2bd6c4",
        bruise: "#4b2d73"
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Haettenschweiler", "Arial Narrow", "sans-serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        flyer: "7px 7px 0 #120f0d",
        glow: "0 0 24px rgba(43, 214, 196, 0.22)"
      },
      backgroundImage: {
        halftone: "radial-gradient(circle at 1px 1px, rgba(239,229,208,.16) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};
