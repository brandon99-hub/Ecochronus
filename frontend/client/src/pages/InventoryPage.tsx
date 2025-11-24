import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { api, Badge, RewardsResponse, UserStats } from "@/lib/api";
import { Gift, Award, ArrowLeft, Coins, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function InventoryPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLocation("/auth");
    }
  }, [setLocation]);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/user/stats"],
    queryFn: () => api.getUserStats(),
  });

  const { data: userBadges } = useQuery<Badge[]>({
    queryKey: ["/badges/user"],
    queryFn: () => api.getUserBadges(),
  });

  const { data: allBadges } = useQuery<Badge[]>({
    queryKey: ["/badges"],
    queryFn: () => api.getAllBadges(),
  });

  const { data: rewardsResponse, isLoading: rewardsLoading } = useQuery<RewardsResponse>({
    queryKey: ["/rewards", { limit: 20 }],
    queryFn: () => api.getRewards(1, 20),
  });

  const claimBadgeMutation = useMutation({
    mutationFn: (badgeId: string) => api.claimBadge(badgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/badges/user"] });
      queryClient.invalidateQueries({ queryKey: ["/badges"] });
      toast({
        title: "Badge claimed",
        description: "Reward added to your vault.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Unable to claim badge",
        description: error instanceof Error ? error.message : "Try again later",
      });
    },
  });

  const lockedBadges = useMemo(() => {
    if (!allBadges || !userBadges) return [];
    const owned = new Set(userBadges.map((badge) => badge.id));
    return allBadges.filter((badge) => !owned.has(badge.id));
  }, [allBadges, userBadges]);

  if (rewardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar stats={stats} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar stats={stats} />

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4" /> Mission Control
          </Button>
          <UIBadge variant="outline" className="uppercase tracking-wide">
            Inventory & Badges
          </UIBadge>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-8 shadow-2xl"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Badges Earned</p>
                <p className="text-3xl font-serif font-bold">{userBadges?.length ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-accent/20 p-4">
                <Gift className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Vault Items</p>
                <p className="text-3xl font-serif font-bold">{rewardsResponse?.pagination.total ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/20 p-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Eco Karma</p>
                <p className="text-3xl font-serif font-bold">{stats?.totalEcoKarma ?? 0}</p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-primary/30 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <Award className="h-6 w-6 text-primary" />
                Earned Badges
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {userBadges?.length ? (
                userBadges.map((badge) => (
                  <div key={badge.id} className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{badge.name}</p>
                      <UIBadge variant="outline">{badge.requirementType}</UIBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Earned {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : "Recently"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-full text-center">
                  No badges earned yet. Complete quests to unlock them.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <Coins className="h-6 w-6 text-accent" />
                Recent Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rewardsResponse?.rewards.length ? (
                rewardsResponse.rewards.map((reward) => (
                  <div key={reward.id} className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">+{reward.amount} points</p>
                      <UIBadge variant="secondary">{reward.type.replace(/_/g, " ")}</UIBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reward.issuedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mission ref: {reward.missionProgressId ?? "—"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No rewards yet. Complete missions to earn some.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-3xl font-semibold">Available Badges</h3>
            <UIBadge variant="secondary">{lockedBadges.length} locked</UIBadge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedBadges.map((badge) => (
              <Card key={badge.id} className="border border-border/60 bg-card/90 space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{badge.name}</p>
                  <UIBadge variant="outline">
                    {badge.requirementType} • {badge.requirementValue}
                  </UIBadge>
                </div>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={claimBadgeMutation.isPending}
                  onClick={() => claimBadgeMutation.mutate(badge.id)}
                >
                  Claim Reward
                </Button>
              </Card>
            ))}
            {lockedBadges.length === 0 && (
              <Card className="border-dashed border-border/60 p-6 text-center text-muted-foreground">
                You have claimed every badge. New accolades coming soon!
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

