import React from "react";
import { FaEdit, FaTrashAlt, FaImage } from "react-icons/fa";

// Define the structure of the Product object using an interface
interface Product {
  name: string; // Name of the product
  category: string; // Category to which the product belongs
  price: number; // Price of the product
  stock: number; // Number of items in stock
  details: string; // Details or description of the product
  discount: number; // Discount percentage on the product
  images: {
    image1?: { data: string; contentType: string }; // Optional image data
  };
}

// Define the props expected by the ProductCard component
interface ProductCardProps {
  product: Product; // Product object containing details to display
  onEdit: () => void; // Callback function for handling edit action
  onDelete: () => void; // Callback function for handling delete action
}

// React functional component to display a single product card
const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  /**
   * Function to render the product image.
   * If an image is available, it converts the data to a Base64 URL.
   * If no image is available, it falls back to a placeholder image.
   */
  const renderImage = (image?: { data: string; contentType: string }) => {
    if (image && image.data) {
      return `data:${image.contentType};base64,${image.data}`;
    }
    return "/placeholder-image.png"; // Path to placeholder image
  };

  /**
   * Function to calculate and render the product price.
   * If a discount is available, it calculates the discounted price
   * and shows both the original and discounted prices.
   * If no discount is applied, it shows only the original price.
   */
  const renderPrice = (price: number, discount: number) => {
    const discountedPrice = price - (price * discount) / 100;

    if (discount > 0) {
      return (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">
            ₹{discountedPrice.toFixed(2)}
          </span>
          <span className="text-sm text-slate-400 line-through">
            ₹{price.toFixed(2)}
          </span>
          <span className="badge-red">{discount}% off</span>
        </div>
      );
    }

    return (
      <span className="text-lg font-bold text-slate-900">
        ₹{price.toFixed(2)}
      </span>
    );
  };

  return (
    <div className="card group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      {/* Product Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={renderImage(product.images.image1)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {!product.images.image1?.data && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <FaImage className="text-4xl" />
          </div>
        )}
        {product.stock <= 0 && (
          <div className="absolute inset-x-0 top-0 flex justify-center pt-3">
            <span className="badge-red shadow-sm">Out of stock</span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-4">
        <h2 className="truncate text-base font-semibold text-slate-900" title={product.name}>
          {product.name}
        </h2>
        <p className="mt-0.5 truncate text-sm text-slate-500">{product.category}</p>
        <div className="mt-3">{renderPrice(product.price, product.discount)}</div>

        <div className="mt-3">
          {product.stock <= 0 ? (
            <span className="badge-red">Out of stock</span>
          ) : product.stock < 10 ? (
            <span className="badge-yellow">Only {product.stock} left</span>
          ) : (
            <span className="badge-green">In stock · {product.stock}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
          >
            <FaEdit />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <FaTrashAlt />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
