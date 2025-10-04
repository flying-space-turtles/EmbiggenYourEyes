import { useCallback } from 'react';
import { Viewer } from 'cesium';

interface UseScreenshotProps {
  viewer: React.MutableRefObject<Viewer | null>;
  setScreenshotUrl: (url: string | null) => void;
  setShowScreenshotModal: (show: boolean) => void;
}

export const useScreenshot = ({
  viewer,
  setScreenshotUrl,
  setShowScreenshotModal,
}: UseScreenshotProps) => {
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
  }, [viewer, setScreenshotUrl, setShowScreenshotModal]);

  const downloadScreenshot = useCallback((screenshotUrl: string) => {
    const link = document.createElement('a');
    link.download = `globe-view-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.href = screenshotUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const closeScreenshotModal = useCallback((screenshotUrl: string | null) => {
    setShowScreenshotModal(false);
    // Clean up the data URL to free memory
    if (screenshotUrl) {
      URL.revokeObjectURL(screenshotUrl);
      setScreenshotUrl(null);
    }
  }, [setShowScreenshotModal, setScreenshotUrl]);

  return {
    takeScreenshot,
    downloadScreenshot,
    closeScreenshotModal,
  };
};