import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import Globe from './Globe';


interface SolarSystemProps {
  width?: string;
  height?: string;
}

interface PlanetNavigation {
  goToNext: () => void;
  goToPrevious: () => void;
  resetView: () => void;
  isInFocusMode: () => boolean;
}

interface ExtendedViewer extends Cesium.Viewer {
  planetNavigation?: PlanetNavigation;
}

interface CelestialBody {
  name: string;
  entity: Cesium.Entity;
  radius: number;
}

const SolarSystem: React.FC<SolarSystemProps> = ({
  width = "100%",
  height = "500px"
}) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ExtendedViewer | null>(null);
  const toggleOrbitModeRef = useRef<(() => void) | null>(null); // ADD THIS LINE
  const navigate = useNavigate();
  const [isGlobeView, setIsGlobeView] = useState(false);
  const [isMarsView, setIsMarsView] = useState(false);
  const [isOrbitingEnabled, setIsOrbitingEnabled] = useState(false); // Default to non-movement

  const handleToggleOrbit = () => {
    const newOrbitState = !isOrbitingEnabled;
    setIsOrbitingEnabled(newOrbitState);
    console.log('🔄 Orbit mode toggled to:', newOrbitState);
  };

  const returnToSolarSystem = () => {
    console.log('🚀 Returning to solar system from Globe...');
    setIsGlobeView(false);
    // Small delay to allow Globe component to unmount
    setTimeout(() => {
      // Re-show all entities that were hidden during transition
      if (viewerRef.current) {
        const viewer = viewerRef.current;        
        // Show all entities in the viewer (planets, sun, rings)
        console.log('🔄 Re-showing all entities...');
        viewer.entities.values.forEach((entity) => {
          entity.show = true;
        });
        
        // Reset view to show full solar system
        if (viewer.planetNavigation) {
          console.log('🔄 Resetting planet navigation view...');
          viewer.planetNavigation.resetView();
        } else {
          console.log('❌ No planetNavigation found');
        }
      }
    }, 100);
  };

  // Global keyboard handler for solar system navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle keyboard events when we're in solar system view (not globe view)
    if (isGlobeView) {
      return;
    }
    
    // Safety check: ensure viewer is available and fully initialized
    try {
      if (!viewerRef.current || viewerRef.current.isDestroyed()) {
        return; // Fail silently when viewer not available
      }
      
      // Try to access clock property safely
      const clock = viewerRef.current.clock;
      if (!clock) {
        return; // Fail silently when clock not available
      }
    } catch (error) {
      return; // Fail silently on any error
    }
    
    // Use the planetNavigation functions if available
    const planetNav = viewerRef.current.planetNavigation;
    if (!planetNav) {
      return;
    }
    
    // Only handle arrow keys when in focus mode
    if (planetNav.isInFocusMode()) {
      switch(event.code) {
        case 'ArrowLeft': 
          planetNav.goToPrevious(); 
          event.preventDefault(); 
          break;
        case 'ArrowRight': 
          planetNav.goToNext(); 
          event.preventDefault(); 
          break;
      }
    }
    
    // Handle space key for reset
    if (event.code === 'Space') {
      planetNav.resetView();
      event.preventDefault();
    }
  }, [isGlobeView]);

  // Add/remove keyboard listener based on component state
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isGlobeView]); // Re-add listener when view state changes

  useEffect(() => {
    if (!cesiumContainer.current) return;
    
    // Only initialize if we don't already have a viewer and we're not in globe view
    if (viewerRef.current || isGlobeView) {
      console.log('⏭️ Skipping viewer initialization - already have viewer or in detailed view');
      return;
    }    // Initialize Cesium viewer
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      timeline: false,
      animation: false,
      infoBox: false,
      selectionIndicator: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      navigationHelpButton: false
    });

    viewerRef.current = viewer as ExtendedViewer;

    // Configure scene
    viewer.scene.globe.show = false;
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    if (viewer.scene.skyBox) viewer.scene.skyBox.show = true;
    if (viewer.scene.sun) viewer.scene.sun.show = true;
    if (viewer.scene.moon) viewer.scene.moon.show = false;
    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
    viewer.scene.imageryLayers.removeAll();
    viewer.scene.globe.enableLighting = true;

    // Configure camera controls
    const canvas = viewer.cesiumWidget.canvas;
    canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); }, { passive: false });
    
    viewer.scene.screenSpaceCameraController.enableRotate = true;
    viewer.scene.screenSpaceCameraController.enableTranslate = true;
    viewer.scene.screenSpaceCameraController.enableZoom = true;
    viewer.scene.screenSpaceCameraController.enableTilt = true;
    viewer.scene.screenSpaceCameraController.enableLook = true;
    
    viewer.scene.screenSpaceCameraController.translateEventTypes = Cesium.CameraEventType.RIGHT_DRAG;
    viewer.scene.screenSpaceCameraController.rotateEventTypes = Cesium.CameraEventType.LEFT_DRAG;
    viewer.scene.screenSpaceCameraController.lookEventTypes = Cesium.CameraEventType.MIDDLE_DRAG;
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];

    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000;

    // Initialize solar system inline
    const initializeSolarSystem = (viewer: Cesium.Viewer) => {
    // Sun
    const sunEntity = viewer.entities.add({
      name: 'Sun',
      position: Cesium.Cartesian3.fromElements(0, 0, 0),
      ellipsoid: {
        radii: new Cesium.Cartesian3(696340, 696340, 696340),
        material: new Cesium.ImageMaterialProperty({
              image: '/sun_texture.jpg',
              transparent: false
        })
      },
      label: {
        text: 'Sun',
        font: '20pt sans-serif',
        fillColor: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -120), // Position above Sun
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 1.0,
        show: true
     }
    });

    // Planet definitions
    const planets = [
      { name: 'Mercury', color: Cesium.Color.GRAY, distance: 1e6, radius: 50000 },
      { name: 'Venus', color: Cesium.Color.BEIGE, distance: 2e6, radius: 120000 },
      { name: 'Earth', color: Cesium.Color.BLUE, distance: 3e6, radius: 127000 },
      { name: 'Mars', color: Cesium.Color.RED, distance: 4e6, radius: 70000 },
      { name: 'Jupiter', color: Cesium.Color.SANDYBROWN, distance: 6e6, radius: 400000 },
      { name: 'Saturn', color: Cesium.Color.GOLD, distance: 8e6, radius: 350000 },
      { name: 'Uranus', color: Cesium.Color.CYAN, distance: 10e6, radius: 250000 },
      { name: 'Neptune', color: Cesium.Color.DEEPSKYBLUE, distance: 12e6, radius: 240000 }
    ];

    const canvas = viewer.cesiumWidget.canvas;
    const simEpoch = Cesium.JulianDate.fromDate(new Date()); 

    let cbCalls = 0;
    setInterval(() => { console.log('callback calls/sec', cbCalls); cbCalls = 0; }, 1000);

    // Add planets
    const planetEntities: { name: string; entity: Cesium.Entity; distance: number; radius: number; rings?: Cesium.Entity[] }[] = [];
    const simulationStartTime = Date.now();

     // Create initial static planets
    planets.forEach((p) => {
      let entity;

      if (p.name === 'Earth') {
        entity = viewer.entities.add({
          name: p.name,
          position: Cesium.Cartesian3.fromElements(p.distance, 0, 0),
          ellipsoid: {
            radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
            material: new Cesium.ImageMaterialProperty({
              image: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
              transparent: false
            })
          },
          label: {
            text: p.name,
            font: '16pt sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            eyeOffset: new Cesium.Cartesian3(0, 0, -p.radius * 1.5),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scale: 0.8,
            show: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
      } else {
        entity = viewer.entities.add({
          name: p.name,
          position: Cesium.Cartesian3.fromElements(p.distance, 0, 0),
          ellipsoid: {
            radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
            material: new Cesium.ImageMaterialProperty({
              image: `/${p.name.toLowerCase()}_texture.jpg`,
              transparent: false
            })
          },
          label: {
            text: p.name,
            font: '16pt sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -50),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scale: 0.8,
            show: true
          }
        });
      }
      
      planetEntities.push({ ...p, entity });
    });

// Function to create static planets (no orbiting)
// const createStaticPlanets = () => {
//   planets.forEach((p) => {
//     let entity;

//     if (p.name === 'Earth') {
//       entity = viewer.entities.add({
//         name: p.name,
//         position: Cesium.Cartesian3.fromElements(p.distance, 0, 0),
//         ellipsoid: {
//           radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
//           material: new Cesium.ImageMaterialProperty({
//             image: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
//             transparent: false
//           })
//         },
//         label: {
//           text: p.name,
//           font: '16pt sans-serif',
//           fillColor: Cesium.Color.WHITE,
//           outlineColor: Cesium.Color.BLACK,
//           outlineWidth: 2,
//           style: Cesium.LabelStyle.FILL_AND_OUTLINE,
//           eyeOffset: new Cesium.Cartesian3(0, 0, -p.radius * 1.5),
//           horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
//           verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
//           scale: 0.8,
//           show: true,
//           disableDepthTestDistance: Number.POSITIVE_INFINITY
//         }
//       });
//     } else {
//       entity = viewer.entities.add({
//         name: p.name,
//         position: Cesium.Cartesian3.fromElements(p.distance, 0, 0), // Static position
//         ellipsoid: {
//           radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
//           material: new Cesium.ImageMaterialProperty({
//             image: `/${p.name.toLowerCase()}_texture.jpg`,
//             transparent: false
//           })
//         },
//         label: {
//           text: p.name,
//           font: '16pt sans-serif',
//           fillColor: Cesium.Color.WHITE,
//           outlineColor: Cesium.Color.BLACK,
//           outlineWidth: 2,
//           style: Cesium.LabelStyle.FILL_AND_OUTLINE,
//           pixelOffset: new Cesium.Cartesian2(0, -50),
//           horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
//           verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
//           scale: 0.8,
//           show: true
//         }
//       });
//     }
    
//     planetEntities.push({ ...p, entity });
//   });
// };

// // Function to create orbiting planets (with callbacks)
// const createOrbitingPlanets = () => {
//   planets.forEach((p, index) => {
//     // Orbital parameters
//     const orbitalPeriods = {
//       'Mercury': 88 / 365.25,    // 88 Earth days
//       'Venus': 225 / 365.25,     // 225 Earth days  
//       'Earth': 1.0,              // 1 Earth year
//       'Mars': 1.88,              // 1.88 Earth years
//       'Jupiter': 11.86,          // 11.86 Earth years
//       'Saturn': 29.46,           // 29.46 Earth years
//       'Uranus': 84.01,           // 84.01 Earth years
//       'Neptune': 164.8           // 164.8 Earth years
//     };

//     const orbitalPeriod = orbitalPeriods[p.name as keyof typeof orbitalPeriods] || 1.0;
//     const startOffset = (index * 45) * Math.PI / 180; // Spread planets out initially

//     let entity;
//     if (p.name === 'Earth') {
//       entity = viewer.entities.add({
//         name: p.name,
//         position: new Cesium.CallbackProperty(function(time) {
//           const simSeconds = Cesium.JulianDate.secondsDifference(time, simEpoch);
//           cbCalls++;
          
//           // Calculate orbital position
//           const speedMultiplier = 500;
//           const angle = startOffset + (simSeconds * speedMultiplier * 2 * Math.PI) / (orbitalPeriod * 365.25 * 24 * 3600);
          
//           const x = p.distance * Math.cos(angle);
//           const y = p.distance * Math.sin(angle);
//           const z = 0;

//           return new Cesium.Cartesian3(x, y, z);
//         }, false),
//         ellipsoid: {
//           radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
//           material: new Cesium.ImageMaterialProperty({
//             image: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
//             transparent: false
//           })
//         },
//         label: {
//           text: p.name,
//           font: '16pt sans-serif',
//           fillColor: Cesium.Color.WHITE,
//           outlineColor: Cesium.Color.BLACK,
//           outlineWidth: 2,
//           style: Cesium.LabelStyle.FILL_AND_OUTLINE,
//           eyeOffset: new Cesium.Cartesian3(0, 0, -p.radius * 1.5),
//           horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
//           verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
//           scale: 0.8,
//           show: true,
//           disableDepthTestDistance: Number.POSITIVE_INFINITY
//         }
//       });
//     } else {
//       entity = viewer.entities.add({
//         name: p.name,
//         position: new Cesium.CallbackProperty(function(time) {
//           const simSeconds = Cesium.JulianDate.secondsDifference(time, simEpoch);
//           cbCalls++;
          
//           const speedMultiplier = 500;
//           const angle = startOffset + (simSeconds * speedMultiplier * 2 * Math.PI) / (orbitalPeriod * 365.25 * 24 * 3600);
          
//           const x = p.distance * Math.cos(angle);
//           const y = p.distance * Math.sin(angle);
//           const z = 0;
          
//           return new Cesium.Cartesian3(x, y, z);
//         }, false),
//         ellipsoid: {
//           radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
//           material: new Cesium.ImageMaterialProperty({
//             image: `/${p.name.toLowerCase()}_texture.jpg`,
//             transparent: false
//           })
//         },
//         label: {
//           text: p.name,
//           font: '16pt sans-serif',
//           fillColor: Cesium.Color.WHITE,
//           outlineColor: Cesium.Color.BLACK,
//           outlineWidth: 2,
//           style: Cesium.LabelStyle.FILL_AND_OUTLINE,
//           pixelOffset: new Cesium.Cartesian2(0, -50),
//           horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
//           verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
//           scale: 0.8,
//           show: true
//         }
//       });
//     }
    
//     planetEntities.push({ ...p, entity });
//   });
// };

    // // Function to toggle between static and orbiting modes
    // const toggleOrbitMode = () => {
    //   // Clear existing planets
    //    console.log('🔍 toggleOrbitMode called, isOrbitingEnabled value:', isOrbitingEnabled);
  
    //   // Clear existing planets
    //   viewer.entities.removeAll();
    //   planetEntities.length = 0; // Clear the array
      
    //   // Recreate planets based on mode
    //   if (isOrbitingEnabled) {
    //     console.log('🪐 Creating orbiting planets...');
    //     viewer.clock.currentTime = Cesium.JulianDate.clone(simEpoch);
    //     viewer.clock.shouldAnimate = true;          // Allow the clock to tick
    //     viewer.clock.multiplier = 60 * 60 * 12;     // Speed up 12 hours per second

    //     createOrbitingPlanets();
    //     console.log('🪐 Switched to orbiting mode');
    //   } else {
    //     console.log('⏸️ Creating static planets...');
    //     viewer.clock.shouldAnimate = false;         // Stop the clock

    //     createStaticPlanets();
    //     console.log('⏸️ Switched to static mode');
    //   }
  
    //   // Recreate the sun (it gets removed with removeAll)
    //   const sunEntity = viewer.entities.add({
    //     name: 'Sun',
    //     position: Cesium.Cartesian3.fromElements(0, 0, 0),
    //     ellipsoid: {
    //       radii: new Cesium.Cartesian3(696340, 696340, 696340),
    //       material: new Cesium.ImageMaterialProperty({
    //             image: '/sun_texture.jpg',
    //             transparent: false
    //       })
    //     },
    //     label: {
    //       text: 'Sun',
    //       font: '20pt sans-serif',
    //       fillColor: Cesium.Color.YELLOW,
    //       outlineColor: Cesium.Color.BLACK,
    //       outlineWidth: 3,
    //       style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //       pixelOffset: new Cesium.Cartesian2(0, -100), // Position above Sun
    //       horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    //       verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    //       scale: 1.0,
    //       show: true
    //   }
    //  });
    // };

    // toggleOrbitModeRef.current = toggleOrbitMode;

    // Initialize with static planets (default mode)
    // createStaticPlanets();

    

    // Planet visualization state
    let currentPlanetView : CelestialBody | null = null;
    let isInFocusMode = false;

    // Add Earth's Moon
    const earthPlanet = planetEntities.find(p => p.name === 'Earth');
    if (earthPlanet) {
      const moonDistance = 300000;
      const moonEntity = viewer.entities.add({
        name: 'Moon',
        position: Cesium.Cartesian3.fromElements(
          earthPlanet.distance + moonDistance, 
          0, 
          0
        ),
        ellipsoid: {
          radii: new Cesium.Cartesian3(30000, 30000, 30000),
          material: new Cesium.ImageMaterialProperty({
              image: '/moon_texture.jpg',
              transparent: false
         })
        },
        label: {
          text: 'Moon',
          font: '14pt sans-serif',
          fillColor: Cesium.Color.LIGHTGRAY,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -25), // Position above Moon
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.7,
          show: true
        }
      });
      planetEntities.push({ 
        name: 'Moon', 
        entity: moonEntity, 
        distance: earthPlanet.distance + moonDistance, 
        radius: 30000 
      });
    }

    // Create celestial bodies array for navigation
    const celestialBodies = [
      { name: 'Sun', entity: sunEntity, radius: 696340 },
      ...planetEntities
    ];

    let currentPlanetIndex = -1;
  
    // Planet navigation functions
    const focusOnObject = (position: Cesium.Cartesian3, radius: number, name: string) => {
      isInFocusMode = true;
      
      // Show the target planet/sun
      if (name === 'Sun') {
        sunEntity.show = true;
      } else {
        const targetPlanet = planetEntities.find(p => p.name === name);
        if (targetPlanet) {
          targetPlanet.entity.show = true;
          if (targetPlanet.rings) {
            targetPlanet.rings.forEach(ring => ring.show = true);
          }
        }
      }
      
      // Hide all other planets and the sun
      planetEntities.forEach(planet => {
        if (planet.name !== name) {
          planet.entity.show = false;

          if (planet.rings) {
            planet.rings.forEach(ring => ring.show = false);
          }
        }
      });
      
      if (name !== 'Sun') {
        sunEntity.show = false;
      }
      
      // Calculate distance to see the whole planet nicely
      const cameraDistance = radius * 8;
      
      viewer.camera.flyTo({
        destination: new Cesium.Cartesian3(
          position.x + cameraDistance,
          position.y,
          position.z + cameraDistance * 0.3
        ),
        orientation: {
          direction: Cesium.Cartesian3.normalize(
            Cesium.Cartesian3.subtract(position, 
              new Cesium.Cartesian3(position.x + cameraDistance, position.y, position.z + cameraDistance * 0.3),
              new Cesium.Cartesian3()
            ), new Cesium.Cartesian3()
          ),
          up: Cesium.Cartesian3.UNIT_Z
        },
        duration: 2.0,
        complete: () => {
          // Set the camera's reference frame to rotate around the planet center
          // But don't override the current camera position
          viewer.camera.lookAtTransform(
            Cesium.Transforms.eastNorthUpToFixedFrame(position)
          );
        }
      });
    };

    const focusOnPlanetByIndex = (index: number) => {
      // Safety check: ensure viewer and clock are available
      try {
        if (!viewer || viewer.isDestroyed()) {
          console.warn('Viewer not available for planet navigation');
          return;
        }
        
        const clock = viewer.clock;
        if (!clock) {
          console.warn('Viewer clock not available for planet navigation');
          return;
        }
        
        const celestialBody = celestialBodies[index];
        currentPlanetView = celestialBody;
        
        const position = celestialBody.entity.position!.getValue(clock.currentTime);
        if (position) {
          focusOnObject(position, celestialBody.radius, celestialBody.name);
        }
      } catch (error) {
        console.warn('Error in planet navigation:', error);
      }
    };

    const goToNextPlanet = () => {
      if (currentPlanetIndex < celestialBodies.length - 1) {
        currentPlanetIndex++;
      } else {
        currentPlanetIndex = 0;
      }
      focusOnPlanetByIndex(currentPlanetIndex);
    };

    const goToPreviousPlanet = () => {
      if (currentPlanetIndex > 0) {
        currentPlanetIndex--;
      } else {
        currentPlanetIndex = celestialBodies.length - 1;
      }
      focusOnPlanetByIndex(currentPlanetIndex);
    };

    const resetToSystemView = () => {
      // Clear any camera transform first
      viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      
      // Show all planets and the sun again
      planetEntities.forEach(planet => {
        planet.entity.show = true;
        if (planet.rings) {
          planet.rings.forEach(ring => ring.show = true);
        }
      });
      sunEntity.show = true;

      const marsPlanet = planetEntities.find(p => p.name === 'Mars');
      resetCamera(viewer, marsPlanet || null);

      currentPlanetView = null;
      isInFocusMode = false;
      currentPlanetIndex = -1;
    };

    // Set initial camera view
    resetToSystemView();

    // Smooth transition to Globe view
    const transitionToGlobeView = () => {
      // Clear any existing view states
      setIsGlobeView(false);
      
      // First, smoothly zoom into Earth
      const earthPlanet = planetEntities.find(p => p.name === 'Earth');
      if (earthPlanet) {
        const earthPosition = earthPlanet.entity.position!.getValue(viewer.clock.currentTime);
        if (earthPosition) {
          // Hide other planets during transition
          planetEntities.forEach(planet => {
            if (planet.name !== 'Earth') {
              planet.entity.show = false;

              if (planet.rings) {
                planet.rings.forEach(ring => ring.show = false);
              }
            }
          });
          sunEntity.show = false;

          // Start Globe mounting early for smoother transition
          setTimeout(() => {
            setIsGlobeView(true);
          }, 1300);

          // Zoom very close to Earth with smoother animation
          viewer.camera.flyTo({
            destination: new Cesium.Cartesian3(
              earthPosition.x + earthPlanet.radius * 1.2,
              earthPosition.y,
              earthPosition.z + earthPlanet.radius * 0.3
            ),
            orientation: {
              direction: Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.subtract(earthPosition, 
                  new Cesium.Cartesian3(earthPosition.x + earthPlanet.radius * 1.2, earthPosition.y, earthPosition.z + earthPlanet.radius * 0.3),
                  new Cesium.Cartesian3()
                ), new Cesium.Cartesian3()
              ),
              up: Cesium.Cartesian3.UNIT_Z
            },
            duration: 1.5,
            easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT
          });
        }
      }
    };

    // Double-click handler
    canvas.addEventListener('dblclick', function(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const pickedObject = viewer.scene.pick(new Cesium.Cartesian2(x, y));

      if (pickedObject && pickedObject.id) {
        const entity = pickedObject.id;
        
        if (entity.name === 'Earth') {
          // Start smooth transition to Globe view
          transitionToGlobeView();
          return;
        }

        // If already viewing a planet, reset to system view
        if (currentPlanetView) { 
          resetToSystemView(); 
          return; 
        }

        // Find the index of the clicked celestial body and focus on it
        const bodyIndex = celestialBodies.findIndex(body => body.name === entity.name);
        if (bodyIndex !== -1) {
          currentPlanetIndex = bodyIndex;
          focusOnPlanetByIndex(currentPlanetIndex);
        }
      } else {
        if (currentPlanetView) resetToSystemView();
      }
    });

    // Note: Keyboard handling moved to component level

    // Hover effects
    canvas.addEventListener('mousemove', function(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const pickedObject = viewer.scene.pick(new Cesium.Cartesian2(x, y));

      if (pickedObject && pickedObject.id) {
        viewer.canvas.style.cursor = 'pointer';
      } else {
        viewer.canvas.style.cursor = 'default';
      }
    });

      // Store navigation functions for external access
      (viewer as ExtendedViewer).planetNavigation = {
        goToNext: goToNextPlanet,
        goToPrevious: goToPreviousPlanet,
        resetView: resetToSystemView,
        isInFocusMode: () => isInFocusMode
      };

      // Return cleanup function (keyboard cleanup moved to component level)
      return () => {
        // No cleanup needed here anymore
      };
    };

    // Call the initialization function and store cleanup
    const cleanupSolarSystem = initializeSolarSystem(viewer);

    // Cleanup
    return () => {
      if (cleanupSolarSystem) {
        cleanupSolarSystem();
      }
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [navigate, isGlobeView, isMarsView]);  // Add navigate, isGlobeView, and isMarsView as dependencies

  useEffect(() => {
     // Only proceed if we have a viewer and we're not in other views
    if (!viewerRef.current || isGlobeView || isMarsView) {
      return;
    }

    const viewer = viewerRef.current;

    const planets = [
        { name: 'Mercury', color: Cesium.Color.GRAY, distance: 1e6, radius: 50000 },
        { name: 'Venus', color: Cesium.Color.BEIGE, distance: 2e6, radius: 120000 },
        { name: 'Earth', color: Cesium.Color.BLUE, distance: 3e6, radius: 127000 },
        { name: 'Mars', color: Cesium.Color.RED, distance: 4e6, radius: 70000 },
        { name: 'Jupiter', color: Cesium.Color.SANDYBROWN, distance: 6e6, radius: 400000 },
        { name: 'Saturn', color: Cesium.Color.GOLD, distance: 8e6, radius: 350000 },
        { name: 'Uranus', color: Cesium.Color.CYAN, distance: 10e6, radius: 250000 },
        { name: 'Neptune', color: Cesium.Color.DEEPSKYBLUE, distance: 12e6, radius: 240000 }
    ];
  
    // Clear existing planets
    viewer.entities.removeAll();
    const simEpoch = Cesium.JulianDate.fromDate(new Date()); 
    const planetEntities: { name: string; entity: Cesium.Entity; distance: number; radius: number; rings?: Cesium.Entity[] }[] = [];
    
    // Function to create static planets (no orbiting)
    const createStaticPlanets = () => {
      planets.forEach((p) => {
        let entity;

        if (p.name === 'Earth') {
          entity = viewer.entities.add({
            name: p.name,
            position: Cesium.Cartesian3.fromElements(p.distance, 0, 0),
            ellipsoid: {
              radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
              material: new Cesium.ImageMaterialProperty({
                image: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
                transparent: false
              })
            },
            label: {
              text: p.name,
              font: '16pt sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              eyeOffset: new Cesium.Cartesian3(0, 0, -p.radius * 1.5),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              scale: 0.8,
              show: true,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        } else {
          entity = viewer.entities.add({
            name: p.name,
            position: Cesium.Cartesian3.fromElements(p.distance, 0, 0), // Static position
            ellipsoid: {
              radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
              material: new Cesium.ImageMaterialProperty({
                image: `/${p.name.toLowerCase()}_texture.jpg`,
                transparent: false
              })
            },
            label: {
              text: p.name,
              font: '16pt sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -50),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              scale: 0.8,
              show: true
            }
          });
        }
        
        planetEntities.push({ ...p, entity });
      });
    };

    // Function to create orbiting planets (with callbacks)

  // Function to create orbiting planets (with callbacks)
  const createOrbitingPlanets = () => {
    planets.forEach((p, index) => {
      // Orbital parameters
      const orbitalPeriods = {
        'Mercury': 88 / 365.25,    // 88 Earth days
        'Venus': 225 / 365.25,     // 225 Earth days  
        'Earth': 1.0,              // 1 Earth year
        'Mars': 1.88,              // 1.88 Earth years
        'Jupiter': 11.86,          // 11.86 Earth years
        'Saturn': 29.46,           // 29.46 Earth years
        'Uranus': 84.01,           // 84.01 Earth years
        'Neptune': 164.8           // 164.8 Earth years
      };

      const orbitalPeriod = orbitalPeriods[p.name as keyof typeof orbitalPeriods] || 1.0;
      const startOffset = (index * 45) * Math.PI / 180; // Spread planets out initially

      let entity;
      entity = viewer.entities.add({
        name: p.name,
        position: new Cesium.CallbackProperty(function(time) {
          const simSeconds = Cesium.JulianDate.secondsDifference(time, simEpoch);
          
          // Calculate orbital position
          const speedMultiplier = 500;
          const angle = startOffset + (simSeconds * speedMultiplier * 2 * Math.PI) / (orbitalPeriod * 365.25 * 24 * 3600);
          
          const x = p.distance * Math.cos(angle);
          const y = p.distance * Math.sin(angle);
          const z = 0;

          return new Cesium.Cartesian3(x, y, z);
        }, false),
        ellipsoid: {
          radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
          material: p.color // Use the plain color from planets array
        },
        label: {
          text: p.name,
          font: '16pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -50),
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.8,
          show: true
        }
      });
      
      planetEntities.push({ ...p, entity });
    });
  };

    // Only toggle if we have a viewer and we're not in other views
    if (viewerRef.current && !isGlobeView && !isMarsView) {
      console.log('🔄 Orbit mode changed, calling toggleOrbitMode...');

      // Clear existing planets
      console.log('🔍 toggleOrbitMode called, isOrbitingEnabled value:', isOrbitingEnabled);

      planetEntities.length = 0; // Clear the array
      
      // Recreate planets based on mode
      if (isOrbitingEnabled) {
        console.log('🪐 Creating orbiting planets...');
        viewer.clock.currentTime = Cesium.JulianDate.clone(simEpoch);
        viewer.clock.shouldAnimate = true;          // Allow the clock to tick
        viewer.clock.multiplier = 60 * 60 * 1;     // Speed up 12 hours per second

        createOrbitingPlanets();
        console.log('🪐 Switched to orbiting mode');
      } else {
        console.log('⏸️ Creating static planets...');
        viewer.clock.shouldAnimate = false;         // Stop the clock

        createStaticPlanets();
        console.log('⏸️ Switched to static mode');
      }

      // Add Saturn's rings
    const saturnPlanet = planetEntities.find(p => p.name === 'Saturn');
    if (saturnPlanet) {
        const saturnRingPosCallback = (time, result) => {
            const pos = saturnPlanet.entity.position.getValue(time, result);
            
            // Compute Saturn's "up" vector (from origin to center)
            const up = Cesium.Cartesian3.normalize(pos, new Cesium.Cartesian3());
            
            // Move ring slightly above surface along this up vector
            const offset = saturnPlanet.radius * 10; // 5% above surface
            return Cesium.Cartesian3.add(pos, Cesium.Cartesian3.multiplyByScalar(up, offset, new Cesium.Cartesian3()), new Cesium.Cartesian3());
        };

        // Orientation for rings
        const tiltRad = Cesium.Math.toRadians(26.7); // Saturn's axial tilt
        const ringOrientationCallback = (time, result) => {
            const pos = saturnPlanet.entity.position.getValue(time);
            const hpr = new Cesium.HeadingPitchRoll(0, tiltRad, 0);
            return Cesium.Transforms.headingPitchRollQuaternion(pos, hpr, Cesium.Ellipsoid.WGS84, Cesium.Transforms.eastNorthUpToFixedFrame, result);
        };

        // Outer ring
        const saturnRings = viewer.entities.add({
            name: 'Saturn Rings Outer',
            position: new Cesium.CallbackProperty(saturnRingPosCallback, false),
            orientation: new Cesium.CallbackProperty(ringOrientationCallback, false),
            ellipse: {
                semiMajorAxis: saturnPlanet.radius * 2.2,
                semiMinorAxis: saturnPlanet.radius * 2.2,
                height: saturnPlanet.radius * 4.6, // lift above Saturn's surface
                // material: new Cesium.ImageMaterialProperty({
                //     image: '/saturn_rings_texture.png', 
                //     transparent: true
                // }),   
                 material: new Cesium.ColorMaterialProperty(
                Cesium.Color.LIGHTGRAY.withAlpha(0.6) // Light grey translucent
            ),
              outline: false         
            }
        });

        // Inner ring
        const saturnInnerRings = viewer.entities.add({
            name: 'Saturn Rings Inner',
            position: new Cesium.CallbackProperty(saturnRingPosCallback, false),
            orientation: new Cesium.CallbackProperty(ringOrientationCallback, false),
            ellipse: {
                semiMajorAxis: saturnPlanet.radius * 1.8,
                semiMinorAxis: saturnPlanet.radius * 1.8,
                height: saturnPlanet.radius * 4.61, // lift above Saturn's surface
                // material: new Cesium.ImageMaterialProperty({
                //     image: '/saturn_rings_texture.png', 
                //     transparent: true
                // }),   
                 material: new Cesium.ColorMaterialProperty(
                Cesium.Color.LIGHTGRAY.withAlpha(0.6) // Light grey translucent
            ),                 
                outline: false,
            }
        });

        saturnPlanet.rings = [saturnRings, saturnInnerRings];
    }
  
      // Recreate the sun (it gets removed with removeAll)
      const sunEntity = viewer.entities.add({
        name: 'Sun',
        position: Cesium.Cartesian3.fromElements(0, 0, 0),
        ellipsoid: {
          radii: new Cesium.Cartesian3(696340, 696340, 696340),
          material: new Cesium.ImageMaterialProperty({
                image: '/sun_texture.jpg',
                transparent: false
          })
        },
        label: {
          text: 'Sun',
          font: '20pt sans-serif',
          fillColor: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -100), // Position above Sun
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 1.0,
          show: true
      }
     });
      
     // Adjust camera position based on current mode
    if (isOrbitingEnabled) {
      console.log('📷 Setting zoomed out camera for orbiting mode...');
       const cameraPosition = new Cesium.Cartesian3(-6e6, -25e6, 12e6);
       const lookAtCenter = new Cesium.Cartesian3(0, 0, 0); // Look toward middle of solar system

      // Zoomed out view for orbiting mode - can see full orbital paths
      viewer.camera.setView({
        destination: cameraPosition, // Much further back and higher
        orientation: {
           direction: Cesium.Cartesian3.normalize(
              Cesium.Cartesian3.subtract(
                lookAtCenter,
                cameraPosition,
                new Cesium.Cartesian3()
              ), 
              new Cesium.Cartesian3()
            ),
            up: Cesium.Cartesian3.UNIT_Z
        }
      });
    } else {
      console.log('📷 Setting closer camera for static mode...');
      // Closer view for static mode - focused on planet lineup
      const marsPlanet = planetEntities.find(p => p.name === 'Mars');
      if (marsPlanet) {
        resetCamera(viewer, marsPlanet, isOrbitingEnabled);
      }
    }

    console.log('✅ Mode switch complete with camera adjustment');
    }
  }, [isOrbitingEnabled, isGlobeView, isMarsView]); // React to orbit changes

  const resetCamera = (viewer: Cesium.Viewer, marsPlanet: { distance: number } | null, isOrbiting: boolean) => {
    if (!marsPlanet) return;
    
    const marsPosition = new Cesium.Cartesian3(marsPlanet.distance, 0, 0);
    let cameraPosition;
    let lookAtCenter;
    if (isOrbiting) {
      // Wide orbit view - can see all planets moving in their circular paths
      cameraPosition = new Cesium.Cartesian3(-6e6, -25e6, 12e6);
      lookAtCenter = new Cesium.Cartesian3(0, 0, 0); 
      console.log('📷 Camera set for orbiting mode');
    } else {
      cameraPosition = new Cesium.Cartesian3(-2e6, -12e6, 1e6);
      lookAtCenter = new Cesium.Cartesian3(6e6, 0, 0); // Look toward middle of solar system
      console.log('📷 Camera set for staticss mode');
    }
    
    viewer.camera.flyTo({
      destination: cameraPosition,
      orientation: {
        direction: Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.subtract(
            lookAtCenter,
            cameraPosition,
            new Cesium.Cartesian3()
          ), 
          new Cesium.Cartesian3()
        ),
        up: Cesium.Cartesian3.UNIT_Z
      },
      duration: 1.5
    });
  };

  const handleResetView = () => {
    if (viewerRef.current?.planetNavigation) {
      viewerRef.current.planetNavigation.resetView();
    }
  };

  const handleNextPlanet = () => {
    if (viewerRef.current?.planetNavigation) {
      viewerRef.current.planetNavigation.goToNext();
    }
  };

  const handlePreviousPlanet = () => {
    if (viewerRef.current?.planetNavigation) {
      viewerRef.current.planetNavigation.goToPrevious();
    }
  };

  if (isGlobeView) {
    console.log('🌍 Rendering Globe view');
    return (
      <div 
        style={{ width, height }} 
        className="relative animate-fadeIn"
        key="globe-view"
      >
        {/* Globe Component with back button */}
        <Globe height={height} width={width} />
        
        {/* Back to Solar System Button */}
        <div className="absolute left-4 top-4 z-30 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
          <button 
            onClick={returnToSolarSystem}
            className="px-4 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors flex items-center gap-2"
            title="Return to Solar System"
          >
            🚀 ← Back to Solar System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width, height }} className="relative">
      <div
        ref={cesiumContainer}
        className="w-full h-full"
      />
      
      {/* Controls */}
      <div className="absolute left-4 top-4 z-10 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
        <div className="text-sm mb-2">
          <strong>🪐 Solar System Explorer</strong>
        </div>
        <div className="flex gap-2 mb-2">
          <button 
            onClick={handlePreviousPlanet}
            className="px-2 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
            title="Previous Planet (Left Arrow)"
          >
            ←
          </button>
          <button 
            onClick={handleNextPlanet}
            className="px-2 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
            title="Next Planet (Right Arrow)"
          >
            →
          </button>
          <button 
            onClick={handleResetView}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            title="Reset to Solar System View (Space)"
          >
            Reset
          </button>
          <button 
            onClick={handleToggleOrbit}
            className={`px-3 py-1 text-white rounded text-sm transition-colors ${
              isOrbitingEnabled 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-500 hover:bg-gray-600'
            }`}
            title="Toggle Orbital Movement"
          >
            {isOrbitingEnabled ? '🌍 Orbiting' : '⏸️ Static'}
        </button>
        </div>
        <div className="text-xs text-gray-300">
          Earth now shows realistic surface! 🌍<br />
          Toggle orbit mode: {isOrbitingEnabled ? 'ON' : 'OFF'}<br />
          Double-click planets to focus
        </div>
      </div>
      
      {/* Instructions */}
      <div className="absolute right-4 top-4 z-10 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
        <div className="text-xs">
          <strong>Controls:</strong><br />
          Left Click + Drag: Rotate<br />
          Right Click + Drag: Pan<br />
          Mouse Wheel: Zoom<br />
          <strong className="text-green-300">Orbit Toggle: Enable/Disable Movement</strong><br />
          <strong className="text-purple-300">Double-Click Planets: Focus View</strong><br />
          <strong className="text-purple-300">Arrow Keys: Navigate Planets</strong><br />
          <strong className="text-purple-300">Space: Reset to System View</strong><br />
          <strong className="text-blue-300">Double-Click Earth: Smooth Globe Transition 🌍</strong>
        </div>
      </div>
    </div>
  );
};

export default SolarSystem;