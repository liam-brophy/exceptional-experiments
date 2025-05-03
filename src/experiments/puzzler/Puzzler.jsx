import React, { useState, useRef, useEffect } from 'react';
import './Puzzler.css';

/**
 * A simple confetti component that displays a particle animation
 * when a puzzle piece is correctly placed
 */
const Confetti = ({ x, y, onComplete }) => {
  const [particles, setParticles] = useState([]);
  const animationRef = useRef(null);
  const startTime = useRef(Date.now());
  const duration = 1000; // Animation duration in ms
  
  // Generate random confetti particles
  useEffect(() => {
    const particleCount = 20; // Number of confetti particles
    const newParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        size: Math.random() * 5 + 3,
        speedX: (Math.random() - 0.5) * 8,
        speedY: -Math.random() * 6 - 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
    
    setParticles(newParticles);
    animationRef.current = requestAnimationFrame(animateParticles);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Animate the particles
  const animateParticles = () => {
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress < 1) {
      setParticles(prevParticles => 
        prevParticles.map(p => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY + progress * 3, // Increasing gravity over time
          rotation: p.rotation + p.rotationSpeed,
        }))
      );
      
      animationRef.current = requestAnimationFrame(animateParticles);
    } else {
      // Animation complete
      if (onComplete) {
        onComplete();
      }
    }
  };
  
  return (
    <div className="confetti-container" style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: 1 - (Date.now() - startTime.current) / duration,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Puzzler Experiment
 * A puzzle game that takes an uploaded image, shatters it into pieces, 
 * and allows users to rebuild the puzzle
 */
function Puzzler() {
  // State management
  const [image, setImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [puzzlePieces, setPuzzlePieces] = useState([]);
  const [puzzleComplete, setPuzzleComplete] = useState(false);
  const [puzzleSize, setPuzzleSize] = useState({ width: 0, height: 0 });
  const [difficulty, setDifficulty] = useState(4); // Default grid size (4x4)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  // State for confetti animations
  const [confetti, setConfetti] = useState([]);
  
  // Refs for DOM elements
  const dropAreaRef = useRef(null);
  const puzzleAreaRef = useRef(null);
  const uploadInputRef = useRef(null);
  
  // For tracking current drag operation
  const [activePiece, setActivePiece] = useState(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Effect to track window resizing 
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Effect for drag and drop functionality for file uploads
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
  
  // Handle file input from both drag/drop and click
  const handleImageFile = (file) => {
    if (file) {
      console.log(`[Puzzler] Loading image file: ${file.name}`);
      setIsProcessing(true);
      setProcessingProgress(10);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setProcessingProgress(50);
          setImage(img);
          // Create puzzle after small delay to show progress
          setTimeout(() => {
            createPuzzlePieces(img);
          }, 400);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Create the puzzle pieces from the uploaded image
  const createPuzzlePieces = (imageObj) => {
    setProcessingProgress(60);
    
    // Calculate size for the puzzle frame
    const frameWidth = Math.min(windowSize.width * 0.5, 600);
    const frameHeight = Math.min(windowSize.height * 0.5, 600);
    
    // Maintain aspect ratio
    const aspectRatio = imageObj.width / imageObj.height;
    let frameW, frameH;
    
    if (aspectRatio > 1) {
      // Landscape image
      frameW = frameWidth;
      frameH = frameWidth / aspectRatio;
      if (frameH > frameHeight) {
        frameH = frameHeight;
        frameW = frameHeight * aspectRatio;
      }
    } else {
      // Portrait or square image
      frameH = frameHeight;
      frameW = frameHeight * aspectRatio;
      if (frameW > frameWidth) {
        frameW = frameWidth;
        frameH = frameWidth / aspectRatio;
      }
    }
    
    // Round sizes to integers
    frameW = Math.floor(frameW);
    frameH = Math.floor(frameH);
    
    setPuzzleSize({ 
      width: frameW, 
      height: frameH
    });
    
    setProcessingProgress(70);
    
    // Define grid
    const columns = difficulty;
    const rows = difficulty;
    
    // Calculate piece sizes
    const pieceWidth = frameW / columns;
    const pieceHeight = frameH / rows;
    
    // Create puzzle pieces
    const piecesArray = [];
    
    // Frame position (centered in the window)
    const frameLeft = (windowSize.width - frameW) / 2;
    const frameTop = (windowSize.height - frameH) / 2;
    
    // Padding to ensure pieces don't get placed outside visible area
    const safetyPadding = Math.max(pieceWidth, pieceHeight);
    
    // Now create the pieces
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        // Define the original position (where it should end up)
        const targetX = frameLeft + (col * pieceWidth);
        const targetY = frameTop + (row * pieceHeight);
        
        // Scatter pieces throughout the entire window with padding to keep them visible
        let initialX, initialY;
        
        // Ensure the pieces are distributed evenly across the entire window
        const sector = Math.floor(Math.random() * 4); // 0-3 for different areas of the window
        
        switch(sector) {
          case 0: // Top section
            initialX = Math.random() * (windowSize.width - pieceWidth - safetyPadding) + safetyPadding/2;
            initialY = Math.random() * (frameTop - safetyPadding) + safetyPadding;
            break;
          case 1: // Bottom section
            initialX = Math.random() * (windowSize.width - pieceWidth - safetyPadding) + safetyPadding/2;
            initialY = frameTop + frameH + Math.random() * (windowSize.height - frameTop - frameH - pieceHeight - safetyPadding) + safetyPadding/2;
            break;
          case 2: // Left section
            initialX = Math.random() * (frameLeft - safetyPadding) + safetyPadding/2;
            initialY = Math.random() * (windowSize.height - pieceHeight - safetyPadding) + safetyPadding/2;
            break;
          case 3: // Right section
            initialX = frameLeft + frameW + Math.random() * (windowSize.width - frameLeft - frameW - pieceWidth - safetyPadding) + safetyPadding/2;
            initialY = Math.random() * (windowSize.height - pieceHeight - safetyPadding) + safetyPadding/2;
            break;
          default:
            // Fallback to random position
            initialX = Math.random() * (windowSize.width - pieceWidth - safetyPadding) + safetyPadding/2;
            initialY = Math.random() * (windowSize.height - pieceHeight - safetyPadding) + safetyPadding/2;
        }
        
        // In some cases, allow the pieces to be scattered within the frame area too
        if (Math.random() < 0.2) { // 20% chance
          initialX = frameLeft + Math.random() * frameW;
          initialY = frameTop + Math.random() * frameH;
        }
        
        piecesArray.push({
          id: `piece-${row}-${col}`,
          row,
          col,
          x: initialX,
          y: initialY,
          targetX,
          targetY,
          width: pieceWidth,
          height: pieceHeight,
          isCorrect: false,
        });
      }
    }
    
    // Shuffle pieces
    const shuffledPieces = [...piecesArray];
    setPuzzlePieces(shuffledPieces);
    
    setProcessingProgress(100);
    setTimeout(() => {
      setIsProcessing(false);
      setProcessingProgress(0);
    }, 500);
  };
  
  // Helper function to generate random cut patterns
  const generateRandomCut = (orientation) => {
    // Generate cut properties
    const types = ['wave', 'zigzag', 'curved', 'straight'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Random offset from center (percentage of piece size)
    const offset = (Math.random() * 0.2) - 0.1; // -10% to +10%
    
    // Random amplitude for the cut (percentage of piece size)
    const amplitude = Math.random() * 0.1 + 0.05; // 5% to 15%
    
    // Random number of waves/zigzags (1-3)
    const frequency = Math.floor(Math.random() * 3) + 1;
    
    return {
      type,
      offset,
      amplitude,
      frequency,
      orientation
    };
  };
  
  // Handle start of a drag operation
  const handleMouseDown = (e, piece) => {
    if (piece.isCorrect) return;
    
    // Calculate offset within the piece where the mouse is pressed
    const offsetX = e.clientX - piece.x;
    const offsetY = e.clientY - piece.y;
    
    // Set the active piece and drag offsets
    setActivePiece(piece);
    setStartPos({ x: piece.x, y: piece.y });
    setDragOffset({ x: offsetX, y: offsetY });
    
    // Prevent default behavior and add dragging class
    e.preventDefault();
    e.target.classList.add('dragging');
  };
  
  // Handle drag movement
  const handleMouseMove = (e) => {
    if (!activePiece) return;
    
    // Calculate new position adjusted for the initial click offset
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Update the position of the dragged piece
    setPuzzlePieces(pieces => 
      pieces.map(p => 
        p.id === activePiece.id 
          ? { ...p, x: newX, y: newY } 
          : p
      )
    );
  };
  
  // Handle end of drag operation
  const handleMouseUp = (e) => {
    if (!activePiece) return;
    
    // Remove dragging class
    const pieceElement = document.getElementById(activePiece.id);
    if (pieceElement) {
      pieceElement.classList.remove('dragging');
    }
    
    // Get the current position of the dragged piece
    const piece = puzzlePieces.find(p => p.id === activePiece.id);
    
    // Check if piece is close to its target position
    const tolerance = Math.min(piece.width, piece.height) * 0.5; // 50% of piece size for easier placement
    const isCloseToTarget = 
      Math.abs(piece.x - piece.targetX) < tolerance && 
      Math.abs(piece.y - piece.targetY) < tolerance;
    
    if (isCloseToTarget) {
      // Snap to correct position
      setPuzzlePieces(pieces => 
        pieces.map(p => 
          p.id === activePiece.id 
            ? { ...p, x: p.targetX, y: p.targetY, isCorrect: true } 
            : p
        )
      );
      
      // Add confetti at the piece's correct position
      const newConfetti = {
        id: `confetti-${Date.now()}`,
        x: piece.targetX + piece.width / 2,
        y: piece.targetY + piece.height / 2
      };
      setConfetti(prev => [...prev, newConfetti]);
      
      // Play a subtle sound if available
      try {
        const audio = new Audio(`data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbUAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq////////////////////////////////AAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAKqqqqqqqqqqqTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8xJkLwAAAlkIAAAgAABLIQAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`);
        audio.volume = 0.3; // Subtle volume
        audio.play().catch(e => console.log("Audio play failed:", e));
      } catch (e) {
        console.log("Audio not supported:", e);
      }
      
      // Check if the puzzle is complete after this piece is placed
      const updatedPieces = puzzlePieces.map(p => 
        p.id === activePiece.id ? { ...p, isCorrect: true } : p
      );
      
      if (updatedPieces.every(p => p.isCorrect)) {
        setPuzzleComplete(true);
      }
    }
    
    // Clear the active piece
    setActivePiece(null);
  };
  
  // Handle mouse leave (cancel drag operation)
  const handleMouseLeave = () => {
    if (activePiece) {
      const pieceElement = document.getElementById(activePiece.id);
      if (pieceElement) {
        pieceElement.classList.remove('dragging');
      }
      setActivePiece(null);
    }
  };
  
  // Handle touch events for mobile support
  const handleTouchStart = (e, piece) => {
    if (piece.isCorrect) return;
    
    const touch = e.touches[0];
    
    // Calculate offset within the piece where the touch started
    const offsetX = touch.clientX - piece.x;
    const offsetY = touch.clientY - piece.y;
    
    // Set the active piece and drag offsets
    setActivePiece(piece);
    setStartPos({ x: piece.x, y: piece.y });
    setDragOffset({ x: offsetX, y: offsetY });
    
    // Add dragging class
    e.target.classList.add('dragging');
    e.preventDefault();
  };
  
  const handleTouchMove = (e) => {
    if (!activePiece) return;
    
    const touch = e.touches[0];
    
    // Calculate new position adjusted for the initial touch offset
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;
    
    // Update the position of the dragged piece
    setPuzzlePieces(pieces => 
      pieces.map(p => 
        p.id === activePiece.id 
          ? { ...p, x: newX, y: newY } 
          : p
      )
    );
    
    e.preventDefault();
  };
  
  const handleTouchEnd = (e) => {
    if (!activePiece) return;
    
    // Same logic as handleMouseUp
    const pieceElement = document.getElementById(activePiece.id);
    if (pieceElement) {
      pieceElement.classList.remove('dragging');
    }
    
    const piece = puzzlePieces.find(p => p.id === activePiece.id);
    
    const tolerance = Math.min(piece.width, piece.height) * 0.5;
    const isCloseToTarget = 
      Math.abs(piece.x - piece.targetX) < tolerance && 
      Math.abs(piece.y - piece.targetY) < tolerance;
    
    if (isCloseToTarget) {
      setPuzzlePieces(pieces => 
        pieces.map(p => 
          p.id === activePiece.id 
            ? { ...p, x: p.targetX, y: p.targetY, isCorrect: true } 
            : p
        )
      );
      
      // Add confetti at the piece's correct position
      const newConfetti = {
        id: `confetti-${Date.now()}`,
        x: piece.targetX + piece.width / 2,
        y: piece.targetY + piece.height / 2
      };
      setConfetti(prev => [...prev, newConfetti]);
      
      // Play a subtle sound if available
      try {
        const audio = new Audio(`data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbUAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq////////////////////////////////AAAA//MUZAAAAAGkAAAAAAAAA0gAAAAAKqqqqqqqqqqqTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/8xJkLwAAAlkIAAAgAABLIQAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV`);
        audio.volume = 0.3; // Subtle volume
        audio.play().catch(e => console.log("Audio play failed:", e));
      } catch (e) {
        console.log("Audio not supported:", e);
      }
      
      const updatedPieces = puzzlePieces.map(p => 
        p.id === activePiece.id ? { ...p, isCorrect: true } : p
      );
      
      if (updatedPieces.every(p => p.isCorrect)) {
        setPuzzleComplete(true);
      }
    }
    
    setActivePiece(null);
    e.preventDefault();
  };
  
  // Function to remove confetti after animation completes
  const handleConfettiComplete = (id) => {
    setConfetti(prev => prev.filter(c => c.id !== id));
  };
  
  // Handle click on upload button
  const handleUploadClick = () => {
    uploadInputRef.current.click();
  };
  
  // Reset puzzle to try again
  const resetPuzzle = () => {
    if (!image) return;
    
    setPuzzleComplete(false);
    createPuzzlePieces(image);
  };
  
  // Helper function to get wave transform for cut details
  const getWaveTransform = (cutDetails) => {
    if (!cutDetails) return '';
    
    const { type, amplitude, frequency, orientation } = cutDetails;
    const value = amplitude * 100; // Convert to percentage
    
    switch (type) {
      case 'wave':
        // Create a wavy effect using sine-like transforms
        return orientation === 'horizontal' 
          ? `scaleY(${1 + value/100}) translateY(${value/2}%)`
          : `scaleX(${1 + value/100}) translateX(${value/2}%)`;
        
      case 'zigzag':
        // Create a zigzag effect
        return orientation === 'horizontal'
          ? `scaleY(${1 + value/100}) translateY(${value/3}%) rotate(${value/10}deg)`
          : `scaleX(${1 + value/100}) translateX(${value/3}%) rotate(${value/10}deg)`;
        
      case 'curved':
        // Create a curved effect
        return orientation === 'horizontal'
          ? `scaleY(${1 + value/100}) translateY(${value}%) rotate(${value/20}deg)`
          : `scaleX(${1 + value/100}) translateX(${value}%) rotate(${value/20}deg)`;
        
      case 'straight':
      default:
        // More subtle effect for straight cuts
        return orientation === 'horizontal'
          ? `scaleY(${1 + value/200}) translateY(${value/4}%)`
          : `scaleX(${1 + value/200}) translateX(${value/4}%)`;
    }
  };

  // Render the component
  return (
    <div className="puzzler-container">
      <div className="puzzler-content">
        {!image ? (
          // Show drop area if no image is uploaded
          <div 
            ref={dropAreaRef}
            className={`puzzler-drop-area ${isDragging ? 'dragging' : ''}`}
            onClick={handleUploadClick}
          >
            <div className="puzzler-drop-prompt">
              <div className="puzzler-drop-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V16M12 16L7 11M12 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 20H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p>Drag & drop an image here</p>
              <p className="drop-subtitle">Break it into puzzle pieces and solve</p>
            </div>
            
            {/* Hidden file input for click uploads */}
            <input 
              type="file" 
              ref={uploadInputRef}
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageFile(e.target.files[0]);
                }
              }}
            />
          </div>
        ) : (
          // Show full window puzzle area
          <div 
            className="puzzle-area" 
            ref={puzzleAreaRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Puzzle frame outline - just shows where the completed puzzle should be */}
            <div 
              className="puzzle-frame"
              style={{ 
                width: puzzleSize.width, 
                height: puzzleSize.height,
              }}
            ></div>
            
            {/* Render all puzzle pieces scattered throughout the window */}
            {puzzlePieces.map((piece) => {
              // Calculate the background position to match the image segment for this piece
              const bgPosX = `-${piece.targetX - ((windowSize.width - puzzleSize.width) / 2)}px`;
              const bgPosY = `-${piece.targetY - ((windowSize.height - puzzleSize.height) / 2)}px`;
              
              const style = {
                width: piece.width,
                height: piece.height,
                left: piece.x,
                top: piece.y,
                backgroundImage: `url(${image.src})`,
                backgroundSize: `${puzzleSize.width}px ${puzzleSize.height}px`,
                backgroundPosition: `${bgPosX} ${bgPosY}`,
                boxSizing: 'border-box'
              };
              
              return (
                <div
                  id={piece.id}
                  key={piece.id}
                  className={`puzzle-piece ${piece.isCorrect ? 'correct' : ''}`}
                  style={style}
                  onMouseDown={(e) => handleMouseDown(e, piece)}
                  onTouchStart={(e) => handleTouchStart(e, piece)}
                />
              );
            })}
            
            {/* Render confetti animations */}
            {confetti.map(c => (
              <Confetti 
                key={c.id} 
                x={c.x} 
                y={c.y} 
                onComplete={() => handleConfettiComplete(c.id)} 
              />
            ))}
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="processing-indicator">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <div className="processing-text">
                  {processingProgress < 50 ? 'Loading image...' : 'Creating puzzle...'}
                  {processingProgress > 0 ? ` ${processingProgress}%` : ''}
                </div>
              </div>
            )}
            
            {/* Puzzle complete message */}
            {puzzleComplete && (
              <div className="completion-message">
                <h3>Puzzle Complete! 🎉</h3>
                <button 
                  onClick={resetPuzzle}
                  style={{ 
                    padding: '8px 16px', 
                    marginTop: '10px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
            
            {/* Upload icon button to change image */}
            <div className="upload-icon-button" onClick={handleUploadClick}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V16M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 19H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            
            {/* Reset button - changed to icon button */}
            <button className="reset-button" onClick={resetPuzzle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 8V4H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 16V20H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 4L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 20L9 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 6C17 6 21 10 21 14C21 18 18 20 14 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 18C7 18 3 14 3 10C3 6 6 4 10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Puzzler;