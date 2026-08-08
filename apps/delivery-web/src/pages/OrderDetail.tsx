import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FaArrowLeft, FaMapMarkerAlt, FaStore, FaTruck, FaRupeeSign, FaBoxOpen, FaUser } from "react-icons/fa";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";
import {
  getOrderById,
  pickOrder,
  updateDeliveryStatus,
  updatePaymentStatus,
  updateDeliveryBoyLocation,
  Order,
  Coordinates,
} from "../api";
import { useSocket } from "../socket";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Loading from "../components/ui/Loading";

const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";

const mapContainerStyle = {
  width: "100%",
  height: "420px",
};

// Decodes a Google Encoded Polyline into coordinate points.
const decodePolyline = (encoded: string): { lat: number; lng: number }[] => {
  let index = 0;
  const points: { lat: number; lng: number }[] = [];
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
};

const statusTone = (status: string) => {
  switch (status) {
    case "Pending":
      return "warning";
    case "Accepted":
      return "info";
    case "InTransit":
      return "info";
    case "Delivered":
      return "success";
    case "Rejected":
      return "danger";
    default:
      return "neutral";
  }
};

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [routePoints, setRoutePoints] = useState<{ lat: number; lng: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const locationIntervalRef = useRef<number | null>(null);

  const isLive = order?.deliveryStatus === "Accepted" || order?.deliveryStatus === "InTransit";

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Fetch directions route once we have shop + customer coords.
  useEffect(() => {
    if (!order || !order.shopCoords || !order.customerCoords) return;
    const origin = `${order.shopCoords.latitude},${order.shopCoords.longitude}`;
    const destination = `${order.customerCoords.latitude},${order.customerCoords.longitude}`;
    fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.routes?.[0]?.overview_polyline?.points) {
          setRoutePoints(decodePolyline(data.routes[0].overview_polyline.points));
        }
      })
      .catch((err) => console.error("Directions fetch failed:", err));
  }, [order]);

  // Live location streaming while Accepted / InTransit.
  useEffect(() => {
    if (!orderId || !isLive) return;

    const upload = (lat: number, lng: number) => {
      updateDeliveryBoyLocation(orderId, lat, lng).catch((err) =>
        console.error("Location upload failed:", err.message)
      );
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCurrentLocation(c);
          upload(c.latitude, c.longitude);
        },
        (err) => console.error("Geolocation error:", err.message)
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setCurrentLocation(c);
          upload(c.latitude, c.longitude);
        },
        (err) => console.error("Location watch error:", err.message),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    }

    // Fallback: also ping every 10s (in case watch is throttled in background).
    locationIntervalRef.current = window.setInterval(() => {
      if (!currentLocation) return;
      upload(currentLocation.latitude, currentLocation.longitude);
    }, 10000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (locationIntervalRef.current !== null) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isLive]);

  // Socket: live location + status updates for this order.
  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit("join-order-room", orderId);

    const onLocation = (update: any) => {
      if (update?.orderId === orderId && update?.deliveryBoyLocation) {
        setCurrentLocation(update.deliveryBoyLocation);
      }
    };
    const onOrderUpdated = (updatedOrder: any) => {
      const id = updatedOrder?._id || updatedOrder?.order?.id;
      if (id === orderId) {
        loadOrder();
      }
    };

    socket.on("location-update", onLocation);
    socket.on("order-updated", onOrderUpdated);

    return () => {
      socket.off("location-update", onLocation);
      socket.off("order-updated", onOrderUpdated);
    };
  }, [socket, orderId, loadOrder]);

  const runAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      await loadOrder();
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const handlePick = () =>
    runAction(async () => {
      await pickOrder(orderId!);
    }, "Order marked as In Transit!");

  const handleDelivered = () => {
    if (!window.confirm("Mark this order as Delivered?")) return;
    runAction(async () => {
      await updateDeliveryStatus(orderId!, "Delivered");
    }, "Order marked as Delivered!");
  };

  const handleMarkPaid = () =>
    runAction(async () => {
      await updatePaymentStatus(orderId!, "Paid");
    }, "Payment marked as Paid!");

  if (loading) return <Loading fullPage label="Loading order details..." />;

  if (error || !order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-red-600">{error || "Order not found."}</p>
        <Button variant="outline" onClick={() => navigate("/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const mapCenter = currentLocation
    ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
    : order.shopCoords
    ? { lat: order.shopCoords.latitude, lng: order.shopCoords.longitude }
    : { lat: 28.6139, lng: 77.209 };

  const showMap = order.deliveryStatus !== "Delivered";

  return (
    <div className="p-4 sm:p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand-700"
      >
        <FaArrowLeft size={14} /> Back
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Details</h1>
          <p className="mt-0.5 font-mono text-xs text-gray-400">{order._id}</p>
        </div>
        <Badge tone={statusTone(order.deliveryStatus) as any}>{order.deliveryStatus}</Badge>
      </div>

      {showMap && (
        <Card className="mb-6 p-3">
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={13}
            >
              {currentLocation && (
                <Marker
                  position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}
                  label="You"
                />
              )}
              {order.shopCoords && (
                <Marker
                  position={{ lat: order.shopCoords.latitude, lng: order.shopCoords.longitude }}
                  label="Shop"
                  icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
                />
              )}
              {order.customerCoords && (
                <Marker
                  position={{ lat: order.customerCoords.latitude, lng: order.customerCoords.longitude }}
                  label="Customer"
                  icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
                />
              )}
              {routePoints.length > 0 && (
                <Polyline
                  path={routePoints}
                  options={{ strokeColor: "#218c4a", strokeWeight: 4, strokeOpacity: 0.8 }}
                />
              )}
            </GoogleMap>
          </LoadScript>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order summary */}
        <Card title="Order Summary" className="lg:col-span-2">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">Shop</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <FaStore className="text-brand-600" size={13} /> {order.shopName || "—"}
              </dd>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">Customer</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                <FaUser className="text-brand-600" size={13} />
                {order.customerName || "—"} ({order.customerPhone || "—"})
              </dd>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Amount</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-base font-bold text-gray-900">
                <FaRupeeSign className="text-brand-600" size={14} />
                {order.totalAmount?.toFixed?.(2) ?? order.totalAmount}
              </dd>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">Payment</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-800">
                {order.paymentMethod || "—"}
                <Badge tone={order.paymentStatus === "Paid" ? "success" : "warning"}>
                  {order.paymentStatus || "Pending"}
                </Badge>
              </dd>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">Delivery Address</dt>
              <dd className="mt-1 flex items-start gap-1.5 text-sm font-medium text-gray-700">
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-brand-600" size={13} />
                {order.deliveryAddress || "—"}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Actions */}
        <Card title="Actions">
          <div className="space-y-3">
            {order.deliveryStatus === "Accepted" && (
              <>
                <Button variant="primary" className="w-full" disabled={busy} onClick={handlePick}>
                  <FaTruck size={15} /> Mark as Picked
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  disabled={busy}
                  onClick={() =>
                    runAction(async () => {
                      await updateDeliveryStatus(orderId!, "Rejected");
                    }, "Order rejected.")
                  }
                >
                  Reject Order
                </Button>
              </>
            )}
            {order.deliveryStatus === "InTransit" && (
              <Button variant="success" className="w-full" disabled={busy} onClick={handleDelivered}>
                <FaBoxOpen size={15} /> Mark as Delivered
              </Button>
            )}
            {(order.deliveryStatus === "InTransit" || order.deliveryStatus === "Delivered") &&
              order.paymentMethod === "Cash On Delivery" &&
              order.paymentStatus !== "Paid" && (
                <Button
                  variant="success"
                  className="w-full"
                  disabled={busy}
                  onClick={handleMarkPaid}
                >
                  <FaRupeeSign size={15} /> Mark as Paid
                </Button>
              )}
            {order.deliveryStatus === "Pending" && (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                Accept this order from the Orders page to start delivery.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Items */}
      <Card title="Items" className="mt-6">
        {order.items && order.items.length > 0 ? (
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  {item.product.images?.image1?.data ? (
                    <img
                      src={`data:${item.product.images.image1.contentType};base64,${item.product.images.image1.data}`}
                      alt={item.product.name}
                      className="h-12 w-12 rounded-xl border border-gray-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                      <FaBoxOpen size={18} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-900">₹{item.price?.toFixed?.(2) ?? item.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No items available.</p>
        )}
      </Card>
    </div>
  );
};

export default OrderDetail;
