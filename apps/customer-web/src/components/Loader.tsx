import React from "react";
import { Wordmark } from "./Navbar";

const Loader: React.FC = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white">
    <Wordmark className="text-3xl" />
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    <p className="text-sm font-medium text-gray-500">Loading fresh deals…</p>
  </div>
);

export default Loader;
