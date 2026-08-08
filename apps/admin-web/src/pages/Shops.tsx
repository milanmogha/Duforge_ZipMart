import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { FaStore, FaSearch } from "react-icons/fa";
import { SOCKET_URL } from "@zipmart/shared";

const Shops: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [filteredShops, setFilteredShops] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Establish socket connection for real-time updates
  useEffect(() => {
    const socket = io(SOCKET_URL); // Ensure the correct backend server URL

    // Listen for shop updates
    socket.on("shopUpdatedOrAdded", (updatedShop) => {
      setShops((prevShops) => {
        const existingShop = prevShops.find(
          (shop) => shop._id === updatedShop._id
        );
        if (existingShop) {
          // Update existing shop
          return prevShops.map((shop) =>
            shop._id === updatedShop._id ? updatedShop : shop
          );
        } else {
          // Add new shop
          return [...prevShops, updatedShop];
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch initial shops data
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await api.get("/shop");
        setShops(response.data);
        setFilteredShops(response.data); // Initialize filteredShops with the full list
      } catch (err: any) {
        console.error("Error fetching shops:", err);
        setError("Error fetching shops. Please try again.");
      }
    };

    fetchShops();
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Filter shops based on the query
    const filtered = shops.filter(
      (shop) =>
        shop.shopName.toLowerCase().includes(query.toLowerCase()) ||
        shop.ownerName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredShops(filtered);
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Shops"
        subtitle="All registered shops on the ZipMart platform"
        actions={
          <Link to="/shops/create">
            <Button variant="primary">Create Shop</Button>
          </Link>
        }
      />

      {/* Search Input */}
      <div className="relative mb-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by shop name or owner name"
          className="input-base pl-10"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {filteredShops.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShops.map((shop) => (
            <Card
              key={shop._id}
              className="transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FaStore size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-800 tracking-tight">
                    {shop.shopName}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    <span className="font-medium">Owner:</span>{" "}
                    {shop.ownerName}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Link to={`/shops/${shop._id}`}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="No shops found." />
      )}
    </div>
  );
};

export default Shops;
