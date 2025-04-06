// src/experiments/experimentList.js
import Experiment1 from './experiment1/Experiment1';
import Experiment2 from './experiment2/Experiment2';
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
  {
    id: 2, // Fixed the typo by replacing <next-id> with 2
    slug: 'experiment2',
    title: 'experiment2',
    description: 'Description of your experiment',
    thumbnail: '/thumbnails/experiment2.png',
    tags: ['animation', 'interactive'],
    component: Experiment2,
  }
  // Add more experiments as you create them
];