import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Socket } from "socket.io-client";
import api from "../api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import { FaArrowLeft, FaSave } from "react-icons/fa";

interface EditProductProps {
  socket: Socket | null;
}

const MAX_IMAGE_SIZE = 50 * 1024; // 50 KB

const EditProduct: React.FC<EditProductProps> = ({ socket }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: shopkeeperId } = useParams<{ id: string }>();
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

  const [categories] = useState([
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
    "Others",
  ]);

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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    imageKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Each image must be 50 KB or less. Please choose a smaller file.");
      e.target.value = ""; // reset the input
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: { ...prev.images, [imageKey]: file },
    }));
    setExistingImages((prev: any) => ({ ...prev, [imageKey]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images") {
        Object.entries(value as Record<string, File>).forEach(
          ([imgKey, imgValue]) => {
            formDataObj.append(imgKey, imgValue);
          }
        );
      } else {
        formDataObj.append(key, value as string);
      }
    });

    formDataObj.append("shopkeeperId", shopkeeperId || "");

    try {
      let response;
      if (productToEdit) {
        response = await api.put(
          `/products/update/${productToEdit._id}`,
          formDataObj,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        alert("Product updated successfully!");
        socket?.emit("product:updated", response.data.product);
      } else {
        response = await api.post("/products/add", formDataObj, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product added successfully!");
        socket?.emit("product:added", response.data.product);
      }
      navigate(
        shopkeeperId
          ? `/shops/${shopkeeperId}/products`
          : `/dashboard`
      );
    } catch (error) {
      console.error("Error submitting product:", error);
      alert("Failed to submit product. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <button
        onClick={() =>
          navigate(shopkeeperId ? `/shops/${shopkeeperId}/products` : "/products")
        }
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <FaArrowLeft size={14} /> Back
      </button>

      <PageHeader
        title={productToEdit ? "Edit Product" : "Add Product"}
        subtitle={productToEdit ? "Update the product details" : "Add a new product to this shop"}
      />

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Name" required className="sm:col-span-2">
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Product Name"
              required
            />
          </Field>

          <Field label="Category" required className="sm:col-span-2">
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="input-base"
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
          </Field>

          <Field label="Price" required>
            <Input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Price"
              prefix="₹"
              required
            />
          </Field>

          <Field label="Stock" required>
            <Input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="Stock"
              required
            />
          </Field>

          <Field label="Discount (%)" hint="Leave 0 for no discount">
            <Input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleInputChange}
              placeholder="Discount (%)"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Details">
              <textarea
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                className="input-base"
                placeholder="Details"
                rows={4}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Images (up to 5 · max 50 KB each)">
              <div className="space-y-3">
                {["image1", "image2", "image3", "image4", "image5"].map(
                  (imgKey) => (
                    <div
                      key={imgKey}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2"
                    >
                      {existingImages[imgKey]?.data ? (
                        <img
                          src={`data:${existingImages[imgKey].contentType};base64,${existingImages[imgKey].data}`}
                          alt={`Existing ${imgKey}`}
                          className="h-14 w-14 rounded-md border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-white text-xs font-medium text-slate-400">
                          {imgKey}
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, imgKey)}
                        className="input-base text-sm"
                      />
                    </div>
                  )
                )}
              </div>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
            >
              <FaSave size={14} />
              {productToEdit ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditProduct;
