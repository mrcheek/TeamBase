import { useLocation, Link } from "wouter";
import { Home, Trophy, User, Circle, Building2 } from "lucide-react";

const ICON_STROKE = 1.75;

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/play", label: "Play", icon: Trophy },
  { path: "/check-in", label: "GO", icon: Circle, isCenter: true },
  { path: "/club", label: "Club", icon: Building2 },
  { path: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location === "/"
              : location.startsWith(item.path);

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid="nav-go"
              >
                <div className="flex flex-col items-center gap-0.5 -mt-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-md"
                    style={{
                      backgroundColor: isActive
                        ? "hsl(var(--club-accent))"
                        : "hsl(var(--club-primary))",
                      color: "hsl(var(--club-primary-foreground))",
                    }}
                  >
                    <span className="font-bold text-base">GO</span>
                  </div>
                  <span
                    className={`text-[10px] font-medium ${isActive ? "" : "text-muted-foreground"}`}
                    style={isActive ? { color: "hsl(var(--club-accent))" } : undefined}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <div className="flex flex-col items-center gap-0.5 py-1.5 px-3">
                <item.icon
                  className={`w-[22px] h-[22px] transition-colors ${isActive ? "" : "text-muted-foreground"}`}
                  strokeWidth={ICON_STROKE}
                  style={isActive ? { color: "hsl(var(--club-accent))" } : undefined}
                />
                <span
                  className={`text-[10px] font-medium ${isActive ? "" : "text-muted-foreground"}`}
                  style={isActive ? { color: "hsl(var(--club-accent))" } : undefined}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
