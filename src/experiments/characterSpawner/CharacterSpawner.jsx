import React, { useState, useEffect, useRef } from 'react';
import './CharacterSpawner.css';

const GRAVITY = 0.98; // Gravity constant
const ENERGY_LOSS = 0.8; // Bounce elasticity
const FRICTION = 0.99; // Air resistance
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const EMOJIS = ['😀', '😍', '🚀', '🎉', '🌈', '✨', '💖', '🔥', '🎁', '🎮', '🍕', '🍦', '🦄', '🐱', '🐶', '🌟', '🌺', '🏆', '🎯', '🎨', '🎭', '🎼', '📱', '💻', '🎧'];
const FONTS = ['Roboto', 'Arial', 'Courier New', 'Georgia', 'Times New Roman'];
const CONFETTI_COLORS = [
  '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
  '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', 
  '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', 
  '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
];
const CONFETTI_SHAPES = ['square', 'circle', 'triangle'];
const MIN_CONFETTI_COUNT = 10; // Minimum confetti pieces for a short click
const MAX_CONFETTI_COUNT = 60; // Maximum confetti pieces for a long hold
const CONFETTI_LIFETIME = 5000; // Increased lifetime of confetti in milliseconds (was 2000)

const getRandomCharacter = () => {
  // 40% chance to get an emoji, 60% chance to get a regular character
  if (Math.random() < 0.4) {
    return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  } else {
    return CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
};

const CharacterSpawner = () => {
  const [balls, setBalls] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const [holdIndicator, setHoldIndicator] = useState(null);
  const [keyHoldStart, setKeyHoldStart] = useState(null);
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const containerRef = useRef(null);
  const holdStartRef = useRef(null);

  // Generate a random confetti piece
  const createConfettiPiece = (x, y) => {
    const randomColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const randomShape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
    const angle = Math.random() * Math.PI * 2; // Random angle for direction
    const speed = Math.random() * 0.8 + 0.2; // Dramatically reduced speed between 0.2 and 1 (was 1-3)
    
    return {
      id: `confetti-${Date.now()}-${Math.random()}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5, // Very gentle initial upward boost (was -1)
      size: Math.random() * 6 + 4, // Size between 4 and 10 pixels
      color: randomColor,
      shape: randomShape,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() * 2 - 1) * 0.5, // Very slow rotation (was 10-5)
      createdAt: Date.now(),
      wobbleOffset: Math.random() * Math.PI * 2, // Random starting phase for wobble
      wobbleSpeed: Math.random() * 0.02 + 0.01, // Slow wobble speed
    };
  };

  // Spawn confetti at a given position
  const spawnConfetti = (x, y, holdDuration) => {
    const confettiCount = Math.min(
      MAX_CONFETTI_COUNT,
      Math.max(MIN_CONFETTI_COUNT, Math.floor((holdDuration / 1000) * MAX_CONFETTI_COUNT))
    );
    const newConfetti = Array(confettiCount)
      .fill(null)
      .map(() => createConfettiPiece(x, y));
    
    setConfetti(prev => [...prev, ...newConfetti]);
    
    // Clean up confetti after its lifetime
    setTimeout(() => {
      setConfetti(prev => prev.filter(c => c.createdAt > Date.now() - CONFETTI_LIFETIME));
    }, CONFETTI_LIFETIME);
  };

  const spawnBall = (character, x, y, holdDuration) => {
    const newBall = {
      id: Date.now(),
      x,
      y,
      vx: Math.random() * 4 - 2, // Random initial velocity x
      vy: Math.random() * 4 - 2, // Random initial velocity y
      radius: Math.min(Math.max(10, holdDuration / 50), 200), // Radius increases with hold duration, capped at 200 (was 50)
      character,
      font: selectedFont,
    };
    setBalls((prevBalls) => [...prevBalls, newBall]);
    
    // Spawn confetti when a character is spawned
    spawnConfetti(x, y, holdDuration);
  };

  const handleMouseDown = (e) => {
    holdStartRef.current = Date.now();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoldIndicator({ x, y, radius: 10 });
  };

  const handleMouseUp = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const holdDuration = holdStartRef.current ? Date.now() - holdStartRef.current : 0;
    spawnBall(getRandomCharacter(), x, y, holdDuration);
    setHoldIndicator(null); // Remove hold indicator
    holdStartRef.current = null; // Reset hold start time
  };

  const handleKeyDown = (e) => {
    if (!keyHoldStart) {
      setKeyHoldStart({ key: e.key, startTime: Date.now() });
    }
  };

  const handleKeyUp = (e) => {
    if (keyHoldStart && keyHoldStart.key === e.key) {
      const holdDuration = Date.now() - keyHoldStart.startTime;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.random() * rect.width; // Random horizontal position
      const y = Math.random() * rect.height; // Random vertical position
      spawnBall(e.key, x, y, holdDuration);
      setKeyHoldStart(null);
    }
  };

  const handleFontChange = (digit) => {
    const fontIndex = parseInt(digit, 10) - 1;
    if (fontIndex >= 0 && fontIndex < FONTS.length) {
      setSelectedFont(FONTS[fontIndex]);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);

      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyHoldStart]);

  useEffect(() => {
    if (holdIndicator) {
      const interval = setInterval(() => {
        setHoldIndicator((prev) => {
          if (!prev) return null;
          return { ...prev, radius: Math.min(prev.radius + 1, 200) }; // Cap radius at 200 (was 50)
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [holdIndicator]);

  useEffect(() => {
    const updateBalls = () => {
      setBalls((prevBalls) => {
        const updatedBalls = prevBalls.map((ball) => {
          let { x, y, vx, vy, radius } = ball;

          // Apply gravity
          vy += GRAVITY;

          // Apply velocity
          x += vx;
          y += vy;

          // Collision with boundaries
          const rect = containerRef.current.getBoundingClientRect();
          if (x - radius < 0 || x + radius > rect.width) {
            vx = -vx * ENERGY_LOSS;
            x = x - radius < 0 ? radius : rect.width - radius;
          }
          if (y + radius > rect.height) {
            vy = 0; // Stop vertical movement
            y = rect.height - radius; // Align to the bottom boundary
          }

          // Apply friction
          vx *= FRICTION;
          vy *= FRICTION;

          return { ...ball, x, y, vx, vy };
        });

        // Handle stacking logic
        for (let i = 0; i < updatedBalls.length; i++) {
          for (let j = 0; j < updatedBalls.length; j++) {
            if (i !== j) {
              const ballA = updatedBalls[i];
              const ballB = updatedBalls[j];

              // Check if ballA is directly above ballB and overlapping
              if (
                Math.abs(ballA.x - ballB.x) < Math.max(ballA.radius, ballB.radius) &&
                ballA.y + ballA.radius > ballB.y - ballB.radius &&
                ballA.y < ballB.y
              ) {
                // Adjust ballA to sit on top of ballB
                ballA.y = ballB.y - ballB.radius - ballA.radius;
                ballA.vy = 0; // Stop vertical movement
              }
            }
          }
        }

        return updatedBalls;
      });
      requestAnimationFrame(updateBalls);
    };

    const animationId = requestAnimationFrame(updateBalls);
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && !isNaN(e.key)) { // Changed from Cmd to Alt for safer option
        handleFontChange(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const updateConfetti = () => {
      setConfetti((prevConfetti) => {
        return prevConfetti.map((piece) => {
          let { x, y, vx, vy, rotation, rotationSpeed, wobbleOffset, wobbleSpeed } = piece;

          // Apply extremely reduced gravity for ultra-slow falling
          vy += GRAVITY * 0.005; // Dramatically reduced gravity (was 0.02)

          // Apply slow air resistance
          vx *= 0.995; // Slower horizontal deceleration
          vy *= 0.995; // Slower vertical deceleration

          // Add gentle wobble movement for dreamy effect
          const wobble = Math.sin(wobbleOffset) * 0.1;
          wobbleOffset += wobbleSpeed;
          
          // Apply velocity with wobble
          x += vx + wobble;
          y += vy;

          // Apply slow rotation
          rotation += rotationSpeed;

          return { ...piece, x, y, vx, vy, rotation, wobbleOffset };
        });
      });
      requestAnimationFrame(updateConfetti);
    };

    const animationId = requestAnimationFrame(updateConfetti);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="low-poly-map"
      style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}
    >
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontSize: '14px', color: '#555' }}>
        Press Alt + a digit to change fonts
      </div>

      {holdIndicator && (
        <div
          style={{
            position: 'absolute',
            left: holdIndicator.x,
            top: holdIndicator.y,
            width: `${holdIndicator.radius * 2}px`,
            height: `${holdIndicator.radius * 2}px`,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            transform: 'translate(-50%, -50%)',
          }}
        ></div>
      )}
      {balls.map((ball) => (
        <div
          key={ball.id}
          style={{
            position: 'absolute',
            left: ball.x,
            top: ball.y,
            fontFamily: ball.font,
            fontSize: `${ball.radius * 2}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {ball.character}
        </div>
      ))}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: piece.x,
            top: piece.y,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `translate(-50%, -50%) rotate(${piece.rotation}deg)`,
            borderRadius: piece.shape === 'circle' ? '50%' : '0',
            clipPath: piece.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
          }}
        ></div>
      ))}
    </div>
  );
};

export default CharacterSpawner;