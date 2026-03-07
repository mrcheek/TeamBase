import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "wouter";
import {
  Calendar, MapPin, ChevronRight, Clock, Users, Trophy, Zap,
  Dumbbell, Footprints, Target, Heart, TrendingUp,
} from "lucide-react";
import type { Event, Club } from "@shared/schema";

const ICON_STROKE = 1.5;

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
          <TypeIcon className="w-4 h-4" strokeWidth={ICON_STROKE} style={{ color: clubColor }} />
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
              <Calendar className="w-3 h-3" strokeWidth={ICON_STROKE} />
              {formatEventDate(event.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={ICON_STROKE} />
              {event.time}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" strokeWidth={ICON_STROKE} />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" strokeWidth={ICON_STROKE} />
      </div>
    </Link>
  );
}

const trainingCategories = [
  {
    title: "SAQ Drills",
    description: "Speed, Agility & Quickness",
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10",
    accentBar: "bg-amber-500",
    items: [
      { name: "Ladder Drills", detail: "Quick feet patterns" },
      { name: "Cone Agility", detail: "Change of direction" },
      { name: "Sprint Intervals", detail: "20m / 40m / 60m" },
      { name: "Lateral Shuffle", detail: "Side-to-side movement" },
    ],
  },
  {
    title: "Gym Sessions",
    description: "Strength & Conditioning",
    icon: Dumbbell,
    color: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    accentBar: "bg-blue-500",
    items: [
      { name: "Upper Body Power", detail: "Bench, rows, press" },
      { name: "Lower Body Strength", detail: "Squats, lunges" },
      { name: "Core Stability", detail: "Planks, rotations" },
      { name: "Full Body Circuit", detail: "Compound movements" },
    ],
  },
  {
    title: "Running Programs",
    description: "Endurance & Match Fitness",
    icon: Footprints,
    color: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    accentBar: "bg-emerald-500",
    items: [
      { name: "Easy Run", detail: "3-5km steady pace" },
      { name: "Interval Training", detail: "400m repeats" },
      { name: "Tempo Run", detail: "Match pace simulation" },
      { name: "Beach Run", detail: "Sand resistance training" },
    ],
  },
  {
    title: "Skills Training",
    description: "Rugby-Specific Development",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-500/10",
    accentBar: "bg-purple-500",
    items: [
      { name: "Passing Accuracy", detail: "Spiral & pop passes" },
      { name: "Tackle Technique", detail: "Safe tackling practice" },
      { name: "Ruck & Maul", detail: "Contact drills" },
      { name: "Kicking Practice", detail: "Goal & touch kicks" },
    ],
  },
  {
    title: "Recovery",
    description: "Mobility & Injury Prevention",
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/10",
    accentBar: "bg-red-500",
    items: [
      { name: "Yoga Flow", detail: "Flexibility routine" },
      { name: "Foam Rolling", detail: "Muscle recovery" },
      { name: "Stretching", detail: "Post-training routine" },
      { name: "Ice Bath Protocol", detail: "Recovery method" },
    ],
  },
  {
    title: "Team Drills",
    description: "Group Training & Cohesion",
    icon: Users,
    color: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/10",
    accentBar: "bg-cyan-500",
    items: [
      { name: "Touch Rugby", detail: "Small-sided games" },
      { name: "Defence Patterns", detail: "Line speed drills" },
      { name: "Attack Shapes", detail: "Phase play patterns" },
      { name: "Set Piece Practice", detail: "Scrums & lineouts" },
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

  const todayEvents = filteredEvents?.filter((e) => isToday(e.date)) || [];
  const upcomingEvents = filteredEvents?.filter((e) => isFuture(e.date)) || [];
  const pastEvents = filteredEvents?.filter((e) => !isToday(e.date) && !isFuture(e.date)) || [];

  const tabs = [
    { id: "events" as const, label: "Events" },
    { id: "training" as const, label: "Training" },
    { id: "battle" as const, label: "Battle" },
  ];

  return (
    <div className="pb-24 pt-4 max-w-lg mx-auto">
      <div className="px-4 mb-1">
        <h2 className="text-base font-semibold" data-testid="text-play-title">Play</h2>
      </div>

      <div className="flex border-b border-divider px-4 mt-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2.5 px-3 text-sm font-medium relative transition-colors ${
              tab === t.id ? "text-foreground" : "text-muted-foreground"
            }`}
            data-testid={`tab-play-${t.id}`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
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

      {tab === "training" && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="secondary" data-testid="badge-category-count">
              {trainingCategories.length} Categories
            </Badge>
            <Badge variant="secondary" data-testid="badge-drill-count">
              {trainingCategories.reduce((sum, c) => sum + c.items.length, 0)} Drills
            </Badge>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {trainingCategories.map((category) => (
              <AccordionItem
                key={category.title}
                value={category.title}
                data-testid={`accordion-training-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="border border-border rounded-md overflow-hidden"
              >
                <AccordionTrigger
                  className="px-3 py-3 hover:no-underline hover-elevate"
                  data-testid={`button-expand-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${category.iconBg}`}>
                      <category.icon className={`w-4 h-4 ${category.color}`} strokeWidth={ICON_STROKE} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-sm leading-tight">{category.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-0">
                  <div className="border-t border-border pt-2">
                    {category.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 group"
                        data-testid={`text-drill-${category.title.toLowerCase().replace(/\s+/g, '-')}-${idx}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-1 h-6 rounded-full ${category.accentBar} shrink-0 opacity-60`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={ICON_STROKE} />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {tab === "battle" && <BattleTab />}
    </div>
  );
}

function BattleTab() {
  const { data: clubLeaderboard, isLoading } = useQuery<{ club: Club; score: number }[]>({
    queryKey: ["/api/leaderboard/clubs"],
  });

  const maxScore = clubLeaderboard?.[0]?.score || 1;
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysRemaining = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

  return (
    <div className="px-4 pt-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4" strokeWidth={ICON_STROKE} style={{ color: `hsl(var(--club-primary))` }} />
          <h3 className="text-sm font-semibold">Weekly Club Battle</h3>
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
        <div className="space-y-4">
          {clubLeaderboard.map((entry, idx) => (
            <div key={entry.club.id} data-testid={`row-battle-club-${entry.club.id}`}>
              <div className="flex items-center gap-3 mb-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : idx === 1
                      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: entry.club.primaryColor || undefined,
                    color: entry.club.textOnPrimary || "#fff",
                  }}
                >
                  <span className="text-[8px] font-bold">{getClubInitials(entry.club.name)}</span>
                </div>
                <span className="flex-1 text-sm font-medium truncate">{entry.club.name}</span>
                <span className="text-xs font-semibold tabular-nums">{entry.score} pts</span>
              </div>
              <Progress
                value={Math.min((entry.score / maxScore) * 100, 100)}
                className="h-1.5"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Trophy className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" strokeWidth={ICON_STROKE} />
          <p className="text-sm text-muted-foreground">No battle data yet</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-divider">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
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
