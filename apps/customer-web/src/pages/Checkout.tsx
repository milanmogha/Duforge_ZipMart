import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { GoogleMap, MarkerF, useLoadScript } from "@react-google-maps/api";
import { FiArrowLeft, FiCrosshair, FiSearch } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useLocationCtx } from "../context/LocationContext";
import {
  applyCoupon,
  createOrder,
  clearCart,
  getShopById,
  getDrivingDistanceInKm,
} from "../api";

// Ensure we know the shape of the coupon API response
interface CouponResponse {
  discount: number;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "1rem",
};

const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  // ───── STOCK CHECK ─────────────────────────────────────────
  const outOfStockItems = useMemo(
    () =>
      cartItems.filter(
        (item) =>
          typeof (item.product as any).stock === "number" &&
          item.quantity > (item.product as any).stock
      ),
    [cartItems]
  );
  const hasOutOfStock = outOfStockItems.length > 0;

  // Map & location states
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [formattedAddress, setFormattedAddress] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);

  // Checkout data states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Extra fees & earnings
  const [, setDeliveryDistance] = useState(0);
  const [platformCharge, setPlatformCharge] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryBoyEarning, setDeliveryBoyEarning] = useState(0);

  // Payment method
  const [paymentMethodOption, setPaymentMethodOption] = useState<"COD" | "Razorpay">("Razorpay");

  // Load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Reference to the map instance
  const mapRef = useRef<google.maps.Map | null>(null);
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  // ───────── 1) CALCULATE CART SUBTOTAL ─────────
  useEffect(() => {
    const calculatedTotal = cartItems.reduce((sum, item) => {
      const discountedPrice =
        item.product.price - (item.product.price * (item.product.discount || 0)) / 100;
      return sum + discountedPrice * item.quantity;
    }, 0);
    setTotalAmount(parseFloat(calculatedTotal.toFixed(2)));
  }, [cartItems]);

  // ───────── 2) UPDATE FINAL AMOUNT ─────────
  useEffect(() => {
    const subAfterDiscount = Math.max(totalAmount - couponDiscount, 0);
    setFinalAmount(parseFloat((subAfterDiscount + platformCharge + deliveryCharge).toFixed(2)));
  }, [totalAmount, couponDiscount, platformCharge, deliveryCharge]);

  // ───────── 3) GET USER’S LOCATION ─────────
  // Prefer the saved delivery location; fall back to GPS
  const { location: savedLocation, setLocation: saveLocation } = useLocationCtx();

  useEffect(() => {
    const applyLocation = async (lat: number, lng: number) => {
      const location = { lat, lng };
      setSelectedLocation(location);
      const address = await getAddress(lat, lng);
      setFormattedAddress(address);
      setIsFetchingLocation(false);
      mapRef.current?.panTo(location);
    };

    const loadLocation = async () => {
      if (savedLocation) {
        await applyLocation(savedLocation.latitude, savedLocation.longitude);
        // Keep the saved address for display
        setFormattedAddress(savedLocation.address || formattedAddress);
        return;
      }

      if (!navigator.geolocation) {
        toast.error("Geolocation not supported.");
        setIsFetchingLocation(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await applyLocation(latitude, longitude);
          // Cache the detected location for next time
          const addr = await getAddress(latitude, longitude);
          saveLocation({ latitude, longitude, address: addr });
        },
        () => {
          toast.error("Failed to fetch location.");
          setIsFetchingLocation(false);
        }
      );
    };

    loadLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geocode lat/lng -> address
  const getAddress = async (lat: number, lng: number) => {
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

  // Address -> lat/lng
  const getCoordinatesFromAddress = async (address: string) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
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

  // Handle map click
  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const location = { lat, lng };
    setSelectedLocation(location);

    const address = await getAddress(lat, lng);
    setFormattedAddress(address);

    mapRef.current?.panTo(location);
  };

  // Detect location by button
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const loc = { lat: latitude, lng: longitude };
        setSelectedLocation(loc);

        const address = await getAddress(latitude, longitude);
        setFormattedAddress(address);

        mapRef.current?.panTo(loc);
        toast.success("Location detected successfully!");
      },
      () => {
        toast.error("Failed to detect current location.");
      }
    );
  };

  // Search address
  const handleSearchAddress = async () => {
    if (!formattedAddress.trim()) {
      toast.error("Please enter an address to search.");
      return;
    }
    const coords = await getCoordinatesFromAddress(formattedAddress);
    if (coords) {
      setSelectedLocation(coords);
      const address = await getAddress(coords.lat, coords.lng);
      setFormattedAddress(address);

      mapRef.current?.panTo(coords);
      toast.success("Address found and updated on the map!");
    } else {
      toast.error("Unable to find location for the provided address.");
    }
  };

  // ───────── 4) COMPUTE EXTRA FEES & RIDER EARNING ─────────
  useEffect(() => {
    const fetchFees = async () => {
      if (!selectedLocation || cartItems.length === 0) return;

      const shopId = cartItems[0]?.product.shopkeeperId;
      if (!shopId) return;

      try {
        const shopData = await getShopById(shopId);
        if (!shopData?.locationCoordinates) return;

        const { latitude: shopLat, longitude: shopLng } = shopData.locationCoordinates;
        const km = await getDrivingDistanceInKm(
          shopLat,
          shopLng,
          selectedLocation.lat,
          selectedLocation.lng
        );
        setDeliveryDistance(km);

        const afterDiscount = totalAmount - couponDiscount;
        const plat = afterDiscount < 2000 ? 10 : 0;
        const deli = afterDiscount < 2000 ? parseFloat((km * 8).toFixed(2)) : 0;
        const rider = parseFloat((km * 8).toFixed(2));

        setPlatformCharge(plat);
        setDeliveryCharge(deli);
        setDeliveryBoyEarning(rider);
      } catch (error) {
        console.error("Error computing fees:", error);
      }
    };
    fetchFees();
  }, [selectedLocation, cartItems, totalAmount, couponDiscount]);

  // ───────── PHONE VALIDATION ─────────
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerPhone(value);
    setPhoneError(/^\d{10}$/.test(value) ? "" : "Phone number must be exactly 10 digits.");
  };

  // ───────── APPLY COUPON ─────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }
    if (totalAmount < 2000) {
      toast.error("Coupon can only be applied when total amount is ₹1000 or more.");
      return;
    }
    try {
      const response = (await applyCoupon(couponCode, totalAmount)) as CouponResponse;
      const discountNum = response.discount ?? 0;
      setCouponDiscount(parseFloat(discountNum.toFixed(2)));
      toast.success("Coupon applied successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to apply coupon.");
    }
  };

  // ───────── 6) CREATE ORDER ─────────
  const handleCreateOrder = async () => {
    // Prevent ordering if any item is out of stock
    if (hasOutOfStock) {
      const names = outOfStockItems.map((it) => it.product.name).join(", ");
      toast.error(`Out of stock: ${names}`);
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!customerPhone.trim() || phoneError) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!selectedLocation) {
      toast.error("Please select your exact delivery location on the map.");
      return;
    }

    const safeDiscount = Number.isFinite(couponDiscount) ? couponDiscount : 0;
    const safeFinal = Number.isFinite(finalAmount) ? finalAmount : 0;

    const orderData = {
      items: cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: parseFloat(
          (
            item.product.price -
            (item.product.price * (item.product.discount || 0)) / 100
          ).toFixed(2)
        ),
      })),
      totalAmount: parseFloat((totalAmount - safeDiscount).toFixed(2)),
      discountAmount: safeDiscount,
      deliveryAddress: formattedAddress,
      paymentMethod: paymentMethodOption === "COD" ? "Cash On Delivery" : "Razorpay",
      couponCode: couponCode || undefined,
      customerName,
      customerPhone,
      deliveryCoords: {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      },
      platformFee: platformCharge,
      deliveryFee: deliveryCharge,
      deliveryBoyEarning,
      finalAmount: parseFloat(safeFinal.toFixed(2)),
    };

    try {
      if (paymentMethodOption === "COD") {
        await createOrder(orderData);
        toast.success("Order created successfully!");
        await clearCart();
        navigate("/account/orders");
      } else {
        navigate("/payment", {
          state: { ...orderData, amount: safeFinal, cartItems },
        });
      }
    } catch (error: any) {
      toast.error(
        `Failed to create order: ${
          error?.message ||
          "An unexpected error occurred. Check console or network tab."
        }`
      );
    }
  };

  // ───────── RENDER ─────────
  if (!isLoaded || isFetchingLocation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-100">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cream-300 border-t-brand-600" />
        <p className="font-display text-sm font-medium text-ink-500">Loading map & location…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 pb-28 md:pb-10">
      <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <button
            onClick={() => navigate("/landing")}
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-brand-700"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="font-display text-lg font-black tracking-tight text-ink-800">Checkout</h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Customer Details */}
          <section className="rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch">
            <p className="font-display text-sm italic text-accent-600">Who's this for?</p>
            <h2 className="font-display mt-0.5 mb-4 text-xl font-bold text-ink-800">Customer Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input-field border-cream-300 bg-cream-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Phone Number (10 digits)
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  className="input-field border-cream-300 bg-cream-100"
                />
                {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
              </div>
            </div>
          </section>

          {/* Apply Coupon */}
          <section className="rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch">
            <p className="font-display text-sm italic text-accent-600">Got a code?</p>
            <h2 className="font-display mt-0.5 mb-4 text-xl font-bold text-ink-800">Apply Coupon</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="input-field flex-1 border-cream-300 bg-cream-100"
              />
              <button onClick={handleApplyCoupon} className="btn-outline">
                Apply
              </button>
            </div>
          </section>

          {/* Delivery Location */}
          <section className="rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch">
            <p className="font-display text-sm italic text-accent-600">Where to drop it?</p>
            <h2 className="font-display mt-0.5 mb-4 text-xl font-bold text-ink-800">Delivery Location</h2>
            <div className="overflow-hidden rounded-2xl border border-cream-300">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={
                  selectedLocation
                    ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
                    : { lat: 28.6139, lng: 77.209 }
                }
                zoom={15}
                onClick={handleMapClick}
                onLoad={onMapLoad}
              >
                {selectedLocation && (
                  <MarkerF
                    position={selectedLocation}
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    }}
                  />
                )}
              </GoogleMap>
            </div>

            <textarea
              value={formattedAddress}
              onChange={(e) => setFormattedAddress(e.target.value)}
              rows={3}
              placeholder="Enter address to search (include flat/house number, etc.)"
              className="input-field mt-4 border-cream-300 bg-cream-100"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button onClick={handleDetectLocation} className="btn-outline">
                <FiCrosshair /> Detect My Location
              </button>
              <button onClick={handleSearchAddress} className="btn-primary">
                <FiSearch /> Search
              </button>
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Ensure this address is accurate! Include flat/house number.
            </p>
          </section>

          {/* Payment Method */}
          <section className="rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch">
            <p className="font-display text-sm italic text-accent-600">How will you pay?</p>
            <h2 className="font-display mt-0.5 mb-4 text-xl font-bold text-ink-800">Payment Method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { value: "Razorpay", label: "Online Payment", note: "UPI, cards & more" },
                  { value: "COD", label: "Cash On Delivery", note: "Pay at your door" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
                    paymentMethodOption === opt.value
                      ? "border-brand-500 bg-brand-50"
                      : "border-cream-300 bg-cream-100 hover:border-brand-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={paymentMethodOption === opt.value}
                    onChange={() => setPaymentMethodOption(opt.value)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span>
                    <span className="block text-sm font-bold text-ink-800">{opt.label}</span>
                    <span className="block text-xs text-ink-500">{opt.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Order Summary */}
        <aside className="h-fit rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch lg:sticky lg:top-20">
          <p className="font-display text-sm italic text-accent-600">Almost there</p>
          <h2 className="font-display mt-0.5 mb-4 text-xl font-bold text-ink-800">Order Summary</h2>

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {cartItems.map((item) => {
              const prod = item.product;
              const originalPrice = prod.price;
              const discountedPrice =
                originalPrice - (originalPrice * (prod.discount || 0)) / 100;
              const totalItemPrice = parseFloat((discountedPrice * item.quantity).toFixed(2));

              return (
                <div key={prod._id} className="flex items-center gap-3">
                  <div className="arch-frame flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-cream-200/70">
                    <img
                      src={`data:${prod.images.image1.contentType};base64,${prod.images.image1.data}`}
                      alt={prod.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">{prod.name}</p>
                    <p className="text-xs text-ink-500">
                      ₹{discountedPrice.toFixed(2)} × {item.quantity}
                      {(prod.discount || 0) > 0 && (
                        <span className="ml-1 text-brand-700">({prod.discount}% off)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-ink-900">₹{totalItemPrice.toFixed(2)}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 border-t border-dashed border-cream-400 pt-4 text-sm">
            <p className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </p>
            {couponDiscount > 0 && (
              <p className="flex justify-between font-medium text-brand-700">
                <span>Coupon Discount</span>
                <span>-₹{couponDiscount.toFixed(2)}</span>
              </p>
            )}
            {totalAmount - couponDiscount < 2000 && (
              <>
                <p className="flex justify-between text-ink-600">
                  <span>Platform Fee</span>
                  <span>₹{platformCharge.toFixed(2)}</span>
                </p>
                <p className="flex justify-between text-ink-600">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryCharge.toFixed(2)}</span>
                </p>
              </>
            )}
            <p className="flex justify-between border-t border-cream-400 pt-2 text-base font-extrabold text-ink-900">
              <span>Total Amount</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </p>
          </div>

          <button
            onClick={handleCreateOrder}
            disabled={hasOutOfStock}
            className="btn-primary mt-5 w-full py-3.5 text-base"
          >
            {hasOutOfStock
              ? "Out of Stock"
              : paymentMethodOption === "COD"
              ? "Place Order"
              : `Pay ₹${finalAmount.toFixed(2)}`}
          </button>
        </aside>
      </main>
    </div>
  );
};

export default Checkout;
