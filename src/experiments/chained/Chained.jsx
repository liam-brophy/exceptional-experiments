import { useEffect, useRef, useState } from 'react';
import './Chained.css';

const Chained = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);
  const [chainCount, setChainCount] = useState(5);
  const [linkLength, setLinkLength] = useState(20);
  const [elasticity, setElasticity] = useState(0.5);
  const [friction, setFriction] = useState(0.95);
  const [gravity, setGravity] = useState(0.2);
  const [colorScheme, setColorScheme] = useState('rainbow'); // 'rainbow', 'monochrome', 'complementary'
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Chain class to manage multiple chains
    class Chain {
      constructor(x, y, segments, length, color, id) {
        this.id = id;
        this.links = [];
        this.segmentLength = length;
        this.baseColor = color;
        this.fixed = false;
        this.dragging = false;
        
        // Create links in the chain
        for (let i = 0; i < segments; i++) {
          this.links.push({
            x: x,
            y: y + (i * length),
            oldX: x,
            oldY: y + (i * length) - 1, // Slightly different to init velocity
            radius: 4 + Math.random() * 3
          });
        }
      }
      
      update(elasticity, friction, gravity) {
        // Start from the second link (first one moves separately)
        for (let i = 1; i < this.links.length; i++) {
          const link = this.links[i];
          
          // Calculate velocity from previous position
          let vx = (link.x - link.oldX) * friction;
          let vy = (link.y - link.oldY) * friction;
          
          // Save current position as old position
          link.oldX = link.x;
          link.oldY = link.y;
          
          // Apply velocity and gravity
          link.x += vx;
          link.y += vy + gravity;
        }
        
        // Apply constraints multiple times for stability
        for (let j = 0; j < 3; j++) {
          this.applyConstraints(elasticity);
        }
      }
      
      applyConstraints(elasticity) {
        // Handle distance constraints between links
        for (let i = 0; i < this.links.length - 1; i++) {
          const link1 = this.links[i];
          const link2 = this.links[i + 1];
          
          // Calculate distance between links
          const dx = link2.x - link1.x;
          const dy = link2.y - link1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const difference = this.segmentLength - distance;
          const percent = (difference / distance) * 0.5 * elasticity;
          const offsetX = dx * percent;
          const offsetY = dy * percent;
          
          // Adjust positions - if first link is fixed, don't move it
          if (i === 0 && this.fixed) {
            link2.x += offsetX * 2;
            link2.y += offsetY * 2;
          } else {
            link1.x -= offsetX;
            link1.y -= offsetY;
            link2.x += offsetX;
            link2.y += offsetY;
          }
        }
      }
      
      constrain(width, height) {
        // Keep links within canvas bounds
        for (let i = 0; i < this.links.length; i++) {
          const link = this.links[i];
          
          if (i === 0 && this.fixed) continue;
          
          // Constrain X
          if (link.x > width - link.radius) {
            link.x = width - link.radius;
            link.oldX = link.x + (link.x - link.oldX) * 0.5;
          } else if (link.x < link.radius) {
            link.x = link.radius;
            link.oldX = link.x + (link.x - link.oldX) * 0.5;
          }
          
          // Constrain Y
          if (link.y > height - link.radius) {
            link.y = height - link.radius;
            link.oldY = link.y + (link.y - link.oldY) * 0.5;
          } else if (link.y < link.radius) {
            link.y = link.radius;
            link.oldY = link.y + (link.y - link.oldY) * 0.5;
          }
        }
      }
      
      draw(ctx, colorScheme) {
        ctx.save();
        
        // Draw links
        for (let i = 0; i < this.links.length; i++) {
          const link = this.links[i];
          
          // Generate color based on scheme
          let color;
          if (colorScheme === 'rainbow') {
            const hue = (this.id * 50 + i * 10) % 360;
            color = `hsl(${hue}, 70%, 50%)`;
          } else if (colorScheme === 'monochrome') {
            const lightness = 30 + Math.sin(i * 0.5) * 20;
            color = `hsl(${this.baseColor}, 70%, ${lightness}%)`;
          } else {
            const complementary = (this.baseColor + 180) % 360;
            const useHue = i % 2 === 0 ? this.baseColor : complementary;
            color = `hsl(${useHue}, 70%, 50%)`;
          }
          
          // Draw circle at each link position
          ctx.beginPath();
          ctx.arc(link.x, link.y, link.radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Draw connecting lines between links
          if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(this.links[i - 1].x, this.links[i - 1].y);
            ctx.lineTo(link.x, link.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = link.radius * 0.8;
            ctx.stroke();
          }
        }
        
        ctx.restore();
      }
      
      setHeadPosition(x, y) {
        const head = this.links[0];
        head.x = x;
        head.y = y;
      }
      
      setFixedPoint(fixed) {
        this.fixed = fixed;
      }
      
      checkDrag(mouseX, mouseY) {
        // Check if mouse is over the head link for dragging
        const head = this.links[0];
        const dx = mouseX - head.x;
        const dy = mouseY - head.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < head.radius * 3;
      }
    }
    
    // Set canvas size
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Create chains
    let chains = [];
    function initChains() {
      chains = [];
      const colors = [0, 60, 120, 180, 240, 300]; // Hue values
      
      for (let i = 0; i < chainCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5; // Start in top half
        const color = colors[i % colors.length];
        chains.push(new Chain(x, y, 20, linkLength, color, i));
      }
    }
    
    initChains();
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let activeDragChain = null;
    
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      
      // Check if we're clicking on any chains
      for (const chain of chains) {
        if (chain.checkDrag(mouseX, mouseY)) {
          activeDragChain = chain;
          activeDragChain.setFixedPoint(true);
          break;
        }
      }
    });
    
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      
      if (activeDragChain) {
        activeDragChain.setHeadPosition(mouseX, mouseY);
      }
    });
    
    canvas.addEventListener('mouseup', () => {
      if (activeDragChain) {
        activeDragChain.setFixedPoint(false);
        activeDragChain = null;
      }
    });
    
    // Animation loop
    let animationId;
    const animate = () => {
      if (!isRunning) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw chains
      for (const chain of chains) {
        chain.update(elasticity, friction, gravity);
        chain.constrain(canvas.width, canvas.height);
        chain.draw(ctx, colorScheme);
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Effect cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', canvas);
      canvas.removeEventListener('mousemove', canvas);
      canvas.removeEventListener('mouseup', canvas);
      cancelAnimationFrame(animationId);
    };
  }, [chainCount, linkLength, elasticity, friction, gravity, colorScheme, isRunning]);
  
  // Handle control changes
  const resetSimulation = () => {
    // This will trigger the effect to re-run and reset all chains
    setIsRunning(false);
    setTimeout(() => setIsRunning(true), 50);
  };
  
  return (
    <div className="chained-experiment">
      <div className="controls">
        <div className="control-group">
          <label>Chain Count: {chainCount}</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={chainCount} 
            onChange={(e) => setChainCount(Number(e.target.value))}
            onMouseUp={resetSimulation}
          />
        </div>
        <div className="control-group">
          <label>Link Length: {linkLength}</label>
          <input 
            type="range" 
            min="10" 
            max="30" 
            value={linkLength} 
            onChange={(e) => setLinkLength(Number(e.target.value))}
            onMouseUp={resetSimulation}
          />
        </div>
        <div className="control-group">
          <label>Elasticity: {elasticity.toFixed(1)}</label>
          <input 
            type="range" 
            min="0.1" 
            max="1" 
            step="0.1" 
            value={elasticity} 
            onChange={(e) => setElasticity(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label>Friction: {friction.toFixed(2)}</label>
          <input 
            type="range" 
            min="0.8" 
            max="0.99" 
            step="0.01" 
            value={friction} 
            onChange={(e) => setFriction(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label>Gravity: {gravity.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="0.5" 
            step="0.01" 
            value={gravity} 
            onChange={(e) => setGravity(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label>Color Scheme:</label>
          <select 
            value={colorScheme} 
            onChange={(e) => setColorScheme(e.target.value)}
          >
            <option value="rainbow">Rainbow</option>
            <option value="monochrome">Monochrome</option>
            <option value="complementary">Complementary</option>
          </select>
        </div>
        <button onClick={resetSimulation} className="reset-button">Reset Chains</button>
      </div>
      <div className="canvas-container">
        <canvas ref={canvasRef} className="canvas" />
        <div className="instructions">
          <p>Click and drag the chain links to interact with them!</p>
        </div>
      </div>
    </div>
  );
};

export default Chained;
