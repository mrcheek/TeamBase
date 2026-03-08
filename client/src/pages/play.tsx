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

interface Drill {
  name: string;
  description: string;
  duration: string;
  difficulty: "easy" | "medium" | "hard";
  tip: string;
}

const trainingCategories: {
  title: string;
  icon: typeof Zap;
  color: string;
  image: string;
  items: Drill[];
}[] = [
  {
    title: "SAQ Drills",
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    image: "/images/activities/saq.png",
    items: [
      { name: "Ladder Footwork", description: "High-speed foot patterns through an agility ladder. Focus on quick ground contact and arm drive.", duration: "10 min", difficulty: "medium", tip: "Stay on the balls of your feet — heel contact kills speed." },
      { name: "Cone Reaction Drill", description: "Partner calls a colour; sprint to the matching cone. Trains reaction time and explosive acceleration.", duration: "12 min", difficulty: "hard", tip: "Keep a low athletic stance between reps so you can explode in any direction." },
      { name: "Zig-Zag Sprint", description: "Sprint between cones set in a zig-zag pattern, cutting sharply at each turn. Builds change-of-direction speed.", duration: "8 min", difficulty: "medium", tip: "Plant your outside foot hard on each cut — don't round the corners." },
      { name: "Lateral Shuffle", description: "Side-to-side shuffle between two markers without crossing your feet. Great for defensive positioning.", duration: "8 min", difficulty: "easy", tip: "Keep your hips low and chest up throughout the movement." },
      { name: "T-Drill", description: "Sprint forward, shuffle left, shuffle right, backpedal. The classic agility test covering all movement planes.", duration: "10 min", difficulty: "hard", tip: "Touch each cone to ensure you reach full range on every rep." },
    ],
  },
  {
    title: "Gym Sessions",
    icon: Dumbbell,
    color: "text-blue-600 dark:text-blue-400",
    image: "/images/activities/gym.png",
    items: [
      { name: "Upper Body Power", description: "Bench press, bent-over rows, and shoulder press. Focus on controlled explosive reps for rugby-specific power.", duration: "40 min", difficulty: "hard", tip: "Use 70-80% of your max and focus on bar speed rather than grinding reps." },
      { name: "Lower Body Strength", description: "Squats, deadlifts, and lunges. The foundation of scrummaging power and tackling force.", duration: "45 min", difficulty: "hard", tip: "Always warm up with bodyweight squats and hip mobility before loading the bar." },
      { name: "Core Stability Circuit", description: "Plank variations, pallof press, dead bugs, and anti-rotation holds. Essential for contact stability.", duration: "20 min", difficulty: "medium", tip: "Brace your core as if expecting a tackle — don't just hold your breath." },
      { name: "Full Body Circuit", description: "Kettlebell swings, box jumps, push-ups, and pull-ups in timed rounds. Builds rugby-ready conditioning.", duration: "30 min", difficulty: "medium", tip: "Keep rest periods short (30-45s) to simulate the demands of a match." },
      { name: "Olympic Lifts", description: "Power cleans and hang snatches for explosive hip extension. Directly transfers to tackling and lineout lifting.", duration: "35 min", difficulty: "hard", tip: "Start light and nail the technique — these lifts are about speed, not max weight." },
    ],
  },
  {
    title: "Running Programs",
    icon: Footprints,
    color: "text-emerald-600 dark:text-emerald-400",
    image: "/images/activities/running.png",
    items: [
      { name: "Easy Run (3-5km)", description: "Relaxed conversational pace run to build aerobic base and aid recovery between hard sessions.", duration: "20-30 min", difficulty: "easy", tip: "You should be able to hold a conversation — if you can't, slow down." },
      { name: "Interval Training", description: "6-8 reps of 200m sprints with 90 seconds rest. Builds the speed endurance needed for repeated efforts in a match.", duration: "25 min", difficulty: "hard", tip: "Run each rep at the same pace — don't blast the first two and die on the rest." },
      { name: "Tempo Run", description: "Sustained effort at 75-80% max heart rate for 20-30 minutes. Builds your lactate threshold for sustained work.", duration: "30 min", difficulty: "medium", tip: "Find a pace that feels 'comfortably hard' — you could speak in short phrases but not full sentences." },
      { name: "Beach Run", description: "Soft sand running for extra resistance. Builds ankle strength and calf power while being easier on joints.", duration: "20 min", difficulty: "medium", tip: "Shorten your stride on sand — fighting for long strides wastes energy." },
      { name: "Fartlek Session", description: "Unstructured speed play — alternate between fast bursts and easy jogs using landmarks as markers.", duration: "25 min", difficulty: "medium", tip: "Use trees, lamp posts, or buildings as sprint targets to keep it fun and unpredictable." },
    ],
  },
  {
    title: "Skills Training",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    image: "/images/activities/skills.png",
    items: [
      { name: "Passing Accuracy", description: "Stationary and running passes at different distances. Work on spin pass, pop pass, and offloads.", duration: "20 min", difficulty: "easy", tip: "Point your hands at the target after releasing — follow through every time." },
      { name: "Tackle Technique", description: "Progressive tackling drills from knees, to walk, to jog speed. Focus on shoulder placement and leg drive.", duration: "25 min", difficulty: "medium", tip: "Get your head to the correct side and drive through with your legs, not your arms." },
      { name: "Ruck & Maul Drills", description: "Body positioning, clean-out technique, and counter-rucking. Work in pairs or small groups.", duration: "20 min", difficulty: "hard", tip: "Stay low and square — the lower player always wins the battle at the breakdown." },
      { name: "Kicking Practice", description: "Goal kicks, restarts, and tactical box kicks. Work on both feet if possible.", duration: "30 min", difficulty: "medium", tip: "Focus on a smooth, repeatable technique rather than distance — accuracy comes first." },
      { name: "Catch & Pass Under Pressure", description: "Receive and deliver passes with a defender closing. Builds decision-making and handling under fatigue.", duration: "15 min", difficulty: "hard", tip: "Keep your eyes on the ball into your hands before looking for the pass option." },
    ],
  },
  {
    title: "Recovery",
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    image: "/images/activities/recovery.png",
    items: [
      { name: "Yoga Flow", description: "A gentle 20-minute sequence targeting hips, hamstrings, and shoulders — the areas rugby players tighten most.", duration: "20 min", difficulty: "easy", tip: "Focus on deep breathing — exhale into each stretch for a deeper release." },
      { name: "Foam Rolling", description: "Self-myofascial release for quads, IT bands, calves, and upper back. Reduces soreness and improves mobility.", duration: "15 min", difficulty: "easy", tip: "Roll slowly and pause on tender spots for 20-30 seconds — don't rush through it." },
      { name: "Post-Training Stretch", description: "Static stretching routine targeting all major muscle groups. Hold each stretch for 30-45 seconds.", duration: "15 min", difficulty: "easy", tip: "Only stretch after exercise when muscles are warm — never force a cold stretch." },
      { name: "Ice Bath Protocol", description: "10-15 minutes in cold water (10-15°C) to reduce inflammation and accelerate recovery after intense sessions.", duration: "15 min", difficulty: "medium", tip: "Start with your feet and legs before submerging your torso — the shock is easier to manage." },
      { name: "Active Recovery Walk", description: "A 20-minute brisk walk to promote blood flow without adding training stress. Perfect for rest days.", duration: "20 min", difficulty: "easy", tip: "Walk at a pace that feels purposeful but not tiring — arms swinging naturally." },
    ],
  },
  {
    title: "Team Drills",
    icon: Users,
    color: "text-cyan-600 dark:text-cyan-400",
    image: "/images/activities/team.png",
    items: [
      { name: "Touch Rugby", description: "Non-contact game focusing on passing, support lines, and spatial awareness. Great warm-up or skills session.", duration: "20 min", difficulty: "easy", tip: "Focus on running onto the ball rather than standing and catching — depth is your friend." },
      { name: "Defence Patterns", description: "Line speed, drift defence, and blitz defence drills. Communication and alignment are key.", duration: "25 min", difficulty: "medium", tip: "Talk constantly — call 'inside', 'outside', 'up' to keep the line connected." },
      { name: "Attack Shapes", description: "Running pre-set attacking moves from set piece and phase play. Focus on timing and depth of running lines.", duration: "25 min", difficulty: "medium", tip: "Run your line at pace even in practice — walking through moves builds bad habits." },
      { name: "Set Piece Practice", description: "Lineout lifting, scrum engagement, and restart receipt. The technical foundations that win possession.", duration: "30 min", difficulty: "hard", tip: "Repetition builds consistency — do 20 perfect lifts rather than 5 sloppy ones." },
      { name: "Small-Sided Games", description: "3v3 or 4v4 games in a small area. Forces quick decisions, close-quarters handling, and fitness.", duration: "15 min", difficulty: "medium", tip: "Use the touchline as an extra defender — play away from it to create space." },
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

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

function TrainingTab() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);

  return (
    <div className="px-4 pt-4">
      <div className="space-y-3">
        {trainingCategories.map((category) => {
          const isOpen = expanded === category.title;
          const slug = category.title.toLowerCase().replace(/\s+/g, '-');
          return (
            <div key={category.title} data-testid={`section-training-${slug}`}>
              <button
                className="w-full relative overflow-hidden rounded-xl text-left group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setExpanded(isOpen ? null : category.title)}
                aria-expanded={isOpen}
                data-testid={`button-expand-${slug}`}
              >
                <div className="relative h-24 overflow-hidden rounded-xl">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                  <div className="relative h-full flex items-end p-3.5">
                    <div className="flex-1">
                      <p className="text-white font-bold text-base tracking-wide" data-testid={`text-category-title-${slug}`}>{category.title}</p>
                      <p className="text-white/60 text-xs" data-testid={`text-category-count-${slug}`}>{category.items.length} drills</p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-white/70 transition-transform shrink-0 ${isOpen ? "rotate-90" : ""}`}
                      strokeWidth={ICON_STROKE}
                    />
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="mt-1 space-y-0.5">
                  {category.items.map((drill, idx) => {
                    const drillKey = `${slug}-${idx}`;
                    const drillOpen = expandedDrill === drillKey;
                    return (
                      <div key={idx} data-testid={`text-drill-${slug}-${idx}`}>
                        <button
                          className="w-full flex items-center gap-3 py-3 px-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                          onClick={() => setExpandedDrill(drillOpen ? null : drillKey)}
                          aria-expanded={drillOpen}
                          data-testid={`button-drill-${slug}-${idx}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" data-testid={`text-drill-name-${slug}-${idx}`}>{drill.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${difficultyColors[drill.difficulty]}`} data-testid={`text-drill-difficulty-${slug}-${idx}`}>
                              {drill.difficulty}
                            </span>
                            <span className="text-[11px] text-muted-foreground" data-testid={`text-drill-duration-${slug}-${idx}`}>{drill.duration}</span>
                            <ChevronRight
                              className={`w-3 h-3 text-muted-foreground transition-transform ${drillOpen ? "rotate-90" : ""}`}
                              strokeWidth={ICON_STROKE}
                            />
                          </div>
                        </button>
                        {drillOpen && (
                          <div className="px-1 pb-3 space-y-2">
                            <p className="text-[13px] text-muted-foreground leading-relaxed" data-testid={`text-drill-desc-${slug}-${idx}`}>{drill.description}</p>
                            <div className="flex items-start gap-2 rounded-lg p-2.5" style={{ backgroundColor: "hsl(var(--club-primary) / 0.06)" }}>
                              <Target className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "hsl(var(--club-primary))" }} strokeWidth={ICON_STROKE} />
                              <p className="text-xs font-medium" style={{ color: "hsl(var(--club-primary))" }} data-testid={`text-drill-tip-${slug}-${idx}`}>{drill.tip}</p>
                            </div>
                          </div>
                        )}
                        <div className="border-b border-divider" />
                      </div>
                    );
                  })}
                </div>
              )}
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
