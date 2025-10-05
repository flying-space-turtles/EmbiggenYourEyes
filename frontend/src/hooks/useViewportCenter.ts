import { useEffect, useState } from "react";
import * as Cesium from "cesium";

interface ViewportCorner {
  lat: number;
  lon: number;
  height: number;
}

interface ViewportBounds {
  topLeft: ViewportCorner;
  topRight: ViewportCorner;
  bottomLeft: ViewportCorner;
  bottomRight: ViewportCorner;
}

interface BoundingRegion {
  north: number; // Maximum latitude
  south: number; // Minimum latitude
  east: number;  // Maximum longitude
  west: number;  // Minimum longitude
  minHeight: number;
  maxHeight: number;
}

export function useViewportCenter(viewerRef: React.MutableRefObject<Cesium.Viewer | null>) {
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);

  useEffect(() => {
    const viewer = viewerRef.current;

    // 🛑 Make sure viewer is initialized and has a scene
    if (!viewer || !viewer.scene) return;

    const getViewportBounds = (viewer: Cesium.Viewer): ViewportBounds | null => {
      if (!viewer?.scene || viewer.isDestroyed()) return null;

      const scene = viewer.scene;
      const canvas = viewer.canvas;
      
      // Define the 4 corner points of the viewport
      const corners = [
        new Cesium.Cartesian2(0, 0), // Top-left
        new Cesium.Cartesian2(canvas.clientWidth, 0), // Top-right
        new Cesium.Cartesian2(0, canvas.clientHeight), // Bottom-left
        new Cesium.Cartesian2(canvas.clientWidth, canvas.clientHeight), // Bottom-right
      ];

      const getCornerCoords = (screenPoint: Cesium.Cartesian2): ViewportCorner | null => {
        const ray = viewer.camera.getPickRay(screenPoint);
        if (!ray) return null;
        const cartesian = scene.globe.pick(ray, scene);
        if (!cartesian) return null;

        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        return {
          lat: Cesium.Math.toDegrees(cartographic.latitude),
          lon: Cesium.Math.toDegrees(cartographic.longitude),
          height: cartographic.height,
        };
      };

      // Get coordinates for all 4 corners
      const topLeft = getCornerCoords(corners[0]);
      const topRight = getCornerCoords(corners[1]);
      const bottomLeft = getCornerCoords(corners[2]);
      const bottomRight = getCornerCoords(corners[3]);

      // Return null if any corner couldn't be determined
      if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
        return null;
      }

      return {
        topLeft,
        topRight,
        bottomLeft,
        bottomRight,
      };
    };

    const handleMove = () => {
      const bounds = getViewportBounds(viewer);
      if (bounds) setViewportBounds(bounds);
    };

    // 🔒 Add listener safely
    viewer.camera.moveEnd.addEventListener(handleMove);

    // Initial call (after Cesium viewer fully ready)
    setTimeout(handleMove, 500);

    return () => {
      if (!viewer.isDestroyed()) {
        viewer.camera.moveEnd.removeEventListener(handleMove);
      }
    };
  }, [viewerRef]);

  return viewportBounds;
}

// Helper function to convert viewport bounds to a bounding region
export function getBoundingRegion(bounds: ViewportBounds): BoundingRegion {
  const allLats = [bounds.topLeft.lat, bounds.topRight.lat, bounds.bottomLeft.lat, bounds.bottomRight.lat];
  const allLons = [bounds.topLeft.lon, bounds.topRight.lon, bounds.bottomLeft.lon, bounds.bottomRight.lon];
  const allHeights = [bounds.topLeft.height, bounds.topRight.height, bounds.bottomLeft.height, bounds.bottomRight.height];

  return {
    north: Math.max(...allLats),
    south: Math.min(...allLats),
    east: Math.max(...allLons),
    west: Math.min(...allLons),
    minHeight: Math.min(...allHeights),
    maxHeight: Math.max(...allHeights),
  };
}