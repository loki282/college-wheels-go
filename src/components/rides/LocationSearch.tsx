
import React, { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface LocationSearchProps {
  placeholder?: string;
  onLocationSelect: (location: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }) => void;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const LocationSearch = ({
  placeholder = "Search location...",
  onLocationSelect,
  value = '',
  onChange,
  className = "",
}: LocationSearchProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current) return;

    try {
      // Initialize the Geocoder
      geocoderRef.current = new window.google.maps.Geocoder();

      // Initialize the Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "in" },
          fields: ["address_components", "geometry", "name", "formatted_address"],
          types: ["geocode", "establishment"]
        }
      );

      // Add place_changed event listener
      const listener = window.google.maps.event.addListener(
        autocompleteRef.current,
        "place_changed",
        () => {
          const place = autocompleteRef.current?.getPlace();

          if (!place || !place.geometry || !place.geometry.location) {
            console.error("No place details available");
            return;
          }

          const name = place.formatted_address || place.name || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setInputValue(name);
          onLocationSelect({
            name,
            coordinates: { lat, lng },
          });
        }
      );

      // Cleanup function
      return () => {
        if (listener) window.google.maps.event.removeListener(listener);
      };
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error);
      toast.error("Failed to initialize location search");
    }
  }, [onLocationSelect]);

  // Sync the input value with the prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (onChange) {
      onChange(newValue);
    }
  };

  // Manually search for a location if the user didn't select from dropdown
  const handleInputBlur = () => {
    if (inputValue && inputValue !== value && geocoderRef.current) {
      setIsLoading(true);

      geocoderRef.current.geocode({ address: inputValue }, (results, status) => {
        setIsLoading(false);

        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const place = results[0];
          const name = place.formatted_address || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setInputValue(name);
          onLocationSelect({
            name,
            coordinates: { lat, lng },
          });
        } else if (status !== window.google.maps.GeocoderStatus.ZERO_RESULTS) {
          console.error("Geocoder error:", status);
        }
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmicviolet focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
      </div>

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cosmicviolet"></div>
        </div>
      )}

      {/* Add Google Places Autocomplete styles globally */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .pac-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          margin-top: 4px;
          z-index: 9999;
        }
        .pac-item {
          padding: 8px 16px;
          cursor: pointer;
          color: #4b5563;
        }
        .pac-item:hover {
          background-color: #f3f4f6;
        }
        .pac-item-selected {
          background-color: #edf2f7;
        }
        .pac-icon {
          display: none;
        }
        .pac-item-query {
          font-size: 14px;
          color: #1f2937;
        }
        .pac-matched {
          font-weight: bold;
        }
      `}} />
    </div>
  );
};
