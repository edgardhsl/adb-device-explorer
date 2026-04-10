const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--text)",
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--primary)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--on-primary)",
        },
        secondary: {
          DEFAULT: "var(--surface-alt)",
          foreground: "var(--text)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--surface-alt)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent-soft)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        warning: "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        error: "var(--error)",

        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",
        "tertiary-container": "var(--tertiary-container)",
        "inverse-primary": "var(--inverse-primary)",
        "surface": "var(--surface)",
        "surface-container-highest": "var(--surface-container-highest)",
        "inverse-surface": "var(--inverse-surface)",
        "surface-dim": "var(--surface-dim)",
        "tertiary-fixed": "var(--tertiary-fixed)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-variant": "var(--surface-variant)",
        "primary-fixed": "var(--primary-fixed)",
        "primary-container": "var(--primary-container)",
        "primary-fixed-dim": "var(--primary-fixed-dim)",
        "surface-bright": "var(--surface-bright)",
        "tertiary": "var(--tertiary)",
        "outline-variant": "var(--outline-variant)",
        "outline": "var(--outline)",
        "secondary-fixed": "var(--secondary-fixed)",
        "surface-tint": "var(--surface-tint)",
        "on-primary": "var(--on-primary)",
        "on-secondary": "var(--on-secondary)",
        "on-tertiary": "var(--on-tertiary)",
        "on-error": "var(--on-error)",
        "on-background": "var(--on-background)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "secondary-container": "var(--secondary-container)",
        "error-container": "var(--error-container)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        headline: ["var(--font-headline)", ...fontFamily.sans],
        body: ["var(--font-body)", ...fontFamily.sans],
        label: ["var(--font-body)", ...fontFamily.sans],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
        sans: ["var(--font-body)", ...fontFamily.sans],
      },
      boxShadow: {
        card: "0px 12px 32px rgba(44, 52, 55, 0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
