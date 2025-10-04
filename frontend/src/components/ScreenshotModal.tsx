import React from 'react';

interface ScreenshotModalProps {
  isOpen: boolean;
  screenshotUrl: string | null;
  onClose: () => void;
  onDownload: () => void;
}

const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  screenshotUrl,
  onClose,
  onDownload,
}) => {
  if (!isOpen || !screenshotUrl) {
    return null;
  }

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