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
        "tertiary-fixed": "#f2f4f7",
        "surface-container": "#ebeeef",
        "primary-fixed-dim": "#c2d4ff",
        "on-secondary": "#f6f9ff",
        "primary-container": "#d8e2ff",
        "on-tertiary-container": "#595c5f",
        "outline-variant": "#acb3b4",
        "tertiary": "#5c5f62",
        "on-surface-variant": "#596061",
        "surface-dim": "#d3dbdd",
        "secondary": "#5b5f64",
        "secondary-fixed-dim": "#d1d5da",
        "on-secondary-fixed": "#3c4044",
        "on-error-container": "#752121",
        "surface-container-highest": "#dde4e5",
        "secondary-container": "#dfe3e8",
        "error-container": "#fe8983",
        "on-secondary-container": "#4e5257",
        "primary": "#1A73E8",
        "inverse-surface": "#0c0f0f",
        "surface": "#f9f9f9",
        "on-surface": "#2d3435",
        "on-primary-fixed-variant": "#0058ba",
        "on-tertiary": "#f7f9fc",
        "inverse-primary": "#4a8eff",
        "inverse-on-surface": "#9c9d9d",
        "background": "#f9f9f9",
        "tertiary-container": "#f2f4f7",
        "surface-bright": "#f9f9f9",
        "outline": "#757c7d",
        "on-primary-container": "#004fa8",
        "surface-container-high": "#e4e9ea",
        "primary-fixed": "#d8e2ff",
        "surface-variant": "#dde4e5",
        "on-secondary-fixed-variant": "#585c61",
        "error": "#9f403d",
        "on-background": "#2d3435",
        "on-tertiary-fixed-variant": "#636669",
        "on-error": "#fff7f6",
        "secondary-fixed": "#dfe3e8",
        "on-primary-fixed": "#003d85",
        "surface-container-lowest": "#ffffff",
        "tertiary-fixed-dim": "#e3e5e8",
        "surface-tint": "#1A73E8",
        "surface-container-low": "#f2f4f4",
        "on-tertiary-fixed": "#474a4d",
        "on-primary": "#f7f7ff"
  		},
  		borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "9999px"
  		},
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
        "manrope": ["Manrope", "sans-serif"]
      }
  	}
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries")
  ],
};
export default config;
