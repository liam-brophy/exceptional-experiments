import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import './Experiment1.css'; // CSS for base layout and non-scaled styles

const Experiment1 = () => {
  const containerRef = useRef(null);
  const sketchRef = useRef(null);
  const [typedText, setTypedText] = useState('');

  // State to hold metrics from p5 needed for dynamic styling
  const [keyboardMetrics, setKeyboardMetrics] = useState({
    topY: null,        // Top Y coordinate of keyboard in canvas pixels
    scale: 1,          // Scaling factor applied to the keyboard
    containerHeight: 0 // Height of the container div
  });

  // Callback to update React state with metrics from p5
  const updateKeyboardMetrics = (topY, scale, containerHeight) => {
    setKeyboardMetrics({ topY, scale, containerHeight });
  };

   // --- Add ResizeObserver for container height ---
   useEffect(() => {
    let observer;
    const container = containerRef.current;

    if (container) {
        // Function to handle resize events
        const handleResize = (entries) => {
            for (let entry of entries) {
                const newHeight = entry.contentRect.height;
                // Update container height and trigger recalculation if sketch exists
                setKeyboardMetrics(prev => ({ ...prev, containerHeight: newHeight }));
                if (sketchRef.current) {
                    // Ask p5 to recalculate based on new container dimensions if needed
                    // sketchRef.current.windowResized(); // p5 should handle window resize, but direct call might be needed if only container changes
                }
            }
        };

        observer = new ResizeObserver(handleResize);
        observer.observe(container);

        // Initial height
        setKeyboardMetrics(prev => ({ ...prev, containerHeight: container.offsetHeight }));
    }

    return () => {
        if (observer && container) {
            observer.unobserve(container);
        }
    };
}, []); // Run only once on mount


  // Callback for p5 character click
  const handleCharacterClick = (char) => {
    const characterToAdd = char === 'space' ? ' ' : char;
    setTypedText(prevText => prevText + characterToAdd);
  };

  // Function to clear text
  const clearText = () => {
    setTypedText('');
  };


  useEffect(() => {
    // Capture callbacks
    const onCharClickCallback = handleCharacterClick;
    const onUpdateMetricsCallback = updateKeyboardMetrics; // Use the combined callback

    if (containerRef.current && !sketchRef.current) {
      console.log("Experiment1 Effect: Creating NEW p5 instance.");
      const initialContainerHeight = containerRef.current.offsetHeight;

      sketchRef.current = new p5((sketch) => {
        // --- p5 Sketch ---
        const characterLayout = [ /* ... layout ... */
             ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
             ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
             ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''],
             ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
             ['space']
           ];
        const baseCharSize = 40; // Base size in p5 units
        const spacing = 70;      // Base spacing in p5 units
        let characters = [];
        let scale = 1;           // Current scale factor
        const hoverStartColorVal = 255;
        const hoverEndColorVal = 0;
        const defaultAlpha = 40;

        // Store callbacks from React
        let onCharClick = onCharClickCallback;
        let onUpdateMetrics = onUpdateMetricsCallback;

        function calculateMetricsAndPositions() {
           characters = [];
           const currentWidth = sketch.width;   // Canvas width
           const currentHeight = sketch.height; // Canvas height

           // --- Calculate Scale ---
           // (Adjust denominators based on your ideal base layout size)
           scale = sketch.min(currentWidth / 1100, currentHeight / 500 );
           scale = sketch.max(0.5, scale); // Prevent scale from becoming too small

           const scaledCharSize = baseCharSize * scale;
           const scaledSpacing = spacing * scale;

           const maxRowLength = Math.max(...characterLayout.map(row => row.length));
           const totalLayoutWidth = (maxRowLength -1) * scaledSpacing;
           const totalLayoutHeight = (characterLayout.length - 1) * scaledSpacing;

           // --- Calculate Keyboard Top Position ---
           const startY = (currentHeight - totalLayoutHeight) / 2; // Center vertically in canvas

           // --- Update React State ---
           const currentContainerHeight = containerRef.current?.offsetHeight ?? initialContainerHeight;
           if (onUpdateMetrics) {
               onUpdateMetrics(startY, scale, currentContainerHeight); // Pass scale back
           }

           // --- Calculate Character Positions ---
           characterLayout.forEach((row, rowIndex) => {
             const rowWidth = (row.length - 1) * scaledSpacing;
             const rowStartX = (currentWidth - rowWidth) / 2; // Center horizontally
             row.forEach((char, charIndex) => {
               characters.push({
                 character: char,
                 x: rowStartX + charIndex * scaledSpacing,
                 y: startY + rowIndex * scaledSpacing,
                 size: scaledCharSize,
                 scaledSpacing: scaledSpacing
               });
             });
           });
        }

        sketch.setup = () => {
           console.log("p5 setup: Creating full window canvas.");
           const canvas = sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);

           if (containerRef.current) {
             canvas.parent(containerRef.current);
           } else {
             console.error("p5 setup: containerRef.current became null unexpectedly.");
           }

           calculateMetricsAndPositions(); // Initial calculation

           sketch.textAlign(sketch.CENTER, sketch.CENTER);
           sketch.textFont('monospace');
           sketch.colorMode(sketch.RGB);
           sketch.whiteOpaque = sketch.color(hoverStartColorVal);
           sketch.blackOpaque = sketch.color(hoverEndColorVal);
           sketch.faintBlack = sketch.color(hoverEndColorVal, defaultAlpha);
        };

        sketch.draw = () => {
           sketch.clear(); // Transparent background

           // --- THIS IS THE COLOR/HOVER LOGIC - Ensure it's correct ---
           for (const char of characters) {
               const distance = sketch.dist(sketch.mouseX, sketch.mouseY, char.x, char.y);
               // Adjust maxDist based on scale - makes hover area proportional
               const maxDist = (baseCharSize + spacing) * 0.8 * scale; // Example: relative to spacing/size
               // Hover intensity: 0 (far) to 1 (close)
               const hoverIntensity = sketch.map(distance, maxDist, 0, 0, 1);
               const hoverIntensityConstrained = sketch.constrain(hoverIntensity, 0, 1);

               sketch.push();
               sketch.translate(char.x, char.y);

               // Visual effects (rotation, float)
               if (hoverIntensityConstrained > 0) {
                 const rotationAmount = hoverIntensityConstrained * sketch.PI / 10;
                 sketch.rotate(sketch.sin(sketch.frameCount * 0.05 + char.x) * rotationAmount);
                 const floatOffset = sketch.sin(sketch.frameCount * 0.1 + char.y) * hoverIntensityConstrained * 4 * scale;
                 sketch.translate(0, floatOffset);
               }

               // ** Color Calculation **
               // 1. Target hover color (white -> black gradient)
               const targetHoverColor = sketch.lerpColor(sketch.whiteOpaque, sketch.blackOpaque, hoverIntensityConstrained);
               // 2. Final color (interpolate between faint default and target hover color)
               const finalCharColor = sketch.lerpColor(sketch.faintBlack, targetHoverColor, hoverIntensityConstrained);

               // Size Calculation (slightly bigger on hover)
               const isSpace = char.character === 'space';
               const baseSize = char.size * (isSpace ? 0.8 : 1); // Use char.size (already scaled)
               const sizeIncreaseFactor = 1.1; // How much bigger on hover
               // Lerp size based on hover intensity for smooth growth
               const displaySize = sketch.lerp(baseSize, baseSize * sizeIncreaseFactor, hoverIntensityConstrained);


               // ** Draw the character **
               sketch.textSize(displaySize);
               sketch.fill(finalCharColor); // Apply calculated final color
               sketch.noStroke();
               sketch.text(isSpace ? '␣' : char.character, 0, 0);
               sketch.pop();
            }
             // --- END OF COLOR/HOVER LOGIC ---
        };

        sketch.windowResized = () => {
             console.log("p5 windowResized: Resizing canvas.");
             sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);
             calculateMetricsAndPositions(); // Recalculate everything on resize
        };

        sketch.mousePressed = () => { /* ... click logic ... */
            let clickedChar = null;
            for (const char of characters) {
              // Make clickable radius also scale
              const clickableRadius = char.scaledSpacing * 0.4; // Use scaled spacing
              const distance = sketch.dist(sketch.mouseX, sketch.mouseY, char.x, char.y);
              if (distance < clickableRadius) {
                clickedChar = char;
                break;
              }
            }
            if (clickedChar && onCharClick) {
                onCharClick(clickedChar.character);
            }
            return false;
        };

        sketch.keyPressed = () => { return false; };

      }, containerRef.current);
    }

    // --- Cleanup ---
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
    // Dependency array: include callbacks if they are redefined on re-renders,
    // but since they are defined outside, they should be stable.
  }, []);


  // --- Calculate Dynamic Styles for Text Display ---
  const { topY, scale: currentScale, containerHeight } = keyboardMetrics;
  const isPositionKnown = topY !== null && currentScale > 0 && containerHeight > 0;

  // Define base sizes (in pixels) for when scale = 1
  const baseFontSize = 28;
  const basePaddingVert = 8;
  const basePaddingHoriz = 15;
  const baseGap = 15;
  const baseButtonFontSize = 14; // Relative to document, or use px
  const baseButtonPaddingVert = 5;
  const baseButtonPaddingHoriz = 10;
  const baseDesiredGapAboveKeyboard = 80; // Gap in pixels when scale = 1

  // Calculate scaled sizes, ensuring minimums
  const scaledFontSize = Math.max(14, baseFontSize * currentScale); // Min font size 14px
  const scaledPaddingVert = Math.max(4, basePaddingVert * currentScale);
  const scaledPaddingHoriz = Math.max(8, basePaddingHoriz * currentScale);
  const scaledGap = Math.max(8, baseGap * currentScale);
  const scaledButtonFontSize = Math.max(10, baseButtonFontSize * currentScale);
  const scaledButtonPaddingVert = Math.max(3, baseButtonPaddingVert * currentScale);
  const scaledButtonPaddingHoriz = Math.max(5, baseButtonPaddingHoriz * currentScale);
  const scaledDesiredGap = Math.max(15, baseDesiredGapAboveKeyboard * currentScale);

  // Calculate position style
  const displayPositionStyle = isPositionKnown
    ? {
        bottom: `${containerHeight - topY + scaledDesiredGap}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'absolute',
        visibility: 'visible',
        opacity: 1,
        transition: 'bottom 0.2s ease-out, opacity 0.2s ease-out' // Smooth transitions
      }
    : {
        position: 'absolute',
        left: '50%',
        top: '40%', // Fallback position
        transform: 'translate(-50%, -50%)',
        visibility: 'hidden',
        opacity: 0,
      };

   // Calculate size/appearance styles
   const displaySizeStyle = {
        padding: `${scaledPaddingVert}px ${scaledPaddingHoriz}px`,
        gap: `${scaledGap}px`,
   };

   const textStyle = {
        fontSize: `${scaledFontSize}px`,
   };

   const buttonStyle = {
        fontSize: `${scaledButtonFontSize}px`,
        padding: `${scaledButtonPaddingVert}px ${scaledButtonPaddingHoriz}px`,
   };

  return (
    // Wrapper needs position:relative (set in CSS)
    <div className="experiment1-wrapper">

      {/* Apply dynamic position and size styles */}
      <div
        className="typed-display-container"
        style={{ ...displayPositionStyle, ...displaySizeStyle }}
      >
        <p className="typed-display-text" style={textStyle}>
            {typedText || 'Click keys...'}
        </p>
        {typedText && (
            <button
                onClick={clearText}
                className="clear-button"
                style={buttonStyle}
            >
                Clear
            </button>
        )}
      </div>

      {/* Canvas host */}
      <div ref={containerRef} className="canvas-host"></div>
    </div>
  );
};

export default Experiment1;