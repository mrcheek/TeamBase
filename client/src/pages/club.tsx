import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useClubTheme } from "@/hooks/use-club-theme";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Users,
  MapPin,
  Megaphone,
  UserCircle,
  Zap,
  Building2,
  Calendar,
  Clock,
  Plus,
} from "lucide-react";
import type { Activity as ActivityType, User, Club, Membership, Event } from "@shared/schema";
import { isAnyAdmin } from "@shared/schema";

const ICON_STROKE = 1.5;

const roleColors: Record<string, string> = {
  player: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30",
  coach: "text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30",
  personnel: "text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/30",
  supporter: "text-pink-700 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/30",
  admin: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30",
};

type SafeUser = Omit<User, "password">;

function humanizeActivity(type: string, notes?: string | null): string {
  if (notes) {
    const clean = notes.replace(/^(Morning |Evening |Quick )/i, "");
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  const labels: Record<string, string> = {
    running: "Went for a run",
    gym: "Gym session",
    saq: "SAQ drills",
    recovery: "Recovery session",
    watching: "Watched rugby",
    social: "Club social",
  };
  return labels[type] || type.replace("_", " ");
}

function getRelativeDay(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "TODAY";
  if (dateStr === yesterday) return "YESTERDAY";
  return "EARLIER";
}

export default function ClubPage() {
  const { user } = useAuth();
  const { club: themeClub } = useClubTheme();
  const [tab, setTab] = useState<"feed" | "noticeboard" | "roster">("feed");

  const { data: memberships } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: !!user,
  });

  const { data: roster } = useQuery<SafeUser[]>({
    queryKey: ["/api/club/roster"],
    enabled: !!user,
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const activeMembership = memberships?.find((m) => m.status === "approved" || m.status === "active");
  const userClub = activeMembership?.club ?? themeClub;

  const clubInitials = userClub
    ? userClub.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "ZR";

  const memberCount = roster?.length;

  const nextEvent = events
    ?.filter((e) => e.clubId === userClub?.id && e.date >= new Date().toISOString().split("T")[0])
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];

  const isAdminOrCoach = (user?.role && isAnyAdmin(user.role)) || user?.role === "coach";

  if (!user) {
    return (
      <div className="pb-24 pt-4 max-w-lg mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={ICON_STROKE} />
          <h2 className="text-lg font-bold mb-2">Join a Club</h2>
          <p className="text-sm text-muted-foreground">Sign in and join a club to see your clubhouse.</p>
        </div>
      </div>
    );
  }

  if (!userClub) {
    return (
      <div className="pb-24 pt-4 max-w-lg mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={ICON_STROKE} />
          <h2 className="text-lg font-bold mb-2">No Club Yet</h2>
          <p className="text-sm text-muted-foreground mb-4">Join a club to access the clubhouse.</p>
          <Link href="/play">
            <Button size="sm" data-testid="button-find-clubs">Find Clubs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "feed" as const, label: "Feed" },
    { id: "noticeboard" as const, label: "Noticeboard" },
    { id: "roster" as const, label: "Roster" },
  ];

  return (
    <div className="pb-24 pt-5 max-w-lg mx-auto relative">
      {/* Club Identity */}
      <section className="px-4 mb-5">
        <div className="flex items-center gap-3">
          {userClub.logoUrl ? (
            <img
              src={userClub.logoUrl}
              alt={userClub.name}
              className="w-12 h-12 rounded-full object-cover shrink-0"
              data-testid="img-club-page-logo"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                backgroundColor: userClub.primaryColor || undefined,
                color: userClub.textOnPrimary || "#fff",
              }}
            >
              {clubInitials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate" data-testid="text-club-page-name">
              {userClub.name}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              {userClub.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" strokeWidth={ICON_STROKE} />
                  {userClub.location}
                </p>
              )}
              {memberCount !== undefined && memberCount > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" strokeWidth={ICON_STROKE} />
                  {memberCount} Member{memberCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Next Session */}
      {nextEvent && (
        <>
          <div className="border-t border-divider mx-4" />
          <section className="px-4 py-4" data-testid="section-club-next-session">
            <h3
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: `hsl(var(--club-primary))` }}
            >
              Next Session
            </h3>
            <Link href={`/events/${nextEvent.id}`}>
              <div className="flex items-center justify-between cursor-pointer" data-testid="link-club-next-session">
                <div>
                  <p className="text-sm font-semibold">{nextEvent.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" strokeWidth={ICON_STROKE} />
                      {new Date(nextEvent.date + "T00:00:00").toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={ICON_STROKE} />
                      {nextEvent.time}
                    </span>
                    {nextEvent.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" strokeWidth={ICON_STROKE} />
                        <span className="truncate max-w-[120px]">{nextEvent.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </section>
        </>
      )}

      {/* Tabs */}
      <div className="border-t border-divider" />
      <div className="flex px-4 pt-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-2.5 px-3 text-sm font-medium relative transition-colors ${
              tab === t.id ? "text-foreground" : "text-muted-foreground"
            }`}
            data-testid={`tab-club-${t.id}`}
          >
            {t.label}
            {tab === t.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: `hsl(var(--club-primary))` }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="border-b border-divider" />

      {tab === "feed" && <FeedTab />}
      {tab === "noticeboard" && <NoticeboardTab />}
      {tab === "roster" && <RosterTab />}

      {/* FAB for admins/coaches */}
      {isAdminOrCoach && tab === "noticeboard" && (
        <button
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-40"
          style={{
            backgroundColor: `hsl(var(--club-primary))`,
            color: `hsl(var(--club-primary-foreground))`,
          }}
          data-testid="button-post-notice"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function FeedTab() {
  const { data: feed, isLoading } = useQuery<(ActivityType & { user: Omit<User, "password"> })[]>({
    queryKey: ["/api/feed"],
  });

  const grouped = feed?.reduce<Record<string, typeof feed>>((acc, activity) => {
    const group = getRelativeDay(activity.date);
    if (!acc[group]) acc[group] = [];
    acc[group]!.push(activity);
    return acc;
  }, {});

  const groupOrder = ["TODAY", "YESTERDAY", "EARLIER"];

  return (
    <div className="px-4 pt-2">
      {isLoading ? (
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </div>
      ) : grouped && Object.keys(grouped).length > 0 ? (
        <div>
          {groupOrder.map((group) => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group} className="mb-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-4 pb-2">
                  {group}
                </h4>
                <div className="divide-y divide-divider">
                  {items.map((activity) => {
                    const initials = activity.user.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-3 py-3.5"
                        data-testid={`row-club-feed-${activity.id}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.user.fullName}</p>
                          <p className="text-[13px] text-muted-foreground">
                            {humanizeActivity(activity.type, activity.notes)}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          +{activity.xpEarned} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Zap className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" strokeWidth={ICON_STROKE} />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log activities to see them here</p>
        </div>
      )}
    </div>
  );
}

function NoticeboardTab() {
  const notices = [
    { id: 1, type: "announcement", title: "Training moved to Friday", body: "This week's training has been moved to Friday 5pm at Amaan Stadium.", time: "2 hours ago" },
    { id: 2, type: "request", title: "Physio needed for Saturday match", body: "We need a volunteer physio for this Saturday's league match.", time: "1 day ago" },
    { id: 3, type: "opportunity", title: "Coaching workshop available", body: "World Rugby Level 1 coaching course, 15-16 March. Limited spots.", time: "3 days ago" },
  ];

  const typeIcons: Record<string, any> = {
    announcement: Megaphone,
    request: Users,
    opportunity: Zap,
  };

  const typeColors: Record<string, string> = {
    announcement: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30",
    request: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30",
    opportunity: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30",
  };

  return (
    <div className="px-4 pt-4">
      <div className="divide-y divide-divider">
        {notices.map((notice) => {
          const Icon = typeIcons[notice.type] || Megaphone;
          return (
            <div key={notice.id} className="py-3.5" data-testid={`row-notice-${notice.id}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${typeColors[notice.type] || ""}`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={ICON_STROKE} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notice.title}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">{notice.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{notice.time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RosterTab() {
  const { data: roster, isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/club/roster"],
  });

  const roleOrder = ["admin", "coach", "player", "personnel", "supporter"];
  const sortedRoster = roster?.slice().sort((a, b) => {
    const ai = roleOrder.indexOf(a.role);
    const bi = roleOrder.indexOf(b.role);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="px-4 pt-4">
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      ) : sortedRoster && sortedRoster.length > 0 ? (
        <div className="divide-y divide-divider">
          {sortedRoster.map((member) => {
            const initials = member.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div key={member.id} className="flex items-center gap-3 py-3.5" data-testid={`row-roster-${member.id}`}>
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-muted-foreground">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.fullName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={`text-[9px] capitalize border-0 ${roleColors[member.role] || ""}`} variant="secondary">
                      {member.role}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground capitalize">{member.tier}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {member.xpTotal} XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <UserCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" strokeWidth={ICON_STROKE} />
          <p className="text-sm text-muted-foreground">No members yet</p>
        </div>
      )}
    </div>
  );
}
