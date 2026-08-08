import React from "react";
import { IconType } from "react-icons";

interface StatCardProps {
  title: string;
  value: string;
  icon?: IconType;
  tone?: "indigo" | "emerald" | "amber" | "sky";
  sub?: string;
}

const toneClasses: Record<string, { bg: string; text: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  sky: { bg: "bg-sky-50", text: "text-sky-600" },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  tone = "indigo",
  sub,
}) => {
  const { bg, text } = toneClasses[tone];
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      {Icon && (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
          <Icon size={22} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </p>
        {sub && <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
};

export default StatCard;
