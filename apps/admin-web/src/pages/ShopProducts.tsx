import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { Socket } from "socket.io-client";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { FaSearch, FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  discount: number;
  details: string;
  images: {
    image1?: { data: string; contentType: string };
    image2?: { data: string; contentType: string };
    image3?: { data: string; contentType: string };
    image4?: { data: string; contentType: string };
    image5?: { data: string; contentType: string };
  };
}

interface ShopProductsProps {
  socket: Socket | null;
}

const ShopProducts: React.FC<ShopProductsProps> = ({ socket }) => {
  const { id: shopkeeperId } = useParams<{ id: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();

    if (socket && shopkeeperId) {
      socket.on(`product:updated:${shopkeeperId}`, (updatedProduct: Product) => {
        setProducts((prevProducts) => {
          const existingProductIndex = prevProducts.findIndex((p) => p._id === updatedProduct._id);
          if (existingProductIndex > -1) {
            const updatedProducts = [...prevProducts];
            updatedProducts[existingProductIndex] = updatedProduct;
            return updatedProducts;
          }
          return [...prevProducts, updatedProduct];
        });
      });

      socket.on(`product:deleted:${shopkeeperId}`, (deletedProductId: string) => {
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== deletedProductId)
        );
      });

      return () => {
        socket.off(`product:updated:${shopkeeperId}`);
        socket.off(`product:deleted:${shopkeeperId}`);
      };
    }
  }, [socket, shopkeeperId]);

  useEffect(() => {
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/products/shop/${shopkeeperId}`);
      setProducts(response.data);
      setFilteredProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    navigate(`/shops/${shopkeeperId}/edit-product`, { state: { product } });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const productId = deleteTarget._id;
    setDeleteTarget(null);

    try {
      await api.delete(`/products/delete/${productId}`);
      setProducts(products.filter((product) => product._id !== productId));
      alert("Product deleted successfully.");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const renderPrice = (price: number, discount: number) => {
    const discountedPrice = price - (price * discount) / 100;

    if (discount > 0) {
      return (
        <div>
          <span className="text-lg font-bold text-emerald-600">
            ₹{discountedPrice.toFixed(2)}
          </span>{" "}
          <span className="text-sm text-slate-400 line-through">
            ₹{price.toFixed(2)}
          </span>
        </div>
      );
    }

    return (
      <span className="text-lg font-bold text-slate-800">
        ₹{price.toFixed(2)}
      </span>
    );
  };

  const renderImage = (image?: { data: string; contentType: string }) => {
    if (image && image.data) {
      return `data:${image.contentType};base64,${image.data}`;
    }
    return "/placeholder-image.png";
  };

  const renderStock = (stock: number) => {
    if (stock <= 0) {
      return <Badge tone="danger">Out of Stock</Badge>;
    } else if (stock < 10) {
      return <Badge tone="warning">{stock} left</Badge>;
    }
    return <Badge tone="success">{stock} in stock</Badge>;
  };

  if (loading) {
    return <Loading fullPage label="Loading products..." />;
  }

  return (
    <div className="p-4 sm:p-6">
      <button
        onClick={() => navigate(`/shops/${shopkeeperId}`)}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <FaArrowLeft size={14} /> Back to Shop
      </button>

      <PageHeader
        title="Shop Products"
        subtitle="Products listed by this shop"
      />

      <div className="relative mb-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base pl-10"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState message="No products found for this search." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card
              key={product._id}
              className="flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div>
                <img
                  src={renderImage(product.images?.image1)}
                  alt={product.name}
                  className="mb-4 h-40 w-full rounded-lg border border-slate-100 object-cover"
                />
                <h2 className="truncate text-lg font-semibold text-slate-800 tracking-tight">
                  {product.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  <strong>Category:</strong> {product.category}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  <strong>Price:</strong> {renderPrice(product.price, product.discount)}
                </p>
                <p className="mt-2">{renderStock(product.stock)}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                  {product.details}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" onClick={() => handleEdit(product)}>
                  <FaEdit size={12} /> Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeleteTarget(product)}
                >
                  <FaTrash size={12} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this product?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ShopProducts;
