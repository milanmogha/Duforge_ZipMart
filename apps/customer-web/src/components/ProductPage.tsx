import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, getShopById, getRatingsByProductId } from "../api";
import Loader from "./Loader";
import Navbar from "./Navbar";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { FiShoppingCart, FiStar } from "react-icons/fi";

interface ProductDetails {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  discount: number;
  details: string;
  images: { [key: string]: { data: string; contentType: string } };
  shopkeeperId: string;
}

interface ShopDetails {
  _id: string;
  shopName: string;
  ownerName: string;
  location: string;
  phone: string;
  email: string;
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    const fetchProductAndRelatedData = async () => {
      try {
        if (!id) throw new Error("Product ID is missing.");

        const productData = await getProductById(id);
        setProduct(productData);

        if (productData.images) {
          const firstKey = Object.keys(productData.images)[0];
          const firstImg = productData.images[firstKey];
          if (firstImg?.data) {
            setActiveImage(
              `data:${firstImg.contentType};base64,${firstImg.data}`
            );
          }
        }

        if (productData.shopkeeperId) {
          const shopData = await getShopById(productData.shopkeeperId);
          setShop(shopData);
        }

        try {
          const ratingsData = await getRatingsByProductId(id);
          setRatings(ratingsData);
        } catch (e: any) {
          console.error("Ratings fetch error:", e.message);
          setRatings([]);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndRelatedData();
  }, [id]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center font-semibold text-red-500">
        {error}
      </div>
    );
  if (!product)
    return (
      <div className="flex min-h-screen items-center justify-center font-semibold text-red-500">
        Product not found.
      </div>
    );

  const imageUrls = Object.keys(product.images).map((key) => {
    const img = product.images[key];
    return img.data
      ? `data:${img.contentType};base64,${img.data}`
      : "/placeholder-image.png";
  });

  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }
    if (!product) return;

    const images = product.images;
    const image1 =
      images["image1"] ||
      images[Object.keys(images)[0]] ||
      ({ data: "", contentType: "" } as any);

    const productObject = {
      _id: product._id,
      name: product.name,
      category: product.category,
      images: { image1 },
      price: product.price,
      discount: product.discount,
      shopkeeperId: product.shopkeeperId,
    };

    addToCart(productObject, 1);
  };

  const discountedPrice =
    product.discount > 0
      ? product.price - (product.price * product.discount) / 100
      : product.price;

  return (
    <div className="min-h-screen bg-cream-100 pb-24 md:pb-10">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4">
        {/* ── Product hero card ── */}
        <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-cream-300 bg-cream-50 shadow-arch">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-300/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-14 h-64 w-64 rounded-full bg-brand-300/25 blur-3xl" />

          <div className="relative grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            {/* Images */}
            <div>
              <div className="arch-frame relative flex h-96 items-center justify-center overflow-hidden border-4 border-cream-100 bg-cream-200/60 shadow-arch">
                {product.discount > 0 && (
                  <span className="sticker-badge absolute left-3 top-4 -rotate-6 bg-accent-400 text-ink-900">
                    {product.discount}% OFF
                  </span>
                )}
                <img
                  src={activeImage || imageUrls[0]}
                  alt={product.name}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="mt-4 flex gap-2">
                {imageUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`h-16 w-16 cursor-pointer rounded-2xl border-2 bg-cream-200/60 object-contain p-1 transition ${
                      activeImage === url
                        ? "border-brand-600"
                        : "border-transparent hover:border-cream-400"
                    }`}
                    onClick={() => setActiveImage(url)}
                  />
                ))}
              </div>

              {avgRating && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-cream-100 px-3 py-1 text-sm font-semibold text-ink-700">
                  <FiStar className="fill-accent-400 text-accent-400" />
                  {avgRating} · {ratings.length} rating{ratings.length > 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <p className="font-display text-sm italic text-accent-600">
                {product.category} · market find
              </p>
              <h1 className="font-display mt-1 text-3xl font-black tracking-tight text-ink-800 sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex items-end gap-3">
                <span className="text-3xl font-extrabold text-ink-900">
                  ₹{discountedPrice.toFixed(2)}
                </span>
                {product.discount > 0 && (
                  <span className="text-lg text-ink-400 line-through">
                    ₹{product.price.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="mt-5 leading-relaxed text-ink-600">
                {product.details}
              </p>

              {typeof product.stock === "number" && product.stock <= 5 && (
                <p className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-accent-300/30 px-3 py-1 text-xs font-bold text-ink-700">
                  Only {product.stock} left at this stall
                </p>
              )}

              <button
                onClick={handleAddToCart}
                className="btn-primary mt-8 w-full py-3.5 text-base sm:w-64"
              >
                <FiShoppingCart /> Add to Cart
              </button>
            </div>
          </div>

          {/* ── Shop + Reviews ── */}
          <div className="relative grid gap-6 border-t border-cream-300 p-6 sm:p-8 md:grid-cols-2">
            {shop && (
              <div className="rounded-3xl border border-cream-300 bg-cream-100 p-6">
                <p className="font-display text-sm italic text-accent-600">
                  Selling at
                </p>
                <h2 className="font-display mt-0.5 text-xl font-bold text-ink-800">
                  {shop.shopName}
                </h2>
                <dl className="mt-4 space-y-2 text-sm text-ink-600">
                  <p>
                    <span className="font-semibold text-ink-800">Owner:</span>{" "}
                    {shop.ownerName}
                  </p>
                  <p>
                    <span className="font-semibold text-ink-800">Location:</span>{" "}
                    {shop.location}
                  </p>
                  <p>
                    <span className="font-semibold text-ink-800">Contact:</span>{" "}
                    {shop.phone} | {shop.email}
                  </p>
                </dl>
              </div>
            )}

            <div className="rounded-3xl border border-cream-300 bg-cream-100 p-6">
              <p className="font-display text-sm italic text-accent-600">
                What shoppers say
              </p>
              <h2 className="font-display mt-0.5 text-xl font-bold text-ink-800">
                Ratings & Reviews
              </h2>
              <div className="mt-4">
                {ratings.length > 0 ? (
                  ratings.map((r, idx) => (
                    <div
                      key={idx}
                      className="mb-4 border-b border-cream-300 pb-3 last:border-0"
                    >
                      <p className="flex items-center gap-1 text-sm font-semibold text-ink-800">
                        <FiStar className="fill-accent-400 text-accent-400" />{" "}
                        {r.rating} / 5
                      </p>
                      {r.review && (
                        <p className="mt-1 text-sm text-ink-600">{r.review}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink-500">
                    No reviews yet — be the first!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductPage;
