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
        "primary-container": "#6e9fff",
        "tertiary-dim": "#7b2f85",
        "background": "#F1F5F9",
        "surface-container-low": "#F1F5F9",
        "secondary-fixed-dim": "#b4c1ff",
        "primary-fixed-dim": "#5391ff",
        "tertiary-container": "#f199f7",
        "surface-dim": "#cad2ff",
        "on-primary-fixed-variant": "#002a62",
        "on-tertiary-fixed-variant": "#681c73",
        "inverse-surface": "#020a2f",
        "outline": "#6c759e",
        "on-surface": "#242c51",
        "surface-bright": "#F1F5F9",
        "secondary-container": "#c7cfff",
        "secondary-dim": "#2c47ab",
        "error-container": "#fb5151",
        "primary-dim": "#004ca6",
        "on-primary": "#f0f2ff",
        "on-error": "#ffefee",
        "on-background": "#242c51",
        "on-secondary": "#f2f1ff",
        "secondary-fixed": "#c7cfff",
        "on-tertiary-container": "#5e106a",
        "surface-container-lowest": "#ffffff",
        "primary": "#0057bd",
        "secondary": "#3a53b7",
        "surface-container": "#e4e7ff",
        "on-secondary-fixed": "#00278f",
        "tertiary": "#893c92",
        "outline-variant": "#a3abd7",
        "on-primary-fixed": "#000000",
        "tertiary-fixed-dim": "#e28ce9",
        "on-surface-variant": "#515981",
        "on-primary-container": "#002150",
        "surface-container-high": "#dde1ff",
        "primary-fixed": "#6e9fff",
        "surface-variant": "#d6dbff",
        "on-tertiary-fixed": "#3e0047",
        "on-tertiary": "#ffeefb",
        "surface": "#F1F5F9",
        "tertiary-fixed": "#f199f7",
        "on-secondary-fixed-variant": "#2d48ac",
        "surface-tint": "#0057bd",
        "on-secondary-container": "#223ea2",
        "inverse-primary": "#4d8eff",
        "surface-container-highest": "#d6dbff",
        "error-dim": "#9f0519",
        "error": "#b31b25",
        "on-error-container": "#570008",
        "inverse-on-surface": "#929bc6"
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
