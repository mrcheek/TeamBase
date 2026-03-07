import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MembershipCard } from "@/components/membership-card";
import { LogOut, TrendingUp, Dumbbell, ChevronRight, AlertCircle, Users, Trophy, Zap, Clock } from "lucide-react";
import type { Activity, XpTransaction, Membership, Club } from "@shared/schema";
import { Link } from "wouter";

const tierThresholds = [
  { tier: "green", label: "Starter", min: 0, max: 199, color: "text-emerald-600 dark:text-emerald-400" },
  { tier: "blue", label: "Active", min: 200, max: 499, color: "text-blue-600 dark:text-blue-400" },
  { tier: "silver", label: "Elite", min: 500, max: 999, color: "text-gray-500 dark:text-gray-400" },
  { tier: "gold", label: "Ambassador", min: 1000, max: Infinity, color: "text-amber-500 dark:text-amber-400" },
];

const activityIcons: Record<string, typeof Dumbbell> = {
  gym: Dumbbell,
  run: Zap,
  saq: Trophy,
  recovery: Clock,
  social: Users,
};

export default function ProfilePage() {
  const { user, logout, profileCompletion } = useAuth();

  const { data: myActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });

  const { data: xpHistory } = useQuery<XpTransaction[]>({
    queryKey: ["/api/xp-history"],
    enabled: !!user,
  });

  const { data: myMemberships } = useQuery<(Membership & { club: Club })[]>({
    queryKey: ["/api/memberships"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold mb-2">Sign in to view your profile</h2>
          <p className="text-sm text-muted-foreground">
            Create an account to track your rugby journey
          </p>
        </div>
      </div>
    );
  }

  const currentTierInfo = tierThresholds.find((t) => t.tier === user.tier) || tierThresholds[0];
  const nextTierInfo = tierThresholds.find((t) => t.min > user.xpTotal);
  const progressPercent = nextTierInfo
    ? Math.min(((user.xpTotal - currentTierInfo.min) / (nextTierInfo.min - currentTierInfo.min)) * 100, 100)
    : 100;

  const activeClub = myMemberships?.find((m) => m.status === "active");

  return (
    <div className="pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-2 mb-5">
        <h2 className="text-lg font-bold" data-testid="text-profile-title">Profile</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={logout}
          className="text-muted-foreground"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Sign Out
        </Button>
      </div>

      {user && !user.profileCompleted && profileCompletion < 100 && (
        <Link href="/complete-profile">
          <div className="mb-4 border border-primary/30 bg-primary/5 rounded-md p-3 flex items-center gap-3 hover-elevate" data-testid="card-complete-registration">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Complete Your Registration</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={profileCompletion} className="h-1.5 flex-1" />
                <span className="text-xs font-medium text-primary shrink-0">{profileCompletion}%</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-primary shrink-0" />
          </div>
        </Link>
      )}

      <div className="mb-6">
        <MembershipCard
          user={user}
          clubName={activeClub?.club.name}
        />
      </div>

      <section className="mb-6">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
          XP Progress
        </h3>
        <div className="bg-card border rounded-md p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold capitalize ${currentTierInfo.color}`}>
                {currentTierInfo.label}
              </span>
              <span className="text-lg font-bold">{user.xpTotal} XP</span>
            </div>
            {nextTierInfo && (
              <span className="text-xs text-muted-foreground">
                Next: {nextTierInfo.label}
              </span>
            )}
          </div>
          <Progress value={progressPercent} className="h-2.5 mb-1.5" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{currentTierInfo.min} XP</span>
            {nextTierInfo ? (
              <span className="text-xs text-muted-foreground">
                {nextTierInfo.min - user.xpTotal} XP to go
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Max tier reached</span>
            )}
          </div>
        </div>
      </section>

      {myMemberships && myMemberships.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
            My Clubs
          </h3>
          <div className="border rounded-md divide-y">
            {myMemberships.map((m) => (
              <Link key={m.id} href={`/clubs/${m.clubId}`}>
                <div className="flex items-center gap-3 px-3 py-3 hover-elevate" data-testid={`row-my-club-${m.clubId}`}>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-xs">
                      {m.club.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{m.club.name}</p>
                    {m.club.location && (
                      <p className="text-xs text-muted-foreground">{m.club.location}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {m.status}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Recent Activities
        </h3>
        {myActivities && myActivities.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
            {myActivities.slice(0, 5).map((activity) => {
              const IconComponent = activityIcons[activity.type] || Dumbbell;
              return (
                <div key={activity.id} className="relative flex items-start gap-3 pb-4 last:pb-0" data-testid={`row-activity-${activity.id}`}>
                  <div className="absolute -left-6 top-0.5 w-[23px] h-[23px] rounded-full bg-background border-2 border-primary/30 flex items-center justify-center z-10">
                    <IconComponent className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium capitalize">{activity.type.replace("_", " ")}</p>
                      <span className="text-xs font-semibold text-primary shrink-0">
                        +{activity.xpEarned} XP
                      </span>
                    </div>
                    {activity.notes && (
                      <p className="text-xs text-muted-foreground truncate">{activity.notes}</p>
                    )}
                    {activity.date && (
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{activity.date}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-md p-6 text-center text-sm text-muted-foreground">
            No activities recorded yet. Check in to start earning XP!
          </div>
        )}
      </section>

      {xpHistory && xpHistory.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
            XP History
          </h3>
          <div className="border rounded-md divide-y">
            {xpHistory.slice(0, 8).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-2 px-3 py-2.5"
                data-testid={`row-xp-${tx.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm truncate">{tx.description}</span>
                </div>
                <span className="text-sm font-semibold text-primary shrink-0">+{tx.amount}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
