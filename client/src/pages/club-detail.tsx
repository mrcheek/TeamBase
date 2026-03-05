import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Users, Trophy, Clock, ArrowLeft, ChevronRight } from "lucide-react";
import type { Club, Event, User, Membership } from "@shared/schema";

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

  if (isLoading) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-48 rounded-md mb-4" />
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

  const initials = club.name.split(" ").map(w => w[0]).join("").slice(0, 2);

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <Link href="/play">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary font-bold text-xl">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold" data-testid="text-club-name">{club.name}</h2>
          {club.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {club.location}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold" data-testid="text-member-count">{members?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{clubEvents?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold" data-testid="text-club-score">{score?.score || 0}</p>
            <p className="text-[10px] text-muted-foreground">Score</p>
          </CardContent>
        </Card>
      </div>

      {user && !isMember && (
        <Button
          className="w-full mb-6"
          onClick={() => joinClub.mutate()}
          disabled={joinClub.isPending}
          data-testid="button-join-club"
        >
          {joinClub.isPending ? "Applying..." : "Apply to Join"}
        </Button>
      )}

      {club.description && (
        <section className="mb-6">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
            About
          </h3>
          <p className="text-sm leading-relaxed">{club.description}</p>
        </section>
      )}

      {club.trainingSchedule && (
        <section className="mb-6">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
            Training Schedule
          </h3>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm">{club.trainingSchedule}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {clubEvents && clubEvents.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Events
          </h3>
          <div className="space-y-2">
            {clubEvents.slice(0, 5).map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="hover-elevate" data-testid={`card-club-event-${event.id}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        at {event.time}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {members && members.length > 0 && (
        <section>
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Members
          </h3>
          <Card>
            <CardContent className="p-0">
              {members.map((member, idx) => {
                const memberInitials = member.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      idx < members.length - 1 ? "border-b" : ""
                    }`}
                    data-testid={`row-member-${member.id}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-xs font-bold">{memberInitials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {member.tier}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
