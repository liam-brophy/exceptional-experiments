// scripts/create-experiment.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get experiment name from command line argument
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Please provide an experiment name');
  process.exit(1);
}

const experimentName = args[0];
const slug = experimentName.toLowerCase().replace(/\s+/g, '-');
const componentName = experimentName
  .split(/\s+/)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

const experimentDir = path.join(__dirname, '../src/experiments', slug);

// Create directory
fs.mkdirSync(experimentDir, { recursive: true });

// Create component file
const componentContent = `import { useEffect, useRef, useState } from 'react';
import './${componentName}.css';

const ${componentName} = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    // Your animation logic here
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Example drawing
      ctx.fillStyle = 'purple';
      ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 - 50, 100, 100);
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className="${slug}-experiment">
      <div className="controls">
        {/* Add your controls here */}
        <button>Example Button</button>
      </div>
      <canvas ref={canvasRef} className="canvas" />
    </div>
  );
};

export default ${componentName};
`;

fs.writeFileSync(path.join(experimentDir, `${componentName}.jsx`), componentContent);

// Create CSS file
const cssContent = `.${slug}-experiment {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}

.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.controls button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.controls button:hover {
  background-color: #2980b9;
}

.canvas {
  flex: 1;
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
}
`;

fs.writeFileSync(path.join(experimentDir, `${componentName}.css`), cssContent);

// Create placeholder thumbnail
fs.mkdirSync(path.join(__dirname, '../public/thumbnails'), { recursive: true });

console.log(`
Experiment "${experimentName}" created successfully!

Next steps:
1. Add your experiment to src/experiments/experimentList.js:

import ${componentName} from './${slug}/${componentName}';

// In the experiments array:
{
  id: <next-id>,
  slug: '${slug}',
  title: '${experimentName}',
  description: 'Description of your experiment',
  thumbnail: '/thumbnails/${slug}.png',
  tags: ['animation', 'interactive'],
  component: ${componentName},
}

2. Create a thumbnail image in public/thumbnails/${slug}.png
`);