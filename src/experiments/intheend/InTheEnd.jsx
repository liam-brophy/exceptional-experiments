import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import * as THREE from 'three';
import './InTheEnd.css';

// --- Shaders ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D u_texture;      // Current texture
  uniform sampler2D u_texture_prev; // Previous texture
  uniform float u_mixFactor;      // Mix factor (0.0 to 1.0)
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;          // Mouse position (0.0 to 1.0)
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 mouse = u_mouse;
    float aspect = u_resolution.x / u_resolution.y;

    // Adjust UV and mouse for aspect ratio to make effect circular
    vec2 adjustedUV = vec2(uv.x * aspect, uv.y);
    vec2 adjustedMouse = vec2(mouse.x * aspect, mouse.y);

    float dist = distance(adjustedUV, adjustedMouse);

    // Pulsing/Warp effect parameters (centered on mouse)
    float pulseSpeed = 0.6;
    float pulseMagnitude = 0.06; // Decreased from 0.12
    float pulseRadius = 0.25; // Decreased from 0.35

    float warpAmount = 0.0;
    if (dist < pulseRadius) {
        // Calculate a pulsing warp amount based on time and distance from mouse
        // Use pow for a sharper falloff
        float radialPulse = sin(u_time * pulseSpeed - dist * (1.0 / pulseRadius) * 8.0) * pulseMagnitude;
        // Fade the effect out towards the edge of the radius
        warpAmount = (1.0 - pow(dist / pulseRadius, 2.0)) * radialPulse;
    }

    // Apply warp radially from the mouse position
    vec2 direction = normalize(uv - mouse); // Use original uv/mouse for direction
    vec2 warpedUv = uv + direction * warpAmount;

    // Clamp UVs
    warpedUv = clamp(warpedUv, 0.0, 1.0);

    // Sample both textures with the *same* warped UVs
    vec4 colorPrev = texture2D(u_texture_prev, warpedUv);
    vec4 colorCurrent = texture2D(u_texture, warpedUv);

    // Mix the colors based on the mix factor
    gl_FragColor = mix(colorPrev, colorCurrent, u_mixFactor);
  }
`;

// --- Image Files ---
const imageFiles = [
  '/assets/in the end/soul+1.jpg',
  '/assets/in the end/soul+7.jpg',
  '/assets/in the end/soul+9.jpg',
  '/assets/in the end/soul+10.jpg',
  '/assets/in the end/soul+14.jpg',
  '/assets/in the end/soul+16.jpg',
  '/assets/in the end/soul+17.jpg',
  '/assets/in the end/soul+20.jpg',
];


const InTheEnd = () => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const materialRef = useRef(null);
  const texturesRef = useRef([]);
  const clockRef = useRef(new THREE.Clock());
  const mousePosRef = useRef({ x: 0.5, y: 0.5 }); // Normalized mouse coords
  const mixFactorRef = useRef({ current: 1.0, target: 1.0, animating: false }); // For transition animation
  const animationFrameRef = useRef(); // For mix factor animation frame

  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0); // Start previous same as current

  const imageDisplayDuration = 6000; // Total time including transition
  const transitionDuration = 3000; // 3 seconds for fade

  // --- Preload Textures ---
   useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    texturesRef.current = imageFiles.map(src => {
      const texture = textureLoader.load(src);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    });
    console.log("Textures preloaded:", texturesRef.current.length);

    // Cleanup textures on unmount
    return () => {
      texturesRef.current.forEach(texture => texture.dispose());
      texturesRef.current = [];
    };
  }, []); // Run only once


  // --- Mouse Move Handler ---
  const handleMouseMove = useCallback((event) => {
    if (!mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1.0 - (event.clientY - rect.top) / rect.height; // Invert Y
    mousePosRef.current = { x, y };
    if (materialRef.current) {
      materialRef.current.uniforms.u_mouse.value.set(x, y);
    }
  }, []); // Empty dependency array, mountRef/materialRef are stable refs

  // --- Animate Mix Factor ---
  const animateMixFactor = useCallback(() => {
    const mix = mixFactorRef.current;
    if (!mix.animating) {
        cancelAnimationFrame(animationFrameRef.current);
        return;
    }

    const elapsedTime = clockRef.current.getElapsedTime();
    let progress = Math.min(1.0, (elapsedTime - mix.startTime) / (transitionDuration / 1000));

    // Apply Ease-Out Cubic easing function
    const easeOutCubic = (t) => (--t)*t*t+1;
    mix.current = easeOutCubic(progress);

    if (materialRef.current) {
        materialRef.current.uniforms.u_mixFactor.value = mix.current;
    }

    if (progress < 1.0) {
        animationFrameRef.current = requestAnimationFrame(animateMixFactor);
    } else {
        mix.animating = false;
        mix.current = 1.0; // Ensure it ends exactly at 1.0
        if (materialRef.current) { // Final update
            materialRef.current.uniforms.u_mixFactor.value = 1.0;
        }
    }
  }, [transitionDuration]);

  // --- Three.js Setup ---
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount || texturesRef.current.length === 0) return;

    let width = currentMount.clientWidth;
    let height = currentMount.clientHeight;

    // Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;


    // Material - Add new uniforms
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_texture: { value: texturesRef.current[currentIndex] },
        u_texture_prev: { value: texturesRef.current[previousIndex] }, // Use previousIndex state
        u_mixFactor: { value: mixFactorRef.current.current }, // Use ref value
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(width, height) },
        u_mouse: { value: new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y) },
      },
      vertexShader,
      fragmentShader,
    });
    materialRef.current = material;

    // Geometry & Mesh
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- Resize Handler ---
    const handleResize = () => {
        if (!currentMount || !rendererRef.current || !materialRef.current) return;
        width = currentMount.clientWidth;
        height = currentMount.clientHeight;
        rendererRef.current.setSize(width, height);
        materialRef.current.uniforms.u_resolution.value.set(width, height);
    };
    window.addEventListener('resize', handleResize);

    // --- Add Mouse Listener ---
    currentMount.addEventListener('mousemove', handleMouseMove);

    // --- Animation Loop (update time) ---
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clockRef.current.getElapsedTime(); // Get time once per frame
      if (materialRef.current) {
        materialRef.current.uniforms.u_time.value = elapsedTime;
      }
      // The mix factor animation runs independently via animateMixFactor
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate(); // Start main animation loop

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      cancelAnimationFrame(animationFrameRef.current); // Cancel mix factor animation too
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
          currentMount.removeEventListener('mousemove', handleMouseMove);
          if (rendererRef.current?.domElement) {
              try { // Add try-catch for robustness during cleanup
                  currentMount.removeChild(rendererRef.current.domElement);
              } catch (e) {
                  console.warn("Failed to remove renderer DOM element:", e);
              }
          }
      }
      rendererRef.current?.dispose();
      geometry.dispose();
      materialRef.current?.dispose();
      // Dispose textures in the main preload effect cleanup
      console.log("InTheEnd WebGL cleanup complete");
    };
  }, []); // Dependency array is empty for initial setup

  // --- Image Cycling Interval & Transition Logic ---
  useEffect(() => {
    if (texturesRef.current.length === 0) return; // Don't start interval until textures are loaded

    const intervalId = setInterval(() => {
      const currentIdx = currentIndex; // Capture current index before state update
      const nextIndex = (currentIdx + 1) % texturesRef.current.length;

      setPreviousIndex(currentIdx); // Current becomes previous
      setCurrentIndex(nextIndex);   // Update to next index

      // Update textures in shader
      if (materialRef.current) {
        materialRef.current.uniforms.u_texture_prev.value = texturesRef.current[currentIdx];
        materialRef.current.uniforms.u_texture.value = texturesRef.current[nextIndex];

        // Start mix animation
        mixFactorRef.current.current = 0.0; // Start fully on previous texture
        mixFactorRef.current.target = 1.0;  // Animate towards current texture
        mixFactorRef.current.animating = true;
        mixFactorRef.current.startTime = clockRef.current.getElapsedTime(); // Record start time
        cancelAnimationFrame(animationFrameRef.current); // Ensure previous animation is stopped
        animateMixFactor(); // Start the animation loop
      }

    }, imageDisplayDuration);

    return () => clearInterval(intervalId);
  }, [currentIndex, imageDisplayDuration, animateMixFactor]); // Re-run if currentIndex changes to capture it correctly for the *next* interval


  // Render mount point
  return <div ref={mountRef} className="in-the-end-canvas" />;
};

export default InTheEnd;
