import React from "react";

// ──────────────────────────────────────────────────────────────
// Tracking Icons (React components for UI timeline)
// ──────────────────────────────────────────────────────────────

export const RiderIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Scooter body */}
    <rect x="12" y="28" width="40" height="14" rx="7" fill="#218c4a" />
    <rect x="18" y="22" width="20" height="10" rx="3" fill="#1d6f3d" />
    {/* Handlebar */}
    <rect x="42" y="18" width="8" height="4" rx="2" fill="#218c4a" />
    <rect x="46" y="14" width="4" height="10" rx="2" fill="#1d6f3d" />
    {/* Wheels */}
    <circle cx="18" cy="46" r="8" fill="#333" />
    <circle cx="18" cy="46" r="4" fill="#666" />
    <circle cx="46" cy="46" r="8" fill="#333" />
    <circle cx="46" cy="46" r="4" fill="#666" />
    {/* Delivery box on back */}
    <rect x="8" y="16" width="14" height="14" rx="2" fill="#2fab5c" />
    <rect x="10" y="18" width="10" height="2" rx="1" fill="#fff" opacity="0.4" />
    {/* Headlight */}
    <circle cx="54" cy="32" r="3" fill="#fbbf24" />
    {/* Speed lines */}
    <rect x="56" y="26" width="6" height="2" rx="1" fill="#218c4a" opacity="0.6" />
    <rect x="58" y="32" width="4" height="2" rx="1" fill="#218c4a" opacity="0.4" />
    <rect x="56" y="38" width="6" height="2" rx="1" fill="#218c4a" opacity="0.6" />
  </svg>
);

export const ShopIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Building */}
    <rect x="12" y="20" width="40" height="36" rx="4" fill="#3b82f6" />
    {/* Roof / awning */}
    <path d="M8 20 L32 8 L56 20 Z" fill="#2563eb" />
    <rect x="8" y="18" width="48" height="4" rx="2" fill="#1d4ed8" />
    {/* Door */}
    <rect x="26" y="40" width="12" height="16" rx="2" fill="#1e3a5f" />
    <circle cx="32" cy="48" r="2" fill="#fbbf24" />
    {/* Windows */}
    <rect x="18" y="28" width="8" height="8" rx="2" fill="#93c5fd" />
    <rect x="38" y="28" width="8" height="8" rx="2" fill="#93c5fd" />
    {/* Shop sign */}
    <rect x="20" y="12" width="24" height="6" rx="3" fill="#fbbf24" />
    <rect x="22" y="14" width="20" height="2" rx="1" fill="#d97706" />
  </svg>
);

export const CustomerIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* House body */}
    <rect x="12" y="28" width="40" height="30" rx="4" fill="#8b5cf6" />
    {/* Roof */}
    <path d="M8 28 L32 8 L56 28 Z" fill="#7c3aed" />
    <rect x="8" y="26" width="48" height="4" rx="2" fill="#6d28d9" />
    {/* Door */}
    <rect x="26" y="42" width="12" height="16" rx="2" fill="#5b21b6" />
    <circle cx="32" cy="50" r="2" fill="#fbbf24" />
    {/* Windows */}
    <rect x="18" y="34" width="8" height="8" rx="2" fill="#c4b5fd" />
    <rect x="38" y="34" width="8" height="8" rx="2" fill="#c4b5fd" />
    {/* Chimney */}
    <rect x="42" y="12" width="6" height="12" rx="2" fill="#7c3aed" />
    {/* Smoke */}
    <circle cx="45" cy="8" r="3" fill="#ddd" opacity="0.6" />
    <circle cx="48" cy="4" r="2" fill="#ddd" opacity="0.4" />
  </svg>
);

export const OrderPlacedIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="6" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
    <rect x="18" y="16" width="28" height="4" rx="2" fill="#9ca3af" />
    <rect x="18" y="24" width="20" height="4" rx="2" fill="#d1d5db" />
    <rect x="18" y="32" width="24" height="4" rx="2" fill="#d1d5db" />
    <rect x="18" y="40" width="16" height="4" rx="2" fill="#d1d5db" />
    <circle cx="48" cy="48" r="12" fill="#218c4a" />
    <path d="M42 48 L46 52 L54 44" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AcceptedIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" fill="#218c4a" />
    <path d="M22 32 L28 38 L42 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const InTransitIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" fill="#3b82f6" />
    <rect x="20" y="26" width="24" height="12" rx="4" fill="white" />
    <circle cx="24" cy="38" r="4" fill="#333" />
    <circle cx="40" cy="38" r="4" fill="#333" />
    <rect x="42" y="22" width="4" height="6" rx="2" fill="white" />
    <rect x="48" y="28" width="6" height="2" rx="1" fill="white" opacity="0.6" />
    <rect x="50" y="32" width="4" height="2" rx="1" fill="white" opacity="0.4" />
  </svg>
);

export const DeliveredIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" fill="#218c4a" />
    <rect x="22" y="24" width="20" height="16" rx="3" fill="white" />
    <path d="M26 28 L30 32 L38 24" stroke="#218c4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="24" y="36" width="16" height="2" rx="1" fill="#d1d5db" />
  </svg>
);

export const CancelledIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" fill="#ef4444" />
    <path d="M24 24 L40 40" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 24 L24 40" stroke="white" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// ──────────────────────────────────────────────────────────────
// Google Maps marker data URLs (SVG encoded for use as icon.url)
// ──────────────────────────────────────────────────────────────

function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
    .replace(/%20/g, " ")
    .replace(/%3D/g, "=")
    .replace(/%3A/g, ":")
    .replace(/%2F/g, "/");
  return `data:image/svg+xml;charset=UTF-8,${encoded}`;
}

const riderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="30" fill="#218c4a" filter="url(#shadow)"/>
  <circle cx="32" cy="32" r="26" fill="#fff"/>
  <rect x="16" y="26" width="32" height="12" rx="6" fill="#218c4a"/>
  <rect x="20" y="22" width="16" height="8" rx="3" fill="#1d6f3d"/>
  <rect x="40" y="18" width="6" height="3" rx="1.5" fill="#218c4a"/>
  <circle cx="20" cy="42" r="6" fill="#333"/>
  <circle cx="20" cy="42" r="3" fill="#666"/>
  <circle cx="44" cy="42" r="6" fill="#333"/>
  <circle cx="44" cy="42" r="3" fill="#666"/>
  <rect x="12" y="16" width="10" height="10" rx="2" fill="#2fab5c"/>
  <circle cx="50" cy="30" r="2" fill="#fbbf24"/>
</svg>`;

const shopSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="30" fill="#3b82f6" filter="url(#shadow)"/>
  <circle cx="32" cy="32" r="26" fill="#fff"/>
  <rect x="16" y="24" width="32" height="28" rx="3" fill="#3b82f6"/>
  <path d="M12 24 L32 12 L52 24 Z" fill="#2563eb"/>
  <rect x="24" y="40" width="10" height="12" rx="2" fill="#1e3a5f"/>
  <circle cx="29" cy="46" r="1.5" fill="#fbbf24"/>
  <rect x="18" y="30" width="6" height="6" rx="1.5" fill="#93c5fd"/>
  <rect x="40" y="30" width="6" height="6" rx="1.5" fill="#93c5fd"/>
</svg>`;

const customerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="30" fill="#8b5cf6" filter="url(#shadow)"/>
  <circle cx="32" cy="32" r="26" fill="#fff"/>
  <rect x="16" y="28" width="32" height="24" rx="3" fill="#8b5cf6"/>
  <path d="M12 28 L32 14 L52 28 Z" fill="#7c3aed"/>
  <rect x="26" y="40" width="12" height="12" rx="2" fill="#5b21b6"/>
  <circle cx="32" cy="46" r="1.5" fill="#fbbf24"/>
  <rect x="18" y="34" width="6" height="6" rx="1.5" fill="#c4b5fd"/>
  <rect x="40" y="34" width="6" height="6" rx="1.5" fill="#c4b5fd"/>
</svg>`;

export const RIDER_MARKER_URL = svgToDataUrl(riderSvg);
export const SHOP_MARKER_URL = svgToDataUrl(shopSvg);
export const CUSTOMER_MARKER_URL = svgToDataUrl(customerSvg);

// ──────────────────────────────────────────────────────────────
// Tracking Timeline Component
// ──────────────────────────────────────────────────────────────

export interface TrackingStep {
  status: string;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
  timestamp?: string;
}

export const TRACKING_STEPS: TrackingStep[] = [
  { status: "Pending", label: "Order Placed", description: "Your order has been received", Icon: OrderPlacedIcon },
  { status: "Accepted", label: "Accepted", description: "Shop has confirmed your order", Icon: AcceptedIcon },
  { status: "InTransit", label: "Out for Delivery", description: "Rider is on the way", Icon: InTransitIcon },
  { status: "Delivered", label: "Delivered", description: "Order completed successfully", Icon: DeliveredIcon },
];

export const TrackingTimeline: React.FC<{
  currentStatus: string;
  orderDate?: string;
  className?: string;
}> = ({ currentStatus, orderDate, className = "" }) => {
  const statusOrder = ["Pending", "Accepted", "InTransit", "Delivered"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  // If cancelled, show a different timeline
  if (currentStatus === "Cancelled") {
    return (
      <div className={`rounded-3xl border border-red-200 bg-red-50 p-6 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-100">
            <CancelledIcon className="h-8 w-8" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-red-700">Order Cancelled</p>
            <p className="text-sm text-red-600">
              This order has been cancelled. No charges were applied.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-cream-300 bg-cream-50 p-6 shadow-arch ${className}`}>
      <p className="font-display text-sm italic text-accent-600">
        Where's my basket?
      </p>
      <h3 className="font-display mt-0.5 mb-6 text-xl font-bold text-ink-800">Order Progress</h3>
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-cream-300" />
        <div
          className="absolute left-[27px] top-8 w-0.5 bg-brand-500 transition-all duration-700"
          style={{
            height: currentIndex >= 0 ? `${(currentIndex / (statusOrder.length - 1)) * 100}%` : "0%",
            maxHeight: currentIndex === statusOrder.length - 1 ? "calc(100% - 4rem)" : undefined,
          }}
        />

        <div className="space-y-0">
          {TRACKING_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;

            return (
              <div
                key={step.status}
                className={`relative flex items-start gap-4 pb-8 transition-all duration-500 last:pb-0 ${
                  isCurrent ? "opacity-100" : isPending ? "opacity-50" : "opacity-100"
                }`}
              >
                {/* Icon circle */}
                <div
                  className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 transition-all duration-500 ${
                    isCompleted
                      ? "border-brand-500 bg-brand-500 shadow-arch"
                      : "border-cream-300 bg-cream-100"
                  } ${isCurrent ? "scale-110" : "scale-100"}`}
                >
                  <step.Icon
                    className={`h-7 w-7 transition-colors duration-500 ${
                      isCompleted ? "text-white" : "text-ink-400"
                    }`}
                  />
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full border-4 border-brand-300 animate-ping opacity-40" />
                  )}
                </div>

                {/* Text */}
                <div className="pt-1">
                  <p
                    className={`font-display text-base font-bold transition-colors duration-500 ${
                      isCompleted ? "text-ink-800" : "text-ink-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-sm transition-colors duration-500 ${
                      isCompleted ? "text-ink-600" : "text-ink-400"
                    }`}
                  >
                    {step.description}
                  </p>
                  {isCurrent && orderDate && (
                    <p className="mt-1 text-xs font-medium text-brand-700">
                      {new Date(orderDate).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────
// Live Rider Card (shows current rider status with animation)
// ──────────────────────────────────────────────────────────────

export const LiveRiderCard: React.FC<{
  eta?: string;
  status: string;
  className?: string;
}> = ({ eta, status, className = "" }) => (
  <div className={`rounded-3xl border border-brand-200 bg-brand-50 p-5 ${className}`}>
    <div className="flex items-center gap-4">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 shadow-arch">
        <RiderIcon className="h-8 w-8 text-white" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg font-bold text-ink-800">
          {status === "Accepted" ? "Heading to shop" : "On the way to you"}
        </p>
        {eta && (
          <p className="text-sm font-medium text-brand-700">
            Estimated arrival: {eta}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-brand-200">
            <div className="h-full animate-[shimmer_2s_infinite] rounded-full bg-brand-500" style={{
              background: "linear-gradient(90deg, #218c4a 0%, #57c77d 50%, #218c4a 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }} />
          </div>
          <span className="text-xs font-semibold text-brand-600">Live</span>
        </div>
      </div>
    </div>
  </div>
);
