import { useAuth } from "@/hooks/use-auth";
import { useClubTheme } from "@/hooks/use-club-theme";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MembershipCard } from "@/components/membership-card";
import { LogOut, TrendingUp, Dumbbell, ChevronRight, AlertCircle, Users, Trophy, Zap, Clock, Star, Sun, Moon, Settings, Bell } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import type { Activity, XpTransaction, Membership, Club } from "@shared/schema";
import { Link } from "wouter";

const tierThresholds = [
  { tier: "green", label: "Starter", min: 0, max: 199, color: "text-emerald-600 dark:text-emerald-400" },
  { tier: "blue", label: "Active", min: 200, max: 499, color: "text-blue-600 dark:text-blue-400" },
  { tier: "silver", label: "Elite", min: 500, max: 999, color: "text-gray-500 dark:text-gray-400" },
  { tier: "gold", label: "Ambassador", min: 1000, max: Infinity, color: "text-amber-500 dark:text-amber-400" },
];

const activityIcons: Record<string, typeof Dumbbell> = {
  gym: Dumbbell,
  run: Zap,
  saq: Trophy,
  recovery: Clock,
  social: Users,
};

export default function ProfilePage() {
  const { user, logout, profileCompletion } = useAuth();
  const { club: themeClub, primaryColor, accentColor } = useClubTheme();
  const { theme, toggleTheme } = useTheme();
  const xpSectionRef = useRef<HTMLElement>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    fetch("/api/push/status", { credentials: "include" })
      .then(r => r.json())
      .then(d => setPushEnabled(d.subscribed))
      .catch(() => {});
  }, []);

  const togglePush = useCallback(async () => {
    if (pushLoading || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/unsubscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setPushEnabled(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setPushLoading(false); return; }
        const vapidRes = await fetch("/api/push/vapid-key");
        const { publicKey } = await vapidRes.json();
        const urlBase64 = publicKey.replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(urlBase64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        });
        const subJson = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ endpoint: sub.endpoint, keys: subJson.keys }),
        });
        setPushEnabled(true);
      }
    } catch {
      //
    } finally {
      setPushLoading(false);
    }
  }, [pushEnabled, pushLoading]);

  const { data: myActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });

  const { data: xpHistory } = useQuery<XpTransaction[]>({
    queryKey: ["/api/xp-history"],
    enabled: !!user,
  });

  const { data: myMemberships } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold mb-2">Sign in to view your profile</h2>
          <p className="text-sm text-muted-foreground">
            Create an account to track your rugby journey
          </p>
        </div>
      </div>
    );
  }

  const currentTierInfo = tierThresholds.find((t) => t.tier === user.tier) || tierThresholds[0];
  const nextTierInfo = tierThresholds.find((t) => t.min > user.xpTotal);
  const progressPercent = nextTierInfo
    ? Math.min(((user.xpTotal - currentTierInfo.min) / (nextTierInfo.min - currentTierInfo.min)) * 100, 100)
    : 100;

  useEffect(() => {
    if (window.location.hash === "#xp" && xpSectionRef.current) {
      setTimeout(() => {
        xpSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [user]);

  const activeClub = myMemberships?.find((m) => m.status === "active");

  return (
    <div className="pb-24 pt-2 max-w-lg mx-auto">
      <div className="px-4 mb-5">
        <h2 className="text-lg font-bold" data-testid="text-profile-title">Profile</h2>
      </div>

      {user && !user.profileCompleted && profileCompletion < 100 && (
        <Link href="/complete-profile">
          <div
            className="mx-4 mb-4 py-3 flex items-center gap-3 cursor-pointer"
            data-testid="card-complete-registration"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `hsl(var(--club-primary) / 0.15)` }}
            >
              <AlertCircle className="w-4 h-4" style={{ color: `hsl(var(--club-primary))` }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Complete Your Registration</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={profileCompletion} className="h-1.5 flex-1" />
                <span className="text-xs font-medium shrink-0" style={{ color: `hsl(var(--club-primary))` }}>{profileCompletion}%</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
          </div>
        </Link>
      )}

      <div className="px-4 mb-6">
        <MembershipCard
          user={user}
          clubName={activeClub?.club.name}
          clubPrimaryColor={primaryColor}
          clubAccentColor={accentColor}
        />
      </div>

      <div className="border-t mx-4" />

      <section id="xp" ref={xpSectionRef} className="px-4 py-5 scroll-mt-4" data-testid="section-xp-progress">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
          XP Progress
        </h3>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold capitalize ${currentTierInfo.color}`}>
              {currentTierInfo.label}
            </span>
            <span className="text-lg font-bold">{user.xpTotal} XP</span>
          </div>
          {nextTierInfo && (
            <span className="text-xs text-muted-foreground" data-testid="badge-next-tier">
              Next: {nextTierInfo.label}
            </span>
          )}
        </div>
        <Progress value={progressPercent} className="h-2.5 mb-1.5" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">{currentTierInfo.min} XP</span>
          {nextTierInfo ? (
            <span className="text-[11px] text-muted-foreground">
              {nextTierInfo.min - user.xpTotal} XP to {nextTierInfo.label}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Max tier reached</span>
          )}
        </div>
      </section>

      {myMemberships && myMemberships.length > 0 && (
        <>
          <div className="border-t mx-4" />
          <section className="px-4 py-5">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
              My Clubs
            </h3>
            <div className="divide-y">
              {myMemberships.map((m) => (
                <Link key={m.id} href={`/clubs/${m.clubId}`}>
                  <div className="flex items-center gap-3 py-3 cursor-pointer" data-testid={`row-my-club-${m.clubId}`}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: m.club.primaryColor || undefined,
                        color: m.club.textOnPrimary || "#fff",
                      }}
                    >
                      <span className="font-bold text-[10px]">
                        {m.club.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.club.name}</p>
                      {m.club.location && (
                        <p className="text-[11px] text-muted-foreground">{m.club.location}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground capitalize">{m.status}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="border-t mx-4" />

      <section className="px-4 py-5">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Recent Activities
        </h3>
        {myActivities && myActivities.length > 0 ? (
          <div className="divide-y">
            {myActivities.slice(0, 5).map((activity) => {
              const IconComponent = activityIcons[activity.type] || Dumbbell;
              return (
                <div key={activity.id} className="flex items-center gap-3 py-2.5" data-testid={`row-activity-${activity.id}`}>
                  <IconComponent className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{activity.type.replace("_", " ")}</p>
                    {activity.notes && (
                      <p className="text-[11px] text-muted-foreground truncate">{activity.notes}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: `hsl(var(--club-accent))` }}>
                    +{activity.xpEarned} XP
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No activities recorded yet. Check in to start earning XP!
          </p>
        )}
      </section>

      {xpHistory && xpHistory.length > 0 && (
        <>
          <div className="border-t mx-4" />
          <section className="px-4 py-5">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
              XP History
            </h3>
            <div className="divide-y">
              {xpHistory.slice(0, 8).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-2 py-2.5"
                  data-testid={`row-xp-${tx.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{tx.description}</span>
                  </div>
                  <span className="text-xs font-semibold shrink-0" style={{ color: `hsl(var(--club-accent))` }}>+{tx.amount}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="border-t mx-4" />

      <section className="px-4 py-5">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          Settings
        </h3>
        <div className="divide-y">
          <div className="flex items-center justify-between py-3" data-testid="setting-dark-mode">
            <div className="flex items-center gap-2.5">
              {theme === "dark" ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-[11px] text-muted-foreground">{theme === "dark" ? "On" : "Off"}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-club-primary" : "bg-muted"}`}
              data-testid="button-theme-toggle"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
          {"Notification" in window && (
            <div className="flex items-center justify-between py-3" data-testid="setting-notifications">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-[11px] text-muted-foreground">{pushEnabled ? "On" : "Off"}</p>
                </div>
              </div>
              <button
                onClick={togglePush}
                disabled={pushLoading}
                className={`relative w-11 h-6 rounded-full transition-colors ${pushEnabled ? "bg-club-primary" : "bg-muted"} ${pushLoading ? "opacity-50" : ""}`}
                data-testid="button-push-toggle"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${pushEnabled ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          )}
          {user.role === "admin" && (
            <Link href="/admin">
              <div className="flex items-center justify-between py-3 cursor-pointer" data-testid="link-admin-dashboard">
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Admin Dashboard</p>
                    <p className="text-[11px] text-muted-foreground">Manage federation</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </div>
            </Link>
          )}
          <div className="py-3">
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-sm text-destructive font-medium"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
