export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: 'class', // Enable class-based dark mode
  theme: { 
    extend: {
      colors: {
        // DP World brand colors
        'dp-navy': '#002F6C',
        'dp-royal-blue': '#0B4FA7',
        'dp-purple': '#3C2E8F',
        'dp-purple-mid': '#2B2C7A',
        'dp-green': '#00A859',
        'dp-red': '#ED1C24',
        'dp-silver': '#B3B3B3',
        'dp-card-dark': '#0E2F51',
        
        // Light mode colors (background dark, cards light)
        'light': {
          'canvas-start': '#0A1B2A',
          'canvas-end': '#002F6C',
          'canvas-gradient': 'linear-gradient(135deg, #0A1B2A 0%, #002F6C 100%)',
          'card': '#FFFFFF',
          'card-title': '#002F6C',
          'card-secondary': '#4A4A4A',
          'card-hover': 'rgba(11, 79, 167, 0.08)',
          'card-hover-shadow': 'rgba(0, 47, 108, 0.15)',
          'block-bg': '#0A1B2A',
          'block-bg-end': '#002F6C',
        },
        
        // Dark mode colors (background light, cards dark)
        'dark': {
          'canvas': '#FFFFFF',
          'card': '#0E2F51',
          'card-title': '#FFFFFF',
          'card-secondary': '#B3B3B3',
          'card-secondary-alt': '#D0D0D0',
          'card-hover': 'rgba(60, 46, 143, 0.1)',
          'card-hover-glow': 'rgba(60, 46, 143, 0.6)',
          'block-bg': '#FFFFFF',
        },
        
        // Shared elements (both modes)
        'header': {
          'gradient-start': '#3C2E8F',
          'gradient-mid': '#2B2C7A',
          'gradient-end': '#002F6C',
          'text': '#FFFFFF',
        },
        
        'sidebar': {
          'gradient-start': '#3C2E8F',
          'gradient-mid': '#2B2C7A',
          'gradient-end': '#002F6C',
          'text': '#FFFFFF',
          'hover-bg': '#00A859',
          'hover-highlight': 'rgba(0, 168, 89, 0.2)',
        },
        
        // KPI and Badge colors
        'kpi': {
          'safe-bg': '#00A859',
          'safe-text': '#FFFFFF',
          'alert-bg': '#ED1C24',
          'alert-text': '#FFFFFF',
          'neutral-bg': '#B3B3B3',
          'neutral-text': '#002F6C',
        },
        
        // Chart colors
        'chart': {
          'bars': '#0B4FA7',
          'lines': '#0B4FA7',
          'thresholds': '#00A859',
          'breaches': '#ED1C24',
          'gridlines': '#B3B3B3',
        },
        
        // Help icon colors
        'help': {
          'default': '#B3B3B3',
          'hover': '#00A859',
        },
        
        // Accent colors
        'accent': {
          'blue': '#0B4FA7',
          'green': '#00A859',
          'red': '#ED1C24',
          'silver': '#B3B3B3',
        },
        
        // Theme-aware colors (CSS variables)
        'theme': {
          'bg': 'var(--theme-bg)',
          'bg-secondary': 'var(--theme-bg-secondary)',
          'card': 'var(--theme-card)',
          'card-kpi': 'var(--theme-card-kpi)',
          'text': 'var(--theme-text)',
          'text-secondary': 'var(--theme-text-secondary)',
          'text-accent': 'var(--theme-text-accent)',
          'card-text': 'var(--theme-card-text)',
          'card-text-secondary': 'var(--theme-card-text-secondary)',
          'border': 'var(--theme-border)',
          'accent': 'var(--theme-accent)',
          'success': 'var(--theme-success)',
          'warning': 'var(--theme-warning)',
          'danger': 'var(--theme-danger)',
          'silver': 'var(--theme-silver)',
          'header-gradient': 'var(--theme-header-gradient)',
        }
      },
      animation: {
        'theme-transition': 'theme-fade 0.3s ease-in-out',
        'card-hover': 'card-lift 0.3s ease-out',
        'card-hover-light': 'card-lift-light 0.3s ease-out',
        'card-hover-dark': 'card-lift-dark 0.3s ease-out',
        'glow': 'glow 0.3s ease-in-out',
        'glow-dark': 'glow-dark 0.3s ease-in-out',
        'pulse-gentle': 'pulse-gentle 2s infinite',
        'sidebar-hover': 'sidebar-highlight 0.2s ease-in-out',
      },
      keyframes: {
        'theme-fade': {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '1' },
        },
        'card-lift': {
          '0%': { 
            transform: 'translateY(0px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          },
          '100%': { 
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 30px -10px rgba(0, 47, 108, 0.15)'
          },
        },
        'card-lift-light': {
          '0%': { 
            transform: 'translateY(0px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#FFFFFF'
          },
          '100%': { 
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 30px -10px rgba(0, 47, 108, 0.15), 0 10px 15px -5px rgba(0, 47, 108, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          },
        },
        'card-lift-dark': {
          '0%': { 
            transform: 'translateY(0px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            backgroundColor: '#0E2F51'
          },
          '100%': { 
            transform: 'translateY(-2px)',
            boxShadow: '0 0 20px rgba(60, 46, 143, 0.6), 0 20px 30px -10px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#0E2F51'
          },
        },
        'glow': {
          '0%': { 
            boxShadow: '0 0 5px rgba(60, 46, 143, 0.3)'
          },
          '100%': { 
            boxShadow: '0 0 20px rgba(60, 46, 143, 0.6), 0 0 30px rgba(60, 46, 143, 0.4)'
          },
        },
        'glow-dark': {
          '0%': { 
            boxShadow: '0 0 5px rgba(60, 46, 143, 0.3)'
          },
          '100%': { 
            boxShadow: '0 0 20px rgba(60, 46, 143, 0.6), 0 0 30px rgba(60, 46, 143, 0.4), 0 0 40px rgba(60, 46, 143, 0.2)'
          },
        },
        'pulse-gentle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'sidebar-highlight': {
          '0%': { backgroundColor: 'transparent' },
          '100%': { backgroundColor: 'rgba(0, 168, 89, 0.2)' },
        }
      },
      boxShadow: {
        // Light mode shadows (cards on dark background)
        'card-light': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'card-light-hover': '0 20px 30px -10px rgba(0, 47, 108, 0.15), 0 10px 15px -5px rgba(0, 47, 108, 0.1)',
        'card-light-subtle': '0 4px 8px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        
        // Dark mode shadows (cards on light background)
        'card-dark': '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        'card-dark-hover': '0 0 20px rgba(60, 46, 143, 0.6), 0 20px 30px -10px rgba(0, 0, 0, 0.3), 0 10px 15px -5px rgba(255, 255, 255, 0.1)',
        'card-dark-glow': '0 0 30px rgba(60, 46, 143, 0.4), 0 0 40px rgba(60, 46, 143, 0.2)',
        
        // Glow effects
        'glow-light': '0 0 20px rgba(11, 79, 167, 0.3)',
        'glow-dark': '0 0 20px rgba(60, 46, 143, 0.6)',
        'glow-green': '0 0 15px rgba(0, 168, 89, 0.4)',
        'glow-red': '0 0 15px rgba(237, 28, 36, 0.4)',
        
        // Sidebar and header shadows
        'sidebar': '2px 0 10px rgba(0, 0, 0, 0.1)',
        'header': '0 2px 10px rgba(0, 0, 0, 0.1)',
        
        // KPI badge shadows
        'kpi-safe': '0 4px 8px rgba(0, 168, 89, 0.2)',
        'kpi-alert': '0 4px 8px rgba(237, 28, 36, 0.2)',
        'kpi-neutral': '0 4px 8px rgba(179, 179, 179, 0.2)',
      },
      
      backgroundImage: {
        // Canvas gradients
        'canvas-light': 'linear-gradient(135deg, #0A1B2A 0%, #002F6C 100%)',
        'canvas-dark': 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)',
        
        // Header and sidebar gradients
        'header-gradient': 'linear-gradient(135deg, #3C2E8F 0%, #2B2C7A 50%, #002F6C 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #3C2E8F 0%, #2B2C7A 50%, #002F6C 100%)',
        
        // Hover overlays
        'card-hover-light': 'linear-gradient(135deg, rgba(11, 79, 167, 0.05) 0%, rgba(11, 79, 167, 0.08) 100%)',
        'card-hover-dark': 'linear-gradient(135deg, rgba(60, 46, 143, 0.08) 0%, rgba(60, 46, 143, 0.12) 100%)',
        
        // Block backgrounds
        'block-light': 'linear-gradient(135deg, #0A1B2A 0%, #002F6C 100%)',
        'block-dark': 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)',
      }
    }
  },
      plugins: [],
};
