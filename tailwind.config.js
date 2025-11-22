const gluestackPlugin = require('@gluestack-ui/nativewind-utils/tailwind-plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5050',
          50: '#FFF5F5',
          100: '#FFE3E3',
          200: '#FFC6C6',
          300: '#FF9C9C',
          400: '#FF7373',
          500: '#FF5050',
          600: '#E64545',
          700: '#C73737',
          800: '#A32D2D',
          900: '#6B1C1C',
          950: '#3E0E0E',
        },
        secondary: {
          DEFAULT: '#4C0909',
          50: '#FBEAEA',
          100: '#F5D3D3',
          200: '#EAA8A8',
          300: '#D67575',
          400: '#B23F3F',
          500: '#4C0909',
          600: '#3C0606',
          700: '#2E0404',
          800: '#200202',
          900: '#150101',
        },
        neutral: {
          DEFAULT: '#998989',
          50: '#FDF9F9',
          100: '#F8F4F4',
          200: '#EDE7E7',
          300: '#D9CFCF',
          400: '#BBAEAE',
          500: '#998989',
          600: '#776767',
          700: '#5C4E4E',
          800: '#3F3434',
          900: '#241B1B',
        },
        
        // Aliases para compatibilidad
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30',
        background: '#FDF9F9',
        card: '#FFFFFF',
        text: {
          primary: '#241B1B',
          secondary: '#5C4E4E',
          tertiary: '#998989',
        },
      },
      
      fontFamily: {
        // PlayfairDisplay (Expo Google Fonts) - Para títulos
        display: ['PlayfairDisplay-BoldItalic', 'serif'],
        
        // GeneralSans (Por peso específico) - Para body
        'body-light': ['GeneralSans-Light', 'sans-serif'],
        body: ['GeneralSans-Regular', 'sans-serif'],
        'body-medium': ['GeneralSans-Medium', 'sans-serif'],
        'body-semibold': ['GeneralSans-Semibold', 'sans-serif'],
        'body-italic': ['GeneralSans-Italic', 'sans-serif'],
        'body-semibold-italic': ['GeneralSans-SemiboldItalic', 'sans-serif'],
      },
      
      fontSize: {
        caption: ['10px', { lineHeight: '14px' }],
        sm: ['12px', { lineHeight: '16px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '24px' }],
        h4: ['17px', { lineHeight: '24px', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        h2: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h1: ['28.8px', { lineHeight: '36px', fontWeight: '700' }],
      },
      
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
    },
  },
  plugins: [gluestackPlugin],
};

