import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, Users, Trophy, TrendingUp, Dumbbell, Eye, PartyPopper, Footprints } from "lucide-react";
import type { Event, Activity, User, Club } from "@shared/schema";

const activityIcons: Record<string, any> = {
  gym: Dumbbell,
  running: Footprints,
  saq: TrendingUp,
  recovery: PartyPopper,
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

  const upcomingEvents = events
    ?.filter((e) => new Date(e.date) >= new Date(new Date().toISOString().split("T")[0]))
    .slice(0, 3);

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold" data-testid="text-greeting">
          {user ? `Habari, ${user.fullName.split(" ")[0]}` : "Welcome to ZRF"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Zanzibar Rugby Federation
        </p>
      </div>

      {user && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="hover-elevate">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your XP</p>
                <p className="text-lg font-bold" data-testid="text-user-xp">{user.xpTotal}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tier</p>
                <p className="text-lg font-bold capitalize" data-testid="text-user-tier">{user.tier}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Upcoming Events
          </h3>
          <Link href="/play" data-testid="link-view-all-events">
            <span className="text-xs text-primary font-medium">View All</span>
          </Link>
        </div>
        {eventsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        ) : upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover-elevate" data-testid={`card-event-${event.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm">{event.title}</h4>
                      <Badge variant="secondary" className={eventTypeColors[event.type] || ""}>
                        {event.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span>{event.time}</span>
                      {event.location && <span className="truncate">{event.location}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No upcoming events
            </CardContent>
          </Card>
        )}
      </section>

      {clubLeaderboard && clubLeaderboard.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Club Rankings
          </h3>
          <Card>
            <CardContent className="p-0">
              {clubLeaderboard.map((entry, idx) => (
                <Link key={entry.club.id} href={`/clubs/${entry.club.id}`}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 hover-elevate ${
                      idx < clubLeaderboard.length - 1 ? "border-b" : ""
                    }`}
                    data-testid={`row-club-ranking-${entry.club.id}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      idx === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-medium text-sm">{entry.club.name}</span>
                    <span className="text-sm font-semibold text-primary">{entry.score} pts</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
          Activity Feed
        </h3>
        {feedLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        ) : feed && feed.length > 0 ? (
          <div className="space-y-2">
            {feed.slice(0, 10).map((activity) => {
              const Icon = activityIcons[activity.type] || Dumbbell;
              return (
                <Card key={activity.id} data-testid={`card-activity-${activity.id}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.notes || activity.type}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary shrink-0">
                      +{activity.xpEarned} XP
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No recent activity
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
