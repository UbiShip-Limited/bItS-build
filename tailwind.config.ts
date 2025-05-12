/** @type {import('tailwindcss').Config} */
import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				montserrat: ["var(--font-montserrat)", "sans-serif"],
				playfair: ["var(--font-playfair)", "serif"]
			},
		},
	},
	plugins: [require("tailwindcss-animate"), require("daisyui")],
};

export default config;
  
  