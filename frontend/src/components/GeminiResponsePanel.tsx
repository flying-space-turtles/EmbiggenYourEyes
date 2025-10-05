import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface GeminiResponsePanelProps {
  response: string;
  isLoading: boolean;
  onClose: () => void;
}

const GeminiResponsePanel: React.FC<GeminiResponsePanelProps> = ({ response, isLoading, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className="mt-2 p-3 bg-black/70 text-white rounded-lg shadow-lg backdrop-blur-sm border border-gray-600/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-300 flex items-center">
            <span className="mr-2">🤖</span>
            Gemini AI Response
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              title="Show response"
            >
              Show
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Panel */}
      <div className={`mt-2 p-3 bg-black/70 text-white rounded-lg shadow-lg backdrop-blur-sm border border-gray-600/30 transition-all duration-300 h-full flex flex-col ${
        isExpanded ? 'fixed inset-4 z-50 overflow-auto' : ''
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-purple-300 flex items-center">
            <span className="mr-2">🤖</span>
            Gemini AI Response
          </span>
          <div className="flex gap-2">
            {!isExpanded && (
              <button
                onClick={() => setIsMinimized(true)}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                title="Minimize"
              >
                ─
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "↙" : "↗"}
            </button>
            {response && (
              <button
                onClick={() => navigator.clipboard.writeText(response)}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                title="Copy to clipboard"
              >
                📋
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className={`${isExpanded ? 'max-h-none' : 'flex-1'} overflow-y-auto`}>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              <span className="ml-3 text-sm text-gray-300">Asking Gemini...</span>
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold text-purple-300 mb-2 mt-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-medium text-blue-300 mb-1 mt-2">{children}</h3>,
                  p: ({ children }) => <p className="text-sm text-gray-200 mb-2 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 ml-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 ml-2">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-gray-200">{children}</li>,
                  code: ({ children }) => <code className="bg-gray-800 px-1 rounded text-xs text-purple-300">{children}</code>,
                  pre: ({ children }) => <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-purple-200">{children}</em>,
                }}
              >
                {response}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isLoading && response && (
          <p className="text-xs text-gray-400 mt-2 pt-2 px-2 py-1 border-t border-gray-600/30 bg-black/30 rounded">
            Historical information generated by Gemini AI
          </p>
        )}
      </div>

      {/* Backdrop for expanded mode */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};

export default GeminiResponsePanel;