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
    <div className="flex flex-col items-center mt-12 mb-8">
      <input
        type="text"
        placeholder="Search for a place..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
        className="w-80 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {result && (
        <div className="mt-6 p-4 bg-black/90 text-white rounded-lg shadow-lg">
          <p className="font-semibold text-lg">{result.name}</p>
          <p className="text-gray-300">Latitude: {result.lat}</p>
          <p className="text-gray-300">Longitude: {result.lon}</p>
        </div>
      )}

      {error && (
        <p className="mt-6 text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default SearchBox;