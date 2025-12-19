/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Material Design 3 配色方案 - 基于官方 M3 色彩系统
        // 主色调 - 紫色系 (M3 Primary)
        primary: {
          DEFAULT: '#6750A4',  // Primary
          50: '#F6EDFF',
          100: '#EADDFF',      // Primary Container
          200: '#D0BCFF',
          300: '#B69DF8',
          400: '#9A82DB',
          500: '#6750A4',      // Primary
          600: '#5B4497',
          700: '#4F378B',
          800: '#381E72',      // On Primary Container
          900: '#21005D',
          950: '#14003D',
        },
        // 次要色 (M3 Secondary)
        secondary: {
          DEFAULT: '#625B71',
          50: '#E8DEF8',       // Secondary Container
          100: '#DDD3ED',
          200: '#CCC2DC',
          300: '#B4A7C7',
          400: '#958DA5',
          500: '#625B71',      // Secondary
          600: '#564F65',
          700: '#4A4458',      // On Secondary Container
          800: '#332D41',
          900: '#1D192B',
          950: '#0F0D15',
        },
        // 第三色 (M3 Tertiary)
        tertiary: {
          DEFAULT: '#7D5260',
          50: '#FFD8E4',       // Tertiary Container
          100: '#FFCCD8',
          200: '#EFB8C8',
          300: '#D29DAC',
          400: '#B58392',
          500: '#7D5260',      // Tertiary
          600: '#704656',
          700: '#633B4C',      // On Tertiary Container
          800: '#492532',
          900: '#31111D',
          950: '#1F0A12',
        },
        // 成功色
        success: {
          DEFAULT: '#4CAF50',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        // 警告色
        warning: {
          DEFAULT: '#FFC107',
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFC107',
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#FF6F00',
        },
        // 错误色 (M3 Error)
        error: {
          DEFAULT: '#B3261E',
          50: '#FFEDEA',
          100: '#FFDAD6',      // Error Container
          200: '#FFB4AB',
          300: '#FF897D',
          400: '#FF5449',
          500: '#DE3730',
          600: '#B3261E',      // Error
          700: '#8C1D18',      // On Error Container
          800: '#601410',
          900: '#410002',
        },
        // 中性色 - M3 Neutral Palette
        neutral: {
          50: '#FFFBFE',       // Surface
          100: '#FEF7FF',
          200: '#F3EDF7',
          300: '#E6E0E9',
          400: '#CAC4D0',      // Outline Variant (用于边框)
          500: '#79747E',      // Outline
          600: '#49454F',      // On Surface Variant (次要文字)
          700: '#1D1B20',      // On Surface (主要文字)
          800: '#1C1B1F',
          900: '#141218',
          950: '#0E0D11',
        },
        // Surface 颜色 (M3 Surface Tones)
        surface: {
          DEFAULT: '#FEF7FF',
          dim: '#DED8E1',
          bright: '#FEF7FF',
          'container-lowest': '#FFFFFF',
          'container-low': '#F7F2FA',
          container: '#F3EDF7',
          'container-high': '#ECE6F0',
          'container-highest': '#E6E0E9',
        },
        // M3 语义化颜色别名
        outline: {
          DEFAULT: '#79747E',
          variant: '#CAC4D0',
        },
      },
      // Material Design 风格阴影 (已禁用 - 使用边框代替)
      boxShadow: {
        'elevation-1': 'none',
        'elevation-2': 'none',
        'elevation-3': 'none',
        'elevation-4': 'none',
        'elevation-5': 'none',
      },
      // M3 字体大小系统
      fontSize: {
        'display-lg': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px' }],
        'display-md': ['45px', { lineHeight: '52px', letterSpacing: '0px' }],
        'display-sm': ['36px', { lineHeight: '44px', letterSpacing: '0px' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '0px' }],
        'headline-md': ['28px', { lineHeight: '36px', letterSpacing: '0px' }],
        'headline-sm': ['24px', { lineHeight: '32px', letterSpacing: '0px' }],
        'title-lg': ['22px', { lineHeight: '28px', letterSpacing: '0px' }],
        'title-md': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'title-sm': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0.5px' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
        'body-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.4px' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
      },
      // 圆角 - M3 Shape System
      borderRadius: {
        none: '0px',
        sm: '8px',       // Extra Small
        md: '12px',      // Small
        lg: '16px',      // Medium
        xl: '28px',      // Large
        '2xl': '28px',   // Extra Large
        full: '9999px',  // Full (Pills)
      },
      // 间距
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'ping-once': 'pingOnce 0.6s ease-out forwards',
        'ping-once-delayed': 'pingOnce 0.6s ease-out 0.1s forwards',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
        'checkin-success': 'checkinSuccess 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pingOnce: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        checkinSuccess: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
