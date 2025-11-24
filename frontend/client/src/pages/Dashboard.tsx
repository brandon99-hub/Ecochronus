import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { MissionCard } from "@/components/MissionCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, Mission, UserStats } from "@/lib/api";
import { Trophy, Target, Sparkles, Compass, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startingMissionId, setStartingMissionId] = useState<string | null>(null);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLocation('/auth');
    }
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/user/stats'],
    queryFn: () => api.getUserStats(),
  });

  const {
    data: missions,
    isLoading: missionsLoading,
  } = useQuery<Mission[]>({
    queryKey: ['/missions'],
    queryFn: () => api.getMissions(),
  });

  const startMissionMutation = useMutation({
    mutationFn: (missionId: string) => api.startMission(missionId),
    onMutate: (missionId) => {
      setStartingMissionId(missionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/missions'] });
      toast({
        title: "Quest accepted!",
        description: "Your mission has begun. Good luck, Avatar!",
      });
      setStartingMissionId(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to start mission",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
      setStartingMissionId(null);
    },
  });

  const handleStartMission = (missionId: string) => {
    startMissionMutation.mutate(missionId);
  };

  const handleCompleteMission = (missionId: string) => {
    setLocation(`/mission/${missionId}`);
  };

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          (missions ?? [])
            .map((mission) => mission.category)
            .filter((category): category is string => Boolean(category))
        )
      ),
    [missions]
  );

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  if (statsLoading || missionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  }

  const availableMissions = missions?.filter(m => m.status === 'AVAILABLE') || [];
  const activeMissions = missions?.filter(m => m.status === 'ACTIVE') || [];
  const completedMissions = missions?.filter(m => m.status === 'COMPLETED') || [];

  const filteredAvailable =
    categoryFilter === "ALL"
      ? availableMissions
      : availableMissions.filter((mission) => mission.category === categoryFilter);

  const currentXP = stats?.xpProgress.currentXP ?? 0;
  const nextLevelXP = stats?.xpProgress.nextLevelXP ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar stats={stats} />

      <main className="container mx-auto px-6 py-8 space-y-8">
        <section className="grid gap-6 lg:grid-cols-[2fr_1.2fr]">
          <Card className="border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background shadow-2xl overflow-hidden">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-primary">Mission Control</p>
                <CardTitle className="font-serif text-4xl">Restore the Timeline</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pick a quest, earn eco karma, and cleanse corruption.
                </p>
              </div>
              <Badge className="w-fit bg-accent/20 text-accent border-accent/40">
                {activeMissions.length} Active Quests
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Avatar Level</p>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/20 p-3">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-mono text-4xl text-primary" data-testid="text-avatar-level">
                    {stats?.level ?? 1}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">XP to Next Level</p>
                <Progress value={stats?.xpProgress.progressPercentage ?? 0} className="h-3" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Quests Completed</p>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-accent/20 p-3">
                    <Target className="h-6 w-6 text-accent" />
                  </div>
                  <p className="font-mono text-4xl text-accent" data-testid="text-completed-count">
                    {stats?.missionsCompleted || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border border-accent/30 bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-serif">
                  <Compass className="h-5 w-5 text-accent" />
                  World State
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Eco Karma</span>
                  <span className="font-mono text-accent">{stats?.totalEcoKarma ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Corruption Cleansed</span>
                  <span className="font-mono text-primary">{stats?.corruptionCleared ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Badges Earned</span>
                  <span className="font-mono text-muted-foreground">{stats?.badgesEarned ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-serif">
                  <Clock className="h-5 w-5 text-blue-400" />
                  Daily Contracts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Complete daily quests before cycle reset to earn bonus rewards.
                </p>
                <div className="rounded-lg border border-blue-400/40 bg-blue-500/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-blue-200">Cycle Reset</p>
                  <p className="text-2xl font-mono text-blue-200">04h 12m</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card/70 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Quest Filters</p>
              <h3 className="font-serif text-2xl font-semibold">Choose your battleground</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === "ALL" ? "default" : "secondary"}
                onClick={() => setCategoryFilter("ALL")}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? "default" : "outline"}
                  onClick={() => setCategoryFilter(category)}
                  className="capitalize"
                >
                  {category.toLowerCase()}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {activeMissions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              <h3 className="font-serif text-2xl font-semibold">Active Quests</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onComplete={() => handleCompleteMission(mission.id)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredAvailable.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-serif text-2xl font-semibold">Available Quests</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAvailable.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onStart={() => handleStartMission(mission.id)}
                  isLoading={startingMissionId === mission.id}
                />
              ))}
            </div>
          </div>
        )}

        {completedMissions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              <h3 className="font-serif text-2xl font-semibold">Completed Quests</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                />
              ))}
            </div>
          </div>
        )}

        {missions && missions.length === 0 && (
          <Card className="p-12 text-center">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-2xl font-semibold mb-2">No Quests Available</h3>
            <p className="text-muted-foreground">
              Check back soon for new missions to restore Earth!
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
