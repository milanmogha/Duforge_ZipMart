import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useCart } from "../context/CartContext";
import {
  getProductsByLocation,
  fetchBanners,
  fetchBanner2,
  fetchBanner3,
} from "../api";
import Product from "./Product";
import Navbar from "./Navbar";
import Loader from "./Loader";
import Footer from "./Footer";
import LocationPicker from "./LocationPicker";
import { useLocationCtx } from "../context/LocationContext";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSmartphone,
  FiMapPin,
  FiSearch,
  FiArrowRight,
} from "react-icons/fi";
import googlePlay from "../assets/play-store.png";

const predefinedCategories = [
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
];

const renderImage = (image?: { data: string; contentType: string }) =>
  image?.data
    ? `data:${image.contentType};base64,${image.data}`
    : "/placeholder-image.png";

// Emoji glyph per category to give the "market stall" tiles character.
const categoryGlyphs: Record<string, string> = {
  "Fruits & Vegetables": "🥬",
  "Dairy, Bread & Eggs": "🥛",
  Beverages: "🥤",
  "Snacks & Munchies": "🍿",
  "Personal Care": "🧴",
  "Home Care": "🧹",
  "Baby Care": "🍼",
  "Pet Care": "🐾",
  "Bakery & Biscuits": "🍞",
  "Masala, Oil & More": "🌶️",
  "Breakfast & Instant Food": "🥣",
  "Tea, Coffee & Health Drinks": "☕",
  "Sweets & Chocolates": "🍫",
  "Noodles & Pasta": "🍝",
  "Sauces & Spreads": "🥫",
  "Cleaning Essentials": "🧽",
  "Pharma & Wellness": "💊",
  "Stationery & Office Supplies": "✏️",
  "Toys & Games": "🧸",
  Books: "📚",
  "Sports & Fitness": "🏋️",
  "Home & Kitchen Appliances": "🔌",
  "Clothing & Accessories": "👕",
  "Beauty & Cosmetics": "💄",
  "Meat & Seafood": "🍗",
  "Organic & Gourmet": "🌱",
  Others: "🛒",
};

const marqueeItems = [
  "⚡ 10-min delivery",
  "🥬 Fresh from the farm daily",
  "🚚 Straight to your doorstep",
  "🌿 Farm-to-home groceries",
  "🍞 Baked fresh every morning",
  "💰 Market prices, no middlemen",
];

const MarqueeTicker: React.FC = () => {
  const doubled = [...marqueeItems, ...marqueeItems];
  return (
    <div className="overflow-hidden border-y border-cream-300 bg-cream-200/70 py-2.5">
      <div className="marquee-track gap-8">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 whitespace-nowrap text-sm font-semibold text-ink-600"
          >
            {item}
            <span className="text-accent-400">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};

interface CategorySectionProps {
  category: string;
  products: any[];
  navigate: (path: string) => void;
  addToCart: (product: any, quantity: number) => Promise<void>;
}

const CategorySection: React.FC<CategorySectionProps> = React.memo(
  ({ category, products, navigate, addToCart }) => {
    const displayProducts = products.slice(0, 10);
    const gridRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 1 | -1) => {
      const el = gridRef.current;
      if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
    };

    const showArrows = displayProducts.length > 4;
    const ProductAny = Product as React.FC<any>;

    return (
      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="font-display text-sm italic text-accent-600">
              {categoryGlyphs[category] ?? "🛒"} Market stall
            </p>
            <h3 className="font-display mt-0.5 text-2xl font-bold text-ink-800 sm:text-3xl">
              {category}
            </h3>
          </div>
          <button
            onClick={() => navigate(`/category/${category}`)}
            className="group flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-800"
          >
            See All
            <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="relative">
          {showArrows && (
            <button
              onClick={() => scroll(-1)}
              aria-label="Scroll left"
              className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-ink-700 shadow-arch transition hover:bg-brand-600 hover:text-white md:flex"
            >
              <FiChevronLeft size={20} />
            </button>
          )}

          <div
            ref={gridRef}
            className="scrollbar-hide flex snap-x gap-4 overflow-x-auto pb-2"
          >
            {displayProducts.map((product: any) => (
              <div key={product._id} className="w-40 shrink-0 snap-start sm:w-48">
                <ProductAny
                  id={product._id}
                  image={renderImage(product.images?.image1)}
                  name={product.name}
                  category={product.category}
                  price={product.price}
                  discount={product.discount}
                  stock={product.stock}
                  variant="market"
                  onAddToCart={() => addToCart(product, 1)}
                />
              </div>
            ))}
          </div>

          {showArrows && (
            <button
              onClick={() => scroll(1)}
              aria-label="Scroll right"
              className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-cream-300 bg-cream-50 text-ink-700 shadow-arch transition hover:bg-brand-600 hover:text-white md:flex"
            >
              <FiChevronRight size={20} />
            </button>
          )}
        </div>
      </section>
    );
  }
);
CategorySection.displayName = "CategorySection";

interface Banner2 {
  _id: string;
  image: string;
  text?: string;
}

const Banner2Carousel: React.FC<{ banners2: Banner2[] }> = ({ banners2 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [perPage, setPerPage] = useState(
    window.innerWidth < 720 ? 1 : window.innerWidth < 1024 ? 2 : 3
  );

  useEffect(() => {
    const onResize = () =>
      setPerPage(window.innerWidth < 720 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const maxIndex = banners2.length > perPage ? banners2.length - perPage : 0;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1 > maxIndex ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [banners2.length, perPage]);

  return (
    <section className="mx-auto mt-4 w-full overflow-hidden">
      <div
        className="flex gap-4 transition-transform duration-300"
        style={{ transform: `translateX(calc(-${currentIndex} * (100% + 1rem)))` }}
      >
        {banners2.map((banner) => (
          <div
            key={banner._id}
            className="group relative shrink-0 overflow-hidden rounded-3xl border border-cream-300 shadow-arch transition hover:-translate-y-0.5"
            style={{ width: `calc(100% / ${perPage} - 1rem * (${perPage} - 1) / ${perPage})` }}
          >
            <img
              src={banner.image}
              alt="Offer banner"
              loading="lazy"
              className="aspect-[12/5] h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            {/* Market notice caption band */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/85 to-transparent px-4 pb-3 pt-8">
              {banner.text && (
                <p className="font-display text-base font-bold text-cream-100">
                  {banner.text}
                </p>
              )}
              <p className="text-[11px] font-medium uppercase tracking-wider text-accent-300">
                Market notice
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isOutOfRange, setIsOutOfRange] = useState<boolean>(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search");
  const [banners2, setBanners2] = useState<Banner2[]>([]);
  const [banners3, setBanners3] = useState<any[]>([]);
  const [currentBanner3Index, setCurrentBanner3Index] = useState(0);
  const { location: savedLocation, setLocation: saveLocation } = useLocationCtx();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Use saved location if available; otherwise try GPS; otherwise open picker
        let lat = savedLocation?.latitude;
        let lng = savedLocation?.longitude;

        if (lat == null || lng == null) {
          try {
            const gps = await new Promise<{ latitude: number; longitude: number }>(
              (resolve, reject) => {
                if (!navigator.geolocation) {
                  reject("Geolocation is not supported by your browser");
                } else {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                      });
                    },
                    () => {
                      reject("User denied or location unavailable");
                    },
                    { timeout: 5000 }
                  );
                }
              }
            );
            lat = gps.latitude;
            lng = gps.longitude;
          } catch {
            // No GPS — fall back to manual address entry via the picker
            setShowLocationPicker(true);
          }
        }

        const [nearbyProducts, bannersData, banners2Data, banners3Data] =
          await Promise.all([
            lat != null && lng != null
              ? getProductsByLocation(lat, lng)
              : Promise.resolve([]),
            fetchBanners(),
            fetchBanner2(),
            fetchBanner3(),
          ]);

        setProducts(nearbyProducts);
        setBanners(bannersData);
        setBanners2(banners2Data);
        setBanners3(banners3Data);
        setLoading(false);
        if (nearbyProducts.length === 0) setIsOutOfRange(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsOutOfRange(true);
        setLoading(false);
      }
    };

    fetchAllData();
  }, [savedLocation?.latitude, savedLocation?.longitude, saveLocation]);

  // When the user confirms a location in the picker, refetch nearby products
  const handleLocationConfirmed = () => {
    setShowLocationPicker(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) =>
        banners.length > 0 ? (prevIndex + 1) % banners.length : 0
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomCategory =
        predefinedCategories[
          Math.floor(Math.random() * predefinedCategories.length)
        ];
      setSearchPlaceholder(`Search "${randomCategory}"`);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner3Index((prevIndex) =>
        banners3.length > 0 ? (prevIndex + 1) % banners3.length : 0
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [banners3]);

  const displayedProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [products, searchQuery]);

  const groupedProducts = useMemo(() => {
    return predefinedCategories
      .map((cat) => ({
        category: cat,
        products: displayedProducts.filter((prod) => prod.category === cat),
      }))
      .filter(({ products }) => products.length > 0);
  }, [displayedProducts]);

  // Categories that actually have stock nearby → market-stall tiles.
  const liveCategories = useMemo(
    () => groupedProducts.map((g) => g.category),
    [groupedProducts]
  );

  if (loading) return <Loader />;

  return (
    <>
      <Helmet>
        <title>ZipMart – Home | Groceries Delivered in Minutes</title>
        <meta
          name="description"
          content="Discover fresh and quality groceries near you with ZipMart. Instant delivery of fruits, vegetables, dairy, snacks and more."
        />
        <link rel="canonical" href="https://bellybasketstore.in/landing" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bellybasketstore.in/landing" />
        <meta
          property="og:title"
          content="ZipMart – Home | Groceries Delivered in Minutes"
        />
        <meta
          property="og:description"
          content="Discover fresh and quality groceries near you with ZipMart. Instant delivery of fruits, vegetables, dairy, snacks and more."
        />
        <meta property="og:image" content="https://bellybasketstore.in/og-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://bellybasketstore.in/landing" />
        <meta
          name="twitter:title"
          content="ZipMart – Home | Groceries Delivered in Minutes"
        />
        <meta
          name="twitter:description"
          content="Discover fresh and quality groceries near you with ZipMart. Instant delivery of fruits, vegetables, dairy, snacks and more."
        />
        <meta name="twitter:image" content="https://bellybasketstore.in/og-image.jpg" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: "https://bellybasketstore.in/landing",
            potentialAction: {
              "@type": "SearchAction",
              target:
                "https://bellybasketstore.in/landing?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-cream-100">
        <Navbar
          active="home"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholder}
        />

        <MarqueeTicker />

        <main className="mx-auto max-w-7xl px-4">
          {/* ── Hero: Today's Market ── */}
          <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-cream-300 bg-gradient-to-br from-cream-200 via-cream-100 to-cream-300 px-6 py-10 shadow-arch sm:px-10 sm:py-14">
            {/* Soft blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-brand-300/30 blur-3xl" />

            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              {/* Copy + search */}
              <div>
                <p className="font-display text-sm italic text-accent-600">
                  Today's market ·{" "}
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <h1 className="font-display mt-2 text-4xl font-black leading-[1.05] tracking-tight text-ink-800 sm:text-5xl lg:text-6xl">
                  Fresh from the market,{" "}
                  <span className="italic text-brand-700">to your door</span> in
                  minutes.
                </h1>
                <p className="mt-4 max-w-md text-base text-ink-600">
                  Hand-picked groceries from local stalls, delivered like it came
                  straight off the cart.
                </p>

                {/* Search */}
                <div className="relative mt-6 max-w-md">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder || "Search the market…"}
                    className="w-full rounded-full border border-cream-300 bg-cream-50 py-3.5 pl-12 pr-4 text-sm text-ink-800 shadow-arch outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                </div>

                {/* Delivery location chip */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowLocationPicker(true)}
                    className="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700"
                  >
                    <FiMapPin className="text-brand-600" />
                    {savedLocation ? "Change delivery area" : "Set delivery location"}
                  </button>
                  {savedLocation?.address && (
                    <span className="max-w-[240px] truncate text-xs text-ink-500">
                      {savedLocation.address}
                    </span>
                  )}
                </div>
              </div>

              {/* Rotating banner — wide rectangle "Today's pick" */}
              {banners.length > 0 && (
                <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                  <div className="relative overflow-hidden rounded-2xl border border-cream-300 shadow-arch">
                    <img
                      src={banners[currentBannerIndex]?.image}
                      alt={`Banner ${currentBannerIndex + 1}`}
                      width={1200}
                      height={600}
                      className="aspect-[2/1] w-full object-cover"
                    />
                    {/* Sticker label */}
                    <span className="sticker-badge absolute left-3 top-4 -rotate-6 bg-accent-400 text-ink-900">
                      ⭐ Today's pick
                    </span>
                    {/* Caption band */}
                    {banners[currentBannerIndex]?.text && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/85 to-transparent px-5 pb-4 pt-10">
                        <h2 className="font-display text-xl font-bold text-cream-100">
                          {banners[currentBannerIndex]?.text}
                        </h2>
                        <p className="text-xs font-medium text-cream-200/80">
                          Fresh at your market today
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Dots */}
                  <div className="mt-4 flex justify-center gap-1.5">
                    {banners.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentBannerIndex
                            ? "w-5 bg-brand-600"
                            : "w-1.5 bg-cream-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Category market stalls ── */}
          {!isOutOfRange && liveCategories.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold text-ink-800 sm:text-3xl">
                Shop by stall
              </h2>
              <p className="font-display mt-1 text-sm italic text-ink-500">
                Pick a shelf and start filling your basket
              </p>
              <div className="scrollbar-hide mt-5 flex gap-3 overflow-x-auto pb-2">
                {liveCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => navigate(`/category/${category}`)}
                    className="group flex shrink-0 flex-col items-center gap-2 rounded-3xl border border-cream-300 bg-cream-50 px-6 py-5 shadow-arch transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-cream-200"
                  >
                    <span className="text-3xl transition-transform group-hover:scale-110">
                      {categoryGlyphs[category] ?? "🛒"}
                    </span>
                    <span className="font-display max-w-[8rem] text-center text-sm font-bold leading-tight text-ink-800">
                      {category}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── App download CTA ── */}
          <a
            href="https://play.google.com/store/apps/details?id=com.zipmart.customer"
            target="_blank"
            rel="noreferrer"
            className="mt-12 flex flex-col items-center justify-between gap-5 overflow-hidden rounded-[2rem] bg-gradient-to-r from-ink-800 via-ink-700 to-brand-800 p-7 text-cream-100 shadow-arch transition hover:shadow-arch sm:flex-row sm:p-9"
          >
            <div className="flex items-center gap-4">
              <span className="hidden h-14 w-14 items-center justify-center rounded-full bg-accent-400 text-ink-900 sm:flex">
                <FiSmartphone size={26} />
              </span>
              <div>
                <p className="font-display text-2xl font-bold sm:text-3xl">
                  Take the market with you ⚡
                </p>
                <p className="mt-1 text-sm text-cream-200/90">
                  Faster ordering, live tracking & app-only offers
                </p>
              </div>
            </div>
            <img src={googlePlay} alt="Get it on Google Play" className="h-11 shrink-0" />
          </a>

          {/* ── Offer banners ── */}
          {banners2.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl font-bold text-ink-800 sm:text-3xl">
                This week's specials
              </h2>
              <Banner2Carousel banners2={banners2} />
            </div>
          )}

          {/* Out of Range Notice */}
          {isOutOfRange && (
            <div className="my-10 rounded-[2rem] border-2 border-dashed border-accent-400 bg-accent-300/20 px-6 py-10 text-center">
              <p className="font-display text-2xl font-bold text-ink-800">
                Coming soon to your area! ⚡
              </p>
              <p className="mt-1 text-sm text-ink-600">
                We're setting up market stalls near you. Check back soon.
              </p>
            </div>
          )}

          {/* ── Market shelves (products) ── */}
          {!isOutOfRange && (
            <section className="mt-10">
              {searchQuery && displayedProducts.length === 0 && (
                <p className="py-10 text-center font-display text-lg italic text-ink-500">
                  No products found for "{searchQuery}"
                </p>
              )}
              {groupedProducts.map(({ category, products }) => (
                <CategorySection
                  key={category}
                  category={category}
                  products={products}
                  navigate={navigate}
                  addToCart={(product, quantity) => addToCart(product, quantity)}
                />
              ))}
            </section>
          )}

          {/* Banner3 — wide "market story" card */}
          {banners3.length > 0 && (
            <section className="relative mx-auto my-10 max-w-3xl">
              <div className="relative overflow-hidden rounded-[2rem] border border-cream-300 shadow-arch">
                <img
                  src={banners3[currentBanner3Index]?.image}
                  alt={`Banner3 ${currentBanner3Index + 1}`}
                  loading="lazy"
                  className="aspect-[2/1] w-full object-cover"
                />
                {/* Caption band */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/85 to-transparent px-6 pb-5 pt-12">
                  <div>
                    {banners3[currentBanner3Index]?.text && (
                      <h2 className="font-display text-xl font-bold text-cream-100 sm:text-2xl">
                        {banners3[currentBanner3Index]?.text}
                      </h2>
                    )}
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-accent-300">
                      From the market · daily story
                    </p>
                  </div>
                </div>
              </div>

              {/* Dots */}
              <div className="mt-4 flex justify-center gap-1.5">
                {banners3.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentBanner3Index
                        ? "w-5 bg-brand-600"
                        : "w-1.5 bg-cream-400"
                    }`}
                  />
                ))}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>

      {/* Location picker — shown when GPS is unavailable or user changes location */}
      <LocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirmed}
      />
    </>
  );
};

export default HomePage;
