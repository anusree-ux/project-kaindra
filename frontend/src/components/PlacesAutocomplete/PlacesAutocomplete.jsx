import { useEffect, useRef, useState, useCallback } from "react";
import "./PlacesAutocomplete.css";

function expandQuery(rawQuery) {
  const q = rawQuery.trim();
  return q
    .replace(/\bfor\b/gi, "Fort")
    .replace(/\bforts?\b/gi, "Fort")
    .replace(/\btem\b/gi, "Temple")
    .replace(/\bcav\b/gi, "Caves")
    .replace(/\bwat\b/gi, "Waterfalls")
    .replace(/\bfal\b/gi, "Falls")
    .replace(/\bgha\b/gi, "Ghat")
    .replace(/\bvie\b/gi, "Viewpoint")
    .replace(/\bpal\b/gi, "Palace");
}

/**
 * PlacesAutocomplete — High-Speed Autocomplete with Race Condition Protection & Cache
 */
export default function PlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "",
  icon = "●",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch live predictions with AbortController and caching
  const fetchPlaces = useCallback(async (query) => {
    const clean = query.trim();
    if (!clean) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const expandedQuery = expandQuery(clean);

    // 1. Check cache for instant (0ms) response
    if (cacheRef.current.has(expandedQuery.toLowerCase())) {
      setSuggestions(cacheRef.current.get(expandedQuery.toLowerCase()));
      setLoading(false);
      return;
    }

    // Abort previous inflight request to prevent flickering/race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);

    try {
      // Primary: High-speed Photon Geocoder API (designed for instant typeahead)
      const photonPromise = fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(expandedQuery)}&limit=7`,
        { signal }
      ).then((r) => (r.ok ? r.json() : { features: [] }));

      // Fallback: Nominatim OpenStreetMap
      const nomPromise = fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          expandedQuery
        )}&format=json&addressdetails=1&limit=5&countrycodes=in`,
        { signal }
      ).then((r) => (r.ok ? r.json() : []));

      const [photonRes, nomRes] = await Promise.allSettled([
        photonPromise,
        nomPromise,
      ]);

      if (signal.aborted) return;

      const items = [];
      const seen = new Set();

      // Process Photon results
      if (
        photonRes.status === "fulfilled" &&
        photonRes.value?.features &&
        Array.isArray(photonRes.value.features)
      ) {
        for (const f of photonRes.value.features) {
          const props = f.properties || {};
          const name = props.name;
          if (!name || seen.has(name.toLowerCase())) continue;

          seen.add(name.toLowerCase());
          const parts = [
            props.district || props.city || props.county,
            props.state,
            props.country,
          ].filter(Boolean);

          items.push({
            placeId: `ph-${props.osm_id || Math.random()}`,
            main: name,
            secondary: parts.join(", ") || props.country || "",
            description: [name, ...parts].join(", "),
          });
        }
      }

      // Process Nominatim results
      if (nomRes.status === "fulfilled" && Array.isArray(nomRes.value)) {
        for (const item of nomRes.value) {
          const addr = item.address || {};
          const main =
            item.name ||
            addr.tourism ||
            addr.historic ||
            addr.natural ||
            addr.attraction ||
            addr.city ||
            addr.town ||
            item.display_name.split(",")[0];

          if (seen.has(main.toLowerCase())) continue;
          seen.add(main.toLowerCase());

          const parts = [
            addr.county || addr.state_district,
            addr.state,
            addr.country,
          ].filter(Boolean);

          items.push({
            placeId: `nom-${item.place_id}`,
            main: main.trim(),
            secondary: parts.join(", ") || item.display_name,
            description: item.display_name,
          });
        }
      }

      // Store in cache
      cacheRef.current.set(expandedQuery.toLowerCase(), items);
      setSuggestions(items);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Search error:", err);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length >= 1) {
      setOpen(true);
      debounceRef.current = setTimeout(() => {
        fetchPlaces(val);
      }, 100);
    } else {
      setOpen(false);
      setSuggestions([]);
    }
  };

  const handleFocus = () => {
    if (value && value.trim().length >= 1) {
      setOpen(true);
      fetchPlaces(value);
    }
  };

  const handleSelect = (suggestion) => {
    const selectedText = suggestion.description || suggestion.main;
    onChange(selectedText);
    if (onSelect) {
      onSelect(selectedText);
    }
    setOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      } else if (onSelect && value.trim()) {
        e.preventDefault();
        onSelect(value.trim());
      }
      return;
    }

    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="places-autocomplete-wrapper" ref={wrapperRef}>
      <div className="input-with-icon">
        <i>{loading ? "⏳" : icon}</i>

        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="places-dropdown">
          {suggestions.map((s, idx) => (
            <button
              type="button"
              key={s.placeId}
              className={`places-dropdown-item ${
                activeIndex === idx ? "active" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => handleSelect(s)}
            >
              <span className="places-icon">◉</span>
              <div className="places-text">
                <strong>{s.main}</strong>
                {s.secondary && <small>{s.secondary}</small>}
              </div>
            </button>
          ))}

          {suggestions.length === 0 && !loading && value.trim().length >= 1 && (
            <div className="places-dropdown-empty">
              No matching locations found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
