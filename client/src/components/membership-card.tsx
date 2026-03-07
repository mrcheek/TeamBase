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
  clubPrimaryColor?: string;
  clubAccentColor?: string;
}

export function MembershipCard({ user, clubName, clubPrimaryColor, clubAccentColor }: MembershipCardProps) {
  const gradient = tierGradients[user.tier] || tierGradients.green;
  const tierLabel = tierLabels[user.tier] || "Starter";
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const useClubBranding = !!clubPrimaryColor;

  return (
    <div
      className={`relative w-full max-w-sm mx-auto rounded-xl p-5 text-white shadow-lg overflow-hidden ${!useClubBranding ? `bg-gradient-to-br ${gradient}` : ""}`}
      style={useClubBranding ? {
        background: `linear-gradient(135deg, ${clubPrimaryColor} 0%, ${clubPrimaryColor}dd 60%, ${clubAccentColor || clubPrimaryColor}aa 100%)`,
      } : undefined}
      data-testid="membership-card"
    >
      <div className="flex items-start justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 opacity-90" />
          <span className="text-sm font-semibold tracking-wide opacity-90">
            {clubName ? clubName.toUpperCase() : "ZRF RUGBY"}
          </span>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={clubAccentColor ? {
            backgroundColor: `${clubAccentColor}40`,
            color: "#fff",
          } : { backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          {tierLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
          style={clubAccentColor ? {
            backgroundColor: `${clubAccentColor}30`,
            border: `2px solid ${clubAccentColor}50`,
          } : { backgroundColor: "rgba(255,255,255,0.2)" }}
        >
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
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center"
          style={clubAccentColor ? {
            backgroundColor: `${clubAccentColor}25`,
          } : { backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <QrCode className="w-8 h-8 opacity-80" />
        </div>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
    </div>
  );
}
