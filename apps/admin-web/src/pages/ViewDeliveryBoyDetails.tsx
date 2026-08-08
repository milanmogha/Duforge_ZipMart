import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Loading from "../components/ui/Loading";
import {
  FaTruck,
  FaTrash,
  FaArrowLeft,
  FaBoxOpen,
} from "react-icons/fa";

const ViewDeliveryBoyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [deliveryBoy, setDeliveryBoy] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeliveryBoyDetails = async () => {
      try {
        const response = await api.get(`/deliveryboy/${id}`);
        setDeliveryBoy(response.data);
      } catch {
        setError("Error fetching delivery boy details");
      }
    };

    fetchDeliveryBoyDetails();
  }, [id]);

  const handleDelete = async () => {
    setConfirmOpen(false);

    try {
      await api.delete(`/deliveryboy/${id}`);
      alert("Delivery boy deleted successfully");
      navigate("/delivery-partners");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error deleting delivery boy");
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

  if (!deliveryBoy) {
    return <Loading fullPage label="Loading delivery boy details..." />;
  }

  const fields = [
    { label: "Name", value: deliveryBoy.name },
    { label: "Email", value: deliveryBoy.email },
    { label: "Phone", value: deliveryBoy.phone },
    { label: "Address", value: deliveryBoy.address },
  ];

  return (
    <div className="p-4 sm:p-6">
      <button
        onClick={() => navigate("/delivery-partners")}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <FaArrowLeft size={14} /> Back to Delivery Partners
      </button>

      <PageHeader
        title={deliveryBoy.name}
        subtitle="Delivery partner details and verification documents"
        actions={
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            <FaTrash size={14} /> Delete
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic details */}
        <Card title="Delivery Boy Information" subtitle="Contact details">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FaTruck size={26} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {deliveryBoy.name}
              </p>
              <p className="text-sm text-slate-400">{deliveryBoy.phone}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-4">
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
        <Card title="Verification Documents" subtitle="ID proof uploaded by the partner">
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-500">
                Aadhar Card
              </p>
              {deliveryBoy.idProof?.aadhar?.data ? (
                <img
                  src={`data:${deliveryBoy.idProof.aadhar.contentType};base64,${deliveryBoy.idProof.aadhar.data}`}
                  alt="Aadhar Card"
                  className="w-full max-w-sm rounded-lg border border-slate-200 shadow-sm"
                />
              ) : (
                <p className="text-sm text-slate-400">No Aadhar Photo</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-500">
                Driving Licence
              </p>
              {deliveryBoy.idProof?.drivingLicence?.data ? (
                <img
                  src={`data:${deliveryBoy.idProof.drivingLicence.contentType};base64,${deliveryBoy.idProof.drivingLicence.data}`}
                  alt="Driving Licence"
                  className="w-full max-w-sm rounded-lg border border-slate-200 shadow-sm"
                />
              ) : (
                <p className="text-sm text-slate-400">
                  No Driving Licence Photo
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="primary"
          onClick={() => navigate(`/delivery-partners/${id}/delivered-orders`)}
        >
          <FaBoxOpen size={14} /> View Delivered Orders
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this delivery boy?"
        message="Are you sure you want to delete this delivery boy? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ViewDeliveryBoyDetails;
