import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FiTrash2, FiMinus, FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";
import Navbar from "./Navbar";
import EmptyCart from "../assets/empty-cart.png";

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    fetchCartItems,
    updateQuantity,
    removeFromCart,
    totalDiscountedPrice,
    clearCart,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const handleCheckout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warn("Please log in to proceed to checkout.");
      navigate("/signin");
      return;
    }
    navigate("/checkout");
  };

  const handleDecreaseQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity > 1) {
        await updateQuantity(productId, quantity - 1);
      } else {
        await removeFromCart(productId);
      }
      fetchCartItems();
    } catch (error) {
      console.error("Error decreasing quantity:", error);
      toast.error("Failed to update cart.");
    }
  };

  const handleIncreaseQuantity = async (productId: string, quantity: number) => {
    try {
      await updateQuantity(productId, quantity + 1);
      fetchCartItems();
    } catch (error) {
      console.error("Error increasing quantity:", error);
      toast.error("Failed to update cart.");
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
      fetchCartItems();
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item from cart.");
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      fetchCartItems();
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart.");
    }
  };

  const renderProductImage = (product: any) => {
    const image = product.images?.image1;
    if (image?.data && image.contentType) {
      return `data:${image.contentType};base64,${image.data}`;
    }
    return "https://via.placeholder.com/150";
  };

  const filteredCartItems = cartItems.filter((item) =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream-100 pb-40 md:pb-10">
      <Navbar
        active="cart"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search your cart…"
      />

      <main className="mx-auto max-w-3xl px-4">
        <div className="mt-6">
          <p className="font-display text-sm italic text-accent-600">
            Your market basket
          </p>
          <h1 className="font-display mt-0.5 text-3xl font-black tracking-tight text-ink-800">
            My Cart
          </h1>
        </div>

        {filteredCartItems.length > 0 ? (
          <>
            <div className="mt-6 space-y-3">
              {filteredCartItems.map((item) => {
                const discountedPrice =
                  item.product.price -
                  (item.product.price * (item.product.discount || 0)) / 100;

                return (
                  <div
                    key={item.product._id}
                    className="flex items-center gap-4 rounded-3xl border border-cream-300 bg-cream-50 p-4 shadow-arch"
                  >
                    <div className="arch-frame flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-cream-200/70">
                      <img
                        src={renderProductImage(item.product)}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-ink-800">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-ink-500">{item.product.category}</p>
                      <p className="mt-1 text-sm font-bold text-ink-900">
                        ₹{discountedPrice.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-100 px-1.5 py-1">
                      <button
                        aria-label="Decrease quantity"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-100"
                        onClick={() =>
                          handleDecreaseQuantity(item.product._id, item.quantity)
                        }
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-brand-700">
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-100"
                        onClick={() =>
                          handleIncreaseQuantity(item.product._id, item.quantity)
                        }
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <p className="text-sm font-bold text-ink-900">
                        ₹{(discountedPrice * item.quantity).toFixed(2)}
                      </p>
                      <button
                        aria-label="Remove item"
                        onClick={() => handleRemoveItem(item.product._id)}
                        className="text-ink-400 transition hover:text-red-500"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearCart}
                className="text-sm font-semibold text-red-500 hover:text-red-600"
              >
                Clear Cart
              </button>
            </div>

            {/* Checkout bar */}
            <div className="fixed inset-x-0 bottom-16 z-30 border-t border-cream-300 bg-cream-50 p-4 md:bottom-0">
              <div className="mx-auto max-w-3xl">
                <button
                  onClick={handleCheckout}
                  className="btn-primary w-full justify-between py-3.5 text-base"
                >
                  <span>Proceed to Checkout</span>
                  <span>₹{(totalDiscountedPrice || 0).toFixed(2)}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-16 flex flex-col items-center text-center">
            <img src={EmptyCart} alt="Empty Cart" className="h-44 object-contain" />
            <p className="font-display mt-6 text-xl font-bold text-ink-800">
              Your cart is currently empty
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Add fresh groceries and get them in minutes ⚡
            </p>
            <button onClick={() => navigate("/explore")} className="btn-primary mt-6">
              Explore Products
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
