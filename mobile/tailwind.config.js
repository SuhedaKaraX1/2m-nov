/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Dark-first color scheme matching web app
        background: "#0a0a0a",
        foreground: "#fafafa",
        card: "#1a1a1a",
        "card-foreground": "#fafafa",
        primary: "#3b82f6",
        "primary-foreground": "#fafafa",
        secondary: "#27272a",
        "secondary-foreground": "#fafafa",
        muted: "#27272a",
        "muted-foreground": "#a1a1aa",
        accent: "#27272a",
        "accent-foreground": "#fafafa",
        destructive: "#ef4444",
        "destructive-foreground": "#fafafa",
        border: "#27272a",
        input: "#27272a",
        ring: "#3b82f6",
      },
      fontFamily: {
        inter: ["Inter_400Regular", "Inter_500Medium", "Inter_600SemiBold", "Inter_700Bold"],
        dmSans: ["DMSans_400Regular", "DMSans_500Medium", "DMSans_700Bold"],
      },
    },
  },
  plugins: [],
}
