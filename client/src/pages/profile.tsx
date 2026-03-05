import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MembershipCard } from "@/components/membership-card";
import { LogOut, Settings, TrendingUp, Calendar, Dumbbell, ChevronRight } from "lucide-react";
import type { Activity, XpTransaction, Membership, Club } from "@shared/schema";
import { Link } from "wouter";

const tierThresholds = [
  { tier: "green", label: "Starter", min: 0, max: 199, color: "text-emerald-600" },
  { tier: "blue", label: "Active", min: 200, max: 499, color: "text-blue-600" },
  { tier: "silver", label: "Elite", min: 500, max: 999, color: "text-gray-500" },
  { tier: "gold", label: "Ambassador", min: 1000, max: Infinity, color: "text-amber-500" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();

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
          <Settings className="w-12 h-12 text-muted-foreground mb-4" />
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

      <div className="mb-6">
        <MembershipCard
          user={user}
          clubName={activeClub?.club.name}
        />
      </div>

      <section className="mb-6">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
          XP Progress
        </h3>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`text-sm font-semibold capitalize ${currentTierInfo.color}`}>
                {currentTierInfo.label}
              </span>
              {nextTierInfo && (
                <span className="text-xs text-muted-foreground">
                  {nextTierInfo.min - user.xpTotal} XP to {nextTierInfo.label}
                </span>
              )}
            </div>
            <Progress value={progressPercent} className="h-2 mb-2" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{user.xpTotal} XP</span>
              {nextTierInfo && (
                <span className="text-xs text-muted-foreground">{nextTierInfo.min} XP</span>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {myMemberships && myMemberships.length > 0 && (
        <section className="mb-6">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            My Clubs
          </h3>
          <div className="space-y-2">
            {myMemberships.map((m) => (
              <Link key={m.id} href={`/clubs/${m.clubId}`}>
                <Card className="hover-elevate" data-testid={`card-my-club-${m.clubId}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-xs">
                        {m.club.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.club.name}</p>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">
                        {m.status}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
          Recent Activities
        </h3>
        {myActivities && myActivities.length > 0 ? (
          <div className="space-y-2">
            {myActivities.slice(0, 5).map((activity) => (
              <Card key={activity.id} data-testid={`card-my-activity-${activity.id}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">{activity.type.replace("_", " ")}</p>
                    {activity.notes && (
                      <p className="text-xs text-muted-foreground truncate">{activity.notes}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-primary shrink-0">
                    +{activity.xpEarned} XP
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No activities recorded yet. Check in to start earning XP!
            </CardContent>
          </Card>
        )}
      </section>

      {xpHistory && xpHistory.length > 0 && (
        <section>
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
            XP History
          </h3>
          <Card>
            <CardContent className="p-0">
              {xpHistory.slice(0, 8).map((tx, idx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between gap-2 px-4 py-3 ${
                    idx < Math.min(xpHistory.length, 8) - 1 ? "border-b" : ""
                  }`}
                  data-testid={`row-xp-${tx.id}`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-sm">{tx.description}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">+{tx.amount}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
