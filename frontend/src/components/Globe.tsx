import React, { useRef, useState } from 'react';
import { Viewer } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import ScreenshotModal from './ScreenshotModal';
import { useCesiumViewer } from '../hooks/useCesiumViewer';
import { useScreenshot } from '../hooks/useScreenshot';
import { useFlyToCoords } from '../hooks/useFlyToCoords';

interface GlobeProps {
  width?: string;
  height?: string;
  flyToCoords?: { lat: number; lon: number } | null;
}

const Globe: React.FC<GlobeProps> = ({
  width = "100%",
  height = "500px",
  flyToCoords,
}) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const containerDiv = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  useCesiumViewer({ containerRef: cesiumContainer, viewer });
  useFlyToCoords({ viewer, flyToCoords });
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

  return (
    <div 
      ref={containerDiv}
      className="relative"
      style={{ width, height }}
    >
      {/* Screenshot Button */}
      <div className="absolute right-4 top-4 z-10">
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

export default Globe;
