import { useEffect } from 'react';
import { Viewer, Rectangle} from 'cesium';

import { type FlyToCoords } from "../types/FlyToCoords";

interface UseFlyToCoordsProps {
  viewer: React.MutableRefObject<Viewer | null>;
  flyToCoords?: FlyToCoords | null;
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