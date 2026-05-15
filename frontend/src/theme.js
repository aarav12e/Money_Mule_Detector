import { createTheme } from '@mui/material/styles';

const darkCyberPalette = {
  mode: 'dark',
  primary: { main: '#00ff88', contrastText: '#050a0e' },
  secondary: { main: '#00ccff', contrastText: '#050a0e' },
  background: { default: '#050a0e', paper: '#0d1f35' },
  text: { primary: '#e2f0ff', secondary: '#88a0b5' },
  error: { main: '#ff3355' },
  warning: { main: '#ffaa00' },
  success: { main: '#00ff88' },
  divider: '#1a3354',
};

const lightCorporatePalette = {
  mode: 'light',
  primary: { main: '#1976d2', contrastText: '#ffffff' },
  secondary: { main: '#424242', contrastText: '#ffffff' },
  background: { default: '#f4f6f8', paper: '#ffffff' },
  text: { primary: '#1a2027', secondary: '#5e6c77' },
  error: { main: '#d32f2f' },
  warning: { main: '#ed6c02' },
  success: { main: '#2e7d32' },
  divider: '#e0e0e0',
};

const midnightVioletPalette = {
  mode: 'dark',
  primary: { main: '#b388ff', contrastText: '#000000' },
  secondary: { main: '#ff4081', contrastText: '#ffffff' },
  background: { default: '#0f0c29', paper: '#1a183a' },
  text: { primary: '#f3e5f5', secondary: '#bcaaa4' },
  error: { main: '#f44336' },
  warning: { main: '#ff9800' },
  success: { main: '#4caf50' },
  divider: '#2d275a',
};

const typography = {
  fontFamily: '"Space Grotesk", "Inter", sans-serif',
  h1: { fontWeight: 700 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 600 },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  button: { textTransform: 'none', fontWeight: 600 },
};

const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: 'none',
      },
    },
  },
};

export const themes = {
  darkCyber: createTheme({ palette: darkCyberPalette, typography, components }),
  lightCorporate: createTheme({ palette: lightCorporatePalette, typography, components }),
  midnightViolet: createTheme({ palette: midnightVioletPalette, typography, components }),
};
