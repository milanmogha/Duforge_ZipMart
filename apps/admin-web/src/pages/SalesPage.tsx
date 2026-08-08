import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

const SalesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sales, setSales] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch sales for the shop
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await api.get(`/shop/${id}/sales`);
        setSales(response.data);
      } catch {
        setError("Error fetching sales data");
      }
    };

    fetchSales();
  }, [id]);

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (sales.length === 0) {
    return <p className="text-center">No sales data available for this shop.</p>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Shop Sales</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sales.map((sale) => (
          <div
            key={sale._id}
            className="p-4 border rounded-md shadow-md flex flex-col items-start"
          >
            <p className="text-gray-600">
              <strong>Date:</strong> {new Date(sale.date).toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              <strong>Amount:</strong> ₹{sale.amount}
            </p>
            <p className="text-gray-600">
              <strong>Items Sold:</strong> {sale.itemsSold}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesPage;
