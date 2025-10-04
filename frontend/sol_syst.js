if (!window.Cesium) {
  document.getElementById('status').textContent = 'Status: Cesium failed to load (check console).';
  throw new Error('Cesium not loaded');
}

const viewer = new Cesium.Viewer('cesiumContainer', {
  timeline: false,
  animation: false,
  infoBox: false,
  selectionIndicator: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  imageryProvider: false
});

viewer.scene.globe.show = false;
viewer.scene.backgroundColor = Cesium.Color.BLACK;  

// Keep stars and sun, but remove unwanted elements
viewer.scene.skyBox.show = true;              // Keep stars ✅
viewer.scene.sun.show = true;                 // Keep sun for lighting ✅
viewer.scene.moon.show = false;               // Remove moon ❌
viewer.scene.skyAtmosphere.show = false;      // Remove atmosphere ❌

// Remove any default imagery layers that might show rings
viewer.scene.imageryLayers.removeAll();

// Keep lighting from the sun
viewer.scene.globe.enableLighting = true;

// Robustly prevent browser context menu on the Cesium canvas (mandatory for right-drag behavior)
const canvas = viewer.cesiumWidget.canvas;
canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); }, { passive: false });

// Ensure camera controller allows translate and use RIGHT_DRAG for panning
viewer.scene.screenSpaceCameraController.enableRotate = true;
viewer.scene.screenSpaceCameraController.enableTranslate = true;
viewer.scene.screenSpaceCameraController.enableZoom = true;
viewer.scene.screenSpaceCameraController.enableTilt = true;
viewer.scene.screenSpaceCameraController.enableLook = true;

// Use RIGHT_DRAG for translate/pan in 3D
viewer.scene.screenSpaceCameraController.translateEventTypes = Cesium.CameraEventType.RIGHT_DRAG;

// Keep rotate and look mappings explicit
viewer.scene.screenSpaceCameraController.rotateEventTypes = Cesium.CameraEventType.LEFT_DRAG;
viewer.scene.screenSpaceCameraController.lookEventTypes = Cesium.CameraEventType.MIDDLE_DRAG;
viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];

// Adjust camera movement sensitivity (tweak to taste)
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000;

// Debug output
console.log('Camera controller settings:', {
  enableTranslate: viewer.scene.screenSpaceCameraController.enableTranslate,
  translateEventTypes: viewer.scene.screenSpaceCameraController.translateEventTypes,
  enableRotate: viewer.scene.screenSpaceCameraController.enableRotate,
  rotateEventTypes: viewer.scene.screenSpaceCameraController.rotateEventTypes
});

document.getElementById('status').textContent = 'Status: viewer ready';

// Sun
const sunEntity = viewer.entities.add({
  name: 'Sun',
  position: Cesium.Cartesian3.fromElements(0, 0, 0),
  ellipsoid: {
    radii: new Cesium.Cartesian3(696340, 696340, 696340), // Real sun radius in km
    material: Cesium.Color.ORANGE
  }
});

// Planet definitions (scaled distances + radii)
const planets = [
  { name: 'Mercury', color: Cesium.Color.GRAY,   distance: 1e6,  radius: 50000 },
  { name: 'Venus',   color: Cesium.Color.BEIGE,  distance: 2e6,  radius: 120000 },
  { name: 'Earth',   color: Cesium.Color.BLUE,   distance: 3e6,  radius: 127000 },
  { name: 'Mars',    color: Cesium.Color.RED,    distance: 4e6,  radius: 70000 },
  { name: 'Jupiter', color: Cesium.Color.SANDYBROWN, distance: 6e6, radius: 400000 },
  { name: 'Saturn',  color: Cesium.Color.GOLD,   distance: 8e6,  radius: 350000 },
  { name: 'Uranus',  color: Cesium.Color.CYAN,   distance: 10e6, radius: 250000 },
  { name: 'Neptune', color: Cesium.Color.DEEPSKYBLUE, distance: 12e6, radius: 240000 }
];

// Add planets
planets.forEach((p) => {
  p.entity = viewer.entities.add({
    name: p.name,
    position: Cesium.Cartesian3.fromElements(p.distance, 0, 0),
    ellipsoid: {
      radii: new Cesium.Cartesian3(p.radius, p.radius, p.radius),
      material: p.color
    }
  });
});

// Add this code right after Saturn is created (around line 90, after the planets.forEach loop):

// Add Saturn's rings
const saturnPlanet = planets.find(p => p.name === 'Saturn');
const saturnRings = viewer.entities.add({
  name: 'Saturn Rings',
  position: new Cesium.Cartesian3(saturnPlanet.distance, 0, 0), // Use Saturn's exact position
  ellipse: {
    semiMajorAxis: saturnPlanet.radius * 2.2, // Outer ring radius
    semiMinorAxis: saturnPlanet.radius * 2.2, // Make it circular
    height: 0, // Flat rings
    material: new Cesium.ColorMaterialProperty(
      Cesium.Color.fromCssColorString('#D4AF37').withAlpha(0.6) // Golden with transparency
    ),
    outline: true,
    outlineColor: Cesium.Color.fromCssColorString('#B8860B').withAlpha(0.8),
    outlineWidth: 2
  }
});

// Add inner ring gap (Cassini Division)
const saturnInnerRings = viewer.entities.add({
  name: 'Saturn Inner Rings',
  position: new Cesium.Cartesian3(saturnPlanet.distance, 0, 0), // Use Saturn's exact position
  ellipse: {
    semiMajorAxis: saturnPlanet.radius * 1.8, // Inner ring radius
    semiMinorAxis: saturnPlanet.radius * 1.8,
    height: 0,
    material: new Cesium.ColorMaterialProperty(
      Cesium.Color.fromCssColorString('#DAA520').withAlpha(0.4) // Slightly different gold
    ),
    outline: true,
    outlineColor: Cesium.Color.fromCssColorString('#B8860B').withAlpha(0.6),
    outlineWidth: 1
  }
});

// Store ring references for show/hide functionality
saturnPlanet.rings = [saturnRings, saturnInnerRings];

// Planet visualization state
let currentPlanetView = null;
let isInFocusMode = false;

// Add Earth's Moon
const earthPlanet = planets.find(p => p.name === 'Earth');
const moonDistance = 300000;
const moonEntity = viewer.entities.add({
  name: 'Moon',
  position: Cesium.Cartesian3.fromElements(
    earthPlanet.distance + moonDistance, 
    0, 
    0
  ),
  ellipsoid: {
    radii: new Cesium.Cartesian3(30000, 30000, 30000), // Made much bigger for visibility
    material: Cesium.Color.LIGHTGRAY
  }
});

// Add Moon to planets array so it can be focused on and hidden/shown properly
planets.push({ 
  name: 'Moon', 
  color: Cesium.Color.LIGHTGRAY, 
  distance: earthPlanet.distance + moonDistance, 
  radius: 30000, // Updated to match the entity
  entity: moonEntity 
});

// Planet navigation system
function createPlanetList() {
  // Create ordered list including Sun and Moon
  const allCelestialBodies = [
    { name: 'Sun', entity: sunEntity, radius: 696340 },
    ...planets // This includes Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Moon
  ];
  return allCelestialBodies;
}

let currentPlanetIndex = -1;
const celestialBodies = createPlanetList();

function showPlanetNavigation() {
  document.getElementById('planetNav').style.display = 'block';
}

function hidePlanetNavigation() {
  document.getElementById('planetNav').style.display = 'none';
}

function goToNextPlanet() {
  if (currentPlanetIndex < celestialBodies.length - 1) {
    currentPlanetIndex++;
  } else {
    currentPlanetIndex = 0; // Loop back to beginning
  }
  focusOnPlanetByIndex(currentPlanetIndex);
}

function goToPreviousPlanet() {
  if (currentPlanetIndex > 0) {
    currentPlanetIndex--;
  } else {
    currentPlanetIndex = celestialBodies.length - 1; // Loop to end
  }
  focusOnPlanetByIndex(currentPlanetIndex);
}

function focusOnPlanetByIndex(index) {
  const celestialBody = celestialBodies[index];
  currentPlanetView = celestialBody;
  
  const position = celestialBody.entity.position.getValue(viewer.clock.currentTime);
  focusOnObject(position, celestialBody.radius, celestialBody.name);
}

// Camera setup
function enableFreeMovement() {
  viewer.scene.screenSpaceCameraController.enableRotate = true;
  viewer.scene.screenSpaceCameraController.enableTranslate = true;
  viewer.scene.screenSpaceCameraController.enableZoom = true;
  viewer.scene.screenSpaceCameraController.enableTilt = true;
  viewer.scene.screenSpaceCameraController.enableLook = true;
}


// Replace the resetCamera function (around line 218) with this corrected version:

function resetCamera() {
  console.log('🔄 resetCamera() called');
  
  // Show all planets and the sun again
  planets.forEach(planet => {
    planet.entity.show = true;
    // Show Saturn's rings if they exist
    if (planet.rings) {
      planet.rings.forEach(ring => ring.show = true);
    }
  });
  sunEntity.show = true;
  
  // Position camera to look at Saturn specifically
  const saturnPlanet = planets.find(p => p.name === 'Saturn');
  const saturnPosition = new Cesium.Cartesian3(saturnPlanet.distance, 0, 0); // Saturn at 8e6, 0, 0
  const cameraPosition = new Cesium.Cartesian3(-3e6, -12e6, 2e6); // Moved right + closer for zoom
  
  console.log('🪐 Saturn position:', saturnPosition);
  console.log('📷 Camera destination:', cameraPosition);
  
  viewer.camera.flyTo({
    destination: cameraPosition,
    orientation: {
      // Point camera toward Saturn - fixed the subtract method
      direction: Cesium.Cartesian3.normalize(
        Cesium.Cartesian3.subtract(
          saturnPosition,     // Look at Saturn (8e6, 0, 0)
          cameraPosition,     // From camera position (-2e6, -8e6, 3e6)
          new Cesium.Cartesian3()  // Result vector (this was missing!)
        ), 
        new Cesium.Cartesian3()    // Result vector for normalize
      ),
      up: Cesium.Cartesian3.UNIT_Z
    },
    duration: 1.5,
    complete: function() {
      console.log('✅ Camera flyTo completed');
      console.log('📍 Final camera position:', viewer.camera.position);
      enableFreeMovement();
    }
  });
  currentPlanetView = null;
  isInFocusMode = false;
  currentPlanetIndex = -1;
  hidePlanetNavigation();
  document.getElementById('status').textContent = 'Status: Solar System View - Looking at Saturn';
}


function focusOnObject(position, radius, name) {
  isInFocusMode = true;
  
  // FIRST: Show the target planet/sun
  if (name === 'Sun') {
    sunEntity.show = true;
  } else {
    // Find and show the target planet
    const targetPlanet = planets.find(p => p.name === name);
    if (targetPlanet) {
      targetPlanet.entity.show = true;
      // Show rings if it's Saturn
      if (targetPlanet.rings) {
        targetPlanet.rings.forEach(ring => ring.show = true);
      }
    }
  }
  
  // THEN: Hide all other planets and the sun
  planets.forEach(planet => {
    if (planet.name !== name) {
      planet.entity.show = false;
    }
  });
  
  // Hide the sun unless we're focusing on it
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
    complete() { 
      enableFreeMovement();
      showPlanetNavigation(); // Show arrows when focused
    }
  });
  
  document.getElementById('status').textContent = `Status: Focused on ${name} (use arrows or double-click to navigate)`;
}

resetCamera();

// Double-click handler for planet visualization
viewer.cesiumWidget.canvas.addEventListener('dblclick', function(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const pickedObject = viewer.scene.pick({ x, y });

  if (pickedObject && pickedObject.id) {
    const entity = pickedObject.id;
    if (currentPlanetView) { resetCamera(); return; }

    // Find the index of the clicked celestial body
    const bodyIndex = celestialBodies.findIndex(body => body.name === entity.name);
    if (bodyIndex !== -1) {
      currentPlanetIndex = bodyIndex;
      focusOnPlanetByIndex(currentPlanetIndex);
    }
  } else {
    if (currentPlanetView) resetCamera();
  }
});

// Hover effects for visual feedback
viewer.cesiumWidget.canvas.addEventListener('mousemove', function(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const pickedObject = viewer.scene.pick({ x, y });

  if (pickedObject && pickedObject.id) {
    const entity = pickedObject.id;
    const isPlanet = planets.some(p => p.name === entity.name) || entity.name === 'Sun' || entity.name === 'Moon';
    if (isPlanet) {
      viewer.canvas.style.cursor = 'pointer';
      if (!currentPlanetView) document.getElementById('status').textContent = `Status: Double-click to focus on ${entity.name}`;
    } else {
      viewer.canvas.style.cursor = 'default';
    }
  } else {
    viewer.canvas.style.cursor = 'default';
    if (!currentPlanetView && !isInFocusMode) document.getElementById('status').textContent = 'Status: ready';
  }
});

// Reset button
document.getElementById('resetView').onclick = resetCamera;

// Navigation button events
document.getElementById('prevPlanet').onclick = goToPreviousPlanet;
document.getElementById('nextPlanet').onclick = goToNextPlanet;

// Keyboard controls
document.addEventListener('keydown', function(event) {
  const camera = viewer.scene.camera;
  const moveAmount = 100000;
  
  // Only use arrow keys for planet navigation when in focus mode
  if (isInFocusMode) {
    switch(event.code) {
      case 'ArrowLeft': goToPreviousPlanet(); event.preventDefault(); break;
      case 'ArrowRight': goToNextPlanet(); event.preventDefault(); break;
    }
  }
  
  // Regular camera movement
  switch(event.code) {
    case 'KeyW': camera.moveForward(moveAmount); break;
    case 'KeyS': camera.moveBackward(moveAmount); break;
    case 'KeyA': camera.moveLeft(moveAmount); break;
    case 'KeyD': camera.moveRight(moveAmount); break;
    case 'KeyQ': camera.moveUp(moveAmount); break;
    case 'KeyE': camera.moveDown(moveAmount); break;
    case 'Space': resetCamera(); break;
  }
});

// Auto-hide controls
setTimeout(function() {
  const controlsPanel = document.getElementById('controls');
  if (controlsPanel) {
    controlsPanel.style.opacity = '0.3';
    controlsPanel.style.transition = 'opacity 0.5s';
  }
}, 10000);
document.getElementById('controls').addEventListener('mouseenter', function() { this.style.opacity = '1'; });
document.getElementById('controls').addEventListener('mouseleave', function() { this.style.opacity = '0.3'; });