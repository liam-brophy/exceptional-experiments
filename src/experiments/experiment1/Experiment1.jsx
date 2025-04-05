import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import './Experiment1.css'; // We still need this for the container styling

const Experiment1 = () => {
  // This ref points to the div that p5 will use as its parent
  const containerRef = useRef(null);
  const sketchRef = useRef(null);

  useEffect(() => {
    // Only proceed if the container exists AND no sketch exists yet
    if (containerRef.current && !sketchRef.current) {
      console.log("Experiment1 Effect: Creating NEW p5 instance.");

      sketchRef.current = new p5((sketch) => {
        // --- p5.js Sketch Logic ---
        // [ Keep your existing constants: characterLayout, colorThemes, etc. ]
        const characterLayout = [
             ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
             ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
             ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''],
             ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
             ['space']
           ];
        const colorThemes = {
            blue: { background: [10, 20, 40], baseChar: [180, 180, 200], hoverChar: [100, 150, 255] }, // Darker bg example
            purple: { background: [20, 10, 40], baseChar: [200, 180, 220], hoverChar: [190, 80, 255] },
            green: { background: [10, 30, 20], baseChar: [180, 220, 180], hoverChar: [80, 230, 140] },
            orange: { background: [40, 20, 10], baseChar: [220, 200, 180], hoverChar: [255, 140, 80] }
        };

        let currentTheme = 'blue';
        const baseCharSize = 40; // Adjusted base size for potentially more keys visible
        const spacing = 70;     // Adjusted spacing
        let characters = [];
        let scale = 1;
        // Canvas dimensions will now be based on window size

        function calculateCharPositions() {
          characters = [];
          // Use p5's windowWidth/Height which reflects the canvas size
          const currentWidth = sketch.width;
          const currentHeight = sketch.height;

          // Scale based on the smaller dimension to ensure fit
          scale = sketch.min(currentWidth / 1100, currentHeight / 500 ); // Adjust denominator based on layout needs
          scale = sketch.max(0.5, scale); // Prevent getting too tiny

          const scaledCharSize = baseCharSize * scale;
          const scaledSpacing = spacing * scale;

          const maxRowLength = Math.max(...characterLayout.map(row => row.length));
          const totalLayoutWidth = (maxRowLength -1) * scaledSpacing;
          const totalLayoutHeight = (characterLayout.length - 1) * scaledSpacing;

          // Center based on current canvas size
          const startY = (currentHeight - totalLayoutHeight) / 2;

          characterLayout.forEach((row, rowIndex) => {
            const rowWidth = (row.length - 1) * scaledSpacing;
            const rowStartX = (currentWidth - rowWidth) / 2;
            row.forEach((char, charIndex) => {
              characters.push({
                character: char,
                x: rowStartX + charIndex * scaledSpacing,
                y: startY + rowIndex * scaledSpacing,
                size: scaledCharSize
              });
            });
          });
        }

        sketch.setup = () => {
          console.log("p5 setup: Creating full window canvas.");
          // Use p5's windowWidth and windowHeight
          const canvas = sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);

          if (containerRef.current) {
            // Parent the canvas to our container div
            canvas.parent(containerRef.current);
          } else {
            console.error("p5 setup: containerRef.current became null unexpectedly.");
          }
          calculateCharPositions(); // Calculate based on initial window size
          sketch.textAlign(sketch.CENTER, sketch.CENTER);
          sketch.textFont('monospace');
        };

        sketch.draw = () => {
          // --- Your draw logic - Should be okay, but check colors ---
          // Consider using darker backgrounds in your themes for better overlay contrast
           const theme = colorThemes[currentTheme];
           sketch.background(theme.background); // Use theme background

           for (const char of characters) {
              const distance = sketch.dist(sketch.mouseX, sketch.mouseY, char.x, char.y);
              const maxDist = 120 * scale; // Adjusted interaction distance
              const hoverIntensity = sketch.map(distance, 0, maxDist, 1, 0);
              const hoverIntensityConstrained = sketch.constrain(hoverIntensity, 0, 1);
              sketch.push();
              sketch.translate(char.x, char.y);
              if (hoverIntensityConstrained > 0) {
                const rotationAmount = hoverIntensityConstrained * sketch.PI / 10;
                sketch.rotate(sketch.sin(sketch.frameCount * 0.05 + char.x) * rotationAmount);
                const floatOffset = sketch.sin(sketch.frameCount * 0.1 + char.y) * hoverIntensityConstrained * 4 * scale; // Slightly smaller float
                sketch.translate(0, floatOffset);
              }
              const r = sketch.lerp(theme.baseChar[0], theme.hoverChar[0], hoverIntensityConstrained);
              const g = sketch.lerp(theme.baseChar[1], theme.hoverChar[1], hoverIntensityConstrained);
              const b = sketch.lerp(theme.baseChar[2], theme.hoverChar[2], hoverIntensityConstrained);
              const isSpace = char.character === 'space';
              const baseSize = char.size * (isSpace ? 0.8 : 1);
              const displaySize = baseSize + (hoverIntensityConstrained * 10 * scale); // Smaller size increase
              sketch.textSize(displaySize);
              sketch.fill(r, g, b);
              sketch.noStroke();
              sketch.text(isSpace ? '␣' : char.character, 0, 0);
              sketch.pop();
           }
        };

        sketch.windowResized = () => {
          console.log("p5 windowResized: Resizing canvas.");
          // Resize canvas to new window dimensions
          sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);
          calculateCharPositions(); // Recalculate positions after resize
        };

        sketch.keyPressed = () => {
            // --- Your key press logic ---
            if (sketch.key === '1') currentTheme = 'blue';
             else if (sketch.key === '2') currentTheme = 'purple';
             else if (sketch.key === '3') currentTheme = 'green';
             else if (sketch.key === '4') currentTheme = 'orange';
             if (['1', '2', '3', '4'].includes(sketch.key)) {
               return false;
             }
        };

      }, containerRef.current); // Pass the container element
    } else {
      // Log cases where creation is skipped
      if (!containerRef.current) console.warn("Experiment1 Effect: containerRef.current is null.");
      if (sketchRef.current) console.warn("Experiment1 Effect: sketchRef.current already exists.");
    }

    // --- Cleanup Function (Keep the robust one) ---
    return () => {
      console.log(`Experiment1 Cleanup: Running cleanup. sketchRef exists: ${!!sketchRef.current}`);
      if (sketchRef.current) {
        console.log("Experiment1 Cleanup: Calling p5 remove()");
        sketchRef.current.remove();
        if (containerRef.current) {
            console.log("Experiment1 Cleanup: Manually clearing container children.");
            while (containerRef.current.firstChild) {
                containerRef.current.removeChild(containerRef.current.firstChild);
            }
        } else {
             console.warn("Experiment1 Cleanup: containerRef was null during manual clear.");
        }
        sketchRef.current = null;
        console.log("Experiment1 Cleanup: sketchRef set to null.");
      } else {
        console.log("Experiment1 Cleanup: No sketchRef to remove.");
      }
    };
  }, []); // Empty dependency array

  // The root div of THIS component should fill its container from the layout
  return (
    <div className="experiment1-wrapper">
      {/* This div receives the p5 canvas */}
      <div ref={containerRef} className="canvas-host"></div>
      {/* Removed the controls div */}
    </div>
  );
};

export default Experiment1;