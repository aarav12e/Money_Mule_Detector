import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { themes } from '../theme';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  // Check local storage for saved theme, default to 'darkCyber'
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('app_theme') || 'darkCyber';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', themeName);
  }, [themeName]);

  const toggleTheme = (newTheme) => {
    if (themes[newTheme]) {
      setThemeName(newTheme);
    }
  };

  const currentTheme = useMemo(() => themes[themeName], [themeName]);

  return (
    <ThemeContext.Provider value={{ themeName, toggleTheme, currentTheme }}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
