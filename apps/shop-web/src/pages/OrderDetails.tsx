import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetails } from "../api";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FaArrowLeft,
  FaDownload,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaCreditCard,
  FaCheckCircle,
  FaClipboardList,
  FaTruck,
  FaSpinner,
} from "react-icons/fa";
import {
  useJsApiLoader,
  GoogleMap,
  MarkerF,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Socket } from "socket.io-client";

interface OrderDetailsProps {
  socket: Socket | null;
}

type Coordinates = {
  latitude: number;
  longitude: number;
};

type DeliveryBoyLocation = {
  latitude: number;
  longitude: number;
};

type OrderItem = {
  product: {
    _id: string;
    name: string;
    category: string;
    images?: {
      image1?: {
        data: string;
        contentType: string;
      };
    };
    price: number;
    discount: number;
  };
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  customerName: string;
  customerPhone: string;
  deliveryStatus: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  items: OrderItem[];
  shopName: string;
  phone: string;
  location: string;
  orderDate: string;
  gstNumber: string;
  shopCoords?: Coordinates;
  deliveryCoords?: Coordinates;
};

const GOOGLE_MAPS_API_KEY = "AIzaSyBsN_Z9IAY3R9zacVCc8SUEFugDEMxc3wA";
const mapContainerStyle = { width: "100%", height: "100%" };

const OrderDetails: React.FC<OrderDetailsProps> = ({ socket }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<DeliveryBoyLocation | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // Helper: Show a push notification via service worker
  const showPushNotification = (order: Order) => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications.");
      return;
    }
    // Check permission
    if (Notification.permission === "granted") {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.showNotification("Order is delivered", {
            body: "Click to view order details.",
            data: { url: `/shopkeeper/orders/${order._id}` },
            icon: "/src/assets/zipmart-logo.svg",
          });
          console.log("Notification shown via service worker.");
        } else {
          console.log("No service worker registration found.");
        }
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
              registration.showNotification("Order is delivered", {
                body: "Click to view order details.",
                data: { url: `/shopkeeper/orders/${order._id}` },
                icon: "/src/assets/zipmart-logo.svg",
              });
              console.log("Notification shown after requesting permission.");
            } else {
              console.log("No service worker registration found after permission request.");
            }
          });
        } else {
          console.log("Notification permission denied.");
        }
      });
    } else {
      console.log("Notification permission already denied.");
    }
  };

  // 1) Fetch Order Details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!orderId) {
          setError("No order ID provided.");
          return;
        }
        const orderData = await getOrderDetails(orderId);
        setOrder(orderData);
      } catch (err: any) {
        const errMsg = err.response?.data?.message || "Failed to fetch order details.";
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  // 2) Load last known location from local storage
  useEffect(() => {
    const storedLocation = localStorage.getItem("deliveryBoyLastLocation");
    if (storedLocation) {
      try {
        const parsedLocation: DeliveryBoyLocation = JSON.parse(storedLocation);
        setDeliveryBoyLocation(parsedLocation);
      } catch (error) {
        console.error("Failed to parse stored delivery boy location", error);
      }
    }
  }, []);

  // 3) Listen for real-time updates via socket
  useEffect(() => {
    if (!socket) return;
    
    socket.on("location-update", (data: any) => {
      if (data.orderId === orderId) {
        setDeliveryBoyLocation(data.deliveryBoyLocation);
        localStorage.setItem("deliveryBoyLastLocation", JSON.stringify(data.deliveryBoyLocation));
      }
    });

    socket.on("order-updated", (updatedOrder: Order) => {
      if (updatedOrder._id === orderId) {
        setOrder(updatedOrder);
        if (updatedOrder.deliveryStatus === "Delivered") {
          toast.info("Order is delivered");
          console.log("Order delivered; attempting push notification.");
          showPushNotification(updatedOrder);
        }
      }
    });

    return () => {
      socket.off("location-update");
      socket.off("order-updated");
    };
  }, [orderId, socket]);

  // 4) Download Invoice
  const handleDownloadInvoice = () => {
    if (!order) return;

    const doc = new jsPDF();
    const logo = "/src/assets/zipmart-logo.svg"; // Ensure paths are correct
    const sign = "/src/assets/Sign.png";

    doc.rect(10, 10, 190, 40);
    doc.addImage(logo, "PNG", 10, 10, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor("#000000");
    doc.text("Tax Invoice", 188, 33, { align: "right" });

    doc.rect(10, 50, 115, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor("#000000");
    doc.text(`Sold By (Shop): ${order.shopName}`, 12, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Phone: ${order.phone}`, 12, 65);
    doc.text(`Address: ${order.location}`, 12, 72);

    doc.rect(125, 50, 75, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor("#000000");
    doc.text(`Order Id: ${order._id}`, 126, 55, { maxWidth: 50 });
    doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 126, 65);

    doc.rect(10, 100, 190, 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor("#000000");
    doc.text(`GST Number: ${order.gstNumber}`, 12, 105);

    doc.rect(10, 107, 190, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor("#000000");
    doc.text("Name:", 12, 112);
    doc.text("Phone:", 12, 118);
    doc.text("Address:", 12, 123);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.customerName}`, 45, 112);
    doc.text(`${order.customerPhone}`, 45, 118);
    doc.text(`${order.deliveryAddress}`, 45, 123, { maxWidth: 100 });

    const headers = [
      { title: "QTY", dataKey: "quantity" },
      { title: "ITEM DESCRIPTION", dataKey: "description" },
      { title: "MRP (Rs)", dataKey: "unitPrice" },
      { title: "Discount %", dataKey: "discount" },
      { title: "TOTAL (Rs)", dataKey: "lineTotal" },
    ];

    const rows = order.items.map((item) => ({
      quantity: item.quantity,
      description: item.product.name,
      unitPrice: item.product.price.toFixed(2),
      discount: item.product.discount.toString(),
      lineTotal: item.price.toFixed(2),
    }));

    autoTable(doc, {
      startY: 157,
      margin: { left: 10 },
      head: [headers.map((h) => h.title)],
      body: rows.map((row) => Object.values(row)),
      theme: "grid",
      styles: { fontSize: 11, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 20 },
        1: { cellWidth: 90 },
        2: { halign: "right", cellWidth: 24 },
        3: { halign: "center", cellWidth: 28 },
        4: { halign: "right", cellWidth: 28 },
      },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.rect(10, finalY - 10, 190, 12);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount (Rs):", 12, finalY - 2);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.totalAmount.toFixed(2)}`, 65, finalY - 2);

    doc.rect(10, finalY + 2, 190, 25);
    doc.setFont("helvetica", "bold");
    doc.text("Company Full Name", 12, finalY + 7);
    finalY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("GSTIN:", 12, finalY + 6);
    doc.text("FSSAI License Number", 100, finalY + 6);
    doc.setFont("helvetica", "normal");
    doc.text("XXXXXXXXXXXXXXX", 30, finalY + 5);
    doc.text("XXXXXXXXXXXXXX", 160, finalY + 5);

    finalY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("CIN:", 12, finalY + 8);
    doc.text("PAN:", 100, finalY + 8);
    doc.setFont("helvetica", "normal");
    doc.text("XXXXXXXXXXXXXXXXXXXXX", 30, finalY + 8);
    doc.text("XXXXXXXXXX", 160, finalY + 8);

    finalY += 10;
    doc.rect(150, finalY + 2, 50, 50);
    doc.addImage(sign, "PNG", 154, finalY + 2, 40, 40);
    doc.text("Authorised Signatory", 158, finalY + 44);
    doc.rect(10, finalY + 2, 140, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", 12, finalY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const terms = [
      "1. Payment is due within 30 days.",
      "2. Goods once sold will not be exchanged.",
      "3. Retain this invoice for future reference.",
      "4. All disputes subject to jurisdiction.",
    ];
    doc.text(terms, 12, finalY + 12, { maxWidth: 160 });

    doc.save(`${order._id}.pdf`);
    toast.success("Invoice downloaded successfully!");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-500">
        <FaSpinner className="animate-spin text-brand-500" />
        <span className="font-medium">Loading order details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card max-w-md p-8 text-center">
          <p className="text-lg font-medium text-red-600">{error || "Order not found."}</p>
          <button
            className="btn-secondary mt-4"
            onClick={() => navigate("/shopkeeper/orders")}
          >
            <FaArrowLeft />
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const isTrackable =
    (order.deliveryStatus === "Accepted" || order.deliveryStatus === "InTransit") &&
    deliveryBoyLocation;

  let destinationLatLng: google.maps.LatLngLiteral | null = null;
  if (order.deliveryStatus === "Accepted" && order.shopCoords) {
    destinationLatLng = {
      lat: order.shopCoords.latitude,
      lng: order.shopCoords.longitude,
    };
  } else if (order.deliveryStatus === "InTransit" && order.deliveryCoords) {
    destinationLatLng = {
      lat: order.deliveryCoords.latitude,
      lng: order.deliveryCoords.longitude,
    };
  }

  const mapCenter: google.maps.LatLngLiteral = {
    lat: deliveryBoyLocation?.latitude ?? (order.shopCoords?.latitude ?? 0),
    lng: deliveryBoyLocation?.longitude ?? (order.shopCoords?.longitude ?? 0),
  };

  return (
    <div className="page-container">
      <button
        onClick={() => navigate("/shopkeeper/orders")}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <FaArrowLeft />
        Back to Orders
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Order Details</h1>
          <p className="page-subtitle mt-1">Order #{order._id}</p>
        </div>
        <button onClick={handleDownloadInvoice} className="btn-primary">
          <FaDownload />
          Download Invoice
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <FaUser />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Customer
              </p>
              <p className="truncate font-semibold text-slate-900">
                {order.customerName}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FaPhone />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Phone
              </p>
              <p className="truncate font-semibold text-slate-900">
                {order.customerPhone}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FaCreditCard />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Payment
              </p>
              <p className="truncate font-semibold text-slate-900">
                {order.paymentMethod}
              </p>
              <p className="text-xs text-slate-500">{order.paymentStatus}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FaRupeeSign />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total
              </p>
              <p className="truncate font-bold text-slate-900">
                ₹{order.totalAmount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order summary + status */}
      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Order Summary</h2>
          <span
            className={`badge ${
              order.deliveryStatus === "Delivered"
                ? "badge-green"
                : order.deliveryStatus === "Cancelled"
                ? "badge-red"
                : order.deliveryStatus === "Pending"
                ? "badge-yellow"
                : "badge-blue"
            }`}
          >
            {order.deliveryStatus === "Delivered" && <FaCheckCircle />}
            {order.deliveryStatus === "InTransit" && <FaTruck />}
            {order.deliveryStatus}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Order Date
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {order.orderDate
                ? new Date(order.orderDate).toLocaleString()
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Delivery Status
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {order.deliveryStatus}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Delivery Address
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {order.deliveryAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card mt-6 overflow-hidden">
        <h2 className="border-b border-slate-100 px-4 py-4 font-semibold text-slate-900 sm:px-6">
          Items
        </h2>
        <div className="divide-y divide-slate-100">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
            >
              <div className="flex min-w-0 items-center gap-4">
                {item.product.images?.image1 ? (
                  <img
                    src={`data:${item.product.images.image1.contentType};base64,${item.product.images.image1.data}`}
                    alt={item.product.name}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover sm:h-14 sm:w-14"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 sm:h-14 sm:w-14">
                    <FaClipboardList />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.product.category} · Qty {item.quantity}
                  </p>
                  <p className="text-xs text-slate-500">
                    ₹{item.product.price} / unit
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-slate-900 sm:pl-4">
                ₹{item.price}
              </p>
            </div>
          ))}
        </div>
      </div>

      {isLoaded && !loadError && isTrackable && destinationLatLng && (
        <div className="card mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-brand-500" />
              <h2 className="font-semibold text-slate-900">Track Order</h2>
            </div>
            {timeLeft && (
              <p className="text-sm text-slate-500">
                ETA: <strong className="text-slate-900">{timeLeft}</strong>
              </p>
            )}
          </div>
          <div className="h-[300px] w-full sm:h-[400px]">
            <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={13}>
              <DirectionsService
              options={{
                origin: {
                  lat: deliveryBoyLocation!.latitude,
                  lng: deliveryBoyLocation!.longitude,
                },
                destination: destinationLatLng,
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
              label="Rider"
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
            />
            {order.deliveryStatus === "Accepted" && order.shopCoords && (
              <MarkerF
                position={{
                  lat: order.shopCoords.latitude,
                  lng: order.shopCoords.longitude,
                }}
                label="Shop"
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
              />
            )}
            {order.deliveryStatus === "InTransit" && order.deliveryCoords && (
              <MarkerF
                position={{
                  lat: order.deliveryCoords.latitude,
                  lng: order.deliveryCoords.longitude,
                }}
                label="Customer"
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
              />
            )}
            </GoogleMap>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;