import React, { useState, useEffect, useRef } from "react";

interface SearchBoxProps {
  onResult: (data: { lat: number; lon: number; name: string; boundingbox?: [number, number, number, number] }) => void;
}

export default function SearchBox({ onResult }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (value: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/search/?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (res.ok && data.results) {
        setSuggestions(data.results);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch {
      setError("Could not connect to server");
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (!value) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimeout.current = window.setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelect = (item: any) => {
    setQuery(item.name);
    setIsOpen(false);
    onResult(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      handleSelect(suggestions[0]);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        placeholder="Search for a place..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              className="p-2 hover:bg-blue-500 hover:text-white cursor-pointer"
              onClick={() => handleSelect(item)}
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-500 mt-1">{error}</p>}
    </div>
  );
}
