import { useAuth } from "@/hooks/use-auth";
import { useClubTheme } from "@/hooks/use-club-theme";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Calendar,
  Users,
  Dumbbell,
  Eye,
  Footprints,
  MapPin,
  Clock,
  Zap,
  Heart,
  TrendingUp,
  Target,
} from "lucide-react";
import type { Event, Activity as ActivityType, User, Club, Membership } from "@shared/schema";

const ICON_STROKE = 1.5;

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

  const { data: memberships } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: !!user,
  });

  const { data: challenge } = useQuery<{ type: string; title: string; xp: number; icon: string }>({
    queryKey: ["/api/daily-challenge"],
  });

  const { data: weeklyStats } = useQuery<{ target: number; completed: number; participantCount: number; clubName?: string }>({
    queryKey: ["/api/club/weekly-stats"],
    enabled: !!user,
  });

  const upcomingEvents = events
    ?.filter((e) => new Date(e.date) >= new Date(new Date().toISOString().split("T")[0]))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextEvent = upcomingEvents?.[0];
  const userMembership = memberships?.find((m) => m.status === "approved" || m.status === "active");
  const userClub = userMembership?.club ?? themeClub;

  const clubInitials = userClub
    ? userClub.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "ZR";

  return (
    <div className="pb-24 pt-3 max-w-lg mx-auto">
      {/* 1. CLUB HERO */}
      {user && (
        <section className="mb-8 px-4" data-testid="section-club-hero">
          <div
            className="rounded-xl p-5 text-white relative overflow-hidden"
            style={{
              background: userClub?.primaryColor
                ? `linear-gradient(135deg, ${userClub.primaryColor} 0%, ${userClub.primaryColor}99 60%, #111 100%)`
                : `linear-gradient(135deg, hsl(var(--club-primary)) 0%, hsl(var(--club-primary) / 0.6) 60%, #111 100%)`,
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
                <h2 className="text-2xl font-bold leading-tight truncate" data-testid="text-club-name">
                  {userClub ? userClub.name : "Zanzibar Rugby Federation"}
                </h2>
                {userClub?.location && (
                  <p className="text-xs opacity-80 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" strokeWidth={ICON_STROKE} />
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

      {/* 2. NEXT SESSION */}
      <section className="mb-7 px-4" data-testid="section-next-session">
        {eventsLoading ? (
          <Skeleton className="h-32 rounded-md" />
        ) : nextEvent ? (
          <div
            className="p-4 rounded-md"
            style={{
              backgroundColor: `hsl(var(--club-primary) / 0.06)`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" strokeWidth={ICON_STROKE} style={{ color: `hsl(var(--club-primary))` }} />
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
          </div>
        ) : (
          <div className="py-6 text-center">
            <Calendar className="w-6 h-6 mx-auto text-muted-foreground/40 mb-1.5" strokeWidth={ICON_STROKE} />
            <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          </div>
        )}
      </section>

      {user && (
        <>
          {/* 3. TODAY'S CHALLENGE */}
          <div className="border-t border-divider mx-4" />

          <section className="py-6 px-4" data-testid="section-daily-challenge">
            <div className="flex items-center gap-1.5 mb-3">
              <Target className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={ICON_STROKE} />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today's Challenge
              </h3>
            </div>
            {challenge ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const CIcon = activityIcons[challenge.icon] || Dumbbell;
                      return <CIcon className="w-4 h-4" strokeWidth={ICON_STROKE} style={{ color: `hsl(var(--club-primary))` }} />;
                    })()}
                    <span className="text-sm font-semibold">{challenge.title}</span>
                    <span className="text-xs font-semibold" style={{ color: `hsl(var(--club-accent))` }}>
                      +{challenge.xp} XP
                    </span>
                  </div>
                </div>
                {weeklyStats && weeklyStats.participantCount > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {weeklyStats.participantCount} teammate{weeklyStats.participantCount !== 1 ? "s" : ""} active today
                  </p>
                )}
                <Link href={`/check-in?activity=${challenge.type}`}>
                  <Button
                    size="sm"
                    className="w-full"
                    data-testid="button-start-challenge"
                    style={{
                      backgroundColor: `hsl(var(--club-primary))`,
                      color: `hsl(var(--club-primary-foreground))`,
                      borderColor: `hsl(var(--club-primary))`,
                    }}
                  >
                    Start Activity
                  </Button>
                </Link>

                {weeklyStats && weeklyStats.target > 0 && (
                  <div className="mt-4 pt-3 border-t border-divider">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        This Week
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {weeklyStats.completed} / {weeklyStats.target}
                      </span>
                    </div>
                    <Progress
                      value={Math.min((weeklyStats.completed / weeklyStats.target) * 100, 100)}
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            ) : (
              <Skeleton className="h-16 rounded-md" />
            )}
          </section>

          {/* 4. CLUB ACTIVITY */}
          <div className="border-t border-divider mx-4" />

          <section className="py-6 px-4" data-testid="section-club-activity">
            <div className="flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={ICON_STROKE} />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Club Activity
              </h3>
            </div>
            {feedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-md" />
                ))}
              </div>
            ) : feed && feed.length > 0 ? (
              <div className="divide-y divide-divider">
                {feed.slice(0, 3).map((activity) => {
                  const Icon = activityIcons[activity.type] || Dumbbell;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 py-3"
                      data-testid={`row-feed-activity-${activity.id}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `hsl(var(--club-primary) / 0.1)` }}
                      >
                        <Icon className="w-3.5 h-3.5" strokeWidth={ICON_STROKE} style={{ color: `hsl(var(--club-primary))` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.user.fullName}</p>
                        <p className="text-[13px] text-muted-foreground capitalize">
                          {activity.type.replace("_", " ")}
                          {activity.notes && ` · ${activity.notes}`}
                        </p>
                      </div>
                      <span className="text-xs font-semibold shrink-0 mt-1" style={{ color: `hsl(var(--club-accent))` }}>
                        +{activity.xpEarned}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            )}
            {feed && feed.length > 3 && (
              <Link href="/club">
                <Button variant="ghost" size="sm" className="w-full mt-2 text-xs font-medium text-muted-foreground" data-testid="button-view-club">
                  View Club →
                </Button>
              </Link>
            )}
          </section>

          {/* 5. QUICK LOG */}
          <div className="border-t border-divider mx-4" />

          <section className="py-6 px-4" data-testid="section-quick-log">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Quick Log
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-1 justify-around">
              {quickActivities.map((act) => (
                <Link key={act.type} href={`/check-in?activity=${act.type}`}>
                  <div
                    className="flex flex-col items-center gap-1.5 cursor-pointer"
                    data-testid={`button-quick-${act.type}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <act.icon className="w-4.5 h-4.5 text-muted-foreground" strokeWidth={ICON_STROKE} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{act.label}</span>
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
