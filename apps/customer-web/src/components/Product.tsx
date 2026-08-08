import React from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

interface ProductProps {
  id: string;
  image: string;
  name: string;
  category: string;
  price: number;
  discount: number;
  stock: number;
  shopkeeperId: string;
  onAddToCart?: () => void;
  /** "market" = warm editorial variant used on the homepage (arch frame + sticker badge). */
  variant?: "default" | "market";
}

const Product: React.FC<ProductProps> = ({
  id,
  image,
  name,
  category,
  price,
  discount,
  stock,
  shopkeeperId,
  onAddToCart,
  variant = "default",
}) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const validPrice = typeof price === "number" ? price : 0;
  const discountedPrice =
    discount > 0 ? validPrice - (validPrice * discount) / 100 : validPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    if (onAddToCart) {
      onAddToCart();
      return;
    }

    const productObject = {
      _id: id,
      name,
      category,
      images: { image1: { data: "", contentType: "" } },
      price: validPrice,
      discount,
      shopkeeperId,
    };

    addToCart(productObject, 1);
  };

  const isMarket = variant === "market";

  return (
    <div
      className={`group relative flex w-full cursor-pointer flex-col transition hover:-translate-y-0.5 ${
        isMarket
          ? "rounded-3xl border border-cream-300 bg-cream-50 p-3 shadow-arch hover:shadow-arch"
          : "rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md"
      }`}
      onClick={() => navigate(`/product/${id}`)}
    >
      {discount > 0 && (
        <span
          className={`z-10 ${
            isMarket
              ? "sticker-badge absolute -left-1 top-3 -rotate-6 bg-accent-400 text-ink-900"
              : "absolute left-2 top-2 rounded-lg bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white"
          }`}
        >
          {discount}% OFF
        </span>
      )}
      {typeof stock === "number" && stock <= 5 && (
        <span
          className={`z-10 ${
            isMarket
              ? "sticker-badge absolute right-0 top-4 rotate-6 bg-cream-200 text-ink-700"
              : "absolute right-2 top-2 rounded-lg bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white"
          }`}
        >
          Only {stock} left
        </span>
      )}

      <div
        className={`flex items-center justify-center overflow-hidden p-2 ${
          isMarket
            ? "arch-frame h-40 bg-cream-200/70"
            : "h-32 rounded-xl bg-gray-50"
        }`}
      >
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <p
          className={`text-[11px] font-medium uppercase tracking-wide ${
            isMarket ? "text-accent-600" : "text-gray-400"
          }`}
        >
          {category}
        </p>
        <h3
          className={`mt-0.5 line-clamp-2 text-sm font-semibold ${
            isMarket ? "font-display text-ink-800" : "text-gray-900"
          }`}
        >
          {name}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="leading-tight">
            <p
              className={`text-base font-bold ${
                isMarket ? "text-ink-900" : "text-gray-900"
              }`}
            >
              ₹{discountedPrice.toFixed(2)}
            </p>
            {discount > 0 && (
              <p className="text-xs text-gray-400 line-through">
                ₹{validPrice.toFixed(2)}
              </p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${name} to cart`}
            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              isMarket
                ? "border border-brand-600 bg-cream-100 text-brand-700 hover:bg-brand-600 hover:text-white"
                : "border border-brand-600 bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white"
            }`}
          >
            <FiPlus size={14} /> ADD
          </button>
        </div>
      </div>
    </div>
  );
};

export default Product;
