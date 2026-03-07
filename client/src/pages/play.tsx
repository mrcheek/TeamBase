import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Calendar, MapPin, ChevronRight, Clock, Users, Trophy, Search } from "lucide-react";
import type { Event, Club } from "@shared/schema";

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
      <div
        className="flex items-center gap-3 py-3 cursor-pointer"
        data-testid={`row-event-${event.id}`}
      >
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: clubColor + "15" }}
        >
          <TypeIcon className="w-4 h-4" style={{ color: clubColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm leading-tight truncate" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </span>
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 shrink-0"
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
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
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
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      </div>
    </Link>
  );
}

function ClubRow({ club }: { club: Club }) {
  const clubColor = club.primaryColor || "#1a7a4e";
  const textColor = club.textOnPrimary || "#fff";

  return (
    <Link href={`/clubs/${club.id}`}>
      <div
        className="flex items-center gap-3 py-3 cursor-pointer"
        data-testid={`row-club-${club.id}`}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: clubColor, color: textColor }}
        >
          <span className="text-[10px] font-bold">{getClubInitials(club.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm" data-testid={`text-club-name-${club.id}`}>
            {club.name}
          </span>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
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
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
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
    <div className="pb-24 pt-4 max-w-lg mx-auto">
      <div className="px-4 mb-1">
        <h2 className="text-xl font-bold tracking-tight" data-testid="text-play-title">Play</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Events & Clubs</p>
      </div>

      <div className="flex border-b px-4 mt-3">
        <button
          onClick={() => setTab("events")}
          className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === "events"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
          data-testid="button-events-tab"
        >
          Events
        </button>
        <button
          onClick={() => setTab("clubs")}
          className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
            tab === "clubs"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
          data-testid="button-clubs-tab"
        >
          Clubs
        </button>
      </div>

      {tab === "events" && (
        <div className="px-4">
          <div className="flex gap-3 overflow-x-auto py-3 no-scrollbar" data-testid="filter-row">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                className={`text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === opt.value
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setFilter(opt.value)}
                data-testid={`button-filter-${opt.value}`}
              >
                {opt.label}
                {filter === opt.value && (
                  <div className="h-0.5 mt-1 rounded-full bg-foreground" />
                )}
              </button>
            ))}
          </div>

          {eventsLoading ? (
            <div className="space-y-3 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div>
              {todayEvents.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2 mb-1" data-testid="text-section-today">
                    Today
                  </h3>
                  <div className="divide-y">
                    {todayEvents.map((event) => (
                      <EventRow key={event.id} event={event} clubs={clubs} />
                    ))}
                  </div>
                </div>
              )}

              {upcomingEvents.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2 mb-1" data-testid="text-section-upcoming">
                    Upcoming
                  </h3>
                  <div className="divide-y">
                    {upcomingEvents.map((event) => (
                      <EventRow key={event.id} event={event} clubs={clubs} />
                    ))}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div className="mb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2 mb-1" data-testid="text-section-past">
                    Past
                  </h3>
                  <div className="divide-y">
                    {pastEvents.map((event) => (
                      <EventRow key={event.id} event={event} clubs={clubs} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center" data-testid="text-no-events">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No events scheduled</p>
            </div>
          )}
        </div>
      )}

      {tab === "clubs" && (
        <div className="px-4">
          {clubsLoading ? (
            <div className="space-y-2 mt-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md" />
              ))}
            </div>
          ) : clubs && clubs.length > 0 ? (
            <div className="divide-y">
              {clubs.map((club) => (
                <ClubRow key={club.id} club={club} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center" data-testid="text-no-clubs">
              <Users className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No clubs found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
