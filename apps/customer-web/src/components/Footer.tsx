import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaLocationDot, FaPhone, FaXTwitter } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import googlePlay from "../assets/play-store.png";
import { Wordmark } from "./Navbar";

const Footer = () => {
  // Features section data
  const features = [
    {
      title: "Superfast Delivery",
      description:
        "Get your order delivered to your doorstep at the earliest from stores near you",
      icon: "⚡",
    },
    {
      title: "Best Deals & Offers",
      description:
        "Same products in cheaper rates by availing great cashback offers",
      icon: "💰",
    },
    {
      title: "Broad Assortment",
      description:
        "Choose from 100+ products across food, personal care, household & other categories",
      icon: "🛒",
    },
    {
      title: "Easy Returns & Refunds",
      description:
        "Didn't like the product? Return it at the doorstep & get refunded within same day",
      icon: "↩️",
    },
  ];

  const exploreCategories = [
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

  const socials = [
    { icon: FaFacebookF, href: "https://m.facebook.com/profile.php?id=61568106204046" },
    { icon: FaXTwitter, href: "https://x.com/BellybasketS" },
    { icon: FaInstagram, href: "https://www.instagram.com/bellybasket45" },
    { icon: FaLinkedinIn, href: "http://linkedin.com/in/bellybasket-store-785361358" },
  ];

  return (
    <footer className="mt-12 border-t border-gray-100 bg-white pb-20 md:pb-0">
      {/* Features section */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center rounded-2xl border border-gray-100 p-5 text-center"
          >
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl">
              {feature.icon}
            </div>
            <h3 className="mb-1 text-sm font-bold text-gray-900">{feature.title}</h3>
            <p className="text-xs text-gray-500">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Brand disclaimer */}
      <div className="my-4 px-4 text-center text-xs text-gray-500">
        <p>
          "ZipMart" is an independent quick-commerce service and is not
          related, linked or interconnected with any other business service.
        </p>
      </div>

      {/* Footer Links */}
      <div className="border-t border-gray-100">
        <div className="mx-auto max-w-7xl p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Categories Section */}
            <div>
              <h3 className="mb-4 text-base font-bold text-gray-900">Categories</h3>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {exploreCategories.map((category) => (
                  <Link
                    key={category}
                    to={`/category/${encodeURIComponent(category)}`}
                    className="text-sm text-gray-500 transition hover:text-brand-600"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>

            {/* Info Links Section */}
            <div>
              <h3 className="mb-4 text-base font-bold text-gray-900">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about-us" className="text-sm text-gray-500 transition hover:text-brand-600">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="text-sm text-gray-500 transition hover:text-brand-600">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Us Section */}
            <div>
              <h3 className="mb-4 text-base font-bold text-gray-900">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaLocationDot className="mr-2 mt-1 text-brand-600" />
                  <p className="text-sm text-gray-500">
                    Address : 74, Lahodda, Khatauli, Muzaffarnagar, Uttar Pradesh - 251201
                  </p>
                </li>
                <li className="flex items-center">
                  <FaPhone className="mr-2 text-brand-600" />
                  <p className="text-sm text-gray-500">Call : +91-7310851792</p>
                </li>
                <li className="flex items-center">
                  <MdEmail className="mr-2 text-brand-600" />
                  <p className="text-sm text-gray-500">
                    Email :{" "}
                    <a
                      href="mailto:hello@duforge.tech"
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      hello@duforge.tech
                    </a>
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* App Download and Copyright */}
      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 p-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wordmark className="text-lg" /> ©Copyright 2025-26.
          </div>

          <div className="flex items-center">
            <span className="mr-2 text-sm font-semibold text-gray-700">Download App</span>
            <a href="https://play.google.com/store/apps/details?id=com.zipmart.customer" target="_blank" rel="noreferrer">
              <img src={googlePlay} alt="Google Play" className="h-8" />
            </a>
          </div>

          <div className="flex space-x-3">
            {socials.map(({ icon: Icon, href }) => (
              <a
                key={href}
                href={href}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-brand-600 hover:text-white"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
