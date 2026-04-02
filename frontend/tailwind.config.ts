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
        "jd-green": {
          DEFAULT: "#367C2B",
          dark: "#2A5F22",
          light: "#4A9A3A",
          50: "#f0f9ee",
          100: "#daf0d5",
          200: "#b7e2ad",
          300: "#88cc79",
          400: "#5fb44e",
          500: "#4A9A3A",
          600: "#367C2B",
          700: "#2A5F22",
          800: "#1f4a19",
          900: "#193d15",
        },
        "jd-yellow": {
          DEFAULT: "#FFDE00",
          50: "#fffce5",
          100: "#fff8b3",
          200: "#fff180",
          300: "#FFE94D",
          400: "#FFDE00",
          500: "#e6c800",
          600: "#b39c00",
          700: "#807000",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
