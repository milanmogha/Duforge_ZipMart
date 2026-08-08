import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { FaStore, FaTruck, FaEye } from "react-icons/fa";

interface Shop {
  _id: string;
  ownerName: string;
  shopName: string;
  email: string;
  phone: string;
  location: string;
  status: string;
}

interface DeliveryBoy {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

const Accounts: React.FC = () => {
  const [pendingShops, setPendingShops] = useState<Shop[]>([]);
  const [pendingDeliveryBoys, setPendingDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const response = await api.get("/account-requests");
      setPendingShops(response.data.pendingShops);
      setPendingDeliveryBoys(response.data.pendingDeliveryBoys);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error fetching account requests");
    }
  };

  const handleApproveShop = async (id: string) => {
    try {
      await api.put(`/shop/approve/${id}`);
      setPendingShops((prev) => prev.filter((shop) => shop._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Error approving shop");
    }
  };

  const handleRejectShop = async (id: string) => {
    try {
      await api.delete(`/shop/${id}`);
      setPendingShops((prev) => prev.filter((shop) => shop._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Error rejecting shop");
    }
  };

  const handleApproveDeliveryBoy = async (id: string) => {
    try {
      await api.put(`/deliveryboy/approve/${id}`);
      setPendingDeliveryBoys((prev) => prev.filter((db) => db._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Error approving delivery boy");
    }
  };

  const handleRejectDeliveryBoy = async (id: string) => {
    try {
      await api.delete(`/deliveryboy/${id}`);
      setPendingDeliveryBoys((prev) => prev.filter((db) => db._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Error rejecting delivery boy");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Accounts"
        subtitle="Approve or reject pending shopkeeper and delivery partner accounts"
        actions={
          <>
            <Button variant="primary" onClick={() => navigate("/shops/create")}>
              <FaStore size={14} /> Create Shopkeeper
            </Button>
            <Button variant="success" onClick={() => navigate("/delivery-partners/create")}>
              <FaTruck size={14} /> Create Delivery Boy
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Pending Shops */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 tracking-tight">
          Pending Shops
        </h2>
        {pendingShops.length > 0 ? (
          <DataTable
            columns={["Owner Name", "Shop Name", "Email", "Phone", "Status", "Actions"]}
          >
            {pendingShops.map((shop) => (
              <tr key={shop._id} className="transition-colors hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {shop.ownerName}
                </td>
                <td className="px-4 py-3 text-slate-600">{shop.shopName}</td>
                <td className="px-4 py-3 text-slate-600">{shop.email}</td>
                <td className="px-4 py-3 text-slate-600">{shop.phone}</td>
                <td className="px-4 py-3">
                  <Badge tone="warning">Pending</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveShop(shop._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectShop(shop._id)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/shops/${shop._id}`)}
                    >
                      <FaEye size={12} /> View
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState message="No pending shop requests." />
        )}
      </div>

      {/* Pending Delivery Boys */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 tracking-tight">
          Pending Delivery Boys
        </h2>
        {pendingDeliveryBoys.length > 0 ? (
          <DataTable
            columns={["Name", "Email", "Phone", "Address", "Status", "Actions"]}
          >
            {pendingDeliveryBoys.map((db) => (
              <tr key={db._id} className="transition-colors hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{db.name}</td>
                <td className="px-4 py-3 text-slate-600">{db.email}</td>
                <td className="px-4 py-3 text-slate-600">{db.phone}</td>
                <td className="px-4 py-3 text-slate-600">{db.address}</td>
                <td className="px-4 py-3">
                  <Badge tone="warning">Pending</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApproveDeliveryBoy(db._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRejectDeliveryBoy(db._id)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/delivery-partners/${db._id}`)}
                    >
                      <FaEye size={12} /> View
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <EmptyState message="No pending delivery boy requests." />
        )}
      </div>
    </div>
  );
};

export default Accounts;
