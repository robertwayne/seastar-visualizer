module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                light: {
                    primary: "#f8f9fa",
                    secondary: "#272727",
                    highlight: "#3f5ab1",
                },
                dark: {
                    primary: "#222831",
                    secondary: "#dddbd8",
                    tertiary: "#a4a2a9",
                    highlight: "#ffc857",
                },
                tiles: {
                    start: "#3b5dc9",
                    end: "#b13e53",
                    wall: "#7a7576",
                    path: "#38b764",
                },
            },
        },
        plugins: [require("@tailwindcss/forms")],
    },
    darkMode: "class",
}
