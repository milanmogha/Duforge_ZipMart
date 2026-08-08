import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSignOutAlt } from "react-icons/fa";
import { getProfile, DeliveryBoyProfile } from "../api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Loading from "../components/ui/Loading";
import ConfirmDialog from "../components/ui/ConfirmDialog";

interface ProfileProps {
  setToken: (token: string | null) => void;
}

const Profile: React.FC<ProfileProps> = ({ setToken }) => {
  const [profile, setProfile] = useState<DeliveryBoyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to fetch profile:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    localStorage.removeItem("deliveryToken");
    localStorage.removeItem("deliveryBoyId");
    setToken(null);
    toast.info("Logged out.");
    navigate("/login", { replace: true });
  };

  if (loading) return <Loading fullPage label="Loading profile..." />;

  const fields = [
    { label: "Name", value: profile?.name, icon: FaUser },
    { label: "Email", value: profile?.email, icon: FaEnvelope },
    { label: "Phone", value: profile?.phone, icon: FaPhone },
    { label: "Address", value: profile?.address || "—", icon: FaMapMarkerAlt },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FaUser size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile</h1>
          <p className="text-sm text-gray-500">Your delivery partner account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Account Details">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <FaUser size={26} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{profile?.name || "Delivery Partner"}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>

          <dl className="space-y-4">
            {fields.map((field) => (
              <div
                key={field.label}
                className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <field.icon className="text-gray-400" size={14} />
                  {field.label}
                </dt>
                <dd className="text-right text-sm font-semibold text-gray-800">{field.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Session">
          <p className="mb-4 text-sm text-gray-500">
            Sign out of this device when you're done. Your orders and earnings remain on your
            account.
          </p>
          <Button variant="danger" onClick={() => setShowLogoutConfirm(true)}>
            <FaSignOutAlt size={15} /> Logout
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default Profile;
