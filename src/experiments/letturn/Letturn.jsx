import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import './Letturn.css';

// Define the list of selectable characters/emojis
const selectableItems = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '!', '@', '#', '$ ', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=',
  '😀', '😂', '😍', '🤔', '🚀', '✨', '🎉', '💡', '💖', '💯'
];

function Letturn() {
  const [selectedChar, setSelectedChar] = useState('A'); // Default character
  const [isMouseDown, setIsMouseDown] = useState(false); // State for mouse down

  // TODO: Implement drag controls for text

  return (
    <div className="letturn-experiment-container">
      <div className="letturn-main-content">
        <div className="letturn-selection-panel">
          <h2>Select Item</h2>
          <div className="letturn-item-grid"> {/* Added grid container */}
            {selectableItems.map((item) => (
              <button
                key={item}
                className={`letturn-item-button ${selectedChar === item ? 'selected' : ''}`}
                onClick={() => setSelectedChar(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div
          className="letturn-canvas-container"
          onPointerDown={() => setIsMouseDown(true)} // Set state on mouse down
          onPointerUp={() => setIsMouseDown(false)}   // Reset state on mouse up
          onPointerLeave={() => setIsMouseDown(false)} // Reset state if mouse leaves while down
        >
          <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
            <ambientLight intensity={0.6} /> {/* Slightly increased intensity */}
            <pointLight position={[10, 10, 10]} intensity={0.8} /> {/* Adjusted intensity */}
            <Suspense fallback={null}>
              {/* Render selected character */}
              <Text
                position={[0, 0, 0]}
                fontSize={4} // Increased font size
                // Change color based on mouse down state
                color={isMouseDown ? '#ff69b4' : '#555'} // Hot pink when down, default otherwise
                anchorX="center"
                anchorY="middle"
              >
                {selectedChar}
              </Text>
            </Suspense>
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} /> {/* Ensure controls are enabled */}
          </Canvas>
        </div>
      </div>
    </div>
  );
}

export default Letturn;
