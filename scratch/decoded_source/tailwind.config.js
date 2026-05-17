/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0057bd",
        "background": "#F3F4F6",
        "surface": "#F3F4F6",
        "on-primary": "#f0f2ff",
        "on-background": "#242c51",
        "on-surface": "#242c51",
        "on-surface-variant": "#515981",
        "primary-container": "#6e9fff",
        "on-primary-container": "#002150",
        "secondary-container": "#c7cfff",
        "on-secondary-container": "#223ea2",
        "tertiary-container": "#f199f7",
        "on-tertiary-container": "#5e106a",
        "surface-container-highest": "#d6dbff",
        "surface-container-low": "#F3F4F6",
        "error": "#b31b25",
        "on-error": "#ffefee",
      },
      borderRadius: {
        "xl": "0.75rem",
      },
      fontFamily: {
        headline: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
    require("tailwindcss-animate"),
  ],
};
