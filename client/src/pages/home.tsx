import { useAuth } from "@/hooks/use-auth";
import { useClubTheme } from "@/hooks/use-club-theme";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Calendar,
  Users,
  Trophy,
  TrendingUp,
  Dumbbell,
  Eye,
  Footprints,
  MapPin,
  Clock,
  ChevronRight,
  Zap,
  Heart,
  Activity,
} from "lucide-react";
import type { Event, Activity as ActivityType, User, Club, Membership } from "@shared/schema";

const activityIcons: Record<string, any> = {
  gym: Dumbbell,
  running: Footprints,
  saq: TrendingUp,
  recovery: Heart,
  watching: Eye,
  social: Users,
};

const quickActivities = [
  { type: "running", label: "Run", icon: Footprints },
  { type: "gym", label: "Gym", icon: Dumbbell },
  { type: "saq", label: "SAQ", icon: TrendingUp },
  { type: "recovery", label: "Recovery", icon: Heart },
  { type: "social", label: "Social", icon: Users },
];

export default function HomePage() {
  const { user } = useAuth();
  const { club: themeClub } = useClubTheme();

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: feed, isLoading: feedLoading } = useQuery<(ActivityType & { user: Omit<User, "password"> })[]>({
    queryKey: ["/api/feed"],
  });

  const { data: clubLeaderboard } = useQuery<{ club: Club; score: number }[]>({
    queryKey: ["/api/leaderboard/clubs"],
  });

  const { data: memberships } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: !!user,
  });

  const upcomingEvents = events
    ?.filter((e) => new Date(e.date) >= new Date(new Date().toISOString().split("T")[0]))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextEvent = upcomingEvents?.[0];
  const userMembership = memberships?.find((m) => m.status === "approved" || m.status === "active");
  const userClub = userMembership?.club ?? themeClub;

  const userClubRank = clubLeaderboard && userClub
    ? clubLeaderboard.findIndex((e) => e.club.id === userClub.id) + 1
    : null;

  const userClubScore = clubLeaderboard && userClub
    ? clubLeaderboard.find((e) => e.club.id === userClub.id)?.score ?? 0
    : 0;

  const clubInitials = userClub
    ? userClub.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "ZR";

  return (
    <div className="pb-24 pt-3 max-w-lg mx-auto">
      {user && (
        <section className="mb-5 px-4" data-testid="section-club-hero">
          <div
            className="rounded-xl p-5 text-white relative overflow-hidden"
            style={{
              background: userClub?.primaryColor
                ? `linear-gradient(135deg, ${userClub.primaryColor} 0%, ${userClub.primaryColor}cc 100%)`
                : `linear-gradient(135deg, hsl(var(--club-primary)) 0%, hsl(var(--club-primary) / 0.8) 100%)`,
            }}
          >
            <div className="flex items-center gap-3 relative z-10">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/20"
                style={{
                  backgroundColor: userClub?.secondaryColor
                    ? `${userClub.secondaryColor}30`
                    : "rgba(255,255,255,0.2)",
                }}
              >
                {clubInitials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold leading-tight truncate" data-testid="text-club-name">
                  {userClub ? userClub.name : "Zanzibar Rugby Federation"}
                </h2>
                {userClub?.location && (
                  <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{userClub.location}</span>
                  </p>
                )}
                <p className="text-sm opacity-80 mt-0.5" data-testid="text-greeting">
                  {user.fullName}
                  <span className="mx-1.5 opacity-50">·</span>
                  <span className="capitalize">{user.role}</span>
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        </section>
      )}

      <section className="mb-5 px-4" data-testid="section-next-session">
        {eventsLoading ? (
          <Skeleton className="h-32 rounded-md" />
        ) : nextEvent ? (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: `hsl(var(--club-primary))` }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: `hsl(var(--club-primary))` }}
              >
                Next Session
              </span>
            </div>
            <h3 className="font-bold text-base mb-1" data-testid="text-next-event-title">
              {nextEvent.title}
            </h3>
            <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(nextEvent.date + "T00:00:00").toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {nextEvent.time}
              </span>
              {nextEvent.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {nextEvent.location}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/check-in">
                <Button
                  size="sm"
                  data-testid="button-checkin-next-event"
                  style={{
                    backgroundColor: `hsl(var(--club-primary))`,
                    color: `hsl(var(--club-primary-foreground))`,
                    borderColor: `hsl(var(--club-primary))`,
                  }}
                >
                  CHECK IN
                </Button>
              </Link>
              <Link href={`/events/${nextEvent.id}`}>
                <Button size="sm" variant="outline" data-testid="button-details-next-event">
                  DETAILS
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="py-6 text-center">
            <Calendar className="w-6 h-6 mx-auto text-muted-foreground/40 mb-1.5" />
            <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          </div>
        )}
      </section>

      {user && (
        <>
          <div className="border-t mx-4" />

          <section className="py-4 px-4" data-testid="section-split-grid">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Rank + Momentum
                  </span>
                </div>
                <p className="text-xs font-medium truncate mb-1.5" data-testid="text-momentum-club">
                  {userClub ? userClub.name : "No Club"}
                </p>
                {userClub ? (
                  <>
                    <Progress
                      value={Math.min((userClubScore / Math.max(clubLeaderboard?.[0]?.score || 1, 1)) * 100, 100)}
                      className="h-1.5 mb-1.5"
                    />
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold" data-testid="text-club-points">
                        {userClubScore} pts
                      </span>
                      <span className="text-[10px] text-muted-foreground" data-testid="text-club-rank">
                        {userClubRank ? `#${userClubRank}` : "—"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Join a club</p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Club Activity
                  </span>
                </div>
                {feedLoading ? (
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-4 rounded" />
                    ))}
                  </div>
                ) : feed && feed.length > 0 ? (
                  <div className="space-y-1.5">
                    {feed.slice(0, 3).map((activity) => {
                      const Icon = activityIcons[activity.type] || Dumbbell;
                      return (
                        <div
                          key={activity.id}
                          className="flex items-center gap-1.5"
                          data-testid={`row-activity-mini-${activity.id}`}
                        >
                          <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-[11px] truncate flex-1">{activity.user.fullName}</span>
                          <span className="text-[10px] font-semibold shrink-0" style={{ color: `hsl(var(--club-accent))` }}>
                            +{activity.xpEarned}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No recent activity</p>
                )}
              </div>
            </div>
          </section>

          <div className="border-t mx-4" />

          <section className="py-4 px-4" data-testid="section-quick-log">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Quick Log
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickActivities.map((act) => (
                <Link key={act.type} href={`/check-in?activity=${act.type}`}>
                  <div
                    className="flex flex-col items-center gap-1 py-2.5 px-4 min-w-[4.5rem] rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`button-quick-${act.type}`}
                  >
                    <act.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">{act.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {clubLeaderboard && clubLeaderboard.length > 0 && (
        <>
          <div className="border-t mx-4" />

          <section className="py-4 px-4" data-testid="section-club-table">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                ZRF Club Table
              </h3>
              <Link href="/play" data-testid="link-view-full-table">
                <span className="text-[11px] font-medium flex items-center gap-0.5 text-muted-foreground">
                  View all
                  <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="divide-y">
              {clubLeaderboard.slice(0, 5).map((entry, idx) => (
                <Link key={entry.club.id} href={`/clubs/${entry.club.id}`}>
                  <div
                    className="flex items-center gap-3 py-2.5 cursor-pointer"
                    data-testid={`row-club-ranking-${entry.club.id}`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : idx === 1
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium text-sm truncate">{entry.club.name}</span>
                    <span className="text-xs text-muted-foreground">{entry.score} pts</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
