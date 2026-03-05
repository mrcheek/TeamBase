import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Calendar, Building2, BarChart3,
  Check, X, Edit2, Trash2, Plus, ChevronRight, Search,
  Shield
} from "lucide-react";
import type { User, Club, Event, Membership } from "@shared/schema";

type AdminUser = Omit<User, "password">;
type AdminMembership = Omit<Membership, ""> & { user: AdminUser; club: Club };

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user || user.role !== "admin") {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold mb-2">Admin Access Required</h2>
          <p className="text-sm text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "members", label: "Members", icon: Users },
    { id: "events", label: "Events", icon: Calendar },
    { id: "clubs", label: "Clubs", icon: Building2 },
  ];

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold" data-testid="text-admin-title">Admin Dashboard</h2>
      </div>

      <div className="flex gap-1 mb-5 bg-muted rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
            data-testid={`tab-admin-${tab.id}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "members" && <MembersTab />}
      {activeTab === "events" && <EventsTab />}
      {activeTab === "clubs" && <ClubsTab />}
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useQuery<{
    totalUsers: number;
    totalPlayers: number;
    totalSupporters: number;
    pendingMemberships: number;
    upcomingEvents: number;
    totalClubs: number;
  }>({ queryKey: ["/api/admin/stats"] });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-muted" /></Card>)}</div>;
  }

  const statCards = [
    { label: "Total Members", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Players", value: stats?.totalPlayers ?? 0, icon: Users, color: "text-cyan-600 bg-cyan-100" },
    { label: "Supporters", value: stats?.totalSupporters ?? 0, icon: Users, color: "text-pink-600 bg-pink-100" },
    { label: "Pending Approvals", value: stats?.pendingMemberships ?? 0, icon: Shield, color: "text-amber-600 bg-amber-100" },
    { label: "Upcoming Events", value: stats?.upcomingEvents ?? 0, icon: Calendar, color: "text-emerald-600 bg-emerald-100" },
    { label: "Active Clubs", value: stats?.totalClubs ?? 0, icon: Building2, color: "text-purple-600 bg-purple-100" },
  ];

  return (
    <div className="space-y-3">
      {statCards.map((stat) => (
        <Card key={stat.label} data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MembersTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "pending">("all");

  const { data: allUsers, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: pendingMemberships, isLoading: membershipsLoading } = useQuery<AdminMembership[]>({
    queryKey: ["/api/admin/memberships", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/admin/memberships?status=pending", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Role updated" });
    },
  });

  const membershipMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/admin/memberships/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Membership updated" });
    },
  });

  const filteredUsers = allUsers?.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-muted rounded-md p-1">
        <button
          onClick={() => setView("all")}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
            view === "all" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
          data-testid="button-view-all-members"
        >
          All Members ({allUsers?.length ?? 0})
        </button>
        <button
          onClick={() => setView("pending")}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
            view === "pending" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
          data-testid="button-view-pending"
        >
          Pending ({pendingMemberships?.length ?? 0})
        </button>
      </div>

      {view === "all" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-members"
            />
          </div>

          {usersLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-3 h-16 animate-pulse bg-muted" /></Card>)}</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers?.map((u) => (
                <Card key={u.id} data-testid={`card-admin-user-${u.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary text-[10px] font-bold">
                            {u.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">{u.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-[10px] capitalize">{u.tier}</Badge>
                        <Select
                          value={u.role}
                          onValueChange={(role) => roleMutation.mutate({ userId: u.id, role })}
                        >
                          <SelectTrigger className="h-7 w-[90px] text-[10px]" data-testid={`select-role-${u.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="player">Player</SelectItem>
                            <SelectItem value="coach">Coach</SelectItem>
                            <SelectItem value="personnel">Personnel</SelectItem>
                            <SelectItem value="supporter">Supporter</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{u.xpTotal} XP</span>
                      {u.profileCompleted && <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-200">Profile Complete</Badge>}
                      {u.gender && <span className="capitalize">{u.gender}</span>}
                      {u.nationality && <span>{u.nationality}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredUsers?.length === 0 && (
                <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No members found</CardContent></Card>
              )}
            </div>
          )}
        </>
      )}

      {view === "pending" && (
        <>
          {membershipsLoading ? (
            <div className="space-y-2">{[1, 2].map((i) => <Card key={i}><CardContent className="p-3 h-16 animate-pulse bg-muted" /></Card>)}</div>
          ) : pendingMemberships && pendingMemberships.length > 0 ? (
            <div className="space-y-2">
              {pendingMemberships.map((m) => (
                <Card key={m.id} data-testid={`card-pending-${m.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{m.user.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          Wants to join <span className="font-medium text-foreground">{m.club.name}</span>
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => membershipMutation.mutate({ id: m.id, status: "active" })}
                          disabled={membershipMutation.isPending}
                          data-testid={`button-approve-${m.id}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => membershipMutation.mutate({ id: m.id, status: "rejected" })}
                          disabled={membershipMutation.isPending}
                          data-testid={`button-reject-${m.id}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No pending membership requests</CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}

function EventsTab() {
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: allEvents, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: clubs } = useQuery<Club[]>({ queryKey: ["/api/clubs"] });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/admin/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Event deleted" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Event> }) => {
      await apiRequest("PATCH", `/api/admin/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditingEvent(null);
      toast({ title: "Event updated" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowCreate(false);
      toast({ title: "Event created" });
    },
  });

  return (
    <div className="space-y-4">
      <Button
        size="sm"
        onClick={() => { setShowCreate(!showCreate); setEditingEvent(null); }}
        className="w-full"
        data-testid="button-create-event"
      >
        <Plus className="w-4 h-4 mr-1" /> Create Event
      </Button>

      {showCreate && (
        <EventForm
          clubs={clubs || []}
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowCreate(false)}
          isPending={createMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-3 h-20 animate-pulse bg-muted" /></Card>)}</div>
      ) : (
        <div className="space-y-2">
          {allEvents?.map((event) => (
            <div key={event.id}>
              {editingEvent?.id === event.id ? (
                <EventForm
                  event={event}
                  clubs={clubs || []}
                  onSubmit={(data) => updateMutation.mutate({ id: event.id, data })}
                  onCancel={() => setEditingEvent(null)}
                  isPending={updateMutation.isPending}
                />
              ) : (
                <Card data-testid={`card-admin-event-${event.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] capitalize">{event.type.replace("_", " ")}</Badge>
                          <span className="text-xs text-muted-foreground">{event.date} at {event.time}</span>
                        </div>
                        {event.location && <p className="text-xs text-muted-foreground mt-1">{event.location}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => { setEditingEvent(event); setShowCreate(false); }}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm("Delete this event?")) deleteMutation.mutate(event.id);
                          }}
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventForm({
  event,
  clubs,
  onSubmit,
  onCancel,
  isPending,
}: {
  event?: Event;
  clubs: Club[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [type, setType] = useState(event?.type || "training");
  const [date, setDate] = useState(event?.date || "");
  const [time, setTime] = useState(event?.time || "");
  const [location, setLocation] = useState(event?.location || "");
  const [description, setDescription] = useState(event?.description || "");
  const [clubId, setClubId] = useState(String(event?.clubId || ""));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      type,
      date,
      time,
      location,
      description,
      clubId: parseInt(clubId),
      federationId: 1,
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="input-event-title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-event-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="match">Match</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="touch_rugby">Touch Rugby</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Club</Label>
              <Select value={clubId} onValueChange={setClubId}>
                <SelectTrigger data-testid="select-event-club"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {clubs.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required data-testid="input-event-date" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required data-testid="input-event-time" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} data-testid="input-event-location" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} data-testid="input-event-description" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="flex-1" data-testid="button-save-event">
              {isPending ? "Saving..." : event ? "Update" : "Create"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel} data-testid="button-cancel-event">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ClubsTab() {
  const { toast } = useToast();
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  const { data: allClubs, isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Club> }) => {
      await apiRequest("PATCH", `/api/admin/clubs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      setEditingClub(null);
      toast({ title: "Club updated" });
    },
  });

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Card key={i}><CardContent className="p-3 h-20 animate-pulse bg-muted" /></Card>)}</div>
      ) : (
        allClubs?.map((club) => (
          <div key={club.id}>
            {editingClub?.id === club.id ? (
              <ClubForm
                club={club}
                onSubmit={(data) => updateMutation.mutate({ id: club.id, data })}
                onCancel={() => setEditingClub(null)}
                isPending={updateMutation.isPending}
              />
            ) : (
              <Card data-testid={`card-admin-club-${club.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-xs">
                          {club.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{club.name}</p>
                        {club.location && <p className="text-xs text-muted-foreground">{club.location}</p>}
                        {club.trainingSchedule && (
                          <p className="text-[10px] text-muted-foreground mt-1">{club.trainingSchedule}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => setEditingClub(club)}
                      data-testid={`button-edit-club-${club.id}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {club.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{club.description}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function ClubForm({
  club,
  onSubmit,
  onCancel,
  isPending,
}: {
  club: Club;
  onSubmit: (data: Partial<Club>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(club.name);
  const [location, setLocation] = useState(club.location || "");
  const [description, setDescription] = useState(club.description || "");
  const [trainingSchedule, setTrainingSchedule] = useState(club.trainingSchedule || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, location, description, trainingSchedule });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Club Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-club-name" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} data-testid="input-club-location" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} data-testid="input-club-description" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Training Schedule</Label>
            <Input value={trainingSchedule} onChange={(e) => setTrainingSchedule(e.target.value)} data-testid="input-club-schedule" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="flex-1" data-testid="button-save-club">
              {isPending ? "Saving..." : "Update"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCancel} data-testid="button-cancel-club">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
