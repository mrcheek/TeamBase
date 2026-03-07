import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import type { Event, Activity, User, Club, Membership } from "@shared/schema";

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

const tierColors: Record<string, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  blue: "text-blue-600 dark:text-blue-400",
  silver: "text-gray-500 dark:text-gray-400",
  gold: "text-amber-600 dark:text-amber-400",
};

const tierThresholds: { tier: string; min: number; max: number }[] = [
  { tier: "green", min: 0, max: 199 },
  { tier: "blue", min: 200, max: 499 },
  { tier: "silver", min: 500, max: 999 },
  { tier: "gold", min: 1000, max: Infinity },
];

function getNextTierInfo(xp: number) {
  if (xp >= 1000) return { current: "Gold", next: null, progress: 100, remaining: 0 };
  if (xp >= 500) return { current: "Silver", next: "Gold", progress: ((xp - 500) / 500) * 100, remaining: 1000 - xp };
  if (xp >= 200) return { current: "Blue", next: "Silver", progress: ((xp - 200) / 300) * 100, remaining: 500 - xp };
  return { current: "Green", next: "Blue", progress: (xp / 200) * 100, remaining: 200 - xp };
}

const quickActivities = [
  { type: "running", label: "Run", icon: Footprints },
  { type: "gym", label: "Gym", icon: Dumbbell },
  { type: "saq", label: "SAQ", icon: TrendingUp },
  { type: "recovery", label: "Recovery", icon: Heart },
];

export default function HomePage() {
  const { user } = useAuth();

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: feed, isLoading: feedLoading } = useQuery<(Activity & { user: Omit<User, "password"> })[]>({
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
  const userClub = memberships?.find((m) => m.status === "approved")?.club;
  const tierInfo = user ? getNextTierInfo(user.xpTotal) : null;

  const userClubRank = clubLeaderboard && userClub
    ? clubLeaderboard.findIndex((e) => e.club.id === userClub.id) + 1
    : null;

  return (
    <div className="pb-24 px-4 pt-3 max-w-lg mx-auto">
      {user && (
        <>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold leading-tight" data-testid="text-greeting">
                {user.fullName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {userClub ? `${userClub.name}` : "Zanzibar Rugby Federation"}
                {" · "}
                <span className={`font-medium capitalize ${tierColors[user.tier] || ""}`}>
                  {user.tier} Tier
                </span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-bold" data-testid="text-user-xp">{user.xpTotal}</span>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px mb-4 border rounded-md overflow-hidden bg-border">
            <div className="bg-background p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">XP</p>
              <p className="text-lg font-bold">{user.xpTotal}</p>
            </div>
            <div className="bg-background p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tier</p>
              <p className={`text-lg font-bold capitalize ${tierColors[user.tier] || ""}`} data-testid="text-user-tier">
                {user.tier}
              </p>
            </div>
            <div className="bg-background p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Club Rank</p>
              <p className="text-lg font-bold">
                {userClubRank ? `#${userClubRank}` : "—"}
              </p>
            </div>
          </div>

          {tierInfo && (
            <div className="mb-5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs text-muted-foreground">
                  {tierInfo.next ? `Next: ${tierInfo.next} Tier` : "Max Tier Reached"}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {tierInfo.next ? `${tierInfo.remaining} XP to go` : ""}
                </span>
              </div>
              <Progress value={tierInfo.progress} className="h-2" />
            </div>
          )}
        </>
      )}

      {!user && (
        <div className="mb-6">
          <h2 className="text-lg font-bold" data-testid="text-greeting">
            Welcome to ZRF
          </h2>
          <p className="text-sm text-muted-foreground">Zanzibar Rugby Federation</p>
        </div>
      )}

      {nextEvent && (
        <section className="mb-5">
          <div className="border rounded-md p-4 bg-primary/5 dark:bg-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Next Event</span>
            </div>
            <h3 className="font-bold text-base mb-1" data-testid="text-next-event-title">{nextEvent.title}</h3>
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
              <Badge variant="secondary" className={eventTypeColors[nextEvent.type] || ""}>
                {nextEvent.type.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/check-in">
                <Button size="sm" data-testid="button-checkin-next-event">Check In</Button>
              </Link>
              <Link href={`/events/${nextEvent.id}`}>
                <Button size="sm" variant="outline" data-testid="button-details-next-event">Details</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {eventsLoading && (
        <div className="mb-5">
          <Skeleton className="h-28 rounded-md" />
        </div>
      )}

      {clubLeaderboard && clubLeaderboard.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Club Rankings
            </h3>
          </div>
          <div className="border rounded-md overflow-hidden">
            {clubLeaderboard.map((entry, idx) => (
              <Link key={entry.club.id} href={`/clubs/${entry.club.id}`}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 hover-elevate bg-background ${
                    idx < clubLeaderboard.length - 1 ? "border-b" : ""
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
                  <span className="flex-1 font-medium text-sm">{entry.club.name}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{entry.score} pts</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Activity Feed
          </h3>
          <Link href="/play" data-testid="link-view-all-events">
            <span className="text-xs text-primary font-medium">View All</span>
          </Link>
        </div>
        {feedLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
        ) : feed && feed.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            {feed.slice(0, 8).map((activity, idx) => {
              const Icon = activityIcons[activity.type] || Dumbbell;
              return (
                <div
                  key={activity.id}
                  className={`flex items-center gap-3 px-3 py-2.5 bg-background ${
                    idx < Math.min(feed.length, 8) - 1 ? "border-b" : ""
                  }`}
                  data-testid={`row-activity-${activity.id}`}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.user.fullName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {activity.notes || activity.type}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary shrink-0">
                    +{activity.xpEarned} XP
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        )}
      </section>

      {user && (
        <section className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Quick Check-In
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {quickActivities.map((act) => (
              <Link key={act.type} href={`/check-in?activity=${act.type}`}>
                <Button
                  variant="outline"
                  className="w-full flex flex-col items-center gap-1 py-3"
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
    </div>
  );
}
