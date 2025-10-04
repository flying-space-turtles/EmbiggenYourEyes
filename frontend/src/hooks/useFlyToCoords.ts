import { useEffect } from 'react';
import { Cartesian3, Viewer, Rectangle} from 'cesium';

interface UseFlyToCoordsProps {
  viewer: React.MutableRefObject<Viewer | null>;
  flyToCoords?: { lat: number; lon: number; boundingbox: {
    south: number;
    north: number;
    west: number;
    east: number;
  };} | null;
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
    if (!viewer.current || !flyToCoords) return;
    // Fly to the bounding box
    const rectangle = Rectangle.fromDegrees(
      flyToCoords.boundingbox.west,
      flyToCoords.boundingbox.south,
      flyToCoords.boundingbox.east,
      flyToCoords.boundingbox.north
    );

    viewer.current.camera.flyTo({
      destination: rectangle,
      duration,
    });

    
  }, [viewer, flyToCoords, altitude, duration]);
};