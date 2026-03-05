import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Dumbbell, Zap, CheckCircle2, X } from "lucide-react";
import type { Event } from "@shared/schema";

const activityTypes = [
  { value: "saq", label: "SAQ Training", xp: 20 },
  { value: "gym", label: "Gym Session", xp: 15 },
  { value: "running", label: "Running", xp: 10 },
  { value: "recovery", label: "Recovery", xp: 5 },
  { value: "watching", label: "Watching Rugby", xp: 5 },
  { value: "social", label: "Team Social", xp: 10 },
];

export default function CheckInPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"select" | "event" | "activity" | "success">("select");
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [activityType, setActivityType] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const upcomingEvents = events?.filter(
    (e) => new Date(e.date) >= new Date(new Date().toISOString().split("T")[0])
  );

  const eventCheckIn = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("POST", "/api/check-in/event", { eventId, method: "manual" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      setMode("success");
      toast({ title: "Checked in!", description: "+25 XP earned" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Check-in failed", description: error.message });
    },
  });

  const activityCheckIn = useMutation({
    mutationFn: async (data: { type: string; notes: string; xpEarned: number }) => {
      const today = new Date().toISOString().split("T")[0];
      await apiRequest("POST", "/api/activities", {
        type: data.type,
        date: today,
        notes: data.notes,
        xpEarned: data.xpEarned,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setMode("success");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Activity log failed", description: error.message });
    },
  });

  const handleEventCheckIn = () => {
    if (!selectedEvent) return;
    eventCheckIn.mutate(parseInt(selectedEvent));
  };

  const handleActivityCheckIn = () => {
    if (!activityType) return;
    const type = activityTypes.find((t) => t.value === activityType);
    activityCheckIn.mutate({
      type: activityType,
      notes,
      xpEarned: type?.xp || 10,
    });
    toast({ title: "Activity logged!", description: `+${type?.xp || 10} XP earned` });
  };

  const resetForm = () => {
    setMode("select");
    setSelectedEvent("");
    setActivityType("");
    setNotes("");
  };

  if (!user) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Zap className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold mb-2">Sign in to Check In</h2>
          <p className="text-sm text-muted-foreground">
            Log in to track your rugby activities and earn XP
          </p>
        </div>
      </div>
    );
  }

  if (mode === "success") {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2" data-testid="text-check-in-success">
            You're In!
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your activity has been recorded and XP added to your profile.
          </p>
          <Button onClick={resetForm} data-testid="button-check-in-again">
            Check In Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold" data-testid="text-check-in-title">Check In</h2>
        <p className="text-sm text-muted-foreground">Record your rugby activity</p>
      </div>

      {mode === "select" && (
        <div className="space-y-4">
          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => setMode("event")}
            data-testid="card-event-checkin"
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Event Check-In</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Check in to a training session, match, or event
                </p>
                <span className="text-xs font-semibold text-primary mt-1 inline-block">
                  +25 XP
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover-elevate cursor-pointer"
            onClick={() => setMode("activity")}
            data-testid="card-activity-checkin"
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <Dumbbell className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Log a personal workout, run, or rugby activity
                </p>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1 inline-block">
                  +5-20 XP
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {mode === "event" && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-semibold">Select Event</h3>
            <Button size="icon" variant="ghost" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger data-testid="select-event">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {upcomingEvents?.map((event) => (
                  <SelectItem key={event.id} value={String(event.id)}>
                    {event.title} - {new Date(event.date + "T00:00:00").toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={!selectedEvent || eventCheckIn.isPending}
              onClick={handleEventCheckIn}
              data-testid="button-event-checkin"
            >
              {eventCheckIn.isPending ? "Checking in..." : "Check In (+25 XP)"}
            </Button>
          </div>
        </div>
      )}

      {mode === "activity" && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-semibold">Log Activity</h3>
            <Button size="icon" variant="ghost" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger data-testid="select-activity-type">
                  <SelectValue placeholder="What did you do?" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} (+{type.xp} XP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add details about your activity..."
                className="resize-none"
                data-testid="input-activity-notes"
              />
            </div>
            <Button
              className="w-full"
              disabled={!activityType || activityCheckIn.isPending}
              onClick={handleActivityCheckIn}
              data-testid="button-activity-checkin"
            >
              {activityCheckIn.isPending
                ? "Logging..."
                : `Log Activity (+${activityTypes.find((t) => t.value === activityType)?.xp || 0} XP)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
