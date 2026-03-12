import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#11131a",
        mist: "#f4efe6",
        ember: "#d85d31",
        citrus: "#d9c653",
        pine: "#2c5b4b",
        ocean: "#184a66"
      },
      boxShadow: {
        panel: "0 16px 48px rgba(17, 19, 26, 0.12)"
      },
      borderRadius: {
        panel: "1.5rem"
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at top, rgba(255,255,255,0.7), transparent 42%), linear-gradient(135deg, rgba(216,93,49,0.16), rgba(24,74,102,0.12))"
      }
    }
  },
  plugins: []
};

export default config;
