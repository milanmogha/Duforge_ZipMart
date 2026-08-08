import React from "react";
import { useNavigate } from "react-router-dom";
import { FiClock, FiShoppingBag, FiTruck } from "react-icons/fi";
import { Wordmark } from "./Navbar";

const perks = [
  { icon: FiClock, text: "Delivery in minutes" },
  { icon: FiShoppingBag, text: "5000+ daily essentials" },
  { icon: FiTruck, text: "Live order tracking" },
];

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-brand-50 via-white to-white px-6 text-center">
      <span className="chip mb-6 bg-brand-100 text-brand-700">
        ⚡ Instant grocery delivery
      </span>

      <h1 className="mb-4 text-5xl leading-tight sm:text-6xl">
        <span className="block font-bold text-gray-900">Welcome to</span>
        <Wordmark className="text-6xl sm:text-7xl" />
      </h1>

      <p className="mb-10 max-w-xl text-lg text-gray-600 sm:text-xl">
        Fresh groceries and daily essentials, zipped to your doorstep in
        minutes.
      </p>

      <button
        className="btn-primary px-10 py-4 text-lg"
        onClick={() => navigate("/landing")}
      >
        Get Started
      </button>

      <div className="mt-14 flex flex-wrap items-center justify-center gap-6">
        {perks.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Icon size={16} />
            </span>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
