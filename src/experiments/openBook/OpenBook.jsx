import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';
import './OpenBook.css';

const PAGE_WIDTH = 3;
const PAGE_HEIGHT = 4.2;
const PAGE_DEPTH = 0.01; // Small depth for visual separation and stacking offset
const NUM_CONTENT_PAGES = 5; // Renamed from NUM_PAGES
const COVER_THICKNESS = 0.05; // Thickness for front and back covers
const SPINE_HINGE_WIDTH = 0.02; // Visual width of the spine element along X-axis at the hinge
const COVER_COLOR = 0x5c3a21; // A brownish color for the cover
const Z_OFFSET_RIGHT = -0.05; // Z-offset to ensure pages appear in front of covers when on right side

function OpenBookExperiment() {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const animationFrameRef = useRef(null);
    const pagesRef = useRef([]); // To store page meshes (covers and content pages)
    const bookGroupRef = useRef(null); // Ref for the main book group

    const [currentPage, setCurrentPage] = useState(0); // 0-indexed: 0 for front cover, 1 to N for content, N+1 for back cover
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
            // camera.position.set(3.12, 0.04, -3.14); // Old User specified default
            camera.position.set(0.25, -1.22, -7.68); // New default view from user
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
            // controls.target.set(0, 0, 0); // Already default for OrbitControls if not specified elsewhere for camera
            camera.lookAt(0, 0, 0); // Ensure camera looks at origin initially
            controls.target.set(0, 0, 0); // Explicitly set OrbitControls target
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
            // bookGroup.name = "BookGroup"; // Optional: for debugging
            scene.add(bookGroup);
            bookGroupRef.current = bookGroup; // Store ref to bookGroup

            // Materials
            const pageMaterial = new THREE.MeshStandardMaterial({
                color: 0xfff9e6, // Creamy page color
                side: THREE.DoubleSide,
                roughness: 0.8,
                metalness: 0.0,
            });
            const coverMaterial = new THREE.MeshStandardMaterial({
                color: COVER_COLOR,
                side: THREE.DoubleSide,
                roughness: 0.7,
                metalness: 0.1,
            });

            // Geometries
            const contentPageGeometry = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT);
            const coverGeometry = new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, COVER_THICKNESS);

            // Create Pages and Covers
            pagesRef.current = []; // Clear before creating
            const totalElements = NUM_CONTENT_PAGES + 2; // Front Cover + Content Pages + Back Cover

            for (let i = 0; i < totalElements; i++) {
                let mesh;
                let name;

                if (i === 0) { // Front Cover
                    mesh = new THREE.Mesh(coverGeometry, coverMaterial);
                    name = "FrontCoverMesh";
                } else if (i === totalElements - 1) { // Back Cover
                    mesh = new THREE.Mesh(coverGeometry, coverMaterial);
                    name = "BackCoverMesh";
                } else { // Content Page
                    mesh = new THREE.Mesh(contentPageGeometry, pageMaterial);
                    name = `PageMesh_${i}`; // Page 1 is at index 1, Page N is at index N
                }
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.name = name;
                pagesRef.current.push(mesh);
                bookGroupRef.current.add(mesh); // Add mesh to bookGroup via ref
            }

            // Set initial page positions: ALL elements on the visual right (book closed)
            pagesRef.current.forEach((pageMesh, i) => {
                pageMesh.position.x = -PAGE_WIDTH / 2;
                pageMesh.rotation.y = Math.PI;
                // Stacking along Z, PAGE_DEPTH is the center-to-center distance
                pageMesh.position.z = i * PAGE_DEPTH;
            });

            // Spine
            // Calculate the total depth spanned by the centers of the elements plus cover thickness
            const firstElementZ = 0; // Center of front cover
            const lastElementZ = (totalElements - 1) * PAGE_DEPTH; // Center of back cover
            const spineActualDepth = (lastElementZ - firstElementZ) + COVER_THICKNESS; // Add full thickness of covers
            const spineCenterZ = firstElementZ - (COVER_THICKNESS / 2) + (spineActualDepth / 2);

            const spineGeometry = new THREE.BoxGeometry(SPINE_HINGE_WIDTH, PAGE_HEIGHT, spineActualDepth);
            const spineMesh = new THREE.Mesh(spineGeometry, coverMaterial);
            spineMesh.position.set(0, 0, spineCenterZ); // Positioned at the hinge line (x=0), centered along the book's thickness
            spineMesh.castShadow = true;
            spineMesh.receiveShadow = true;
            bookGroupRef.current.add(spineMesh); // Add spine to bookGroup via ref
            
            // setCurrentPage(0); // Already initialized with useState(0)

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
        console.log(`[turnPage] Initiating turn. Direction: ${direction}, Current Page Before Turn: ${currentPageRef.current}`);
        const pageMeshes = pagesRef.current;
        const bookGroup = bookGroupRef.current;
        if (!bookGroup) return;

        let pageToTurnMesh;
        let pivotInitialRotationY;
        let pivotTargetRotationY;
        let finalPagePositionX;
        let finalPageRotationY;
        let isCover = false;

        if (direction === 'forward' && currentPageRef.current < NUM_CONTENT_PAGES + 1) {
            pageToTurnMesh = pageMeshes[currentPageRef.current];
            // Check if we're turning the front cover
            isCover = currentPageRef.current === 0 || currentPageRef.current === NUM_CONTENT_PAGES + 1;
            
            pivotInitialRotationY = 0;
            pivotTargetRotationY = -Math.PI;  // Negative PI for clockwise rotation
            finalPagePositionX = PAGE_WIDTH / 2;    
            finalPageRotationY = 0;  
            
            console.log(`[turnPage] Forward: Turning ${pageToTurnMesh?.name}. IsCover: ${isCover}. Pivot: ${pivotInitialRotationY} -> ${pivotTargetRotationY}. Final X: ${finalPagePositionX}, Final RotY: ${finalPageRotationY}`);
        } else if (direction === 'backward' && currentPageRef.current > 0) {
            pageToTurnMesh = pageMeshes[currentPageRef.current - 1];
            // Check if we're turning the back cover
            isCover = (currentPageRef.current - 1) === 0 || (currentPageRef.current - 1) === NUM_CONTENT_PAGES + 1;
            
            pivotInitialRotationY = -Math.PI;
            pivotTargetRotationY = 0;
            finalPagePositionX = -PAGE_WIDTH / 2;   
            finalPageRotationY = Math.PI;  
            
            console.log(`[turnPage] Backward: Turning ${pageToTurnMesh?.name}. IsCover: ${isCover}. Pivot: ${pivotInitialRotationY} -> ${pivotTargetRotationY}. Final X: ${finalPagePositionX}, Final RotY: ${finalPageRotationY}`);
        } else {
            setIsPageTurning(false);
            console.log('[turnPage] Invalid turn condition or already at limit.');
            return;
        }

        if (!pageToTurnMesh) {
            console.error('Page to turn not found');
            setIsPageTurning(false);
            return;
        }

        const originalPageZ = pageToTurnMesh.position.z;
        
        // Create a pivot that will be the animation root
        const pivot = new THREE.Object3D();
        pivot.position.set(0, 0, originalPageZ); // Pivot at spine, at page's depth
        bookGroup.add(pivot);
        
        // Remove the page from bookGroup and add to pivot
        bookGroup.remove(pageToTurnMesh);
        pivot.add(pageToTurnMesh);
        
        // Set its position and rotation relative to pivot
        if (direction === 'forward') {
            pageToTurnMesh.position.set(-PAGE_WIDTH / 2, 0, 0);
            pageToTurnMesh.rotation.set(0, Math.PI, 0); // Front of page faces towards camera
        } else { // backward
            pageToTurnMesh.position.set(PAGE_WIDTH / 2, 0, 0);
            pageToTurnMesh.rotation.set(0, 0, 0); // Front of page faces away from camera for backward turns
        }
        
        // Now set the pivot's initial rotation before animation
        pivot.rotation.y = pivotInitialRotationY;

        console.log(`[turnPage] Starting animation: pageToTurnMesh position=${JSON.stringify(pageToTurnMesh.position)} rotation=${JSON.stringify(pageToTurnMesh.rotation)}`);
        
        gsap.to(pivot.rotation, {
            duration: 2, 
            y: pivotTargetRotationY,
            ease: "power2.inOut",
            onUpdate: () => {
                // If you need to add special handling during animation, do it here
                // This is useful for debugging or applying additional effects
                // console.log(`[turnPage] Animation update: pivot.rotation.y=${pivot.rotation.y}`);
            },
            onComplete: () => {
                // Animation complete - reattach page to bookGroup and set final position/rotation
                bookGroup.remove(pivot);
                bookGroup.add(pageToTurnMesh);
                
                // Set the final position and rotation in the bookGroup
                // Adjust the z-position based on whether it's a cover or content page
                // and whether it's on the left or right side
                let finalZ = originalPageZ;
                
                // When a page is on the right side, adjust its z position to ensure visual layering
                if (finalPagePositionX > 0) { // Right side (after forward turn)
                    if (isCover) {
                        // Covers should be behind content pages when on the right side
                        // No additional Z offset needed, the page indices already handle this
                    } else {
                        // Content pages should be in front of covers when on the right side
                        finalZ += Z_OFFSET_RIGHT; // This brings the page forward (negative z is towards camera)
                    }
                }
                
                pageToTurnMesh.position.set(finalPagePositionX, 0, finalZ);
                pageToTurnMesh.rotation.y = finalPageRotationY;
                
                // The page is now in its final resting position
                console.log(`[turnPage] Animation complete: page is now at X=${finalPagePositionX}, Z=${finalZ}, rotY=${finalPageRotationY}`);

                setCurrentPage(prev => {
                    const newPage = direction === 'forward' ? prev + 1 : prev - 1;
                    console.log(`[turnPage] Updating currentPage from ${prev} to ${newPage}`);
                    return newPage;
                });
                
                setIsPageTurning(false);

                if (onTurnCompleteCallback) {
                    onTurnCompleteCallback();
                }
            }
        });
    }, [setCurrentPage, setIsPageTurning, pagesRef, currentPageRef, bookGroupRef]);
    
    const handleNextPage = () => {
        if (currentPageRef.current < NUM_CONTENT_PAGES + 1 && !isPageTurning && !isResettingRef.current) {
            setIsPageTurning(true);
            turnPage('forward', null);
        }
    };

    const handlePreviousPage = () => {
        if (currentPageRef.current > 0 && !isPageTurning && !isResettingRef.current) {
            setIsPageTurning(true);
            turnPage('backward', null);
        }
    };

    // Complete reset - a single animation to close the entire book
    const resetToFrontCover = useCallback(() => {
        console.log("[resetToFrontCover] Starting book closing animation");
        
        const bookGroup = bookGroupRef.current;
        if (!bookGroup) return;
        
        // We need to animate all pages on the right side back to the left
        const pageMeshes = pagesRef.current;
        
        // Create a parent container for the entire animation
        const animationGroup = new THREE.Group();
        bookGroup.add(animationGroup);
        
        // Track which pages are currently on the right
        const rightSidePages = [];
        
        // Find all pages currently on the right side (pages that have been turned)
        // These will be pages from index 0 to currentPage-1
        for (let i = 0; i < currentPage; i++) {
            const pageMesh = pageMeshes[i];
            if (pageMesh && pageMesh.position.x > 0) {
                rightSidePages.push({
                    mesh: pageMesh,
                    originalPosition: pageMesh.position.clone(),
                    originalRotation: pageMesh.rotation.clone(),
                    originalParent: pageMesh.parent
                });
            }
        }
        
        console.log(`[resetToFrontCover] Found ${rightSidePages.length} pages to animate back`);
        
        if (rightSidePages.length === 0) {
            console.log("[resetToFrontCover] No pages to animate, ending reset");
            bookGroup.remove(animationGroup);
            setIsResetting(false);
            return;
        }
        
        // Reparent all right side pages to our animation group
        rightSidePages.forEach(page => {
            const worldPos = new THREE.Vector3();
            const worldQuat = new THREE.Quaternion();
            page.mesh.getWorldPosition(worldPos);
            page.mesh.getWorldQuaternion(worldQuat);
            
            bookGroup.remove(page.mesh);
            animationGroup.add(page.mesh);
            
            // Preserve world position and rotation
            page.mesh.position.copy(worldPos);
            page.mesh.setRotationFromQuaternion(worldQuat);
        });
        
        // Set the animation group's pivot point at the spine
        animationGroup.position.set(0, 0, 0);
        
        // Animate the entire group rotation
        gsap.to(animationGroup.rotation, {
            duration: 1.5,
            y: -Math.PI,
            ease: "power2.inOut",
            onComplete: () => {
                // Animation complete - restore all pages to their original positions
                rightSidePages.forEach(page => {
                    animationGroup.remove(page.mesh);
                    bookGroup.add(page.mesh);
                    
                    // Get page index from the pages array to restore original Z position
                    const pageIndex = pagesRef.current.indexOf(page.mesh);
                    const originalZ = pageIndex * PAGE_DEPTH;
                    
                    // Reset to initial closed position
                    page.mesh.position.set(-PAGE_WIDTH / 2, 0, originalZ);
                    page.mesh.rotation.y = Math.PI;
                });
                
                bookGroup.remove(animationGroup);
                
                // Update state to front cover
                setCurrentPage(0);
                setIsPageTurning(false);
                setIsResetting(false);
                
                console.log("[resetToFrontCover] Animation complete, book closed");
            }
        });
    }, [bookGroupRef, pagesRef, currentPage]);
    
    const handleGoToFirstPage = () => {
        // Only allow reset when at the back cover, not turning or already resetting
        if (currentPage !== (NUM_CONTENT_PAGES + 1) || isResetting || isPageTurning) {
            return; 
        }
        setIsResetting(true);
        setIsPageTurning(true); // Set turning true to prevent other interactions
        resetToFrontCover();
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="openbook-experiment">
            <div className="canvas-container" ref={mountRef} />
            <div className="controls">
                <button onClick={() => {
                    if (cameraRef.current && controlsRef.current) {
                        const camPos = cameraRef.current.position;
                        const targetPos = controlsRef.current.target;
                        console.log(`[Camera View] Position: X=${camPos.x.toFixed(2)}, Y=${camPos.y.toFixed(2)}, Z=${camPos.z.toFixed(2)} | Target: X=${targetPos.x.toFixed(2)}, Y=${targetPos.y.toFixed(2)}, Z=${targetPos.z.toFixed(2)}`);
                    }
                }}>Log Camera View</button>

                {currentPage > 0 && !isResetting && (
                    <button 
                        onClick={handlePreviousPage}
                        disabled={isPageTurning || isResetting}>
                        Previous Page
                    </button>
                )}
                
                {currentPage < NUM_CONTENT_PAGES + 1 && !isResetting && (
                    <button 
                        onClick={handleNextPage}
                        disabled={isPageTurning || isResetting}>
                        Next Page
                    </button>
                )}
                
                {currentPage === NUM_CONTENT_PAGES + 1 && (
                    <button 
                        onClick={handleGoToFirstPage}
                        disabled={isPageTurning || isResetting}>
                        {isResetting ? 'Resetting...' : 'Go to Front Cover'}
                    </button>
                )}
            </div>
            <div className="debug-info" style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                {currentPage === 0 && `Front Cover (Closed)`}
                {currentPage > 0 && currentPage <= NUM_CONTENT_PAGES && `Page ${currentPage} of ${NUM_CONTENT_PAGES}`}
                {currentPage === NUM_CONTENT_PAGES + 1 && `Back Cover (Open)`}
                {' | Total Elements: '} {NUM_CONTENT_PAGES + 2}
            </div>
        </div>
    );
}

export default OpenBookExperiment;