import React, { useState, useEffect } from 'react';

interface ComparisonModalProps {
  isOpen: boolean;
  beforeImage: string | null;
  afterImage: string | null;
  beforeDate: string;
  afterDate: string;
  onClose: () => void;
  onDownload: () => void;
  onRetakeImages?: (beforeDate: string, afterDate: string) => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  beforeImage,
  afterImage,
  beforeDate,
  afterDate,
  onClose,
  onDownload,
  onRetakeImages,
}) => {
  const [sliderValue, setSliderValue] = useState(50);
  const [newBeforeDate, setNewBeforeDate] = useState<string>(beforeDate);
  const [newAfterDate, setNewAfterDate] = useState<string>(afterDate);
  const [isRetaking, setIsRetaking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Update local state when props change
  useEffect(() => {
    setNewBeforeDate(beforeDate);
    setNewAfterDate(afterDate);
  }, [beforeDate, afterDate]);

  // Auto-hide hint after 4 seconds
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  if (!isOpen) {
    return null;
  }

  // Show loading state if images aren't ready yet
  if (!beforeImage || !afterImage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="relative rounded-lg bg-white p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Creating Comparison</h3>
          <div className="flex items-center justify-center mb-4">
            <svg className="animate-spin h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Capturing satellite imagery for comparison...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  const handleRetakeImages = async () => {
    if (onRetakeImages && !isRetaking) {
      console.log('ComparisonModal: Retaking images with dates:', { 
        before: newBeforeDate, 
        after: newAfterDate 
      });
      setIsRetaking(true);
      try {
        await onRetakeImages(newBeforeDate, newAfterDate);
      } finally {
        setTimeout(() => setIsRetaking(false), 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4">
      <div className="relative max-h-full max-w-5xl w-full rounded-lg bg-white overflow-hidden flex flex-col mx-auto">
        {/* Modal Header - Fixed */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Before & After Comparison</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Close"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">

          {/* Date Controls */}
          {onRetakeImages && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Before Date:</span>
                    <input
                      type="date"
                      value={newBeforeDate}
                      onChange={(e) => setNewBeforeDate(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                </div>
                <div>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">After Date:</span>
                    <input
                      type="date"
                      value={newAfterDate}
                      onChange={(e) => setNewAfterDate(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                </div>
              </div>
              <div className="mt-3 flex justify-center">
                <button
                  onClick={handleRetakeImages}
                  disabled={isRetaking}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetaking ? (
                    <>
                      <svg className="inline-block w-3 h-3 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
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
              {isRetaking && (
                <p className="mt-2 text-center text-xs text-blue-600 font-medium">
                  ⏳ Capturing both images...
                </p>
              )}
            </div>
          )}

          {/* Comparison View */}
          <div className="mb-4">
            <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow-lg bg-gray-100">
              {/* Container for images */}
              <div className="relative aspect-video max-h-[45vh] min-h-[250px] sm:min-h-[300px]">
              {/* After Image (background - right side) */}
              <img
                src={afterImage}
                alt={`After - ${afterDate}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Before Image (clipped by slider - left side) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
              >
                <img
                  src={beforeImage}
                  alt={`Before - ${beforeDate}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Draggable slider line with wider hit area */}
              <div 
                className="absolute top-0 bottom-0 cursor-col-resize z-10"
                style={{ 
                  left: `calc(${sliderValue}% - 15px)`,
                  width: '30px' // Wider hit area for easier dragging
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                  setShowHint(false);
                  
                  // Get the comparison container (the parent element with the images)
                  const comparisonContainer = e.currentTarget.parentElement;
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    if (comparisonContainer) {
                      const rect = comparisonContainer.getBoundingClientRect();
                      const x = moveEvent.clientX - rect.left;
                      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                      setSliderValue(percentage);
                    }
                  };
                  
                  const handleMouseUp = () => {
                    setIsDragging(false);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                  setShowHint(false);
                  
                  // Get the comparison container (the parent element with the images)
                  const comparisonContainer = e.currentTarget.parentElement;
                  
                  const handleTouchMove = (touchEvent: TouchEvent) => {
                    if (comparisonContainer && touchEvent.touches[0]) {
                      const rect = comparisonContainer.getBoundingClientRect();
                      const x = touchEvent.touches[0].clientX - rect.left;
                      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                      setSliderValue(percentage);
                    }
                  };
                  
                  const handleTouchEnd = () => {
                    setIsDragging(false);
                    document.removeEventListener('touchmove', handleTouchMove);
                    document.removeEventListener('touchend', handleTouchEnd);
                  };
                  
                  document.addEventListener('touchmove', handleTouchMove);
                  document.addEventListener('touchend', handleTouchEnd);
                }}
              >
                {/* Visual line */}
                <div 
                  className={`absolute top-0 bottom-0 bg-white shadow-lg transition-all ${isDragging ? 'w-2 shadow-xl' : 'w-1'}`}
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                />
                
                {/* Draggable handle */}
                <div 
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center cursor-col-resize hover:bg-gray-50 hover:scale-105 transition-all ${isDragging ? 'scale-110 bg-blue-50 border-blue-300' : ''}`}
                >
                  <svg className={`w-5 h-5 transition-colors ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              {/* Click anywhere on image to move slider */}
              <div 
                className="absolute inset-0 cursor-col-resize z-5"
                onClick={(e) => {
                  // Only handle click if we're not dragging
                  if (!isDragging) {
                    setShowHint(false);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                    setSliderValue(percentage);
                  }
                }}
              />
            </div>
            
            {/* Date labels */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between text-sm font-medium text-white pointer-events-none">
              <div className="bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
                Before: {beforeDate}
              </div>
              <div className="bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
                After: {afterDate}
              </div>
            </div>
            
            {/* Visual indicators */}
            <div className="absolute top-2 left-2 text-xs font-medium text-white bg-black/70 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
              Before
            </div>
            <div className="absolute top-2 right-2 text-xs font-medium text-white bg-black/70 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
              After
            </div>
            
            {/* Hint overlay */}
            {showHint && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center pointer-events-none animate-pulse">
                <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg text-center">
                  <div className="text-sm font-medium text-gray-800">Click or drag the slider to compare</div>
                  <div className="text-xs text-gray-600 mt-1">👆 Drag the white line or click anywhere</div>
                </div>
              </div>
            )}
          </div>
          
              {/* Instructions */}
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-500">
                  Drag the divider or click anywhere to compare • {Math.round(sliderValue)}% Before Image
                </div>
              </div>
        </div>

          {/* Side by Side Preview */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="relative overflow-hidden rounded border border-gray-200 bg-gray-100">
                <img
                  src={beforeImage}
                  alt={`Before - ${beforeDate}`}
                  className="w-full h-16 object-cover"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 font-medium">Before: {beforeDate}</p>
            </div>
            <div className="text-center">
              <div className="relative overflow-hidden rounded border border-gray-200 bg-gray-100">
                <img
                  src={afterImage}
                  alt={`After - ${afterDate}`}
                  className="w-full h-16 object-cover"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 font-medium">After: {afterDate}</p>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4">
            <button
              onClick={onDownload}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm sm:text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              📥 Download Comparison
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-600 px-4 py-2 text-sm sm:text-base font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      

    </div>
  );
};

export default ComparisonModal;