import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api, Mission, UserStats } from "@/lib/api";
import { ArrowLeft, Coins, Sword, CheckCircle2, Loader2, Flame, MapPin, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { getMissionIcon } from "@/lib/missions";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MissionInteraction } from "@/components/missions/HealingScene";
import { MissionCompletionModal } from "@/components/missions/MissionCompletionModal";

export default function MissionPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLocation('/auth');
    }
  }, [setLocation]);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['/user/stats'],
    queryFn: () => api.getUserStats(),
  });

  const { data: missions, isLoading } = useQuery<Mission[]>({
    queryKey: ['/missions'],
    queryFn: () => api.getMissions(),
  });

  const mission = missions?.find((m) => m.id === id);

  const [completionSummary, setCompletionSummary] = useState<{
    coins: number;
    xp: number;
    ecoKarma: number;
  } | null>(null);

  const startMissionMutation = useMutation({
    mutationFn: () => api.startMission(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/missions', id] });
      queryClient.invalidateQueries({ queryKey: ['/missions'] });
      toast({
        title: "Quest accepted!",
        description: "Your mission has begun. Good luck, Avatar!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to start mission",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    },
  });

  const completeMissionMutation = useMutation({
    mutationFn: () => api.completeMission(id!),
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ['/missions'] });
      queryClient.invalidateQueries({ queryKey: ['/user/stats'] });

      const ecoKarmaGain =
        context?.mission?.isCorruptionMission && context.mission.corruptionLevel
          ? context.mission.corruptionLevel
          : 0;

      setCompletionSummary({
        coins: context?.mission?.points ?? mission?.points ?? 0,
        xp: context?.mission ? Math.round(50 + (context.mission.points ?? 0) / 10) : 50,
        ecoKarma: ecoKarmaGain,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to complete mission",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
    onMutate: async () => {
      return { mission };
    },
  });

  const handleStartMission = () => {
    startMissionMutation.mutate();
  };

  const handleComplete = () => {
    completeMissionMutation.mutate();
  };

  const handleBack = () => {
    setLocation('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar stats={stats} />
        <LoadingSpinner />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar stats={stats} />
        <div className="container mx-auto px-6 py-12 text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">Quest Not Found</h2>
          <Button onClick={handleBack} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    AVAILABLE: (locked: boolean) => ({
      badge: <Badge className="bg-primary/20 text-primary border-primary/30">Available</Badge>,
      action: (
        <div className="w-full space-y-2">
          <Button
            onClick={handleStartMission}
            disabled={startMissionMutation.isPending || locked}
            className="w-full glow-primary"
            size="lg"
            data-testid="button-start-mission"
          >
            {startMissionMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Starting Quest...</>
            ) : locked ? (
              <>Locked</>
            ) : (
              <><Sword className="mr-2 h-5 w-5" /> Embark on Quest</>
            )}
          </Button>
          {locked && (
            <p className="text-sm text-muted-foreground text-center">
              Complete prerequisite quests to unlock this mission.
            </p>
          )}
        </div>
      ),
    }),
    ACTIVE: () => ({
      badge: <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 glow-blue">In Progress</Badge>,
      action: (
        <Button
          onClick={handleComplete}
          className="w-full bg-blue-600 hover:bg-blue-700 glow-blue"
          size="lg"
          data-testid="button-complete-quest"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" /> Complete Quest
        </Button>
      ),
    }),
    COMPLETED: () => ({
      badge: <Badge className="bg-accent/20 text-accent border-accent/30 glow-accent">Completed</Badge>,
      action: (
        <Button disabled className="w-full opacity-60" size="lg" data-testid="button-already-completed">
          <CheckCircle2 className="mr-2 h-5 w-5" /> Already Completed
        </Button>
      ),
    }),
  };

  const isLocked = mission.status === 'AVAILABLE' && !mission.isUnlocked;
  const configFactory = statusConfig[mission.status];
  const config = typeof configFactory === "function" ? configFactory(isLocked) : configFactory;
  const missionIcon = getMissionIcon(mission.title);
  const missionMeta = [
    { label: "Patron God", value: mission.god ?? "Unknown deity", icon: Crown },
    { label: "Region", value: mission.region ?? "Global", icon: MapPin },
    { label: "Intensity", value: mission.category ?? "Standard", icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar stats={stats} />

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Missions
          </Button>

          <div className="flex items-center gap-2">
            {config.badge}
            <UIBadge variant="outline">
              Mission ID: {mission.id.slice(0, 6).toUpperCase()}
            </UIBadge>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-background p-8 shadow-2xl"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.3em] text-primary">Quest Briefing</p>
              <h1 className="font-serif text-5xl font-bold gradient-text" data-testid="text-mission-title">
                {mission.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed" data-testid="text-mission-description">
                {mission.description}
              </p>

              <div className="rounded-xl border border-accent/30 bg-accent/10 px-6 py-4 flex flex-wrap items-center gap-4">
                <Coins className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-accent">Reward</p>
                  <p className="font-mono text-3xl text-accent" data-testid="text-mission-points">
                    +{mission.points} planetary points
                  </p>
                </div>
                {isLocked && (
                  <UIBadge variant="destructive" className="ml-auto">
                    Locked
                  </UIBadge>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-background blur-3xl opacity-30" />
              <div className="relative rounded-2xl border border-primary/40 bg-card/70 backdrop-blur-xl p-6 flex flex-col items-center gap-4">
                <img
                  src={missionIcon}
                  alt={mission.title}
                  className="h-32 w-32 rounded-2xl border border-primary/40 object-contain"
                />
                <div className="space-y-3 w-full">
                  {missionMeta.map((meta) => (
                    <div key={meta.label} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
                      <meta.icon className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{meta.label}</p>
                        <p className="text-sm font-semibold">{meta.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Card className="border border-primary/20 shadow-lg">
              <CardHeader>
                <h3 className="font-serif text-2xl font-semibold">Quest Objectives</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete all listed objectives to cleanse the corruption linked to this region.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    Document the steps taken to fulfill the mission.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    Submit proof through the Quest Report interface.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    Earn bonus karma for providing detailed evidence.
                  </li>
                </ul>
                {isLocked && (
                  <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                    This quest is currently locked. Finish prerequisite missions or raise your avatar level to unlock.
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                {config.action}
              </CardFooter>
            </Card>

            <MissionInteraction mission={mission} />
          </div>

          <Card className="border border-accent/30 bg-card/80">
            <CardHeader>
              <h3 className="font-serif text-2xl font-semibold">Mission Status</h3>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Stage</span>
                <strong>{mission.status}</strong>
              </div>
              <Separator />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress Timeline</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${mission.status !== "AVAILABLE" ? "bg-primary" : "bg-border"}`} />
                    <span>Quest Accepted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${mission.status === "COMPLETED" ? "bg-primary" : "bg-border"}`} />
                    <span>Evidence Submitted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${mission.status === "COMPLETED" ? "bg-primary" : "bg-border"}`} />
                    <span>Reward Granted</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      {completionSummary && (
        <MissionCompletionModal
          open={Boolean(completionSummary)}
          onOpenChange={(open) => {
            if (!open) {
              setCompletionSummary(null);
            }
          }}
          mission={mission}
          summary={completionSummary}
          onViewReport={() => setLocation(`/mission/${mission.id}/complete`)}
        />
      )}
    </div>
  );
}
