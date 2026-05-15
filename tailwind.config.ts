import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        pitch: "#f5f2fa",
        ink: "#2a003f",
        line: "rgba(55,0,80,0.14)",
        turf: "#00ff87",
        gold: "#ff2882",
        cyan: "#04f5ff",
        plum: "#3d005b"
      },
      boxShadow: {
        glow: "0 18px 45px rgba(55,0,80,0.12)"
      }
    }
  },
  plugins: []
};

export default config;
