import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';
import './OpenBook.css';

const PAGE_WIDTH = 3;
const PAGE_HEIGHT = 4.2;
const PAGE_DEPTH = 0.01; // Small depth for visual separation
const NUM_PAGES = 5;

function OpenBookExperiment() {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameRef = useRef(null);
    const pagesRef = useRef([]); // To store page meshes

    const [currentPage, setCurrentPage] = useState(1); // 1-indexed
    const currentPageRef = useRef(currentPage); // Ref for currentPage

    const [isPageTurning, setIsPageTurning] = useState(false);
    // No need for isPageTurningRef if setIsPageTurning(false) is called before chained callbacks

    const [isResetting, setIsResetting] = useState(false); // For "Go to Page 1"
    const isResettingRef = useRef(isResetting); // Ref for isResetting

    const [error, setError] = useState(null);

    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    useEffect(() => {
        isResettingRef.current = isResetting;
    }, [isResetting]);

    // Effect for one-time 3D scene setup
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        let scene, camera, renderer, controls;

        try {
            // Scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xffffff);
            sceneRef.current = scene;

            // Camera
            camera = new THREE.PerspectiveCamera(45, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
            camera.position.set(3.12, 0.04, -3.14); // User specified default
            cameraRef.current = camera;

            // Renderer
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            currentMount.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            // Controls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 3;
            controls.maxDistance = 10;
            controls.target.set(0, 0, 0);
            controlsRef.current = controls;

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambientLight);
            const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
            mainLight.position.set(0, 8, 8);
            mainLight.castShadow = true;
            scene.add(mainLight);

            // Book Group
            const bookGroup = new THREE.Group();
            scene.add(bookGroup);

            // Create Pages
            pagesRef.current = []; // Clear before creating
            for (let i = 0; i < NUM_PAGES; i++) {
                const pageGeometry = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT);
                const pageMaterial = new THREE.MeshStandardMaterial({
                    color: 0xfff9e6, // Creamy page color
                    side: THREE.DoubleSide,
                    roughness: 0.8, // Less shiny
                    metalness: 0.0,
                });
                const page = new THREE.Mesh(pageGeometry, pageMaterial);
                page.castShadow = true;
                page.receiveShadow = true;
                // Store a unique name for debugging if needed
                page.name = `PageMesh_${i + 1}`;
                pagesRef.current.push(page);
                bookGroup.add(page);
            }

            // Set initial page positions: ALL pages on the visual right for Page 1
            pagesRef.current.forEach((page, i) => {
                page.position.x = -PAGE_WIDTH / 2; // Changed from PAGE_WIDTH / 2
                page.rotation.y = Math.PI;         // Changed from 0
                page.position.z = i * PAGE_DEPTH; 
            });
            
            // setCurrentPage(1); // Already initialized with useState(1)

            // Animation Loop
            const animate = () => {
                animationFrameRef.current = requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();

            // Resize Handler
            const handleResize = () => {
                if (currentMount && renderer && camera) {
                    camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
                }
            };
            window.addEventListener('resize', handleResize);

            // Cleanup
            return () => {
                window.removeEventListener('resize', handleResize);
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                
                // Dispose of page geometries and materials
                pagesRef.current.forEach(page => {
                    if (page.geometry) page.geometry.dispose();
                    if (page.material) {
                        if (Array.isArray(page.material)) {
                            page.material.forEach(m => m.dispose());
                        } else {
                            page.material.dispose();
                        }
                    }
                    // Remove page from its parent (bookGroup)
                    if (page.parent) page.parent.remove(page);
                });
                pagesRef.current = []; // Clear the array

                // Dispose of other scene objects (lights, etc.) if they were added directly to the scene
                // and remove them from the scene.
                if (sceneRef.current) {
                    // Remove all children from the scene
                    while(sceneRef.current.children.length > 0){ 
                        const object = sceneRef.current.children[0];
                        if (object.geometry) object.geometry.dispose();
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(material => material.dispose());
                            } else {
                                object.material.dispose();
                            }
                        }
                        sceneRef.current.remove(object); 
                    }
                }

                // Dispose of renderer and controls
                if (rendererRef.current && rendererRef.current.domElement && currentMount.contains(rendererRef.current.domElement)) {
                     try { currentMount.removeChild(rendererRef.current.domElement); } catch (e) { /* ignore */ }
                }
                if (rendererRef.current) {
                    rendererRef.current.dispose();
                    rendererRef.current = null;
                }
                if (controlsRef.current) {
                    controlsRef.current.dispose();
                    controlsRef.current = null;
                }
                sceneRef.current = null; // Clear scene ref
                cameraRef.current = null; // Clear camera ref
            };

        } catch (err) {
            console.error("Error in OpenBook experiment setup:", err);
            setError("Failed to initialize 3D scene. Please try refreshing.");
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- Page Turning Functions ---

    const turnPage = useCallback((direction, onTurnCompleteCallback) => {
        // Guards for isPageTurning are handled by the calling functions.
        // They should set setIsPageTurning(true) before calling this.

        const pageMeshes = pagesRef.current;
        let pageToTurnMesh;
        let pivotInitialRotationY = 0;
        let pivotTargetRotationY;
        let finalPagePositionX;
        let finalPageRotationY;

        if (direction === 'forward' && currentPageRef.current < NUM_PAGES) {
            // FORWARD: Visually Right to Left
            // (World -X, PI) to (World +X, 0)
            pageToTurnMesh = pageMeshes[currentPageRef.current - 1]; 
            pivotInitialRotationY = Math.PI;    // Was 0
            pivotTargetRotationY = 0;           // Was Math.PI
            finalPagePositionX = PAGE_WIDTH / 2;       // Was -PAGE_WIDTH / 2
            finalPageRotationY = 0;             // Was Math.PI
        } else if (direction === 'backward' && currentPageRef.current > 1) {
            // BACKWARD: Visually Left to Right
            // (World +X, 0) to (World -X, PI)
            pageToTurnMesh = pageMeshes[currentPageRef.current - 2]; 
            pivotInitialRotationY = 0;          // Was Math.PI
            pivotTargetRotationY = Math.PI;     // Was 0
            finalPagePositionX = -PAGE_WIDTH / 2;      // Was PAGE_WIDTH / 2
            finalPageRotationY = Math.PI;       // Was 0
        } else {
            setIsPageTurning(false); 
            if (onTurnCompleteCallback) onTurnCompleteCallback();
            return;
        }

        if (!pageToTurnMesh) {
            console.error("Page mesh to turn not found!", { direction, currentPage: currentPageRef.current });
            setIsPageTurning(false);
            if (onTurnCompleteCallback) onTurnCompleteCallback();
            return;
        }

        const pivot = new THREE.Group();
        const bookGroup = pageToTurnMesh.parent; 
        bookGroup.add(pivot);
        const originalPageZ = pageToTurnMesh.position.z;
        bookGroup.remove(pageToTurnMesh);
        pivot.add(pageToTurnMesh);
        pivot.position.set(0, 0, originalPageZ);
        pivot.rotation.y = pivotInitialRotationY;

        if (direction === 'forward') {
            pageToTurnMesh.position.set(PAGE_WIDTH / 2, 0, 0); 
            pageToTurnMesh.rotation.y = 0; 
        } else { 
            pageToTurnMesh.position.set(PAGE_WIDTH / 2, 0, 0); 
            pageToTurnMesh.rotation.y = 0; 
        }
        
        gsap.to(pivot.rotation, {
            y: pivotTargetRotationY,
            duration: 1,
            ease: "power1.inOut",
            onComplete: () => {
                pivot.remove(pageToTurnMesh);
                bookGroup.add(pageToTurnMesh);
                bookGroup.remove(pivot); 
                pageToTurnMesh.position.set(finalPagePositionX, 0, originalPageZ);
                pageToTurnMesh.rotation.y = finalPageRotationY;

                setCurrentPage(prev => {
                    const newPage = direction === 'forward' ? prev + 1 : prev - 1;
                    // currentPageRef is updated by its own useEffect
                    return newPage;
                });
                
                setIsPageTurning(false);

                if (onTurnCompleteCallback) {
                    onTurnCompleteCallback();
                }
            }
        });
    }, [setCurrentPage, setIsPageTurning, pagesRef, currentPageRef]); // Added useCallback and dependencies
    
    const handleNextPage = () => {
        if (currentPageRef.current < NUM_PAGES && !isPageTurning && !isResettingRef.current) {
            setIsPageTurning(true);
            turnPage('forward', null);
        }
    };

    const handlePreviousPage = () => {
        if (currentPageRef.current > 1 && !isPageTurning && !isResettingRef.current) {
            setIsPageTurning(true);
            turnPage('backward', null);
        }
    };

    const handleGoToFirstPage = () => {
        // Use component state for guards
        if (currentPage !== NUM_PAGES || isResetting || isPageTurning) {
            return; 
        }
        setIsResetting(true); 
        // The useEffect below will handle the page turning sequence.
    };

    // useEffect to handle the "Go to Page 1" resetting process
    useEffect(() => {
        if (isResetting && currentPage > 1 && !isPageTurning) {
            setIsPageTurning(true); // Set before calling turnPage
            turnPage('backward', null); // Let turnPage handle setIsPageTurning(false) on complete
        } else if (isResetting && currentPage <= 1 && !isPageTurning) {
            // Reset process is finished when we reach page 1 (or less, defensively)
            // AND no page is currently turning.
            setIsResetting(false);
        }
    }, [currentPage, isResetting, isPageTurning, turnPage]);
    
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="openbook-experiment">
            <div className="canvas-container" ref={mountRef} />
            <div className="controls">
                {currentPage > 1 && !isResetting && (
                    <button 
                        onClick={handlePreviousPage}
                        disabled={isPageTurning || isResetting}>
                        Previous Page
                    </button>
                )}
                
                {currentPage < NUM_PAGES && !isResetting && (
                    <button 
                        onClick={handleNextPage}
                        disabled={isPageTurning || isResetting}>
                        Next Page
                    </button>
                )}
                
                {currentPage === NUM_PAGES && (
                    <button 
                        onClick={handleGoToFirstPage}
                        disabled={isPageTurning || isResetting}>
                        {isResetting ? 'Resetting...' : 'Go to Page 1'}
                    </button>
                )}
            </div>
            <div className="debug-info" style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                Current page: {currentPage} of {NUM_PAGES}
            </div>
        </div>
    );
}

export default OpenBookExperiment;