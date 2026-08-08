import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById, getRatingByOrderId, Order as ApiOrder, OrderItem as ApiOrderItem } from "../api";
import { toast } from "react-toastify";
import { FaStar, FaArrowLeft, FaDownload, FaMapMarkerAlt } from "react-icons/fa";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Socket } from "socket.io-client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import explicitly
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Loading from "../components/ui/Loading";

// Map container style for Google Maps
const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

interface AdminOrderDetailsProps {
  socket: Socket | null;
}

type Coordinates = {
  latitude: number;
  longitude: number;
};

// Extend the API Order type with additional admin-only fields.
// We remove the items property from ApiOrder and replace it with one that uses the API’s OrderItem.
// (The API’s OrderItem already includes the discount property if declared there.)
type AdminOrder = Omit<ApiOrder, "items"> & {
  invoiceAvailable: boolean;
  shopId: string;
  shopName: string;
  shopAddress: string;
  shopGstNumber: string;
  items: ApiOrderItem[];
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  deliveryStatus: string;
  customerName: string;
  customerPhone: string;
    // shop info
    phone: string;            // ← shop phone
    gstNumber: string;        // ← shop GST
    location: string;         // ← shop address

  
    // fees & earnings
    platformFee: number;
    deliveryFee: number;
    deliveryBoyEarning: number;
  shopCoords?: Coordinates;
  customerCoords?: Coordinates;
  orderDate: string;
  updatedAt: string;
  review?: string;
};

const AdminOrderDetails: React.FC<AdminOrderDetailsProps> = ({ socket }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<{ rating: number; review?: string } | null>(null);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<Coordinates | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<any>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!orderId) {
          setError("No order ID provided.");
          return;
        }
        // First cast to unknown then to AdminOrder to bypass type conflicts.
        const fetchedOrder = (await getOrderById(orderId)) as unknown as AdminOrder;
        setOrder(fetchedOrder);

        const fetchedRating = await getRatingByOrderId(orderId);
        setRating({
          rating: fetchedRating.rating !== undefined ? fetchedRating.rating : 0,
          review: fetchedRating.reviewComment,
        });
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || "Failed to fetch order details.";
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    // Load delivery boy's last known location from local storage
    const storedLocation = localStorage.getItem("deliveryBoyLocation");
    if (storedLocation) {
      setDeliveryBoyLocation(JSON.parse(storedLocation));
    }

    // Real-time socket updates
    if (socket) {
      socket.on("location-update", (locationUpdate) => {
        if (locationUpdate.orderId === orderId) {
          setDeliveryBoyLocation(locationUpdate.deliveryBoyLocation);
          localStorage.setItem("deliveryBoyLocation", JSON.stringify(locationUpdate.deliveryBoyLocation));
          toast.info("Delivery boy's location updated.");
        }
      });

      socket.on("order-updated", (updatedOrder: AdminOrder) => {
        if (updatedOrder._id === orderId) {
          setOrder(updatedOrder);
          toast.info("Order status updated in real-time.");
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("location-update");
        socket.off("order-updated");
      }
    };
  }, [orderId, socket]);

  // Callback for directions service
  const directionsCallback = (response: any) => {
    if (response !== null && response.status === "OK") {
      setDirectionsResponse(response);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;

    const doc = new jsPDF();
    const logo = "https://i.imgur.com/VrYvKzb.png"; // Ensure this path is correct
    const sign = "https://i.imgur.com/zd0au5U.png";

    // Invoice Header
    doc.rect(10, 10, 190, 25);
    doc.addImage(logo, "PNG", 10, 10, 70, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor("#000000");
    doc.text("Tax Invoice", 188, 25, { align: "right" });
    // Shop Information Section
    doc.rect(10, 35, 115, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor("#000000");
    doc.text(`Sold By (Shop): ${order.shopName}`, 12, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Phone: ${order.phone || ""}`, 12, 50);
    doc.text(`Address: ${order.location || ""}`, 12, 57);

    // Order Information Section
    doc.rect(125, 35, 75, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor("#000000");
    doc.text(`Order Id: ${order._id}`, 126, 40, { maxWidth: 50 });
    doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 126, 50);

    // GST Information Section
    doc.rect(10, 85, 190, 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor("#000000");
    doc.text(`GST Number: ${order.gstNumber || ""}`, 12, 90);

    // Customer Information Section
    doc.rect(10, 92, 190, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor("#000000");
    doc.text("Name:", 12, 97);
    doc.text("Phone:", 12, 103);
    doc.text("Address:", 12, 108);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.customerName}`, 45, 97);
    doc.text(`${order.customerPhone}`, 45, 103);
    doc.text(`${order.deliveryAddress}`, 45, 108, { maxWidth: 100 });

    // Item Details Table
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
      // discount is now available on the product as declared in the API type
      discount: (item.product.discount || 0).toString(),
      lineTotal: item.price.toFixed(2),
    }));

    autoTable(doc, {
      startY: 142,
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

    // Total Amount Section
    doc.rect(10, finalY - 10, 190, 35);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal (Rs):", 12, finalY - 2);
    doc.text("Platform Fee (Rs):", 12, finalY + 4 );
    doc.text("Delivery Fee(Rs):", 12, finalY + 10);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount(Rs):", 12, finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.totalAmount}`, 60, finalY - 2);
    doc.text(`${order.platformFee}`, 60, finalY + 4);
    doc.text(`${order.deliveryFee}`, 60, finalY + 10);
    doc.text(`${((order.totalAmount) +  (order.platformFee) +  (order.deliveryFee)).toFixed(2)}`, 60, finalY + 20);

    // Company Details Section
    doc.rect(10, finalY + 25, 190, 35);
    doc.setFont("helvetica", "bold");
    doc.text("BELLYBASKET ECOMMERCE PRIVATE LIMITED", 12, finalY + 35);
     finalY += 45;
    doc.setFont("helvetica", "bold");
    doc.text("GSTIN:", 12, finalY + 6);
    doc.text("FSSAI License Number", 100, finalY + 6);
    doc.setFont("helvetica", "normal");
    doc.text("XXXXXXXXXXXXXXX", 30, finalY + 6);
    doc.text("21525056001320", 160, finalY + 6);

    finalY += 5;
    doc.setFont("helvetica", "bold");
    doc.text("CIN:", 12, finalY + 8);
    doc.text("PAN:", 100, finalY + 8);
    doc.setFont("helvetica", "normal");
    doc.text("U47910PN2024PTC231408", 30, finalY + 8);
    doc.text("AAMCB6406A", 160, finalY + 8);

    // Signature and Terms Section
    finalY += 10;
    // Draw signature box and add signature image
    doc.rect(150, finalY , 50, 60);
    doc.addImage(sign, "PNG", 154, finalY + 2, 40, 50);
    doc.text("Authorised Signatory", 158, finalY + 54);
    // Draw terms & conditions box
    doc.rect(10, finalY , 140, 60);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", 12, finalY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const terms = [
      "1. Payment can remain due at most a week.",
      "",
      "2. Goods once sold will not be exchanged or refunded.",
      "",
      "3. Retain this invoice for future reference.",
      "",
      "4. All disputes subject to jurisdiction.",
      "",
      "5. All the goods sold are inclusive of taxes",
      "",
      "6. All items are eligible for return up to 7 Days"
    ];
    doc.text(terms, 12, finalY + 15, { maxWidth: 160 });

    // Save PDF and show success message
    doc.save(`${order._id}.pdf`);
    toast.success("Invoice downloaded successfully!");
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case "Delivered":
        return "success";
      case "Pending":
        return "danger";
      case "InTransit":
      case "Accepted":
        return "info";
      case "Cancelled":
        return "neutral";
      case "Rejected":
        return "warning";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return <Loading fullPage label="Loading order details..." />;
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg font-medium text-red-600">{error || "Order not found."}</p>
        <Button
          className="mt-4"
          onClick={() => navigate("/orders")}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <button
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
        onClick={() => navigate("/orders")}
      >
        <FaArrowLeft size={14} /> Back to Orders
      </button>

      <PageHeader
        title="Order Details"
        subtitle={`Order ${order._id}`}
        actions={
          <Badge tone={getStatusTone(order.deliveryStatus) as any}>
            {order.deliveryStatus}
          </Badge>
        }
      />

      {/* Real-Time Map with Markers and Route */}
      {(order.deliveryStatus === "Accepted" || order.deliveryStatus === "InTransit") && (
        <Card title="Real-Time Tracking" subtitle="Delivery boy location and route" className="mb-6">
          {deliveryBoyLocation ? (
            <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
              <GoogleMap
                onLoad={(map) => {
                  const bounds = new window.google.maps.LatLngBounds();
                  if (deliveryBoyLocation) {
                    bounds.extend(
                      new window.google.maps.LatLng(
                        deliveryBoyLocation.latitude,
                        deliveryBoyLocation.longitude
                      )
                    );
                  }
                  if (order.shopCoords) {
                    bounds.extend(
                      new window.google.maps.LatLng(
                        order.shopCoords.latitude,
                        order.shopCoords.longitude
                      )
                    );
                  }
                  if (order.customerCoords) {
                    bounds.extend(
                      new window.google.maps.LatLng(
                        order.customerCoords.latitude,
                        order.customerCoords.longitude
                      )
                    );
                  }
                  map.fitBounds(bounds);
                }}
                mapContainerStyle={mapContainerStyle}
              >
                <Marker
                  position={{
                    lat: deliveryBoyLocation.latitude,
                    lng: deliveryBoyLocation.longitude,
                  }}
                  label="Delivery Boy"
                />
                {order.shopCoords && (
                  <Marker
                    position={{
                      lat: order.shopCoords.latitude,
                      lng: order.shopCoords.longitude,
                    }}
                    label="Shop"
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    }}
                  />
                )}
                {order.customerCoords && (
                  <Marker
                    position={{
                      lat: order.customerCoords.latitude,
                      lng: order.customerCoords.longitude,
                    }}
                    label="Customer"
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                    }}
                  />
                )}

                {/* Render route if all coordinates are available */}
                {deliveryBoyLocation && order.shopCoords && order.customerCoords && (
                  <>
                    <DirectionsService
                      options={{
                        origin: {
                          lat: deliveryBoyLocation.latitude,
                          lng: deliveryBoyLocation.longitude,
                        },
                        destination: {
                          lat: order.customerCoords.latitude,
                          lng: order.customerCoords.longitude,
                        },
                        travelMode: "DRIVING" as google.maps.TravelMode,
                        waypoints: [
                          {
                            location: {
                              lat: order.shopCoords.latitude,
                              lng: order.shopCoords.longitude,
                            },
                          },
                        ],
                      }}
                      callback={directionsCallback}
                    />
                    {directionsResponse && (
                      <DirectionsRenderer
                        options={{
                          directions: directionsResponse,
                        }}
                      />
                    )}
                  </>
                )}
              </GoogleMap>
            </LoadScript>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-6 text-sm text-slate-500">
              <FaMapMarkerAlt className="text-slate-400" />
              Delivery boy's location is not available.
            </div>
          )}
        </Card>
      )}

      {/* Order Summary */}
      <Card title="Order Summary" className="mb-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Order ID
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-700">
              {order._id}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Shop Name
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">
              {order.shopName}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Shop Phone Number
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">
              {order.phone}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Shop ID
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-700">
              {order.shopId}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Shop GST No.
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">
              {order.gstNumber}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Delivery Status
            </dt>
            <dd className="mt-1">
              <Badge tone={getStatusTone(order.deliveryStatus) as any}>
                {order.deliveryStatus}
              </Badge>
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Order Date
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">
              {new Date(order.orderDate).toLocaleString()}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Payment Method
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">
              {order.paymentMethod}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Payment Status
            </dt>
            <dd className="mt-1">
              <Badge tone={order.paymentStatus === "Paid" ? "success" : "warning"}>
                {order.paymentStatus}
              </Badge>
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Delivery Address
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">
              {order.deliveryAddress}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Customer
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800">
              {order.customerName} ({order.customerPhone})
            </dd>
          </div>
        </dl>
        <div className="mt-5">
          <Button variant="primary" onClick={handleDownloadInvoice}>
            <FaDownload size={14} /> Download Invoice
          </Button>
        </div>
      </Card>

      {/* Items List */}
      <Card title="Items" className="mb-6">
        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-4">
                {item.product.images?.image1 ? (
                  <img
                    src={`data:${item.product.images.image1.contentType};base64,${item.product.images.image1.data}`}
                    alt={item.product.name}
                    className="h-14 w-14 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-slate-100" />
                )}
                <div>
                  <p className="font-medium text-slate-800">{item.product.name}</p>
                  <p className="text-sm text-slate-500">
                    Category: {item.product.category}
                  </p>
                  <p className="text-sm text-slate-500">Quantity: {item.quantity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-800">
                  ₹{item.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Invoice Summary */}
      <Card title="Invoice Summary" className="mb-6">
        <dl className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-sm font-medium text-slate-500">Amount</dt>
            <dd className="text-base font-semibold text-slate-800">
              ₹{order.totalAmount}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-sm font-medium text-slate-500">Platform Fee</dt>
            <dd className="text-base font-semibold text-slate-800">
              ₹{order.platformFee}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <dt className="text-sm font-medium text-slate-500">Delivery Fee</dt>
            <dd className="text-base font-semibold text-slate-800">
              ₹{order.deliveryFee}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-4">
            <dt className="text-sm font-semibold text-indigo-700">Total Amount</dt>
            <dd className="text-lg font-bold text-indigo-700">
              ₹{(
                (order.totalAmount ?? 0) +
                (order.platformFee ?? 0) +
                (order.deliveryFee ?? 0)
              ).toFixed(2)}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Ratings Section */}
      {rating && (
        <Card title="Rating" subtitle="Customer feedback for this order">
          <div className="flex items-center mb-4">
            {Array.from({ length: 5 }, (_, i) => (
              <FaStar
                key={i}
                className={`text-xl ${i < (rating.rating || 0) ? "text-amber-400" : "text-slate-200"}`}
              />
            ))}
          </div>
          {rating.review && <p className="text-sm text-slate-600">Review: {rating.review}</p>}
        </Card>
      )}
    </div>
  );
};

export default AdminOrderDetails;
