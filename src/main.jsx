import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import App from './App';
import { ThemeProvider, useTheme } from './shared/context/ThemeContext';

// Import CSS files
import '@mantine/core/styles.css';
import './index.css'; // Global CSS
import './theme-override.css'; // Theme override styles

// Create a wrapper component that synchronizes themes
const AppWithMantineTheme = () => {
  const { theme } = useTheme();
  
  // Apply theme to document.documentElement when it changes
  useEffect(() => {
    // Set the data-theme attribute on document element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also apply theme to body element as an extra measure
    document.body.setAttribute('data-theme', theme);
    
    // Log to confirm the theme is changing
    console.log('Theme changed to:', theme);
  }, [theme]);
  
  // Update Mantine theme based on custom theme
  const mantineTheme = {
    colorScheme: theme, // Use theme from ThemeContext for Mantine
    globalStyles: (theme) => ({
      '*, *::before, *::after': {
        boxSizing: 'border-box',
      },
      body: {
        // Ensure scrolling is enabled
        overflowY: 'auto',
        height: '100%',
      },
      html: {
        height: '100%',
      }
    }),
  };

  return (
    <MantineProvider
      theme={mantineTheme}
      withNormalizeCSS
    >
      <App />
    </MantineProvider>
  );
};

// Find your root DOM element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AppWithMantineTheme />
    </ThemeProvider>
  </React.StrictMode>
);
