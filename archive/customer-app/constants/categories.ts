// Single source of truth for categories — unifies the 26 predefined categories
// used across Home, Explore, and Category screens (the old app had two
// diverging lists; this reconciles them).

export type Category = { name: string; emoji: string };

export const CATEGORIES: Category[] = [
  { name: "Fruits & Vegetables", emoji: "🥬" },
  { name: "Dairy, Bread & Eggs", emoji: "🥛" },
  { name: "Beverages", emoji: "🥤" },
  { name: "Snacks & Munchies", emoji: "🍿" },
  { name: "Personal Care", emoji: "🧴" },
  { name: "Home Care", emoji: "🧹" },
  { name: "Baby Care", emoji: "🍼" },
  { name: "Pet Care", emoji: "🐾" },
  { name: "Bakery & Biscuits", emoji: "🍞" },
  { name: "Masala, Oil & More", emoji: "🫙" },
  { name: "Breakfast & Instant Food", emoji: "🥣" },
  { name: "Tea, Coffee & Health Drinks", emoji: "☕" },
  { name: "Sweets & Chocolates", emoji: "🍫" },
  { name: "Noodles & Pasta", emoji: "🍜" },
  { name: "Sauces & Spreads", emoji: "🥫" },
  { name: "Cleaning Essentials", emoji: "🧼" },
  { name: "Pharma & Wellness", emoji: "💊" },
  { name: "Stationery & Office Supplies", emoji: "✏️" },
  { name: "Toys & Games", emoji: "🧸" },
  { name: "Books", emoji: "📚" },
  { name: "Sports & Fitness", emoji: "🏋️" },
  { name: "Home & Kitchen Appliances", emoji: "🍳" },
  { name: "Clothing & Accessories", emoji: "👕" },
  { name: "Beauty & Cosmetics", emoji: "💄" },
  { name: "Meat & Seafood", emoji: "🍗" },
  { name: "Organic & Gourmet", emoji: "🌿" },
  { name: "Others", emoji: "🛒" },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

const byName = (name: string): Category =>
  CATEGORIES.find((c) => c.name === name)!;

export const CATEGORY_GROUPS: { title: string; items: Category[] }[] = [
  {
    title: "Grocery & Kitchen",
    items: [
      "Fruits & Vegetables",
      "Dairy, Bread & Eggs",
      "Bakery & Biscuits",
      "Masala, Oil & More",
      "Breakfast & Instant Food",
      "Meat & Seafood",
      "Organic & Gourmet",
    ].map(byName),
  },
  {
    title: "Snacks & Drinks",
    items: [
      "Snacks & Munchies",
      "Beverages",
      "Tea, Coffee & Health Drinks",
      "Sweets & Chocolates",
      "Noodles & Pasta",
      "Sauces & Spreads",
    ].map(byName),
  },
  {
    title: "Beauty & Personal Care",
    items: [
      "Personal Care",
      "Beauty & Cosmetics",
      "Baby Care",
      "Pet Care",
      "Pharma & Wellness",
    ].map(byName),
  },
  {
    title: "Household Essentials",
    items: [
      "Home Care",
      "Cleaning Essentials",
      "Home & Kitchen Appliances",
      "Clothing & Accessories",
    ].map(byName),
  },
  {
    title: "Lifestyle & More",
    items: [
      "Stationery & Office Supplies",
      "Toys & Games",
      "Books",
      "Sports & Fitness",
      "Others",
    ].map(byName),
  },
];
