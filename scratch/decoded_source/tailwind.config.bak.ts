import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssForms from "@tailwindcss/forms";
import tailwindcssContainerQueries from "@tailwindcss/container-queries";

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
        // ✅ Stitch 원본 디자인 시스템 팔레트 (aiantigravity.txt 기준 복원)
        "primary":                    "#004190",
        "on-primary":                 "#ffffff",
        "primary-container":          "#0057bd",
        "on-primary-container":       "#c2d3ff",
        "primary-fixed":              "#d8e2ff",
        "primary-fixed-dim":          "#aec6ff",
        "on-primary-fixed":           "#001a42",
        "on-primary-fixed-variant":   "#004395",
        "inverse-primary":            "#aec6ff",
        "surface-tint":               "#0b5ac0",

        "secondary":                  "#3d56ba",
        "on-secondary":               "#ffffff",
        "secondary-container":        "#8097ff",
        "on-secondary-container":     "#03288f",
        "secondary-fixed":            "#dde1ff",
        "secondary-fixed-dim":        "#b8c4ff",
        "on-secondary-fixed":         "#001355",
        "on-secondary-fixed-variant": "#213da1",

        "tertiary":                   "#6d2177",
        "on-tertiary":                "#ffffff",
        "tertiary-container":         "#883b91",
        "on-tertiary-container":      "#febeff",
        "tertiary-fixed":             "#ffd6fd",
        "tertiary-fixed-dim":         "#fbaaff",
        "on-tertiary-fixed":          "#36003e",
        "on-tertiary-fixed-variant":  "#71257b",

        "surface":                    "#f9f9ff",
        "surface-dim":                "#d9d9e2",
        "surface-bright":             "#f9f9ff",
        "surface-variant":            "#e1e2eb",
        "surface-tint-color":         "#0b5ac0",
        "surface-container-lowest":   "#ffffff",
        "surface-container-low":      "#f2f3fc",
        "surface-container":          "#ededf6",
        "surface-container-high":     "#e7e7f1",
        "surface-container-highest":  "#e1e2eb",

        "on-surface":                 "#191b22",
        "on-surface-variant":         "#424753",
        "inverse-surface":            "#2e3037",
        "inverse-on-surface":         "#f0f0f9",

        "background":                 "#f9f9ff",
        "on-background":              "#191b22",

        "outline":                    "#727784",
        "outline-variant":            "#c2c6d5",

        "error":                      "#ba1a1a",
        "on-error":                   "#ffffff",
        "error-container":            "#ffdad6",
        "on-error-container":         "#93000a",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg":      "0.5rem",
        "xl":      "0.75rem",
        "3xl":     "1.5rem",
        "full":    "9999px",
      },
      fontFamily: {
        "sans":        ["Plus Jakarta Sans", "Inter", "sans-serif"],
        "headline":    ["Plus Jakarta Sans"],
        "body":        ["Inter"],
        "label":       ["Inter"],
        "title-md":    ["Plus Jakarta Sans"],
        "label-sm":    ["Inter"],
        "body-md":     ["Inter"],
        "headline-lg": ["Plus Jakarta Sans"],
        "display-xl":  ["Plus Jakarta Sans"],
        "label-xs":    ["Inter"],
      },
      fontSize: {
        "title-md":    ["1.125rem", { lineHeight: "1.5rem",  fontWeight: "700" }],
        "label-sm":    ["0.75rem",  { lineHeight: "1rem",    fontWeight: "600" }],
        "body-md":     ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
        "headline-lg": ["1.5rem",   { lineHeight: "2rem",    letterSpacing: "-0.025em", fontWeight: "800" }],
        "display-xl":  ["6rem",     { lineHeight: "1",       fontWeight: "800" }],
        "label-xs":    ["10px",     { lineHeight: "1rem",    fontWeight: "700" }],
      },
      spacing: {
        "18":              "4.5rem",
        "22":              "5.5rem",
        "inner-padding":   "0.5rem",
        "element-gap":     "1rem",
        "section-gap":     "2.5rem",
        "page-margin":     "1.5rem",
        "container-max":   "56rem",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    tailwindcssForms,
    tailwindcssContainerQueries,
  ],
};
export default config;
