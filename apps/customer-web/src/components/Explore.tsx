import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { FiArrowRight, FiMapPin } from "react-icons/fi";
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

// Emoji glyphs for each aisle's items — gives the "market" character.
const categoryGlyphs: Record<string, string> = {
  "Fruits & Vegetables": "🥬",
  "Dairy, Bread & Eggs": "🥛",
  "Bakery & Biscuits": "🍞",
  "Masala, Oil & More": "🌶️",
  "Meat & Seafood": "🍗",
  "Aata & Daal": "🌾",
  Beverages: "🥤",
  "Snacks & Munchies": "🍿",
  "Tea, Coffee & Health Drinks": "☕",
  "Personal Care": "🧴",
  "Home Care": "🧹",
  "Baby Care": "🍼",
  "Pet Care": "🐾",
  "Beauty & Cosmetics": "💄",
  "Cleaning Essentials": "🧽",
  "Home & Kitchen Appliances": "🔌",
  "Clothing & Accessories": "👕",
  "Breakfast & Instant Food": "🥣",
  "Noodles & Pasta": "🍝",
  "Sauces & Spreads": "🥫",
  "Sweets & Chocolates": "🍫",
  "Pharma & Wellness": "💊",
  "Stationery & Office Supplies": "✏️",
  "Toys & Games": "🧸",
  Books: "📚",
  "Sports & Fitness": "🏋️",
  "Organic & Gourmet": "🌱",
  Others: "🛒",
};

const Explore: React.FC = () => {
  const navigate = useNavigate();

  const groupedCategories = [
    {
      title: "Grocery & Kitchen",
      kicker: "The daily essentials",
      items: [
        { name: "Fruits & Vegetables", image: fruits },
        { name: "Dairy, Bread & Eggs", image: dairy },
        { name: "Bakery & Biscuits", image: bakery },
        { name: "Masala, Oil & More", image: masalaOil },
        { name: "Meat & Seafood", image: meat },
        { name: "Aata & Daal", image: aataDaal },
      ],
    },
    {
      title: "Snacks & Drinks",
      kicker: "Quick bites & sips",
      items: [
        { name: "Beverages", image: beverages },
        { name: "Snacks & Munchies", image: snacks },
        { name: "Tea, Coffee & Health Drinks", image: teaCoffee },
      ],
    },
    {
      title: "Body & Personal Care",
      kicker: "Feel good, every day",
      items: [
        { name: "Personal Care", image: personal },
        { name: "Home Care", image: home },
        { name: "Baby Care", image: baby },
        { name: "Pet Care", image: pet },
        { name: "Beauty & Cosmetics", image: beauty },
      ],
    },
    {
      title: "Household Essentials",
      kicker: "Keep things running",
      items: [
        { name: "Cleaning Essentials", image: cleaning },
        { name: "Home & Kitchen Appliances", image: kitchen },
        { name: "Clothing & Accessories", image: clothing },
      ],
    },
    {
      title: "Packaged & Ready-to-Eat",
      kicker: "Meals in minutes",
      items: [
        { name: "Breakfast & Instant Food", image: instant },
        { name: "Noodles & Pasta", image: pasta },
        { name: "Sauces & Spreads", image: saucesSpreads },
      ],
    },
    {
      title: "More to Explore",
      kicker: "And everything else",
      items: [
        { name: "Sweets & Chocolates", image: sweets },
        { name: "Pharma & Wellness", image: pharma },
        { name: "Stationery & Office Supplies", image: stationery },
        { name: "Toys & Games", image: toys },
        { name: "Books", image: books },
        { name: "Sports & Fitness", image: sports },
        { name: "Organic & Gourmet", image: organic },
        { name: "Others", image: others },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-cream-100 pb-24 md:pb-10">
      <Navbar active="explore" />

      <main className="mx-auto max-w-7xl px-4">
        {/* ── Hero ── */}
        <section className="relative mt-6 overflow-hidden rounded-[2rem] border border-cream-300 bg-gradient-to-br from-cream-200 via-cream-100 to-cream-300 px-6 py-10 shadow-arch sm:px-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-brand-300/30 blur-3xl" />

          <div className="relative">
            <p className="font-display text-sm italic text-accent-600">
              The market map
            </p>
            <h1 className="font-display mt-1 text-3xl font-black tracking-tight text-ink-800 sm:text-4xl lg:text-5xl">
              Shop by aisle
            </h1>
            <p className="mt-2 max-w-lg text-sm text-ink-600 sm:text-base">
              Wander through our market stalls — every aisle stocked fresh,
              from farm vegetables to pantry staples.
            </p>
          </div>
        </section>

        {/* ── Aisles ── */}
        {groupedCategories.map((group) => (
          <section key={group.title} className="mt-10">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-display text-sm italic text-accent-600">
                  {group.kicker}
                </p>
                <h2 className="font-display mt-0.5 text-2xl font-bold text-ink-800 sm:text-3xl">
                  {group.title}
                </h2>
              </div>
              <FiArrowRight className="hidden text-cream-400 sm:block" size={20} />
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
              {group.items.map((category) => (
                <button
                  key={category.name}
                  className="group flex flex-col items-center gap-2 rounded-3xl border border-cream-300 bg-cream-50 p-4 shadow-arch transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-cream-200"
                  onClick={() => navigate(`/category/${category.name}`)}
                >
                  <div className="arch-frame flex h-16 w-16 items-center justify-center overflow-hidden sm:h-20 sm:w-20">
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-center text-xs font-semibold leading-tight text-ink-800">
                    {categoryGlyphs[category.name] ?? "🛒"} {category.name}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ))}

        {/* ── Delivery hint ── */}
        <div className="mt-12 flex items-center justify-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-5 py-3 text-sm font-medium text-ink-600">
          <FiMapPin className="text-brand-600" />
          Everything delivered fresh from the nearest market stall
        </div>
      </main>
    </div>
  );
};

export default Explore;
