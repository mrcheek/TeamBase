import { useLocation, Link } from "wouter";
import { Home, Trophy, Dumbbell, User, Circle, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/play", label: "Play", icon: Trophy },
  { path: "/check-in", label: "Check-In", icon: Circle, isCenter: true },
  { path: "/train", label: "Train", icon: Dumbbell },
  { path: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  const items = user?.role === "admin"
    ? [
        navItems[0],
        navItems[1],
        navItems[2],
        { path: "/admin", label: "Admin", icon: Shield },
        navItems[4],
      ]
    : navItems;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {items.map((item) => {
          const isActive =
            item.path === "/"
              ? location === "/"
              : location.startsWith(item.path);

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid="nav-check-in"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: isActive
                        ? "hsl(var(--club-accent))"
                        : "hsl(var(--club-primary))",
                      color: "hsl(var(--club-primary-foreground))",
                    }}
                  >
                    <span className="font-bold text-xs">GO</span>
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
                  className={`w-5 h-5 transition-colors ${isActive ? "" : "text-muted-foreground"}`}
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
