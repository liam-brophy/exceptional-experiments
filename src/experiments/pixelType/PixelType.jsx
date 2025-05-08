import React, { useState, useRef, useEffect } from 'react';
import './PixelType.css';

// Character mappings for a 5x7 pixel grid font (Argent Pixel-inspired)
// 1 represents a filled pixel, 0 represents an empty pixel
const PIXEL_CHARACTERS = {
  'A': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,1,1,1,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1
  ],
  'B': [
    1,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,1,1,1,0
  ],
  'C': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,0,
    1,0,0,0,0,
    1,0,0,0,0,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  'D': [
    1,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,1,1,1,0
  ],
  'E': [
    1,1,1,1,1,
    1,0,0,0,0,
    1,0,0,0,0,
    1,1,1,1,0,
    1,0,0,0,0,
    1,0,0,0,0,
    1,1,1,1,1
  ],
  'F': [
    1,1,1,1,1,
    1,0,0,0,0,
    1,0,0,0,0,
    1,1,1,1,0,
    1,0,0,0,0,
    1,0,0,0,0,
    1,0,0,0,0
  ],
  'G': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,0,
    1,0,1,1,1,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  'H': [
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,1,1,1,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1
  ],
  'I': [
    1,1,1,1,1,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    1,1,1,1,1
  ],
  'J': [
    0,0,0,0,1,
    0,0,0,0,1,
    0,0,0,0,1,
    0,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  'K': [
    1,0,0,0,1,
    1,0,0,1,0,
    1,0,1,0,0,
    1,1,0,0,0,
    1,0,1,0,0,
    1,0,0,1,0,
    1,0,0,0,1
  ],
  'L': [
    1,0,0,0,0,
    1,0,0,0,0,
    1,0,0,0,0,
    1,0,0,0,0,
    1,0,0,0,0,
    1,0,0,0,0,
    1,1,1,1,1
  ],
  'M': [
    1,0,0,0,1,
    1,1,0,1,1,
    1,0,1,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1
  ],
  'N': [
    1,0,0,0,1,
    1,1,0,0,1,
    1,0,1,0,1,
    1,0,0,1,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1
  ],
  'O': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  'P': [
    1,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,1,1,1,0,
    1,0,0,0,0,
    1,0,0,0,0,
    1,0,0,0,0
  ],
  'Q': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,1,0,1,
    1,0,0,1,0,
    0,1,1,0,1
  ],
  'R': [
    1,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    1,1,1,1,0,
    1,0,1,0,0,
    1,0,0,1,0,
    1,0,0,0,1
  ],
  'S': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,0,
    0,1,1,1,0,
    0,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  'T': [
    1,1,1,1,1,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0
  ],
  'U': [
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  'V': [
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,0,1,0,
    0,0,1,0,0
  ],
  'W': [
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,0,0,1,
    1,0,1,0,1,
    1,1,0,1,1,
    1,0,0,0,1
  ],
  'X': [
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,0,1,0,
    0,0,1,0,0,
    0,1,0,1,0,
    1,0,0,0,1,
    1,0,0,0,1
  ],
  'Y': [
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,0,1,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0
  ],
  'Z': [
    1,1,1,1,1,
    0,0,0,0,1,
    0,0,0,1,0,
    0,0,1,0,0,
    0,1,0,0,0,
    1,0,0,0,0,
    1,1,1,1,1
  ],
  '0': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,1,1,
    1,0,1,0,1,
    1,1,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  '1': [
    0,0,1,0,0,
    0,1,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,1,1,1,0
  ],
  '2': [
    0,1,1,1,0,
    1,0,0,0,1,
    0,0,0,0,1,
    0,0,0,1,0,
    0,0,1,0,0,
    0,1,0,0,0,
    1,1,1,1,1
  ],
  '3': [
    0,1,1,1,0,
    1,0,0,0,1,
    0,0,0,0,1,
    0,0,1,1,0,
    0,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  '4': [
    0,0,0,1,0,
    0,0,1,1,0,
    0,1,0,1,0,
    1,0,0,1,0,
    1,1,1,1,1,
    0,0,0,1,0,
    0,0,0,1,0
  ],
  '5': [
    1,1,1,1,1,
    1,0,0,0,0,
    1,1,1,1,0,
    0,0,0,0,1,
    0,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  '6': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,0,
    1,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  '7': [
    1,1,1,1,1,
    0,0,0,0,1,
    0,0,0,1,0,
    0,0,1,0,0,
    0,1,0,0,0,
    0,1,0,0,0,
    0,1,0,0,0
  ],
  '8': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  '9': [
    0,1,1,1,0,
    1,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,1,
    0,0,0,0,1,
    1,0,0,0,1,
    0,1,1,1,0
  ],
  ' ': [
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0
  ],
  '.': [
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,1,0,0,0
  ],
  ',': [
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,1,0,0,
    0,1,0,0,0
  ],
  '!': [
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,0,0,0,
    0,0,1,0,0
  ],
  '?': [
    0,1,1,1,0,
    1,0,0,0,1,
    0,0,0,0,1,
    0,0,0,1,0,
    0,0,1,0,0,
    0,0,0,0,0,
    0,0,1,0,0
  ],
  ':': [
    0,0,0,0,0,
    0,0,1,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,1,0,0,
    0,0,0,0,0
  ],
  ';': [
    0,0,0,0,0,
    0,0,1,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,1,0,0,
    0,1,0,0,0
  ],
  '-': [
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,1,1,1,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0
  ],
  '+': [
    0,0,0,0,0,
    0,0,1,0,0,
    0,0,1,0,0,
    1,1,1,1,1,
    0,0,1,0,0,
    0,0,1,0,0,
    0,0,0,0,0
  ],
  '_': [
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    0,0,0,0,0,
    1,1,1,1,1
  ]
};

// Default character mapping for unsupported characters
const DEFAULT_CHAR = [
  0,1,1,1,0,
  1,0,0,0,0,
  0,1,1,0,0,
  0,0,0,1,0,
  0,0,0,0,1,
  1,0,0,0,1,
  0,1,1,1,0
];

// Get character mapping with fallback to default
const getCharacterMapping = (char) => {
  const upperChar = char.toUpperCase();
  return PIXEL_CHARACTERS[upperChar] || DEFAULT_CHAR;
};

// Simplified color palette - just two alternating colors
const COLORS = ['primary', 'secondary'];

const PixelType = () => {
  const [text, setText] = useState('');
  const [characters, setCharacters] = useState([]);
  const [fontStyle, setFontStyle] = useState('default');
  const displayRef = useRef(null);
  
  // Handle text input change with real-time update
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Update characters array for display with off-white color
    const updatedCharacters = newText.split('').map((char, index) => ({
      id: `char-${index}-${Date.now()}`,
      value: char,
      timestamp: Date.now() + index, // For animation sequencing
      index: index // Store position for wave effect
    }));
    
    setCharacters(updatedCharacters);
  };

  // Toggle between different font styles
  const toggleFontStyle = () => {
    const styles = ['default', 'style-alt', 'style-alt2', 'style-alt3', 'style-alt4'];
    const currentIndex = styles.indexOf(fontStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setFontStyle(styles[nextIndex]);
  };

  // Create pixel grid for a character with dynamic, evolving animation
  const createPixelGrid = (char, timestamp, charIndex) => {
    const mapping = getCharacterMapping(char);
    const pixels = [];
    
    for (let i = 0; i < mapping.length; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      
      // Create a wave-like animation pattern
      // That varies based on character position and pixel position
      const baseDelay = charIndex * 0.05; // Slight delay between characters
      
      // Wave pattern - pixels animate from top-left to bottom-right
      const wavePosition = (row + col) / 10;
      const pixelDelay = (baseDelay + wavePosition).toFixed(2);
      
      // For filled pixels, we'll add extra animation
      if (mapping[i] === 1) {
        pixels.push(
          <div 
            key={`${timestamp}-pixel-${i}`} 
            className="pixel-dot filled"
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
              animationDelay: `${pixelDelay}s, ${pixelDelay + 0.5}s` // Delays for appear and pulse animations
            }} 
          />
        );
      } else {
        // Empty pixels still take up space but are invisible
        pixels.push(
          <div 
            key={`${timestamp}-pixel-${i}`} 
            className="pixel-dot empty"
            style={{
              gridRow: row + 1,
              gridColumn: col + 1
            }} 
          />
        );
      }
    }
    
    return pixels;
  };

  // Auto-scroll to keep the latest characters in view
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [characters]);
  
  return (
    <div className={`pixel-type-container ${fontStyle}`}>
      <div className="instructions">
        Type to see the text appear with pixel animations!
      </div>
      
      <button className="style-button" onClick={toggleFontStyle}>
        Change Font Style
      </button>
      
      <div className="display-area" ref={displayRef}>
        <div className="pixel-text">
          {characters.map((char, idx) => (
            <div 
              key={char.id} 
              className="pixel-character"
              style={{
                animationDelay: `${idx * 0.05}s` // Cascade the character appearances
              }}
            >
              <div className={`pixel-grid`}>
                {createPixelGrid(char.value, char.timestamp, idx)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          className="text-input"
          placeholder="Type to see pixel animations..."
          autoFocus
        />
      </div>
    </div>
  );
};

export default PixelType;