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
        "secondary-container": "#dfe3e8",
        "inverse-on-surface": "#9c9d9d",
        "surface": "#f9f9f9",
        "primary-fixed": "#d8e2ff",
        "primary-container": "#d8e2ff",
        "on-secondary-fixed-variant": "#585c61",
        "on-secondary-fixed": "#3c4044",
        "tertiary-fixed-dim": "#e3e5e8",
        "secondary": "#5b5f64",
        "on-tertiary": "#f7f9fc",
        "outline-variant": "#acb3b4",
        "surface-container": "#ebeeef",
        "on-surface": "#2d3435",
        "surface-dim": "#d3dbdd",
        "on-surface-variant": "#596061",
        "tertiary-container": "#f2f4f7",
        "on-secondary-container": "#4e5257",
        "on-primary-container": "#004fa8",
        "error-container": "#fe8983",
        "surface-container-high": "#e4e9ea",
        "primary": "#1A73E8",
        "outline": "#757c7d",
        "on-primary-fixed-variant": "#0058ba",
        "on-primary-fixed": "#003d85",
        "on-primary": "#f7f7ff",
        "tertiary-fixed": "#f2f4f7",
        "surface-container-lowest": "#ffffff",
        "inverse-primary": "#4a8eff",
        "error": "#9f403d",
        "surface-container-highest": "#dde4e5",
        "on-secondary": "#f6f9ff",
        "background": "#f9f9f9",
        "on-error-container": "#752121",
        "surface-tint": "#1A73E8",
        "surface-container-low": "#f2f4f4",
        "surface-variant": "#dde4e5",
        "on-tertiary-fixed": "#474a4d",
        "on-error": "#fff7f6",
        "on-background": "#2d3435",
        "surface-bright": "#f9f9f9",
        "secondary-fixed": "#dfe3e8",
        "tertiary": "#5c5f62",
        "secondary-fixed-dim": "#d1d5da",
        "primary-fixed-dim": "#c2d4ff",
        "on-tertiary-fixed-variant": "#636669",
        "on-tertiary-container": "#595c5f",
        "inverse-surface": "#0c0f0f"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
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
