import type { User } from "@shared/schema";
import { QrCode, Shield } from "lucide-react";

const tierGradients: Record<string, string> = {
  green: "from-emerald-600 to-emerald-800",
  blue: "from-blue-600 to-blue-800",
  silver: "from-gray-400 to-gray-600",
  gold: "from-amber-500 to-amber-700",
};

const tierLabels: Record<string, string> = {
  green: "Starter",
  blue: "Active",
  silver: "Elite",
  gold: "Ambassador",
};

interface MembershipCardProps {
  user: Omit<User, "password">;
  clubName?: string;
}

export function MembershipCard({ user, clubName }: MembershipCardProps) {
  const gradient = tierGradients[user.tier] || tierGradients.green;
  const tierLabel = tierLabels[user.tier] || "Starter";
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative w-full max-w-sm mx-auto rounded-xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}
      data-testid="membership-card"
    >
      <div className="flex items-start justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 opacity-90" />
          <span className="text-sm font-semibold tracking-wide opacity-90">ZRF RUGBY</span>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 bg-white/20 rounded-full">
          {tierLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{user.fullName}</h3>
          {clubName && (
            <p className="text-sm opacity-80 truncate">{clubName}</p>
          )}
          <p className="text-xs opacity-70 capitalize">{user.role}</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs opacity-70">XP Total</p>
          <p className="text-2xl font-bold">{user.xpTotal.toLocaleString()}</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-md flex items-center justify-center">
          <QrCode className="w-8 h-8 opacity-80" />
        </div>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
    </div>
  );
}
