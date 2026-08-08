import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchCoupons, createCoupon, deleteCoupon } from "../api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { FaTicketAlt, FaDice, FaTrash } from "react-icons/fa";

interface Coupon {
  _id: string;
  code: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  usageLimit: number;
  usageCount: number;
  expirationDate: string;
  expirationTime: string; 
  isActive: boolean;
}

const ManageCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [formValues, setFormValues] = useState({
    code: "",
    discountType: "flat",
    discountValue: 0,
    usageLimit: 1,
    expirationDate: "",
    expirationTime: "", // In HH:mm format
  });
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  useEffect(() => {
    fetchAllCoupons();
  }, []);

  const fetchAllCoupons = async () => {
    try {
      const data = await fetchCoupons();
      setCoupons(data);
    } catch {
      toast.error("Failed to fetch coupons.");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const { code, discountType, discountValue, usageLimit, expirationDate, expirationTime } = formValues;

    if (!code || !discountValue || !usageLimit || !expirationDate || !expirationTime) {
      toast.error("All fields are required.");
      return;
    }

    if (discountValue <= 0) {
      toast.error("Discount value must be greater than 0.");
      return;
    }

    if (discountType === "percentage" && discountValue > 98) {
      toast.error("Percentage discount cannot exceed 98%.");
      return;
    }

    const [hours, minutes] = expirationTime.split(":").map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      toast.error("Invalid expiration time. Use HH:mm format.");
      return;
    }

    try {
      await createCoupon(formValues);
      toast.success("Coupon created successfully!");
      setFormValues({
        code: "",
        discountType: "flat",
        discountValue: 0,
        usageLimit: 1,
        expirationDate: "",
        expirationTime: "",
      });
      fetchAllCoupons();
    } catch {
      toast.error("Failed to create coupon.");
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setDeleteTarget(null);

    try {
      await deleteCoupon(id);
      toast.success("Coupon deleted successfully!");
      fetchAllCoupons();
    } catch {
      toast.error("Failed to delete coupon.");
    }
  };

  const generateRandomCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const codeLength = 8;
    let randomCode = "";
    for (let i = 0; i < codeLength; i++) {
      randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormValues({ ...formValues, code: randomCode });
    toast.success("Coupon code generated successfully!");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Manage Coupons"
        subtitle="Create and manage discount coupons for customers"
      />

      <Card title="Create New Coupon" className="mb-6">
        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Coupon Code" required className="sm:col-span-2">
            <div className="flex gap-2">
              <Input
                type="text"
                name="code"
                value={formValues.code}
                onChange={handleInputChange}
                placeholder="Enter coupon code"
                className="flex-1"
              />
              <Button variant="secondary" type="button" onClick={generateRandomCode}>
                <FaDice size={14} /> Generate
              </Button>
            </div>
          </Field>

          <Field label="Discount Type" required>
            <select
              name="discountType"
              value={formValues.discountType}
              onChange={handleInputChange}
              className="input-base"
            >
              <option value="flat">Flat Discount</option>
              <option value="percentage">Percentage Discount</option>
            </select>
          </Field>

          <Field label="Discount Value" required>
            <Input
              type="number"
              name="discountValue"
              value={formValues.discountValue}
              onChange={handleInputChange}
              placeholder="Enter discount value"
              prefix="₹"
            />
          </Field>

          <Field label="Usage Limit" required>
            <Input
              type="number"
              name="usageLimit"
              value={formValues.usageLimit}
              onChange={handleInputChange}
              placeholder="Enter usage limit"
            />
          </Field>

          <Field label="Expiration Date" required>
            <Input
              type="date"
              name="expirationDate"
              value={formValues.expirationDate}
              onChange={handleInputChange}
            />
          </Field>

          <Field label="Expiration Time" required>
            <Input
              type="time"
              name="expirationTime"
              value={formValues.expirationTime}
              onChange={handleInputChange}
            />
          </Field>

          <div className="sm:col-span-2">
            <Button variant="success" type="submit">
              <FaTicketAlt size={14} /> Create Coupon
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 tracking-tight">
          Coupons
        </h2>
        {coupons.length === 0 ? (
          <EmptyState message="No coupons available." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <Card
                key={coupon._id}
                className="transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-lg font-bold text-indigo-600 tracking-tight">
                      {coupon.code}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {coupon.discountType === "flat"
                        ? `Flat ₹${coupon.discountValue}`
                        : `${coupon.discountValue}% off`}
                    </p>
                  </div>
                  <Badge tone={coupon.isActive ? "success" : "neutral"}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  <p>
                    Usage:{" "}
                    <span className="font-semibold text-slate-800">
                      {coupon.usageCount}/{coupon.usageLimit}
                    </span>
                  </p>
                  <p>
                    Expires on{" "}
                    <span className="font-semibold text-slate-800">
                      {new Date(coupon.expirationDate).toLocaleDateString()}
                    </span>{" "}
                    at {coupon.expirationTime}
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget(coupon)}
                  >
                    <FaTrash size={12} /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this coupon?"
        message={`Are you sure you want to delete coupon "${deleteTarget?.code}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCoupon}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ManageCoupons;
