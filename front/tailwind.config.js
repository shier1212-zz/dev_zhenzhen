/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0E9384",
          deep: "#0A5C54",
          light: "#E6F4F2",
        },
        brand: {
          ink: "#0E1B24", // 页脚深色
        },
        neutral: {
          50: "#F8FAFA",
          100: "#F1F5F5",
          200: "#E2E8E8",
          300: "#CBD5D5",
          400: "#94A3A3",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
      },
      maxWidth: {
        content: "1280px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        "card-hover": "0 8px 24px rgba(15,23,42,0.10)",
        nav: "0 2px 12px rgba(15,23,42,0.08)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
