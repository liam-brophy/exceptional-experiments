import React, { useRef, useEffect, useState } from 'react';
import './MagicCrayon.css';
import p5 from 'p5';

const MagicCrayon = () => {
  const sketchRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const [brushSize, setBrushSize] = useState(25);
  const [fadeSpeed, setFadeSpeed] = useState(5);
  const [blurAmount, setBlurAmount] = useState(0); 
  
  // Color state management
  const [currentColorHex, setCurrentColorHex] = useState('#64C8FF');
  const [backgroundColorHex, setBackgroundColorHex] = useState('#1E1E23');
  const [recentColors, setRecentColors] = useState(['#64C8FF', '#FF7F50', '#7B68EE', '#20B2AA', '#FFB6C1']);

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

  // Add a new color to recent colors history
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

  useEffect(() => {
    if (sketchRef.current && !p5InstanceRef.current) {
      const sketch = new p5((p) => {
        // Settings that p5 will access
        let settings = {
          brushSize,
          fadeSpeed,
          currentColor: hexToRgb(currentColorHex),
          backgroundColor: hexToRgb(backgroundColorHex),
          blurAmount
        };
        
        let paths = [];
        let currentPath = [];
        
        // Main drawing buffer
        let mainBuffer;
        // Blur effect buffer
        let blurBuffer;
        
        // Initialize the canvas and buffers
        p.setup = () => {
          let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(sketchRef.current);
          
          // Initialize color mode
          p.colorMode(p.RGB, 255, 255, 255, 1);
          
          // Create main drawing buffer
          mainBuffer = p.createGraphics(p.width, p.height);
          mainBuffer.colorMode(p.RGB, 255, 255, 255, 1);
          
          // Create blur buffer
          blurBuffer = p.createGraphics(p.width, p.height);
          blurBuffer.colorMode(p.RGB, 255, 255, 255, 1);
          
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
          
          // Apply blur effect if needed
          if (settings.blurAmount > 0) {
            // Custom blur implementation 
            applyStackBlur(settings.blurAmount);
            
            // Display the blurred buffer
            p.image(blurBuffer, 0, 0);
          } else {
            // Display the main buffer directly (no blur)
            p.image(mainBuffer, 0, 0);
          }
          
          // Gradually remove old paths based on fade speed
          if (p.frameCount % Math.max(10, 60 - settings.fadeSpeed * 5) === 0 && paths.length > 0) {
            paths.shift();
          }
        };
        
        // Apply a stack blur effect (more efficient than p5's built-in filter)
        const applyStackBlur = (amount) => {
          // Copy main buffer to blur buffer
          blurBuffer.clear();
          blurBuffer.image(mainBuffer, 0, 0);
          
          // Apply a single blur with a safe amount
          if (amount > 0) {
            // Use a single blur pass with a limited strength to prevent crashes
            // p5's BLUR filter can be unstable with higher values or multiple passes
            const safeBlurAmount = Math.min(3, amount / 2); // Cap the blur amount
            
            try {
              // Apply blur with a safe value
              blurBuffer.filter(p.BLUR, safeBlurAmount);
              
              // For stronger blur effects, we'll reduce the opacity instead of
              // applying multiple passes, which is safer
              if (amount > 3) {
                // Add a slightly transparent overlay to simulate stronger blur
                blurBuffer.fill(
                  settings.backgroundColor[0], 
                  settings.backgroundColor[1], 
                  settings.backgroundColor[2], 
                  amount * 0.05
                );
                blurBuffer.noStroke();
                blurBuffer.rect(0, 0, p.width, p.height);
              }
            } catch (error) {
              console.warn("Blur effect failed, falling back to unblurred display", error);
              blurBuffer.image(mainBuffer, 0, 0);
            }
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
            blurBuffer.background(...settings.backgroundColor);
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
          
          // Create new blur buffer at new window size
          const newBlurBuffer = p.createGraphics(p.width, p.height);
          newBlurBuffer.colorMode(p.RGB, 255, 255, 255, 1);
          blurBuffer.remove();
          blurBuffer = newBlurBuffer;
          
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
            blurBuffer.background(...settings.backgroundColor);
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
        backgroundColor: hexToRgb(backgroundColorHex),
        blurAmount
      });
    }
  }, [brushSize, fadeSpeed, currentColorHex, backgroundColorHex, blurAmount]);

  return (
    <div className="magic-crayon-container">
      <div 
        ref={sketchRef} 
        className="canvas-container"
      ></div>
      
      <div className="controls simple-controls">
        {/* Brush Size Control */}
        <div className="control-group">
          <label>Brush Size: {brushSize}px</label>
          <input 
            type="range" 
            min="5" 
            max="50" 
            value={brushSize} 
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>
        
        {/* Fade Speed Control */}
        <div className="control-group">
          <label>Fade Speed: {fadeSpeed}</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={fadeSpeed} 
            onChange={(e) => setFadeSpeed(Number(e.target.value))}
          />
        </div>
        
        {/* Blur Effect Control */}
        <div className="control-group">
          <label>Blur Effect: {blurAmount > 0 ? blurAmount : 'Off'}</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            value={blurAmount} 
            onChange={(e) => setBlurAmount(Number(e.target.value))}
          />
        </div>
        
        {/* Brush Color Selection */}
        <div className="control-group">
          <label>Brush Color</label>
          <div className="color-picker-container">
            <input
              type="color"
              value={currentColorHex}
              onChange={(e) => handleBrushColorChange(e.target.value)}
              className="color-picker-input main-color-picker"
              title="Choose brush color"
            />
            <div className="selected-color-preview" style={{ backgroundColor: currentColorHex }}>
              <span className="color-hex-value">{currentColorHex}</span>
            </div>
          </div>
          
          {/* Recent Colors Palette */}
          <div className="recent-colors-palette">
            {recentColors.map((color, index) => (
              <div 
                key={index}
                className={`color-swatch ${color === currentColorHex ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleBrushColorChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>
        
        {/* Background Color Selection */}
        <div className="control-group">
          <label>Background Color</label>
          <div className="color-picker-container">
            <input
              type="color"
              value={backgroundColorHex}
              onChange={(e) => setBackgroundColorHex(e.target.value)}
              className="color-picker-input bg-color-picker"
              title="Choose background color"
            />
            <div className="selected-color-preview" style={{ backgroundColor: backgroundColorHex }}>
              <span className="color-hex-value">{backgroundColorHex}</span>
            </div>
          </div>
          
          {/* Quick Background Presets */}
          <div className="background-presets">
            <div 
              className="bg-preset" 
              style={{ backgroundColor: '#1E1E23' }}
              onClick={() => setBackgroundColorHex('#1E1E23')} 
              title="Dark"
            />
            <div 
              className="bg-preset" 
              style={{ backgroundColor: '#0F1928' }}
              onClick={() => setBackgroundColorHex('#0F1928')} 
              title="Deep Blue"
            />
            <div 
              className="bg-preset" 
              style={{ backgroundColor: '#28231E' }}
              onClick={() => setBackgroundColorHex('#28231E')} 
              title="Dark Brown"
            />
            <div 
              className="bg-preset" 
              style={{ backgroundColor: '#E6E1DD' }}
              onClick={() => setBackgroundColorHex('#E6E1DD')} 
              title="Light"
            />
          </div>
        </div>
      </div>
      
      <div className="instructions simple-instructions">
        Draw with the oil pastel crayon
        <br/>
        Press 'C' to clear the canvas
      </div>
    </div>
  );
};

export default MagicCrayon;