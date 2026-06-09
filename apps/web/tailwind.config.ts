import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-light": "var(--color-primary-light)",
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
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
