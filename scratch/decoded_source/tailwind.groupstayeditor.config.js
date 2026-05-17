/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/group/GroupStayEditor.tsx",
    "./src/app/(nation)/stay/page.tsx",
    "./src/app/(nation)/stay/[id]/page.tsx",
    "./src/app/(nation)/stay/[id]/checkout/page.tsx"
  ],
  darkMode: "class",
  corePlugins: {
    preflight: false, // DO NOT reset global styles
  },
  theme: {
      extend: {
          "colors": {
              "on-primary-fixed-variant": "#004395",
              "on-background": "#191b22",
              "primary-container": "#0057bd",
              "outline-variant": "#c2c6d5",
              "on-secondary-fixed-variant": "#213da1",
              "on-tertiary-container": "#febeff",
              "on-primary-container": "#c2d3ff",
              "inverse-on-surface": "#f0f0f9",
              "tertiary-fixed": "#ffd6fd",
              "tertiary-container": "#883b91",
              "on-error": "#ffffff",
              "inverse-surface": "#2e3037",
              "tertiary": "#6d2177",
              "secondary-container": "#8097ff",
              "surface-bright": "#f9f9ff",
              "outline": "#727784",
              "secondary-fixed-dim": "#b8c4ff",
              "surface-container-highest": "#e1e2eb",
              "on-surface-variant": "#424753",
              "error": "#ba1a1a",
              "tertiary-fixed-dim": "#fbaaff",
              "on-tertiary-fixed": "#36003e",
              "surface-container-high": "#e7e7f1",
              "primary": "#004190",
              "surface-tint": "#0b5ac0",
              "on-tertiary-fixed-variant": "#71257b",
              "surface-variant": "#e1e2eb",
              "surface": "#f9f9ff",
              "on-secondary": "#ffffff",
              "on-primary-fixed": "#001a42",
              "surface-container-low": "#f2f3fc",
              "on-tertiary": "#ffffff",
              "secondary-fixed": "#dde1ff",
              "on-error-container": "#93000a",
              "on-secondary-fixed": "#001355",
              "primary-fixed-dim": "#aec6ff",
              "on-primary": "#ffffff",
              "secondary": "#3d56ba",
              "error-container": "#ffdad6",
              "surface-container-lowest": "#ffffff",
              "surface-container": "#ededf6",
              "on-surface": "#191b22",
              "on-secondary-container": "#03288f",
              "background": "#f9f9ff",
              "inverse-primary": "#aec6ff"
          },
          "borderRadius": {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px"
          },
          "spacing": {
              "element-gap": "1rem",
              "container-max": "56rem",
              "section-gap": "2.5rem",
              "page-margin": "1.5rem",
              "inner-padding": "0.5rem"
          },
          "fontFamily": {
              "label-xs": ["Inter"],
              "body-md": ["Inter"],
              "title-md": ["Plus Jakarta Sans"],
              "display-xl": ["Plus Jakarta Sans"],
              "label-sm": ["Inter"],
              "headline-lg": ["Plus Jakarta Sans"]
          },
          "fontSize": {
              "label-xs": ["10px", {"lineHeight": "1rem", "fontWeight": "700"}],
              "body-md": ["0.875rem", {"lineHeight": "1.25rem", "fontWeight": "500"}],
              "title-md": ["1.125rem", {"lineHeight": "1.5rem", "fontWeight": "700"}],
              "display-xl": ["6rem", {"lineHeight": "1", "fontWeight": "800"}],
              "label-sm": ["0.75rem", {"lineHeight": "1rem", "fontWeight": "600"}],
              "headline-lg": ["1.5rem", {"lineHeight": "2rem", "letterSpacing": "-0.025em", "fontWeight": "800"}]
          }
      }
  }
};
