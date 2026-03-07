import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Users,
  Trophy,
  Clock,
  ArrowLeft,
  ChevronRight,
  Shield,
  TrendingUp,
  Dumbbell,
  Footprints,
  Heart,
  Eye,
  Zap,
} from "lucide-react";
import type { Club, Event, User, Membership, Activity } from "@shared/schema";

function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const activityIcons: Record<string, any> = {
  gym: Dumbbell,
  running: Footprints,
  saq: TrendingUp,
  recovery: Heart,
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

export default function ClubDetailPage() {
  const [, params] = useRoute("/clubs/:id");
  const clubId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: club, isLoading } = useQuery<Club>({
    queryKey: ["/api/clubs", clubId],
    enabled: !!clubId,
  });

  const { data: members } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/clubs", clubId, "members"],
    enabled: !!clubId,
  });

  const { data: clubEvents } = useQuery<Event[]>({
    queryKey: ["/api/clubs", clubId, "events"],
    enabled: !!clubId,
  });

  const { data: score } = useQuery<{ score: number }>({
    queryKey: ["/api/clubs", clubId, "score"],
    enabled: !!clubId,
  });

  const { data: clubLeaderboard } = useQuery<{ club: Club; score: number }[]>({
    queryKey: ["/api/leaderboard/clubs"],
  });

  const { data: feed } = useQuery<(Activity & { user: Omit<User, "password"> })[]>({
    queryKey: ["/api/feed"],
  });

  const { data: myMemberships } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: !!user,
  });

  const isMember = myMemberships?.some(
    (m) => m.clubId === clubId && (m.status === "active" || m.status === "pending")
  );

  const joinClub = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/memberships", { clubId, status: "pending" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memberships"] });
      toast({ title: "Application sent!", description: "Waiting for club admin approval" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Failed to join", description: error.message });
    },
  });

  const clubRank = clubLeaderboard
    ? clubLeaderboard.findIndex((e) => e.club.id === clubId) + 1
    : null;

  const clubScore = score?.score || 0;
  const maxScore = clubLeaderboard && clubLeaderboard.length > 0
    ? Math.max(...clubLeaderboard.map((e) => e.score), 1)
    : 100;
  const momentumProgress = Math.min(100, (clubScore / maxScore) * 100);

  const upcomingEvents = clubEvents
    ?.filter((e) => new Date(e.date) >= new Date(new Date().toISOString().split("T")[0]))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextTraining = upcomingEvents?.find((e) => e.type === "training") || upcomingEvents?.[0];

  const clubFeed = feed?.filter((a) => {
    const memberIds = members?.map((m) => m.id) || [];
    return memberIds.includes(a.userId);
  });

  const playerCount = members?.filter((m) => m.role === "player").length || 0;
  const coachCount = members?.filter((m) => m.role === "coach").length || 0;
  const otherCount = (members?.length || 0) - playerCount - coachCount;

  const primaryColor = club?.primaryColor || "#1a7a4e";
  const secondaryColor = club?.secondaryColor || "#e0e0e0";
  const textOnPrimary = club?.textOnPrimary || "#FFFFFF";
  const primaryHSL = hexToHSL(primaryColor);

  if (isLoading) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 rounded-md mb-4" />
        <Skeleton className="h-24 rounded-md mb-4" />
        <Skeleton className="h-24 rounded-md" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto text-center">
        <p className="text-muted-foreground">Club not found</p>
      </div>
    );
  }

  const initials = club.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const memberCountParts: string[] = [];
  if (playerCount > 0) memberCountParts.push(`${playerCount} Player${playerCount !== 1 ? "s" : ""}`);
  if (coachCount > 0) memberCountParts.push(`${coachCount} Coach${coachCount !== 1 ? "es" : ""}`);
  if (otherCount > 0) memberCountParts.push(`${otherCount} Staff`);
  const memberCountText = memberCountParts.join(" · ") || `${members?.length || 0} Members`;

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="px-4 pt-2 mb-0">
        <Link href="/play">
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      <div
        className="relative px-4 pt-6 pb-8 mb-4"
        style={{
          background: club.bannerUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${club.bannerUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, hsl(${primaryHSL}), hsl(${primaryHSL} / 0.85))`,
        }}
        data-testid="section-club-hero"
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-2"
            style={{
              backgroundColor: `hsl(${primaryHSL} / 0.3)`,
              borderColor: `hsl(${hexToHSL(secondaryColor)})`,
            }}
          >
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={club.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span
                className="font-bold text-xl"
                style={{ color: textOnPrimary }}
              >
                {initials}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-xl font-bold leading-tight"
              style={{ color: textOnPrimary }}
              data-testid="text-club-name"
            >
              {club.name}
            </h2>
            {club.location && (
              <p className="text-sm flex items-center gap-1 mt-0.5" style={{ color: `${textOnPrimary}cc` }}>
                <MapPin className="w-3 h-3" />
                {club.location}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: `${textOnPrimary}99` }}>
              {memberCountText}
            </p>
          </div>
        </div>

        {user && !isMember && (
          <Button
            className="w-full mt-2"
            variant="secondary"
            onClick={() => joinClub.mutate()}
            disabled={joinClub.isPending}
            data-testid="button-join-club"
          >
            {joinClub.isPending ? "Applying..." : "Apply to Join"}
          </Button>
        )}
      </div>

      <div className="px-4">
        {nextTraining && (
          <section className="mb-5">
            <div
              className="border rounded-md p-4"
              style={{
                backgroundColor: `hsl(${primaryHSL} / 0.06)`,
                borderColor: `hsl(${primaryHSL} / 0.15)`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" style={{ color: `hsl(${primaryHSL})` }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: `hsl(${primaryHSL})` }}
                >
                  Next Session
                </span>
              </div>
              <h3 className="font-bold text-base mb-1" data-testid="text-next-training-title">
                {nextTraining.title}
              </h3>
              <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(nextTraining.date + "T00:00:00").toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {nextTraining.time}
                </span>
                {nextTraining.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {nextTraining.location}
                  </span>
                )}
                <Badge variant="secondary" className={eventTypeColors[nextTraining.type] || ""}>
                  {nextTraining.type.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/check-in">
                  <Button size="sm" data-testid="button-checkin-next-training">
                    Check In
                  </Button>
                </Link>
                <Link href={`/events/${nextTraining.id}`}>
                  <Button size="sm" variant="outline" data-testid="button-details-next-training">
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="mb-5">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Club Rank
                  </span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-club-rank">
                  {clubRank ? `#${clubRank}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {clubLeaderboard ? `of ${clubLeaderboard.length} clubs` : ""}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: `hsl(${primaryHSL})` }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Momentum
                  </span>
                </div>
                <p className="text-2xl font-bold" data-testid="text-club-score">
                  {clubScore}
                </p>
                <Progress
                  value={momentumProgress}
                  className="h-1.5 mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">points</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {club.description && (
          <section className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              About
            </h3>
            <p className="text-sm leading-relaxed">{club.description}</p>
          </section>
        )}

        {clubEvents && clubEvents.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Upcoming Events
              </h3>
              {clubEvents.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  {clubEvents.length} total
                </span>
              )}
            </div>
            <div className="border rounded-md overflow-hidden">
              {(upcomingEvents || clubEvents).slice(0, 4).map((event, idx, arr) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 hover-elevate bg-background ${
                      idx < arr.length - 1 ? "border-b" : ""
                    }`}
                    data-testid={`card-club-event-${event.id}`}
                  >
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        at {event.time}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-[10px] ${eventTypeColors[event.type] || ""}`}>
                      {event.type.replace("_", " ")}
                    </Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {members && members.length > 0 && (
          <section className="mb-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Members
              </h3>
              {members.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  View full roster
                  <ChevronRight className="w-3 h-3 inline ml-0.5" />
                </span>
              )}
            </div>
            <div className="border rounded-md overflow-hidden">
              {members.slice(0, 8).map((member, idx, arr) => {
                const memberInitials = member.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 px-3 py-2.5 bg-background ${
                      idx < arr.length - 1 ? "border-b" : ""
                    }`}
                    data-testid={`row-member-${member.id}`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback
                        className="text-xs font-bold"
                        style={{
                          backgroundColor: `hsl(${primaryHSL} / 0.12)`,
                          color: `hsl(${primaryHSL})`,
                        }}
                      >
                        {memberInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.fullName}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {member.role}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {clubFeed && clubFeed.length > 0 && (
          <section className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Club Activity
            </h3>
            <div className="border rounded-md overflow-hidden">
              {clubFeed.slice(0, 6).map((activity, idx, arr) => {
                const Icon = activityIcons[activity.type] || Dumbbell;
                return (
                  <div
                    key={activity.id}
                    className={`flex items-center gap-3 px-3 py-2.5 bg-background ${
                      idx < arr.length - 1 ? "border-b" : ""
                    }`}
                    data-testid={`row-club-activity-${activity.id}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `hsl(${primaryHSL} / 0.1)` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${primaryHSL})` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.user.fullName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {activity.notes || activity.type}
                      </p>
                    </div>
                    <span className="text-xs font-semibold shrink-0" style={{ color: `hsl(${primaryHSL})` }}>
                      +{activity.xpEarned} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {club.trainingSchedule && (
          <section className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Training Schedule
            </h3>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Clock className="w-4 h-4 shrink-0" style={{ color: `hsl(${primaryHSL})` }} />
                <p className="text-sm">{club.trainingSchedule}</p>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
