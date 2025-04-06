import React, { useRef, useEffect, useState, useCallback } from 'react';
import p5 from 'p5';
import './Experiment2.css'; // Import the CSS

const Mirror = () => {
  const sketchContainerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const captureRef = useRef(null);
  // Ref to track if pixelate effect is active for the draw loop
  const pixelateActiveRef = useRef(true); // Start with effect ON

  // State to manage the toggle button's appearance and trigger ref update
  const [isPixelateActive, setIsPixelateActive] = useState(true); // Effect is initially ON

  // Sync state to ref whenever state changes
  useEffect(() => {
      pixelateActiveRef.current = isPixelateActive;
      // console.log(`Pixelate effect ref set to: ${isPixelateActive}`); // For debugging
  }, [isPixelateActive]);

  // Function to toggle the pixelate effect state
  const handleToggleEffect = useCallback(() => {
      // console.log('Toggling effect state'); // For debugging
      setIsPixelateActive(prev => !prev); // Use functional update
  }, []); // No dependencies needed for functional update

  // Effect to setup and cleanup p5 sketch
  useEffect(() => {
      console.log("Setting up p5 sketch...");
      let p5instance;

      const sketch = (p) => {
          let aspectRatio = 16 / 9; // Default

          p.setup = () => {
              p.createCanvas(p.windowWidth, p.windowHeight);
              p.pixelDensity(1);

              const constraints = { video: true, audio: false };
              captureRef.current = p.createCapture(constraints, (stream) => {
                  console.log('Camera stream acquired.');
                  const settings = stream.getVideoTracks()[0]?.getSettings();
                  if (settings?.aspectRatio) {
                      aspectRatio = settings.aspectRatio;
                  } else if (settings?.width && settings?.height) {
                      aspectRatio = settings.width / settings.height;
                  }
                  console.log("Using camera aspect ratio:", aspectRatio);
               });
              captureRef.current.hide();
              console.log('p5 setup complete.');
          };

          p.draw = () => {
              const capture = captureRef.current;
              // Read the boolean value directly from the ref
              const pixelateOn = pixelateActiveRef.current;

              if (!capture || !capture.loadedmetadata || capture.width === 0) {
                  p.background(20, 20, 30);
                  p.fill(200);
                  p.textAlign(p.CENTER, p.CENTER);
                  p.textSize(24);
                  p.text('Waiting for Camera...', p.width / 2, p.height / 2);
                  return;
              }

              let drawWidth = p.width;
              let drawHeight = p.width / aspectRatio;
              if (drawHeight > p.height) {
                  drawHeight = p.height;
                  drawWidth = p.height * aspectRatio;
              }
              const drawX = (p.width - drawWidth) / 2;
              const drawY = (p.height - drawHeight) / 2;

              p.background(0);

              p.push(); // Save global state
              p.translate(drawX + drawWidth, drawY);
              p.scale(-1, 1); // Apply mirroring

              // --- Check if Pixelate Effect is ON ---
              if (pixelateOn) {
                  // Pixelate Logic (adjust size and saturation)
                  const pixelation = p.map(p.mouseX, 0, p.width, 5, 60);
                  const stepSize = p.max(4, p.floor(pixelation));
                  const targetSaturation = p.map(p.mouseY, 0, p.height, 0, 150);

                  capture.loadPixels();
                  if (capture.pixels.length > 0) {
                      p.push(); // Save style state (like color mode)
                      p.colorMode(p.HSB, 360, 100, 100, 100); // Switch to HSB
                      p.noStroke();

                      for (let y = 0; y < drawHeight; y += stepSize) {
                          for (let x = 0; x < drawWidth; x += stepSize) {
                              const sourceX = p.floor(p.map(x, 0, drawWidth, 0, capture.width));
                              const sourceY = p.floor(p.map(y, 0, drawHeight, 0, capture.height));
                              const index = (sourceX + sourceY * capture.width) * 4;

                              if (index >= 0 && index + 3 < capture.pixels.length) {
                                  const r = capture.pixels[index];
                                  const g = capture.pixels[index + 1];
                                  const b = capture.pixels[index + 2];
                                  const a = capture.pixels[index + 3];

                                  let originalColor = p.color(r, g, b);
                                  let h = p.hue(originalColor);
                                  let br = p.brightness(originalColor);

                                  p.fill(h, targetSaturation, br, (a / 255) * 100);
                                  p.rect(x, y, stepSize, stepSize);
                              }
                          }
                      }
                      p.pop(); // Restore style state (back to RGB color mode)
                  }
              } else {
                  // --- Normal Effect (Pixelate is OFF) ---
                  p.image(capture, 0, 0, drawWidth, drawHeight);
              }

              p.pop(); // Restore global state (remove mirroring transform)
          }; // End draw

          p.windowResized = () => {
              p.resizeCanvas(p.windowWidth, p.windowHeight);
              console.log(`Resized canvas to ${p.windowWidth}x${p.windowHeight}`);
          };
      }; // End sketch

      p5instance = new p5(sketch, sketchContainerRef.current);
      p5InstanceRef.current = p5instance;

      // Cleanup
      return () => {
          console.log('Cleaning up p5 sketch...');
          if (captureRef.current) {
              const stream = captureRef.current.elt?.srcObject;
              if (stream) { stream.getTracks().forEach(track => track.stop()); }
              captureRef.current.remove();
              captureRef.current = null;
          }
          if (p5InstanceRef.current) {
               p5InstanceRef.current.remove();
               p5InstanceRef.current = null;
               console.log('p5 instance removed.');
          }
      };
  }, []);

  // --- Render ---
  return (
      <div className="mirror-fullscreen-wrapper">
          {/* Container for p5 Canvas (behind) */}
          <div ref={sketchContainerRef} className="mirror-canvas-container"></div>

          {/* Single Toggle Button Overlay */}
          <div className="mirror-controls-overlay">
              <button
                  onClick={handleToggleEffect}
                  // Dynamically change text or style based on state
                  // className={isPixelateActive ? 'toggle-button active' : 'toggle-button'} // Option 1: Use class
                  aria-pressed={isPixelateActive} // Important for accessibility
              >
                  {isPixelateActive ? 'Effect: ON' : 'Effect: OFF'} {/* Option 2: Change text */}
              </button>
          </div>
      </div>
  );
};

export default Mirror;