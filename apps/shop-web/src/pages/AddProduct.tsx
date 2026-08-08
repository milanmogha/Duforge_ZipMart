import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlusSquare, FaSave, FaImage } from "react-icons/fa";
import api from "../api";

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const productToEdit = location.state?.product;

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    discount: "0",
    details: "",
    images: {} as Record<string, File>,
  });

  const [existingImages, setExistingImages] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    "Fruits & Vegetables",
    "Dairy, Bread & Eggs",
    "Beverages",
    "Snacks & Munchies",
    "Personal Care",
    "Home Care",
    "Baby Care",
    "Pet Care",
    "Bakery & Biscuits",
    "Masala, Oil & More",
    "Breakfast & Instant Food",
    "Tea, Coffee & Health Drinks",
    "Sweets & Chocolates",
    "Noodles & Pasta",
    "Sauces & Spreads",
    "Cleaning Essentials",
    "Pharma & Wellness",
    "Stationery & Office Supplies",
    "Toys & Games",
    "Books",
    "Sports & Fitness",
    "Home & Kitchen Appliances",
    "Clothing & Accessories",
    "Beauty & Cosmetics",
    "Meat & Seafood",
    "Organic & Gourmet",
    "Paan Corner",
    "Others",
  ];

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        category: productToEdit.category,
        price: productToEdit.price.toString(),
        stock: productToEdit.stock.toString(),
        discount: productToEdit.discount?.toString() || "0",
        details: productToEdit.details,
        images: {},
      });
      setExistingImages(productToEdit.images || {});
    }
  }, [productToEdit]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageKey: string) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        images: { ...prev.images, [imageKey]: e.target.files![0] },
      }));
      // Explicitly type the callback parameter to avoid implicit "any"
      setExistingImages((prev: any) => ({ ...prev, [imageKey]: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shopkeeperId = localStorage.getItem("shopkeeperId");
    if (!shopkeeperId) {
      alert("Shopkeeper ID is missing. Please log in again.");
      navigate("/shopkeeper/login");
      return;
    }

    setSubmitting(true);
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images") {
        Object.entries(value).forEach(([imgKey, file]) => {
          formDataObj.append(imgKey, file as File);
        });
      } else {
        formDataObj.append(key, value as string);
      }
    });
    formDataObj.append("shopkeeperId", shopkeeperId);

    try {
      let response;
      if (productToEdit) {
        response = await api.put(`/products/update/${productToEdit._id}`, formDataObj, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/products/add", formDataObj, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response?.data?.success) {
        alert(response.data.message || "Operation successful!");
        navigate("/shopkeeper/products");
      } else {
        throw new Error(response?.data?.message || "Unexpected server response");
      }
    } catch (error: any) {
      console.error("Error submitting product:", error);
      alert(error.response?.data?.message || "Failed to submit product.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderExistingImage = (imageKey: string) => {
    if (existingImages[imageKey]?.data) {
      const base64Data = existingImages[imageKey].data;
      const contentType = existingImages[imageKey].contentType;
      return (
        <img
          src={`data:${contentType};base64,${base64Data}`}
          alt="existing"
          className="h-20 w-20 rounded-lg border border-slate-200 object-cover shadow-sm"
        />
      );
    }
    return null;
  };

  return (
    <div className="page-container max-w-3xl">
      <button
        onClick={() => navigate("/shopkeeper/products")}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
      >
        <FaArrowLeft />
        Back to products
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            {productToEdit ? "Edit Product" : "Add Product"}
          </h1>
          <p className="page-subtitle mt-1">
            {productToEdit
              ? "Update the details of your product."
              : "List a new product in your store."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
        {/* Basic details */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[
            { label: "Product Name", name: "name", type: "text", placeholder: "e.g. Fresh Apples" },
            { label: "Price (₹)", name: "price", type: "number", placeholder: "0.00" },
            { label: "Stock", name: "stock", type: "number", placeholder: "0" },
            { label: "Discount (%)", name: "discount", type: "number", placeholder: "0" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input
                type={type}
                name={name}
                value={(formData as any)[name]}
                onChange={handleInputChange}
                placeholder={placeholder}
                className="input"
                required
              />
            </div>
          ))}
        </div>

        <div className="mt-5">
          <label className="label">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="input"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Details */}
        <div className="mt-5">
          <label className="label">Details</label>
          <textarea
            name="details"
            value={formData.details}
            onChange={handleInputChange}
            rows={4}
            placeholder="Describe your product..."
            className="input resize-y"
          />
        </div>

        {/* Image Upload */}
        <div className="mt-6">
          <label className="label">Images (up to 5)</label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["image1", "image2", "image3", "image4", "image5"].map((imgKey) => (
              <div
                key={imgKey}
                className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"
              >
                {renderExistingImage(imgKey) || (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                    <FaImage className="text-xl" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer text-sm font-medium text-slate-600 hover:text-brand-600">
                  <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {imgKey.replace("image", "Image ")}
                  </span>
                  <span className="text-brand-600 underline">Choose file</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, imgKey)}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/shopkeeper/products")}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              "Saving..."
            ) : productToEdit ? (
              <>
                <FaSave />
                Update Product
              </>
            ) : (
              <>
                <FaPlusSquare />
                Add Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
