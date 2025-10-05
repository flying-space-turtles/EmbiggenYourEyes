import { useCallback, useState } from 'react';
import { Viewer } from 'cesium';

interface UseComparisonScreenshotProps {
  viewer: React.MutableRefObject<Viewer | null>;
  applyGibsOverlay?: (layerId: string, time: string, format: "jpg" | "png") => void;
  currentLayerId?: string;
  currentFormat?: "jpg" | "png";
  currentDateStr?: string;
  waitForImageryToLoad?: (maxWaitTime?: number) => Promise<void>;
}

interface ComparisonImages {
  beforeImage: string;
  afterImage: string;
  beforeDate: string;
  afterDate: string;
}

export const useComparisonScreenshot = ({
  viewer,
  applyGibsOverlay,
  currentLayerId,
  currentFormat,
  currentDateStr,
  waitForImageryToLoad,
}: UseComparisonScreenshotProps) => {
  const [comparisonImages, setComparisonImages] = useState<ComparisonImages | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const takeComparisonScreenshots = useCallback(async (beforeDate: string, afterDate: string) => {
    if (!viewer.current || !applyGibsOverlay || !currentLayerId || !currentFormat || !waitForImageryToLoad) {
      console.error('Missing required dependencies for comparison screenshot');
      return;
    }

    const originalDate = currentDateStr;
    
    try {
      console.log(`Taking comparison screenshots: ${beforeDate} vs ${afterDate}`);
      
      // Take "before" screenshot
      console.log('Capturing "before" image...');
      applyGibsOverlay(currentLayerId, beforeDate, currentFormat);
      await waitForImageryToLoad(15000);
      
      // Force multiple renders for before image
      for (let i = 0; i < 5; i++) {
        viewer.current.render();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      viewer.current.render();
      
      const beforeCanvas = viewer.current.scene.canvas;
      const beforeDataUrl = beforeCanvas.toDataURL('image/png');
      
      // Take "after" screenshot
      console.log('Capturing "after" image...');
      applyGibsOverlay(currentLayerId, afterDate, currentFormat);
      await waitForImageryToLoad(15000);
      
      // Force multiple renders for after image
      for (let i = 0; i < 5; i++) {
        viewer.current.render();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      viewer.current.render();
      
      const afterCanvas = viewer.current.scene.canvas;
      const afterDataUrl = afterCanvas.toDataURL('image/png');
      
      // Set comparison images and show modal
      setComparisonImages({
        beforeImage: beforeDataUrl,
        afterImage: afterDataUrl,
        beforeDate,
        afterDate,
      });
      setShowComparisonModal(true);
      
      console.log('Comparison screenshots captured successfully');
      
      // Restore original date
      if (originalDate) {
        setTimeout(() => {
          console.log(`Restoring original date: ${originalDate}`);
          applyGibsOverlay(currentLayerId, originalDate, currentFormat);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error taking comparison screenshots:', error);
      
      // Restore original date on error
      if (originalDate) {
        setTimeout(() => {
          applyGibsOverlay(currentLayerId, originalDate, currentFormat);
        }, 100);
      }
    }
  }, [viewer, applyGibsOverlay, currentLayerId, currentFormat, currentDateStr, waitForImageryToLoad]);

  const downloadComparisonImages = useCallback(() => {
    if (!comparisonImages) return;

    // Create a canvas to combine both images side by side
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const beforeImg = new Image();
    const afterImg = new Image();
    
    let imagesLoaded = 0;
    const checkImagesLoaded = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        // Set canvas size to accommodate both images side by side
        canvas.width = beforeImg.width * 2;
        canvas.height = beforeImg.height;
        
        // Draw before image on the left
        ctx.drawImage(beforeImg, 0, 0);
        
        // Draw after image on the right
        ctx.drawImage(afterImg, beforeImg.width, 0);
        
        // Add labels
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        
        // Before label
        const beforeText = `Before: ${comparisonImages.beforeDate}`;
        ctx.strokeText(beforeText, 20, 40);
        ctx.fillText(beforeText, 20, 40);
        
        // After label
        const afterText = `After: ${comparisonImages.afterDate}`;
        ctx.strokeText(afterText, beforeImg.width + 20, 40);
        ctx.fillText(afterText, beforeImg.width + 20, 40);
        
        // Download the combined image
        const link = document.createElement('a');
        link.download = `comparison-${comparisonImages.beforeDate}-vs-${comparisonImages.afterDate}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    
    beforeImg.onload = checkImagesLoaded;
    afterImg.onload = checkImagesLoaded;
    beforeImg.src = comparisonImages.beforeImage;
    afterImg.src = comparisonImages.afterImage;
  }, [comparisonImages]);

  const closeComparisonModal = useCallback(() => {
    setShowComparisonModal(false);
    // Clean up the data URLs to free memory
    if (comparisonImages) {
      URL.revokeObjectURL(comparisonImages.beforeImage);
      URL.revokeObjectURL(comparisonImages.afterImage);
      setComparisonImages(null);
    }
  }, [comparisonImages]);

  return {
    comparisonImages,
    showComparisonModal,
    takeComparisonScreenshots,
    downloadComparisonImages,
    closeComparisonModal,
  };
};