import React, { useRef, useState } from 'react';
import { Viewer } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import ControlButtons from './ControlButtons';
import ScreenshotModal from './ScreenshotModal';
import { useCesiumViewer } from '../hooks/useCesiumViewer';
import { useFullscreen } from '../hooks/useFullscreen';
import { useScreenshot } from '../hooks/useScreenshot';

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

  // Initialize Cesium viewer
  useCesiumViewer({ containerRef: cesiumContainer, viewer });

  // Fullscreen functionality
  const { toggleFullscreen } = useFullscreen({
    containerRef: containerDiv,
    viewer,
    isFullscreen,
    setIsFullscreen,
  });

  // Screenshot functionality
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
      {/* Control Buttons */}
      <ControlButtons
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onTakeScreenshot={takeScreenshot}
      />

      {/* Cesium Container */}
      <div
        ref={cesiumContainer}
        className={`overflow-hidden rounded-lg ${
          isFullscreen ? 'h-screen w-screen' : 'border border-gray-300'
        }`}
        style={isFullscreen ? {} : { width, height }}
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