
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
				body: ['Open Sans', 'system-ui', 'sans-serif'],
				mono: ['Roboto Mono', 'monospace']
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
                // OrbitRide custom colors
                cosmicviolet: "#7B61FF",
                spaceblue: "#1C1C3C",
                moonwhite: "#F3F3F3",
                deepcosmos: "#0D0D25",
                nebulagreen: "#1ED760",
                meteorted: "#FF5C58",
                lunargrey: "#A7A9BE",
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'bounce': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-glow': {
					'0%, 100%': { opacity: '0.8', filter: 'blur(0px)' },
					'50%': { opacity: '1', filter: 'blur(2px)' }
				},
				'orbit': {
					'0%': { transform: 'rotate(0deg) translateX(70px) rotate(0deg)' },
					'100%': { transform: 'rotate(360deg) translateX(70px) rotate(-360deg)' }
				},
				'scale-up': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'ripple': {
					'0%': { transform: 'scale(0)', opacity: '0.5' },
					'100%': { transform: 'scale(1)', opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-in': 'slide-in 0.4s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'bounce': 'bounce 0.8s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'orbit': 'orbit 12s linear infinite',
				'scale-up': 'scale-up 0.3s ease-out',
				'ripple': 'ripple 0.6s linear'
			},
			boxShadow: {
				'cosmic': '0 10px 25px -5px rgba(123, 97, 255, 0.25), 0 8px 10px -6px rgba(123, 97, 255, 0.1)',
				'cosmic-lg': '0 20px 35px -10px rgba(123, 97, 255, 0.3), 0 10px 15px -5px rgba(123, 97, 255, 0.15)',
				'nebula': '0 0 15px rgba(30, 215, 96, 0.4)'
			},
			backgroundImage: {
				'cosmic-gradient': 'linear-gradient(135deg, #7B61FF 0%, #6E8DFF 100%)',
				'nebula-gradient': 'linear-gradient(135deg, #1ED760 0%, #0BCA9F 100%)',
				'space-gradient': 'linear-gradient(180deg, #1C1C3C 0%, #0D0D25 100%)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
