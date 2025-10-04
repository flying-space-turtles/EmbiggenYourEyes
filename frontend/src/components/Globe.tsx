import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Viewer, Cartesian3, Color, Entity, Ion } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

interface GlobeProps {
  width?: string;
  height?: string;
}

const Globe: React.FC<GlobeProps> = ({ width = '100%', height = '500px' }) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const containerDiv = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (cesiumContainer.current && !viewer.current) {
      // Set Cesium Ion access token
      const cesiumToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
      if (cesiumToken && cesiumToken !== 'your-cesium-ion-token-here') {
        Ion.defaultAccessToken = cesiumToken;
        console.log('Cesium Ion token configured successfully');
      } else {
        console.warn('Cesium Ion token not configured. Some imagery may not be available. See CESIUM_SETUP.md for instructions.');
      }

      // Initialize Cesium viewer
      viewer.current = new Viewer(cesiumContainer.current, {
        timeline: false,
        animation: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        homeButton: true,
        baseLayerPicker: false,
      });

      // Set the initial camera position
    // Set default view to show entire Earth
    viewer.current.camera.setView({
      destination: Cartesian3.fromDegrees(0.0, 0.0, 20000000), // Above equator, showing full Earth
      orientation: {
        heading: 0.0,
        pitch: -1.57, // Looking straight down
        roll: 0.0,
      },
    });

      // Add some sample points of interest
      addSampleLocations(viewer.current);
    }

    // Cleanup function
    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerDiv.current) return;

    try {
      if (!isFullscreen) {
        await containerDiv.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, [isFullscreen]);

  // Fullscreen functionality
  useEffect(() => {
    const handleFullscreenChange = () => {
      const newFullscreenState = !!document.fullscreenElement;
      setIsFullscreen(newFullscreenState);
      
      // Resize Cesium viewer when fullscreen changes
      if (viewer.current) {
        setTimeout(() => {
          viewer.current?.resize();
        }, 100);
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      // Press 'F' or 'f' to toggle fullscreen
      if (e.key === 'f' || e.key === 'F') {
        if (containerDiv.current?.contains(document.activeElement)) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      // Press Escape to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen, toggleFullscreen]);

  const addSampleLocations = (cesiumViewer: Viewer) => {
    // Add NASA locations
    const locations = [
      { name: 'NASA Goddard Space Flight Center', lat: 38.9964, lon: -76.8479 },
      { name: 'NASA Kennedy Space Center', lat: 28.5721, lon: -80.6480 },
      { name: 'NASA Johnson Space Center', lat: 29.5591, lon: -95.0907 },
      { name: 'NASA Jet Propulsion Laboratory', lat: 34.2048, lon: -118.1711 },
    ];

    locations.forEach((location) => {
      cesiumViewer.entities.add(
        new Entity({
          name: location.name,
          position: Cartesian3.fromDegrees(location.lon, location.lat),
          point: {
            pixelSize: 10,
            color: Color.YELLOW,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            heightReference: 0, // CLAMP_TO_GROUND
          },
          label: {
            text: location.name,
            font: '12pt Arial',
            fillColor: Color.WHITE,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            pixelOffset: new Cartesian3(0, -40, 0),
            showBackground: true,
            backgroundColor: Color.BLACK.withAlpha(0.7),
          },
        })
      );
    });
  };

  return (
    <div 
      ref={containerDiv}
      className="relative"
      style={{ width, height }}
    >
      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute left-2 top-2 z-10 rounded-lg bg-black/70 p-2 text-white transition-all hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50"
        title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F)'}
      >
        {isFullscreen ? (
          // Exit fullscreen icon
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Enter fullscreen icon
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Cesium Container */}
      <div
        ref={cesiumContainer}
        className={`overflow-hidden rounded-lg ${
          isFullscreen ? 'h-screen w-screen' : 'border border-gray-300'
        }`}
        style={isFullscreen ? {} : { width, height }}
      />
    </div>
  );
};

export default Globe;