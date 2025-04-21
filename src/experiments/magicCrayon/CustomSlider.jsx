import React, { useState, useRef, useEffect } from 'react';
import './MagicCrayon.css';

const CustomSlider = ({ value, onChange, min, max, label, step = 1, color = '#FFFFFF' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const [localValue, setLocalValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(value);
  const [wobble, setWobble] = useState(false);
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Animate value changes
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      // Smoothly animate the visual value towards the actual value
      if (animatedValue !== localValue) {
        setAnimatedValue(prev => {
          const diff = localValue - prev;
          const increment = diff * 0.3;
          return Math.abs(increment) < 0.1 ? localValue : prev + increment;
        });
      }
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [localValue, animatedValue]);

  // Calculate percentage for handle position
  const getPercentage = (val) => {
    return ((val - min) / (max - min)) * 100;
  };

  // Calculate new value based on mouse/touch position
  const calculateNewValue = (clientX) => {
    const track = trackRef.current;
    if (!track) return value;
    
    const trackRect = track.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const offset = clientX - trackRect.left;
    
    // Calculate percentage and new value
    let percentage = Math.min(Math.max(offset / trackWidth, 0), 1);
    let newValue = Math.round((percentage * (max - min) + min) / step) * step;
    
    // Ensure the new value is within bounds
    newValue = Math.min(Math.max(newValue, min), max);
    
    return newValue;
  };

  // Handle mouse down on track or handle
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Calculate new value based on where the user clicked
    const newValue = calculateNewValue(e.clientX);
    if (newValue !== localValue) {
      setWobble(true);
      setTimeout(() => setWobble(false), 500);
    }
    
    setLocalValue(newValue);
    onChange(newValue);
    
    // Add event listeners for drag and release
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse move during drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newValue = calculateNewValue(e.clientX);
    if (Math.abs(newValue - localValue) >= step) {
      // If value changed significantly, add wobble effect
      if (!wobble) {
        setWobble(true);
        setTimeout(() => setWobble(false), 300);
      }
      
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  // Handle mouse up to end drag
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Handle keyboard accessibility
  const handleKeyDown = (e) => {
    let newValue = localValue;
    
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(localValue + step, max);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(localValue - step, min);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }
    
    if (newValue !== localValue) {
      setWobble(true);
      setTimeout(() => setWobble(false), 500);
      setLocalValue(newValue);
      onChange(newValue);
    }
    e.preventDefault();
  };

  // Generate particles for the track
  const renderParticles = () => {
    if (!isHovered && !isDragging) return null;
    
    const percentage = getPercentage(localValue);
    const particles = [];
    
    for (let i = 0; i < 3; i++) {
      const left = `${Math.min(95, Math.max(5, percentage + (Math.random() * 10 - 5)))}%`;
      const delay = Math.random() * 0.5;
      particles.push(
        <div 
          key={i}
          className="slider-particle"
          style={{
            left,
            animationDelay: `${delay}s`,
            opacity: Math.random() * 0.7 + 0.3
          }}
        />
      );
    }
    
    return particles;
  };

  // Divide the track into segments for a more interesting look
  const renderTrackSegments = () => {
    const segments = [];
    const segmentCount = 20;
    
    for (let i = 0; i < segmentCount; i++) {
      const isActive = (i / segmentCount) * 100 <= getPercentage(animatedValue);
      segments.push(
        <div 
          key={i}
          className={`track-segment ${isActive ? 'active' : ''}`}
          style={{
            left: `${(i / segmentCount) * 100}%`,
            animationDelay: `${i * 0.03}s`
          }}
        />
      );
    }
    
    return segments;
  };

  return (
    <div 
      className="custom-slider-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="custom-slider-label">
        {label}
        <span className={`value-display ${wobble ? 'wobble' : ''}`} style={{ background: `rgba(${hexToRgbString(color, 0.3)})` }}>
          {localValue}
        </span>
      </div>
      
      <div 
        className={`custom-slider-track ${isDragging ? 'dragging' : ''} ${isHovered ? 'hovered' : ''}`}
        ref={trackRef}
        onMouseDown={handleMouseDown}
      >
        {renderTrackSegments()}
        
        <div 
          className="custom-slider-fill" 
          style={{ 
            width: `${getPercentage(animatedValue)}%`,
            background: `linear-gradient(90deg, rgba(${hexToRgbString(color, 0.2)}), rgba(${hexToRgbString(color, 0.4)}))`
          }}
        />
        
        {renderParticles()}
        
        <div 
          className={`custom-slider-handle ${isDragging ? 'dragging' : ''} ${wobble ? 'wobble' : ''}`}
          style={{ left: `${getPercentage(animatedValue)}%` }}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localValue}
          aria-label={label}
        >
          <div className="handle-core" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}, 0 0 5px rgba(0, 0, 0, 0.2)` }}></div>
          <div className="handle-pulse" style={{ borderColor: color }}></div>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert hex to rgb string for rgba usage
const hexToRgbString = (hex, alpha = 1) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255, 255, 255';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return alpha !== undefined ? `${r}, ${g}, ${b}, ${alpha}` : `${r}, ${g}, ${b}`;
};

export default CustomSlider;