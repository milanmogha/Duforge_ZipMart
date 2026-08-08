import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import {
  RiderIcon,
  ShopIcon,
  CustomerIcon,
  RIDER_MARKER_URL,
  SHOP_MARKER_URL,
  CUSTOMER_MARKER_URL,
} from "./TrackingAssets";
import { FiArrowLeft, FiMapPin, FiClock } from "react-icons/fi";

const DeliveryInfo: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalPrice = 0 } = location.state || {};

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA",
  });

  const center = { lat: 40.7128, lng: -74.006 };

  if (!isLoaded)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-brand-600"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      <div className="mx-auto grid max-w-5xl gap-5 p-4 md:grid-cols-2 md:p-6">
        {/* Map Section */}
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <div className="h-2 w-2 animate-pulse rounded-full bg-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Live Tracking</h2>
              <p className="text-sm text-gray-500">Rider is on the way</p>
            </div>
          </div>
          <GoogleMap
            zoom={14}
            center={center}
            mapContainerClassName="w-full h-full min-h-[320px]"
          >
            <Marker
              position={center}
              icon={{
                url: RIDER_MARKER_URL,
                scaledSize: new window.google.maps.Size(48, 48),
                anchor: new window.google.maps.Point(24, 48),
              }}
              animation={window.google.maps.Animation.BOUNCE}
            />
            <Marker
              position={{ lat: center.lat + 0.003, lng: center.lng - 0.002 }}
              icon={{
                url: SHOP_MARKER_URL,
                scaledSize: new window.google.maps.Size(44, 44),
                anchor: new window.google.maps.Point(22, 44),
              }}
            />
            <Marker
              position={{ lat: center.lat - 0.002, lng: center.lng + 0.003 }}
              icon={{
                url: CUSTOMER_MARKER_URL,
                scaledSize: new window.google.maps.Size(44, 44),
                anchor: new window.google.maps.Point(22, 44),
              }}
            />
          </GoogleMap>
        </div>

        {/* Delivery Info Section */}
        <div className="flex flex-col gap-5">
          {/* Estimated Time */}
          <div className="card flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <FiClock className="text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Estimated Arrival
              </p>
              <p className="text-2xl font-extrabold text-gray-900">
                5 <span className="text-lg font-bold text-brand-600">min</span>
                <span className="ml-2 text-2xl">⚡</span>
              </p>
            </div>
          </div>

          {/* Delivery Partner Info */}
          <div className="card">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Delivery Partner
            </p>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-500/20">
                <RiderIcon className="h-8 w-8 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900">John Doe</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-amber-500">⭐ 4.8</p>
                  <span className="text-xs text-gray-400">·</span>
                  <p className="text-xs text-gray-500">2,341 deliveries</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <FiMapPin className="text-brand-500" />
              <span>2.3 km away · Moving fast</span>
            </div>
          </div>

          {/* Route preview */}
          <div className="card">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Route
            </p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <ShopIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">ZipMart Store</p>
                  <p className="text-xs text-gray-500">Pickup complete</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-brand-600">✓</span>
              </div>
              <div className="ml-5 h-6 w-0.5 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <RiderIcon className="h-5 w-5" />
                  <span className="absolute inset-0 rounded-full border-2 border-brand-400 animate-pulse-ring" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">On the way</p>
                  <p className="text-xs text-gray-500">Rider en route</p>
                </div>
                <span className="ml-auto text-xs font-semibold text-brand-600">●</span>
              </div>
              <div className="ml-5 h-6 w-0.5 bg-gray-200" />
              <div className="flex items-center gap-3 opacity-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                  <CustomerIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Your Location</p>
                  <p className="text-xs text-gray-500">Waiting for delivery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="card">
            <h3 className="section-title mb-4">Bill Summary</h3>
            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>Item Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>Platform Fee</span>
              <span>₹30</span>
            </div>
            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>Delivery Fee</span>
              <span>₹30</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-extrabold text-gray-900">
              <span>Total Payable</span>
              <span>₹{(totalPrice + 30 + 30).toFixed(2)}</span>
            </div>
          </div>

          {/* Back to Home Button */}
          <button className="btn-primary" onClick={() => navigate("/landing")}>
            Back To Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfo;
