import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Calendar, MapPin, ChevronRight, Clock, Users, Trophy, Search } from "lucide-react";
import type { Event, Club } from "@shared/schema";

const eventTypeColors: Record<string, string> = {
  training: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  touch_rugby: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  match: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  tournament: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  social: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const eventTypeIcons: Record<string, typeof Trophy> = {
  training: Users,
  touch_rugby: Users,
  match: Trophy,
  tournament: Trophy,
  social: Users,
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

function getClubInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function EventRow({ event, clubs }: { event: Event; clubs?: Club[] }) {
  const club = clubs?.find(c => c.id === event.clubId);
  const clubColor = club?.primaryColor || "#1a7a4e";
  const TypeIcon = eventTypeIcons[event.type] || Users;

  return (
    <Link href={`/events/${event.id}`}>
      <Card
        className="p-3 hover-elevate cursor-pointer"
        data-testid={`row-event-${event.id}`}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: clubColor + "15" }}
          >
            <TypeIcon className="w-4 h-4" style={{ color: clubColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm leading-tight" data-testid={`text-event-title-${event.id}`}>
                {event.title}
              </span>
              <Badge
                variant="secondary"
                className={`text-[10px] ${eventTypeColors[event.type] || ""}`}
                data-testid={`badge-event-type-${event.id}`}
              >
                {event.type.replace("_", " ")}
              </Badge>
            </div>
            {club && (
              <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-event-club-${event.id}`}>
                {club.name}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
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
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />
        </div>
      </Card>
    </Link>
  );
}

function ClubRow({ club }: { club: Club }) {
  const clubColor = club.primaryColor || "#1a7a4e";
  const secondaryColor = club.secondaryColor || "#e0e0e0";

  return (
    <Link href={`/clubs/${club.id}`}>
      <Card
        className="p-3 hover-elevate cursor-pointer"
        data-testid={`row-club-${club.id}`}
      >
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback
              className="text-xs font-bold"
              style={{ backgroundColor: clubColor, color: secondaryColor }}
            >
              {getClubInitials(club.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm" data-testid={`text-club-name-${club.id}`}>
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
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-0.5">
              {[club.primaryColor, club.secondaryColor, club.accentColor]
                .filter(Boolean)
                .map((color, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full border border-border/50"
                    style={{ backgroundColor: color || undefined }}
                  />
                ))}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
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
    <div className="pb-24 px-4 pt-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
        <div>
          <h2 className="text-xl font-bold tracking-tight" data-testid="text-play-title">Play</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Events & Clubs Directory</p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Search className="w-4 h-4" />
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-muted/60 rounded-md p-1">
        <button
          onClick={() => setTab("events")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
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
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
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
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 no-scrollbar" data-testid="filter-row">
            {filterOptions.map((opt) => (
              <Badge
                key={opt.value}
                variant={filter === opt.value ? "default" : "outline"}
                className={`shrink-0 cursor-pointer select-none ${
                  filter === opt.value
                    ? "bg-club-primary text-club-primary-foreground border-club-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setFilter(opt.value)}
                data-testid={`button-filter-${opt.value}`}
              >
                {opt.label}
              </Badge>
            ))}
          </div>

          {eventsLoading ? (
            <div className="space-y-3 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-md" />
              ))}
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div className="mt-1">
              {todayEvents.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" data-testid="text-section-today">
                    Today
                  </h3>
                  <div className="space-y-2">
                    {todayEvents.map((event) => (
                      <EventRow key={event.id} event={event} clubs={clubs} />
                    ))}
                  </div>
                </div>
              )}

              {upcomingEvents.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" data-testid="text-section-upcoming">
                    Upcoming
                  </h3>
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => (
                      <EventRow key={event.id} event={event} clubs={clubs} />
                    ))}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2" data-testid="text-section-past">
                    Past
                  </h3>
                  <div className="space-y-2">
                    {pastEvents.map((event) => (
                      <EventRow key={event.id} event={event} clubs={clubs} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center" data-testid="text-no-events">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No events scheduled</p>
            </div>
          )}
        </div>
      )}

      {tab === "clubs" && (
        <div>
          {clubsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : clubs && clubs.length > 0 ? (
            <div className="space-y-2">
              {clubs.map((club) => (
                <ClubRow key={club.id} club={club} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center" data-testid="text-no-clubs">
              <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No clubs found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
