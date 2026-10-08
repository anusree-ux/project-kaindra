import { useEffect, useRef, useState, useCallback } from "react";
import "./PlacesAutocomplete.css";

const LOCAL_DESTINATIONS = [
  {
    "main": "Goa",
    "secondary": "Goa, India",
    "description": "Goa, India",
    "state": "Goa",
    "lat": 15.2993,
    "lon": 74.124
  },
  {
    "main": "Bengaluru",
    "secondary": "Karnataka, India",
    "description": "Bengaluru, Karnataka, India",
    "state": "Karnataka",
    "lat": 12.9716,
    "lon": 77.5946
  },
  {
    "main": "Sakleshpur",
    "secondary": "Hassan, Karnataka, India",
    "description": "Sakleshpur, Karnataka, India",
    "state": "Karnataka",
    "lat": 12.9442,
    "lon": 75.7854
  },
  {
    "main": "Coorg (Madikeri)",
    "secondary": "Kodagu, Karnataka, India",
    "description": "Coorg, Karnataka, India",
    "state": "Karnataka",
    "lat": 12.4244,
    "lon": 75.7382
  },
  {
    "main": "Chikmagalur",
    "secondary": "Karnataka, India",
    "description": "Chikmagalur, Karnataka, India",
    "state": "Karnataka",
    "lat": 13.3161,
    "lon": 75.772
  },
  {
    "main": "Manali",
    "secondary": "Kullu, Himachal Pradesh, India",
    "description": "Manali, Himachal Pradesh, India",
    "state": "Himachal Pradesh",
    "lat": 32.2432,
    "lon": 77.1892
  },
  {
    "main": "Leh Ladakh",
    "secondary": "Ladakh, India",
    "description": "Leh, Ladakh, India",
    "state": "Ladakh",
    "lat": 34.1526,
    "lon": 77.5771
  },
  {
    "main": "Spiti Valley (Kaza)",
    "secondary": "Himachal Pradesh, India",
    "description": "Spiti Valley, Himachal Pradesh, India",
    "state": "Himachal Pradesh",
    "lat": 32.2276,
    "lon": 78.071
  },
  {
    "main": "Wayanad",
    "secondary": "Kerala, India",
    "description": "Wayanad, Kerala, India",
    "state": "Kerala",
    "lat": 11.6854,
    "lon": 76.132
  },
  {
    "main": "Munnar",
    "secondary": "Idukki, Kerala, India",
    "description": "Munnar, Kerala, India",
    "state": "Kerala",
    "lat": 10.0889,
    "lon": 77.0595
  },
  {
    "main": "Ooty",
    "secondary": "Nilgiris, Tamil Nadu, India",
    "description": "Ooty, Tamil Nadu, India",
    "state": "Tamil Nadu",
    "lat": 11.4102,
    "lon": 76.695
  },
  {
    "main": "Kodaikanal",
    "secondary": "Dindigul, Tamil Nadu, India",
    "description": "Kodaikanal, Tamil Nadu, India",
    "state": "Tamil Nadu",
    "lat": 10.2381,
    "lon": 77.4892
  },
  {
    "main": "Gokarna",
    "secondary": "Uttara Kannada, Karnataka, India",
    "description": "Gokarna, Karnataka, India",
    "state": "Karnataka",
    "lat": 14.5479,
    "lon": 74.3188
  },
  {
    "main": "Hampi",
    "secondary": "Vijayanagara, Karnataka, India",
    "description": "Hampi, Karnataka, India",
    "state": "Karnataka",
    "lat": 15.335,
    "lon": 76.46
  },
  {
    "main": "Mysuru (Mysore)",
    "secondary": "Karnataka, India",
    "description": "Mysuru, Karnataka, India",
    "state": "Karnataka",
    "lat": 12.2958,
    "lon": 76.6394
  },
  {
    "main": "Mangaluru (Mangalore)",
    "secondary": "Karnataka, India",
    "description": "Mangaluru, Karnataka, India",
    "state": "Karnataka",
    "lat": 12.9141,
    "lon": 74.856
  },
  {
    "main": "Dandeli",
    "secondary": "Uttara Kannada, Karnataka, India",
    "description": "Dandeli, Karnataka, India",
    "state": "Karnataka",
    "lat": 15.2361,
    "lon": 74.619
  },
  {
    "main": "Kudremukh",
    "secondary": "Chikkamagaluru, Karnataka, India",
    "description": "Kudremukh, Karnataka, India",
    "state": "Karnataka",
    "lat": 13.2185,
    "lon": 75.257
  },
  {
    "main": "Mumbai",
    "secondary": "Maharashtra, India",
    "description": "Mumbai, Maharashtra, India",
    "state": "Maharashtra",
    "lat": 19.076,
    "lon": 72.8777
  },
  {
    "main": "Pune",
    "secondary": "Maharashtra, India",
    "description": "Pune, Maharashtra, India",
    "state": "Maharashtra",
    "lat": 18.5204,
    "lon": 73.8567
  },
  {
    "main": "Lonavala",
    "secondary": "Pune, Maharashtra, India",
    "description": "Lonavala, Maharashtra, India",
    "state": "Maharashtra",
    "lat": 18.7557,
    "lon": 73.4091
  },
  {
    "main": "Mahabaleshwar",
    "secondary": "Satara, Maharashtra, India",
    "description": "Mahabaleshwar, Maharashtra, India",
    "state": "Maharashtra",
    "lat": 17.9237,
    "lon": 73.6586
  },
  {
    "main": "Hyderabad",
    "secondary": "Telangana, India",
    "description": "Hyderabad, Telangana, India",
    "state": "Telangana",
    "lat": 17.385,
    "lon": 78.4867
  },
  {
    "main": "Chennai",
    "secondary": "Tamil Nadu, India",
    "description": "Chennai, Tamil Nadu, India",
    "state": "Tamil Nadu",
    "lat": 13.0827,
    "lon": 80.2707
  },
  {
    "main": "Pondicherry",
    "secondary": "Puducherry, India",
    "description": "Pondicherry, Puducherry, India",
    "state": "Puducherry",
    "lat": 11.9416,
    "lon": 79.8083
  },
  {
    "main": "Delhi (NCR)",
    "secondary": "Delhi, India",
    "description": "New Delhi, Delhi, India",
    "state": "Delhi",
    "lat": 28.6139,
    "lon": 77.209
  },
  {
    "main": "Jaipur",
    "secondary": "Rajasthan, India",
    "description": "Jaipur, Rajasthan, India",
    "state": "Rajasthan",
    "lat": 26.9124,
    "lon": 75.7873
  },
  {
    "main": "Udaipur",
    "secondary": "Rajasthan, India",
    "description": "Udaipur, Rajasthan, India",
    "state": "Rajasthan",
    "lat": 24.5854,
    "lon": 73.7125
  },
  {
    "main": "Jodhpur",
    "secondary": "Rajasthan, India",
    "description": "Jodhpur, Rajasthan, India",
    "state": "Rajasthan",
    "lat": 26.2389,
    "lon": 73.0243
  },
  {
    "main": "Jaisalmer",
    "secondary": "Rajasthan, India",
    "description": "Jaisalmer, Rajasthan, India",
    "state": "Rajasthan",
    "lat": 26.9157,
    "lon": 70.9083
  },
  {
    "main": "Shimla",
    "secondary": "Himachal Pradesh, India",
    "description": "Shimla, Himachal Pradesh, India",
    "state": "Himachal Pradesh",
    "lat": 31.1048,
    "lon": 77.1734
  },
  {
    "main": "Rishikesh",
    "secondary": "Uttarakhand, India",
    "description": "Rishikesh, Uttarakhand, India",
    "state": "Uttarakhand",
    "lat": 30.0869,
    "lon": 78.2676
  },
  {
    "main": "Nainital",
    "secondary": "Uttarakhand, India",
    "description": "Nainital, Uttarakhand, India",
    "state": "Uttarakhand",
    "lat": 29.3919,
    "lon": 79.4542
  },
  {
    "main": "Kolkata",
    "secondary": "West Bengal, India",
    "description": "Kolkata, West Bengal, India",
    "state": "West Bengal",
    "lat": 22.5726,
    "lon": 88.3639
  },
  {
    "main": "Darjeeling",
    "secondary": "West Bengal, India",
    "description": "Darjeeling, West Bengal, India",
    "state": "West Bengal",
    "lat": 27.041,
    "lon": 88.2663
  },
  {
    "main": "Shillong",
    "secondary": "Meghalaya, India",
    "description": "Shillong, Meghalaya, India",
    "state": "Meghalaya",
    "lat": 25.5788,
    "lon": 91.8933
  },
  {
    "main": "Kochi",
    "secondary": "Kerala, India",
    "description": "Kochi, Kerala, India",
    "state": "Kerala",
    "lat": 9.9312,
    "lon": 76.2673
  },
  {
    "main": "Varkala",
    "secondary": "Thiruvananthapuram, Kerala, India",
    "description": "Varkala, Kerala, India",
    "state": "Kerala",
    "lat": 8.7379,
    "lon": 76.7163
  },
  {
    "main": "Alleppey (Alappuzha)",
    "secondary": "Kerala, India",
    "description": "Alappuzha, Kerala, India",
    "state": "Kerala",
    "lat": 9.4981,
    "lon": 76.3388
  },
  {
    "main": "Kanyakumari",
    "secondary": "Tamil Nadu, India",
    "description": "Kanyakumari, Tamil Nadu, India",
    "state": "Tamil Nadu",
    "lat": 8.0883,
    "lon": 77.5385
  },
  {
    "main": "Rameswaram",
    "secondary": "Tamil Nadu, India",
    "description": "Rameswaram, Tamil Nadu, India",
    "state": "Tamil Nadu",
    "lat": 9.2876,
    "lon": 79.3129
  },
  {
    "main": "Agra",
    "secondary": "Uttar Pradesh, India",
    "description": "Agra, Uttar Pradesh, India",
    "state": "Uttar Pradesh",
    "lat": 27.1767,
    "lon": 78.0081
  },
  {
    "main": "Varanasi",
    "secondary": "Uttar Pradesh, India",
    "description": "Varanasi, Uttar Pradesh, India",
    "state": "Uttar Pradesh",
    "lat": 25.3176,
    "lon": 82.9739
  },
  {
    "main": "Chandigarh",
    "secondary": "Chandigarh, India",
    "description": "Chandigarh, India",
    "state": "Chandigarh",
    "lat": 30.7333,
    "lon": 76.7794
  },
  {
    "main": "Amritsar",
    "secondary": "Punjab, India",
    "description": "Amritsar, Punjab, India",
    "state": "Punjab",
    "lat": 31.634,
    "lon": 74.8723
  },
  {
    "main": "Dharamshala (McLeod Ganj)",
    "secondary": "Himachal Pradesh, India",
    "description": "Dharamshala, Himachal Pradesh, India",
    "state": "Himachal Pradesh",
    "lat": 32.219,
    "lon": 76.3234
  },
  {
    "main": "Kasol (Parvati Valley)",
    "secondary": "Kullu, Himachal Pradesh, India",
    "description": "Kasol, Himachal Pradesh, India",
    "state": "Himachal Pradesh",
    "lat": 32.01,
    "lon": 77.315
  },
  {
    "main": "Tirthan Valley",
    "secondary": "Kullu, Himachal Pradesh, India",
    "description": "Tirthan Valley, Himachal Pradesh, India",
    "state": "Himachal Pradesh",
    "lat": 31.635,
    "lon": 77.408
  },
  {
    "main": "Zanskar Valley (Padum)",
    "secondary": "Ladakh, India",
    "description": "Zanskar Valley, Ladakh, India",
    "state": "Ladakh",
    "lat": 33.468,
    "lon": 76.885
  }
];

export default function PlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search location...",
  icon = "📍",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const abortControllerRef = useRef(null);

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

  const searchLocations = useCallback((query) => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    // 1. INSTANT LOCAL MATCH (0ms response)
    const localMatches = LOCAL_DESTINATIONS.filter((item) => {
      const m = item.main.toLowerCase();
      const s = item.secondary.toLowerCase();
      const d = item.description.toLowerCase();
      return m.includes(clean) || s.includes(clean) || d.includes(clean);
    }).map((item) => ({
      placeId: "loc-" + item.main.toLowerCase().replace(/\s+/g, "-"),
      main: item.main,
      secondary: item.secondary,
      description: item.description,
      coordinates: { lat: item.lat, lon: item.lon },
    }));

    // Immediately show local matches with zero delay
    setSuggestions(localMatches);
    setOpen(true);

    // 2. Fetch live predictions from Photon in background for extra locations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);

    const photonUrl = "https://photon.komoot.io/api/?q=" + encodeURIComponent(clean) + "&limit=6";
    fetch(photonUrl, { signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (signal.aborted || !data?.features) return;
        const onlineItems = [];
        const seenNames = new Set(localMatches.map((m) => m.main.toLowerCase()));

        for (const f of data.features) {
          const props = f.properties || {};
          const name = props.name;
          if (!name || seenNames.has(name.toLowerCase())) continue;
          seenNames.add(name.toLowerCase());

          const parts = [props.district || props.city || props.county, props.state, props.country].filter(Boolean);
          onlineItems.push({
            placeId: "ph-" + (props.osm_id || Math.random()),
            main: name,
            secondary: parts.join(", ") || props.country || "",
            description: [name, ...parts].join(", "),
            coordinates: f.geometry?.coordinates?.length === 2 ? { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] } : null,
          });
        }

        setSuggestions((prev) => {
          const combined = [...prev];
          const existingIds = new Set(combined.map((c) => c.main.toLowerCase()));
          for (const item of onlineItems) {
            if (!existingIds.has(item.main.toLowerCase())) {
              combined.push(item);
            }
          }
          return combined;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length >= 1) {
      // Execute local match instantly without delay
      searchLocations(val);
    } else {
      setOpen(false);
      setSuggestions([]);
    }
  };

  const handleFocus = () => {
    if (value && value.trim().length >= 1) {
      searchLocations(value);
    } else {
      // Show top recommended motorcycling hubs on empty focus
      const topPicks = LOCAL_DESTINATIONS.slice(0, 7).map((item) => ({
        placeId: "loc-" + item.main.toLowerCase().replace(/\s+/g, "-"),
        main: item.main,
        secondary: item.secondary,
        description: item.description,
        coordinates: { lat: item.lat, lon: item.lon },
      }));
      setSuggestions(topPicks);
      setOpen(true);
    }
  };

  const handleSelect = (suggestion) => {
    const selectedText = suggestion.description || suggestion.main;
    onChange(selectedText);
    if (onSelect) {
      onSelect(selectedText, suggestion);
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
        setOpen(false);
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
        <i className="places-input-icon">{loading ? "⚡" : icon}</i>

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
              className={"places-dropdown-item" + (activeIndex === idx ? " active" : "")}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => handleSelect(s)}
            >
              <span className="places-icon">📍</span>
              <div className="places-text">
                <strong>{s.main}</strong>
                {s.secondary && <small>{s.secondary}</small>}
              </div>
            </button>
          ))}

          {suggestions.length === 0 && !loading && value.trim().length >= 1 && (
            <div className="places-dropdown-empty">
              Press Enter to search custom location "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
