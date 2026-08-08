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
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
};

export default Loading;
