/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Material Design 3 配色方案
        // 主色调 - 紫色系 (M3 Primary)
        primary: {
          50: '#F6EDFF',   // Primary Container Light
          100: '#EADDFF',  // Primary Container
          200: '#D0BCFF',  // Primary Light
          300: '#B69DF8',
          400: '#9A82DB',
          500: '#6750A4',  // Primary (M3 标志色)
          600: '#5B4497',
          700: '#4F378B',
          800: '#381E72',
          900: '#21005D',
          950: '#14003D',
        },
        // 次要色 - 深蓝紫色 (M3 Secondary)
        secondary: {
          50: '#E8DEF8',
          100: '#DDD3ED',
          200: '#CCC2DC',
          300: '#B4A7C7',
          400: '#958DA5',
          500: '#625B71',  // Secondary
          600: '#564F65',
          700: '#4A4458',
          800: '#332D41',
          900: '#1D192B',
          950: '#0F0D15',
        },
        // 第三色 - 青色/蓝绿色 (M3 Tertiary)
        tertiary: {
          50: '#FFD8E4',
          100: '#FFCCD8',
          200: '#EFB8C8',
          300: '#D29DAC',
          400: '#B58392',
          500: '#7D5260',  // Tertiary
          600: '#704656',
          700: '#633B4C',
          800: '#492532',
          900: '#31111D',
          950: '#1F0A12',
        },
        // 成功色 - 绿色系
        success: {
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
        // 警告色 - 橙色系
        warning: {
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
        // 错误色 - 红色系 (M3 Error)
        error: {
          50: '#FFEDEA',
          100: '#FFDAD6',
          200: '#FFB4AB',
          300: '#FF897D',
          400: '#FF5449',
          500: '#DE3730',  // Error
          600: '#BA1A1A',
          700: '#93000A',
          800: '#690005',
          900: '#410002',
        },
        // 中性色 - 带紫色调的灰色 (M3 Neutral)
        neutral: {
          50: '#FFFBFE',   // Surface
          100: '#FEF7FF',  // Surface Container Lowest
          200: '#F3EDF7',  // Surface Container Low
          300: '#E6E0E9',  // Surface Container
          400: '#CAC4D0',  // Outline Variant
          500: '#79747E',  // Outline
          600: '#49454F',  // On Surface Variant
          700: '#1D1B20',  // On Surface
          800: '#1C1B1F',
          900: '#141218',
          950: '#0E0D11',
        },
        // Surface 颜色 (M3 特有)
        surface: {
          DEFAULT: '#FFFBFE',
          dim: '#DED8E1',
          bright: '#FFFBFE',
          'container-lowest': '#FFFFFF',
          'container-low': '#F7F2FA',
          container: '#F3EDF7',
          'container-high': '#ECE6F0',
          'container-highest': '#E6E0E9',
        },
      },
      // Material Design 风格阴影
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'elevation-2': '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        'elevation-3': '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
        'elevation-4': '0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)',
        'elevation-5': '0 20px 40px rgba(0,0,0,0.2)',
      },
      // 圆角
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
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
