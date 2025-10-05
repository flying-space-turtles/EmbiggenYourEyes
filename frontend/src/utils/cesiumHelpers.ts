import { Viewer, Cartesian3, Color, Entity } from 'cesium';

export const addSampleLocations = (cesiumViewer: Viewer): void => {
  // Add NASA locations
  const locations = [
    { name: 'NASA Goddard Space Flight Center', lat: 38.9964, lon: -76.8479 },
    { name: 'NASA Kennedy Space Center', lat: 28.5721, lon: -80.6480 },
    { name: 'NASA Johnson Space Center', lat: 29.5591, lon: -95.0907 },
    { name: 'NASA Jet Propulsion Laboratory', lat: 34.2048, lon: -118.1711 },
    { name: 'NASA Ames Research Center', lat: 37.4143, lon: -122.0574 },
    { name: 'Kīlauea, Hawaii, USA', lat: 19.4069, lon: -155.2834 },
    { name: 'Mount Etna, Italy', lat: 37.7510, lon: 14.9934 },
    { name: 'Nyiragongo, DR Congo', lat: -1.52, lon: 29.25 },
    { name: 'Amazon Rainforest, Brazil (Rondônia)', lat: -10.83, lon: -63.34 },
    { name: 'Borneo (Kalimantan, Indonesia)', lat: 0.0, lon: 114.0 },
    { name: 'Congo Basin, DRC', lat: -2.0, lon: 23.0 },
    { name: 'Lake Chad, Africa', lat: 13.0, lon: 14.0 },
    { name: 'Aral Sea, Kazakhstan / Uzbekistan', lat: 45.0, lon: 60.0 },
    { name: 'Great Salt Lake, Utah, USA', lat: 41.1, lon: -112.6 },
    { name: 'Sahel Region, Africa (Niger, Mali)', lat: 15.0, lon: 5.0 },
    { name: 'Northern China (Inner Mongolia Plateau)', lat: 42.0, lon: 112.0 },
    { name: 'Western United States (Colorado Plateau)', lat: 37.0, lon: -110.0 },
    { name: 'Bangladesh Delta (Ganges-Brahmaputra)', lat: 22.0, lon: 90.0 },
    { name: 'Louisiana Coast, USA', lat: 29.5, lon: -91.0 },
    { name: 'Tuvalu & Kiribati (Pacific Islands)', lat: -7.1, lon: 177.4 },
    { name: 'Thwaites Glacier, West Antarctica', lat: -75.3, lon: -106.7 },
    { name: 'Jakobshavn Glacier, Greenland', lat: 69.17, lon: -49.92 },
    { name: 'Pine Island Glacier, West Antarctica', lat: -75.1, lon: -100.0 }
  ];

  locations.forEach((location) => {
    cesiumViewer.entities.add(
      new Entity({
        name: location.name,
        position: Cartesian3.fromDegrees(location.lon, location.lat),
        point: {
          pixelSize: 10,
          color: Color.YELLOW,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          heightReference: 0, // CLAMP_TO_GROUND
        },
        label: {
          text: location.name,
          font: '12pt Arial',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cartesian3(0, -40, 0),
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.7),
        },
        show: true,
      })
    );
  });
};