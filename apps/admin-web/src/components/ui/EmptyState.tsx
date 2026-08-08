import React from "react";
import { FaInbox } from "react-icons/fa";

interface EmptyStateProps {
  message?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No data found.",
  icon: Icon = FaInbox,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};

export default EmptyState;
