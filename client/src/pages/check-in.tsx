import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Dumbbell, Zap, CheckCircle2, X, Footprints, Heart, Users, Eye } from "lucide-react";
import type { Event } from "@shared/schema";

const activityTypes = [
  { value: "running", label: "Run", xp: 10, icon: Footprints },
  { value: "gym", label: "Gym", xp: 15, icon: Dumbbell },
  { value: "saq", label: "SAQ", xp: 20, icon: Zap },
  { value: "recovery", label: "Recovery", xp: 5, icon: Heart },
  { value: "social", label: "Social", xp: 10, icon: Users },
  { value: "watching", label: "Watching", xp: 5, icon: Eye },
];

export default function CheckInPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [activityNotes, setActivityNotes] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [mode, setMode] = useState<"main" | "activity-confirm" | "success">("main");

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

  const handleActivitySelect = (value: string) => {
    setSelectedActivity(value);
    setMode("activity-confirm");
  };

  const handleActivityConfirm = () => {
    if (!selectedActivity) return;
    const type = activityTypes.find((t) => t.value === selectedActivity);
    activityCheckIn.mutate({
      type: selectedActivity,
      notes: activityNotes,
      xpEarned: type?.xp || 10,
    });
    toast({ title: "Activity logged!", description: `+${type?.xp || 10} XP earned` });
  };

  const resetForm = () => {
    setMode("main");
    setSelectedEvent("");
    setSelectedActivity(null);
    setActivityNotes("");
  };

  if (!user) {
    return (
      <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Zap className="w-10 h-10 text-muted-foreground mb-4" />
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
      <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-1" data-testid="text-check-in-success">
            You're In!
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Activity recorded. XP added to your profile.
          </p>
          <Button onClick={resetForm} data-testid="button-check-in-again">
            Check In Again
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "activity-confirm") {
    const type = activityTypes.find((t) => t.value === selectedActivity);
    const Icon = type?.icon || Dumbbell;
    return (
      <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between gap-2 mb-6">
          <h2 className="text-lg font-bold" data-testid="text-activity-confirm-title">
            Log {type?.label}
          </h2>
          <Button size="icon" variant="ghost" onClick={resetForm} data-testid="button-activity-back">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{type?.label}</p>
            <p className="text-xs text-muted-foreground">+{type?.xp} XP</p>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={activityNotes}
              onChange={(e) => setActivityNotes(e.target.value)}
              placeholder="Add details about your activity..."
              className="resize-none"
              data-testid="input-activity-notes"
            />
          </div>
          <Button
            className="w-full"
            disabled={activityCheckIn.isPending}
            onClick={handleActivityConfirm}
            data-testid="button-activity-checkin"
          >
            {activityCheckIn.isPending ? "Logging..." : `Log Activity (+${type?.xp || 0} XP)`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold" data-testid="text-check-in-title">Check In</h2>
        <p className="text-sm text-muted-foreground">Record your rugby activity</p>
      </div>

      <div className="rounded-md border bg-primary/5 dark:bg-primary/10 p-5 mb-6" data-testid="section-event-checkin">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Event Check-In</h3>
            <p className="text-xs text-muted-foreground">+25 XP per event</p>
          </div>
        </div>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger data-testid="select-event" className="mb-3">
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
          size="lg"
          disabled={!selectedEvent || eventCheckIn.isPending}
          onClick={handleEventCheckIn}
          data-testid="button-event-checkin"
        >
          {eventCheckIn.isPending ? "Checking in..." : "Check In to Event"}
        </Button>
      </div>

      <Separator className="mb-6" />

      <div data-testid="section-quick-activity">
        <div className="flex items-center gap-3 mb-4">
          <Dumbbell className="w-5 h-5 text-muted-foreground shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Quick Activity</h3>
            <p className="text-xs text-muted-foreground">Log a personal workout</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {activityTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => handleActivitySelect(type.value)}
                className="flex items-center gap-3 rounded-md border p-3 text-left hover-elevate active-elevate-2 transition-colors"
                data-testid={`button-activity-${type.value}`}
              >
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{type.label}</p>
                  <p className="text-xs text-muted-foreground">+{type.xp} XP</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}