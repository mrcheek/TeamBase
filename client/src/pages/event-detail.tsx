import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getEventImage } from "@/lib/event-images";
import { useAuth } from "@/hooks/use-auth";
import { useClubTheme } from "@/hooks/use-club-theme";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Tag,
  Activity,
  Zap,
} from "lucide-react";
import type { Event, Attendance, User, Club } from "@shared/schema";

const eventTypeConfig: Record<string, { label: string; color: string; accent: string; icon: typeof Activity }> = {
  training: {
    label: "Training",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    accent: "from-emerald-600 to-emerald-800",
    icon: Activity,
  },
  match: {
    label: "Match",
    color: "bg-red-500/10 text-red-700 dark:text-red-400",
    accent: "from-red-600 to-red-800",
    icon: Zap,
  },
  tournament: {
    label: "Tournament",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    accent: "from-amber-600 to-amber-800",
    icon: Zap,
  },
  touch_rugby: {
    label: "Touch Rugby",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    accent: "from-blue-600 to-blue-800",
    icon: Activity,
  },
  social: {
    label: "Social",
    color: "bg-amber-400/10 text-amber-600 dark:text-amber-400",
    accent: "from-amber-500 to-amber-700",
    icon: Users,
  },
};

type FeedItem = {
  id: number;
  type: string;
  xpEarned: number;
  createdAt: string;
  user: Omit<User, "password">;
};

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:id");
  const eventId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const { primaryColor } = useClubTheme();

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  const { data: attendanceList } = useQuery<(Attendance & { user: Omit<User, "password"> })[]>({
    queryKey: ["/api/events", eventId, "attendance"],
    enabled: !!eventId,
  });

  const { data: club } = useQuery<Club>({
    queryKey: ["/api/clubs", event?.clubId],
    enabled: !!event?.clubId,
  });

  const { data: feedItems } = useQuery<FeedItem[]>({
    queryKey: ["/api/feed"],
  });

  const isCheckedIn = attendanceList?.some((a) => a.userId === user?.id);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/check-in/event", { eventId, method: "manual" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({ title: "Checked in!", description: "+25 XP earned" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Check-in failed", description: error.message });
    },
  });

  const clubFeedItems = feedItems
    ?.filter((f) => {
      if (!club) return false;
      return true;
    })
    .slice(0, 4);

  const typeConfig = event ? eventTypeConfig[event.type] || eventTypeConfig.training : eventTypeConfig.training;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title,
          text: `${event.title} - ${formatDate(event.date)} at ${event.time}`,
          url: window.location.href,
        });
      } catch {
        toast({ title: "Link copied", description: "Event link copied to clipboard" });
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast({ title: "Link copied", description: "Event link copied to clipboard" });
    }
  };

  if (isLoading) {
    return (
      <div className="pb-24 max-w-lg mx-auto">
        <Skeleton className="h-56 w-full" />
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 rounded-md" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto text-center">
        <p className="text-muted-foreground" data-testid="text-event-not-found">Event not found</p>
      </div>
    );
  }

  const displayedAttendees = attendanceList?.slice(0, 6) || [];
  const remainingCount = (attendanceList?.length || 0) - displayedAttendees.length;

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div
        className="relative px-4 pt-3 pb-6 overflow-hidden"
        data-testid="section-event-hero"
      >
        <img
          src={getEventImage(event.type)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="img-event-hero-bg"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, hsl(var(--club-primary) / 0.85) 0%, hsl(var(--club-primary) / 0.7) 100%)`,
          }}
        />
        <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-4">
          <Link href="/play">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white no-default-hover-elevate"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Badge className={typeConfig.color} data-testid="badge-event-type">
            {typeConfig.label}
          </Badge>
        </div>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "hsl(var(--club-primary-foreground))" }}
          data-testid="text-event-title"
        >
          {event.title}
        </h1>

        {club && (
          <Link href={`/clubs/${club.id}`}>
            <span
              className="text-sm font-medium opacity-90 hover:opacity-100"
              style={{ color: "hsl(var(--club-primary-foreground))" }}
              data-testid="link-event-club"
            >
              {club.name}
            </span>
          </Link>
        )}

        <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ color: "hsl(var(--club-primary-foreground) / 0.85)" }}>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-sm">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm">{event.time}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm">{event.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-5">
          {user && (
            <>
              {isCheckedIn ? (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-white/20 backdrop-blur-sm"
                  data-testid="text-already-checked-in"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">CHECKED IN</span>
                </div>
              ) : (
                <Button
                  className="bg-white text-foreground font-semibold"
                  style={{ color: primaryColor }}
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                  data-testid="button-event-checkin"
                >
                  {checkInMutation.isPending ? "Checking in..." : "CHECK IN"}
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            className="border-white/30 text-white bg-white/10 backdrop-blur-sm no-default-hover-elevate"
            onClick={handleShare}
            data-testid="button-share-event"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            SHARE
          </Button>
        </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event Type</span>
              </div>
              <p className="text-sm font-semibold capitalize" data-testid="text-event-type-detail">
                {event.type.replace("_", " ")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</span>
              </div>
              <p className="text-sm font-semibold" data-testid="text-event-status">
                {isCheckedIn ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Checked In</span>
                ) : (
                  <span style={{ color: "hsl(var(--club-primary))" }}>Open for check-in</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <section data-testid="section-about">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">About</h3>
          {event.description ? (
            <p className="text-sm leading-relaxed" data-testid="text-event-description">{event.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic" data-testid="text-event-no-description">
              No additional details for this event.
            </p>
          )}
        </section>

        <section data-testid="section-attending">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Attending ({attendanceList?.length || 0})
              </h3>
            </div>
          </div>

          {displayedAttendees.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                {displayedAttendees.map((att) => {
                  const initials = att.user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <Avatar
                      key={att.id}
                      className="w-9 h-9 -ml-1 first:ml-0 border-2 border-background"
                      data-testid={`avatar-attendee-${att.id}`}
                    >
                      {att.user.photoUrl && <AvatarImage src={att.user.photoUrl} alt={att.user.fullName} />}
                      <AvatarFallback
                        className="text-xs font-bold"
                        style={{
                          backgroundColor: "hsl(var(--club-primary) / 0.15)",
                          color: "hsl(var(--club-primary))",
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
                {remainingCount > 0 && (
                  <Avatar className="w-9 h-9 -ml-1 border-2 border-background" data-testid="avatar-remaining-count">
                    <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                      +{remainingCount}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              {attendanceList && attendanceList.length > 0 && (
                <Card>
                  <CardContent className="p-0">
                    {attendanceList.slice(0, 5).map((att, idx) => {
                      return (
                        <div
                          key={att.id}
                          className={`flex items-center gap-3 px-4 py-2.5 ${
                            idx < Math.min(attendanceList.length, 5) - 1 ? "border-b" : ""
                          }`}
                          data-testid={`row-attendee-${att.id}`}
                        >
                          <UserAvatar fullName={att.user.fullName} photoUrl={att.user.photoUrl} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.user.fullName}</p>
                          </div>
                          <span className="text-xs text-muted-foreground capitalize">{att.method}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
              {attendanceList && attendanceList.length > 5 && (
                <p className="text-xs text-muted-foreground text-center" data-testid="link-view-full-list">
                  View full list of {attendanceList.length} attendees
                </p>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground" data-testid="text-no-attendees">
                  No one has checked in yet. Be the first!
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {clubFeedItems && clubFeedItems.length > 0 && (
          <section data-testid="section-club-activity">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Related Club Activity
            </h3>
            <Card>
              <CardContent className="p-0">
                {clubFeedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      idx < clubFeedItems.length - 1 ? "border-b" : ""
                    }`}
                    data-testid={`row-feed-${item.id}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "hsl(var(--club-primary) / 0.1)" }}
                    >
                      <Zap className="w-3.5 h-3.5" style={{ color: "hsl(var(--club-primary))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{item.user.fullName}</span>{" "}
                        <span className="text-muted-foreground">{item.type.replace("_", " ")}</span>
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      +{item.xpEarned} XP
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
