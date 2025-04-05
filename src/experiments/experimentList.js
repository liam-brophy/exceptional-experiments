// src/experiments/experimentList.js
import Experiment1 from './experiment1/Experiment1';
// Import other experiments as you create them

export const experiments = [
  {
    id: 1,
    slug: 'interactive-keyboard',
    title: 'Interactive Keyboard Layout',
    description: 'An interactive visualization of keyboard characters with hover effects',
    thumbnail: '/thumbnails/interactive-keyboard.png',
    tags: ['p5.js', 'interaction', 'typography'],
    component: Experiment1,
  },
  // Add more experiments as you create them
]