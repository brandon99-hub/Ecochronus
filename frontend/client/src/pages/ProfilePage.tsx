import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api, Badge, RewardsResponse, SelectedGod, UserProfile, UserStats } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sparkles, Award, Shield, Leaf, Gift, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <Card className="bg-card/60 backdrop-blur border-primary/10">
      <CardHeader className="pb-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-serif font-bold gradient-text">{value}</p>
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLocation("/auth");
    }
  }, [setLocation]);

  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery<UserStats>({
    queryKey: ["/user/stats"],
    queryFn: () => api.getUserStats(),
  });

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/user/profile"],
    queryFn: () => api.getUserProfile(),
  });
  const { data: selectedGod } = useQuery<SelectedGod | null>({
    queryKey: ["/gods/selected"],
    queryFn: () => api.getSelectedGod(),
  });


  const { data: userBadges, isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ["/badges/user"],
    queryFn: () => api.getUserBadges(),
  });
  const claimBadgeMutation = useMutation({
    mutationFn: (badgeId: string) => api.claimBadge(badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/badges/user"] });
      queryClient.invalidateQueries({ queryKey: ["/badges"] });
      toast({
        title: "Badge claimed",
        description: "Added to your inventory",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to claim badge",
        description: error instanceof Error ? error.message : "Try again later",
      });
    },
  });


  const { data: allBadges } = useQuery<Badge[]>({
    queryKey: ["/badges"],
    queryFn: () => api.getAllBadges(),
  });

  const {
    data: rewardsResponse,
    isLoading: rewardsLoading,
  } = useQuery<RewardsResponse>({
    queryKey: ["/rewards", { limit: 6 }],
    queryFn: () => api.getRecentRewards(6),
  });

  if (statsLoading || profileLoading || badgesLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  }

  const xpPercent = stats?.xpProgress.progressPercentage ?? 0;
  const xpWithinLevel = stats ? stats.xp - stats.xpProgress.currentLevelXP : 0;
  const xpNeededForNextLevel = stats
    ? stats.xpProgress.nextLevelXP - stats.xpProgress.currentLevelXP
    : 0;
  const unlockedBadgeIds = new Set(userBadges?.map((badge) => badge.id));
  const lockedBadges =
    allBadges?.filter((badge) => !unlockedBadgeIds.has(badge.id)) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar stats={stats} />

      <main className="container mx-auto px-6 py-10 space-y-10">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => setLocation("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/20 via-accent/10 to-background p-8 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/60">
                  <AvatarFallback className="bg-primary/20 text-2xl font-semibold text-primary">
                    {profile?.username?.[0]?.toUpperCase() ?? "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">
                    Avatar Handle
                  </p>
                  <h1 className="text-4xl font-serif font-bold gradient-text">
                    {profile?.username}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedGod
                      ? `Champion of ${selectedGod.name}`
                      : "Unaligned wanderer"}
                  </p>
                </div>
              </div>
            <div className="rounded-2xl border border-primary/30 bg-card/70 p-6 space-y-4">
              <h3 className="font-serif text-2xl font-semibold">Pantheon Alignment</h3>
              {selectedGod ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You are aligned with <strong>{selectedGod.name}</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedGod.description}</p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No god selected yet. Visit the Codex to pledge allegiance.
                </div>
              )}
            </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm uppercase tracking-wide text-muted-foreground">
                    XP Progress
                  </span>
                  <span className="text-sm font-mono text-accent">
                    Lv. {stats?.level ?? 1} • {(stats?.xp ?? 0).toLocaleString()} XP
                  </span>
                </div>
                <Progress value={xpPercent} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {xpWithinLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} XP to next
                  level
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Eco Karma"
                value={stats?.totalEcoKarma ?? 0}
                helper="Planetary harmony you have restored"
              />
              <StatCard
                label="Corruption Cleansed"
                value={stats?.corruptionCleared ?? 0}
                helper="Dark zones turned radiant"
              />
              <StatCard
                label="Quests Completed"
                value={stats?.missionsCompleted ?? 0}
                helper="Total lifetime quests"
              />
              <StatCard
                label="Lore Lessons"
                value={stats?.lessonsCompleted ?? 0}
                helper="Wisdom unlocked from the Codex"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-3">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <Sparkles className="h-5 w-5 text-primary" />
                Identity
              </CardTitle>
              <UIBadge variant="secondary" className="uppercase tracking-wide">
                Established{" "}
                {profile
                  ? new Date(profile.createdAt).getFullYear()
                  : "Now"}
              </UIBadge>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/70">
                  Email
                </p>
                <p className="text-base text-foreground">{profile?.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/70">
                  Device Link
                </p>
                <p className="text-base">
                  {profile?.deviceId || "No device paired"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/70">
                  Last Sync
                </p>
                <p className="text-base">
                  {profile
                    ? new Date(profile.updatedAt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/30 shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <Shield className="h-5 w-5 text-accent" />
                Recent Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rewardsResponse?.rewards.length ? (
                rewardsResponse.rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-accent">
                        {reward.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reward.issuedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono text-accent">
                        +{reward.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mission ID:{" "}
                        {reward.missionProgressId ?? "—"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-accent/30 p-6 text-center text-sm text-muted-foreground">
                  No rewards logged yet. Complete quests to earn relics!
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Systems Guide</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-1">How XP Works</p>
                <p>
                  Every level costs 100 × level XP. Example: Lv. 2 needs 100 XP total, Lv. 3
                  needs 300 total. Any extra XP rolls into your next level.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">What “Lv. 3” Means</p>
                <p>
                  You’ve banked enough XP (≥300) to unlock tier‑3 quests and rewards. Keep
                  stacking XP to hit Lv. 4 at 600 total XP.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Eco Karma</p>
                <p>
                  A running total of planetary harmony restored. Missions that clear
                  corruption or heal regions boost this stat.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-3xl font-bold">Badges & Titles</h2>
            <UIBadge className="bg-primary/10 text-primary border-primary/40">
              {userBadges?.length ?? 0} earned
            </UIBadge>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {userBadges?.length ? (
              userBadges.map((badge) => (
                <Card
                  key={badge.id}
                  className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent shadow-lg"
                >
                  <CardHeader className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                      <Award className="h-5 w-5 text-primary" />
                      {badge.name}
                    </CardTitle>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Earned {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : "Recently"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{badge.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>Requirement: {badge.requirementValue}</span>
                      <UIBadge variant="outline">{badge.requirementType}</UIBadge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full border-dashed border-primary/30 p-8 text-center">
                <Leaf className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="text-muted-foreground">
                  No badges yet. Complete more quests to forge your legend.
                </p>
              </Card>
            )}
          </div>
        </section>

        {lockedBadges.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-muted-foreground">
                Upcoming unlocks
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {lockedBadges.slice(0, 4).map((badge) => (
                <Card key={badge.id} className="border border-border/60 bg-card/80">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {badge.description}
                        </p>
                      </div>
                      <UIBadge variant="outline">
                        {badge.requirementType} • {badge.requirementValue}
                      </UIBadge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      disabled={claimBadgeMutation.isPending}
                      onClick={() => claimBadgeMutation.mutate(badge.id)}
                    >
                      Claim Badge
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

