import React, { useState, useEffect, useRef } from 'react';
import './TypeCaster.css';

const TypeCaster = () => {
  const [text, setText] = useState('');
  const [castText, setCastText] = useState([]);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Keep focus on the input even if user clicks elsewhere
  useEffect(() => {
    const container = containerRef.current;
    
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    if (container) {
      container.addEventListener('click', handleClick);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('click', handleClick);
      }
    };
  }, []);

  const handleTextChange = (e) => {
    // Get the last character typed
    const newChar = e.target.value.slice(-1);
    
    if (newChar) {
      castCharacter(newChar);
    }
    
    // Keep the input field empty for next character
    setText('');
  };

  const castCharacter = (char) => {
    // Calculate size based on character (optional - makes some characters bigger)
    const sizeMultiplier = Math.random() * 1.5 + 1.5; // 1.5x to 3x size
    
    const newChar = {
      id: `${char}-${Date.now()}-${Math.random()}`,
      value: char,
      x: Math.random() * 90 + 5, // Random position 5-95%
      y: -30, // Start above the visible area
      rotation: Math.random() * 360,
      speed: 1 + Math.random() * 1.5,
      size: sizeMultiplier,
      opacity: 0.9 + Math.random() * 0.1, // Slight opacity variation
    };
    
    setCastText(prev => [...prev, newChar]);
  };

  // Animation loop
  useEffect(() => {
    if (castText.length === 0) return;
    
    const interval = setInterval(() => {
      setCastText(prev => 
        prev
          .map(char => ({
            ...char,
            y: char.y + char.speed,
            rotation: char.rotation + (Math.random() * 2 - 1), // Slight rotation variation
            opacity: char.opacity > 0.3 ? char.opacity - 0.001 : char.opacity // Slow fade out
          }))
          .filter(char => char.y < 120) // Remove characters that have fallen off-screen
      );
    }, 30); // Smoother animation
    
    return () => clearInterval(interval);
  }, [castText]);

  return (
    <div className="type-caster-container" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={handleTextChange}
        className="invisible-input"
        autoFocus
      />
      
      <div className="cast-area">
        {castText.map(char => (
          <div 
            key={char.id}
            className="cast-char"
            style={{
              left: `${char.x}%`,
              top: `${char.y}%`,
              transform: `rotate(${char.rotation}deg)`,
              fontSize: `${char.size * 6}rem`, // Much larger characters
              opacity: char.opacity
            }}
          >
            {char.value}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TypeCaster;