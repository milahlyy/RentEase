import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-light": "var(--color-primary-light)",
        "primary-soft": "var(--color-primary-soft)",
        "primary-text": "var(--color-primary-text)",
        success: "var(--color-success)",
        "success-light": "var(--color-success-light)",
        "success-text": "var(--color-success-text)",
        warning: "var(--color-warning)",
        "warning-light": "var(--color-warning-light)",
        "warning-text": "var(--color-warning-text)",
        danger: "var(--color-danger)",
        "danger-light": "var(--color-danger-light)",
        "danger-text": "var(--color-danger-text)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        "surface-sunken": "var(--color-surface-sunken)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        "soft-sm": "var(--shadow-soft-sm)",
        "soft-hover": "var(--shadow-soft-hover)",
        "inset-soft": "var(--shadow-inset)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
