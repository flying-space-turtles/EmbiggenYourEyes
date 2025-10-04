import { useEffect } from 'react';
import { Viewer, Cartesian3, Ion } from 'cesium';
import { addSampleLocations } from '../utils/cesiumHelpers';

interface UseCesiumViewerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewer: React.MutableRefObject<Viewer | null>;
}

export const useCesiumViewer = ({ containerRef, viewer }: UseCesiumViewerProps) => {
  useEffect(() => {
    if (containerRef.current && !viewer.current) {
      // Set Cesium Ion access token
      const cesiumToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN;
      if (cesiumToken && cesiumToken !== 'your-cesium-ion-token-here') {
        Ion.defaultAccessToken = cesiumToken;
        console.log('Cesium Ion token configured successfully');
      } else {
        console.warn('Cesium Ion token not configured. Some imagery may not be available. See CESIUM_SETUP.md for instructions.');
      }

      // Initialize Cesium viewer
      viewer.current = new Viewer(containerRef.current, {
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
  }, [containerRef, viewer]);
};