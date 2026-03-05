import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import type { Event, Club } from "@shared/schema";

const eventTypeColors: Record<string, string> = {
  training: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  touch_rugby: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  match: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  tournament: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  social: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function PlayPage() {
  const [tab, setTab] = useState<"events" | "clubs">("events");

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: clubs, isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <h2 className="text-lg font-bold mb-4" data-testid="text-play-title">Play</h2>

      <div className="flex gap-1 mb-5 bg-muted rounded-md p-1">
        <button
          onClick={() => setTab("events")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "events"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground"
          }`}
          data-testid="button-events-tab"
        >
          Events
        </button>
        <button
          onClick={() => setTab("clubs")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === "clubs"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground"
          }`}
          data-testid="button-clubs-tab"
        >
          Clubs
        </button>
      </div>

      {tab === "events" && (
        <div>
          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-md" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="hover-elevate" data-testid={`card-event-${event.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm flex-1">{event.title}</h4>
                        <Badge variant="secondary" className={eventTypeColors[event.type] || ""}>
                          {event.type.replace("_", " ")}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span>{event.time}</span>
                        {event.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No events scheduled
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "clubs" && (
        <div>
          {clubsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-md" />
              ))}
            </div>
          ) : clubs && clubs.length > 0 ? (
            <div className="space-y-3">
              {clubs.map((club) => (
                <Link key={club.id} href={`/clubs/${club.id}`}>
                  <Card className="hover-elevate" data-testid={`card-club-${club.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-sm">
                            {club.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{club.name}</h4>
                          {club.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {club.location}
                            </p>
                          )}
                          {club.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {club.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No clubs found
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
