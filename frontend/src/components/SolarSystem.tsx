import React, { useRef, useEffect, useState } from 'react';
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
  const navigate = useNavigate();
  const [isGlobeView, setIsGlobeView] = useState(false);

  const returnToSolarSystem = () => {
    setIsGlobeView(false);
    // Small delay to allow Globe component to unmount
    setTimeout(() => {
      // Re-show all entities that were hidden during transition
      if (viewerRef.current) {
        const viewer = viewerRef.current;        
        // Show all entities in the viewer (planets, sun, rings)
        viewer.entities.values.forEach((entity) => {
          entity.show = true;
        });
        
        // Reset view to show full solar system
        if (viewer.planetNavigation) {
          viewer.planetNavigation.resetView();
        }
      }
    }, 100);
  };

  useEffect(() => {
    if (!cesiumContainer.current) return;
    
    // Only initialize if we don't already have a viewer and we're not in globe view
    if (viewerRef.current || isGlobeView) {
      return;
    }

    // Initialize Cesium viewer
    const viewer = new Cesium.Viewer(cesiumContainer.current, {
      timeline: false,
      animation: false,
      infoBox: false,
      selectionIndicator: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false
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
        material: Cesium.Color.ORANGE
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

    // Add planets
    const planetEntities: { name: string; entity: Cesium.Entity; distance: number; radius: number; rings?: Cesium.Entity[] }[] = [];
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
          }
        });
      } else {
        // Create other planets with solid colors
        entity = viewer.entities.add({
          name: p.name,
          position: Cesium.Cartesian3.fromElements(p.distance, 0, 0),
          ellipsoid: {
            radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
            material: p.color
          }
        });
      }
      
      planetEntities.push({ ...p, entity });
    });

    // Add Saturn's rings
    const saturnPlanet = planetEntities.find(p => p.name === 'Saturn');
    if (saturnPlanet) {
      const saturnRings = viewer.entities.add({
        name: 'Saturn Rings',
        position: new Cesium.Cartesian3(saturnPlanet.distance, 0, 0),
        ellipse: {
          semiMajorAxis: saturnPlanet.radius * 2.2,
          semiMinorAxis: saturnPlanet.radius * 2.2,
          height: 0,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString('#D4AF37').withAlpha(0.6)
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#B8860B').withAlpha(0.8),
          outlineWidth: 2
        }
      });

      const saturnInnerRings = viewer.entities.add({
        name: 'Saturn Inner Rings',
        position: new Cesium.Cartesian3(saturnPlanet.distance, 0, 0),
        ellipse: {
          semiMajorAxis: saturnPlanet.radius * 1.8,
          semiMinorAxis: saturnPlanet.radius * 1.8,
          height: 0,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.fromCssColorString('#DAA520').withAlpha(0.4)
          ),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#B8860B').withAlpha(0.6),
          outlineWidth: 1
        }
      });

      saturnPlanet.rings = [saturnRings, saturnInnerRings];
    }

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
          material: Cesium.Color.LIGHTGRAY
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
    let currentPlanetView: CelestialBody | null = null;
    let isInFocusMode = false;

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
        duration: 2.0
      });
    };

    const focusOnPlanetByIndex = (index: number) => {
      const celestialBody = celestialBodies[index];
      currentPlanetView = celestialBody;
      
      const position = celestialBody.entity.position!.getValue(viewer.clock.currentTime);
      if (position) {
        focusOnObject(position, celestialBody.radius, celestialBody.name);
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
      // Show all planets and the sun again
      planetEntities.forEach(planet => {
        planet.entity.show = true;
        if (planet.rings) {
          planet.rings.forEach(ring => ring.show = true);
        }
      });
      sunEntity.show = true;
      
      resetCamera(viewer, saturnPlanet || null);
      currentPlanetView = null;
      isInFocusMode = false;
      currentPlanetIndex = -1;
    };

    // Set initial camera view
    resetToSystemView();

    // Smooth transition to Globe view
    const transitionToGlobeView = () => {
      // First, smoothly zoom into Earth
      const earthPlanet = planetEntities.find(p => p.name === 'Earth');
      if (earthPlanet) {
        const earthPosition = earthPlanet.entity.position!.getValue(viewer.clock.currentTime);
        if (earthPosition) {
          // Hide other planets during transition
          planetEntities.forEach(planet => {
            if (planet.name !== 'Earth') {
              planet.entity.show = false;
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
    const canvas = viewer.cesiumWidget.canvas;
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

    // Keyboard controls for navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInFocusMode) {
        switch(event.code) {
          case 'ArrowLeft': 
            goToPreviousPlanet(); 
            event.preventDefault(); 
            break;
          case 'ArrowRight': 
            goToNextPlanet(); 
            event.preventDefault(); 
            break;
        }
      }
      
      if (event.code === 'Space') {
        resetToSystemView();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

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
    };

    // Call the initialization function
    initializeSolarSystem(viewer);

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [navigate, isGlobeView]); // Add navigate and isGlobeView as dependencies

  const resetCamera = (viewer: Cesium.Viewer, saturnPlanet: { distance: number } | null) => {
    if (!saturnPlanet) return;
    
    const saturnPosition = new Cesium.Cartesian3(saturnPlanet.distance, 0, 0);
    const cameraPosition = new Cesium.Cartesian3(-3e6, -12e6, 2e6);
    
    viewer.camera.flyTo({
      destination: cameraPosition,
      orientation: {
        direction: Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.subtract(
            saturnPosition,
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
        </div>
        <div className="text-xs text-gray-300">
          Earth now shows realistic surface! 🌍<br />
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