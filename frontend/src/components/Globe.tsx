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
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

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

  const takeScreenshot = useCallback(() => {
    if (!viewer.current) return;

    try {
      // Render the scene to get the canvas
      viewer.current.render();
      
      // Get the canvas element from the Cesium viewer
      const canvas = viewer.current.scene.canvas;
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      // Set the screenshot URL and show modal
      setScreenshotUrl(dataUrl);
      setShowScreenshotModal(true);
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
  }, []);

  const closeScreenshotModal = useCallback(() => {
    setShowScreenshotModal(false);
    // Clean up the data URL to free memory
    if (screenshotUrl) {
      URL.revokeObjectURL(screenshotUrl);
      setScreenshotUrl(null);
    }
  }, [screenshotUrl]);

  const downloadScreenshot = useCallback(() => {
    if (!screenshotUrl) return;

    const link = document.createElement('a');
    link.download = `globe-view-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.href = screenshotUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [screenshotUrl]);

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
      {/* Control Buttons */}
      <div className="absolute left-2 top-2 z-10 flex gap-2">
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="rounded-lg bg-black/70 p-2 text-white transition-all hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50"
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

        {/* Screenshot Button */}
        <button
          onClick={takeScreenshot}
          className="rounded-lg bg-black/70 p-2 text-white transition-all hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50"
          title="Take Screenshot"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Cesium Container */}
      <div
        ref={cesiumContainer}
        className={`overflow-hidden rounded-lg ${
          isFullscreen ? 'h-screen w-screen' : 'border border-gray-300'
        }`}
        style={isFullscreen ? {} : { width, height }}
      />

      {/* Screenshot Modal */}
      {showScreenshotModal && screenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative max-h-[90vh] max-w-[90vw] rounded-lg bg-white p-4">
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Globe Screenshot</h3>
              <button
                onClick={closeScreenshotModal}
                className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Screenshot Image */}
            <div className="mb-4 flex justify-center">
              <img
                src={screenshotUrl}
                alt="Globe Screenshot"
                className="max-h-[70vh] max-w-full rounded-lg border border-gray-200 shadow-lg"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-center gap-3">
              <button
                onClick={downloadScreenshot}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                📥 Download
              </button>
              <button
                onClick={closeScreenshotModal}
                className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Globe;