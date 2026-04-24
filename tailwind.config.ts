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
        "surface-tint": "#0b5ac0",
        "surface-dim": "#d9d9e2",
        "surface": "#f9f9ff",
        "secondary-fixed": "#dde1ff",
        "primary-container": "#0057bd",
        "on-primary-container": "#c2d3ff",
        "on-primary-fixed": "#001a42",
        "on-secondary": "#ffffff",
        "on-surface-variant": "#424753",
        "secondary-container": "#8097ff",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#febeff",
        "error-container": "#ffdad6",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-fixed": "#36003e",
        "on-surface": "#191b22",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "inverse-on-surface": "#f0f0f9",
        "outline-variant": "#c2c6d5",
        "on-error-container": "#93000a",
        "surface-container-highest": "#e1e2eb",
        "on-secondary-fixed": "#001355",
        "tertiary-fixed": "#ffd6fd",
        "secondary-fixed-dim": "#b8c4ff",
        "primary-fixed": "#d8e2ff",
        "surface-container-low": "#f2f3fc",
        "on-secondary-container": "#03288f",
        "inverse-primary": "#aec6ff",
        "on-primary": "#ffffff",
        "surface-container": "#ededf6",
        "secondary": "#3d56ba",
        "background": "#f9f9ff",
        "tertiary": "#6d2177",
        "outline": "#727784",
        "surface-bright": "#f9f9ff",
        "on-secondary-fixed-variant": "#213da1",
        "surface-container-high": "#e7e7f1",
        "primary-fixed-dim": "#aec6ff",
        "surface-variant": "#d6dbff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans"],
        "body": ["Inter"],
        "label": ["Inter"]
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem"
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
