import React, { useState, useEffect, useRef } from 'react';
import './CharacterSpawner.css';

const GRAVITY = 0.25;
const ENERGY_LOSS = 0.85;
const FRICTION = 0.99;
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const EMOJIS = ['😀', '😍', '🚀', '🎉', '🌈', '✨', '💖', '🔥', '🎁', '🎮', '🍕', '🍦', '🦄', '🐱', '🐶', '🌟', '🌺', '🏆', '🎯', '🎨', '🎭', '🎼', '📱', '💻', '🎧'];
const FONTS = ['Roboto', 'Arial', 'Courier New', 'Georgia', 'Times New Roman'];
const LINK_DISTANCE = 30; // Distance between chain links
const CHARACTER_SIZE = 24; // Base size for characters in the chain

const getRandomCharacter = () => {
  // 40% chance to get an emoji, 60% chance to get a regular character
  if (Math.random() < 0.4) {
    return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  } else {
    return CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
};

const CharacterSpawner = () => {
  const [chain, setChain] = useState([]);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [isCreatingChain, setIsCreatingChain] = useState(false);
  const containerRef = useRef(null);
  
  // Create a new link for the chain
  const addChainLink = (x, y) => {
    const character = getRandomCharacter();
    
    setChain(prevChain => {
      // If this is the first link, initialize with no velocity
      if (prevChain.length === 0) {
        return [{
          id: Date.now(),
          x,
          y,
          vx: 0,
          vy: 0,
          character,
          font: selectedFont
        }];
      }
      
      // Add a new link to the existing chain
      return [...prevChain, {
        id: Date.now(),
        x,
        y,
        vx: 0,
        vy: 0,
        character,
        font: selectedFont
      }];
    });
  };
  
  // Start a new chain at the clicked position
  const handleMouseDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Reset the chain and start a new one
    setChain([]);
    setIsCreatingChain(true);
    addChainLink(x, y);
  };
  
  // Add a link to the chain when moving with mouse down
  const handleMouseMove = (e) => {
    if (!isCreatingChain) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only add a new link if we've moved far enough from the last link
    if (chain.length > 0) {
      const lastLink = chain[chain.length - 1];
      const dx = x - lastLink.x;
      const dy = y - lastLink.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= LINK_DISTANCE) {
        addChainLink(x, y);
      }
    }
  };
  
  // Release the chain to let it fall
  const handleMouseUp = () => {
    setIsCreatingChain(false);
    
    // Apply a small initial velocity to make the chain move
    if (chain.length > 0) {
      setChain(prevChain => {
        const updatedChain = [...prevChain];
        updatedChain[0] = {
          ...updatedChain[0],
          vx: Math.random() * 2 - 1,
          vy: -1 // Small upward boost
        };
        return updatedChain;
      });
    }
  };
  
  const handleFontChange = (digit) => {
    const fontIndex = parseInt(digit, 10) - 1;
    if (fontIndex >= 0 && fontIndex < FONTS.length) {
      setSelectedFont(FONTS[fontIndex]);
    }
  };

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [chain, isCreatingChain]);

  // Handle keyboard shortcuts for font changing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && !isNaN(e.key)) {
        handleFontChange(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Chain physics simulation
  useEffect(() => {
    if (chain.length === 0 || isCreatingChain) return;
    
    const updateChain = () => {
      setChain(prevChain => {
        if (prevChain.length === 0) return prevChain;
        
        const updatedChain = [...prevChain];
        const rect = containerRef.current.getBoundingClientRect();
        
        // Update the head of the chain with physics
        let head = updatedChain[0];
        
        // Apply gravity to the head
        head.vy += GRAVITY;
        
        // Apply velocity
        head.x += head.vx;
        head.y += head.vy;
        
        // Boundary collision for the head
        if (head.x < CHARACTER_SIZE/2) {
          head.x = CHARACTER_SIZE/2;
          head.vx = -head.vx * ENERGY_LOSS;
        } else if (head.x > rect.width - CHARACTER_SIZE/2) {
          head.x = rect.width - CHARACTER_SIZE/2;
          head.vx = -head.vx * ENERGY_LOSS;
        }
        
        if (head.y > rect.height - CHARACTER_SIZE/2) {
          head.y = rect.height - CHARACTER_SIZE/2;
          head.vy = -head.vy * ENERGY_LOSS;
          
          // Apply friction when on ground
          head.vx *= FRICTION;
        }
        
        // Update head
        updatedChain[0] = head;
        
        // Update the rest of the chain to follow the head with a string-like effect
        for (let i = 1; i < updatedChain.length; i++) {
          const prevLink = updatedChain[i - 1];
          const currentLink = updatedChain[i];
          
          // Calculate desired position (maintaining LINK_DISTANCE from previous link)
          const dx = currentLink.x - prevLink.x;
          const dy = currentLink.y - prevLink.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only adjust if links are too far apart
          if (distance > LINK_DISTANCE) {
            const ratio = LINK_DISTANCE / distance;
            
            // Calculate new position
            const targetX = prevLink.x + dx * ratio;
            const targetY = prevLink.y + dy * ratio;
            
            // Gradually move towards target position (creates more fluid motion)
            currentLink.x = currentLink.x * 0.8 + targetX * 0.2;
            currentLink.y = currentLink.y * 0.8 + targetY * 0.2;
          }
        }
        
        return updatedChain;
      });
      
      animationRef.current = requestAnimationFrame(updateChain);
    };
    
    const animationRef = { current: null };
    animationRef.current = requestAnimationFrame(updateChain);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chain.length, isCreatingChain]);

  return (
    <div
      ref={containerRef}
      className="character-chain-container"
      style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}
    >
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontSize: '14px', color: '#555' }}>
        Click and drag to create a character chain. Press Alt + a digit to change fonts.
      </div>
      
      {chain.map((link, index) => (
        <div
          key={link.id}
          style={{
            position: 'absolute',
            left: link.x,
            top: link.y,
            fontFamily: link.font,
            fontSize: `${CHARACTER_SIZE}px`,
            transform: 'translate(-50%, -50%)',
            transition: isCreatingChain ? 'none' : 'transform 0.05s ease-out',
            zIndex: chain.length - index // Higher index items are on top
          }}
        >
          {link.character}
        </div>
      ))}
    </div>
  );
};

export default CharacterSpawner;