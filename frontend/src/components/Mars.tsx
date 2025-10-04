import React, { useRef, useState } from 'react';
import { Viewer } from 'cesium';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import ScreenshotModal from './ScreenshotModal';
import SearchBox from './SearchBox';
import { useScreenshot } from '../hooks/useScreenshot';
import { useFlyToCoords } from '../hooks/useFlyToCoords';

interface MarsProps {
  width?: string;
  height?: string;
  flyToCoords?: { lat: number; lon: number } | null;
}

const Mars: React.FC<MarsProps> = ({
  width = "100%",
  height = "500px",
  flyToCoords,
}) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const containerDiv = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Custom Mars viewer initialization
  const initializeMarsViewer = ({ containerRef, viewer: viewerRef }: { containerRef: React.RefObject<HTMLDivElement | null>, viewer: React.MutableRefObject<Viewer | null> }) => {
    if (!containerRef.current || viewerRef.current) return;

    const marsViewer = new Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      infoBox: false,
      selectionIndicator: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      vrButton: false,
    });

    // Configure Mars-specific settings
    marsViewer.scene.globe.enableLighting = true;
    marsViewer.scene.globe.atmosphereHueShift = 0.1;
    marsViewer.scene.globe.atmosphereSaturationShift = -0.3;
    marsViewer.scene.globe.atmosphereBrightnessShift = -0.2;
    
    // Replace Earth imagery with Mars surface coloring
    marsViewer.imageryLayers.removeAll();
    
    // Set Mars base color for the globe
    marsViewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#CD5C5C');
    
    // Also set terrain appearance to Mars-like
    marsViewer.scene.globe.material = Cesium.Material.fromType('Color');
    marsViewer.scene.globe.material.uniforms.color = Cesium.Color.fromCssColorString('#CD5C5C');
    
    // Set Mars-like atmosphere color
    if (marsViewer.scene.skyAtmosphere) {
      marsViewer.scene.skyAtmosphere.hueShift = 0.1;
      marsViewer.scene.skyAtmosphere.saturationShift = -0.5;
      marsViewer.scene.skyAtmosphere.brightnessShift = -0.3;
    }

    // Add Mars surface features (fictional Mars locations for demo)
    const marsFeatures = [
      { name: "Olympus Mons", lat: 18.65, lon: -133.8, description: "Largest volcano in the solar system" },
      { name: "Valles Marineris", lat: -14.0, lon: -59.0, description: "Grand canyon of Mars" },
      { name: "Polar Ice Cap", lat: 85.0, lon: 0.0, description: "North polar ice cap" },
      { name: "Hellas Basin", lat: -42.4, lon: 70.5, description: "Large impact crater" },
      { name: "Gale Crater", lat: -5.4, lon: 137.8, description: "Curiosity rover landing site" }
    ];

    // Add Mars feature markers
    marsFeatures.forEach(feature => {
      marsViewer.entities.add({
        name: feature.name,
        position: Cesium.Cartesian3.fromDegrees(feature.lon, feature.lat),
        billboard: {
          image: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#FF4500" stroke="#8B0000" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
            </svg>
          `),
          scale: 1.5,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        },
        label: {
          text: feature.name,
          font: '12pt sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -50),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        description: `<h3>${feature.name}</h3><p>${feature.description}</p>`
      });
    });

    // Set initial Mars view
    marsViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 20000000), // Above equator, showing full Earth
    orientation: {
        heading: 0.0,
        pitch: -1.57, // Looking straight down
        roll: 0.0,
    },
    });

    viewerRef.current = marsViewer;
  };

  // Use the custom Mars initializer instead of the regular useCesiumViewer
  React.useEffect(() => {
    initializeMarsViewer({ containerRef: cesiumContainer, viewer });
    
    return () => {
      if (viewer.current) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);

  useFlyToCoords({ viewer, flyToCoords: flyToCoords || searchCoords });
  const { takeScreenshot, downloadScreenshot, closeScreenshotModal } = useScreenshot({
    viewer,
    setScreenshotUrl,
    setShowScreenshotModal,
  });

  const handleDownloadScreenshot = () => {
    if (screenshotUrl) {
      downloadScreenshot(screenshotUrl);
    }
  };

  const handleCloseScreenshotModal = () => {
    closeScreenshotModal(screenshotUrl);
  };

  const handleSearchResult = (data: { lat: number; lon: number; name: string }) => {
    setSearchCoords({ lat: data.lat, lon: data.lon });
  };

  return (
    <div 
      ref={containerDiv}
      className="relative"
      style={{ width, height }}
    >
      {/* Top Right Controls */}
      <div className="absolute right-4 top-4 z-20 flex items-start gap-3">
        <SearchBox onResult={handleSearchResult} />
        <button
          onClick={takeScreenshot}
          className="rounded-lg bg-black/70 p-2 text-white transition-all hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50 mt-1"
          title="Take Screenshot"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Mars Info Panel */}
      <div className="absolute left-4 bottom-4 z-20 bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm max-w-xs">
        <div className="text-sm">
          <h3 className="font-bold text-red-400 mb-2">🔴 Mars Explorer</h3>
          <p className="text-xs text-gray-300 mb-2">
            Explore the Red Planet's surface features, including volcanoes, canyons, and rover landing sites.
          </p>
          <div className="text-xs">
            <strong>Featured Locations:</strong><br />
            • Olympus Mons (Largest volcano)<br />
            • Valles Marineris (Grand canyon)<br />
            • Gale Crater (Curiosity site)<br />
            • Polar Ice Caps
          </div>
        </div>
      </div>

      {/* Cesium Container */}
      <div
        ref={cesiumContainer}
        className="overflow-hidden"
        style={{ width, height }}
      />

      {/* Screenshot Modal */}
      <ScreenshotModal
        isOpen={showScreenshotModal}
        screenshotUrl={screenshotUrl}
        onClose={handleCloseScreenshotModal}
        onDownload={handleDownloadScreenshot}
      />
    </div>
  );
};

export default Mars;