import React, { useState, useEffect, useCallback } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
} from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaCrosshairs,
  FaSave,
  FaTrashAlt,
  FaInfoCircle,
  FaSpinner,
} from "react-icons/fa";
import api from "../api";

// Default styles for the map container; height will be adjusted dynamically.
const getMapContainerStyle = (windowWidth: number) => ({
  width: "100%",
  height: windowWidth < 770 ? "300px" : "400px",
});

const Account: React.FC = () => {
  const [location, setLocation] = useState({
    latitude: "",
    longitude: "",
  });
  const [serviceRadius, setServiceRadius] = useState(5); // Default radius
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [saving, setSaving] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    // Replace with your own API key. Make sure it’s restricted for security.
    googleMapsApiKey: "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA",
  });

  // Default map center if no stored location.
  const defaultCenter = {
    lat: 28.6139, // New Delhi
    lng: 77.209,
  };

  const showMessage = (text: string, type: "success" | "error" | "info" = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  // Update windowWidth state on resize to trigger re-renders for responsive design
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load shopkeeper’s current location and service radius
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const shopkeeperId = localStorage.getItem("shopkeeperId");
        if (!shopkeeperId) {
          showMessage("Shopkeeper ID not found. Please log in again.", "error");
          return;
        }

        const response = await api.get(`/shop/${shopkeeperId}`);
        const { locationCoordinates, serviceRadius } = response.data;

        setLocation({
          latitude: locationCoordinates?.latitude?.toString() || "",
          longitude: locationCoordinates?.longitude?.toString() || "",
        });
        setServiceRadius(serviceRadius || 5);
      } catch (error) {
        console.error("Error fetching shopkeeper details:", error);
        showMessage("Failed to fetch location details. Please try again.", "error");
      }
    };

    fetchLocation();
  }, []);

  // Handle map click to manually set location
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLocation({
        latitude: e.latLng.lat().toString(),
        longitude: e.latLng.lng().toString(),
      });
      showMessage("Map clicked. Location updated (not saved yet).", "info");
    }
  }, []);

  // Handle dragging the marker to update location
  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLocation({
        latitude: e.latLng.lat().toString(),
        longitude: e.latLng.lng().toString(),
      });
      showMessage("Marker dragged. Location updated (not saved yet).", "info");
    }
  }, []);

  // Use browser’s geolocation to detect current location
  const handleDetectLocation = () => {
    if (!("geolocation" in navigator)) {
      showMessage("Geolocation is not supported by your browser.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        showMessage("Detected your current location (not saved yet).", "info");
      },
      (error) => {
        console.error("Geolocation error:", error);
        showMessage("Could not retrieve your location. Permission denied?", "error");
      }
    );
  };

  // Save location + radius to server
  const handleSaveLocation = async () => {
    try {
      setSaving(true);
      const shopkeeperId = localStorage.getItem("shopkeeperId");
      if (!shopkeeperId) {
        showMessage("Shopkeeper ID not found. Please log in again.", "error");
        return;
      }

      await api.put(`/shop/update-location/${shopkeeperId}`, {
        latitude: location.latitude,
        longitude: location.longitude,
        serviceRadius,
      });

      showMessage("Location updated successfully.", "success");
    } catch (error) {
      console.error("Error updating location:", error);
      showMessage("Failed to update location. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete My Account button functionality
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? All of your products will also be deleted. This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const shopkeeperId = localStorage.getItem("shopkeeperId");
      if (!shopkeeperId) {
        showMessage("Shopkeeper ID not found. Please log in again.", "error");
        return;
      }

      await api.delete(`/shop/${shopkeeperId}`);
      alert("Your account and all products have been deleted.");

      // Clear local storage and redirect to login
      localStorage.removeItem("shopkeeperId");
      localStorage.removeItem("shopkeeperToken");
      navigate("/shopkeeper/login");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      showMessage(
        error.response?.data?.message || "Failed to delete account. Please try again.",
        "error"
      );
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-500">
        <FaSpinner className="animate-spin text-brand-500" />
        <span className="font-medium">Loading map...</span>
      </div>
    );
  }

  const latNum = parseFloat(location.latitude);
  const lngNum = parseFloat(location.longitude);
  const center = latNum && lngNum ? { lat: latNum, lng: lngNum } : defaultCenter;

  const messageStyles =
    messageType === "success"
      ? "border-brand-200 bg-brand-50 text-brand-700"
      : messageType === "error"
      ? "border-red-200 bg-red-50 text-red-600"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account</h1>
          <p className="page-subtitle mt-1">
            Manage your shop location and delivery area
          </p>
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        {message && (
          <div
            className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${messageStyles}`}
          >
            <FaInfoCircle className="mt-0.5 shrink-0" />
            {message}
          </div>
        )}

        {/* DETECT LOCATION BUTTON */}
        <button
          onClick={handleDetectLocation}
          className="btn-secondary mb-6 w-full"
        >
          <FaCrosshairs />
          Detect My Location
        </button>

        <div className="mb-6">
          <label className="label">Your Current Location</label>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <GoogleMap
              mapContainerStyle={getMapContainerStyle(windowWidth)}
              center={center}
              zoom={15}
              onClick={handleMapClick}
            >
              {latNum && lngNum && (
                <Marker
                  position={{ lat: latNum, lng: lngNum }}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                />
              )}
            </GoogleMap>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <FaMapMarkerAlt className="text-brand-500" />
            Click the map or drag the marker to set your shop location
          </p>
        </div>

        {/* SERVICE RADIUS */}
        <div className="mb-6">
          <label className="label" htmlFor="serviceRadius">
            Service Radius (km)
          </label>
          <input
            id="serviceRadius"
            type="number"
            className="input max-w-xs"
            value={serviceRadius}
            onChange={(e) => setServiceRadius(Number(e.target.value))}
          />
          <p className="mt-2 text-xs text-slate-500">
            Customers within this radius can see and order from your shop.
          </p>
        </div>

        <button
          onClick={handleSaveLocation}
          disabled={saving}
          className="btn-primary w-full py-3"
        >
          <FaSave />
          {saving ? "Saving..." : "Save Location"}
        </button>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="mb-1 font-semibold text-red-600">Danger Zone</h2>
          <p className="mb-4 text-sm text-slate-500">
            Permanently delete your shop and all its products.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="btn-danger w-full"
          >
            <FaTrashAlt />
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
