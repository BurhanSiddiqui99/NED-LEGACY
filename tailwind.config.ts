import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
          DEFAULT: "#142B49",
          foreground: "#ffffff",
          50: "#eaf0f8",
          100: "#c7d8ed",
          200: "#9fbde0",
          500: "#142B49",
          600: "#0f2138",
          700: "#0b1829",
        },
        secondary: {
          DEFAULT: "#2563EB",
          foreground: "#ffffff",
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563EB",
          600: "#1d4ed8",
        },
        accent: {
          DEFAULT: "#0D9488",
          foreground: "#ffffff",
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#0D9488",
          600: "#0f766e",
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
          navy: "#142B49",
          blue: "#2563EB",
          teal: "#0D9488",
          surface: "#F8FAFC",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
