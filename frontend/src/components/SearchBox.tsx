// src/components/SearchBox.jsx
import { useState } from "react";

interface SearchBoxProps {
  onResult?: (data: { lat: number; lon: number; name: string }) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onResult }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      try {
        setError("");
        setResult(null);

        const response = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok) {
          setResult(data);
          if (onResult) onResult(data); // send coordinates to Globe
        } else {
          setError(data.error || "Location not found");
        }
      } catch (err) {
        setError("Could not connect to the server: " + err);
      }
    }
  };

  return (
    <div className="flex flex-col items-end">
      <div className="relative">
        <input
          type="text"
          placeholder="Search for a place..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="w-80 pl-10 pr-4 py-2 text-sm border border-white/20 rounded-lg bg-black/30 backdrop-blur-md placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 focus:bg-black/50 shadow-lg transition-all h-10"
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

      {result && (
        <div className="mt-4 p-4 bg-black/70 text-white rounded-lg shadow-lg backdrop-blur-md">
          <p className="font-semibold text-lg">{result.name}</p>
          <p className="text-gray-300">Latitude: {result.lat}</p>
          <p className="text-gray-300">Longitude: {result.lon}</p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-red-500 font-medium bg-white/60 px-3 py-2 rounded-lg shadow-lg backdrop-blur-md">{error}</p>
      )}
    </div>
  );
};

export default SearchBox;