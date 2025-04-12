import React, { useRef, useEffect, useState } from 'react';
import './MagicCrayon.css';
import p5 from 'p5';

const MagicCrayon = () => {
  const sketchRef = useRef(null);
  const [growthSpeed, setGrowthSpeed] = useState(5);
  const [branchingFactor, setBranchingFactor] = useState(3);
  const [colorVariety, setColorVariety] = useState(4);
  const [evolutionMode, setEvolutionMode] = useState(true);
  
  useEffect(() => {
    let sketch = new p5((p) => {
      // Settings that p5 will access
      let settings = {
        growthSpeed,
        branchingFactor,
        colorVariety,
        evolutionMode
      };
      
      let paths = [];
      let currentPath = [];
      let growthSystems = [];
      
      // Define the cool color palette
      const coolPalette = [
        [79, 195, 247],  // Light blue
        [129, 212, 250], // Sky blue
        [0, 150, 136],   // Teal
        [77, 182, 172],  // Light teal
        [121, 134, 203], // Lavender
        [149, 117, 205], // Purple
        [100, 221, 187], // Aqua mint
        [115, 240, 174], // Light green
      ];
      
      p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(sketchRef.current);
        p.background(10, 20, 30); // Deep blue-black for contrast
        p.frameRate(60);
        p.colorMode(p.RGB, 255, 255, 255, 1); // Use alpha range 0-1 for easier blending
      };
      
      p.draw = () => {
        // Slower fade for longer-lasting effects
        p.background(10, 20, 30, 0.01);
        
        // Draw all paths with flowing, glowing effect
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];
          if (path.length > 1) {
            // Fluid, large strokes
            p.noFill();
            p.strokeWeight(10); // Larger stroke
            
            // Inner glow - brighter core
            const baseColor = path.color || coolPalette[0];
            p.stroke(baseColor[0], baseColor[1], baseColor[2], 0.6);
            drawSmoothPath(path, 10);
            
            // Outer glow - softer edge
            p.strokeWeight(16); 
            p.stroke(baseColor[0], baseColor[1], baseColor[2], 0.2);
            drawSmoothPath(path, 16);
          }
        }
        
        // Draw the current path being drawn
        if (currentPath.length > 1) {
          const baseColor = currentPath.color || coolPalette[0];
          
          // Fluid, large strokes with glow effect
          p.noFill();
          
          // Inner glow - brighter core
          p.strokeWeight(10);
          p.stroke(baseColor[0], baseColor[1], baseColor[2], 0.7);
          drawSmoothPath(currentPath, 10);
          
          // Outer glow - softer edge
          p.strokeWeight(16);
          p.stroke(baseColor[0], baseColor[1], baseColor[2], 0.3);
          drawSmoothPath(currentPath, 16);
        }
        
        // Update and draw organic growth systems
        growthSystems.forEach(system => {
          // Each system manages its own particles and branches
          system.update(settings.growthSpeed, settings.branchingFactor, settings.evolutionMode);
          system.draw();
        });
        
        // If in infinite evolution mode, maintain a minimum number of active branches
        if (settings.evolutionMode) {
          maintainActiveGrowth();
        }
      };
      
      // Keep the growth going indefinitely by adding new branches if needed
      const maintainActiveGrowth = () => {
        // Count total active branches across all systems
        let activeBranchCount = 0;
        growthSystems.forEach(system => {
          activeBranchCount += system.getActiveBranchCount();
        });
        
        // If there are growth systems but too few active branches, stimulate new growth
        if (growthSystems.length > 0 && activeBranchCount < 10) {
          // Find a system with seed points to grow from
          const systemIndex = Math.floor(p.random(growthSystems.length));
          const system = growthSystems[systemIndex];
          
          // Stimulate new growth from a random seed point
          if (system.seedPoints.length > 0) {
            const pointIndex = Math.floor(p.random(system.seedPoints.length));
            const seedPoint = system.seedPoints[pointIndex];
            
            // Create new branch at this point
            const colorVariation = p.random(-settings.colorVariety * 10, settings.colorVariety * 10);
            const branchColor = [
              p.constrain(system.baseColor[0] + colorVariation, 0, 255),
              p.constrain(system.baseColor[1] + colorVariation, 0, 255),
              p.constrain(system.baseColor[2] + colorVariation, 0, 255)
            ];
            
            system.createBranch(seedPoint.x, seedPoint.y, branchColor);
          }
        }
      };
      
      // Draw a path with smooth curves instead of sharp line segments
      const drawSmoothPath = (path, lineWeight) => {
        if (path.length < 2) return;
        
        p.beginShape();
        
        // Draw a curved line through all points
        p.curveVertex(path[0].x, path[0].y); // Start control point
        
        for (let i = 0; i < path.length; i++) {
          p.curveVertex(path[i].x, path[i].y);
        }
        
        // End control point
        p.curveVertex(path[path.length-1].x, path[path.length-1].y);
        
        p.endShape();
      };
      
      // Organic Growth System - manages growth particles
      class GrowthSystem {
        constructor(pathPoints, baseColor) {
          this.seedPoints = [...pathPoints];
          this.baseColor = baseColor;
          this.lifespan = Infinity; // Essentially immortal when in evolution mode
          this.age = 0;
          this.branches = [];
          
          // Create initial branches from seed points
          const step = Math.max(1, Math.floor(pathPoints.length / 10));
          for (let i = 0; i < pathPoints.length; i += step) {
            if (i >= pathPoints.length) break;
            
            // Create a branch with some randomness in color
            const colorVariation = p.random(-settings.colorVariety * 10, settings.colorVariety * 10);
            const branchColor = [
              p.constrain(baseColor[0] + colorVariation, 0, 255),
              p.constrain(baseColor[1] + colorVariation, 0, 255),
              p.constrain(baseColor[2] + colorVariation, 0, 255)
            ];
            
            this.createBranch(pathPoints[i].x, pathPoints[i].y, branchColor);
          }
        }
        
        // Get the count of active branches
        getActiveBranchCount() {
          return this.branches.filter(branch => branch.age < branch.lifespan * 0.8).length;
        }
        
        // Create a new growing branch
        createBranch(x, y, color) {
          const angle = p.random(p.TWO_PI);
          const speed = p.random(0.2, 0.5); // Increased speed for more visible growth
          
          this.branches.push({
            x: x,
            y: y,
            originalX: x,
            originalY: y,
            segments: [],
            angle: angle,
            speed: speed,
            length: 0,
            maxLength: p.random(50, 200), // Longer branches
            thickness: p.random(2, 6), // Thicker branches
            color: color,
            age: 0,
            lifespan: p.random(800, 2000), // Much longer lifespan
            hasSpawned: false,
            spawnCount: 0,
            maxSpawns: Math.floor(p.random(2, 5)), // More potential branches
            energyLevel: 1.0,
            growth: 1.0, // Full growth initially
            growthDirection: 1, // 1 for growing, -1 for shrinking
            evolutionState: 'growing', // growing, stable, evolving, or dying
            evolutionTimer: 0,
            evolutionPeriod: p.random(300, 600)
          });
        }
        
        // Update all branches
        update(speedFactor, branchingFactor, evolutionMode) {
          this.age++;
          
          // Update existing branches
          this.branches = this.branches.filter(branch => {
            branch.age++;
            
            if (evolutionMode) {
              // In evolution mode, branches go through cycles rather than just dying
              this.updateEvolutionState(branch);
            }
            
            // Only grow if in an active state
            if (branch.evolutionState !== 'dying' || !evolutionMode) {
              // Calculate growth based on energy level and growth factor
              const movement = branch.speed * speedFactor * 0.1 * branch.energyLevel * branch.growth;
              
              if (movement > 0.01) { // Only add segments if there's meaningful growth
                // Add some gentle, organic waviness to the growth
                branch.angle += p.random(-0.12, 0.12);
                
                // Grow in the current direction
                const newX = branch.x + Math.cos(branch.angle) * movement;
                const newY = branch.y + Math.sin(branch.angle) * movement;
                
                // Check if new point is within canvas bounds
                if (newX >= 0 && newX < p.width && newY >= 0 && newY < p.height) {
                  // Store the segment
                  branch.segments.push({
                    x1: branch.x,
                    y1: branch.y,
                    x2: newX,
                    y2: newY
                  });
                  
                  // Update position and length
                  branch.x = newX;
                  branch.y = newY;
                  branch.length += movement;
                } else {
                  // Branches that hit the edge change direction
                  branch.angle += p.PI + p.random(-0.5, 0.5);
                }
                
                // Chance to create new branches based on energy level and settings
                if (branch.evolutionState !== 'dying' && 
                    branch.length > branch.maxLength * 0.2 &&
                    branch.spawnCount < branch.maxSpawns && 
                    branch.energyLevel > 0.3 &&
                    p.random(1) < 0.02 * branchingFactor) {
                  
                  // Create a child branch with slightly modified properties
                  const childColor = [...branch.color];
                  // Slight color evolution
                  childColor[0] = p.constrain(childColor[0] + p.random(-15, 15), 0, 255);
                  childColor[1] = p.constrain(childColor[1] + p.random(-15, 15), 0, 255);
                  childColor[2] = p.constrain(childColor[2] + p.random(-15, 15), 0, 255);
                  
                  this.createBranch(
                    branch.x, 
                    branch.y, 
                    childColor
                  );
                  
                  branch.spawnCount++;
                  branch.energyLevel *= 0.85; // Reduce energy after spawning
                }
              }
            }
            
            // If we're using evolution mode, branches don't die from age unless marked as dying
            if (evolutionMode) {
              return branch.evolutionState !== 'dying' || branch.segments.length > 0;
            } else {
              // Traditional aging system
              branch.energyLevel = p.map(branch.age, 0, branch.lifespan, 1.0, 0);
              return branch.age < branch.lifespan;
            }
          });
        }
        
        // Update a branch's evolution state
        updateEvolutionState(branch) {
          branch.evolutionTimer++;
          
          // Transition between states based on timer
          if (branch.evolutionTimer >= branch.evolutionPeriod) {
            branch.evolutionTimer = 0;
            branch.evolutionPeriod = p.random(300, 600); // Reset with new period
            
            // Transition to next state
            switch(branch.evolutionState) {
              case 'growing':
                branch.evolutionState = 'stable';
                branch.growth = 0.5; // Slow down
                break;
              case 'stable':
                // Either evolve or start dying with some randomness
                branch.evolutionState = p.random() < 0.7 ? 'evolving' : 'dying';
                if (branch.evolutionState === 'evolving') {
                  branch.growth = 0.8;
                  // Refresh energy when evolving
                  branch.energyLevel = Math.max(branch.energyLevel, p.random(0.5, 0.8));
                  // Allow spawning of new branches
                  branch.spawnCount = Math.max(0, branch.spawnCount - 1);
                  // Change direction slightly
                  branch.angle += p.random(-p.HALF_PI, p.HALF_PI);
                } else {
                  branch.growth = 0.1;
                }
                break;
              case 'evolving':
                // Either continue stable or start dying
                branch.evolutionState = p.random() < 0.6 ? 'stable' : 'dying';
                branch.growth = branch.evolutionState === 'stable' ? 0.5 : 0.1;
                break;
              case 'dying':
                // Once dying, stay dying but segments will be removed gradually
                // This case is handled in the draw function
                break;
            }
          }
        }
        
        // Draw all branches
        draw() {
          // Draw each branch as a series of segments with fading opacity
          this.branches.forEach(branch => {
            // Calculate opacity based on age or state
            let opacity = 1.0;
            
            if (settings.evolutionMode) {
              // In evolution mode, opacity is based on state more than age
              switch(branch.evolutionState) {
                case 'growing':
                  opacity = 1.0;
                  break;
                case 'stable':
                  opacity = 0.9;
                  break;
                case 'evolving':
                  opacity = 0.85 + 0.15 * Math.sin(p.frameCount * 0.05); // Slight pulsing
                  break;
                case 'dying':
                  opacity = p.map(branch.segments.length, 0, branch.segments.length, 0, 0.6);
                  break;
              }
            } else {
              // Traditional fading
              opacity = p.map(branch.age, 0, branch.lifespan, 1.0, 0);
            }
            
            // Draw segments with tapering thickness
            branch.segments.forEach((segment, i) => {
              // Taper the branch - thicker at base, thinner at tip
              const segmentPosition = i / Math.max(1, branch.segments.length);
              const thickness = branch.thickness * (1 - segmentPosition * 0.5);
              
              // Inner glow - core of the branch
              p.stroke(branch.color[0], branch.color[1], branch.color[2], opacity * 0.8);
              p.strokeWeight(thickness);
              p.line(segment.x1, segment.y1, segment.x2, segment.y2);
              
              // Outer glow - softer edge
              p.stroke(branch.color[0], branch.color[1], branch.color[2], opacity * 0.3);
              p.strokeWeight(thickness * 2);
              p.line(segment.x1, segment.y1, segment.x2, segment.y2);
            });
            
            // Draw growth tip with a subtle glow
            if (branch.segments.length > 0 && branch.evolutionState !== 'dying') {
              p.noStroke();
              p.fill(branch.color[0], branch.color[1], branch.color[2], opacity * 0.6);
              p.circle(branch.x, branch.y, branch.thickness * 4); // Larger growth tip
              
              // Add additional particle effects at the tip for more visible growth
              if (p.frameCount % 3 === 0 && branch.evolutionState === 'growing') {
                for (let i = 0; i < 2; i++) {
                  p.fill(branch.color[0], branch.color[1], branch.color[2], opacity * 0.4);
                  p.circle(
                    branch.x + p.random(-branch.thickness, branch.thickness),
                    branch.y + p.random(-branch.thickness, branch.thickness),
                    p.random(1, branch.thickness * 1.5)
                  );
                }
              }
            }
            
            // If branch is dying and in evolution mode, start removing segments from the beginning
            if (settings.evolutionMode && branch.evolutionState === 'dying' && branch.segments.length > 0) {
              if (p.frameCount % 10 === 0) {
                branch.segments.shift(); // Remove the oldest segment
              }
            }
          });
        }
        
        // Check if the growth system is still alive
        isAlive() {
          // Systems are immortal in evolution mode as long as they have branches
          if (settings.evolutionMode) {
            return this.branches.length > 0;
          }
          return this.age < this.lifespan || this.branches.length > 0;
        }
      }
      
      // Basic p5.js mouse event handlers
      p.mousePressed = () => {
        // Don't start a path if clicking on controls
        if (p.mouseX > p.width - 250 && p.mouseY < 200) return; 
        
        // Create a new path with a random color from the cool palette
        currentPath = [];
        currentPath.color = coolPalette[Math.floor(p.random(coolPalette.length))];
        paths.push(currentPath);
        
        const point = { x: p.mouseX, y: p.mouseY };
        currentPath.push(point);
      };
      
      p.mouseDragged = () => {
        // Only add points if we're actually drawing
        if (currentPath.length > 0) {
          // Add point with some smoothing based on distance
          const lastPoint = currentPath[currentPath.length - 1];
          const mousePoint = { x: p.mouseX, y: p.mouseY };
          
          // Calculate distance to last point
          const d = p.dist(lastPoint.x, lastPoint.y, mousePoint.x, mousePoint.y);
          
          // Add intermediate points for smoother curves if distance is large
          if (d > 10) {
            const numSteps = Math.floor(d / 5);
            for (let i = 1; i <= numSteps; i++) {
              const t = i / numSteps;
              const x = p.lerp(lastPoint.x, mousePoint.x, t);
              const y = p.lerp(lastPoint.y, mousePoint.y, t);
              currentPath.push({ x, y });
            }
          } else {
            currentPath.push(mousePoint);
          }
        }
      };
      
      p.mouseReleased = () => {
        // Only create growth system if we've actually drawn something
        if (currentPath.length > 5) {
          // Create an organic growth system from the path
          growthSystems.push(new GrowthSystem([...currentPath], currentPath.color));
        }
      };
      
      p.keyPressed = () => {
        if (p.key === 'c' || p.key === 'C') {
          // Clear canvas
          paths = [];
          growthSystems = [];
          p.background(10, 20, 30);
        }
      };
      
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
      
      // Update settings when they change
      p.updateSettings = (newSettings) => {
        settings = { ...settings, ...newSettings };
      };
    }, sketchRef.current);
    
    // Update settings when React state changes
    sketch.updateSettings({ 
      growthSpeed, 
      branchingFactor,
      colorVariety,
      evolutionMode
    });
    
    // Cleanup on unmount
    return () => {
      sketch.remove();
    };
  }, []); // Empty dependency array to initialize once
  
  // Update p5 settings when React state changes
  useEffect(() => {
    if (sketchRef.current && sketchRef.current.childNodes[0]) {
      const p5Instance = sketchRef.current.childNodes[0].p5;
      if (p5Instance && typeof p5Instance.updateSettings === 'function') {
        p5Instance.updateSettings({ 
          growthSpeed, 
          branchingFactor,
          colorVariety,
          evolutionMode
        });
      }
    }
  }, [growthSpeed, branchingFactor, colorVariety, evolutionMode]);
  
  return (
    <div className="magic-crayon-container">
      <div 
        ref={sketchRef} 
        className="canvas-container"
      ></div>
      
      <div className="controls">
        <h3>Organic Growth</h3>
        
        <div className="control-group">
          <label>Growth Speed: {growthSpeed}</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={growthSpeed} 
            onChange={(e) => setGrowthSpeed(Number(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>Branching: {branchingFactor}</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={branchingFactor} 
            onChange={(e) => setBranchingFactor(Number(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>Color Variety: {colorVariety}</label>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={colorVariety} 
            onChange={(e) => setColorVariety(Number(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={evolutionMode}
              onChange={(e) => setEvolutionMode(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Infinite Evolution
          </label>
        </div>
      </div>
      
      <div className="instructions">
        Draw with the organic crayon to create living, evolving patterns!
        <br/>
        Press 'C' to clear the canvas
      </div>
    </div>
  );
};

export default MagicCrayon;