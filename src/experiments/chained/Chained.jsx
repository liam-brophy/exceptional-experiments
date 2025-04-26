import { useEffect, useRef, useState } from 'react';
import './Chained.css';

const Chained = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(true);
  
  // Increased spacing between stars for gear-like appearance
  const [linkLength, setLinkLength] = useState(50); // Increased from 40 to 50
  const [elasticity, setElasticity] = useState(0.6);
  const [friction, setFriction] = useState(0.95);
  const [gravity, setGravity] = useState(0.2);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Chain class with gear-like behavior
    class Chain {
      constructor(x, y, segments, length) {
        this.links = [];
        this.segmentLength = length;
        this.fixed = false;
        this.dragging = false;
        this.gradientOffset = 0;
        
        // Bioluminescent colors for gradient
        this.bioluminescentColors = [
          { r: 0, g: 51, b: 102 },   // Deep Blue
          { r: 0, g: 119, b: 204 },  // Ocean Blue
          { r: 0, g: 255, b: 255 },  // Cyan
          { r: 51, g: 255, b: 153 }, // Bright Green
          { r: 153, g: 255, b: 204 }, // Seafoam Green
          { r: 0, g: 119, b: 204 }   // Back to Ocean Blue for smooth loop
        ];
        
        // Create links with reasonable sizes - slightly larger for gears
        const maxRadius = 30;
        const minRadius = 8;
        
        for (let i = 0; i < segments; i++) {
          const ratio = 1 - (i / (segments - 1));
          const radius = minRadius + (ratio * (maxRadius - minRadius));
          
          // Alternate rotation direction for each link
          const rotationDirection = i % 2 === 0 ? 1 : -1;
          // Speed decreases slightly for links further down the chain
          const rotationSpeed = 0.02 * (1 - (i / segments) * 0.3);
          
          this.links.push({
            x: x,
            y: y + (i * length),
            oldX: x,
            oldY: y + (i * length) - 1,
            radius: radius,
            vx: 0,
            vy: 0,
            angle: Math.random() * Math.PI * 2, // Random initial angle
            rotationSpeed: rotationSpeed,
            rotationDirection: rotationDirection
          });
        }
      }
      
      // Get a color at a specific position in the gradient
      getGradientColor(position, offset = 0) {
        // Normalize position to 0-1 range
        const normPos = (position + offset) % 1;
        
        // Calculate which two colors to interpolate between
        const colorsCount = this.bioluminescentColors.length;
        const idx1 = Math.floor(normPos * colorsCount);
        const idx2 = (idx1 + 1) % colorsCount;
        
        const color1 = this.bioluminescentColors[idx1];
        const color2 = this.bioluminescentColors[idx2];
        
        // Calculate blend factor between the two colors
        const blendFactor = (normPos * colorsCount) % 1;
        
        // Interpolate between the two colors
        const r = Math.round(color1.r + blendFactor * (color2.r - color1.r));
        const g = Math.round(color1.g + blendFactor * (color2.g - color1.g));
        const b = Math.round(color1.b + blendFactor * (color2.b - color1.b));
        
        return { r, g, b };
      }
      
      update(elasticity, friction, gravity, mouseX, mouseY, deltaTime = 1) {
        // Update gradient
        this.gradientOffset = (this.gradientOffset + 0.0005 * deltaTime) % 1;
        
        // Apply magnetic attraction to head link if not dragging
        if (!this.dragging) {
          const head = this.links[0];
          
          // Calculate distance between mouse and head
          const dx = mouseX - head.x;
          const dy = mouseY - head.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Apply magnetic force with strength that decreases with distance
          const magneticRadius = 150; // How far the magnetic effect reaches
          this.isInMagneticRange = distance < magneticRadius;
          
          if (this.isInMagneticRange) {
            // Calculate force - stronger when closer
            const force = 0.05 * (1 - distance / magneticRadius);
            
            // Store old position for velocity calculation
            const oldX = head.x;
            const oldY = head.y;
            
            // Move head toward mouse based on magnetic force
            head.x += dx * force;
            head.y += dy * force;
            
            // Update oldX and oldY for proper physics
            head.vx = head.x - oldX;
            head.vy = head.y - oldY;
            head.oldX = oldX;
            head.oldY = oldY;
          }
        }
        
        // Update each link's rotation based on its individual direction and speed
        for (let i = 0; i < this.links.length; i++) {
          const link = this.links[i];
          link.angle += link.rotationSpeed * link.rotationDirection * deltaTime;
        }
        
        // Apply physics to each link
        for (let i = 0; i < this.links.length; i++) {
          // Skip head if fixed or dragging
          if (i === 0 && (this.fixed || this.dragging)) continue;
          
          const link = this.links[i];
          
          // Store old position
          const oldX = link.x;
          const oldY = link.y;
          
          // Apply velocity with friction
          link.vx = (link.x - link.oldX) * friction;
          link.vy = (link.y - link.oldY) * friction;
          
          // Update position based on velocity
          link.x += link.vx;
          link.y += link.vy;
          
          // Apply gravity
          link.y += gravity * deltaTime;
          
          // Store old position for next frame
          link.oldX = oldX;
          link.oldY = oldY;
        }
        
        // Apply constraints just once for better performance
        this.applyConstraints(elasticity);
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
      
      // Simplified drawing function without the blur effect
      // draw(ctx) { // Remove this method or ensure it doesn't clear
      //   // Clear canvas - REMOVE THIS LINE
      //   // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      //   
      //   // Draw the chain
      //   this.drawChain(ctx);
      // }
      
      // Helper method to draw the chain on a given context
      drawChain(ctx) {
        // Set up for additive blending to enhance glow effect
        ctx.globalCompositeOperation = 'lighter';

        // Apply blur filter
        ctx.filter = 'blur(8px)'; // Adjust the blur amount as needed

        // Draw each star only, no connecting line
        for (let i = 0; i < this.links.length; i++) {
          const link = this.links[i];
          const position = i / (this.links.length - 1);
          const color = this.getGradientColor(position, this.gradientOffset);
          
          // Make head node more reactive to magnetic attraction
          const isHead = i === 0;
          const headScale = isHead && !this.dragging && this.isInMagneticRange ? 1.2 : 1.0;

          // Calculate velocity magnitude for scaling
          const velMag = Math.sqrt(link.vx * link.vx + link.vy * link.vy);
          const velocityScaleFactor = 0.5; // Adjust this multiplier for sensitivity
          const maxScaleIncrease = 0.5; // Maximum increase in size (e.g., 0.5 means max 150% size)
          const scale = 1 + Math.min(velMag * velocityScaleFactor, maxScaleIncrease);
          
          // Draw the star with its own rotation and dynamic scale
          this.drawRotatingShape(
            ctx, 
            link.x, 
            link.y, 
            link.radius * scale * headScale, // Apply dynamic scale and head magnetic scale
            link.angle, // Use link's individual angle
            `rgba(${color.r}, ${color.g}, ${color.b}, 1.0)`
          );
        }
        
        // Reset filter and composite operation
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // Helper to draw a rotating spiked star shape with many points (gear-like)
      drawRotatingShape(ctx, x, y, radius, angle, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Draw a spiked circular star with slightly more points
        const spikes = 8; // Increased points from 6 to 8
        const outerRadius = radius;
        const innerRadius = radius * 0.75; // Keep inner radius for wheel/gear look
        
        ctx.beginPath();
        
        // Draw alternating points to create the star shape
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2; // Offset start angle
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        
        ctx.closePath();
        
        // Fill with color
        ctx.fillStyle = color;
        ctx.fill();
        
        // Remove the stroke for a cleaner look
        // ctx.strokeStyle = color;
        // ctx.lineWidth = 1;
        // ctx.stroke();
        
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
        return distance < head.radius * 1.5;
      }
      
      // Check if mouse is in magnetic range of the head
      updateMagneticState(mouseX, mouseY) {
        const head = this.links[0];
        const dx = mouseX - head.x;
        const dy = mouseY - head.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.isInMagneticRange = distance < 150;
        return this.isInMagneticRange;
      }
    }
    
    // Set canvas size
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Create chain with fewer segments (e.g., 8)
    let chain = new Chain(canvas.width / 2, canvas.height * 0.2, 8, linkLength); // Reduced segments from 15 to 8
    
    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let isDragging = false;
    
    // Mouse event handlers
    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      
      if (chain.checkDrag(mouseX, mouseY)) {
        isDragging = true;
        chain.setFixedPoint(true);
        chain.dragging = true;
      }
    };
    
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      
      if (isDragging) {
        chain.setHeadPosition(mouseX, mouseY);
      }
      
      // Always update magnetic state for visual feedback
      chain.updateMagneticState(mouseX, mouseY);
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        chain.setFixedPoint(false);
        chain.dragging = false;
        isDragging = false;
      }
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Animation loop with timestamp for delta time
    let lastTime = 0;
    let animationId;
    let backgroundOffset = 0; // For background animation
    
    // Simple particle system for background
    const particles = [];
    const numParticles = 50;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1 + 0.5, // Small particles
        speed: Math.random() * 0.2 + 0.1 // Slow drift
      });
    }

    const drawDeepSeaBackground = (ctx, time) => {
      // Animate background gradient offset slowly
      backgroundOffset = (time * 0.005) % ctx.canvas.height; // Slow vertical shift

      // Create a vertical gradient for the deep sea
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      gradient.addColorStop(0, '#00001a'); // Deepest blue/black
      gradient.addColorStop(0.3, '#001f3f'); // Navy blue
      gradient.addColorStop(0.7, '#003366'); // Darker blue
      gradient.addColorStop(1, '#001f3f'); // Back to Navy blue

      // Apply the gradient shifted by offset
      ctx.save();
      ctx.translate(0, backgroundOffset);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, -backgroundOffset, ctx.canvas.width, ctx.canvas.height);
      ctx.translate(0, -ctx.canvas.height);
      ctx.fillRect(0, -backgroundOffset, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();

      // Draw faint particles (marine snow)
      ctx.fillStyle = 'rgba(200, 220, 255, 0.1)'; // Faint light blue
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Update particle position (drift down)
        p.y += p.speed;
        if (p.y > ctx.canvas.height + p.radius) {
          p.y = -p.radius;
          p.x = Math.random() * ctx.canvas.width; // Reset x when wrapping
        }
      });
    };
    
    const animate = (currentTime) => {
      if (!isRunning) return;
      
      // Calculate delta time for smooth animation
      const deltaTime = lastTime ? (currentTime - lastTime) / 16.67 : 1;
      lastTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw deep sea background first
      drawDeepSeaBackground(ctx, currentTime);
      
      // Update chain physics
      chain.update(elasticity, friction, gravity, mouseX, mouseY, deltaTime);
      chain.constrain(canvas.width, canvas.height);
      
      // Draw chain to canvas (no clear needed inside chain.draw)
      // chain.draw(ctx); - Modify chain.draw to not clear
      chain.drawChain(ctx); // Call drawChain directly
      
      // Request next frame
      animationId = requestAnimationFrame(animate);
    };
    
    animate(0);
    
    return () => {
      // Clean up
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [linkLength, elasticity, friction, gravity, isRunning]);
  
  return (
    <div className="chained-experiment">
      <div className="canvas-container">
        <canvas ref={canvasRef} className="canvas" />
        <div className="instructions">
          Drag the top star to move the chain
        </div>
      </div>
    </div>
  );
};

export default Chained;
