import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import {
  Calendar, MapPin, ChevronRight, Clock, Trophy,
  Dumbbell, Footprints, Target, Heart, Users, Zap,
} from "lucide-react";
import type { Event, Club } from "@shared/schema";

const ICON_STROKE = 1.5;

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Training", value: "training" },
  { label: "Matches", value: "match" },
  { label: "Tournaments", value: "tournament" },
  { label: "Touch", value: "touch_rugby" },
  { label: "Social", value: "social" },
];

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  match: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
  training: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
  tournament: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
  touch_rugby: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
  social: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" },
};

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

function isFuture(dateStr: string): boolean {
  return dateStr > new Date().toISOString().split("T")[0];
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
  const typeStyle = eventTypeColors[event.type] || eventTypeColors.training;

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className="flex items-center gap-3 py-4 cursor-pointer"
        data-testid={`row-event-${event.id}`}
      >
        {club ? (
          club.logoUrl ? (
            <img
              src={club.logoUrl}
              alt={club.name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: clubColor,
                color: club.textOnPrimary || "#fff",
              }}
            >
              <span className="text-[10px] font-bold">{getClubInitials(club.name)}</span>
            </div>
          )
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm leading-tight truncate" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </span>
            <span
              className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${typeStyle.bg} ${typeStyle.text}`}
              data-testid={`badge-event-type-${event.id}`}
            >
              {event.type.replace("_", " ")}
            </span>
          </div>
          {club && (
            <p className="text-xs text-muted-foreground mt-1" data-testid={`text-event-club-${event.id}`}>
              {club.name}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">
            {formatEventDate(event.date)} · {event.time}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" strokeWidth={ICON_STROKE} />
      </div>
    </Link>
  );
}

const trainingCategories = [
  {
    title: "SAQ Drills",
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    items: [
      "Ladder footwork",
      "Cone reaction drill",
      "Zig-zag sprint",
      "Lateral shuffle",
    ],
  },
  {
    title: "Gym Sessions",
    icon: Dumbbell,
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Upper body power",
      "Lower body strength",
      "Core stability",
      "Full body circuit",
    ],
  },
  {
    title: "Running Programs",
    icon: Footprints,
    color: "text-emerald-600 dark:text-emerald-400",
    items: [
      "Easy run (3-5km)",
      "Interval training",
      "Tempo run",
      "Beach run",
    ],
  },
  {
    title: "Skills Training",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    items: [
      "Passing accuracy",
      "Tackle technique",
      "Ruck & maul drills",
      "Kicking practice",
    ],
  },
  {
    title: "Recovery",
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    items: [
      "Yoga flow",
      "Foam rolling",
      "Post-training stretch",
      "Ice bath protocol",
    ],
  },
  {
    title: "Team Drills",
    icon: Users,
    color: "text-cyan-600 dark:text-cyan-400",
    items: [
      "Touch rugby",
      "Defence patterns",
      "Attack shapes",
      "Set piece practice",
    ],
  },
];

export default function PlayPage() {
  const [tab, setTab] = useState<"events" | "training" | "battle">("events");
  const [filter, setFilter] = useState("all");

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: clubs } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const filteredEvents = events?.filter(
    (e) => filter === "all" || e.type === filter
  );

  const todayStr = new Date().toISOString().split("T")[0];

  const pinnedEvent = filteredEvents
    ?.filter((e) => e.type === "tournament" && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const todayEvents = filteredEvents?.filter((e) => isToday(e.date) && e.id !== pinnedEvent?.id) || [];
  const upcomingEvents = filteredEvents?.filter((e) => isFuture(e.date) && e.id !== pinnedEvent?.id) || [];
  const pastEvents = filteredEvents?.filter((e) => !isToday(e.date) && !isFuture(e.date)) || [];

  const tabs = [
    { id: "events" as const, label: "Events" },
    { id: "training" as const, label: "Training" },
    { id: "battle" as const, label: "Battle" },
  ];

  return (
    <div className="pb-24 pt-5 max-w-lg mx-auto">
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold" data-testid="text-play-title">Play</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Events & Rugby Activities</p>
      </div>

      <div className="border-t border-divider" />
      <div className="flex px-4 pt-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-2.5 px-3 text-sm font-medium relative transition-colors ${
              tab === t.id ? "text-foreground" : "text-muted-foreground"
            }`}
            data-testid={`tab-play-${t.id}`}
          >
            {t.label}
            {tab === t.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: `hsl(var(--club-primary))` }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="border-b border-divider" />

      {tab === "events" && (
        <div className="px-4">
          {/* Scrollable filter chips */}
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar" data-testid="filter-row">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                className={`text-xs font-medium whitespace-nowrap px-3 py-1.5 rounded-full border transition-colors ${
                  filter === opt.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border"
                }`}
                onClick={() => setFilter(opt.value)}
                data-testid={`button-filter-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Pinned weekly highlight */}
          {pinnedEvent && filter === "all" && (
            <div className="mb-2">
              <h3
                className="text-[10px] font-bold uppercase tracking-wider mb-2"
                style={{ color: `hsl(var(--club-primary))` }}
              >
                This Week
              </h3>
              <Link href={`/events/${pinnedEvent.id}`}>
                <div
                  className="rounded-lg p-3 cursor-pointer border border-border"
                  data-testid="card-weekly-highlight"
                >
                  <p className="text-sm font-semibold">{pinnedEvent.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatEventDate(pinnedEvent.date)} · {pinnedEvent.time}
                    {pinnedEvent.location ? ` · ${pinnedEvent.location}` : ""}
                  </p>
                </div>
              </Link>
            </div>
          )}

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
                  <div className="divide-y divide-divider">
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
                  <div className="divide-y divide-divider">
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
                  <div className="divide-y divide-divider">
                    {pastEvents.map((event) => (
                      <EventRow key={event.id} event={event} clubs={clubs} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center" data-testid="text-no-events">
              <Calendar className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" strokeWidth={ICON_STROKE} />
              <p className="text-sm text-muted-foreground">No events scheduled</p>
            </div>
          )}
        </div>
      )}

      {tab === "training" && <TrainingTab />}
      {tab === "battle" && <BattleTab />}
    </div>
  );
}

function TrainingTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="px-4 pt-4">
      <div className="space-y-1">
        {trainingCategories.map((category) => {
          const isOpen = expanded === category.title;
          const Icon = category.icon;
          return (
            <div key={category.title} data-testid={`section-training-${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <button
                className="w-full flex items-center gap-3 py-3 text-left"
                onClick={() => setExpanded(isOpen ? null : category.title)}
                data-testid={`button-expand-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${category.color}`} strokeWidth={ICON_STROKE} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{category.title}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">{category.items.length} drills</span>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                  strokeWidth={ICON_STROKE}
                />
              </button>
              {isOpen && (
                <div className="pl-7 pb-3 space-y-2.5">
                  {category.items.map((item, idx) => (
                    <p
                      key={idx}
                      className="text-[13px] text-muted-foreground"
                      data-testid={`text-drill-${category.title.toLowerCase().replace(/\s+/g, '-')}-${idx}`}
                    >
                      {item}
                    </p>
                  ))}
                </div>
              )}
              <div className="border-b border-divider" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BattleTab() {
  const { user } = useAuth();
  const { data: clubLeaderboard, isLoading } = useQuery<{ club: Club; score: number }[]>({
    queryKey: ["/api/leaderboard/clubs"],
  });

  const maxScore = clubLeaderboard?.[0]?.score || 1;
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysRemaining = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  const medals = ["🥇", "🥈", "🥉"];

  const userContribution = user?.xpTotal ? Math.round(user.xpTotal * 0.5) : 0;

  return (
    <div className="px-4 pt-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4" strokeWidth={ICON_STROKE} style={{ color: `hsl(var(--club-primary))` }} />
          <h3 className="text-sm font-bold">Weekly Club Battle</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {daysRemaining > 0 ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining` : "Resets tomorrow"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </div>
      ) : clubLeaderboard && clubLeaderboard.length > 0 ? (
        <div className="space-y-5">
          {clubLeaderboard.map((entry, idx) => {
            const isUserClub = user?.memberships?.some?.((m: any) => m.clubId === entry.club.id);
            return (
              <div key={entry.club.id} data-testid={`row-battle-club-${entry.club.id}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg w-7 text-center shrink-0">
                    {idx < 3 ? medals[idx] : (
                      <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                    )}
                  </span>
                  {entry.club.logoUrl ? (
                    <img
                      src={entry.club.logoUrl}
                      alt={entry.club.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: entry.club.primaryColor || undefined,
                        color: entry.club.textOnPrimary || "#fff",
                      }}
                    >
                      <span className="text-[9px] font-bold">{getClubInitials(entry.club.name)}</span>
                    </div>
                  )}
                  <span className="flex-1 text-sm font-semibold truncate">{entry.club.name}</span>
                  <span className="text-sm font-bold tabular-nums">{entry.score} pts</span>
                </div>
                <div className="ml-10">
                  <Progress
                    value={Math.min((entry.score / maxScore) * 100, 100)}
                    className="h-3 rounded-full"
                  />
                  {isUserClub && userContribution > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Your contribution: {userContribution} pts
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Trophy className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" strokeWidth={ICON_STROKE} />
          <p className="text-sm text-muted-foreground">No battle data yet</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-divider">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          How Points Are Earned
        </h4>
        <div className="space-y-1.5 text-[13px] text-muted-foreground">
          <p>50% of each member's XP goes to the club score</p>
          <p>Log activities, check in to events, complete challenges</p>
          <p>Standings reset weekly</p>
        </div>
      </div>
    </div>
  );
}
