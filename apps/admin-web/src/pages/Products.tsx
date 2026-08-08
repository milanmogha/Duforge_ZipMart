import React, { useEffect, useState } from "react";
import api from "../api";
import { Socket } from "socket.io-client";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Loading from "../components/ui/Loading";
import { FaSearch, FaBoxOpen, FaStore } from "react-icons/fa";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  discount: number;
  details: string;
  shopkeeperId: {
    shopName: string;
    email: string;
  };
  images: {
    image1?: { data: string; contentType: string };
    image2?: { data: string; contentType: string };
  };
}

interface ProductsProps {
  socket: Socket | null;
}

const Products: React.FC<ProductsProps> = ({ socket }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();

    // Real-time updates for all products
    if (socket) {
      socket.on("product:updated", (updatedProduct: Product) => {
        setProducts((prevProducts) => {
          const existingProductIndex = prevProducts.findIndex(
            (p) => p._id === updatedProduct._id
          );
          if (existingProductIndex > -1) {
            const updatedProducts = [...prevProducts];
            updatedProducts[existingProductIndex] = updatedProduct;
            return updatedProducts;
          }
          return [...prevProducts, updatedProduct];
        });
      });

      socket.on("product:deleted", (deletedProductId: string) => {
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== deletedProductId)
        );
      });

      return () => {
        socket.off("product:updated");
        socket.off("product:deleted");
      };
    }
  }, [socket]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (product) =>
            product.name.toLowerCase().includes(lowerCaseQuery) ||
            product.category.toLowerCase().includes(lowerCaseQuery)
        )
      );
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products/all");
      setProducts(response.data);
      setFilteredProducts(response.data);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching products:", error.response?.data || error.message);
      setLoading(false);
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

  // New helper function: Render stock information with conditional styling
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
      <PageHeader
        title="All Products"
        subtitle="Every product listed across all shops"
      />

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
        <input
          type="text"
          placeholder="Search products by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base pl-10"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState message="No products found." />
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
                <p className="mt-2">
                  {renderStock(product.stock)}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <FaStore size={12} />
                  {product.shopkeeperId?.shopName} ({product.shopkeeperId?.email})
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                  {product.details}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
                <FaBoxOpen size={12} /> Product ID: {product._id.slice(-6)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
