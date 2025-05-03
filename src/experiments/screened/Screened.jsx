import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Screened.css'; // Keep existing CSS for container styling and cursor
import screenedCursorUrl from '/public/cursors/screened_cursor.png'; // Import the cursor

// --- Vertex Shader ---
// Passes position and UV coordinates to the fragment shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// --- Fragment Shader ---
// Performs the warping effect on the GPU
const fragmentShader = `
  uniform vec2 u_mouse; // Mouse position (normalized 0.0 to 1.0)
  uniform sampler2D u_texture; // The background image
  uniform float u_aspect; // Aspect ratio (width / height)
  uniform float u_warpFactor;
  uniform float u_warpRadius; // Radius (normalized based on height)
  uniform float u_time; // Add time uniform

  varying vec2 vUv; // UV coordinates from vertex shader

  // --- Helper functions for HSL conversion ---
  // From https://gist.github.com/mairod/a75e7b44f68110e1576d77419d60f7a6
  vec3 rgb2hsl( vec3 color ) {
    float h = 0.0;
    float s = 0.0;
    float l = 0.0;
    float r = color.r;
    float g = color.g;
    float b = color.b;
    float cMin = min( r, min( g, b ) );
    float cMax = max( r, max( g, b ) );

    l = ( cMax + cMin ) / 2.0;
    if ( cMax > cMin ) {
      float cDelta = cMax - cMin;
      s = l < .5 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) );
      if ( r == cMax ) {
        h = ( g - b ) / cDelta;
      } else if ( g == cMax ) {
        h = 2.0 + ( b - r ) / cDelta;
      } else {
        h = 4.0 + ( r - g ) / cDelta;
      }
      if ( h < 0.0) {
        h += 6.0;
      }
      h = h / 6.0;
    }
    return vec3( h, s, l );
  }

  float hue2rgb( float f1, float f2, float hue ) {
    if ( hue < 0.0 ) {
      hue += 1.0;
    } else if ( hue > 1.0 ) {
      hue -= 1.0;
    }
    float res;
    if ( ( 6.0 * hue ) < 1.0 ) {
      res = f1 + ( f2 - f1 ) * 6.0 * hue;
    } else if ( ( 2.0 * hue ) < 1.0 ) {
      res = f2;
    } else if ( ( 3.0 * hue ) < 2.0 ) {
      res = f1 + ( f2 - f1 ) * ( ( 2.0 / 3.0 ) - hue ) * 6.0;
    } else {
      res = f1;
    }
    return res;
  }

  vec3 hsl2rgb( vec3 hsl ) {
    vec3 rgb;
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    if ( s == 0.0 ) {
      rgb = vec3( l, l, l ); // Luminance
    } else {
      float f2;
      if ( l < 0.5 ) {
        f2 = l * ( 1.0 + s );
      } else {
        f2 = l + s - s * l;
      }
      float f1 = 2.0 * l - f2;
      rgb.r = hue2rgb( f1, f2, h + ( 1.0 / 3.0 ) );
      rgb.g = hue2rgb( f1, f2, h );
      rgb.b = hue2rgb( f1, f2, h - ( 1.0 / 3.0 ) );
    }
    return rgb;
  }
  // --- End HSL functions ---

  void main() {
    vec2 uv = vUv;
    vec2 mouse = u_mouse;

    // Adjust mouse coordinates and calculate distance considering aspect ratio
    // This makes the warp radius circular in screen space
    vec2 adjustedUV = vec2(uv.x * u_aspect, uv.y);
    vec2 adjustedMouse = vec2(mouse.x * u_aspect, mouse.y);
    float dist = distance(adjustedUV, adjustedMouse);

    float radius = u_warpRadius; // Use the radius directly (normalized relative to height)

    if (dist < radius) {
        vec2 direction = normalize(uv - mouse); // Use original UVs for direction
        float warpAmount = (radius - dist) / radius;
        // Apply a non-linear effect (e.g., ease-out cubic)
        warpAmount = 1.0 - pow(1.0 - warpAmount, 3.0);

        // Calculate displacement vector (adjust factor as needed)
        vec2 displacement = direction * warpAmount * u_warpFactor;

        // Pull inwards: subtract displacement from original uv
        uv -= displacement;

        // Clamp UVs to avoid reading outside the texture
        uv = clamp(uv, 0.0, 1.0);
    }

    // Sample the texture at the (potentially warped) uv coordinate
    vec4 color = texture2D(u_texture, uv);

    // --- Hue Shift Calculation ---
    vec3 hsl = rgb2hsl(color.rgb);
    // Oscillate hue shift amount using sine wave based on time
    // Adjust magnitude (0.2) and speed (0.75)
    float hueShift = sin(u_time * 0.75) * 0.2; // Increased magnitude and speed
    hsl.x = mod(hsl.x + hueShift, 1.0); // Add shift and wrap around using mod
    vec3 shiftedRgb = hsl2rgb(hsl);
    // --- End Hue Shift ---

    gl_FragColor = vec4(shiftedRgb, color.a); // Use shifted color
    // gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0); // Debug UVs
    // gl_FragColor = vec4(dist/radius, 0.0, 0.0, 1.0); // Debug distance
  }
`;

const Screened = () => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const materialRef = useRef(null);
  const mousePosRef = useRef({ x: 0.5, y: 0.5 }); // Store normalized mouse coords
  const clockRef = useRef(new THREE.Clock()); // Add clock for time

  useEffect(() => {
    const currentMount = mountRef.current;
    let width = currentMount.clientWidth;
    let height = currentMount.clientHeight;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // --- Camera Setup ---
    // Use OrthographicCamera for 2D effects
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- Set Cursor Style Programmatically on Canvas ---
    if (renderer.domElement) {
        renderer.domElement.style.cursor = `url(${screenedCursorUrl}), auto`;
    }
    // --- End Cursor Style ---

    // --- Texture Loading ---
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
        '/assets/screen.PNG',
        () => { // onLoad callback
            console.log("Texture loaded");
            // Set aspect ratio uniform once texture loads
            if (materialRef.current) {
                materialRef.current.uniforms.u_aspect.value = width / height;
            }
            animate(); // Start animation loop *after* texture is loaded
        },
        undefined, // onProgress callback (optional)
        (err) => { // onError callback
            console.error('Error loading texture:', err);
        }
    );
    texture.minFilter = THREE.LinearFilter; // Optional: improve texture quality
    texture.magFilter = THREE.LinearFilter; // Optional: improve texture quality

    // --- Shader Material ---
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_texture: { value: texture },
        u_mouse: { value: new THREE.Vector2(mousePosRef.current.x, mousePosRef.current.y) },
        u_aspect: { value: width / height },
        // --- Adjust values --- 
        u_warpFactor: { value: 0.05 }, // Decreased strength
        u_warpRadius: { value: 0.125 }, // Decreased radius
        u_time: { value: 0.0 } // Initialize time uniform
        // --- End Adjust --- 
      },
      vertexShader,
      fragmentShader,
    });
    materialRef.current = material;

    // --- Geometry and Mesh ---
    // PlaneGeometry covers the view: (-1,-1) to (1,1) in normalized device coords
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- Mouse Move Handler ---
    const handleMouseMove = (event) => {
      const rect = currentMount.getBoundingClientRect();
      // Normalize mouse coordinates to 0.0 - 1.0 range
      const x = (event.clientX - rect.left) / width;
      const y = 1.0 - (event.clientY - rect.top) / height; // Invert Y for texture coords
      mousePosRef.current = { x, y };
      // Update uniform directly (more efficient than state)
      if (materialRef.current) {
        materialRef.current.uniforms.u_mouse.value.set(x, y);
      }
    };
    currentMount.addEventListener('mousemove', handleMouseMove);

    // --- Resize Handler ---
    const handleResize = () => {
      width = currentMount.clientWidth;
      height = currentMount.clientHeight;
      renderer.setSize(width, height);
      // Update camera if needed (Orthographic usually doesn't need update unless aspect changes significantly)
      // Update aspect ratio uniform
      if (materialRef.current) {
        materialRef.current.uniforms.u_aspect.value = width / height;
      }
      // Note: Orthographic camera projection update isn't typically needed for simple resizes
      // unless you change the left/right/top/bottom bounds based on aspect ratio.

      // --- Re-apply Cursor Style on Resize (optional but safe) ---
      if (renderer.domElement) {
          renderer.domElement.style.cursor = `url(${screenedCursorUrl}), auto`;
      }
      // --- End Re-apply ---
    };
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Update time uniform
      if (materialRef.current) {
        materialRef.current.uniforms.u_time.value = clockRef.current.getElapsedTime();
      }

      renderer.render(scene, camera);
    };
    // Start animation loop in texture onLoad callback

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
        currentMount.removeEventListener('mousemove', handleMouseMove);
        if (renderer.domElement) {
            currentMount.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      console.log("Screened WebGL cleanup complete");
    };
  }, []); // Empty dependency array ensures setup runs once on mount

  return (
    <div ref={mountRef} className="screened-experiment" style={{ width: '100%', height: '100%', position: 'relative' }} />
  );
};

export default Screened;
