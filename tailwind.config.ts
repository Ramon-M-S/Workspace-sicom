import type { Config } from "tailwindcss";

const colorToken = (name: string) =>
  `oklch(from var(${name}) l c h / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: colorToken("--background"),
        foreground: colorToken("--foreground"),
        card: {
          DEFAULT: colorToken("--card"),
          foreground: colorToken("--card-foreground"),
        },
        popover: {
          DEFAULT: colorToken("--popover"),
          foreground: colorToken("--popover-foreground"),
        },
        primary: {
          DEFAULT: colorToken("--primary"),
          foreground: colorToken("--primary-foreground"),
        },
        secondary: {
          DEFAULT: colorToken("--secondary"),
          foreground: colorToken("--secondary-foreground"),
        },
        muted: {
          DEFAULT: colorToken("--muted"),
          foreground: colorToken("--muted-foreground"),
        },
        accent: {
          DEFAULT: colorToken("--accent"),
          foreground: colorToken("--accent-foreground"),
        },
        destructive: {
          DEFAULT: colorToken("--destructive"),
          foreground: colorToken("--destructive-foreground"),
        },
        border: colorToken("--border"),
        input: colorToken("--input"),
        ring: colorToken("--ring"),
      },
    },
  },
  plugins: [],
};
export default config;
