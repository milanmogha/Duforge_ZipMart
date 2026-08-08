import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/Product";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import fruits from "../assets/fruits.svg";
import dairy from "../assets/dairy.svg";
import bakery from "../assets/bakery.svg";
import masalaOil from "../assets/masala-oil.svg";
import meat from "../assets/meat.svg";
import aataDaal from "../assets/aata-daal.svg";
import beverages from "../assets/beverages.svg";
import snacks from "../assets/snacks.svg";
import teaCoffee from "../assets/tea-coffee.svg";
import personal from "../assets/personal-care.svg";
import home from "../assets/home-care.svg";
import baby from "../assets/baby-care.svg";
import pet from "../assets/pet-care.svg";
import beauty from "../assets/beauty.svg";
import cleaning from "../assets/cleaning.svg";
import kitchen from "../assets/kitchen-appliances.svg";
import clothing from "../assets/clothing.svg";
import instant from "../assets/instant-food.svg";
import pasta from "../assets/noodles-pasta.svg";
import saucesSpreads from "../assets/sauces-spreads.svg";
import sweets from "../assets/sweets.svg";
import pharma from "../assets/pharma.svg";
import stationery from "../assets/stationery.svg";
import toys from "../assets/toys.svg";
import books from "../assets/books.svg";
import sports from "../assets/sports.svg";
import organic from "../assets/organic.svg";
import others from "../assets/others.svg";

/* ------------------- Local product shape (data from API) ------------------- */
interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  discount?: number;
  images: {
    image1?: { data: string; contentType: string };
  };
  shopkeeperId?: any;
}

/* Map each category to its new on-brand SVG illustration. */
const categoryImages: Record<string, string> = {
  "Fruits & Vegetables": fruits,
  "Dairy, Bread & Eggs": dairy,
  "Bakery & Biscuits": bakery,
  "Masala, Oil & More": masalaOil,
  "Meat & Seafood": meat,
  "Aata & Daal": aataDaal,
  Beverages: beverages,
  "Snacks & Munchies": snacks,
  "Tea, Coffee & Health Drinks": teaCoffee,
  "Personal Care": personal,
  "Home Care": home,
  "Baby Care": baby,
  "Pet Care": pet,
  "Beauty & Cosmetics": beauty,
  "Cleaning Essentials": cleaning,
  "Home & Kitchen Appliances": kitchen,
  "Clothing & Accessories": clothing,
  "Breakfast & Instant Food": instant,
  "Noodles & Pasta": pasta,
  "Sauces & Spreads": saucesSpreads,
  "Sweets & Chocolates": sweets,
  "Pharma & Wellness": pharma,
  "Stationery & Office Supplies": stationery,
  "Toys & Games": toys,
  Books: books,
  "Sports & Fitness": sports,
  "Organic & Gourmet": organic,
  Others: others,
};

const CategoryPage: React.FC = () => {
  const { categoryName } = useParams<{ categoryName: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Product[]>(
          `/products/category/${categoryName}`
        );
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductsByCategory();
  }, [categoryName]);

  useEffect(() => {
    setFilteredProducts(
      products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, products]);

  const ProductCardAny = ProductCard as React.FC<any>;

  const heroImage = categoryName
    ? categoryImages[categoryName] || others
    : others;

  return (
    <div className="min-h-screen bg-cream-100 pb-24 md:pb-10" id="categoryResult">
      <Navbar
        active="explore"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search in ${categoryName}…`}
      />

      <main className="mx-auto max-w-7xl px-4">
        {/* ── Market stall hero ── */}
        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-cream-300 bg-gradient-to-br from-cream-200 via-cream-100 to-cream-300 shadow-arch">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-brand-300/30 blur-3xl" />

          <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-display text-sm italic text-accent-600">
                Market stall
              </p>
              <h1 className="font-display mt-1 text-3xl font-black capitalize tracking-tight text-ink-800 sm:text-4xl lg:text-5xl">
                {categoryName}
              </h1>
              <p className="mt-2 max-w-md text-sm text-ink-600 sm:text-base">
                {loading
                  ? "Loading the freshest picks…"
                  : `${filteredProducts.length} item${
                      filteredProducts.length !== 1 ? "s" : ""
                    } fresh at this stall today`}
              </p>
            </div>

            {/* Category image */}
            <div className="arch-frame mx-auto flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden border-4 border-cream-50 bg-cream-200/70 shadow-arch sm:h-48 sm:w-48">
              <img
                src={heroImage}
                alt={categoryName}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Search */}
        <div className="relative mx-auto mt-6 max-w-md">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${categoryName}…`}
            className="w-full rounded-full border border-cream-300 bg-cream-50 py-3 pl-12 pr-4 text-sm text-ink-800 shadow-arch outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cream-300 border-t-brand-600" />
          </div>
        ) : filteredProducts.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {filteredProducts.map((product) => {
              const cartCompatibleProduct = {
                _id: product._id,
                name: product.name,
                category: product.category,
                price: product.price,
                discount: product.discount,
                images: {
                  image1:
                    product.images?.image1 ?? {
                      data: "",
                      contentType: "",
                    },
                },
                shopkeeperId: product.shopkeeperId,
              };

              return (
                <ProductCardAny
                  key={product._id}
                  id={product._id}
                  image={
                    product.images?.image1
                      ? `data:${product.images.image1.contentType};base64,${product.images.image1.data}`
                      : "/placeholder-image.png"
                  }
                  name={product.name}
                  category={product.category}
                  price={product.price}
                  discount={product.discount}
                  variant="market"
                  onAddToCart={() => addToCart(cartCompatibleProduct, 1)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <p className="font-display text-lg italic text-ink-500">
              {searchQuery
                ? `No matches for "${searchQuery}"`
                : "No products found in this category."}
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-700"
            >
              <FiArrowLeft /> Browse other stalls
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;
