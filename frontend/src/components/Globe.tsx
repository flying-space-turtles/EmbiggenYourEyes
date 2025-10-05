import React, { useEffect, useRef, useState } from "react";
import { Cartesian3, Credit, ImageryLayer, Ion, UrlTemplateImageryProvider, Viewer, WebMapTileServiceImageryProvider, WebMercatorTilingScheme } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import ScreenshotModal from "./ScreenshotModal";
import ComparisonModal from "./ComparisonModal";
import SearchBox from "./SearchBox";
import GeminiResponsePanel from "./GeminiResponsePanel";
import { useScreenshot } from "../hooks/useScreenshot";
import { useComparisonScreenshot } from "../hooks/useComparisonScreenshot";
import { useFlyToCoords } from "../hooks/useFlyToCoords";
import { type FlyToCoords } from "../types/FlyToCoords";
import { addSampleLocations } from "../utils/cesiumHelpers";
import { useViewportCenter } from "../hooks/useViewportCenter";

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
const BASE_ALPHA = 0.9; // default base map underneath
const GIBS_ALPHA = 0.8;  // GIBS overlay on top

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
  const [region, setRegion] = useState<string | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);


  // keep layer refs
  const baseLayerRef = useRef<ImageryLayer | null>(null);
  const gibsLayerRef = useRef<ImageryLayer | null>(null);

  // UI state
  const [layerId, setLayerId] = useState<string>(LAYERS[0].id);
  const [dateStr, setDateStr] = useState<string>("default"); // "default" or "YYYY-MM-DD"

  // useCesiumViewer({ containerRef: cesiumContainer, viewer });
  useFlyToCoords({ viewer, flyToCoords: flyToCoords || searchCoords });


  // Get current layer format for screenshots
  const currentFormat = LAYERS.find(l => l.id === layerId)?.format || "jpg";

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

    // Handle tiles that fail to load or return placeholder images
    imagery.show = true; // Start visible, hide on errors

    // Smart error tracking with automatic reset
    let errorCount = 0;
    let successCount = 0;
    let lastResetTime = Date.now();
    let tileRequestCount = 0;

    // Reset error state based on time and success rate
    const checkAndResetErrorState = () => {
      const now = Date.now();
      const timeSinceReset = now - lastResetTime;

      // Reset every 10 seconds OR if success rate improves significantly
      const successRate = tileRequestCount > 0 ? successCount / tileRequestCount : 0;

      if (timeSinceReset > 10000 || (successRate > 0.5 && errorCount > 0)) {
        if (errorCount > 0) {
          console.log(`Resetting GIBS error state: ${errorCount} errors, ${successCount} successes in ${timeSinceReset}ms`);
          errorCount = 0;
          successCount = 0;
          tileRequestCount = 0;
          imagery.alpha = GIBS_ALPHA; // Reset to full opacity
        }
        lastResetTime = now;
      }
    };    const originalRequestImage = provider.requestImage?.bind(provider);
    if (originalRequestImage) {
      provider.requestImage = function(x: number, y: number, level: number, request?: any) {
        const promise = originalRequestImage(x, y, level, request);
        if (promise) {
          tileRequestCount++;

          promise.then(() => {
            // Success!
            successCount++;
            checkAndResetErrorState();
          }).catch(() => {
            // Error - no data available
            errorCount++;

            // Check if we should reset based on time/success rate
            checkAndResetErrorState();

            // If still many errors after reset check, reduce visibility
            if (errorCount > 8 && imagery.alpha > 0.2) {
              imagery.alpha = Math.max(0.2, imagery.alpha * 0.85);
              console.log(`GIBS: Reducing opacity to ${imagery.alpha.toFixed(2)} due to ${errorCount} tile errors`);
            }
          });
        }
        return promise;
      };
    }

    gibsLayerRef.current = imagery;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    provider.readyPromise?.then(
      () => {
        console.info(`[GIBS] Ready: ${id} @ ${time}`);
        if (imagery) imagery.show = true;
      },
      (e: any) => {
        console.error(`[GIBS] Failed: ${id} @ ${time}`, e);
        // Hide layer completely when GIBS fails so base layer shows
        if (imagery) imagery.show = false;
      }
    );
  };

  const { takeScreenshot, downloadScreenshot, closeScreenshotModal, waitForImageryToLoad } = useScreenshot({
      viewer,
      setScreenshotUrl,
      setShowScreenshotModal,
      applyGibsOverlay,
      currentLayerId: layerId,
      currentFormat,
      currentDateStr: dateStr,
    });

  // Comparison screenshot functionality
  const {
    comparisonImages,
    showComparisonModal,
    takeComparisonScreenshots,
    downloadComparisonImages,
    closeComparisonModal,
  } = useComparisonScreenshot({
    viewer,
    applyGibsOverlay,
    currentLayerId: layerId,
    currentFormat,
    currentDateStr: dateStr,
    waitForImageryToLoad,
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

  const handleTakeScreenshot = () => {
    takeScreenshot();
  };

  const handleRetakeWithDate = async (date: string) => {
    await takeScreenshot(date);
  };

  const handleComparisonScreenshot = () => {
    // Default to current date and a date one year ago
    const currentDate = new Date().toISOString().slice(0, 10);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const beforeDate = oneYearAgo.toISOString().slice(0, 10);

    takeComparisonScreenshots(beforeDate, currentDate);
  };

  const handleRetakeComparisonImages = async (beforeDate: string, afterDate: string) => {
    await takeComparisonScreenshots(beforeDate, afterDate);
  };

  const handleDownloadComparison = () => {
    downloadComparisonImages();
  };

  const handleCloseComparisonModal = () => {
    closeComparisonModal();
  };

  useEffect(() => {
    if (cesiumContainer.current && !viewer.current) {
      const token = (import.meta as { env?: { VITE_CESIUM_ION_ACCESS_TOKEN?: string } }).env?.VITE_CESIUM_ION_ACCESS_TOKEN;
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


  const applySurface = () => {
    const meta = LAYERS.find(l => l.id === layerId)!;
    applyGibsOverlay(layerId, dateStr, meta.format);
  };

  const viewportBounds = useViewportCenter(viewer);

  // Helper function to calculate center from viewport bounds
  const getViewportCenter = (bounds: NonNullable<typeof viewportBounds>) => {
    return {
      lat: (bounds.topLeft.lat + bounds.topRight.lat + bounds.bottomLeft.lat + bounds.bottomRight.lat) / 4,
      lon: (bounds.topLeft.lon + bounds.topRight.lon + bounds.bottomLeft.lon + bounds.bottomRight.lon) / 4,
    };
  };

  const askGeminiAboutRegion = async () => {
    if (!viewportBounds) {
      setGeminiResponse("Viewport coordinates are not available.");
      return;
    }

    setLoadingGemini(true);

    // Build URL with all 4 corner coordinates (same as other functions)
    const params = new URLSearchParams({
      top_left_lat: viewportBounds.topLeft.lat.toString(),
      top_left_lon: viewportBounds.topLeft.lon.toString(),
      top_right_lat: viewportBounds.topRight.lat.toString(),
      top_right_lon: viewportBounds.topRight.lon.toString(),
      bottom_left_lat: viewportBounds.bottomLeft.lat.toString(),
      bottom_left_lon: viewportBounds.bottomLeft.lon.toString(),
      bottom_right_lat: viewportBounds.bottomRight.lat.toString(),
      bottom_right_lon: viewportBounds.bottomRight.lon.toString(),
    });

    try {
      const response = await fetch(`/api/ask_gemini/?${params}`);
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setGeminiResponse("Failed to parse backend response: " + text);
        return;
      }

      if (data.historical_info) {
        setGeminiResponse(data.historical_info);
        console.log("Gemini response received from:", data.model_used);
        console.log("Location context:", data.location_context);
      } else if (data.error) {
        setGeminiResponse("Error: " + data.error);
      } else {
        setGeminiResponse("No response received from Gemini");
      }
    } catch (err) {
      setGeminiResponse("Failed to get response from Gemini: " + err);
    } finally {
      setLoadingGemini(false);
    }
  };

  // Month navigation functions
  const goBackOneMonth = () => {
    if (dateStr === "default") {
      // If default, start from today and go back one month
      const today = new Date();
      const oneMonthBack = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      setDateStr(oneMonthBack.toISOString().slice(0, 10));
    } else {
      // Go back one month from current date
      const currentDate = new Date(dateStr);
      const oneMonthBack = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
      setDateStr(oneMonthBack.toISOString().slice(0, 10));
    }
  };

  const goForwardOneMonth = () => {
    if (dateStr === "default") return; // Can't go forward from "default" (latest)

    const currentDate = new Date(dateStr);
    const oneMonthForward = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
    const today = new Date();

    // Don't allow going beyond today
    if (oneMonthForward <= today) {
      setDateStr(oneMonthForward.toISOString().slice(0, 10));
    }
  };

  // Check if forward button should be disabled
  const isForwardDisabled = () => {
    if (dateStr === "default") return true;

    const currentDate = new Date(dateStr);
    const oneMonthForward = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
    const today = new Date();

    return oneMonthForward > today;
  };


  return (
    <div ref={containerDiv} className="relative w-full h-full" style={{ width, height }}>
      {/* Top Right Controls */}
      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-3">
        <div className="flex items-start gap-3">
          <SearchBox onResult={handleSearchResult} />
          <button
            onClick={handleTakeScreenshot}
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
          <button
            onClick={handleComparisonScreenshot}
            className="rounded-lg bg-purple-600/90 p-2 text-white transition-all hover:bg-purple-700/90 focus:outline-none focus:ring-2 focus:ring-white/50"
            title="Take Before/After Comparison"
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
                d="M4 8V4a1 1 0 011-1h4M20 8V4a1 1 0 00-1-1h-4M4 16v4a1 1 0 001 1h4M20 16v4a1 1 0 01-1 1h-4M9 12h6M12 9l3 3-3 3"
              />
            </svg>
          </button>
        </div>
        <div className="font-semibold mb-1.5 text-white bg-black/70 p-2 rounded-lg backdrop-blur-sm">
          GIBS Surface (EPSG:3857)
        </div>

      <div className="grid gap-1.5 bg-black/70 p-3 rounded-lg backdrop-blur-sm text-white min-w-64">
        {/* Layer & Time Controls */}
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

            {/* Month Navigation Buttons */}
            {dateStr !== "default" && (
              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={goBackOneMonth}
                  className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm font-medium"
                  title="Go back 1 month"
                >
                  ← 1 Month
                </button>
                <button
                  onClick={goForwardOneMonth}
                  disabled={isForwardDisabled()}
                  className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
                  title="Go forward 1 month"
                >
                  1 Month →
                </button>
              </div>
            )}

          </label>

          <button
            onClick={applySurface}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
          >
            Apply
          </button>

        {viewportBounds && (
          <div className="text-xs text-white mt-2 bg-black/60 px-2 py-1 rounded">
            Viewport Center: {getViewportCenter(viewportBounds).lat.toFixed(3)}°, {getViewportCenter(viewportBounds).lon.toFixed(3)}°
          </div>
        )}
      </div>

      {/* Region/AI Panel under the other controls */}
      <div className="w-80 max-w-xs mt-2 p-3 bg-black/70 text-white rounded-lg shadow-lg backdrop-blur-sm border border-gray-600/30">
        <button
          onClick={askGeminiAboutRegion}
          disabled={loadingGemini}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-sm disabled:opacity-50"
        >
          {loadingGemini ? "Asking Gemini..." : "🤖 Ask Gemini About This Region"}
        </button>

        {region && (
          <div className="mt-3 p-2 bg-black/30 rounded text-sm">
            <span className="font-medium text-gray-300">Current region:</span>
            <p className="mt-1 text-gray-100">{region}</p>
          </div>
        )}
      </div>

      {/* Gemini Response Panel */}
      {(geminiResponse || loadingGemini) && (
        <div className="w-80 max-w-xs">
          <GeminiResponsePanel
            response={geminiResponse || ''}
            isLoading={loadingGemini}
            onClose={() => setGeminiResponse(null)}
          />
        </div>
      )}
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
      onRetakeWithDate={handleRetakeWithDate}
    />

    {/* Comparison Modal */}
    <ComparisonModal
      isOpen={showComparisonModal}
      beforeImage={comparisonImages?.beforeImage || null}
      afterImage={comparisonImages?.afterImage || null}
      beforeDate={comparisonImages?.beforeDate || ''}
      afterDate={comparisonImages?.afterDate || ''}
      onClose={handleCloseComparisonModal}
      onDownload={handleDownloadComparison}
      onRetakeImages={handleRetakeComparisonImages}
    />
    </div>
  );
};

export default Globe;



