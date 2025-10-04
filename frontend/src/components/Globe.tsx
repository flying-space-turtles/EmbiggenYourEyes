import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Viewer,
  Cartesian3,
  Cartesian2,
  Ion,
  Entity,
  Color,
  WebMapTileServiceImageryProvider,
  WebMercatorTilingScheme,
  Credit,
  ImageryLayer,
  UrlTemplateImageryProvider,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

interface GlobeProps {
  width?: string;
  height?: string;
  flyToCoords?: { lat: number; lon: number } | null;
}

type GibsLayer = {
  id: string;
  name: string;
  format: "jpg" | "png";
};

// Mercator-only, time-enabled layers (no BlueMarble)
const LAYERS: GibsLayer[] = [
  { id: "MODIS_Terra_CorrectedReflectance_TrueColor",  name: "MODIS Terra — True Color",          format: "jpg" },
  { id: "MODIS_Aqua_CorrectedReflectance_TrueColor",   name: "MODIS Aqua — True Color",           format: "jpg" },
  { id: "MODIS_Terra_CorrectedReflectance_Bands721",   name: "MODIS Terra — False Color (7-2-1)", format: "jpg" },
  { id: "MODIS_Aqua_CorrectedReflectance_Bands721",    name: "MODIS Aqua — False Color (7-2-1)",  format: "jpg" },
  { id: "VIIRS_SNPP_CorrectedReflectance_TrueColor",   name: "VIIRS SNPP — True Color",            format: "jpg" },
];

const TILEMATRIX_SET = "GoogleMapsCompatible_Level9";
const MAX_LEVEL_3857 = 9;

// blend controls
const BASE_ALPHA = 0.8; // default base map underneath
const GIBS_ALPHA = 0.9;  // GIBS overlay on top

function buildGibsProvider3857(layerId: string, time: string, format: "jpg" | "png") {
  const tilingScheme = new WebMercatorTilingScheme();
  const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layerId}/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.${format}`;

  return new WebMapTileServiceImageryProvider({
    url,
    layer: layerId,
    style: "default",
    format: format === "png" ? "image/png" : "image/jpeg",
    tileMatrixSetID: TILEMATRIX_SET,
    tilingScheme,
    maximumLevel: MAX_LEVEL_3857,
    credit: new Credit("NASA GIBS"),
    dimensions: { Time: time }, // substitutes {Time}
  });
}

const Globe: React.FC<GlobeProps> = ({
  width = "100%",
  height = "500px",
  flyToCoords,
}) => {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const containerDiv = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // keep layer refs
  const baseLayerRef = useRef<ImageryLayer | null>(null);
  const gibsLayerRef = useRef<ImageryLayer | null>(null);

  // UI state
  const [layerId, setLayerId] = useState<string>(LAYERS[0].id);
  const [dateStr, setDateStr] = useState<string>("default"); // "default" or "YYYY-MM-DD"

  useEffect(() => {
    if (cesiumContainer.current && !viewer.current) {
      const token = (import.meta as any).env?.VITE_CESIUM_ION_ACCESS_TOKEN;
      if (token) Ion.defaultAccessToken = token;

      // Do NOT pass imageryProvider; let Viewer attach its default (Ion) based on token.
      viewer.current = new Viewer(cesiumContainer.current, {
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

      const layers = viewer.current.scene.imageryLayers;

      // Grab default base layer (if any). If none (e.g., older builds or token issues), add OSM fallback.
      baseLayerRef.current = layers.get(0) || null;
      if (!baseLayerRef.current) {
        const osm = new UrlTemplateImageryProvider({
          url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          credit: "© OpenStreetMap contributors",
        });
        baseLayerRef.current = layers.addImageryProvider(osm);
        layers.lowerToBottom(baseLayerRef.current);
      }
      if (baseLayerRef.current) baseLayerRef.current.alpha = BASE_ALPHA;

      // Add initial GIBS overlay
      const initial = LAYERS[0];
      applyGibsOverlay(initial.id, "default", initial.format);

      // camera
      viewer.current.camera.setView({
        destination: Cartesian3.fromDegrees(0, 0, 2.0e7),
        orientation: { heading: 0, pitch: -1.57, roll: 0 },
      });

      addSampleLocations(viewer.current);
    }

    return () => {
      viewer.current?.destroy();
      viewer.current = null;
    };
  }, []);

  const applyGibsOverlay = (id: string, time: string, format: "jpg" | "png") => {
    if (!viewer.current) return;
    const layers = viewer.current.scene.imageryLayers;

    if (gibsLayerRef.current) {
      layers.remove(gibsLayerRef.current, false);
      gibsLayerRef.current = null;
    }

    const provider = buildGibsProvider3857(id, time, format);
    const imagery = layers.addImageryProvider(provider); // sits above base
    imagery.alpha = GIBS_ALPHA;
    gibsLayerRef.current = imagery;

    // @ts-ignore
    provider.readyPromise?.then(
      () => console.info(`[GIBS] Ready: ${id} @ ${time}`),
      (e: any) => console.error(`[GIBS] Failed: ${id} @ ${time}`, e)
    );
  };

  // Fly camera when coordinates change
  useEffect(() => {
    if (flyToCoords && viewer.current) {
      viewer.current.camera.flyTo({
        destination: Cartesian3.fromDegrees(flyToCoords.lon, flyToCoords.lat, 2.0e6),
        duration: 3,
      });
    }
  }, [flyToCoords]);

  const addSampleLocations = (v: Viewer) => {
    const locs = [
      { name: "NASA Goddard Space Flight Center", lat: 38.9964, lon: -76.8479 },
      { name: "NASA Kennedy Space Center",        lat: 28.5721, lon: -80.6480 },
      { name: "NASA Johnson Space Center",        lat: 29.5591, lon: -95.0907 },
      { name: "NASA JPL",                         lat: 34.2048, lon: -118.1711 },
    ];
    locs.forEach((p) => {
      v.entities.add(new Entity({
        name: p.name,
        position: Cartesian3.fromDegrees(p.lon, p.lat),
        point: { pixelSize: 10, color: Color.YELLOW, outlineColor: Color.BLACK, outlineWidth: 2 },
        label: {
          text: p.name,
          font: "12pt Arial",
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cartesian2(0, -40),
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.9),
        },
      }));
    });
  };

  // Fullscreen handlers
  const toggleFullscreen = useCallback(async () => {
    if (!containerDiv.current) return;
    if (!document.fullscreenElement) await containerDiv.current.requestFullscreen();
    else await document.exitFullscreen();
  }, []);

  useEffect(() => {
    const onFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      viewer.current?.resize();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && containerDiv.current?.contains(document.activeElement)) {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
    };
    document.addEventListener("fullscreenchange", onFSChange);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFSChange);
      document.removeEventListener("keydown", onKey);
    };
  }, [toggleFullscreen]);

  const applySurface = () => {
    const meta = LAYERS.find(l => l.id === layerId)!;
    applyGibsOverlay(layerId, dateStr, meta.format);
  };

  return (
    <div ref={containerDiv} className="relative" style={{ width, height }}>
      {/* Surface control panel */}
      <div
        className="absolute right-2 top-2 z-10 rounded-md border border-gray-300 bg-white/90 p-3 text-sm shadow"
        style={{ maxWidth: 360 }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>GIBS Surface (EPSG:3857)</div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>
            Layer
            <select
              value={layerId}
              onChange={(e) => setLayerId(e.target.value)}
              style={{ width: "100%" }}
            >
              {LAYERS.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>

          <label>
            Time
            <div style={{ display: "flex", gap: 6 }}>
              <select
                value={dateStr === "default" ? "default" : "custom"}
                onChange={(e) =>
                  setDateStr(e.target.value === "default" ? "default" : new Date().toISOString().slice(0, 10))
                }
              >
                <option value="default">default (latest)</option>
                <option value="custom">custom date</option>
              </select>
              <input
                type="date"
                value={dateStr === "default" ? "" : dateStr}
                onChange={(e) => setDateStr(e.target.value || "default")}
                disabled={dateStr === "default"}
              />
            </div>
          </label>

          <button onClick={applySurface} style={{ padding: "6px 10px" }}>
            Apply
          </button>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Tip: tweak <code>BASE_ALPHA</code> and <code>GIBS_ALPHA</code> to change blending.
          </div>
        </div>
      </div>

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute left-2 top-2 z-10 rounded-lg bg-black/70 p-2 text-white transition-all hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50"
        title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen (F)"}
      >
        {isFullscreen ? "×" : "⤢"}
      </button>

      {/* Cesium Container */}
      <div
        ref={cesiumContainer}
        className={`overflow-hidden rounded-lg ${isFullscreen ? "h-screen w-screen" : "border border-gray-300"}`}
        style={isFullscreen ? {} : { width, height }}
      />
    </div>
  );
};

export default Globe;  const toggleFullscreen = useCallback(async () => {
    if (!containerDiv.current) return;
    if (!document.fullscreenElement) await containerDiv.current.requestFullscreen();
    else await document.exitFullscreen();
