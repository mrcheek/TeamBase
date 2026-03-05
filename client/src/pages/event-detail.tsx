import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, Users, ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Event, Attendance, User, Club } from "@shared/schema";

const eventTypeColors: Record<string, string> = {
  training: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  touch_rugby: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  match: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  tournament: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  social: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:id");
  const eventId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const { toast } = useToast();

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

  if (isLoading) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto text-center">
        <p className="text-muted-foreground">Event not found</p>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <Link href="/play">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </Link>

      <div className="mb-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-xl font-bold" data-testid="text-event-title">{event.title}</h2>
          <Badge variant="secondary" className={eventTypeColors[event.type] || ""}>
            {event.type.replace("_", " ")}
          </Badge>
        </div>
        {club && (
          <Link href={`/clubs/${club.id}`}>
            <span className="text-sm text-primary font-medium" data-testid="link-event-club">
              {club.name}
            </span>
          </Link>
        )}
      </div>

      <Card className="mb-5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm">
              {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm">{event.time}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm">{event.location}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {event.description && (
        <section className="mb-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
            Details
          </h3>
          <p className="text-sm leading-relaxed">{event.description}</p>
        </section>
      )}

      {user && (
        <div className="mb-6">
          {isCheckedIn ? (
            <div className="flex items-center gap-2 justify-center py-3 bg-primary/10 rounded-md">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary" data-testid="text-already-checked-in">
                You're checked in!
              </span>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
              data-testid="button-event-checkin"
            >
              {checkInMutation.isPending ? "Checking in..." : "Check In (+25 XP)"}
            </Button>
          )}
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Attendees ({attendanceList?.length || 0})
          </h3>
        </div>
        {attendanceList && attendanceList.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              {attendanceList.map((att, idx) => {
                const initials = att.user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={att.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      idx < attendanceList.length - 1 ? "border-b" : ""
                    }`}
                    data-testid={`row-attendee-${att.id}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{att.user.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{att.method} check-in</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No one has checked in yet. Be the first!
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
