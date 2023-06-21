const plugin = require("tailwindcss/plugin");

module.exports = {
  // mode: 'jit',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1080px",
      xl: "1280px",
      "2xl": "1312px",
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "1rem",
      },
    },
    fontSize: {
      "display-2xl": ["72px", { lineHeight: "80px", letterSpacing: "-0.04em" }],
      "display-xl": ["60px", "72px"],
      "display-lg": ["48px", "60px"],
      "display-md": ["36px", "44px"],
      "display-sm": ["30px", "38px"],
      "display-xs": ["24px", "32px"],
      "body-xl": ["20px", "30px"],
      "body-lg": ["18px", "28px"],
      "body-md": ["16px", "24px"],
      "body-sm": ["14px", "20px"],
      "body-xs": ["12px", "18px"],
    },
    colors: {
      white: "#FFFFFF",
      black: "#000000",
      transparent: "transparent",
      gray: {
        25: "#FCFCFD",
        50: "#F9FAFA",
        100: "#F3F4F6",
        200: "#EBECEF",
        300: "#D3D6D9",
        400: "#9EA4AD",
        500: "#6C727F",
        600: "#4E5660",
        700: "#3C424C",
        800: "#252A31",
        900: "#181A20",
      },
      indigo: {
        25: "#F5F8FF",
        50: "#EEF4FF",
        100: "#E0EAFF",
        200: "#C7D7FE",
        300: "#A4BCFD",
        400: "#8098F9",
        500: "#6172F3",
        600: "#444CE7",
        700: "#3538CD",
        800: "#2D31A6",
        900: "#2D3282",
      },
      red: {
        25: "#FFFBFA",
        50: "#FEF3F2",
        100: "#FEE4E2",
        200: "#FECDCA",
        300: "#FDA29B",
        400: "#F97066",
        500: "#F04438",
        600: "#D92D20",
        700: "#B42318",
        800: "#912018",
        900: "#7A271A",
      },
      green: {
        25: "#F7FCF9",
        50: "#EAF8F0",
        100: "#D5F1E1",
        200: "#AEE5C2",
        300: "#7EDFA0",
        400: "#47D37D",
        500: "#00C853",
        600: "#00B24A",
        700: "#009B42",
        800: "#007F39",
        900: "#006732",
      },
    },
    extend: {
      keyframes: {
        "beat-fade": {
          "50%": {
            transform: "scale(0.75)",
            opacity: "0.2",
            "animation-timing-function": "cubic-bezier(0, 0, 0.2, 1);",
          },
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "1",
            "animation-timing-function": "cubic-bezier(0.8, 0, 1, 1);",
          },
        },
      },
      animation: {
        "beat-fade": "beat-fade 0.7s 0s infinite linear",
        "beat-fade-odd": "beat-fade 0.7s 0.35s infinite linear",
      },
    },
    extend: {
      backgroundImage: (theme) => ({
        "rectangles-dark": "url('./assets/images/rectangles-dark.png')",
        "spotlight-smoke": "url('./assets/images/spotlight-smoke.png')",
      }),
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      spacing: {
        4.5: "18px",
        7.5: "30px",
      },
      transitionProperty: {
        width: "width",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: "100%" },
        },
      },
      containers: {
        md: "768px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
    // adding custom active-link class variant for links
    // if you use e.g active-link:bg-gray-500 and if your element is under .active-link class
    // style will be applied
    plugin(function ({ addVariant }) {
      addVariant("checked", ["&.checked"]);
      addVariant("active-link", ["&.active-link", ".active-link &"]);
      addVariant("disabled", ["&[disabled]", "[disabled] &"]);
    }),
  ],
};
