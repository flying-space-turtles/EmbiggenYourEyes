import React, { useState } from 'react';

interface ScreenshotModalProps {
  isOpen: boolean;
  screenshotUrl: string | null;
  onClose: () => void;
  onDownload: () => void;
  onRetakeWithDate?: (date: string) => void; // New prop for retaking with specific date
}

const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  screenshotUrl,
  onClose,
  onDownload,
  onRetakeWithDate,
}) => {
  const [screenshotDate, setScreenshotDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [isRetaking, setIsRetaking] = useState(false);

  if (!isOpen || !screenshotUrl) {
    return null;
  }

  const handleRetakeWithDate = async () => {
    if (onRetakeWithDate && !isRetaking) {
      setIsRetaking(true);
      try {
        await onRetakeWithDate(screenshotDate);
      } finally {
        // Reset loading state after a delay to ensure screenshot completes
        setTimeout(() => setIsRetaking(false), 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative max-h-[90vh] max-w-[90vw] rounded-lg bg-white p-4">
        {/* Modal Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Globe Screenshot</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Selection for Screenshot */}
        {onRetakeWithDate && (
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <span className="text-sm font-medium text-gray-700">Screenshot Date:</span>
                <input
                  type="date"
                  value={screenshotDate}
                  onChange={(e) => setScreenshotDate(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              </label>
              <button
                onClick={handleRetakeWithDate}
                disabled={isRetaking}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetaking ? (
                  <>
                    <svg className="inline-block w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>📸 Retake</>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Change the date and retake the screenshot without affecting the main view.
              {isRetaking && <span className="block text-blue-600 font-medium mt-1">⏳ Loading satellite imagery for selected date...</span>}
            </p>
          </div>
        )}

        {/* Screenshot Image */}
        <div className="mb-4 flex justify-center">
          <img
            src={screenshotUrl}
            alt="Globe Screenshot"
            className="max-h-[70vh] max-w-full rounded-lg border border-gray-200 shadow-lg"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onDownload}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            📥 Download
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotModal;