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
    
    const { west, south, east, north } = flyToCoords.boundingbox;
    
    // Calculate current dimensions in degrees
    const widthDegrees = east - west;
    const heightDegrees = north - south;
    
    // Convert 100m to degrees (approximately 0.0009 degrees = 100m)
    const minSizeDegrees = 0.0012;
    
    // Ensure minimum size
    const finalWidth = Math.max(widthDegrees, minSizeDegrees);
    const finalHeight = Math.max(heightDegrees, minSizeDegrees);
    
    // Calculate center point
    const centerLon = (west + east) / 2;
    const centerLat = (south + north) / 2;
    
    // Create adjusted bounds
    const adjustedWest = centerLon - finalWidth / 2;
    const adjustedEast = centerLon + finalWidth / 2;
    const adjustedSouth = centerLat - finalHeight / 2;
    const adjustedNorth = centerLat + finalHeight / 2;
    
    // Fly to the bounding box
    const rectangle = Rectangle.fromDegrees(
      adjustedWest,
      adjustedSouth,
      adjustedEast,
      adjustedNorth
    );

    viewer.current.camera.flyTo({
      destination: rectangle,
      duration,
    });
  }, [viewer, flyToCoords, altitude, duration]);
};