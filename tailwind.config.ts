import type { Config } from "tailwindcss";

import defaultColors from "tailwindcss/colors";

/*
 * LogiPulse palette: fresh green brand + warm orange accent.
 * Components use Tailwind colour scales directly, so the theme is applied by redefining scales:
 *   slate          -> neutral grey with a faint green tint (deep green-black in dark mode)
 *   blue, violet   -> brand green (primary actions, pickup)
 *   teal, pink,
 *   fuchsia        -> orange (accent, drop-off)
 *   indigo         -> sea green, purple -> lime, sky -> yellow (keeps status colours distinct)
 */
const ink = {
  50: "#F5F8F6",
  100: "#ECF1EE",
  200: "#DDE5E0",
  300: "#C2CDC6",
  400: "#93A199",
  500: "#68766E",
  600: "#4D5952",
  700: "#38423C",
  800: "#222A25",
  900: "#141A16",
  950: "#0A0F0C",
};

const green = {
  50: "#ECFDF3",
  100: "#D1FADF",
  200: "#A6F4C5",
  300: "#6CE9A6",
  400: "#32D583",
  500: "#12B76A",
  600: "#039855",
  700: "#027A48",
  800: "#05603A",
  900: "#054F31",
  950: "#022C1B",
};

const orange = defaultColors.orange;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        slate: ink,
        blue: green,
        violet: green,
        teal: orange,
        pink: orange,
        fuchsia: orange,
        indigo: defaultColors.teal,
        purple: defaultColors.lime,
        sky: defaultColors.yellow,
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#039855",
          foreground: "#ffffff",
          50: "#ECFDF3",
          100: "#D1FADF",
          200: "#A6F4C5",
          500: "#039855",
          600: "#027A48",
          700: "#05603A",
        },
        secondary: {
          DEFAULT: "#12B76A",
          foreground: "#ffffff",
          50: "#ECFDF3",
          100: "#D1FADF",
          500: "#12B76A",
          600: "#039855",
        },
        accent: {
          DEFAULT: "#F97316",
          foreground: "#ffffff",
          50: "#FFF7ED",
          100: "#FFEDD5",
          500: "#F97316",
          600: "#EA580C",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#ffffff",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        success: {
          DEFAULT: "#16A34A",
          foreground: "#ffffff",
          50: "#f0fdf4",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#ffffff",
          50: "#fffbeb",
        },
        brand: {
          dark: "#022C1B",
          green: "#039855",
          bright: "#12B76A",
          orange: "#F97316",
          surface: "#F5F8F6",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(10 40 25 / 0.05), 0 1px 3px 0 rgb(10 40 25 / 0.04)",
        DEFAULT: "0 2px 6px -1px rgb(10 40 25 / 0.07), 0 1px 3px -1px rgb(10 40 25 / 0.05)",
        md: "0 6px 16px -4px rgb(10 40 25 / 0.10), 0 2px 6px -2px rgb(10 40 25 / 0.06)",
        lg: "0 14px 32px -8px rgb(10 40 25 / 0.14), 0 4px 10px -4px rgb(10 40 25 / 0.06)",
        xl: "0 24px 48px -12px rgb(10 40 25 / 0.20)",
        glow: "0 10px 28px -6px rgb(3 152 85 / 0.45)",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "gradient-pan": "gradient-pan 8s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
