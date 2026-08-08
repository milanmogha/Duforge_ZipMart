import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Loading from "../components/ui/Loading";
import { FaTrash, FaBoxOpen, FaArrowLeft } from "react-icons/fa";

const ViewShopDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const response = await api.get(`/shop/${id}`);
        setShop(response.data);
      } catch {
        setError("Error fetching shop details");
      }
    };

    fetchShopDetails();
  }, [id]);

  const handleDelete = async () => {
    setConfirmOpen(false);

    try {
      await api.delete(`/shop/${id}`);
      alert("Shop deleted successfully");
      navigate("/shops");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error deleting shop");
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!shop) {
    return <Loading fullPage label="Loading shop details..." />;
  }

  const fields = [
    { label: "Owner Name", value: shop.ownerName },
    { label: "Shop Name", value: shop.shopName },
    { label: "Email", value: shop.email },
    { label: "Phone", value: shop.phone },
    { label: "Location", value: shop.location },
    { label: "Aadhar Number", value: shop.aadharNumber },
    { label: "GST Number", value: shop.gstNumber },
  ];

  return (
    <div className="p-4 sm:p-6">
      <button
        onClick={() => navigate("/shops")}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <FaArrowLeft size={14} /> Back to Shops
      </button>

      <PageHeader
        title={shop.shopName}
        subtitle="Shop details and verification documents"
        actions={
          <Button
            variant="danger"
            onClick={() => setConfirmOpen(true)}
          >
            <FaTrash size={14} /> Delete Shop
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic details */}
        <Card
          title="Shop Information"
          subtitle="Contact and registration details"
        >
          <dl className="space-y-4">
            {fields.map((field) => (
              <div
                key={field.label}
                className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-sm font-medium text-slate-500">
                  {field.label}
                </dt>
                <dd className="text-right text-sm font-semibold text-slate-800">
                  {field.value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Documents */}
        <Card title="Verification Documents" subtitle="ID proof uploaded by the owner">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-500">
                Aadhar Card
              </p>
              {shop.idProof?.aadharCard?.data ? (
                <img
                  src={`data:${shop.idProof.aadharCard.contentType};base64,${shop.idProof.aadharCard.data}`}
                  alt="Aadhar Card"
                  className="w-full max-w-sm rounded-lg border border-slate-200 shadow-sm"
                />
              ) : (
                <p className="text-sm text-slate-400">No Aadhar Card Photo</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-500">
                GST Proof
              </p>
              {shop.idProof?.gstProof?.data ? (
                <img
                  src={`data:${shop.idProof.gstProof.contentType};base64,${shop.idProof.gstProof.data}`}
                  alt="GST Proof"
                  className="w-full max-w-sm rounded-lg border border-slate-200 shadow-sm"
                />
              ) : (
                <p className="text-sm text-slate-400">No GST Proof Photo</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="primary"
          onClick={() => navigate(`/shops/${id}/products`)}
        >
          <FaBoxOpen size={14} /> View Products
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this shop?"
        message="Are you sure you want to delete this shop? This action cannot be undone."
        confirmLabel="Delete Shop"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ViewShopDetails;
