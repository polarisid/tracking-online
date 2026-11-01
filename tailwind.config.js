/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      boxShadow: {
        // Sombras de painel: uma borda de luz fina + queda longa e suave (estilo 21st.dev).
        panel: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -14px rgba(15,23,42,0.10)",
        "panel-hover": "0 1px 2px rgba(15,23,42,0.05), 0 20px 44px -18px rgba(15,23,42,0.20)",
      },
    },
  },
  plugins: [],
}
