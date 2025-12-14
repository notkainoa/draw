import * as animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        button: "var(--button-radius)",
        card: "var(--card-radius)",
        modal: "var(--modal-radius)",
      },
      colors: {
        // Actual Lazy.so Colors (from screenshots)
        primary: {
          DEFAULT: "var(--primary)",
          slate: "var(--secondary-slate)",
          gray: "var(--medium-gray)",
        },
        accent: {
          blue: "var(--accent-blue)",
          yellow: "var(--accent-yellow)",
        },
        background: {
          main: "var(--background-main)",
          card: "var(--background-card)",
          input: "var(--background-input)",
          hover: "var(--background-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: {
          subtle: "var(--border-subtle)",
          input: "var(--border-input)",
        },
      },
      fontFamily: {
        sans: ["Virgil", "Inter", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
        virgil: ["Virgil", "sans-serif"],
        quicksand: ["Quicksand", "sans-serif"],
      },
      fontSize: {
        'h1': ['2rem', { lineHeight: '1.2', letterSpacing: '0.01em' }],
        'h2': ['1.5rem', { lineHeight: '1.2', letterSpacing: '0.01em' }],
        'body': ['1rem', { lineHeight: '1.5' }],
        'small': ['0.875rem', { lineHeight: '1.5' }],
        'ui': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.05em' }],
      },
      spacing: {
        'section': 'var(--section-margin)',
        'component': 'var(--component-margin)',
        'element': 'var(--element-padding)',
        'element-lg': 'var(--element-padding-lg)',
      },
    },
  },
  plugins: [animate],
};
