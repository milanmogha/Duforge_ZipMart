import React from "react";
import { Wordmark } from "./Navbar";
import Background from "../assets/SplashScreen-2.webp";

const SplashScreen: React.FC = () => {
  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${Background})` }}
    >
      <div className="w-11/12 max-w-sm rounded-2xl bg-white/95 px-8 py-10 text-center shadow-xl backdrop-blur">
        <Wordmark className="text-5xl" />
        <p className="mt-3 text-sm font-semibold text-gray-500">
          Groceries delivered in minutes
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
