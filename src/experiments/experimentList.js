// src/experiments/experimentList.js
import Experiment1 from './experiment1/Experiment1';
import Experiment2 from './experiment2/Experiment2';
// Import other experiments as you create them

export const experiments = [
  {
    id: 1,
    slug: 'bouncing-balls',
    title: 'Bouncing Balls Physics',
    description: 'Interactive physics simulation with bouncing balls',
    thumbnail: '/thumbnails/bouncing-balls.png',
    tags: ['physics', 'canvas', 'animation'],
    component: Experiment1,
  },
  {
    id: 2,
    slug: 'particle-system',
    title: 'Particle System Generator',
    description: 'Customizable particle system with various effects',
    thumbnail: '/thumbnails/particle-system.png',
    tags: ['particles', 'canvas', 'interactive'],
    component: Experiment2,
  },
  // Add more experiments as you create them
]