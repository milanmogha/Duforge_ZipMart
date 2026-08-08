import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlusSquare, FaSearch, FaBoxOpen, FaSpinner } from "react-icons/fa";
import api from "../api";
import ProductCard from "../components/ProductCard";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  details: string;
  discount: number;
  images: {
    image1?: { data: string; contentType: string };
  };
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

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
    const shopkeeperId = localStorage.getItem("shopkeeperId");
    if (!shopkeeperId) {
      alert("Shopkeeper ID is missing. Please log in again.");
      navigate("/shopkeeper/login");
      return;
    }

    try {
      const response = await api.get(`/products/shop/${shopkeeperId}`);
      setProducts(response.data);
      setFilteredProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products. Please try again.");
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    navigate("/shopkeeper/add-product", { state: { product } });
  };

  const handleDelete = async (productId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/products/delete/${productId}`);

      if (response.data.success) {
        setProducts((prevProducts) => prevProducts.filter((p) => p._id !== productId));
        alert("Product deleted successfully.");
      } else {
        throw new Error(response.data?.message || "Delete failed for unknown reason.");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-500">
        <FaSpinner className="animate-spin text-brand-500" />
        <span className="font-medium">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Your Products</h1>
          <p className="page-subtitle mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} in your store
          </p>
        </div>
        <button
          onClick={() => navigate("/shopkeeper/add-product")}
          className="btn-primary"
        >
          <FaPlusSquare />
          Add Product
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search products by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FaBoxOpen className="text-xl" />
          </div>
          <p className="text-lg font-semibold text-slate-700">
            {searchQuery ? "No matching products" : "No products yet"}
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            {searchQuery
              ? "Try a different search term."
              : "Add some products to get started with your store."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate("/shopkeeper/add-product")}
              className="btn-primary mt-2"
            >
              <FaPlusSquare />
              Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onEdit={() => handleEdit(product)}
              onDelete={() => handleDelete(product._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
