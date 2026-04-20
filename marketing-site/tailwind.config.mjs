/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
        body: ["'Inter'", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#0E1320",
        mist: "#F5F7FB",
        spark: { 50: "#fef3f0", 100: "#fde0d8", 500: "#FF6B47", 600: "#E55336" },
        deep: { 500: "#3D3FE8", 600: "#2F31C9" },
        glow: "#FFC857",
      },
      animation: {
        "spark-shimmer": "shimmer 3s linear infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.8s ease both",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
