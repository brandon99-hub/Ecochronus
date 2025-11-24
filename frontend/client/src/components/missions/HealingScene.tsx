import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Droplets, Leaf, Recycle, Sparkles, Sun, Music2, Droplet } from "lucide-react";
import { Mission, api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type InteractionType = "tree_regrowth" | "water_purification" | "pollution_cleanup";
type TreePhase = "dormant" | "sprout" | "blossoming" | "renewed";

interface MissionRequirements {
  interaction?: InteractionType;
  tapsRequired?: number;
  debrisCount?: number;
}

interface SceneProps {
  status: Mission["status"];
  initialProgress: number;
  requirements: MissionRequirements;
  onProgressCommit: (progress: number) => void;
  onComplete: () => void;
  isBusy: boolean;
}

interface MissionInteractionProps {
  mission: Mission;
}

export function MissionInteraction({ mission }: MissionInteractionProps) {
  const requirements = (mission.requirements as MissionRequirements | undefined) ?? {};
  const inferredInteraction = inferInteraction(mission, requirements);

  if (!inferredInteraction) {
    return null;
  }

  if (mission.status === "AVAILABLE") {
    return (
      <Card className="border border-dashed border-muted-foreground/40 bg-muted/20">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Environmental Ritual Locked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Start this mission to unlock its interactive healing task.</p>
          <p className="text-xs uppercase tracking-wide">Tap “Embark on Quest” to begin.</p>
        </CardContent>
      </Card>
    );
  }

  const inferredRequirements = { ...requirements, interaction: inferredInteraction };
  const initialProgress =
    mission.progress?.progress ?? (mission.status === "COMPLETED" ? 100 : 0);

  const { mutate: persistProgress, isPending: progressPending } = useProgressUpdater(mission.id);
  const { complete: triggerCompletion, isPending: completionPending } = useMissionCompletion(
    mission.id,
    mission.status === "COMPLETED"
  );

  const handleProgressCommit = useCallback(
    (value: number) => {
      if (mission.status !== "ACTIVE") return;
      persistProgress(value);
    },
    [mission.status, persistProgress]
  );

  const handleAutoComplete = useCallback(() => {
    if (mission.status === "ACTIVE") {
      triggerCompletion();
    }
  }, [mission.status, triggerCompletion]);

  const sharedProps: SceneProps = {
    status: mission.status,
    initialProgress,
    requirements: inferredRequirements,
    onProgressCommit: handleProgressCommit,
    onComplete: handleAutoComplete,
    isBusy: progressPending || completionPending,
  };

  return (
    <div className="space-y-4">
      {mission.status === "COMPLETED" && <CompletionBanner />}
      {inferredInteraction === "tree_regrowth" && <TreeRegrowthScene {...sharedProps} />}
      {inferredInteraction === "water_purification" && <WaterPurificationScene {...sharedProps} />}
      {inferredInteraction === "pollution_cleanup" && <PollutionCleanupScene {...sharedProps} />}
    </div>
  );
}

function inferInteraction(
  mission: Mission,
  requirements: MissionRequirements
): InteractionType | null {
  if (requirements.interaction) {
    return requirements.interaction;
  }

  const title = mission.title.toLowerCase();
  if (title.includes("tree") || title.includes("grove")) {
    return "tree_regrowth";
  }
  if (title.includes("water") || title.includes("river")) {
    return "water_purification";
  }
  if (title.includes("pollution") || title.includes("cleanup")) {
    return "pollution_cleanup";
  }

  return null;
}

function useProgressUpdater(missionId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (progress: number) => api.updateMissionProgress(missionId, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/missions"] });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Progress sync failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });
}

function useMissionCompletion(missionId: string, alreadyCompleted: boolean) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const hasCompletedRef = useRef(alreadyCompleted);

  const mutation = useMutation({
    mutationFn: () => api.completeMission(missionId),
    onSuccess: () => {
      hasCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["/missions"] });
      queryClient.invalidateQueries({ queryKey: ["/user/stats"] });
      toast({
        title: "Region cleansed",
        description: "Corruption values have been refreshed on the world map.",
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Failed to complete mission",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const complete = () => {
    if (hasCompletedRef.current || mutation.isPending) return;
    mutation.mutate();
  };

  return { complete, isPending: mutation.isPending };
}

type RitualAction = "water" | "sunlight" | "song";

function TreeRegrowthScene({
  status,
  initialProgress,
  requirements,
  onProgressCommit,
  onComplete,
  isBusy,
}: SceneProps) {
  const [localProgress, setLocalProgress] = useState(initialProgress);
  const [celebrate, setCelebrate] = useState(initialProgress >= 100);
  const [actionFeed, setActionFeed] = useState<string[]>([]);

  useEffect(() => {
    setLocalProgress(initialProgress);
    if (initialProgress >= 100) {
      setCelebrate(true);
    }
  }, [initialProgress]);

  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrate(false), 1500);
    return () => clearTimeout(timer);
  }, [celebrate]);

  const tapsRequired = requirements.tapsRequired ?? 4;
  const step = Math.max(5, Math.floor(100 / tapsRequired));
  const phase = useMemo<TreePhase>(() => {
    if (localProgress >= 100) return "renewed";
    if (localProgress >= 60) return "blossoming";
    if (localProgress >= 30) return "sprout";
    return "dormant";
  }, [localProgress]);

  const handleAction = (action: RitualAction) => {
    if (status !== "ACTIVE" || localProgress >= 100 || isBusy) return;
    const bonus =
      action === "water" ? 12 : action === "sunlight" ? 10 : 9;
    const next = Math.min(100, localProgress + step + bonus);
    setLocalProgress(next);
    onProgressCommit(next);
    if (localProgress < 100 && next >= 100) {
      setCelebrate(true);
      onComplete();
    }
    setActionFeed((feed) => {
      const entry =
        action === "water"
          ? "You nourished the roots with crystalline water."
          : action === "sunlight"
          ? "Sunbeams flood the canopy and awaken dormant buds."
          : "Forest hymns echo through the grove, summoning wildlife.";
      return [entry, ...feed].slice(0, 4);
    });
  };

  return (
    <section className="rounded-3xl border border-emerald-400/30 bg-card/90 p-6 space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-500">Sacred Ritual</p>
          <h3 className="font-serif text-3xl flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-400" />
            Tree Regrowth
          </h3>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
            <span>Vitality: {localProgress}%</span>
            <span>Rituals remaining: {Math.max(0, Math.ceil((100 - localProgress) / (step + 8)))}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <BadgeDisplay label="Status" value={status === "ACTIVE" ? "In progress" : "Complete"} />
          <BadgeDisplay label="Phase" value={phase} />
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <RitualButton
          icon={Droplet}
          label="Water Roots"
          onClick={() => handleAction("water")}
          disabled={status !== "ACTIVE" || localProgress >= 100 || isBusy}
        />
        <RitualButton
          icon={Sun}
          label="Call Sunlight"
          onClick={() => handleAction("sunlight")}
          disabled={status !== "ACTIVE" || localProgress >= 100 || isBusy}
        />
        <RitualButton
          icon={Music2}
          label="Sing Hymn"
          onClick={() => handleAction("song")}
          disabled={status !== "ACTIVE" || localProgress >= 100 || isBusy}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="space-y-4">
          <motion.div
            className="relative block h-[22rem] w-full overflow-hidden rounded-3xl border border-emerald-500/30 shadow-2xl"
            whileTap={{ scale: status === "ACTIVE" ? 0.97 : 1 }}
          >
            <TreeVisual phase={phase} progress={localProgress} celebrate={celebrate} />
          </motion.div>
          <Progress value={localProgress} className="h-2" />
          {localProgress >= 100 ? (
            <p className="text-sm font-semibold text-emerald-500">
              The grove thrives once more. Return to the region overview for your reward.
            </p>
          ) : (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Channel more rituals to reach full renewal.
            </p>
          )}
        </div>
        <FeedPanel
          title="Ritual Chronicle"
          entries={
            actionFeed.length
              ? actionFeed
              : ["Awaiting your first ritual. Channel energy to awaken the grove."]
          }
        />
      </div>
    </section>
  );
}

function WaterPurificationScene({
  status,
  initialProgress,
  requirements,
  onProgressCommit,
  onComplete,
  isBusy,
}: SceneProps) {
  const totalDebris = requirements.debrisCount ?? 3;
  const [localProgress, setLocalProgress] = useState(initialProgress);
  const [debris, setDebris] = useState(() =>
    initialProgress >= 100 ? [] : createDebris(totalDebris)
  );
  const [celebrate, setCelebrate] = useState(initialProgress >= 100);
  const [feedEntries, setFeedEntries] = useState<string[]>([]);
  const [comboCount, setComboCount] = useState(0);
  const lastClickRef = useRef<number>(0);

  useEffect(() => {
    setLocalProgress(initialProgress);
    if (initialProgress >= 100) {
      setCelebrate(true);
    }
  }, [initialProgress]);

  const handleDebrisClick = (id: number) => {
    if (status !== "ACTIVE" || isBusy) return;
    setDebris((current) => {
      const target = current.find((trash) => trash.id === id);
      const updated = current.filter((trash) => trash.id !== id);
      const cleared = totalDebris - updated.length;
      const next = Math.min(100, Math.round((cleared / totalDebris) * 100));
      setLocalProgress(next);
      onProgressCommit(next);
      if (next >= 100) {
        setCelebrate(true);
        onComplete();
      }
      const now = Date.now();
      if (now - lastClickRef.current < 1200) {
        setComboCount((prev) => prev + 1);
        setFeedEntries((entries) => [
          `Combo x${comboCount + 1}! Rapid cleansing boosts clarity.`,
          ...entries,
        ].slice(0, 5));
      } else {
        setComboCount(1);
      }
      lastClickRef.current = now;
      if (target) {
        const descriptor =
          target.variant === "bag"
            ? "Plastic heap removed"
            : target.variant === "bottle"
            ? "Toxic bottle captured"
            : "Industrial canister secured";
        setFeedEntries((entries) => [
          `${descriptor}. River clarity rises to ${next}%.`,
          ...entries,
        ].slice(0, 5));
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrate(false), 1500);
    return () => clearTimeout(timer);
  }, [celebrate]);

  const waterColor = useMemo(() => {
    if (localProgress >= 100) return "from-sky-400 via-sky-500 to-sky-600";
    if (localProgress >= 60) return "from-cyan-500 via-sky-500 to-blue-600";
    if (localProgress >= 30) return "from-teal-600 via-cyan-700 to-blue-800";
    return "from-slate-800 via-slate-900 to-slate-950";
  }, [localProgress]);

  return (
    <section className="rounded-3xl border border-sky-400/40 bg-card/95 p-6 space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-sky-500">Mission Control</p>
          <h3 className="font-serif text-3xl flex items-center gap-2">
            <Droplets className="h-5 w-5 text-sky-400" />
            Water Purification
          </h3>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
            <span>Clarity: {localProgress}%</span>
            <span>Debris remaining: {debris.length}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <BadgeDisplay label="Combo" value={`x${Math.max(comboCount, 1)}`} />
          <BadgeDisplay label="Status" value={status === "ACTIVE" ? "In progress" : "Complete"} />
        </div>
      </header>
      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-4">
          <WaterVisual
            progress={localProgress}
            celebrate={celebrate}
            debris={debris}
            onDebrisClick={handleDebrisClick}
            disabled={status !== "ACTIVE" || isBusy}
            tooltips
          />
          <div className="flex flex-wrap gap-4 items-center">
            <RadialGauge value={localProgress} label="River Vitality" deity="Persephone" />
            <div className="flex-1 space-y-2">
              <Progress value={localProgress} className="h-2" />
              {localProgress >= 100 ? (
                <p className="text-sm font-semibold text-sky-400">
                  Waters run clear! Report back for rewards.
                </p>
              ) : (
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Chain quick cleanses for bonus clarity.
                </p>
              )}
            </div>
          </div>
        </div>
        <FeedPanel
          title="River Log"
          entries={
            feedEntries.length
              ? feedEntries
              : ["No debris removed yet. Target the largest spill to begin purification."]
          }
        />
      </section>
    </section>
  );
}

interface DebrisPiece {
  id: number;
  top: string;
  left: string;
  variant: "bag" | "bottle" | "can";
  rotation: number;
}

function createDebris(count: number): DebrisPiece[] {
  const variants: DebrisPiece["variant"][] = ["bag", "bottle", "can"];
  return Array.from({ length: count }).map((_, index) => ({
    id: index + 1,
    top: `${20 + Math.random() * 50}%`,
    left: `${10 + Math.random() * 80}%`,
    variant: variants[index % variants.length],
    rotation: Math.random() * 50 - 25,
  }));
}

interface WasteTile {
  id: number;
  cleared: boolean;
  type: "plastic" | "industrial" | "organic" | "oil";
  description: string;
  beforeImage?: string;
  afterImage?: string;
}

function createWasteTiles(count: number, filledRatio: number): WasteTile[] {
  const filled = Math.round(count * filledRatio);
  const tileTypes: Array<WasteTile["type"]> = ["plastic", "industrial", "organic", "oil"];
  return Array.from({ length: count }).map((_, index) => {
    const type = tileTypes[index % tileTypes.length];
    const before = type === "industrial"
      ? "/assets/tiles/industrial-before.png"
      : type === "oil"
      ? "/assets/tiles/oil-before.png"
      : type === "organic"
      ? "/assets/tiles/organic-before.png"
      : "/assets/tiles/plastic-before.png";
    const after = type === "industrial"
      ? "/assets/tiles/industrial-after.png"
      : type === "oil"
      ? "/assets/tiles/oil-after.png"
      : type === "organic"
      ? "/assets/tiles/organic-after.png"
      : "/assets/tiles/plastic-after.png";
    return {
      id: index + 1,
      cleared: index < filled,
      type,
      description:
        type === "plastic"
          ? "Plastic heaps smothering seedlings."
          : type === "industrial"
          ? "Abandoned machinery leaking toxins."
          : type === "organic"
          ? "Rotting organic waste attracting pests."
          : "Oil spill trench suffocating the soil.",
      beforeImage: before,
      afterImage: after,
    };
  });
}

function PollutionCleanupScene({
  status,
  initialProgress,
  requirements,
  onProgressCommit,
  onComplete,
  isBusy,
}: SceneProps) {
  const totalItems = requirements.debrisCount ?? 3;
  const [localProgress, setLocalProgress] = useState(initialProgress);
  const [wasteTiles, setWasteTiles] = useState(() =>
    createWasteTiles(totalItems, initialProgress / 100)
  );
  const [celebrate, setCelebrate] = useState(initialProgress >= 100);
  const [feedEntries, setFeedEntries] = useState<string[]>([]);

  useEffect(() => {
    setLocalProgress(initialProgress);
    setWasteTiles(createWasteTiles(totalItems, initialProgress / 100));
    if (initialProgress >= 100) {
      setCelebrate(true);
    }
  }, [initialProgress, totalItems]);

  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrate(false), 1500);
    return () => clearTimeout(timer);
  }, [celebrate]);

  const handleTileClean = (id: number) => {
    if (status !== "ACTIVE" || isBusy) return;
    setWasteTiles((tiles) => {
      const updated = tiles.map((tile) =>
        tile.id === id ? { ...tile, cleared: true } : tile
      );
      const cleared = updated.filter((tile) => tile.cleared).length;
      const nextProgress = Math.min(100, Math.round((cleared / totalItems) * 100));
      setLocalProgress(nextProgress);
      onProgressCommit(nextProgress);
      if (nextProgress >= 100) {
        setCelebrate(true);
        onComplete();
      }
      setFeedEntries((entries) => [
        `Sector ${id} restored. Soil vitality climbs to ${nextProgress}%.`,
        ...entries,
      ].slice(0, 5));
      return updated;
    });
  };

  const remaining = wasteTiles.filter((tile) => !tile.cleared).length;

  return (
    <section className="rounded-3xl border border-amber-400/40 bg-card/95 p-6 space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-500">Urban Mission</p>
          <h3 className="font-serif text-3xl flex items-center gap-2">
            <Recycle className="h-5 w-5 text-amber-400" />
            Pollution Cleanup
          </h3>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
            <span>Area vitality: {localProgress}%</span>
            <span>Waste patches remaining: {remaining}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <BadgeDisplay label="Status" value={status === "ACTIVE" ? "In progress" : "Complete"} />
          <BadgeDisplay label="Sectors" value={`${totalItems}`} />
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <PollutionVisual
            tiles={wasteTiles}
            disabled={status !== "ACTIVE" || isBusy}
            onCleanTile={handleTileClean}
            celebrate={celebrate}
          />
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-900 p-6 text-white">
            <p className="text-sm uppercase tracking-wide">Area Vitality</p>
            <p className="text-3xl font-bold">{localProgress}%</p>
          </div>
          <Progress value={localProgress} className="h-2" />
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Chain cleans on adjacent plots to reveal hidden gardens.
          </p>
        </div>
        <FeedPanel
          title="Cleanup Dispatch"
          entries={
            feedEntries.length
              ? feedEntries
              : ["Survey teams ready. Clear any tile to reveal the soil beneath."]
          }
        />
      </section>
    </section>
  );
}

type IconRenderer = (props: { className?: string }) => JSX.Element;

interface RitualButtonProps {
  icon: IconRenderer;
  label: string;
  onClick: () => void;
  disabled: boolean;
}

const RitualButton = ({ icon: Icon, label, onClick, disabled }: RitualButtonProps) => (
  <Button
    variant="secondary"
    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-wide"
    onClick={onClick}
    disabled={disabled}
  >
    <Icon className="h-4 w-4 text-primary" />
    {label}
  </Button>
);

const FeedPanel = ({ title, entries }: { title: string; entries: string[] }) => (
  <div className="rounded-2xl border border-border/60 bg-background/70 p-4 space-y-3">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
    <ul className="space-y-2 text-sm text-muted-foreground max-h-64 overflow-auto pr-1">
      {entries.map((entry, index) => (
        <li
          key={`${entry}-${index}`}
          className="rounded-xl border border-border/40 bg-muted/30 px-3 py-2 leading-relaxed"
        >
          {entry}
        </li>
      ))}
    </ul>
  </div>
);

const CompletionBanner = () => (
  <Card className="border border-primary/30 bg-gradient-to-r from-primary/15 via-background to-background">
    <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
      <Sparkles className="h-4 w-4 text-primary" />
      <span>The ritual is complete. Corruption in this region has subsided.</span>
    </CardContent>
  </Card>
);

const BadgeDisplay = ({ label, value }: { label: string; value: string }) => (
  <Badge variant="outline" className="rounded-full border-border/60 text-xs uppercase tracking-wide">
    <span className="text-muted-foreground">{label}:</span> <span className="ml-1 font-semibold">{value}</span>
  </Badge>
);

const RadialGauge = ({
  value,
  label,
  deity,
}: {
  value: number;
  label: string;
  deity: string;
}) => (
  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-sky-400/30 bg-background/70 shadow-inner">
    <svg className="absolute inset-0" viewBox="0 0 120 120">
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="#1e293b"
        strokeWidth="10"
        fill="transparent"
      />
      <circle
        cx="60"
        cy="60"
        r="50"
        stroke="#38bdf8"
        strokeWidth="10"
        strokeLinecap="round"
        fill="transparent"
        strokeDasharray={`${(value / 100) * 314}, 314`}
        transform="rotate(-90 60 60)"
      />
    </svg>
    <div className="text-center text-xs">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}%</p>
      <p className="text-[10px] uppercase tracking-wide text-primary">{deity}</p>
    </div>
  </div>
);

const CompletionBurst = () => (
  <motion.div
    className="pointer-events-none absolute inset-0 flex items-center justify-center"
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: [0, 1, 0], scale: [0.7, 1.1, 1] }}
    transition={{ duration: 1.2, ease: "easeOut" }}
  >
    <Sparkles className="h-14 w-14 text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
  </motion.div>
);

const leafLayout = [
  { cx: 80, cy: 80, r: 16 },
  { cx: 110, cy: 65, r: 14 },
  { cx: 120, cy: 100, r: 18 },
  { cx: 90, cy: 110, r: 15 },
  { cx: 65, cy: 105, r: 12 },
  { cx: 140, cy: 120, r: 14 },
  { cx: 60, cy: 130, r: 14 },
];

const treePhaseVisuals: Record<TreePhase, { background: string; canopy: string; leaves: string; trunk: string; glow: string }> = {
  dormant: {
    background: "from-stone-900 via-slate-900 to-emerald-900",
    canopy: "#0f3f2c",
    leaves: "#1f6b3a",
    trunk: "#3d2b1f",
    glow: "rgba(34,197,94,0.2)",
  },
  sprout: {
    background: "from-emerald-900 via-emerald-700 to-emerald-600",
    canopy: "#1f6b3a",
    leaves: "#4ade80",
    trunk: "#4b311f",
    glow: "rgba(74,222,128,0.35)",
  },
  blossoming: {
    background: "from-emerald-800 via-teal-600 to-lime-500",
    canopy: "#34d399",
    leaves: "#a7f3d0",
    trunk: "#5c3c26",
    glow: "rgba(187,247,208,0.5)",
  },
  renewed: {
    background: "from-lime-500 via-emerald-500 to-emerald-400",
    canopy: "#86efac",
    leaves: "#ecfccb",
    trunk: "#6b442c",
    glow: "rgba(236,252,203,0.65)",
  },
};

interface TreeVisualProps {
  phase: TreePhase;
  progress: number;
  celebrate: boolean;
}

function TreeVisual({ phase, progress, celebrate }: TreeVisualProps) {
  const style = treePhaseVisuals[phase];
  const canopyScale = 0.55 + progress / 200;
  const leafOpacity = Math.min(1, 0.35 + progress / 120);
  const trunkHeight = 60 + progress * 0.4;

  return (
    <>
      <div className={`absolute inset-0 bg-gradient-to-b ${style.background} transition-colors duration-700`} />
      <div className="relative z-10 flex h-full flex-col items-center justify-between py-5 text-white drop-shadow-xl">
        <div className="text-center">
          <p className="text-lg font-semibold capitalize">{phase}</p>
          <p className="text-sm opacity-80">{progress}% vitality</p>
        </div>
        <div className="relative h-48 w-48">
          {celebrate && <CompletionBurst />}
          <motion.div
            className="absolute inset-x-0 bottom-0 h-12 rounded-full bg-emerald-200/40 blur-xl"
            animate={{ opacity: 0.4 + progress / 200, scaleX: 0.9 + progress / 600 }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: 0.95 + progress / 800 }}
            transition={{ duration: 0.5 }}
          >
            <motion.svg width="200" height="220" viewBox="0 0 200 220" className="overflow-visible">
              <motion.rect
                x="96"
                y={150 - trunkHeight}
                width="12"
                height={trunkHeight}
                rx="6"
                fill={style.trunk}
                animate={{ y: 150 - trunkHeight, height: trunkHeight }}
                transition={{ duration: 0.5 }}
              />
              <motion.path
                d="M102 120 C120 110 130 90 142 80"
                stroke={style.trunk}
                strokeWidth="6"
                strokeLinecap="round"
                fill="transparent"
                animate={{ pathLength: 0.6 + progress / 160 }}
              />
              <motion.path
                d="M102 130 C80 120 65 105 58 90"
                stroke={style.trunk}
                strokeWidth="6"
                strokeLinecap="round"
                fill="transparent"
                animate={{ pathLength: 0.6 + progress / 160 }}
              />
              <motion.circle
                cx="102"
                cy="120"
                r={50 * canopyScale}
                fill={style.canopy}
                opacity={0.8}
                animate={{ r: 50 * canopyScale }}
                transition={{ duration: 0.5 }}
              />
              {leafLayout.map((leaf, index) => (
                <motion.circle
                  key={index}
                  cx={leaf.cx}
                  cy={leaf.cy}
                  r={leaf.r * (0.5 + progress / 180)}
                  fill={style.leaves}
                  opacity={leafOpacity}
                  animate={{ scale: canopyScale }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 80 }}
                />
              ))}
            </motion.svg>
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 50px ${style.glow}` }}
            animate={{ opacity: 0.3 + progress / 200 }}
          />
        </div>
      </div>
    </>
  );
}

interface WaterVisualProps {
  progress: number;
  celebrate: boolean;
  debris: DebrisPiece[];
  onDebrisClick: (id: number) => void;
  disabled: boolean;
  tooltips?: boolean;
}

function WaterVisual({ progress, celebrate, debris, onDebrisClick, disabled, tooltips }: WaterVisualProps) {
  const waterPalette = useMemo(() => {
    if (progress >= 100) return ["#60a5fa", "#38bdf8"];
    if (progress >= 60) return ["#22d3ee", "#0ea5e9"];
    if (progress >= 30) return ["#0f766e", "#0e7490"];
    return ["#0f172a", "#082f49"];
  }, [progress]);

  return (
    <div className="relative h-72 overflow-hidden rounded-3xl border border-sky-500/40 bg-slate-950 shadow-2xl">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, ${waterPalette[0]} 0%, ${waterPalette[1]} 100%)`,
        }}
        animate={{ backgroundPosition: ["0% 0%", "0% 100%"] }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
      />
      <motion.svg
        width="400"
        height="220"
        viewBox="0 0 400 220"
        className="absolute inset-x-0 bottom-0 opacity-60"
        animate={{ x: ["0%", "-25%"] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      >
        <path
          d="M0 80 Q 80 50 160 80 T 320 80 T 480 80 V 220 H 0 Z"
          fill="url(#waveGradient)"
        />
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
      </motion.svg>
      {celebrate && <CompletionBurst />}
      {debris.map((trash) => (
        <motion.button
          key={trash.id}
          onClick={() => onDebrisClick(trash.id)}
          disabled={disabled}
          className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/70 text-white shadow-lg"
          style={{ top: trash.top, left: trash.left, rotate: `${trash.rotation}deg` }}
          whileHover={{ scale: disabled ? 1 : 1.1 }}
          whileTap={{ scale: disabled ? 1 : 0.9 }}
        >
          {trash.variant === "bag" && "🛍️"}
          {trash.variant === "bottle" && "🍾"}
          {trash.variant === "can" && "🥫"}
        </motion.button>
      ))}
    </div>
  );
}

interface PollutionVisualProps {
  tiles: WasteTile[];
  disabled: boolean;
  onCleanTile: (id: number) => void;
  celebrate: boolean;
}

function PollutionVisual({ tiles, disabled, onCleanTile, celebrate }: PollutionVisualProps) {
  const columns = Math.ceil(Math.sqrt(tiles.length));

  const getIcon = (type: WasteTile["type"]) => {
    switch (type) {
      case "plastic":
        return "🧃";
      case "industrial":
        return "🏭";
      case "organic":
        return "🌾";
      case "oil":
      default:
        return "🛢️";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-900 p-6 shadow-xl">
      {celebrate && <CompletionBurst />}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => onCleanTile(tile.id)}
            disabled={disabled || tile.cleared}
            className={`h-24 rounded-xl border-2 px-3 py-2 text-left transition ${
              tile.cleared
                ? "border-emerald-300 bg-gradient-to-br from-emerald-500 to-emerald-300 text-emerald-900 shadow-lg"
                : "border-amber-600 bg-gradient-to-br from-amber-900 to-amber-700 text-amber-100"
            }`}
          >
            <div className="flex items-center gap-2 text-lg">
              <span>{tile.cleared ? "🌿" : getIcon(tile.type)}</span>
              <span className="text-xs uppercase tracking-wide">
                {tile.cleared ? "Restored" : tile.type}
              </span>
            </div>
            {!tile.cleared && (
              <p className="text-xs opacity-80 mt-1">{tile.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


