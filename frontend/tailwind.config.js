/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F8F5F0",
        cream: "#F1EBE2",
        ink: "#171614",
        brown: "#79614E",
        beige: "#D8C9B8",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: { widest2: "0.28em" },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "none" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: { fadeUp: "fadeUp .7s ease both", fadeIn: "fadeIn .4s ease both" },
    },
  },
  plugins: [],
};
