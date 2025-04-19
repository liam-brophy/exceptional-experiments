/**
 * Web Worker for Image Processing
 * Handles the CPU-intensive tasks of image processing off the main thread
 */

// Apply threshold and preprocessing to create a clean binary image
const preprocessImage = (imageData, thresholdValue, width, height, options = {}) => {
  console.log(`[Worker] Starting preprocessing: ${width}x${height} (${imageData.length / 4} pixels)`);
  const startTime = performance.now();
  
  // Default options
  const {
    downsampleFactor = 1,
    blurRadius = 1,
    useAdaptiveThreshold = false
  } = options;
  
  // Downsample if needed
  let processWidth = Math.floor(width / downsampleFactor);
  let processHeight = Math.floor(height / downsampleFactor);
  console.log(`[Worker] Downsampling by factor ${downsampleFactor}: new size ${processWidth}x${processHeight}`);
  
  // Create grayscale image (pre-allocation is more efficient)
  const grayscaleData = new Uint8ClampedArray(processWidth * processHeight);
  
  // Convert to grayscale with downsampling
  for (let y = 0; y < processHeight; y++) {
    for (let x = 0; x < processWidth; x++) {
      const srcX = Math.min(x * downsampleFactor, width - 1);
      const srcY = Math.min(y * downsampleFactor, height - 1);
      const srcIdx = (srcY * width + srcX) * 4;
      
      // Calculate grayscale using standard luminance formula
      grayscaleData[y * processWidth + x] = 
        Math.round(imageData[srcIdx] * 0.299 + 
                 imageData[srcIdx + 1] * 0.587 + 
                 imageData[srcIdx + 2] * 0.114);
    }
  }
  
  // Apply simple box blur if radius > 0
  let blurredData = grayscaleData;
  if (blurRadius > 0) {
    blurredData = applyBoxBlur(grayscaleData, processWidth, processHeight, blurRadius);
  }
  
  // Apply thresholding
  const binaryData = new Uint8ClampedArray(processWidth * processHeight);
  
  if (useAdaptiveThreshold) {
    // Adaptive thresholding - better for varying lighting conditions
    const blockSize = Math.max(3, Math.floor(Math.min(processWidth, processHeight) / 20));
    applyAdaptiveThreshold(blurredData, binaryData, processWidth, processHeight, blockSize, 10);
  } else {
    // Simple global threshold
    for (let i = 0; i < blurredData.length; i++) {
      binaryData[i] = blurredData[i] < thresholdValue ? 0 : 255;
    }
  }
  
  const endTime = performance.now();
  console.log(`[Worker] Preprocessing complete: ${(endTime - startTime).toFixed(2)}ms`);
  
  // Return both data and dimensions
  return {
    binaryData,
    processWidth,
    processHeight,
    downsampleFactor
  };
};

// Apply a simple box blur
const applyBoxBlur = (data, width, height, radius) => {
  const result = new Uint8ClampedArray(width * height);
  const size = 2 * radius + 1;
  const divisor = size * size;
  
  // For efficiency, process horizontally then vertically
  const temp = new Uint8ClampedArray(width * height);
  
  // Horizontal pass
  for (let y = 0; y < height; y++) {
    let sum = 0;
    // Initialize sum for first pixel
    for (let rx = -radius; rx <= radius; rx++) {
      const x = Math.min(Math.max(rx, 0), width - 1);
      sum += data[y * width + x];
    }
    
    // Set first pixel
    temp[y * width] = Math.round(sum / size);
    
    // Sliding window for the rest
    for (let x = 1; x < width; x++) {
      // Remove leftmost value
      const removeX = Math.max(x - radius - 1, 0);
      sum -= data[y * width + removeX];
      
      // Add rightmost value
      const addX = Math.min(x + radius, width - 1);
      sum += data[y * width + addX];
      
      temp[y * width + x] = Math.round(sum / size);
    }
  }
  
  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    // Initialize sum for first pixel
    for (let ry = -radius; ry <= radius; ry++) {
      const y = Math.min(Math.max(ry, 0), height - 1);
      sum += temp[y * width + x];
    }
    
    // Set first pixel
    result[x] = Math.round(sum / size);
    
    // Sliding window for the rest
    for (let y = 1; y < height; y++) {
      // Remove topmost value
      const removeY = Math.max(y - radius - 1, 0);
      sum -= temp[removeY * width + x];
      
      // Add bottommost value
      const addY = Math.min(y + radius, height - 1);
      sum += temp[addY * width + x];
      
      result[y * width + x] = Math.round(sum / size);
    }
  }
  
  return result;
};

// Apply adaptive thresholding - better for varying lighting conditions
const applyAdaptiveThreshold = (src, dst, width, height, blockSize, C) => {
  // Ensure blockSize is odd
  blockSize = blockSize % 2 === 0 ? blockSize + 1 : blockSize;
  const radius = Math.floor(blockSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      
      // Calculate average of surrounding pixels
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += src[ny * width + nx];
            count++;
          }
        }
      }
      
      const average = sum / count;
      const pixelIdx = y * width + x;
      
      // Threshold = average - C
      dst[pixelIdx] = src[pixelIdx] < (average - C) ? 0 : 255;
    }
  }
};

// Trace the outline using a more efficient boundary following algorithm
const traceOutline = async (binaryData, width, height, downsampleFactor = 1) => {
  console.log(`[Worker] Starting outline tracing: ${width}x${height}`);
  const startTime = performance.now();
  
  // Safety check - ensure we're not processing an image that's too large
  const totalPixels = width * height;
  if (totalPixels > 16000000) { // 16 megapixels max
    console.warn(`[Worker] Image too large (${width}x${height}), reducing detail level`);
    // Return a smaller set of sample outlines instead of crashing
    return sampleOutlines(binaryData, width, height, downsampleFactor);
  }
  
  try {
    // Use Uint8Array for visited flags (much more memory efficient than Set)
    const visited = new Uint8Array(width * height);
    const allOutlines = [];
    
    // Simplify directions for faster neighbor checking
    const dx = [0, 1, 1, 1, 0, -1, -1, -1];
    const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
    
    // Calculate minimum outline length to filter out noise
    // (Scale based on image size to avoid filtering important details in small images)
    const minOutlineLength = Math.max(5, Math.floor(Math.min(width, height) / 100));
    const maxOutlineLength = 1000; // Reasonable limit to prevent infinite loops
    
    console.log(`[Worker] Using filters: min outline length=${minOutlineLength}, max outline length=${maxOutlineLength}`);

    // Process in chunks with stride to focus on larger features
    const chunkSize = 200;
    const strideX = Math.max(1, Math.floor(width / 1000)); // Skip pixels to focus on larger features
    const strideY = Math.max(1, Math.floor(height / 1000));
    
    let outlineCount = 0;
    let skippedSmall = 0;
    let skippedLarge = 0;
    let lastProgressTime = startTime;
    
    // Add timeout detection to prevent browser from killing the worker
    const startChunkTime = performance.now();
    let processedPixels = 0;
    
    for (let chunkY = 0; chunkY < height; chunkY += chunkSize) {
      // Check for timeout before processing each chunk
      if (performance.now() - startChunkTime > 20000) { // 20 seconds max processing time
        console.warn(`[Worker] Outline tracing taking too long, returning partial results with ${outlineCount} outlines`);
        return allOutlines;
      }
      
      const chunkStartTime = performance.now();
      const endY = Math.min(chunkY + chunkSize, height);
      
      // Report progress periodically
      if (performance.now() - lastProgressTime > 1000) {
        const percentComplete = Math.round((processedPixels / totalPixels) * 100);
        console.log(`[Worker] Outline tracing progress: ${percentComplete}%, outlines found: ${outlineCount}`);
        lastProgressTime = performance.now();
        
        // Send progress update to main thread
        self.postMessage({
          type: 'progress',
          percentComplete: percentComplete,
          outlinesFound: outlineCount
        });
      }
      
      for (let y = chunkY; y < endY; y += strideY) {
        for (let x = 0; x < width; x += strideX) {
          // Periodically yield to keep the worker responsive
          if (processedPixels % 100000 === 0) {
            // Use setTimeout with 0ms to allow the event loop to process other events
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          
          const pixelIndex = y * width + x;
          processedPixels++;
          
          // Find a boundary pixel (black with at least one white neighbor)
          if (binaryData[pixelIndex] === 0 && !visited[pixelIndex]) {
            // Fast check if it's a boundary pixel
            let isBoundary = false;
            for (let i = 0; i < 8; i++) {
              const nx = x + dx[i];
              const ny = y + dy[i];
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const neighborIndex = ny * width + nx;
                if (neighborIndex < binaryData.length && binaryData[neighborIndex] === 255) {
                  isBoundary = true;
                  break;
                }
              }
            }
            
            if (isBoundary) {
              try {
                // Use optimized Moore boundary tracing with safety limits
                const outlinePoints = mooreBoundaryTrace(
                  binaryData, visited, width, height, x, y, maxOutlineLength);
                
                // Only keep outlines with reasonable length
                if (outlinePoints.length >= minOutlineLength) {
                  if (outlinePoints.length >= maxOutlineLength) {
                    // Outline likely got stuck in a loop, but still save what we have
                    skippedLarge++;
                  }
                  
                  // Add outline with scaling for downsampling
                  if (downsampleFactor > 1) {
                    const scaledOutline = outlinePoints.map(pt => ({
                      x: pt.x * downsampleFactor,
                      y: pt.y * downsampleFactor
                    }));
                    allOutlines.push(scaledOutline);
                  } else {
                    allOutlines.push(outlinePoints);
                  }
                  
                  outlineCount++;
                  
                  // Limit the number of outlines to prevent hanging
                  if (outlineCount > 5000) {
                    console.warn(`[Worker] Too many outlines (${outlineCount}), stopping early`);
                    return allOutlines;
                  }
                } else {
                  skippedSmall++;
                }
              } catch (err) {
                console.error(`[Worker] Error tracing outline at (${x},${y}): ${err.message}`);
                // Continue with other outlines rather than crashing the entire process
                continue;
              }
            }
          }
        }
      }
      
      const chunkEndTime = performance.now();
      console.log(`[Worker] Chunk processed in ${(chunkEndTime - chunkStartTime).toFixed(2)}ms, outlines: ${allOutlines.length}, skipped small: ${skippedSmall}, skipped large: ${skippedLarge}`);
    }
    
    const endTime = performance.now();
    console.log(`[Worker] Outline tracing complete: ${(endTime - startTime).toFixed(2)}ms, total outlines: ${allOutlines.length}`);
    console.log(`[Worker] Filtering stats: kept ${outlineCount}, skipped small: ${skippedSmall}, skipped large: ${skippedLarge}`);
    
    return allOutlines;
  } catch (error) {
    console.error(`[Worker] Critical error in outline tracing: ${error.message}`);
    console.error(error.stack);
    // Return an empty array rather than crashing
    return [];
  }
};

// Helper function to extract a sample of outlines for very large images
const sampleOutlines = (binaryData, width, height, downsampleFactor) => {
  console.log(`[Worker] Using sampling mode for large image`);
  
  // Create a more aggressive sampling approach for huge images
  const sampleStep = Math.max(5, Math.floor(Math.min(width, height) / 100));
  const outlines = [];
  
  try {
    // Create a smaller visited array just for the sampled pixels
    const visited = new Set();
    
    // Directions for neighbor checking
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];
    
    // Simpler approach - just find isolated edge pixels
    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const pixelIndex = y * width + x;
        
        // Only process black pixels
        if (binaryData[pixelIndex] === 0) {
          // Check if it's an edge
          let edgeCount = 0;
          for (let i = 0; i < 4; i++) {
            const nx = x + dx[i];
            const ny = y + dy[i];
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighborIndex = ny * width + nx;
              if (binaryData[neighborIndex] === 255) {
                edgeCount++;
              }
            }
          }
          
          // If it has at least one white neighbor, it's an edge
          if (edgeCount > 0 && !visited.has(pixelIndex)) {
            visited.add(pixelIndex);
            
            // Create a simple outline point
            const point = {
              x: x * downsampleFactor,
              y: y * downsampleFactor
            };
            
            // Find a few more connected points
            const simpleOutline = [point];
            outlines.push(simpleOutline);
            
            // Limit to a reasonable number for very large images
            if (outlines.length >= 1000) {
              return outlines;
            }
          }
        }
      }
    }
    
    return outlines;
  } catch (error) {
    console.error(`[Worker] Error in sampling mode: ${error.message}`);
    return [];
  }
};

// Moore boundary tracing algorithm - more reliable for complex boundaries
const mooreBoundaryTrace = (binaryData, visited, width, height, startX, startY, maxLength) => {
  try {
    const outlinePoints = [];
    const dx = [0, 1, 1, 1, 0, -1, -1, -1];
    const dy = [-1, -1, 0, 1, 1, 1, 0, -1];
    
    let currentX = startX;
    let currentY = startY;
    
    // Initialize with special case to avoid immediate termination
    const firstPixelIndex = currentY * width + currentX;
    visited[firstPixelIndex] = 1;
    outlinePoints.push({ x: currentX, y: currentY });
    
    // Find the first background neighbor
    let backgroundDir = -1;
    for (let i = 0; i < 8; i++) {
      const nx = currentX + dx[i];
      const ny = currentY + dy[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIndex = ny * width + nx;
        if (binaryData[neighborIndex] === 255) {
          backgroundDir = i;
          break;
        }
      }
    }
    
    // If no background pixel, this is isolated, just return the single point
    if (backgroundDir === -1) {
      return outlinePoints;
    }
    
    // Moore neighborhood search - start from the right of background
    let dir = (backgroundDir + 6) % 8; // Rotate 270° clockwise
    
    // Safety counter to detect and break potential infinite loops
    let stepCount = 0;
    const maxSteps = maxLength * 2; // Double max length as safety
    
    let lastX = -1, lastY = -1; // Track last position to detect stuck state
    let stuckCount = 0;
    
    while (stepCount < maxSteps) {
      // Check for getting stuck (same coordinates repeatedly)
      if (currentX === lastX && currentY === lastY) {
        stuckCount++;
        if (stuckCount > 8) { // If stuck for more than a full neighborhood scan
          console.warn('[Worker] Outline tracing detected stuck state, breaking');
          break;
        }
      } else {
        stuckCount = 0;
        lastX = currentX;
        lastY = currentY;
      }
      
      // Try all directions, starting with the current one
      let foundNext = false;
      
      for (let i = 0; i < 8; i++) {
        const checkDir = (dir + i) % 8;
        const nx = currentX + dx[checkDir];
        const ny = currentY + dy[checkDir];
        
        // Bounds check
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }
        
        const neighborIndex = ny * width + nx;
        // Additional safety check to prevent out-of-bounds
        if (neighborIndex >= 0 && neighborIndex < binaryData.length && binaryData[neighborIndex] === 0) {
          // Move to that pixel
          currentX = nx;
          currentY = ny;
          
          // Mark as visited and add to outline
          const pixelIndex = currentY * width + currentX;
          
          // Additional bounds check
          if (pixelIndex >= 0 && pixelIndex < visited.length) {
            // Only add the point if it hasn't been visited or is the start point
            if (!visited[pixelIndex] || (outlinePoints.length > 2 && 
                currentX === startX && currentY === startY)) {
              visited[pixelIndex] = 1;
              outlinePoints.push({ x: currentX, y: currentY });
              
              // Check if we've reached max length
              if (outlinePoints.length >= maxLength) {
                return outlinePoints;
              }
            }
            
            // Start search from the opposite of the direction we just came from
            dir = (checkDir + 6) % 8;
            foundNext = true;
            break;
          }
        }
      }
      
      // Check termination - either no more boundary or closed loop
      if (!foundNext || (outlinePoints.length > 2 && 
          currentX === startX && currentY === startY)) {
        break;
      }
      
      stepCount++;
    }
    
    // If we reached the max steps without completing, log a warning
    if (stepCount >= maxSteps) {
      console.warn(`[Worker] Outline tracing reached max steps (${maxSteps}) without completing`);
    }
    
    return outlinePoints;
  } catch (error) {
    console.error(`[Worker] Error in mooreBoundaryTrace: ${error.message}`);
    // Return what we have so far or an empty array
    return [];
  }
};

// Simplify an outline using Ramer-Douglas-Peucker algorithm
const simplifyOutline = (points, epsilon) => {
  if (points.length <= 2) {
    return points;
  }
  
  // Find the point with the maximum distance
  let maxDistance = 0;
  let index = 0;
  
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    // Recursive call
    const firstPart = simplifyOutline(points.slice(0, index + 1), epsilon);
    const secondPart = simplifyOutline(points.slice(index), epsilon);
    
    // Concatenate the two parts
    return firstPart.slice(0, -1).concat(secondPart);
  } else {
    // Return only the first and last point
    return [firstPoint, lastPoint];
  }
};

// Calculate perpendicular distance from a point to a line segment
const perpendicularDistance = (point, lineStart, lineEnd) => {
  const x = point.x;
  const y = point.y;
  const x1 = lineStart.x;
  const y1 = lineStart.y;
  const x2 = lineEnd.x;
  const y2 = lineEnd.y;
  
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = x - xx;
  const dy = y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

// Determine if downsampling is needed based on image size
const calculateDownsampleFactor = (width, height) => {
  const totalPixels = width * height;
  
  if (totalPixels > 4000000) { // 4 megapixels
    return 4;
  } else if (totalPixels > 2000000) { // 2 megapixels
    return 3;
  } else if (totalPixels > 1000000) { // 1 megapixel
    return 2;
  }
  
  return 1; // No downsampling for smaller images
};

// Set up message handler
self.onmessage = async function(e) {
  const { imageData, threshold, width, height } = e.data;
  
  console.log(`[Worker] Received task: process image ${width}x${height}, threshold: ${threshold}`);
  const totalStartTime = performance.now();
  
  try {
    // Check for very large images that might crash the browser
    if (width * height > 25000000) { // 25 megapixels
      throw new Error(`Image too large (${width}x${height}) - exceeds maximum size limit`);
    }
    
    // Determine if we need to downsample based on image size
    const downsampleFactor = calculateDownsampleFactor(width, height);
    const useAdaptiveThreshold = width * height > 500000; // Use adaptive threshold for larger images
    
    // Periodically yield to keep the worker responsive
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Preprocess image (threshold, blur, downsample as needed)
    const { binaryData, processWidth, processHeight } = preprocessImage(
      imageData, threshold, width, height, {
        downsampleFactor,
        blurRadius: 1,
        useAdaptiveThreshold
      }
    );
    
    // Clear original image data to free memory
    // This helps prevent memory-related crashes
    const originalImageData = null;
    
    // Another yield point before starting the CPU-intensive tracing
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Update progress
    self.postMessage({
      type: 'progress',
      percentComplete: 30,
      outlinesFound: 0
    });
    
    // Trace outline on the processed image
    let outlinePoints = await traceOutline(binaryData, processWidth, processHeight, downsampleFactor);
    
    // Clear binary data to free memory
    const clearedBinaryData = null;
    
    // For large images with too many outlines, simplify and limit
    if (outlinePoints.length > 5000) {
      console.log(`[Worker] Too many outlines (${outlinePoints.length}), simplifying...`);
      
      // Sort outlines by length (descending) and take the most significant ones
      outlinePoints.sort((a, b) => b.length - a.length);
      outlinePoints = outlinePoints.slice(0, 5000);
      
      // Simplify outlines for better performance
      const epsilon = Math.max(2, Math.floor(Math.min(width, height) / 500));
      outlinePoints = outlinePoints.map(points => simplifyOutline(points, epsilon));
    }
    
    const totalEndTime = performance.now();
    const totalTime = (totalEndTime - totalStartTime).toFixed(2);
    console.log(`[Worker] Total processing complete in ${totalTime}ms`);
    
    // Send results back to main thread
    console.log(`[Worker] Sending results: ${outlinePoints.length} outlines`);
    self.postMessage({ 
      outlinePoints,
      success: true,
      processingTime: totalTime,
      outlineCount: outlinePoints.length,
      width,
      height,
      downsampleFactor
    });
  } catch (error) {
    console.error(`[Worker] ERROR: ${error.message}`);
    console.error(error.stack);
    self.postMessage({ 
      success: false, 
      error: error.message 
    });
  }
};