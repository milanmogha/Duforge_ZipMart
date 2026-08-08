import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  MarkerF,
  useLoadScript,
} from "@react-google-maps/api";
import {
  FiCrosshair,
  FiMapPin,
  FiSearch,
  FiLoader,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { useLocationCtx } from "../context/LocationContext";

const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";

const mapContainerStyle = { width: "100%", height: "280px", borderRadius: "1rem" };

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (loc: { latitude: number; longitude: number; address: string }) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ open, onClose, onConfirm }) => {
  const { location, setLocation } = useLocationCtx();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    location ? { lat: location.latitude, lng: location.longitude } : null
  );
  const [address, setAddress] = useState(location?.address || "");
  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCoords(location ? { lat: location.latitude, lng: location.longitude } : null);
      setAddress(location?.address || "");
      setManualAddress("");
      setError("");
    }
  }, [open, location]);

  if (!open) return null;

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      return data.results?.[0]?.formatted_address || "Address not found";
    } catch {
      return "Address not found";
    }
  };

  const getCoordsFromAddress = async (addr: string) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          addr
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.results?.length) {
        const loc = data.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleDetectLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const c = { lat: latitude, lng: longitude };
        setCoords(c);
        const addr = await getAddressFromCoords(latitude, longitude);
        setAddress(addr);
        setManualAddress(addr);
        setDetecting(false);
      },
      () => {
        setDetecting(false);
        setError("Could not fetch your location. Please enter your address manually.");
      },
      { timeout: 8000 }
    );
  };

  const handleSearchAddress = async () => {
    if (!manualAddress.trim()) {
      setError("Please enter an address to search.");
      return;
    }
    setSearching(true);
    setError("");
    const c = await getCoordsFromAddress(manualAddress);
    if (c) {
      setCoords(c);
      const addr = await getAddressFromCoords(c.lat, c.lng);
      setAddress(addr);
      setSearching(false);
    } else {
      setSearching(false);
      setError("Unable to find that address. Please try again.");
    }
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const c = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setCoords(c);
    const addr = await getAddressFromCoords(c.lat, c.lng);
    setAddress(addr);
    setManualAddress(addr);
  };

  const handleConfirm = () => {
    if (!coords) {
      setError("Please select or enter a location first.");
      return;
    }
    const finalAddress = address || manualAddress || "Selected location";
    const loc = { latitude: coords.lat, longitude: coords.lng, address: finalAddress };
    setLocation(loc);
    onConfirm?.(loc);
    onClose();
  };

  const mapCenter = coords || { lat: 28.6139, lng: 77.209 };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Choose delivery location</h2>
            <p className="text-sm text-gray-500">We deliver to your doorstep in minutes</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Current saved location */}
          {location && (
            <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <FiCheck />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Saved location
                </p>
                <p className="truncate text-sm font-medium text-gray-800">{location.address}</p>
              </div>
            </div>
          )}

          {/* Detect location */}
          <button
            onClick={handleDetectLocation}
            disabled={detecting}
            className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              {detecting ? <FiLoader className="animate-spin" /> : <FiCrosshair />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Detect my location</p>
              <p className="text-xs text-gray-500">Use GPS to find your current location</p>
            </div>
          </button>

          {/* Manual address entry */}
          <div className="rounded-2xl border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-bold text-gray-900">
              Or enter your address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiMapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchAddress()}
                  placeholder="Type your area, street, or landmark…"
                  className="input-field pl-9"
                />
              </div>
              <button
                onClick={handleSearchAddress}
                disabled={searching}
                className="btn-primary shrink-0"
              >
                {searching ? <FiLoader className="animate-spin" /> : <FiSearch />}
                Search
              </button>
            </div>

            {isLoaded && (
              <div className="mt-3">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={14}
                  onClick={handleMapClick}
                >
                  {coords && (
                    <MarkerF
                      position={coords}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      }}
                    />
                  )}
                </GoogleMap>
                <p className="mt-2 text-center text-xs text-gray-500">
                  Click the map to refine your exact pin
                </p>
              </div>
            )}

            {address && coords && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2">
                <FiMapPin className="mt-0.5 shrink-0 text-brand-600" />
                <p className="text-sm text-gray-700">{address}</p>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleConfirm}
            disabled={!coords}
            className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <FiCheck />
            {coords ? "Confirm Delivery Location" : "Select a Location First"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
