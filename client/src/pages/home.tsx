import { useAuth } from "@/hooks/use-auth";
import { useClubTheme } from "@/hooks/use-club-theme";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const eventTypeColors: Record<string, string> = {
  training: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  touch_rugby: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  match: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  tournament: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  social: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
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
  const { club: themeClub, logoUrl, isLoading: themeLoading } = useClubTheme();

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
    <div className="pb-24 px-4 pt-3 max-w-lg mx-auto">
      {user && (
        <section className="mb-4" data-testid="section-club-hero">
          <Card className="p-4 bg-club-surface border-club-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-club-primary">
                <AvatarFallback
                  className="text-sm font-bold"
                  style={{
                    backgroundColor: `hsl(var(--club-primary))`,
                    color: `hsl(var(--club-primary-foreground))`,
                  }}
                >
                  {clubInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold leading-tight truncate" data-testid="text-club-name">
                  {userClub ? userClub.name : "Zanzibar Rugby Federation"}
                </h2>
                {userClub?.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{userClub.location}</span>
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-greeting">
                  {user.fullName}
                  <span className="mx-1.5 opacity-40">·</span>
                  <span className="capitalize">{user.role}</span>
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {!user && (
        <div className="mb-6">
          <h2 className="text-lg font-bold" data-testid="text-greeting">
            Welcome to ZRF
          </h2>
          <p className="text-sm text-muted-foreground">Zanzibar Rugby Federation</p>
        </div>
      )}

      <section className="mb-4" data-testid="section-next-session">
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
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Next Session
              </span>
            </div>
            <p className="text-sm text-muted-foreground">No upcoming sessions scheduled</p>
          </Card>
        )}
      </section>

      {user && (
        <section className="mb-4" data-testid="section-split-grid">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy className="w-3.5 h-3.5" style={{ color: `hsl(var(--club-primary))` }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Club Momentum
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
                      {userClubRank ? `Rank #${userClubRank}` : "—"}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Join a club to track momentum</p>
              )}
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5" style={{ color: `hsl(var(--club-primary))` }} />
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
                        <span className="text-[10px] font-semibold shrink-0" style={{ color: `hsl(var(--club-primary))` }}>
                          +{activity.xpEarned}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No recent activity</p>
              )}
            </Card>
          </div>
        </section>
      )}

      {user && (
        <section className="mb-4" data-testid="section-quick-log">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Quick Log
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickActivities.map((act) => (
              <Link key={act.type} href={`/check-in?activity=${act.type}`}>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 py-3 px-4 min-w-[4.5rem]"
                  data-testid={`button-quick-${act.type}`}
                >
                  <act.icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{act.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </section>
      )}

      {clubLeaderboard && clubLeaderboard.length > 0 && (
        <section className="mb-4" data-testid="section-club-table">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              ZRF Club Table
            </h3>
            <Link href="/play" data-testid="link-view-full-table">
              <span className="text-[11px] font-medium flex items-center gap-0.5" style={{ color: `hsl(var(--club-primary))` }}>
                View full table
                <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <Card className="overflow-visible">
            {clubLeaderboard.slice(0, 5).map((entry, idx) => (
              <Link key={entry.club.id} href={`/clubs/${entry.club.id}`}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 hover-elevate ${
                    idx < Math.min(clubLeaderboard.length, 5) - 1 ? "border-b" : ""
                  }`}
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
                  <span className="text-xs font-semibold text-muted-foreground">{entry.score} pts</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
