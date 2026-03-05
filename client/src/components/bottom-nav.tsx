import { useLocation, Link } from "wouter";
import { Home, Trophy, Dumbbell, User, Circle } from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/play", label: "Play", icon: Trophy },
  { path: "/check-in", label: "Check-In", icon: Circle, isCenter: true },
  { path: "/train", label: "Train", icon: Dumbbell },
  { path: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      data-testid="nav-bottom"
    >
      <div className="flex items-end justify-around max-w-lg mx-auto px-2 pb-1 pt-1">
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
                data-testid="nav-check-in"
              >
                <div className="flex flex-col items-center -mt-5">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                      isActive
                        ? "bg-primary scale-105"
                        : "bg-primary"
                    }`}
                  >
                    <span className="text-primary-foreground font-bold text-lg">GO</span>
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 font-semibold ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
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
              <div className="flex flex-col items-center py-2 px-3">
                <item.icon
                  className={`w-5 h-5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
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
