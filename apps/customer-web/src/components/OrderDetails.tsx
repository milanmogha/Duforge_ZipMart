import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getOrderById,
  generateInvoice,
  cancelOrderAPI,
  submitRatingAPI,
} from "../api";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  useJsApiLoader,
  GoogleMap,
  MarkerF,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import { FiArrowLeft, FiDownload, FiXCircle } from "react-icons/fi";
import {
  TrackingTimeline,
  LiveRiderCard,
  RIDER_MARKER_URL,
  SHOP_MARKER_URL,
  CUSTOMER_MARKER_URL,
} from "./TrackingAssets";
import { SOCKET_URL } from "@zipmart/shared";

// ---------------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------------

type OrderItem = {
  product: {
    _id: string;
    name: string;
    category: string;
    images?: { image1?: { data: string; contentType: string } };
    price: number;
    discount?: number;
  };
  quantity: number;
  price: number;
};

type Coordinates = { latitude: number; longitude: number };

type Order = {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerPhone?: string;
  deliveryStatus?: string;

  // shop info
  shopId?: string;
  shopName?: string;
  phone?: string;
  gstNumber?: string;
  location?: string;
  shopCoords?: Coordinates;

  // fees & earnings
  platformFee: number;
  deliveryFee: number;
  deliveryBoyEarning: number;

  deliveryCoords?: Coordinates;
  invoiceAvailable?: boolean;
};
type DeliveryBoyLocation = { latitude: number; longitude: number };

// ---------------------------------------------------------------------------------
// Map config
// ---------------------------------------------------------------------------------

const mapContainerStyle = { width: "100%", height: "400px", borderRadius: "1rem" };
const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";
const libraries: "places"[] = ["places"];

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  // Live driver location
  const [deliveryBoyLocation, setDeliveryBoyLocation] =
    useState<DeliveryBoyLocation | null>(null);

  // Directions + ETA
  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  // Map refs
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapLoadedOnce, setMapLoadedOnce] = useState(false);

  // Load Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Load last known driver location
  useEffect(() => {
    const stored = localStorage.getItem("deliveryBoyLastLocation");
    if (stored) {
      try {
        setDeliveryBoyLocation(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Fetch order details
  useEffect(() => {
    (async () => {
      if (!orderId) {
        setError("No order ID provided.");
        setLoading(false);
        return;
      }
      try {
        const fetched: any = await getOrderById(orderId);
        // default discounts
        const items = fetched.items.map((i: any) => ({
          ...i,
          product: { ...i.product, discount: i.product.discount || 0 },
        }));
        setOrder({ ...fetched, items });
        if (
          fetched.deliveryStatus === "Delivered" &&
          !fetched.invoiceAvailable
        ) {
          await generateInvoice(orderId);
          setOrder((o) => o && { ...o, invoiceAvailable: true });
        }
      } catch (err: any) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch order.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  // Socket.IO for live updates
  useEffect(() => {
    if (!orderId) return;
    const socket: Socket = io(SOCKET_URL);
    socket.on("location-update", (data: any) => {
      if (data.orderId === orderId) {
        setDeliveryBoyLocation(data.deliveryBoyLocation);
        localStorage.setItem(
          "deliveryBoyLastLocation",
          JSON.stringify(data.deliveryBoyLocation)
        );
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  // Submit rating
  const handleSubmitRating = async () => {
    if (!order) return;
    if (ratingValue === 0) {
      return toast.error("Please select a rating.");
    }
    try {
      await submitRatingAPI({
        orderId: order._id,
        rating: ratingValue,
        comment: reviewComment,
      });
      toast.success("Rating submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit rating.");
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      const cancelled: any = await cancelOrderAPI(order._id);
      const items = cancelled.items.map((i: any) => ({
        ...i,
        product: { ...i.product, discount: i.product.discount || 0 },
      }));
      setOrder({ ...cancelled, items });
      toast.success("Order cancelled successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order.");
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const W = doc.internal.pageSize.getWidth(); // 595.28
    const M = 48; // margin

    // ── Header ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text("Tax Invoice", M, 56);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`Invoice # ${order._id}`, W - M, 56, { align: "right" });

    // thin divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.8);
    doc.line(M, 68, W - M, 68);

    // ── From / Bill To ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("FROM", M, 94);
    doc.text("BILL TO", W / 2 + 20, 94);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(order.shopName || "ZipMart Shop", M, 110);
    doc.text(order.customerName || "-", W / 2 + 20, 110);

    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`Phone: ${order.phone || "-"}`, M, 126);
    doc.text(`Phone: ${order.customerPhone || "-"}`, W / 2 + 20, 126);
    doc.text(`Address: ${order.location || "-"}`, M, 142, {
      maxWidth: W / 2 - 20,
    });
    doc.text(`Address: ${order.deliveryAddress || "-"}`, W / 2 + 20, 142, {
      maxWidth: W / 2 - 20,
    });

    // Order meta row
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Date: ${new Date(order.orderDate).toLocaleDateString()}    Status: ${
        order.deliveryStatus || "-"
      }    Payment: ${order.paymentMethod || "-"} (${order.paymentStatus || "-"})`,
      M,
      168,
      { maxWidth: W - 2 * M }
    );

    // ── Items table ──
    autoTable(doc, {
      startY: 184,
      margin: { left: M, right: M },
      head: [["QTY", "ITEM DESCRIPTION", "MRP (Rs)", "DISC %", "TOTAL (Rs)"]],
      body: order.items.map((item) => [
        String(item.quantity),
        item.product.name,
        item.product.price.toFixed(2),
        String(item.product.discount || 0),
        item.price.toFixed(2),
      ]),
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: [60, 60, 60],
        lineColor: [210, 210, 210],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [30, 30, 30],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 40 },
        1: { cellWidth: "auto" },
        2: { halign: "right", cellWidth: 60 },
        3: { halign: "center", cellWidth: 50 },
        4: { halign: "right", cellWidth: 60 },
      },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 16;

    // ── Totals ──
    const colX = W - M; // right-aligned numbers
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Subtotal", colX - 150, finalY);
    doc.text("Platform Fee", colX - 150, finalY + 14);
    doc.text("Delivery Fee", colX - 150, finalY + 28);

    doc.text(`Rs ${order.totalAmount.toFixed(2)}`, colX, finalY, {
      align: "right",
    });
    doc.text(`Rs ${(order.platformFee || 0).toFixed(2)}`, colX, finalY + 14, {
      align: "right",
    });
    doc.text(`Rs ${(order.deliveryFee || 0).toFixed(2)}`, colX, finalY + 28, {
      align: "right",
    });

    // divider + total
    doc.setDrawColor(200, 200, 200);
    doc.line(colX - 150, finalY + 38, colX, finalY + 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Total", colX - 150, finalY + 52);
    doc.text(
      `Rs ${(
        order.totalAmount +
        (order.platformFee || 0) +
        (order.deliveryFee || 0)
      ).toFixed(2)}`,
      colX,
      finalY + 52,
      { align: "right" }
    );

    // ── Footer: company + signature + terms ──
    finalY += 86;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text("ZIPMART ECOMMERCE PRIVATE LIMITED", M, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text("GSTIN: XXXXXXXXXXXXXXX   FSSAI: 21525056001320", M, finalY + 14);
    doc.text("CIN: U47910PN2024PTC231408   PAN: AAMCB6406A", M, finalY + 26);

    // signature
    doc.text("Authorised Signatory", W - M, finalY + 14, { align: "right" });
    doc.addImage(
      "https://i.imgur.com/zd0au5U.png",
      "PNG",
      W - M - 90,
      finalY - 40,
      90,
      44
    );

    // terms
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text("Terms & Conditions", M, finalY + 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    const terms = [
      "1. Payment can remain due at most a week.",
      "2. Goods once sold will not be exchanged or refunded.",
      "3. Retain this invoice for future reference.",
      "4. All disputes subject to jurisdiction.",
      "5. All the goods sold are inclusive of taxes.",
      "6. All items are eligible for return up to 7 days.",
    ];
    doc.text(terms, M, finalY + 62, { maxWidth: W - 2 * M });

    doc.save(`${order.customerName || "invoice"}.pdf`);
    toast.success("Invoice downloaded successfully!");
  };

  // Loading / error
  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-red-600">{error || "Order not found."}</p>
        <button
          onClick={() => navigate("/account/orders")}
          className="btn-primary mt-4"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const canCancel =
    order.deliveryStatus === "Pending" || order.deliveryStatus === "Accepted";
  const canRate = order.deliveryStatus === "Delivered";
  const isTrackable =
    (order.deliveryStatus === "Accepted" ||
      order.deliveryStatus === "InTransit") &&
    deliveryBoyLocation != null;

  const mapCenter = deliveryBoyLocation
    ? {
        lat: deliveryBoyLocation.latitude,
        lng: deliveryBoyLocation.longitude,
      }
    : order.shopCoords
    ? { lat: order.shopCoords.latitude, lng: order.shopCoords.longitude }
    : { lat: 0, lng: 0 };

  let destination: google.maps.LatLngLiteral | null = null;
  if (order.deliveryStatus === "Accepted" && order.shopCoords) {
    destination = {
      lat: order.shopCoords.latitude,
      lng: order.shopCoords.longitude,
    };
  } else if (order.deliveryStatus === "InTransit" && order.deliveryCoords) {
    destination = {
      lat: order.deliveryCoords.latitude,
      lng: order.deliveryCoords.longitude,
    };
  }

  const summaryRows: [string, React.ReactNode][] = [
    ["Order ID", order._id],
    ["Shop Name", order.shopName],
    ["Shop Phone", order.phone],
    ["Shop GST Number", order.gstNumber],
    ["Shop Address", order.location],
    ["Customer Name", order.customerName],
    ["Customer Phone", order.customerPhone],
    ["Delivery Status", order.deliveryStatus],
    ["Order Date", new Date(order.orderDate).toLocaleString()],
    ["Payment Method", order.paymentMethod],
    ["Delivery Address", order.deliveryAddress],
    ["Subtotal", `₹${order.totalAmount.toFixed(2)}`],
    ["Platform Fee", `₹${(order.platformFee || 0).toFixed(2)}`],
    ["Delivery Fee", `₹${(order.deliveryFee || 0).toFixed(2)}`],
  ];

  return (
    <div className="min-h-screen bg-cream-100 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <button
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-brand-700"
          onClick={() => navigate("/account/orders")}
        >
          <FiArrowLeft /> Back to Orders
        </button>
        <div className="mb-6">
          <p className="font-display text-sm italic text-accent-600">
            Your order, at a glance
          </p>
          <h1 className="font-display mt-0.5 text-3xl font-black tracking-tight text-ink-800">
            Order Details
          </h1>
        </div>

        {/* Order Summary */}
        <div className="rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch">
          <p className="font-display text-sm italic text-accent-600">
            The fine print
          </p>
          <h2 className="font-display mt-0.5 mb-4 text-xl font-bold text-ink-800">
            Order Summary
          </h2>
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            {summaryRows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-cream-300 py-1.5 sm:justify-start">
                <dt className="shrink-0 font-semibold text-ink-500">{label}:</dt>
                <dd className="break-all text-right text-ink-800 sm:text-left">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            {canCancel && (
              <button
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                onClick={handleCancelOrder}
              >
                <FiXCircle /> Cancel Order
              </button>
            )}
            <button className="btn-primary" onClick={handleDownloadInvoice}>
              <FiDownload /> Download Invoice
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6 rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch">
          <p className="font-display text-sm italic text-accent-600">
            What's in the basket
          </p>
          <h2 className="font-display mt-0.5 mb-4 text-xl font-bold text-ink-800">
            Items
          </h2>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 border-b border-cream-300 py-4 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-4">
                {item.product.images?.image1 ? (
                  <img
                    src={`data:${item.product.images.image1.contentType};base64,${item.product.images.image1.data}`}
                    alt={item.product.name}
                    className="h-16 w-16 shrink-0 rounded-2xl border border-cream-300 bg-cream-100 object-contain p-1"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-2xl bg-cream-200" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-800">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-ink-500">
                    Category: {item.product.category}
                  </p>
                  <p className="text-xs text-ink-500">Quantity: {item.quantity}</p>
                </div>
              </div>
              <p className="text-base font-bold text-ink-900">
                ₹{item.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Tracking Timeline */}
        <TrackingTimeline
          currentStatus={order.deliveryStatus || "Pending"}
          orderDate={order.orderDate}
          className="mt-6"
        />

        {/* Live Rider Card */}
        {isTrackable && (
          <LiveRiderCard
            eta={timeLeft}
            status={order.deliveryStatus || ""}
            className="mt-6"
          />
        )}

        {/* Map */}
        {!isLoaded && !loadError && (
          <p className="mt-6 text-ink-500">Loading Google Maps...</p>
        )}
        {loadError && (
          <p className="mt-6 text-red-500">
            Failed to load Google Maps script: {loadError.message}
          </p>
        )}
        {isLoaded && isTrackable && destination && (
          <div className="mt-6 overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 shadow-arch">
            <div className="flex items-center gap-3 border-b border-cream-300 px-5 py-4">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-600" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-ink-800">Live Tracking</h2>
                {timeLeft && (
                  <p className="text-sm text-ink-500">
                    ETA: <span className="font-semibold text-brand-700">{timeLeft}</span>
                  </p>
                )}
              </div>
            </div>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={13}
              onLoad={(map) => {
                if (!mapLoadedOnce) {
                  setMapLoadedOnce(true);
                  mapRef.current = map;
                }
              }}
            >
              <DirectionsService
                options={{
                  origin: {
                    lat: deliveryBoyLocation!.latitude,
                    lng: deliveryBoyLocation!.longitude,
                  },
                  destination,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                }}
                callback={(result, status) => {
                  if (status === "OK" && result) {
                    setDirectionsResponse(result);
                    const route = result.routes[0];
                    if (route?.legs?.[0]?.duration) {
                      setTimeLeft(route.legs[0].duration.text);
                    }
                  } else {
                    console.error("DirectionsService error:", status);
                  }
                }}
              />
              {directionsResponse && (
                <DirectionsRenderer
                  options={{
                    directions: directionsResponse,
                    suppressMarkers: true,
                    preserveViewport: true,
                  }}
                />
              )}
              <MarkerF
                position={{
                  lat: deliveryBoyLocation!.latitude,
                  lng: deliveryBoyLocation!.longitude,
                }}
                icon={{
                  url: RIDER_MARKER_URL,
                  scaledSize: new window.google.maps.Size(48, 48),
                  anchor: new window.google.maps.Point(24, 48),
                }}
                animation={window.google.maps.Animation.BOUNCE}
              />
              {order.deliveryStatus === "Accepted" && order.shopCoords && (
                <MarkerF
                  position={{
                    lat: order.shopCoords.latitude,
                    lng: order.shopCoords.longitude,
                  }}
                  icon={{
                    url: SHOP_MARKER_URL,
                    scaledSize: new window.google.maps.Size(44, 44),
                    anchor: new window.google.maps.Point(22, 44),
                  }}
                />
              )}
              {order.deliveryStatus === "InTransit" && order.deliveryCoords && (
                <MarkerF
                  position={{
                    lat: order.deliveryCoords.latitude,
                    lng: order.deliveryCoords.longitude,
                  }}
                  icon={{
                    url: CUSTOMER_MARKER_URL,
                    scaledSize: new window.google.maps.Size(44, 44),
                    anchor: new window.google.maps.Point(22, 44),
                  }}
                />
              )}
            </GoogleMap>
          </div>
        )}

        {/* Rating */}
        {canRate && (
          <div className="mt-6 rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch">
            <p className="font-display text-sm italic text-accent-600">
              How was the delivery?
            </p>
            <h2 className="font-display mt-0.5 mb-4 text-xl font-bold text-ink-800">
              Rate Your Order
            </h2>
            <div className="mb-3 flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className={`transition hover:scale-110 ${
                    star <= ratingValue ? "text-accent-400" : "text-cream-400"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="input-field mb-3 border-cream-300 bg-cream-100"
              rows={3}
              placeholder="Write your review..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <button className="btn-primary" onClick={handleSubmitRating}>
              Submit Rating
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
