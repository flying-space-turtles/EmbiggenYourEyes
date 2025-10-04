import { useCallback } from 'react';
import { Viewer } from 'cesium';

interface UseScreenshotProps {
  viewer: React.MutableRefObject<Viewer | null>;
  setScreenshotUrl: (url: string | null) => void;
  setShowScreenshotModal: (show: boolean) => void;
  // Add optional props for date-specific screenshots
  applyGibsOverlay?: (layerId: string, time: string, format: "jpg" | "png") => void;
  currentLayerId?: string;
  currentFormat?: "jpg" | "png";
  currentDateStr?: string;
}

export const useScreenshot = ({
  viewer,
  setScreenshotUrl,
  setShowScreenshotModal,
  applyGibsOverlay,
  currentLayerId,
  currentFormat,
  currentDateStr,
}: UseScreenshotProps) => {
  // Helper function to wait for imagery to load
  const waitForImageryToLoad = useCallback((maxWaitTime = 15000): Promise<void> => {
    return new Promise((resolve) => {
      if (!viewer.current) {
        resolve();
        return;
      }

      console.log('Waiting for imagery to load...');
      let attempts = 0;
      const maxAttempts = maxWaitTime / 200; // Check every 200ms for better performance
      
      const checkImageryReady = () => {
        if (!viewer.current || attempts >= maxAttempts) {
          console.log(`Imagery loading timeout (${attempts * 200}ms) or viewer unavailable, proceeding with screenshot`);
          resolve();
          return;
        }

        const globe = viewer.current.scene.globe;
        const imageryLayers = viewer.current.scene.imageryLayers;
        
        // Check if all imagery layers are ready
        let allLayersReady = true;
        let layerStatus = '';
        
        for (let i = 0; i < imageryLayers.length; i++) {
          const layer = imageryLayers.get(i);
          layerStatus += `Layer ${i}: ${layer.ready ? 'ready' : 'loading'}, `;
          if (!layer.ready) {
            allLayersReady = false;
          }
        }
        
        // Check if globe tiles are loaded
        const tilesLoaded = globe.tilesLoaded;
        
        if (allLayersReady && tilesLoaded) {
          console.log(`All imagery loaded after ${attempts * 200}ms - ${layerStatus}globe tiles loaded: ${tilesLoaded}`);
          resolve();
        } else {
          if (attempts % 10 === 0) { // Log every 2 seconds
            console.log(`Still loading... (${attempts * 200}ms) - ${layerStatus}globe tiles: ${tilesLoaded}`);
          }
          attempts++;
          setTimeout(checkImageryReady, 200);
        }
      };

      // Start checking after a small delay to let the initial request start
      setTimeout(checkImageryReady, 300);
    });
  }, [viewer]);

  const takeScreenshot = useCallback(async (screenshotDate?: string) => {
    if (!viewer.current) return;

    try {
      const originalDate = currentDateStr;
      
      // If a specific date is provided and we have overlay functions, temporarily apply it
      if (screenshotDate && applyGibsOverlay && currentLayerId && currentFormat) {
        console.log(`Taking screenshot with date: ${screenshotDate}`);
        
        // Apply the screenshot-specific date
        applyGibsOverlay(currentLayerId, screenshotDate, currentFormat);
        
        // Wait for imagery to fully load
        await waitForImageryToLoad();
        
        // Force multiple renders to ensure all tiles are properly displayed
        console.log('Rendering final frames...');
        for (let i = 0; i < 5; i++) {
          viewer.current.render();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Additional render to ensure everything is properly drawn
        viewer.current.render();
        
        // Take the screenshot
        console.log('Capturing screenshot...');
        const canvas = viewer.current.scene.canvas;
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshotUrl(dataUrl);
        setShowScreenshotModal(true);
        console.log('Screenshot captured successfully');
        
        // Restore the original date after screenshot
        if (originalDate && applyGibsOverlay && currentLayerId && currentFormat) {
          setTimeout(() => {
            console.log(`Restoring original date: ${originalDate}`);
            applyGibsOverlay(currentLayerId, originalDate, currentFormat);
          }, 100);
        }
      } else {
        // Standard screenshot without date change
        console.log('Taking standard screenshot');
        
        // Wait for current imagery to be ready
        await waitForImageryToLoad(5000); // Reasonable wait for current view
        
        // Force a few renders to ensure current tiles are displayed
        for (let i = 0; i < 3; i++) {
          viewer.current.render();
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        viewer.current.render(); // Final render
        
        const canvas = viewer.current.scene.canvas;
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshotUrl(dataUrl);
        setShowScreenshotModal(true);
      }
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
  }, [viewer, setScreenshotUrl, setShowScreenshotModal, applyGibsOverlay, currentLayerId, currentFormat, currentDateStr, waitForImageryToLoad]);

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
    waitForImageryToLoad, // Export for use by comparison hook
  };
};