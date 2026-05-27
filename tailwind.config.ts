import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18212f",
        muted: "#657386",
        line: "#dbe3ec",
        surface: "#f7f9fb",
        ocean: "#0f766e",
        coral: "#e85d4f"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(24, 33, 47, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
