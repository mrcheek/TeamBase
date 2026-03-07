import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, MapPin, ChevronRight, Clock } from "lucide-react";
import type { Event, Club } from "@shared/schema";

const eventTypeColors: Record<string, string> = {
  training: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  touch_rugby: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  match: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  tournament: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  social: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Training", value: "training" },
  { label: "Matches", value: "match" },
  { label: "Tournaments", value: "tournament" },
  { label: "Touch", value: "touch_rugby" },
  { label: "Social", value: "social" },
];

function isToday(dateStr: string): boolean {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  return dateStr === todayStr;
}

function isFuture(dateStr: string): boolean {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  return dateStr > todayStr;
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function EventRow({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`}>
      <div
        className="flex items-center gap-3 py-3 hover-elevate cursor-pointer"
        data-testid={`row-event-${event.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${eventTypeColors[event.type] || ""}`}
              data-testid={`badge-event-type-${event.id}`}
            >
              {event.type.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatEventDate(event.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {event.time}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

function ClubRow({ club }: { club: Club }) {
  return (
    <Link href={`/clubs/${club.id}`}>
      <div
        className="flex items-center gap-3 py-3 hover-elevate cursor-pointer"
        data-testid={`row-club-${club.id}`}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-xs">
            {club.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm" data-testid={`text-club-name-${club.id}`}>
            {club.name}
          </span>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
            {club.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {club.location}
              </span>
            )}
            {club.trainingSchedule && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {club.trainingSchedule}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

export default function PlayPage() {
  const [tab, setTab] = useState<"events" | "clubs">("events");
  const [filter, setFilter] = useState("all");

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: clubs, isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const filteredEvents = events?.filter(
    (e) => filter === "all" || e.type === filter
  );

  const todayEvents = filteredEvents?.filter((e) => isToday(e.date)) || [];
  const upcomingEvents = filteredEvents?.filter((e) => isFuture(e.date)) || [];
  const pastEvents = filteredEvents?.filter((e) => !isToday(e.date) && !isFuture(e.date)) || [];

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
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2 no-scrollbar" data-testid="filter-row">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  filter === opt.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover-elevate"
                }`}
                data-testid={`button-filter-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {eventsLoading ? (
            <div className="space-y-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div className="mt-2">
              {todayEvents.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1" data-testid="text-section-today">
                    Today
                  </h3>
                  <div className="divide-y divide-border">
                    {todayEvents.map((event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {upcomingEvents.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1" data-testid="text-section-upcoming">
                    Upcoming
                  </h3>
                  <div className="divide-y divide-border">
                    {upcomingEvents.map((event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1" data-testid="text-section-past">
                    Past
                  </h3>
                  <div className="divide-y divide-border">
                    {pastEvents.map((event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground" data-testid="text-no-events">
              No events scheduled
            </div>
          )}
        </div>
      )}

      {tab === "clubs" && (
        <div>
          {clubsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : clubs && clubs.length > 0 ? (
            <div className="divide-y divide-border">
              {clubs.map((club) => (
                <ClubRow key={club.id} club={club} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground" data-testid="text-no-clubs">
              No clubs found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
