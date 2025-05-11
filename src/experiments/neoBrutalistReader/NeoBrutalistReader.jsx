import React, { useState, useEffect } from 'react';
import './NeoBrutalistReader.css';

const NeoBrutalistReader = () => {
  // States for various toggles and controls
  const [fontFamily, setFontFamily] = useState('Inter, serif');
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [darkMode, setDarkMode] = useState(false);
  const [textAlign, setTextAlign] = useState('justify');
  const [showSidebar, setShowSidebar] = useState(true);
  const [themeColor, setThemeColor] = useState('#FFFFFF'); // Default background color
  
  // Removed the themeColors array as we'll use a color picker instead

  // Color palettes for button groups - using light/dark variations of same colors
  const colors = {
    fontFamily: {
      light: '#7986CB', // Light indigo
      dark: '#3F51B5'   // Dark indigo
    },
    fontSize: {
      light: '#EF9A9A', // Light red
      dark: '#F44336'   // Dark red
    },
    lineHeight: {
      light: '#80CBC4', // Light teal
      dark: '#009688'   // Dark teal
    },
    textAlign: {
      light: '#A5D6A7', // Light green
      dark: '#4CAF50'   // Dark green
    }
  };

  // Update CSS variable when theme color changes
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

  // Sample text content - refined with proper spacing for justified text
  const sampleText = `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eget urna ac magna dignissim gravida. 
    Nullam consectetur justo eget metus interdum, at dapibus felis dictum. Vivamus non orci in ligula convallis 
    ultrices. Proin at semper nulla, sed tincidunt urna. Nullam eget libero ultricies, hendrerit justo at, 
    mattis odio. Phasellus finibus libero vel mauris interdum, sed vestibulum nibh elementum.

    Cras in metus viverra, varius orci vel, vehicula nisi. Nulla facilisi. Curabitur euismod, lectus in 
    fringilla lobortis, dui orci elementum mauris, vel ornare tortor eros quis est. Quisque et maximus eros. 
    In hac habitasse platea dictumst. Ut feugiat, nisl at pharetra commodo, risus nunc vehicula lorem, 
    in fermentum est odio in elit.
    
    Vivamus consequat metus ut quam eleifend, nec tristique nunc efficitur. Donec congue vel augue vel posuere. 
    Cras id faucibus orci. Fusce vel rhoncus nisi. Proin viverra lorem a diam consequat, et maximus nibh tempor. 
    In hac habitasse platea dictumst.
    
    Neo-Brutalism is characterized by the use of stark contrasts, bold geometry, and raw materials. 
    It emphasizes directness, functionality, and a sense of honesty in construction. This reader 
    exemplifies these principles through its heavy borders, sharp right angles, and bold typography.
    
    The simplicity of the design enhances the reading experience by eliminating unnecessary distractions 
    while providing essential customization options. Color plays a significant role in Neo-Brutalist 
    design, with primary colors often used to add visual interest to otherwise stark compositions.
  `;

  // Toggle functions
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  // Font size handlers
  const increaseFontSize = () => setFontSize(prev => prev + 2);
  const decreaseFontSize = () => setFontSize(prev => Math.max(12, prev - 2));

  // Line height handlers
  const increaseLineHeight = () => setLineHeight(prev => Math.min(3, prev + 0.1));
  const decreaseLineHeight = () => setLineHeight(prev => Math.max(1, prev - 0.1));

  // Font family options now all include Inter as base
  const fontOptions = {
    'Inter, serif': 'Serif',
    'Inter, sans-serif': 'Sans-Serif',
    'Inter, monospace': 'Monospace'
  };

  return (
    <div className="neo-brutalist-reader-experiment">
      <div 
        className={`neo-brutalist-container ${darkMode ? 'dark-mode' : ''}`}
        style={{ 
          '--theme-color': darkMode ? '#000000' : themeColor,
          '--text-color': darkMode ? '#FFFFFF' : '#000000'
        }}
      >
        <header className="neo-header">
          <h1>Neo Brutalist Reader</h1>
          <div className="header-controls">
            {/* Color picker */}
            <div className="color-picker-container">
              <input 
                type="color"
                value={themeColor}
                onChange={(e) => !darkMode && setThemeColor(e.target.value)}
                disabled={darkMode}
                className="color-picker"
                title="Choose interface color"
              />
            </div>
            
            <button 
              className="neo-button" 
              onClick={toggleDarkMode}
              style={{ backgroundColor: darkMode ? '#FFFFFF' : '#000000', color: darkMode ? '#000000' : '#FFFFFF' }}
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        <div className="neo-reader-layout">
          {showSidebar && (
            <aside className="neo-sidebar">
              <div className="sidebar-header">
                <button 
                  className="neo-button toggle-sidebar" 
                  onClick={toggleSidebar}
                  style={{ backgroundColor: darkMode ? '#444444' : '#DDDDDD' }} 
                >
                  ◀
                </button>
              </div>

              <div className="control-section">
                {/* Font family controls */}
                <div className="control-group">
                  <h3>Font Family</h3>
                  <div className="neo-buttons-row">
                    {Object.entries(fontOptions).map(([value, label], index) => {
                      // Alternate between light and dark variations
                      const colorKey = index % 2 === 0 ? 'light' : 'dark';
                      return (
                        <button 
                          key={value}
                          className={`neo-button ${fontFamily === value ? 'active' : ''}`} 
                          onClick={() => setFontFamily(value)}
                          style={{ 
                            backgroundColor: fontFamily === value 
                              ? '#000000' 
                              : colors.fontFamily[colorKey]
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Font size controls */}
                <div className="control-group">
                  <h3>Font Size: {fontSize}px</h3>
                  <div className="neo-buttons-row">
                    <button 
                      className="neo-button" 
                      onClick={decreaseFontSize}
                      style={{ backgroundColor: colors.fontSize.dark }}
                    >
                      A-
                    </button>
                    <button 
                      className="neo-button" 
                      onClick={increaseFontSize}
                      style={{ backgroundColor: colors.fontSize.light }}
                    >
                      A+
                    </button>
                  </div>
                  <div className="neo-slider-container">
                    <input 
                      type="range" 
                      min="12" 
                      max="36" 
                      value={fontSize} 
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="neo-slider"
                      style={{ borderColor: darkMode ? '#FFFFFF' : '#000000' }}
                    />
                  </div>
                </div>
                
                {/* Line height controls */}
                <div className="control-group">
                  <h3>Line Height: {lineHeight.toFixed(1)}</h3>
                  <div className="neo-buttons-row">
                    <button 
                      className="neo-button" 
                      onClick={decreaseLineHeight}
                      style={{ backgroundColor: colors.lineHeight.dark }}
                    >
                      -
                    </button>
                    <button 
                      className="neo-button" 
                      onClick={increaseLineHeight}
                      style={{ backgroundColor: colors.lineHeight.light }}
                    >
                      +
                    </button>
                  </div>
                  <div className="neo-slider-container">
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.1" 
                      value={lineHeight} 
                      onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                      className="neo-slider"
                      style={{ borderColor: darkMode ? '#FFFFFF' : '#000000' }}
                    />
                  </div>
                </div>
                
                {/* Text alignment controls */}
                <div className="control-group">
                  <h3>Text Alignment</h3>
                  <div className="neo-buttons-row">
                    {['left', 'center', 'right', 'justify'].map((align, index) => {
                      // Alternate between light and dark variations
                      const colorKey = index % 2 === 0 ? 'light' : 'dark';
                      return (
                        <button 
                          key={align}
                          className={`neo-button ${textAlign === align ? 'active' : ''}`} 
                          onClick={() => setTextAlign(align)}
                          style={{ 
                            backgroundColor: textAlign === align 
                              ? '#000000' 
                              : colors.textAlign[colorKey]
                          }}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          )}

          <main className="neo-content">
            {!showSidebar && (
              <button 
                className="neo-button toggle-sidebar show" 
                onClick={toggleSidebar}
                style={{ backgroundColor: darkMode ? '#444444' : '#DDDDDD' }}
              >
                ▶
              </button>
            )}
            <div 
              className="reading-area"
              style={{ 
                fontFamily, 
                fontSize: `${fontSize}px`, 
                lineHeight, 
                textAlign
              }}
            >
              {sampleText}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default NeoBrutalistReader;