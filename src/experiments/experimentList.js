// src/experiments/experimentList.js
import InteractiveKeyboard from './interactiveKeyboard/InteractiveKeyboard';
import PixelMirror from './pixelMirror/PixelMirror';
import CharacterSpawner from './characterSpawner/CharacterSpawner';
import MagicCrayon from './magicCrayon/MagicCrayon';
import TypeCaster from './typeCaster/TypeCaster';
import Outliner from './outliner/Outliner';
import Chained from './chained/Chained';
import Letturn from './letturn/Letturn'; // Add import for the new component

const experimentList = [
  {
    id: 'interactive-keyboard',
    slug: 'interactive-keyboard',
    title: 'Interactive Keyboard Layout',
    description: 'An interactive visualization of keyboard characters with hover effects.',
    component: InteractiveKeyboard,
    thumbnail: '/thumbnails/interactive-keyboard.png',
    tags: ['typography', 'generative'],
    createdAt: '2025-01-15',
  },
  {
    id: 'pixel-mirror',
    slug: 'pixel-mirror',
    title: 'Pixel Mirror',
    description: 'A customizable pixel mirror effect.',
    component: PixelMirror,
    thumbnail: '/thumbnails/experiment2.png',
    tags: ['mirror', 'generative'],
    createdAt: '2025-02-03',
  },
  {
    id: 'character-spawner',
    slug: 'character-spawner',
    title: 'Character Spawner',
    description: 'Spawn characters with physics-based interactions and customizable fonts.',
    component: CharacterSpawner,
    thumbnail: '/thumbnails/characterSpawner.png', // Placeholder, update if a specific thumbnail exists
    tags: ['physics', 'typography'],
    createdAt: '2024-12-20',
  },
  {
    id: 'magic-crayon',
    slug: 'magic-crayon',
    title: 'Magic Crayon',
    description: 'Draw and watch the magic happen with this interactive experiment.',
    component: MagicCrayon,
    thumbnail: '/thumbnails/MagicCrayon.png', // Fixed capitalization to match actual filename
    tags: ['generative', 'animation'],
    createdAt: '2025-03-28',
  },
  {
    id: 'type-caster',
    slug: 'type-caster',
    title: 'Type Caster',
    description: 'Cast text characters that animate and fall across your screen with physics effects.',
    component: TypeCaster,
    thumbnail: '/thumbnails/typeCaster.png', // Fixed to match actual filename (using camelCase)
    tags: ['animation', 'typography', 'physics'],
    createdAt: '2025-01-05',
  },
  {
    id: 'outliner',
    slug: 'outliner',
    title: 'Outliner',
    description: 'Create artistic outlines with customizable styles and animations.',
    component: Outliner,
    thumbnail: '/thumbnails/Outliner.png', // Updated thumbnail path
    tags: ['animation', 'generative'],
    createdAt: '2025-03-12',
  },
  {
    id: 'chained',
    slug: 'chained',
    title: 'Chained',
    description: 'Create mesmerizing linked chain patterns that react to your movements.',
    component: Chained,
    thumbnail: '/thumbnails/Chained.png', // Updated thumbnail path
    tags: ['animation', 'physics'],
    createdAt: '2025-04-10',
  },
  {
    id: 'letturn',
    slug: 'letturn',
    title: 'Letturn',
    description: 'Users pick from an array of characters, and when selected they are rendered and movable in 3js',
    component: Letturn,
    thumbnail: '/thumbnails/Letturn.png', // Updated thumbnail path
    tags: ['3d', 'typography', 'interactive'],
    createdAt: '2025-04-26', // Current date
  },
];

export default experimentList;
export { experimentList as experiments };