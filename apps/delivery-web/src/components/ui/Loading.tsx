import React from "react";

interface LoadingProps {
  label?: string;
  fullPage?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ label = "Loading...", fullPage }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullPage ? "min-h-[50vh]" : "py-16"
      }`}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand-600" />
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
};

export default Loading;
