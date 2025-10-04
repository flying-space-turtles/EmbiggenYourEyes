import { useState, useEffect } from "react";
import { type FlyToCoords } from "../types/FlyToCoords";

interface SearchResult extends FlyToCoords {
  name: string;
}

interface SearchBoxProps {
  onResult?: (data: FlyToCoords) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onResult }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState<number | null>(null);

  // Debounced fetch as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (timer) clearTimeout(timer);

    const newTimer = setTimeout(async () => {
      try {
        setError("");
        const response = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok && data.results) {
          setResults(data.results);
        } else {
          setResults([]);
          setError(data.error || "No results found");
        }
      } catch (err) {
        setError("Could not connect to the server: " + err);
        setResults([]);
      }
    }, 300);

    setTimer(newTimer);
  }, [query]);

  const handleSelect = (selected: SearchResult) => {
    if (selected && onResult) {
      onResult(selected);
      setResults([]); // hide dropdown
      setQuery(selected.name);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      try {
        const response = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok && data.results && data.results.length > 0) {
          handleSelect(data.results[0]); // select the first result directly
        } else {
          setError("No matching location found.");
        }
      } catch (err) {
        setError("Could not connect to the server: " + err);
      }
    }
  };

  return (
    <div className="flex flex-col items-end relative w-80">
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search for a place..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-2 text-sm border border-white/20 rounded-lg bg-black/30 backdrop-blur-md placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-black/50 shadow-lg transition-all h-10"
        />
        <svg 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>

      {/* Dropdown */}
      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-black/80 text-white rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map((res, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2 hover:bg-blue-600/50 transition-colors"
              onClick={() => handleSelect(res)}
            >
              {res.name}
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-4 text-red-500 font-medium bg-white/60 px-3 py-2 rounded-lg shadow-lg backdrop-blur-md">{error}</p>
      )}
    </div>
  );
}

export default SearchBox;
