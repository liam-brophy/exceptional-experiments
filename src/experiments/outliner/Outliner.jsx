import React, { useState, useEffect, useRef } from 'react';
import './Outliner.css';

/**
 * Outliner Experiment - Simplified with Drag and Drop
 * Processes images to generate stylized outlines with minimal UI
 */
function Outliner() {
  const [image, setImage] = useState(null);
  const [threshold, setThreshold] = useState(128);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [worker, setWorker] = useState(null);
  const [imageSizeWarning, setImageSizeWarning] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [processingProgress, setProcessingProgress] = useState(0);
  const [displayedDebugLines, setDisplayedDebugLines] = useState([]);
  const [debugLinesToDisplay, setDebugLinesToDisplay] = useState([]);

  const resultCanvasRef = useRef(null);
  const dropAreaRef = useRef(null);
  const processingTimerRef = useRef(null);
  const debouncedProcessRef = useRef(null);
  const debugIntervalRef = useRef(null); // Ref for the debug animation interval

  // Initialize web worker
  useEffect(() => {
    console.log('[Outliner] Initializing web worker');
    // Create the worker
    const imageWorker = new Worker(new URL('./workers/imageProcessor.worker.js', import.meta.url));
    
    // Set up message handler
    imageWorker.onmessage = (e) => {
      const { outlinePoints, success, error, processingTime, outlineCount, downsampleFactor, type, percentComplete, outlinesFound } = e.data;
      
      // Handle progress updates from worker
      if (type === 'progress') {
        setProcessingProgress(percentComplete);
        setDebugInfo(prev => ({
          ...prev,
          outlinesFound: outlinesFound,
          progressPercent: percentComplete
        }));
        return;
      }
      
      if (success) {
        console.log(`[Outliner] Worker completed successfully in ${processingTime}ms with ${outlineCount} outlines`);
        const drawStartTime = performance.now();
        drawOutlines(outlinePoints);
        const drawEndTime = performance.now();
        console.log(`[Outliner] Drawing outlines took ${(drawEndTime - drawStartTime).toFixed(2)}ms`);
        
        setDebugInfo(prev => ({
          ...prev,
          workerProcessingTime: processingTime,
          outlineCount,
          drawingTime: (drawEndTime - drawStartTime).toFixed(2),
          downsampleFactor: downsampleFactor || 1
        }));
      } else {
        console.error("[Outliner] Error from worker:", error);
        setDebugInfo(prev => ({
          ...prev,
          workerError: error
        }));
      }
      
      // Calculate total processing time
      if (processingTimerRef.current) {
        const totalTime = performance.now() - processingTimerRef.current;
        console.log(`[Outliner] Total processing time including worker: ${totalTime.toFixed(2)}ms`);
        setDebugInfo(prev => ({
          ...prev,
          totalProcessingTime: totalTime.toFixed(2)
        }));
      }
      
      setProcessingProgress(0);
      setIsProcessing(false);
    };
    
    setWorker(imageWorker);
    
    // Cleanup function
    return () => {
      console.log('[Outliner] Terminating worker');
      imageWorker.terminate();
      
      if (debouncedProcessRef.current) {
        clearTimeout(debouncedProcessRef.current);
      }
    };
  }, []);

  // Process the image when it changes or threshold changes, with debounce
  useEffect(() => {
    if (image && worker) {
      // Clear any existing timeout
      if (debouncedProcessRef.current) {
        clearTimeout(debouncedProcessRef.current);
      }
      
      // For threshold changes, use debounce to prevent too many worker calls
      if (isProcessing) {
        console.log('[Outliner] Skipping processing while already in progress');
        return;
      }
      
      console.log(`[Outliner] Image or threshold changed (${threshold}), scheduling processing...`);
      
      // Use artificial progress indication for better UX
      setProcessingProgress(10);
      
      debouncedProcessRef.current = setTimeout(() => {
        processImage();
      }, 300); // 300ms debounce
    }
  }, [image, threshold, worker]);

  // Set up drag and drop event listeners
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };
    
    const handleDragEnter = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };
    
    const handleDragLeave = () => {
      setIsDragging(false);
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.match('image.*')) {
          handleImageFile(file);
        }
      }
    };
    
    // Add event listeners to the drop area
    if (dropArea) {
      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('dragenter', handleDragEnter);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', handleDrop);
      
      // Clean up event listeners
      return () => {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('dragenter', handleDragEnter);
        dropArea.removeEventListener('dragleave', handleDragLeave);
        dropArea.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  // Handle the image file from drag and drop
  const handleImageFile = (file) => {
    if (file) {
      console.log(`[Outliner] Loading image file: ${file.name}, size: ${(file.size / 1024).toFixed(2)}KB`);
      const loadStartTime = performance.now();
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const loadEndTime = performance.now();
          console.log(`[Outliner] Image loaded in ${(loadEndTime - loadStartTime).toFixed(2)}ms, dimensions: ${img.width}x${img.height} (${img.width * img.height} pixels)`);
          
          setDebugInfo({
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(2) + 'KB',
            dimensions: `${img.width}x${img.height}`,
            pixelCount: img.width * img.height,
            loadTime: (loadEndTime - loadStartTime).toFixed(2)
          });
          
          // Add size check to prevent processing extremely large images
          if (img.width * img.height > 16000000) { // 16 megapixels
            console.warn(`[Outliner] Very large image detected: ${img.width}x${img.height} (${img.width * img.height} pixels)`);
            setImageSizeWarning(true);
          } else {
            setImageSizeWarning(false);
          }
          
          setImage(img);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw the outlines on the canvas
  const drawOutlines = (outlinePoints) => {
    if (!resultCanvasRef.current) return;
    
    const resultCanvas = resultCanvasRef.current;
    const resultCtx = resultCanvas.getContext('2d');
    const scale = parseFloat(resultCanvas.dataset.scale || 1);
    
    // Draw the outlines
    resultCtx.lineJoin = 'round';
    resultCtx.lineCap = 'round';
    resultCtx.strokeStyle = '#000000';
    resultCtx.lineWidth = 2;
    
    let totalPoints = 0;
    
    // If there are too many outlines, batch drawing to prevent UI freeze
    const batchSize = 1000;
    let processedOutlines = 0;
    
    const drawBatch = (startIndex) => {
      const endIndex = Math.min(startIndex + batchSize, outlinePoints.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const points = outlinePoints[i];
        if (points && points.length > 0) {
          resultCtx.beginPath();
          resultCtx.moveTo(points[0].x * scale, points[0].y * scale);
          for (let j = 1; j < points.length; j++) {
            resultCtx.lineTo(points[j].x * scale, points[j].y * scale);
          }
          resultCtx.stroke();
          totalPoints += points.length;
        }
      }
      
      processedOutlines = endIndex;
      
      // If more to process, schedule next batch
      if (processedOutlines < outlinePoints.length) {
        setProcessingProgress(Math.round((processedOutlines / outlinePoints.length) * 100));
        window.requestAnimationFrame(() => drawBatch(processedOutlines));
      } else {
        console.log(`[Outliner] Drew ${outlinePoints.length} outlines with ${totalPoints} total points`);
        setProcessingProgress(0);
      }
    };
    
    // Start the batch drawing process
    drawBatch(0);
  };

  // Process the image to generate outlines
  const processImage = async () => {
    if (!image || !worker || isProcessing) return;
    setIsProcessing(true);
    setProcessingProgress(20); // Start at 20% for better UX
    
    processingTimerRef.current = performance.now();
    console.log('[Outliner] Starting image processing');

    try {
      // Process for result outline
      const resultCanvas = resultCanvasRef.current;
      
      // Set result canvas size based on image dimensions
      const maxWidth = Math.min(window.innerWidth * 0.8, 800);
      const maxHeight = Math.min(window.innerHeight * 0.7, 600);
      const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      
      resultCanvas.width = image.width * scale;
      resultCanvas.height = image.height * scale;
      
      console.log(`[Outliner] Canvas resized to ${resultCanvas.width}x${resultCanvas.height}, scale: ${scale}`);
      
      const canvasSetupTime = performance.now();
      
      // Create a temporary canvas for processing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      tempCtx.drawImage(image, 0, 0, image.width, image.height);
      
      console.log('[Outliner] Temp canvas created and image drawn');
      setProcessingProgress(30);
      
      // Get image data and send to worker
      console.log('[Outliner] Getting image data from canvas');
      const getImageDataStart = performance.now();
      
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      const getImageDataEnd = performance.now();
      console.log(`[Outliner] Image data retrieved in ${(getImageDataEnd - getImageDataStart).toFixed(2)}ms`);
      
      // Store scale for later use in drawing
      resultCanvas.dataset.scale = scale;
      
      // Draw a faint version of the original image as background
      const resultCtx = resultCanvas.getContext('2d');
      resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
      resultCtx.globalAlpha = 0.1;
      resultCtx.drawImage(image, 0, 0, resultCanvas.width, resultCanvas.height);
      resultCtx.globalAlpha = 1.0;
      
      // Calculate memory usage estimate
      const imageSizeBytes = imageData.data.length;
      const memorySizeMB = (imageSizeBytes / (1024 * 1024)).toFixed(2);
      console.log(`[Outliner] Sending image data to worker: ${memorySizeMB}MB (${imageSizeBytes} bytes)`);
      
      setDebugInfo(prev => ({
        ...prev,
        imageDataSize: memorySizeMB + 'MB',
        canvasSetupTime: (getImageDataEnd - canvasSetupTime).toFixed(2)
      }));
      
      setProcessingProgress(50); // Update progress before sending to worker
      
      // Send data to worker for processing
      const workerSendTime = performance.now();
      worker.postMessage({
        imageData: imageData.data,
        threshold,
        width: tempCanvas.width,
        height: tempCanvas.height
      });
      console.log(`[Outliner] Data sent to worker at ${workerSendTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error("[Outliner] Error processing image:", error);
      console.error(error.stack);
      setDebugInfo(prev => ({
        ...prev,
        processingError: error.message
      }));
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Effect to handle debug info animation
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || Object.keys(debugInfo).length === 0) {
      setDisplayedDebugLines([]);
      setDebugLinesToDisplay([]);
      if (debugIntervalRef.current) clearInterval(debugIntervalRef.current);
      debugIntervalRef.current = null;
      return;
    }

    // Format debugInfo into lines, handling potential objects/arrays
    const formatValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value); // Keep nested objects/arrays as JSON strings
      }
      return String(value); // Convert others to string
    };

    const formattedLines = Object.entries(debugInfo)
      .map(([key, value]) => `${key}: ${formatValue(value)}`);

    setDebugLinesToDisplay(formattedLines);
    setDisplayedDebugLines([]); // Reset displayed lines

    if (debugIntervalRef.current) {
      clearInterval(debugIntervalRef.current);
    }

    let lineIndex = 0;
    debugIntervalRef.current = setInterval(() => {
      if (lineIndex < formattedLines.length) {
        setDisplayedDebugLines(prev => [...prev, formattedLines[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(debugIntervalRef.current);
        debugIntervalRef.current = null; // Clear ref when done
      }
    }, 100); // ms per line

    // Cleanup function
    return () => {
      if (debugIntervalRef.current) {
        clearInterval(debugIntervalRef.current);
      }
    };
  }, [debugInfo]); // Rerun when debugInfo changes

  return (
    <div className="outliner-container">
      <div className="outliner-content">
        {image && (
          <div className="controls-section">
            <input 
              type="range" 
              min="0"
              max="255"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="threshold-slider"
              disabled={isProcessing}
            />
            <span className="threshold-value">Threshold: {threshold}</span>
            {/* Debug info moved below */}
          </div>
        )}
        
        <div 
          ref={dropAreaRef}
          className={`drop-area ${isDragging ? 'dragging' : ''} ${image ? 'has-image' : ''}`}
        >
          {isProcessing && (
            <div className="processing-indicator">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <div className="processing-text">
                Processing... {processingProgress > 0 ? `${processingProgress}%` : ''}
                {process.env.NODE_ENV === 'development' && (
                  <span className="processing-details">
                    {debugInfo.pixelCount && `${(debugInfo.pixelCount / 1000000).toFixed(2)}MP image`}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {imageSizeWarning && (
            <div className="warning-message">
              Warning: Large image detected. Processing may be slow or cause memory issues.
            </div>
          )}
          
          {image ? (
            <canvas ref={resultCanvasRef} className="result-canvas"></canvas>
          ) : (
            <div className="drop-prompt">
              <div className="drop-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V16M12 16L7 11M12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 20H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p>Drag & drop an image here</p>
              <p className="drop-subtitle">Generate an outline from your image</p>
            </div>
          )}
        </div>

        {/* Animated Debug information section - only visible in development */}
        {process.env.NODE_ENV === 'development' && debugLinesToDisplay.length > 0 && (
          <div className="matrix-debug">
            {displayedDebugLines.map((line, index) => (
              <span key={index}>{line}</span>
            ))}
            {/* Show cursor only while animating */}
            {debugIntervalRef.current && <span className="cursor"></span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Outliner;