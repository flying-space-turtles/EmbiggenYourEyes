// src/components/SearchBox.jsx
import React, { useState } from "react";



interface SearchBoxProps {
  onResult?: (data: { lat: number; lon: number; name: string }) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onResult }) => {
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState("");

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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "50px" }}>
      <input
        type="text"
        placeholder="Search for a place..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleSearch}
        style={{ padding: "8px", width: "300px", fontSize: "16px", borderRadius: "5px", border: "1px solid #ccc" }}
      />

      {result && (
        <div style={{ marginTop: "20px", padding: "10px", background: "#000000ff", borderRadius: "8px" }}>
          <p><strong>{result.name}</strong></p>
          <p>Latitude: {result.lat}</p>
          <p>Longitude: {result.lon}</p>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}
    </div>
  );
};

export default SearchBox;