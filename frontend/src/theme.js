import { createTheme, alpha } from '@mui/material/styles';

// ProLance Brand Colors
const CREAM   = '#FFDBBB';
const ROSE    = '#CCBEB1';
const WARM    = '#997E67';
const BROWN   = '#664930';
const DARK    = '#0D0A07';

export const getTheme = (mode = 'dark') => createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: WARM,  light: CREAM, dark: BROWN, contrastText: '#fff' },
    secondary: { main: CREAM, light: '#FFF0E0', dark: ROSE, contrastText: '#2a1a0d' },
    background:{
      default: DARK,
      paper:   'rgba(20,14,8,0.75)',
    },
    text: {
      primary:   '#F5EDE4',
      secondary: '#C4B4A7',
      disabled:  '#7D6A5C',
    },
    divider: 'rgba(255,219,187,0.1)',
    success: { main: '#4ade80' },
    warning: { main: '#facc15' },
    error:   { main: '#f87171' },
    info:    { main: '#a5b4fc' },
  },

  typography: {
    fontFamily: '"Manrope","Poppins","Inter","Helvetica","Arial",sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.04em' },
    h2: { fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.7, color: '#C4B4A7' },
    body2: { lineHeight: 1.6, color: '#C4B4A7' },
    button: { fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
  },

  shape: { borderRadius: 12 },

  shadows: [
    'none',
    '0 2px 8px rgba(0,0,0,0.3)',
    '0 4px 12px rgba(0,0,0,0.35)',
    '0 8px 24px rgba(0,0,0,0.4)',
    '0 12px 32px rgba(0,0,0,0.45)',
    '0 16px 40px rgba(0,0,0,0.5)',
    '0 20px 48px rgba(0,0,0,0.5)',
    '0 24px 56px rgba(0,0,0,0.5)',
    ...Array(17).fill('0 24px 64px rgba(0,0,0,0.5)'),
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: DARK,
          backgroundImage: `
            radial-gradient(ellipse at 20% 20%, rgba(153,126,103,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(102,73,48,0.06) 0%, transparent 50%)
          `,
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(20,14,8,0.72)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,219,187,0.1)',
          borderRadius: 16,
          transition: 'all 300ms cubic-bezier(0.22,1,0.36,1)',
          '&:hover': {
            border: '1px solid rgba(255,219,187,0.18)',
            boxShadow: '0 0 40px rgba(153,126,103,0.15)',
          },
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          fontFamily: '"Manrope","Poppins",sans-serif',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 9999,
          transition: 'all 300ms cubic-bezier(0.22,1,0.36,1)',
          letterSpacing: '0.02em',
        },
        contained: {
          background: `linear-gradient(135deg, ${WARM} 0%, ${BROWN} 100%)`,
          color: '#fff',
          boxShadow: `0 4px 20px ${alpha(BROWN, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${WARM} 0%, ${BROWN} 100%)`,
            boxShadow: `0 8px 32px ${alpha(BROWN, 0.6)}`,
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: 'rgba(255,219,187,0.25)',
          color: CREAM,
          '&:hover': {
            borderColor: 'rgba(255,219,187,0.5)',
            background: 'rgba(255,219,187,0.06)',
            transform: 'translateY(-1px)',
          },
        },
        text: {
          color: '#C4B4A7',
          '&:hover': { background: 'rgba(255,219,187,0.06)', color: CREAM },
        },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(255,219,187,0.05)',
            borderRadius: 12,
            fontFamily: '"Inter",sans-serif',
            color: '#F5EDE4',
            transition: 'all 250ms',
            '& fieldset': { borderColor: 'rgba(255,219,187,0.12)' },
            '&:hover fieldset': { borderColor: 'rgba(255,219,187,0.25)' },
            '&.Mui-focused fieldset': {
              borderColor: WARM,
              boxShadow: `0 0 0 3px ${alpha(WARM, 0.15)}`,
            },
          },
          '& .MuiInputLabel-root': { color: '#7D6A5C', fontFamily: '"Inter",sans-serif' },
          '& .MuiInputLabel-root.Mui-focused': { color: CREAM },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          background: 'rgba(255,219,187,0.1)',
          color: CREAM,
          border: '1px solid rgba(255,219,187,0.18)',
          fontFamily: '"Inter",sans-serif',
          fontWeight: 600,
          '&:hover': { background: 'rgba(255,219,187,0.15)' },
        },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${WARM}, ${BROWN})`,
          color: '#fff',
          fontFamily: '"Manrope",sans-serif',
          fontWeight: 700,
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(10,7,4,0.92)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,219,187,0.08)',
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(13,10,7,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,219,187,0.08)',
          boxShadow: 'none',
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'rgba(20,14,8,0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,219,187,0.15)',
          color: CREAM,
          fontSize: '0.8rem',
          borderRadius: 8,
        },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(255,219,187,0.08)' } },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          transition: 'all 250ms cubic-bezier(0.22,1,0.36,1)',
          '&:hover': {
            background: 'rgba(255,219,187,0.07)',
          },
          '&.Mui-selected': {
            background: `linear-gradient(135deg, rgba(153,126,103,0.2), rgba(102,73,48,0.15))`,
            borderLeft: `3px solid ${WARM}`,
            '&:hover': { background: `rgba(153,126,103,0.25)` },
          },
        },
      },
    },

    MuiModal: {
      styleOverrides: {
        backdrop: { backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 9999, background: 'rgba(255,219,187,0.08)' },
        bar: { background: `linear-gradient(90deg, ${WARM}, ${BROWN})`, borderRadius: 9999 },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          color: '#7D6A5C',
          fontFamily: '"Manrope",sans-serif',
          fontWeight: 600,
          textTransform: 'none',
          '&.Mui-selected': { color: CREAM },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: { background: `linear-gradient(90deg, ${WARM}, ${BROWN})`, height: 3, borderRadius: 9999 },
      },
    },
  },
});

export default getTheme;
