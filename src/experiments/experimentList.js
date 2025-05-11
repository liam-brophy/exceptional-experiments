// src/experiments/experimentList.js
import InteractiveKeyboard from './interactiveKeyboard/InteractiveKeyboard';
import PixelMirror from './pixelMirror/PixelMirror';
import CharacterSpawner from './characterSpawner/CharacterSpawner';
import MagicCrayon from './magicCrayon/MagicCrayon';
import TypeCaster from './typeCaster/TypeCaster';
import Outliner from './outliner/Outliner';
import Chained from './chained/Chained';
import Letturn from './letturn/Letturn'; 
import Screened from './screened/Screened';
import InTheEnd from './intheend/InTheEnd';
import Puzzler from './puzzler/Puzzler';
import PixelType from './pixelType/PixelType';
import OpenBookExperiment from './openBook/OpenBook';
import NeoBrutalistReader from './neoBrutalistReader/NeoBrutalistReader'; // Import the new NeoBrutalistReader component

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
    tags: ['generative'], // Removed 'mirror'
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
    tags: ['typography', 'interactive'], // Removed '3d'
    createdAt: '2025-04-26', // Current date
  },
  {
    id: 'screened',
    slug: 'screened',
    title: 'Screened',
    description: 'A full screen canvas with a warping effect based on mouse movement.',
    component: Screened,
    thumbnail: '/thumbnails/screened.png', // Placeholder, update if a specific thumbnail exists
    tags: ['interactive'], // Removed 'visual'
    createdAt: '2025-05-03', // Current date
  },
  {
    id: 'in-the-end',
    slug: 'in-the-end',
    title: 'In the End',
    description: 'Slowly fade and dissolve between images with blurs and a black background.',
    component: InTheEnd,
    thumbnail: '/thumbnails/in-the-end.png', // Placeholder, you need to create this thumbnail
    tags: ['animation'], // Removed 'visual' and 'transition'
    createdAt: '2025-05-03', // Current date
  },
  {
    id: 'puzzler',
    slug: 'puzzler',
    title: 'Puzzler',
    description: 'Upload an image, shatter it into puzzle pieces, and rebuild it by dragging pieces to their correct positions.',
    component: Puzzler,
    thumbnail: '/thumbnails/puzzler.png', // Using the placeholder thumbnail
    tags: ['interactive'], // Removed 'game' tag
    createdAt: '2025-05-03', // Current date
  },
  {
    id: 'pixel-type',
    slug: 'pixel-type',
    title: 'Pixel Type',
    description: 'Type sentences and watch them appear in a stylish pixel font with subtle animations.',
    component: PixelType,
    thumbnail: '/thumbnails/pixel-type.png', // We'll create a placeholder later
    tags: ['typography', 'animation', 'interactive'],
    createdAt: '2025-05-06', // Current date
  },
  {
    id: 'open-book',
    slug: 'open-book',
    title: 'Open Book',
    description: 'Interactive 3D book with animated page turning effect using Three.js.',
    component: OpenBookExperiment,
    thumbnail: '/thumbnails/open-book.png',
    tags: ['animation', 'interactive'],
    createdAt: '2025-05-08', // Today's date
  },
  {
    id: 'neo-brutalist-reader',
    slug: 'neo-brutalist-reader',
    title: 'Neo Brutalist Reader',
    description: 'A reading interface with neo-brutalist design principles featuring bold borders, minimalist aesthetics, and interactive controls.',
    component: NeoBrutalistReader,
    thumbnail: '/thumbnails/neo-brutalist-reader.png', // You'll need to create this thumbnail
    tags: ['typography', 'interactive'],
    createdAt: '2025-05-11', // Today's date
  },
];

export default experimentList;
export { experimentList as experiments };