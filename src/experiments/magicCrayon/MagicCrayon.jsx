import React, { useRef, useEffect, useState } from 'react';
import './MagicCrayon.css';
import p5 from 'p5';
import CustomSlider from './CustomSlider';

const MagicCrayon = () => {
  const sketchRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const [brushSize, setBrushSize] = useState(25);
  const [fadeSpeed, setFadeSpeed] = useState(5);
  const [controlsVisible, setControlsVisible] = useState(true);
  
  // Color state management with single recentColors array
  const [currentColorHex, setCurrentColorHex] = useState('#FFFFFF');
  const [backgroundColorHex, setBackgroundColorHex] = useState('#121212');
  const [recentColors, setRecentColors] = useState(['#FFFFFF', '#CCCCCC', '#888888', '#444444', '#000000', '#121212']);
  
  // Toggle controls visibility
  const toggleControls = () => {
    setControlsVisible(prev => !prev);
  };

  // Helper functions for color conversion
  const hexToRgb = (hex) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return [r, g, b];
  };

  const rgbToHex = (r, g, b) => {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Add a new color to recent colors history - shared between brush and background
  const addToRecentColors = (colorHex) => {
    setRecentColors(prevColors => {
      const filteredColors = prevColors.filter(c => c !== colorHex);
      return [colorHex, ...filteredColors].slice(0, 12);
    });
  };

  // Handle brush color change
  const handleBrushColorChange = (colorHex) => {
    setCurrentColorHex(colorHex);
    addToRecentColors(colorHex);
  };

  // Handle background color change
  const handleBgColorChange = (colorHex) => {
    setBackgroundColorHex(colorHex);
    addToRecentColors(colorHex);
  };

  useEffect(() => {
    if (sketchRef.current && !p5InstanceRef.current) {
      const sketch = new p5((p) => {
        // Settings that p5 will access
        let settings = {
          brushSize,
          fadeSpeed,
          currentColor: hexToRgb(currentColorHex),
          backgroundColor: hexToRgb(backgroundColorHex)
        };
        
        let paths = [];
        let currentPath = [];
        
        // Main drawing buffer
        let mainBuffer;
        
        // Initialize the canvas and buffers
        p.setup = () => {
          let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(sketchRef.current);
          
          // Initialize color mode
          p.colorMode(p.RGB, 255, 255, 255, 1);
          
          // Create main drawing buffer
          mainBuffer = p.createGraphics(p.width, p.height);
          mainBuffer.colorMode(p.RGB, 255, 255, 255, 1);
          
          // Set initial background
          p.background(...settings.backgroundColor);
          mainBuffer.background(...settings.backgroundColor);
          
          p.frameRate(60);
        };
        
        // Main draw loop
        p.draw = () => {
          // Clear the main canvas
          p.clear();
          
          // Apply subtle fade effect to main buffer
          mainBuffer.background(...settings.backgroundColor, 0.01 * (settings.fadeSpeed * 0.1));
          
          // Draw all saved paths to the main buffer
          for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            
            if (path.length > 1) {
              // Calculate opacity based on age
              const ageFactor = Math.max(0, 1 - (i / paths.length) * 0.5);
              
              // Draw the path with an oil pastel effect
              drawOilPastelStroke(mainBuffer, path, path.color, path.thickness * ageFactor, ageFactor);
            }
          }
          
          // Draw the current path being drawn
          if (currentPath.length > 1) {
            drawOilPastelStroke(mainBuffer, currentPath, currentPath.color, currentPath.thickness, 1.0);
          }
          
          // Display the main buffer
          p.image(mainBuffer, 0, 0);
          
          // Gradually remove old paths based on fade speed
          if (p.frameCount % Math.max(10, 60 - settings.fadeSpeed * 5) === 0 && paths.length > 0) {
            paths.shift();
          }
        };
        
        // Draw a stroke with oil pastel texture
        const drawOilPastelStroke = (buffer, path, color, thickness, opacity) => {
          if (path.length < 2) return;
          
          // Draw the main stroke
          buffer.noFill();
          
          // Draw multiple overlapping strokes with slight variations to create texture
          for (let j = 0; j < 3; j++) {
            const jitter = j * 0.5;
            const alpha = opacity * (1 - j * 0.2);
            
            buffer.stroke(color[0], color[1], color[2], alpha);
            buffer.strokeWeight(thickness - j * 2);
            buffer.beginShape();
            
            for (let i = 0; i < path.length; i++) {
              // Add slight jitter to points for texture
              const x = path[i].x + p.random(-jitter, jitter);
              const y = path[i].y + p.random(-jitter, jitter);
              buffer.vertex(x, y);
            }
            
            buffer.endShape();
          }
          
          // Add chalk-like particles along the stroke for texture
          if (opacity > 0.5) {
            buffer.noStroke();
            buffer.fill(color[0], color[1], color[2], opacity * 0.3);
            
            for (let i = 1; i < path.length; i += 3) {
              const x = path[i].x;
              const y = path[i].y;
              const size = thickness * 0.5;
              
              // Add scattered particles around the line
              for (let j = 0; j < 2; j++) {
                buffer.circle(
                  x + p.random(-thickness/2, thickness/2),
                  y + p.random(-thickness/2, thickness/2),
                  p.random(1, size)
                );
              }
            }
          }
        };
        
        // Basic p5.js mouse event handlers
        p.mousePressed = () => {
          // Don't start a path if clicking on controls
          if (p.mouseX > p.width - 300 && p.mouseY < 200) return; 
          
          // Create a new path
          currentPath = [];
          currentPath.color = settings.currentColor;
          currentPath.thickness = settings.brushSize;
          paths.push(currentPath);
          
          const point = { x: p.mouseX, y: p.mouseY };
          currentPath.push(point);
        };
        
        p.mouseDragged = () => {
          // Only add points if we're actually drawing
          if (currentPath.length > 0) {
            // Add point with some smoothing based on distance
            const lastPoint = currentPath[currentPath.length - 1];
            const mousePoint = { x: p.mouseX, y: p.mouseY };
            
            // Calculate distance to last point
            const d = p.dist(lastPoint.x, lastPoint.y, mousePoint.x, mousePoint.y);
            
            // Add intermediate points for smoother curves if distance is large
            if (d > 8) {
              const numSteps = Math.floor(d / 4);
              for (let i = 1; i <= numSteps; i++) {
                const t = i / numSteps;
                const x = p.lerp(lastPoint.x, mousePoint.x, t);
                const y = p.lerp(lastPoint.y, mousePoint.y, t);
                currentPath.push({ x, y });
              }
            } else {
              currentPath.push(mousePoint);
            }
          }
        };
        
        p.mouseReleased = () => {
          // No special action needed on release
        };
        
        p.keyPressed = () => {
          if (p.key === 'c' || p.key === 'C') {
            // Clear canvas
            paths = [];
            p.background(...settings.backgroundColor);
            mainBuffer.background(...settings.backgroundColor);
          }
        };
        
        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          
          // Resize buffers when window is resized
          const newBuffer = p.createGraphics(p.width, p.height);
          newBuffer.colorMode(p.RGB, 255, 255, 255, 1);
          newBuffer.image(mainBuffer, 0, 0);
          mainBuffer.remove();
          mainBuffer = newBuffer;
          
          // Redraw background
          mainBuffer.background(...settings.backgroundColor);
        };
        
        // Update settings when they change
        p.updateSettings = (newSettings) => {
          const prevBgColor = settings.backgroundColor;
          settings = { ...settings, ...newSettings };
          
          // If background color changed, redraw background immediately
          if (newSettings.backgroundColor && 
              (prevBgColor[0] !== newSettings.backgroundColor[0] ||
               prevBgColor[1] !== newSettings.backgroundColor[1] ||
               prevBgColor[2] !== newSettings.backgroundColor[2])) {
            p.background(...settings.backgroundColor);
            mainBuffer.background(...settings.backgroundColor);
          }
        };
      }, sketchRef.current);
      
      // Store the p5 instance
      p5InstanceRef.current = sketch;
    }
    
    // Cleanup on unmount
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []); 
  
  // Update p5 settings when React state changes
  useEffect(() => {
    if (p5InstanceRef.current) {
      // Directly update the p5 instance using our ref
      p5InstanceRef.current.updateSettings({ 
        brushSize,
        fadeSpeed,
        currentColor: hexToRgb(currentColorHex),
        backgroundColor: hexToRgb(backgroundColorHex)
      });
    }
  }, [brushSize, fadeSpeed, currentColorHex, backgroundColorHex]);

  return (
    <div className="magic-crayon-container">
      <div 
        ref={sketchRef} 
        className="canvas-container"
      ></div>
      
      {/* Controls toggle button */}
      <button 
        className="controls-toggle"
        onClick={toggleControls}
        title={controlsVisible ? "Hide controls" : "Show controls"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
      
      <div className={`controls simple-controls ${controlsVisible ? 'visible' : 'hidden'}`}>
        {/* Brush Size Control with CustomSlider - using brush color */}
        <div className="control-group">
          <CustomSlider
            value={brushSize}
            onChange={(value) => setBrushSize(value)}
            min={5}
            max={50}
            label="BRUSH SIZE"
            color={currentColorHex}
          />
        </div>
        
        {/* Fade Speed Control with CustomSlider - using background color */}
        <div className="control-group">
          <CustomSlider
            value={fadeSpeed}
            onChange={(value) => setFadeSpeed(value)}
            min={1}
            max={10}
            label="FADE SPEED"
            color={backgroundColorHex}
          />
        </div>
        
        {/* Color Pickers Section */}
        <div className="control-group">
          {/* Color pickers container - horizontal layout */}
          <div className="color-pickers-row">
            {/* Brush Color Selection */}
            <div className="color-picker-column">
              <label>BRUSH</label>
              <input
                type="color"
                value={currentColorHex}
                onChange={(e) => handleBrushColorChange(e.target.value)}
                className="color-picker-input main-color-picker"
                title="Choose brush color"
              />
            </div>
            
            {/* Background Color Selection */}
            <div className="color-picker-column">
              <label>BACKGROUND</label>
              <input
                type="color"
                value={backgroundColorHex}
                onChange={(e) => handleBgColorChange(e.target.value)}
                className="color-picker-input bg-color-picker"
                title="Choose background color"
              />
            </div>
          </div>
          
          {/* Shared Recent Colors Palette - without label */}
          <div className="recent-colors-section">
            <div className="recent-colors-palette">
              {recentColors.map((color, index) => (
                <div 
                  key={index}
                  className={`color-swatch ${color === currentColorHex || color === backgroundColorHex ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    if (color === currentColorHex) {
                      handleBgColorChange(color);
                    } else {
                      handleBrushColorChange(color);
                    }
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicCrayon;