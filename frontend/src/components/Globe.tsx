import React, { useEffect, useRef, useState } from "react";
import { Cartesian3, Credit, ImageryLayer, Ion, UrlTemplateImageryProvider, Viewer, WebMapTileServiceImageryProvider, WebMercatorTilingScheme } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import ScreenshotModal from "./ScreenshotModal";
import SearchBox from "./SearchBox";
import { useScreenshot } from "../hooks/useScreenshot";
import { useFlyToCoords } from "../hooks/useFlyToCoords";
import { type FlyToCoords } from "../types/FlyToCoords";
import { addSampleLocations } from "../utils/cesiumHelpers";

interface GlobeProps {
  width?: string;
  height?: string;
  flyToCoords?: FlyToCoords | null;
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
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [searchCoords, setSearchCoords] = useState<FlyToCoords | null>(null);

  // useCesiumViewer({ containerRef: cesiumContainer, viewer });
  useFlyToCoords({ viewer, flyToCoords: flyToCoords || searchCoords });
  const { takeScreenshot, downloadScreenshot, closeScreenshotModal } = useScreenshot({
      viewer,
      setScreenshotUrl,
      setShowScreenshotModal,
    });

  const handleDownloadScreenshot = () => {
    if (screenshotUrl) {
      downloadScreenshot(screenshotUrl);
    }
  };

  const handleCloseScreenshotModal = () => {
    closeScreenshotModal(screenshotUrl);
  };

  const handleSearchResult = (data: FlyToCoords) => {
    setSearchCoords(data);
  };

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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    provider.readyPromise?.then(
      () => console.info(`[GIBS] Ready: ${id} @ ${time}`),
      (e: any) => console.error(`[GIBS] Failed: ${id} @ ${time}`, e)
    );
  };

  const applySurface = () => {
    const meta = LAYERS.find(l => l.id === layerId)!;
    applyGibsOverlay(layerId, dateStr, meta.format);
  };

  return (
    <div ref={containerDiv} className="relative w-full h-full" style={{ width, height }}>
      {/* Top Right Controls */}
      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-3">
        <div className="flex items-start gap-3">
          <SearchBox onResult={handleSearchResult} />
          <button
            onClick={takeScreenshot}
            className="rounded-lg bg-black/70 p-2 text-white transition-all hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50"
            title="Take Screenshot"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
        <div className="font-semibold mb-1.5 text-white bg-black/70 p-2 rounded-lg backdrop-blur-sm">
          GIBS Surface (EPSG:3857)
        </div>

        <div className="grid gap-1.5 bg-black/70 p-3 rounded-lg backdrop-blur-sm text-white min-w-64">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Layer</span>
            <select
              value={layerId}
              onChange={(e) => setLayerId(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              {LAYERS.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Time</span>
            <div className="flex gap-1.5">
              <select
                value={dateStr === "default" ? "default" : "custom"}
                onChange={(e) =>
                  setDateStr(e.target.value === "default" ? "default" : new Date().toISOString().slice(0, 10))
                }
                className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="default">default (latest)</option>
                <option value="custom">custom date</option>
              </select>
              <input
                type="date"
                value={dateStr === "default" ? "" : dateStr}
                onChange={(e) => setDateStr(e.target.value || "default")}
                disabled={dateStr === "default"}
                className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </label>

          <button 
            onClick={applySurface} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
          >
            Apply
          </button>

          <div className="text-xs opacity-70 mt-2">
            Tip: tweak <code className="bg-gray-800 px-1 rounded text-xs">BASE_ALPHA</code> and <code className="bg-gray-800 px-1 rounded text-xs">GIBS_ALPHA</code> to change blending.
          </div>
        </div>
      </div>

      {/* Cesium Container */}
      <div
        ref={cesiumContainer}
        className="overflow-hidden w-full h-full"
        style={{ width, height }}
      />

      {/* Screenshot Modal */}
      <ScreenshotModal
        isOpen={showScreenshotModal}
        screenshotUrl={screenshotUrl}
        onClose={handleCloseScreenshotModal}
        onDownload={handleDownloadScreenshot}
      />
    </div>
  );
};

export default Globe;
