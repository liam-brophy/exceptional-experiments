// src/experiments/experimentList.js
import InteractiveKeyboard from './interactiveKeyboard/InteractiveKeyboard';
import PixelMirror from './pixelMirror/PixelMirror';
import CharacterSpawner from './characterSpawner/CharacterSpawner';
import MagicCrayon from './magicCrayon/MagicCrayon';

const experimentList = [
  {
    id: 'interactive-keyboard',
    slug: 'interactive-keyboard',
    title: 'Interactive Keyboard Layout',
    description: 'An interactive visualization of keyboard characters with hover effects.',
    component: InteractiveKeyboard,
    thumbnail: '/thumbnails/interactive-keyboard.png',
  },
  {
    id: 'pixel-mirror',
    slug: 'pixel-mirror',
    title: 'Pixel Mirror',
    description: 'A customizable pixel mirror effect.',
    component: PixelMirror,
    thumbnail: '/thumbnails/experiment2.png',
  },
  {
    id: 'character-spawner',
    slug: 'character-spawner',
    title: 'Character Spawner',
    description: 'Spawn characters with physics-based interactions and customizable fonts.',
    component: CharacterSpawner,
    thumbnail: '/thumbnails/characterSpawner.png', // Placeholder, update if a specific thumbnail exists
  },
  {
    id: 'magic-crayon',
    slug: 'magic-crayon',
    title: 'Magic Crayon',
    description: 'Draw and watch the magic happen with this interactive experiment.',
    component: MagicCrayon,
    thumbnail: '/thumbnails/magicCrayon.png', // Placeholder, update if a specific thumbnail exists
  },
];

export default experimentList;
export { experimentList as experiments };