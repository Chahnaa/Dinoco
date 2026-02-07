/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f1a",
        slate: "#0f172a",
        glow: "#ef4444",
        neon: "#8b5cf6"
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 30px rgba(127, 29, 29, 0.55)",
        soft: "0 20px 60px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};
