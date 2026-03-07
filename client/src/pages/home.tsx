import { useAuth } from "@/hooks/use-auth";
import { useClubTheme } from "@/hooks/use-club-theme";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import type { Event, Activity as ActivityType, User, Club, Membership } from "@shared/schema";

const ICON_STROKE = 1.5;

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
    <div className="pb-24 pt-4 max-w-lg mx-auto">
      {/* 1. CLUB IDENTITY */}
      {user && (
        <section className="px-4 pt-4 pb-6" data-testid="section-club-hero">
          <div className="flex items-center gap-3">
            {userClub?.logoUrl ? (
              <img
                src={userClub.logoUrl}
                alt={userClub.name}
                className="w-11 h-11 rounded-full object-cover shrink-0"
                data-testid="img-hero-club-logo"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: userClub?.primaryColor || undefined,
                  color: userClub?.textOnPrimary || "#fff",
                }}
                data-testid="icon-hero-club-crest"
              >
                <span className="text-xs font-bold">{clubInitials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-tight truncate" data-testid="text-club-name">
                {userClub ? userClub.name : "Zanzibar Rugby Federation"}
              </h2>
              {userClub?.location && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {userClub.location}
                </p>
              )}
              <p className="text-[13px] text-muted-foreground mt-0.5" data-testid="text-greeting">
                {user.fullName}
                <span className="mx-1.5 opacity-40">·</span>
                <span className="capitalize">{user.role}</span>
              </p>
            </div>
            <Link href="/profile#xp">
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer shrink-0"
                style={{
                  backgroundColor: `hsl(var(--club-primary))`,
                  color: `hsl(var(--club-primary-foreground))`,
                }}
                data-testid="badge-xp"
              >
                {user.xpTotal} XP
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* 2. NEXT SESSION — dominant, no background box */}
      <div className="border-t border-divider mx-4" />

      <section className="py-8 px-4" data-testid="section-next-session">
        {eventsLoading ? (
          <Skeleton className="h-28 rounded-md" />
        ) : nextEvent ? (
          <div>
            <h3
              className="text-[10px] font-bold uppercase tracking-wider mb-4"
              style={{ color: `hsl(var(--club-primary))` }}
              data-testid="text-label-next-session"
            >
              Next Session
            </h3>
            <h2 className="text-lg font-bold leading-tight mb-2" data-testid="text-next-event-title">
              {nextEvent.title}
            </h2>
            <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mb-5">
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
            <div className="flex items-center gap-3">
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
                  Check In
                </Button>
              </Link>
              <Link href={`/events/${nextEvent.id}`}>
                <Button size="sm" variant="ghost" className="text-muted-foreground" data-testid="button-details-next-event">
                  Details
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          </div>
        )}
      </section>

      {user && (
        <>
          {/* 3. TODAY'S CHALLENGE — compact single row */}
          <div className="border-t border-divider mx-4" />

          <section className="py-8 px-4" data-testid="section-daily-challenge">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Today's Challenge
            </h3>
            {challenge ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">{challenge.title}</span>
                    <span className="text-xs font-semibold" style={{ color: `hsl(var(--club-accent))` }}>
                      +{challenge.xp} XP
                    </span>
                  </div>
                  <Link href={`/check-in?activity=${challenge.type}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs"
                      data-testid="button-start-challenge"
                    >
                      Start
                    </Button>
                  </Link>
                </div>

                {weeklyStats && weeklyStats.target > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">
                        Weekly Goal
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {weeklyStats.completed} / {weeklyStats.target}
                      </span>
                    </div>
                    <Progress
                      value={Math.min((weeklyStats.completed / weeklyStats.target) * 100, 100)}
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            ) : (
              <Skeleton className="h-10 rounded-md" />
            )}
          </section>

          {/* 4. CLUB ACTIVITY — flat timeline, initials avatars */}
          <div className="border-t border-divider mx-4" />

          <section className="py-8 px-4" data-testid="section-club-activity">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Club Activity
            </h3>
            {feedLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-md" />
                ))}
              </div>
            ) : feed && feed.length > 0 ? (
              <div className="divide-y divide-divider">
                {feed.slice(0, 3).map((activity) => {
                  const initial = activity.user.fullName.charAt(0).toUpperCase();
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 py-3"
                      data-testid={`row-feed-activity-${activity.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">{initial}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.user.fullName}</p>
                        <p className="text-[13px] text-muted-foreground capitalize">
                          {activity.type.replace("_", " ")}
                          {activity.notes && ` · ${activity.notes}`}
                        </p>
                      </div>
                      <span className="text-xs font-semibold shrink-0" style={{ color: `hsl(var(--club-accent))` }}>
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
        </>
      )}
    </div>
  );
}
