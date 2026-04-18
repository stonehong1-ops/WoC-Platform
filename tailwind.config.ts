import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "outline-variant": "#c3c6d7",
        "on-primary-container": "#eeefff",
        "primary-fixed-dim": "#b4c5ff",
        "on-tertiary-container": "#ffede6",
        "surface-variant": "#e0e3e5",
        "on-background": "#191c1e",
        "on-primary-fixed-variant": "#003ea8",
        "surface-container": "#eceef0",
        "tertiary-fixed": "#ffdbcd",
        "on-secondary-fixed-variant": "#3a485b",
        "background": "#f7f9fb",
        "outline": "#737686",
        "primary-fixed": "#dbe1ff",
        "primary": "#2563EB",
        "on-tertiary-fixed": "#360f00",
        "primary-container": "#2563eb",
        "surface-bright": "#f7f9fb",
        "on-error": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "on-error-container": "#93000a",
        "secondary-fixed": "#d5e3fc",
        "surface-tint": "#0053db",
        "inverse-primary": "#b4c5ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#e0e3e5",
        "error": "#ba1a1a",
        "inverse-on-surface": "#eff1f3",
        "tertiary-container": "#bc4800",
        "on-tertiary": "#ffffff",
        "on-primary": "#ffffff",
        "surface-dim": "#d8dadc",
        "on-tertiary-fixed-variant": "#7d2d00",
        "on-surface-variant": "#434655",
        "secondary-container": "#d5e3fc",
        "on-secondary-fixed": "#0d1c2e",
        "tertiary": "#943700",
        "on-secondary-container": "#57657a",
        "secondary": "#515f74",
        "on-surface": "#191c1e",
        "tertiary-fixed-dim": "#ffb596",
        "surface-container-high": "#e6e8ea",
        "secondary-fixed-dim": "#b9c7df",
        "on-secondary": "#ffffff",
        "on-primary-fixed": "#00174b",
        "inverse-surface": "#2d3133",
        "surface": "#f7f9fb",
        "error-container": "#ffdad6"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Manrope"],
        "body": ["Inter"],
        "label": ["Inter"]
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ],
};
export default config;
