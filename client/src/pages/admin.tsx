import { useState } from "react";
import { ImageUpload as SharedImageUpload } from "@/components/image-upload";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
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
  Shield, ArrowLeft, Phone, Mail, MapPin, Heart, Dumbbell, TrendingUp,
  Bell
} from "lucide-react";
import type { User, Club, Event, Membership, Activity, XpTransaction, Attendance } from "@shared/schema";
import { isAnyAdmin, isFederationAdminOrAbove, isTeambaseAdmin, canAssignRole, ALL_ROLES, ADMIN_ROLES } from "@shared/schema";

const ICON_STROKE = 1.5;

type AdminUser = Omit<User, "password">;
type AdminMembership = Membership & { user: AdminUser; club: Club };

const adminLevelLabels: Record<string, string> = {
  teambase_admin: "TeamBase Admin",
  federation_admin: "Federation Admin",
  club_admin: "Club Admin",
};

function useAdminClubIds(user: AdminUser | null) {
  const { data: memberships } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: !!user && user.role === "club_admin",
  });
  if (!user || user.role !== "club_admin") return null;
  return memberships?.filter(m => m.status === "active").map(m => m.clubId) ?? [];
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const adminClubIds = useAdminClubIds(user);

  if (!user || !isAnyAdmin(user.role)) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="w-12 h-12 text-muted-foreground mb-4" strokeWidth={ICON_STROKE} />
          <h2 className="text-lg font-bold mb-2">Admin Access Required</h2>
          <p className="text-sm text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const isClubAdmin = user.role === "club_admin";
  const showOverview = isFederationAdminOrAbove(user.role);

  const tabs = [
    ...(showOverview ? [{ id: "overview", label: "Overview" }] : []),
    { id: "members", label: "Members" },
    { id: "events", label: "Events" },
    { id: "clubs", label: "Clubs" },
  ];

  const effectiveTab = (activeTab === "overview" && !showOverview) ? "members" : activeTab;

  const activeLabel = tabs.find(t => t.id === effectiveTab)?.label || tabs[0]?.label || "Members";

  const { data: adminClubs } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: isClubAdmin,
  });
  const clubAdminClubNames = isClubAdmin
    ? adminClubs?.filter(m => m.status === "active").map(m => m.club.name).join(", ") ?? ""
    : "";

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-base font-semibold" data-testid="text-admin-title">{activeLabel}</h2>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="text-[10px] capitalize" data-testid="badge-admin-level">
          {adminLevelLabels[user.role] || user.role}
        </Badge>
        {isClubAdmin && clubAdminClubNames && (
          <span className="text-[11px] text-muted-foreground" data-testid="text-admin-club-scope">{clubAdminClubNames}</span>
        )}
      </div>

      <div className="flex border-b border-divider mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 pb-2.5 text-sm font-medium transition-colors relative ${
              effectiveTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
            data-testid={`tab-admin-${tab.id}`}
          >
            {tab.label}
            {effectiveTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </div>

      {effectiveTab === "overview" && showOverview && <OverviewTab onNavigate={setActiveTab} />}
      {effectiveTab === "members" && <MembersTab adminRole={user.role} adminClubIds={adminClubIds} />}
      {effectiveTab === "events" && <EventsTab adminRole={user.role} adminClubIds={adminClubIds} />}
      {effectiveTab === "clubs" && <ClubsTab adminRole={user.role} adminClubIds={adminClubIds} />}
    </div>
  );
}

function OverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data: stats, isLoading } = useQuery<{
    totalUsers: number;
    totalPlayers: number;
    totalSupporters: number;
    pendingMemberships: number;
    upcomingEvents: number;
    totalClubs: number;
  }>({ queryKey: ["/api/admin/stats"] });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse bg-muted rounded-md" />)}</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8">
        {[
          { label: "Members", value: stats?.totalUsers ?? 0 },
          { label: "Players", value: stats?.totalPlayers ?? 0 },
          { label: "Supporters", value: stats?.totalSupporters ?? 0 },
          { label: "Pending", value: stats?.pendingMemberships ?? 0 },
          { label: "Events", value: stats?.upcomingEvents ?? 0 },
          { label: "Clubs", value: stats?.totalClubs ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="flex items-baseline justify-between" data-testid={`stat-${stat.label.toLowerCase()}`}>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span className="text-lg font-bold">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-divider pt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h4>
        <div className="divide-y divide-divider">
          <button
            onClick={() => onNavigate("events")}
            className="flex items-center gap-3 w-full py-3 text-sm font-medium text-left"
            data-testid="button-quick-create-event"
          >
            <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
            Create Event
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" strokeWidth={ICON_STROKE} />
          </button>
          <button
            onClick={() => onNavigate("members")}
            className="flex items-center gap-3 w-full py-3 text-sm font-medium text-left"
            data-testid="button-quick-members"
          >
            <Users className="w-4 h-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
            Manage Members
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" strokeWidth={ICON_STROKE} />
          </button>
          <button
            onClick={() => onNavigate("clubs")}
            className="flex items-center gap-3 w-full py-3 text-sm font-medium text-left"
            data-testid="button-quick-clubs"
          >
            <Building2 className="w-4 h-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
            Edit Clubs
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" strokeWidth={ICON_STROKE} />
          </button>
        </div>
      </div>
    </div>
  );
}

type UserDetail = {
  user: AdminUser;
  memberships: (Membership & { club: Club })[];
  activities: Activity[];
  xpHistory: XpTransaction[];
  attendance: Attendance[];
};

const tierColors: Record<string, string> = {
  green: "text-emerald-600 bg-emerald-50 border-emerald-200",
  blue: "text-blue-600 bg-blue-50 border-blue-200",
  silver: "text-gray-500 bg-gray-50 border-gray-200",
  gold: "text-amber-600 bg-amber-50 border-amber-200",
};

const roleColors: Record<string, string> = {
  player: "text-blue-700 bg-blue-50",
  coach: "text-purple-700 bg-purple-50",
  personnel: "text-cyan-700 bg-cyan-50",
  supporter: "text-pink-700 bg-pink-50",
  club_admin: "text-orange-700 bg-orange-50",
  federation_admin: "text-red-700 bg-red-50",
  teambase_admin: "text-red-700 bg-red-50",
};

function MemberDetail({ userId, onBack, adminRole }: { userId: number; onBack: () => void; adminRole: string }) {
  const { toast } = useToast();
  const canViewDetails = isFederationAdminOrAbove(adminRole);

  const { data, isLoading } = useQuery<UserDetail>({
    queryKey: ["/api/admin/users", userId],
    enabled: canViewDetails,
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

  if (!canViewDetails) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-to-members">
          <ArrowLeft className="w-4 h-4" strokeWidth={ICON_STROKE} /> All Members
        </button>
        <p className="text-sm text-muted-foreground">Detailed member view is available to Federation Admins and above.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground" data-testid="button-back-to-members">
          <ArrowLeft className="w-4 h-4" strokeWidth={ICON_STROKE} /> Back
        </button>
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse bg-muted rounded-md" />)}
      </div>
    );
  }

  if (!data) return null;
  const { user: u, memberships, activities, xpHistory } = data;

  const infoRows = [
    { icon: Phone, label: "Phone", value: u.phone },
    { icon: Mail, label: "Email", value: u.email },
    { icon: Calendar, label: "Date of Birth", value: u.dateOfBirth },
    { icon: Users, label: "Gender", value: u.gender },
    { icon: MapPin, label: "Nationality", value: u.nationality },
    { icon: MapPin, label: "Country", value: u.residentialCountry },
    { icon: Heart, label: "Emergency Contact", value: u.emergencyContactName ? `${u.emergencyContactName} (${u.emergencyContactNumber || "N/A"})` : null },
  ].filter((r) => r.value);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="button-back-to-members">
        <ArrowLeft className="w-4 h-4" strokeWidth={ICON_STROKE} /> All Members
      </button>

      <div className="flex items-center gap-3 pb-4 border-b border-divider">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary text-lg font-bold">
            {u.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base" data-testid="text-member-name">{u.fullName}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={`text-[10px] capitalize border ${roleColors[u.role] || ""}`} variant="outline">{u.role}</Badge>
            <Badge className={`text-[10px] capitalize border ${tierColors[u.tier] || ""}`} variant="outline">{u.tier}</Badge>
            <span className="text-xs font-semibold text-primary">{u.xpTotal} XP</span>
          </div>
        </div>
      </div>

      {adminRole !== "club_admin" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</h4>
          </div>
          <Select
            value={u.role}
            onValueChange={(role) => roleMutation.mutate({ userId: u.id, role })}
          >
            <SelectTrigger className="h-8 text-xs" data-testid="select-member-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="personnel">Personnel</SelectItem>
              <SelectItem value="supporter">Supporter</SelectItem>
              {isFederationAdminOrAbove(adminRole) && (
                <SelectItem value="club_admin">Club Admin</SelectItem>
              )}
              {isTeambaseAdmin(adminRole) && (
                <>
                  <SelectItem value="federation_admin">Federation Admin</SelectItem>
                  <SelectItem value="teambase_admin">TeamBase Admin</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {infoRows.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Profile</h4>
          <div className="divide-y divide-divider">
            {infoRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3 py-2.5" data-testid={`row-profile-${row.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <row.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={ICON_STROKE} />
                <span className="text-xs text-muted-foreground w-24 shrink-0">{row.label}</span>
                <span className="text-xs font-medium capitalize truncate">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {u.role === "player" && (u.position || u.playingLevel || u.height || u.weight) && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Player Details</h4>
          <div className="divide-y divide-divider">
            {u.position && (
              <div className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-muted-foreground w-24 shrink-0">Position</span>
                <span className="text-xs font-medium capitalize">{u.position}</span>
              </div>
            )}
            {u.playingLevel && (
              <div className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-muted-foreground w-24 shrink-0">Level</span>
                <span className="text-xs font-medium capitalize">{u.playingLevel}</span>
              </div>
            )}
            {u.height && (
              <div className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-muted-foreground w-24 shrink-0">Height</span>
                <span className="text-xs font-medium">{u.height}</span>
              </div>
            )}
            {u.weight && (
              <div className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-muted-foreground w-24 shrink-0">Weight</span>
                <span className="text-xs font-medium">{u.weight}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {u.role === "coach" && (u.coachingCertification || u.teamCoached) && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Coach Details</h4>
          <div className="divide-y divide-divider">
            {u.coachingCertification && (
              <div className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-muted-foreground w-24 shrink-0">Certification</span>
                <span className="text-xs font-medium">{u.coachingCertification}</span>
              </div>
            )}
            {u.teamCoached && (
              <div className="flex items-center gap-3 py-2.5">
                <span className="text-xs text-muted-foreground w-24 shrink-0">Team</span>
                <span className="text-xs font-medium">{u.teamCoached}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {memberships.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Clubs</h4>
          <div className="divide-y divide-divider">
            {memberships.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5" data-testid={`row-membership-${m.id}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary text-[9px] font-bold">
                      {m.club.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <span className="text-xs font-medium">{m.club.name}</span>
                </div>
                <Badge variant="outline" className={`text-[9px] capitalize ${m.status === "active" ? "text-emerald-600 border-emerald-200" : m.status === "pending" ? "text-amber-600 border-amber-200" : "text-red-600 border-red-200"}`}>
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {activities.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Recent Activities</h4>
          <div className="divide-y divide-divider">
            {activities.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2.5" data-testid={`row-activity-${a.id}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Dumbbell className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={ICON_STROKE} />
                  <div className="min-w-0">
                    <span className="text-xs font-medium capitalize">{a.type.replace("_", " ")}</span>
                    {a.notes && <p className="text-[10px] text-muted-foreground truncate">{a.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{a.date}</span>
                  <span className="text-xs font-semibold text-primary">+{a.xpEarned}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {xpHistory.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">XP History</h4>
          <div className="divide-y divide-divider">
            {xpHistory.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5" data-testid={`row-xp-detail-${tx.id}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-primary shrink-0" strokeWidth={ICON_STROKE} />
                  <span className="text-xs">{tx.description}</span>
                </div>
                <span className="text-xs font-semibold text-primary">+{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground pt-2 border-t border-divider">
        Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
        {u.profileCompleted && " · Profile Complete"}
      </div>
    </div>
  );
}

function MembersTab({ adminRole, adminClubIds }: { adminRole: string; adminClubIds: number[] | null }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "pending">("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const isClubScoped = adminRole === "club_admin" && adminClubIds !== null;

  const { data: allUsers, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isFederationAdminOrAbove(adminRole),
  });

  const { data: clubMembers, isLoading: clubMembersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/clubs", adminClubIds?.[0], "members"],
    queryFn: async () => {
      if (!adminClubIds || adminClubIds.length === 0) return [];
      const results: AdminUser[] = [];
      for (const clubId of adminClubIds) {
        const res = await fetch(`/api/clubs/${clubId}/members`, { credentials: "include" });
        if (res.ok) {
          const members = await res.json();
          for (const m of members) {
            if (!results.find(r => r.id === m.id)) results.push(m);
          }
        }
      }
      return results;
    },
    enabled: isClubScoped,
  });

  const displayUsers = isClubScoped ? clubMembers : allUsers;
  const displayUsersLoading = isClubScoped ? clubMembersLoading : usersLoading;

  const { data: pendingMemberships, isLoading: membershipsLoading } = useQuery<AdminMembership[]>({
    queryKey: ["/api/admin/memberships", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/admin/memberships?status=pending", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
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

  const filteredUsers = displayUsers?.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  if (selectedUserId) {
    return <MemberDetail userId={selectedUserId} onBack={() => setSelectedUserId(null)} adminRole={adminRole} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex border-b border-divider">
        <button
          onClick={() => setView("all")}
          className={`pb-2 px-3 text-sm font-medium relative ${view === "all" ? "text-foreground" : "text-muted-foreground"}`}
          data-testid="button-view-all-members"
        >
          All ({displayUsers?.length ?? 0})
          {view === "all" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />}
        </button>
        <button
          onClick={() => setView("pending")}
          className={`pb-2 px-3 text-sm font-medium relative ${view === "pending" ? "text-foreground" : "text-muted-foreground"}`}
          data-testid="button-view-pending"
        >
          Pending ({pendingMemberships?.length ?? 0})
          {view === "pending" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />}
        </button>
      </div>

      {view === "all" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={ICON_STROKE} />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-members"
            />
          </div>

          {displayUsersLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-muted rounded-md" />)}</div>
          ) : (
            <div className="divide-y divide-divider">
              {filteredUsers?.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-2 py-3 cursor-pointer transition-colors"
                  onClick={() => setSelectedUserId(u.id)}
                  data-testid={`card-admin-user-${u.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary text-[10px] font-bold">
                        {u.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.fullName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="capitalize">{u.role}</span> · <span className="capitalize">{u.tier}</span> · {u.xpTotal} XP
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={ICON_STROKE} />
                </div>
              ))}
              {filteredUsers?.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No members found</div>
              )}
            </div>
          )}
        </>
      )}

      {view === "pending" && (
        <>
          {membershipsLoading ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-14 animate-pulse bg-muted rounded-md" />)}</div>
          ) : pendingMemberships && pendingMemberships.length > 0 ? (
            <div className="divide-y divide-divider">
              {pendingMemberships.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 py-3" data-testid={`card-pending-${m.id}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      Wants to join <span className="font-medium text-foreground">{m.club.name}</span>
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-emerald-600"
                      onClick={() => membershipMutation.mutate({ id: m.id, status: "active" })}
                      disabled={membershipMutation.isPending}
                      data-testid={`button-approve-${m.id}`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={ICON_STROKE} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => membershipMutation.mutate({ id: m.id, status: "rejected" })}
                      disabled={membershipMutation.isPending}
                      data-testid={`button-reject-${m.id}`}
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={ICON_STROKE} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">No pending membership requests</div>
          )}
        </>
      )}
    </div>
  );
}

function EventsTab({ adminRole, adminClubIds }: { adminRole: string; adminClubIds: number[] | null }) {
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const isClubScoped = adminRole === "club_admin" && adminClubIds !== null;

  const { data: rawEvents, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const allEvents = isClubScoped && adminClubIds
    ? rawEvents?.filter(e => adminClubIds.includes(e.clubId))
    : rawEvents;

  const { data: rawClubs } = useQuery<Club[]>({ queryKey: ["/api/clubs"] });
  const clubs = isClubScoped && adminClubIds
    ? rawClubs?.filter(c => adminClubIds.includes(c.id))
    : rawClubs;

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
    <div className="space-y-5">
      <Button
        size="sm"
        onClick={() => { setShowCreate(!showCreate); setEditingEvent(null); }}
        className="w-full"
        data-testid="button-create-event"
      >
        <Plus className="w-4 h-4 mr-1" strokeWidth={ICON_STROKE} /> Create Event
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
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse bg-muted rounded-md" />)}</div>
      ) : (
        <div className="divide-y divide-divider">
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
                <div className="flex items-start justify-between gap-2 py-3" data-testid={`card-admin-event-${event.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                      <span className="capitalize">{event.type.replace("_", " ")}</span> · {event.date} · {event.time}
                    </p>
                    {event.location && <p className="text-[13px] text-muted-foreground">{event.location}</p>}
                  </div>
                  <div className="flex gap-0.5 shrink-0 mt-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => { setEditingEvent(event); setShowCreate(false); }}
                      data-testid={`button-edit-event-${event.id}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" strokeWidth={ICON_STROKE} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={async () => {
                        try {
                          const res = await apiRequest("POST", `/api/admin/events/${event.id}/notify`);
                          const data = await res.json();
                          alert(`Sent ${data.sent} notification${data.sent !== 1 ? "s" : ""}${data.failed ? `, ${data.failed} failed` : ""}`);
                        } catch { alert("Failed to send notifications"); }
                      }}
                      data-testid={`button-notify-event-${event.id}`}
                      title="Send push reminder"
                    >
                      <Bell className="w-3.5 h-3.5" strokeWidth={ICON_STROKE} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => {
                        if (confirm("Delete this event?")) deleteMutation.mutate(event.id);
                      }}
                      data-testid={`button-delete-event-${event.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={ICON_STROKE} />
                    </Button>
                  </div>
                </div>
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
    <div className="py-4 border-b border-divider">
      <h3 className="text-base font-semibold mb-5">{event ? "Edit Event" : "Create Event"}</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="input-event-title" />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-2 gap-4">
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
        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm" disabled={isPending} className="flex-1" data-testid="button-save-event">
            {isPending ? "Saving..." : event ? "Update" : "Create Event"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="text-muted-foreground" data-testid="button-cancel-event">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function ClubsTab({ adminRole, adminClubIds }: { adminRole: string; adminClubIds: number[] | null }) {
  const { toast } = useToast();
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const isClubScoped = adminRole === "club_admin" && adminClubIds !== null;

  const { data: rawClubs, isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const allClubs = isClubScoped && adminClubIds
    ? rawClubs?.filter(c => adminClubIds.includes(c.id))
    : rawClubs;

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
    <div>
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse bg-muted rounded-md" />)}</div>
      ) : (
        <div className="divide-y divide-divider">
          {allClubs?.map((club) => (
            <div key={club.id}>
              {editingClub?.id === club.id ? (
                <ClubForm
                  club={club}
                  onSubmit={(data) => updateMutation.mutate({ id: club.id, data })}
                  onCancel={() => setEditingClub(null)}
                  isPending={updateMutation.isPending}
                />
              ) : (
                <div className="flex items-center justify-between gap-2 py-3" data-testid={`card-admin-club-${club.id}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: club.primaryColor || undefined, color: club.textOnPrimary || "#fff" }}
                    >
                      <span className="font-bold text-xs">
                        {club.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{club.name}</p>
                      {club.location && <p className="text-[13px] text-muted-foreground">{club.location}</p>}
                      {club.primaryColor && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: club.primaryColor }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: club.secondaryColor || undefined }} />
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: club.accentColor || undefined }} />
                        </div>
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
                    <Edit2 className="w-4 h-4" strokeWidth={ICON_STROKE} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageUpload({ currentUrl, onUpload, testId }: { currentUrl: string; onUpload: (url: string) => void; testId: string }) {
  return <SharedImageUpload currentUrl={currentUrl} onUpload={onUpload} uploadEndpoint="/api/upload" testId={testId} variant="banner" />;
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
  const [logoUrl, setLogoUrl] = useState(club.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(club.bannerUrl || "");
  const [primaryColor, setPrimaryColor] = useState(club.primaryColor || "#1a7a4e");
  const [secondaryColor, setSecondaryColor] = useState(club.secondaryColor || "#e0e0e0");
  const [accentColor, setAccentColor] = useState(club.accentColor || "#d4a017");
  const [textOnPrimary, setTextOnPrimary] = useState(club.textOnPrimary || "#FFFFFF");
  const [textOnSecondary, setTextOnSecondary] = useState(club.textOnSecondary || "#111111");
  const [brandStyle, setBrandStyle] = useState(club.brandStyle || "classic");
  const [instagramHandle, setInstagramHandle] = useState(club.instagramHandle || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name, location, description, trainingSchedule,
      logoUrl: logoUrl || null,
      bannerUrl: bannerUrl || null,
      primaryColor, secondaryColor, accentColor,
      textOnPrimary, textOnSecondary, brandStyle,
      instagramHandle: instagramHandle || null,
    });
  };

  return (
    <div className="py-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Club Info</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Basic details about the club.</p>
          <div className="space-y-5">
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
            <div className="space-y-1.5">
              <Label className="text-xs">Instagram Handle</Label>
              <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="e.g. zanzibarsharks" data-testid="input-club-instagram" />
            </div>
          </div>
        </div>

        <div className="border-t border-divider pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Club Branding</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Upload a logo and banner image.</p>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs">Club Logo</Label>
              <ImageUpload
                currentUrl={logoUrl}
                onUpload={(url) => setLogoUrl(url)}
                testId="input-club-logo"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Club Banner</Label>
              <ImageUpload
                currentUrl={bannerUrl}
                onUpload={(url) => setBannerUrl(url)}
                testId="input-club-banner"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-divider pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brand Colours</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 mb-4">Choose the colours used in the club UI.</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px]">Primary</Label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" data-testid="input-club-primary-color" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="text-[10px] h-8 font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Secondary</Label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" data-testid="input-club-secondary-color" />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="text-[10px] h-8 font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Accent</Label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" data-testid="input-club-accent-color" />
                <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="text-[10px] h-8 font-mono" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px]">Text on Primary</Label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={textOnPrimary} onChange={(e) => setTextOnPrimary(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" data-testid="input-club-text-primary" />
                <Input value={textOnPrimary} onChange={(e) => setTextOnPrimary(e.target.value)} className="text-[10px] h-8 font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Text on Secondary</Label>
              <div className="flex items-center gap-1.5">
                <input type="color" value={textOnSecondary} onChange={(e) => setTextOnSecondary(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" data-testid="input-club-text-secondary" />
                <Input value={textOnSecondary} onChange={(e) => setTextOnSecondary(e.target.value)} className="text-[10px] h-8 font-mono" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px]">Brand Style</Label>
          <div className="flex gap-1.5">
            {["classic", "bold", "minimal"].map((style) => (
              <Button
                key={style}
                type="button"
                size="sm"
                variant={brandStyle === style ? "default" : "ghost"}
                onClick={() => setBrandStyle(style)}
                className="capitalize text-[10px]"
                data-testid={`button-brand-style-${style}`}
              >
                {style}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t border-divider pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Live Preview</h4>
          <div className="space-y-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: primaryColor, color: textOnPrimary }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center" style={{ backgroundColor: secondaryColor, color: textOnSecondary }}>
                  <span className="text-[9px] font-bold">{name.split(" ").map(w => w[0]).join("").slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-[10px] opacity-80">{location || "Location"}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-2 rounded-md text-xs font-bold" style={{ backgroundColor: primaryColor, color: textOnPrimary }} data-testid="preview-checkin-btn">
                CHECK IN
              </button>
              <button type="button" className="flex-1 py-2 rounded-md text-xs font-bold border" style={{ borderColor: primaryColor, color: primaryColor }} data-testid="preview-details-btn">
                DETAILS
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm" disabled={isPending} className="flex-1" data-testid="button-save-club">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="text-muted-foreground" data-testid="button-cancel-club">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
