import React from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";

interface OrderSuccessProps {
  savedAmount: number;
  onClose: () => void;
}

const OrderSuccess: React.FC<OrderSuccessProps> = ({ savedAmount, onClose }) => {
  const navigate = useNavigate();

  const handleViewOrders = () => {
    onClose();
    navigate("/orders");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card w-full max-w-sm text-center">
        <FiCheckCircle className="mx-auto mb-4 text-brand-500" size={56} />
        <h2 className="mb-2 text-xl font-extrabold text-gray-900">
          Order Placed Successfully!
        </h2>
        {savedAmount > 0 && (
          <p className="mb-2 text-sm text-gray-600">
            You saved{" "}
            <span className="font-bold text-brand-600">
              ₹{savedAmount.toFixed(2)}
            </span>{" "}
            on this order.
          </p>
        )}
        <button onClick={handleViewOrders} className="btn-primary mt-4 w-full">
          View Orders
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;
