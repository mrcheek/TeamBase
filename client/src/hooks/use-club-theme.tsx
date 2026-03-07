import { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import type { Club, Membership } from "@shared/schema";

type ClubTheme = {
  club: Club | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textOnPrimary: string;
  textOnSecondary: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  isLoading: boolean;
};

const defaultTheme: ClubTheme = {
  club: null,
  primaryColor: "#1a7a4e",
  secondaryColor: "#e0e0e0",
  accentColor: "#d4a017",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#111111",
  logoUrl: null,
  bannerUrl: null,
  isLoading: true,
};

const ClubThemeContext = createContext<ClubTheme>(defaultTheme);

function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function lightenHSL(hsl: string, amount: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return hsl;
  const h = parseInt(parts[1]);
  const s = parseInt(parts[2]);
  const l = Math.min(100, parseInt(parts[3]) + amount);
  return `${h} ${s}% ${l}%`;
}

export function ClubThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const { data: memberships, isLoading } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: !!user,
  });

  const activeClub = useMemo(() => {
    if (!memberships) return null;
    const active = memberships.find((m) => m.status === "active");
    return active?.club ?? null;
  }, [memberships]);

  const theme = useMemo<ClubTheme>(() => {
    if (!activeClub) {
      return { ...defaultTheme, isLoading };
    }
    return {
      club: activeClub,
      primaryColor: activeClub.primaryColor || "#1a7a4e",
      secondaryColor: activeClub.secondaryColor || "#e0e0e0",
      accentColor: activeClub.accentColor || "#d4a017",
      textOnPrimary: activeClub.textOnPrimary || "#FFFFFF",
      textOnSecondary: activeClub.textOnSecondary || "#111111",
      logoUrl: activeClub.logoUrl || null,
      bannerUrl: activeClub.bannerUrl || null,
      isLoading,
    };
  }, [activeClub, isLoading]);

  useEffect(() => {
    const root = document.documentElement;
    const primary = theme.primaryColor;
    const secondary = theme.secondaryColor;
    const accent = theme.accentColor;

    const primaryHSL = hexToHSL(primary);
    const secondaryHSL = hexToHSL(secondary);
    const accentHSL = hexToHSL(accent);
    const textOnPrimaryHSL = hexToHSL(theme.textOnPrimary);
    const textOnSecondaryHSL = hexToHSL(theme.textOnSecondary);

    root.style.setProperty("--club-primary", primaryHSL);
    root.style.setProperty("--club-secondary", secondaryHSL);
    root.style.setProperty("--club-accent", accentHSL);
    root.style.setProperty("--club-primary-foreground", textOnPrimaryHSL);
    root.style.setProperty("--club-secondary-foreground", textOnSecondaryHSL);
    root.style.setProperty("--club-surface", lightenHSL(primaryHSL, 60));
    root.style.setProperty("--club-surface-strong", lightenHSL(primaryHSL, 50));
    root.style.setProperty("--club-border", lightenHSL(primaryHSL, 45));
  }, [theme]);

  return (
    <ClubThemeContext.Provider value={theme}>
      {children}
    </ClubThemeContext.Provider>
  );
}

export function useClubTheme() {
  return useContext(ClubThemeContext);
}
