import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Socket } from "socket.io-client";
import api from "../api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { FaTruck, FaSearch, FaUserPlus } from "react-icons/fa";

interface DeliveryPartnersProps {
  socket: Socket | null;
}

const DeliveryPartners: React.FC<DeliveryPartnersProps> = ({ socket }) => {
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(""); // Search term state
  const [filteredPartners, setFilteredPartners] = useState<any[]>([]); // Filtered delivery partners

  useEffect(() => {
    fetchDeliveryPartners();

    if (socket) {
      socket.on("deliveryPartner:update", (updatedPartners: any[]) => {
        setDeliveryPartners(updatedPartners);
        setFilteredPartners(updatedPartners); // Update filtered data as well
      });

      return () => {
        socket.off("deliveryPartner:update");
      };
    }
  }, [socket]);

  useEffect(() => {
    // Filter delivery partners based on search term
    const filtered = deliveryPartners.filter((partner) =>
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPartners(filtered);
  }, [searchTerm, deliveryPartners]);

  const fetchDeliveryPartners = async () => {
    try {
      const response = await api.get("/deliveryboy");
      setDeliveryPartners(response.data);
      setFilteredPartners(response.data); // Set filtered data initially
    } catch (error) {
      console.error("Error fetching delivery partners:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Delivery Partners"
        subtitle="Manage delivery personnel on the ZipMart platform"
        actions={
          <Link to="/delivery-partners/create">
            <Button variant="primary">
              <FaUserPlus size={14} /> Create Delivery Boy
            </Button>
          </Link>
        }
      />

      {/* Search Input */}
      <div className="relative mb-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-base pl-10"
        />
      </div>

      {/* Delivery Partners Grid */}
      {filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPartners.map((partner) => (
            <Card
              key={partner._id}
              className="flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FaTruck size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-800 tracking-tight">
                      {partner.name}
                    </h2>
                    <p className="text-xs text-slate-400">{partner.phone}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  <span className="font-medium">Address:</span>{" "}
                  {partner.address}
                </p>
              </div>
              <div className="mt-4">
                <Link to={`/delivery-partners/${partner._id}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState message="No delivery partners found." />
      )}
    </div>
  );
};

export default DeliveryPartners;
