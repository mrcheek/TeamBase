import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useClubTheme } from "@/hooks/use-club-theme";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queueOfflineActivity } from "@/App";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  QrCode,
  Dumbbell,
  Zap,
  CheckCircle2,
  X,
  Footprints,
  Heart,
  Users,
  Eye,
  Camera,
  MapPin,
  Clock,
} from "lucide-react";
import type { Event } from "@shared/schema";

const activityTypes = [
  { value: "running", label: "RUN", xp: 10, icon: Footprints, image: "/images/activities/running.png" },
  { value: "gym", label: "GYM", xp: 15, icon: Dumbbell, image: "/images/activities/gym.png" },
  { value: "saq", label: "SAQ", xp: 20, icon: Zap, image: "/images/activities/saq.png" },
  { value: "recovery", label: "RECOVERY", xp: 5, icon: Heart, image: "/images/activities/recovery.png" },
  { value: "social", label: "SOCIAL", xp: 10, icon: Users, image: "/images/activities/social.png" },
  { value: "watching", label: "WATCHING", xp: 5, icon: Eye, image: "/images/activities/watching.png" },
];

export default function CheckInPage() {
  const { user } = useAuth();
  const { club } = useClubTheme();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [activityNotes, setActivityNotes] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [mode, setMode] = useState<"main" | "activity-confirm" | "success">("main");
  const [successType, setSuccessType] = useState<"event" | "activity">("event");
  const [xpAnimation, setXpAnimation] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const { data: events } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const upcomingEvents = events?.filter(
    (e) => new Date(e.date) >= new Date(new Date().toISOString().split("T")[0])
  );

  const selectedEventData = upcomingEvents?.find((e) => String(e.id) === selectedEvent);

  const eventCheckIn = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("POST", "/api/check-in/event", { eventId, method: "manual" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      setSuccessType("event");
      setMode("success");
      setXpAnimation(true);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Check-in failed", description: error.message });
    },
  });

  const activityCheckIn = useMutation({
    mutationFn: async (data: { type: string; notes: string; xpEarned: number }) => {
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        type: data.type,
        date: today,
        notes: data.notes,
        xpEarned: data.xpEarned,
      };
      if (!navigator.onLine) {
        queueOfflineActivity(payload);
        return;
      }
      await apiRequest("POST", "/api/activities", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setSuccessType("activity");
      setMode("success");
      setXpAnimation(true);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Activity log failed", description: error.message });
    },
  });

  useEffect(() => {
    if (xpAnimation) {
      const timer = setTimeout(() => setXpAnimation(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [xpAnimation]);

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
  };

  const resetForm = () => {
    setMode("main");
    setSelectedEvent("");
    setSelectedActivity(null);
    setActivityNotes("");
    setXpAnimation(false);
  };

  const handleSelfieCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "Selfie uploaded!" });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      } else {
        toast({ variant: "destructive", title: "Upload failed" });
      }
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
    }
    setSelfieUploading(false);
    if (selfieInputRef.current) selfieInputRef.current.value = "";
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
    const actType = activityTypes.find((t) => t.value === selectedActivity);
    const earnedXp = successType === "event" ? 25 : (actType?.xp || 10);
    const clubPoints = successType === "event" ? 12 : Math.round(earnedXp * 0.5);
    const successLabel = successType === "event"
      ? (selectedEventData?.title || "Event")
      : (actType?.label || "Activity");

    return (
      <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform duration-500"
            style={{
              backgroundColor: "hsl(var(--club-primary) / 0.15)",
              transform: xpAnimation ? "scale(1.1)" : "scale(1)",
            }}
          >
            <CheckCircle2
              className="w-10 h-10 transition-transform duration-500"
              style={{
                color: "hsl(var(--club-primary))",
                transform: xpAnimation ? "scale(1.15)" : "scale(1)",
              }}
            />
          </div>

          <h2
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: "hsl(var(--club-primary))" }}
            data-testid="text-check-in-success"
          >
            CHECKED IN
          </h2>

          <p className="text-sm text-muted-foreground mb-4" data-testid="text-success-event-name">
            {successLabel}
          </p>

          <div className="flex items-center gap-4 mb-8">
            <div
              className="rounded-md px-4 py-2 text-center"
              style={{ backgroundColor: "hsl(var(--club-primary) / 0.1)" }}
            >
              <span
                className="text-xl font-bold block transition-all duration-700"
                style={{
                  color: "hsl(var(--club-primary))",
                  transform: xpAnimation ? "translateY(-2px)" : "translateY(0)",
                  opacity: xpAnimation ? 1 : 0.9,
                }}
                data-testid="text-xp-earned"
              >
                +{earnedXp} XP
              </span>
              <span className="text-xs text-muted-foreground">Experience</span>
            </div>
            <div
              className="rounded-md px-4 py-2 text-center"
              style={{ backgroundColor: "hsl(var(--club-accent) / 0.1)" }}
            >
              <span
                className="text-xl font-bold block transition-all duration-700"
                style={{
                  color: "hsl(var(--club-accent))",
                  transform: xpAnimation ? "translateY(-2px)" : "translateY(0)",
                  opacity: xpAnimation ? 1 : 0.9,
                }}
                data-testid="text-club-points-earned"
              >
                +{clubPoints}
              </span>
              <span className="text-xs text-muted-foreground">Club Points</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleSelfieCapture}
            />
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => selfieInputRef.current?.click()}
              disabled={selfieUploading}
              data-testid="button-add-selfie"
            >
              <Camera className="w-4 h-4 mr-2" />
              {selfieUploading ? "UPLOADING..." : "ADD SELFIE"}
            </Button>
            <Button
              className="flex-1"
              style={{
                backgroundColor: "hsl(var(--club-primary))",
                color: "hsl(var(--club-primary-foreground))",
              }}
              onClick={resetForm}
              data-testid="button-check-in-done"
            >
              DONE
            </Button>
          </div>
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

        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: "hsl(var(--club-primary) / 0.12)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "hsl(var(--club-primary))" }} />
            </div>
            <div>
              <p className="font-semibold">{type?.label}</p>
              <p className="text-xs text-muted-foreground">+{type?.xp} XP</p>
            </div>
          </div>
        </Card>

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
            size="lg"
            disabled={activityCheckIn.isPending}
            onClick={handleActivityConfirm}
            style={{
              backgroundColor: "hsl(var(--club-primary))",
              color: "hsl(var(--club-primary-foreground))",
            }}
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
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-check-in-title">
          CHECK IN
        </h1>
        <div className="flex items-center gap-2 mt-1">
          {club && (
            <span className="text-sm font-medium" style={{ color: "hsl(var(--club-primary))" }} data-testid="text-check-in-club">
              {club.name}
            </span>
          )}
          {club && <span className="text-muted-foreground text-sm">·</span>}
          <span className="text-sm text-muted-foreground" data-testid="text-check-in-date">{dateStr}</span>
        </div>
      </div>

      <Card className="p-5 mb-6 overflow-visible" data-testid="section-event-checkin">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: "hsl(var(--club-primary) / 0.12)" }}
          >
            <QrCode className="w-5 h-5" style={{ color: "hsl(var(--club-primary))" }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Event Check-In</h3>
            <p className="text-xs text-muted-foreground">Fastest way to check in to a session</p>
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

        {selectedEventData && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {selectedEventData.time}
            </span>
            {selectedEventData.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {selectedEventData.location}
              </span>
            )}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!selectedEvent || eventCheckIn.isPending}
          onClick={handleEventCheckIn}
          style={{
            backgroundColor: "hsl(var(--club-primary))",
            color: "hsl(var(--club-primary-foreground))",
          }}
          data-testid="button-event-checkin"
        >
          {eventCheckIn.isPending ? "Checking in..." : "SCAN EVENT QR"}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">+25 XP per event check-in</p>
      </Card>

      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground" data-testid="text-quick-log-title">Activities</h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5" data-testid="section-quick-activity">
        {activityTypes.map((type, idx) => {
          const isFirst = idx === 0;
          return (
            <button
              key={type.value}
              onClick={() => handleActivitySelect(type.value)}
              className={`relative overflow-hidden rounded-xl text-left group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isFirst ? "col-span-2 h-40" : "h-36"}`}
              data-testid={`button-activity-${type.value}`}
            >
              <img
                src={type.image}
                alt={type.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-3.5">
                <p className="text-white font-bold text-lg tracking-wide leading-tight" data-testid={`text-activity-label-${type.value}`}>{type.label}</p>
                <p className="text-white/70 text-xs font-medium mt-0.5" data-testid={`text-activity-xp-${type.value}`}>+{type.xp} XP</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}