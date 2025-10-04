// FlyToCoords.tsx
export interface FlyToCoords {
  lat: number;
  lon: number;
  boundingbox: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
}