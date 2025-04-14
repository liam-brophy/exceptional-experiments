import React, { useState, useEffect, useRef } from 'react';
import './Outliner.css';

/**
 * Outliner Experiment
 * Processes images to generate stylized outlines and representations
 */
function Outliner() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [threshold, setThreshold] = useState(128);
  const [segments, setSegments] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const originalCanvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Effect to process the image when it changes
  useEffect(() => {
    if (image) {
      processImage();
    }
  }, [image, threshold, segments]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setImageUrl(event.target.result);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle URL paste
  const handleUrlPaste = (e) => {
    e.preventDefault();
    if (!e.target.value) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      setImage(img);
      setImageUrl(e.target.value);
    };
    img.onerror = () => {
      alert('Error loading image. Please try another URL or upload a file.');
    };
    img.src = e.target.value;
  };

  // Process the image to generate outlines
  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);

    try {
      // Draw original image
      const origCanvas = originalCanvasRef.current;
      const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
      
      // Set thumbnail preview dimensions
      const maxPreviewSize = 150;
      const scale = Math.min(1, maxPreviewSize / image.width, maxPreviewSize / image.height);
      
      origCanvas.width = image.width * scale;
      origCanvas.height = image.height * scale;
      origCtx.drawImage(image, 0, 0, origCanvas.width, origCanvas.height);

      // Process for result outline
      const resultCanvas = resultCanvasRef.current;
      
      // Set result canvas to a larger size
      const maxResultWidth = Math.min(window.innerWidth * 0.8, 1200);
      const maxResultHeight = Math.min(window.innerHeight * 0.7, 800);
      const resultScale = Math.min(1, maxResultWidth / image.width, maxResultHeight / image.height);
      
      resultCanvas.width = image.width * resultScale;
      resultCanvas.height = image.height * resultScale;
      
      // Create a temporary canvas for processing at full size
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      tempCtx.drawImage(image, 0, 0, image.width, image.height);
      
      // Apply processing to the temporary canvas
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const binaryData = applyThreshold(imageData, threshold);
      
      // Extract outlines
      const outlinePoints = traceOutline(binaryData, tempCanvas.width, tempCanvas.height);
      
      // Draw to the result canvas with proper scaling
      const resultCtx = resultCanvas.getContext('2d');
      resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
      
      // Optional: Draw a subtle version of the original image as background
      resultCtx.globalAlpha = 0.1;
      resultCtx.drawImage(image, 0, 0, resultCanvas.width, resultCanvas.height);
      resultCtx.globalAlpha = 1.0;
      
      // Draw the outlines scaled to the result canvas size
      resultCtx.strokeStyle = '#000000';
      resultCtx.lineWidth = 2;
      
      outlinePoints.forEach(points => {
        if (points.length > 0) {
          resultCtx.beginPath();
          resultCtx.moveTo(points[0].x * resultScale, points[0].y * resultScale);
          for (let i = 1; i < points.length; i++) {
            resultCtx.lineTo(points[i].x * resultScale, points[i].y * resultScale);
          }
          resultCtx.stroke();
        }
      });
      
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply threshold to create a binary image
  const applyThreshold = (imageData, thresholdValue) => {
    const data = imageData.data;
    const binaryData = new Uint8ClampedArray(imageData.width * imageData.height);
    
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale and apply threshold
      const gray = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
      const pixel = Math.floor(i / 4);
      binaryData[pixel] = gray < thresholdValue ? 0 : 255;
    }
    
    return binaryData;
  };

  // Trace the outline using a simple boundary following algorithm
  const traceOutline = (binaryData, width, height, offsetX = 0, offsetY = 0) => {
    // A simple version of Moore neighborhood tracing algorithm
    const visited = new Set();
    const allOutlines = [];
    
    const directions = [
      { dx: 0, dy: -1 }, // N
      { dx: 1, dy: -1 }, // NE
      { dx: 1, dy: 0 },  // E
      { dx: 1, dy: 1 },  // SE
      { dx: 0, dy: 1 },  // S
      { dx: -1, dy: 1 }, // SW
      { dx: -1, dy: 0 }, // W
      { dx: -1, dy: -1 } // NW
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pixelIndex = y * width + x;
        const pixelKey = `${x},${y}`;
        
        // Find a boundary pixel (foreground with background neighbor)
        if (binaryData[pixelIndex] === 0 && !visited.has(pixelKey)) {
          // Check if it's a boundary pixel
          let isBoundary = false;
          for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighborIndex = ny * width + nx;
              if (binaryData[neighborIndex] === 255) {
                isBoundary = true;
                break;
              }
            }
          }
          
          if (isBoundary) {
            // Start boundary tracing
            const outlinePoints = [];
            let currentX = x;
            let currentY = y;
            let startDir = 0; // Start with North
            
            do {
              visited.add(`${currentX},${currentY}`);
              outlinePoints.push({ x: currentX + offsetX, y: currentY + offsetY });
              
              // Look for the next boundary pixel
              let found = false;
              for (let i = 0; i < directions.length; i++) {
                const checkDir = (startDir + i) % 8;
                const dir = directions[checkDir];
                const nx = currentX + dir.dx;
                const ny = currentY + dir.dy;
                
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const neighborIndex = ny * width + nx;
                  if (binaryData[neighborIndex] === 0) {
                    currentX = nx;
                    currentY = ny;
                    startDir = (checkDir + 6) % 8; // Turn counter-clockwise
                    found = true;
                    break;
                  }
                }
              }
              
              if (!found) break;
              
            } while (outlinePoints.length < 10000 && (currentX !== x || currentY !== y));
            
            allOutlines.push(outlinePoints);
          }
        }
      }
    }
    
    return allOutlines;
  };

  return (
    <div className="outliner-container">
      <div className="upload-section">
        <h3>Image Outliner</h3>
        
        <div className="input-row">
          <input 
            type="file" 
            id="image-upload" 
            accept="image/*" 
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="file-input"
          />
        </div>
        
        <div className="input-row">
          <input 
            type="text" 
            id="image-url" 
            placeholder="Or paste an image URL and press Enter"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlPaste({ preventDefault: () => {}, target: { value: imageUrl } })}
            className="url-input"
          />
        </div>
      </div>
      
      {!image ? (
        <div className="upload-prompt">
          <p>Upload an image to begin</p>
        </div>
      ) : (
        <div className="content-area">
          <div className="settings-preview">
            <div className="preview-container">
              <h4>Original</h4>
              <canvas ref={originalCanvasRef} className="preview-canvas"></canvas>
            </div>
            
            <div className="settings-container">
              <h4>Settings</h4>
              <div className="setting-row">
                <label htmlFor="threshold">Threshold: {threshold}</label>
                <input 
                  type="range" 
                  id="threshold"
                  min="0"
                  max="255"
                  step="1"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                />
              </div>
              
              <div className="setting-row">
                <label htmlFor="segments">Detail Level: {segments}</label>
                <input 
                  type="range" 
                  id="segments"
                  min="1"
                  max="20"
                  step="1"
                  value={segments}
                  onChange={(e) => setSegments(parseInt(e.target.value))}
                />
              </div>
              
              <button 
                className="process-button" 
                onClick={processImage}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Redraw'}
              </button>
            </div>
          </div>
          
          <div className="result-container">
            {isProcessing && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <div className="loading-text">Processing image...</div>
              </div>
            )}
            <h4>Outlined Result</h4>
            <canvas ref={resultCanvasRef} className="result-canvas"></canvas>
          </div>
        </div>
      )}
    </div>
  );
}

export default Outliner;