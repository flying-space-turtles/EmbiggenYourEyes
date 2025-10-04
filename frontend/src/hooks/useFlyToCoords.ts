import { useEffect } from 'react';
import { Cartesian3, Viewer } from 'cesium';

interface UseFlyToCoordsProps {
  viewer: React.MutableRefObject<Viewer | null>;
  flyToCoords?: { lat: number; lon: number } | null;
  altitude?: number;
  duration?: number;
}

export const useFlyToCoords = ({ 
  viewer, 
  flyToCoords, 
  altitude = 2000000, 
  duration = 3 
}: UseFlyToCoordsProps) => {
  useEffect(() => {
    if (flyToCoords && viewer.current) {
      viewer.current.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          flyToCoords.lon,
          flyToCoords.lat,
          altitude
        ),
        duration,
      });
    }
  }, [flyToCoords, viewer, altitude, duration]);
};