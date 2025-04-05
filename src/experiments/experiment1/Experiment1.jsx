import { useEffect, useRef, useState } from 'react';
import './Experiment1.css';

const Experiment1 = () => {
  const canvasRef = useRef(null);
  const [balls, setBalls] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  
  // Create a new ball
  const addBall = () => {
    const newBall = {
      x: Math.random() * (canvasRef.current.width - 30) + 15,
      y: Math.random() * (canvasRef.current.height - 30) + 15,
      radius: Math.random() * 15 + 10,
      dx: (Math.random() - 0.5) * 8,
      dy: (Math.random() - 0.5) * 8,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    };
    
    setBalls(prevBalls => [...prevBalls, newBall]);
  };
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    
    // Set canvas size
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Add initial balls
    if (balls.length === 0) {
      for (let i = 0; i < 15; i++) {
        addBall();
      }
    }
    
    // Animation function
    const animate = () => {
      if (!isRunning) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      setBalls(prevBalls => 
        prevBalls.map(ball => {
          // Update position
          let x = ball.x + ball.dx;
          let y = ball.y + ball.dy;
          
          // Check boundaries
          if (x + ball.radius > canvas.width || x - ball.radius < 0) {
            ball.dx = -ball.dx;
            x = ball.x + ball.dx;
          }
          
          if (y + ball.radius > canvas.height || y - ball.radius < 0) {
            ball.dy = -ball.dy;
            y = ball.y + ball.dy;
          }
          
          // Draw ball
          ctx.beginPath();
          ctx.arc(x, y, ball.radius, 0, Math.PI * 2);
          ctx.fillStyle = ball.color;
          ctx.fill();
          ctx.closePath();
          
          return { ...ball, x, y };
        })
      );
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRunning]);
  
  return (
    <div className="bouncing-balls-experiment">
      <div className="controls">
        <button onClick={addBall}>Add Ball</button>
        <button onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button onClick={() => setBalls([])}>Clear All</button>
      </div>
      <canvas ref={canvasRef} className="canvas" />
    </div>
  );
};

export default Experiment1;