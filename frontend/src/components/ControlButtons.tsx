import React from 'react';

interface ControlButtonsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onTakeScreenshot: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onTakeScreenshot,
}) => {
  return (
    <div className="absolute left-2 top-2 z-10 flex gap-2">
      {/* Fullscreen Button */}
      <button
        onClick={onToggleFullscreen}
        className="rounded-lg bg-black/70 p-2 text-white transition-all hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50"
        title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F)'}
      >
        {isFullscreen ? (
          // Exit fullscreen icon
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Enter fullscreen icon
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Screenshot Button */}
      <button
        onClick={onTakeScreenshot}
        className="rounded-lg bg-black/70 p-2 text-white transition-all hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-white/50"
        title="Take Screenshot"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
};

export default ControlButtons;