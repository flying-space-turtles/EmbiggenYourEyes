import { useEffect, useState } from "react";
import * as Cesium from "cesium";

interface ViewportCoords {
  lat: number;
  lon: number;
  height: number;
}

export function useViewportCenter(viewerRef: React.MutableRefObject<Cesium.Viewer | null>) {
  const [viewportCoords, setViewportCoords] = useState<ViewportCoords | null>(null);

  useEffect(() => {
    const viewer = viewerRef.current;

    // 🛑 Make sure viewer is initialized and has a scene
    if (!viewer || !viewer.scene) return;

    const getViewportCenter = (viewer: Cesium.Viewer) => {
      if (!viewer?.scene || viewer.isDestroyed()) return null;

      const scene = viewer.scene;
      const canvas = viewer.canvas;
      const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);

      const ray = viewer.camera.getPickRay(center);
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

    const handleMove = () => {
      const coords = getViewportCenter(viewer);
      if (coords) setViewportCoords(coords);
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

  return viewportCoords;
}