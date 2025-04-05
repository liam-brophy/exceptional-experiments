import React from 'react';
import ReactDOM from 'react-dom/client'; // Use 'react-dom/client' for React 18+
import { MantineProvider } from '@mantine/core';
import App from './App'; // Your main application component

// 1. Import Mantine core styles - REQUIRED
import '@mantine/core/styles.css';

// Optional: You might import other Mantine CSS modules if you use specific components
// like Notifications or CodeHighlight later
// import '@mantine/notifications/styles.css';

// Optional: Define a custom theme override object
const myCustomTheme = {
  // colorScheme: 'dark', // Force dark mode (or 'light', or 'auto')
  // primaryColor: 'violet', // Change the primary accent color
  // fontFamily: 'Verdana, sans-serif',
  // Add more overrides like default component props, radii, spacing, etc.
  // See Mantine theming docs: https://mantine.dev/theming/theme-object/
};

// Find your root DOM element (usually <div id="root"> in index.html)
const rootElement = document.getElementById('root');
// Add 'as HTMLElement' if using TypeScript: const rootElement = document.getElementById('root') as HTMLElement;

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* 2. Wrap your App with MantineProvider */}
    <MantineProvider
      theme={myCustomTheme} // Pass your theme object (optional)
      withGlobalStyles // Adds Mantine's global styles (recommended)
      withNormalizeCSS // Adds CSS normalization (recommended)
    >
      {/* If using React Router, BrowserRouter usually goes here, INSIDE MantineProvider */}
      {/* <BrowserRouter> */}
        <App />
      {/* </BrowserRouter> */}
    </MantineProvider>
  </React.StrictMode>
);
