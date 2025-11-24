import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Droplets, Leaf, Recycle, Sparkles } from "lucide-react";
import { Mission, api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleTap = () => {
    if (status !== "ACTIVE" || localProgress >= 100 || isBusy) return;
    const next = Math.min(100, localProgress + step);
    setLocalProgress(next);
    onProgressCommit(next);
    if (localProgress < 100 && next >= 100) {
      setCelebrate(true);
      onComplete();
    }
  };

  return (
    <Card className="border border-emerald-400/30 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 font-serif text-2xl">
          <Leaf className="h-5 w-5 text-emerald-400" />
          Tree Regrowth Ritual
        </CardTitle>
        <span className="text-sm uppercase tracking-wide text-muted-foreground">
          {status === "ACTIVE" ? "Tap to revive" : "Mission complete"}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Channel energy into the heartwood. Each tap restores life and brightens the grove.
        </p>
        <motion.button
          onClick={handleTap}
          disabled={status !== "ACTIVE" || localProgress >= 100 || isBusy}
          className="relative block h-72 w-full overflow-hidden rounded-2xl border border-emerald-500/30 shadow-lg"
          whileTap={{ scale: status === "ACTIVE" ? 0.97 : 1 }}
        >
          <TreeVisual phase={phase} progress={localProgress} celebrate={celebrate} />
        </motion.button>
        <Progress value={localProgress} className="h-2" />
        {localProgress >= 100 ? (
          <p className="text-sm font-semibold text-emerald-500">The grove thrives once more!</p>
        ) : (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {Math.ceil((100 - localProgress) / step)} taps remaining
          </p>
        )}
      </CardContent>
    </Card>
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

  useEffect(() => {
    setLocalProgress(initialProgress);
    if (initialProgress >= 100) {
      setCelebrate(true);
    }
  }, [initialProgress]);

  const handleDebrisClick = (id: number) => {
    if (status !== "ACTIVE" || isBusy) return;
    setDebris((current) => {
      const updated = current.filter((trash) => trash.id !== id);
      const cleared = totalDebris - updated.length;
      const next = Math.min(100, Math.round((cleared / totalDebris) * 100));
      setLocalProgress(next);
      onProgressCommit(next);
      if (next >= 100) {
        setCelebrate(true);
        onComplete();
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
    <Card className="border border-sky-400/30 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 font-serif text-2xl">
          <Droplets className="h-5 w-5 text-sky-400" />
          Water Purification
        </CardTitle>
        <span className="text-sm uppercase tracking-wide text-muted-foreground">
          {status === "ACTIVE" ? "Clear the debris" : "Mission complete"}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Remove the debris pieces. Each cleared item restores clarity to the river.
        </p>
        <WaterVisual
          progress={localProgress}
          celebrate={celebrate}
          debris={debris}
          onDebrisClick={handleDebrisClick}
          disabled={status !== "ACTIVE" || isBusy}
        />
        <Progress value={localProgress} className="h-2" />
        {localProgress >= 100 ? (
          <p className="text-sm font-semibold text-sky-400">Waters run clear! Report back for rewards.</p>
        ) : (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {debris.length} debris pieces remaining
          </p>
        )}
      </CardContent>
    </Card>
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
}

function createWasteTiles(count: number, filledRatio: number): WasteTile[] {
  const filled = Math.round(count * filledRatio);
  return Array.from({ length: count }).map((_, index) => ({
    id: index + 1,
    cleared: index < filled,
  }));
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
      return updated;
    });
  };

  const remaining = wasteTiles.filter((tile) => !tile.cleared).length;

  return (
    <Card className="border border-amber-400/30 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 font-serif text-2xl">
          <Recycle className="h-5 w-5 text-amber-400" />
          Pollution Cleanup
        </CardTitle>
        <span className="text-sm uppercase tracking-wide text-muted-foreground">
          {status === "ACTIVE" ? "Collect the waste" : "Mission complete"}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tap polluted plots to clear debris and restore fertile soil.
        </p>
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
          {remaining} waste patches remaining
        </p>
      </CardContent>
    </Card>
  );
}

const CompletionBanner = () => (
  <Card className="border border-primary/30 bg-gradient-to-r from-primary/15 via-background to-background">
    <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
      <Sparkles className="h-4 w-4 text-primary" />
      <span>The ritual is complete. Corruption in this region has subsided.</span>
    </CardContent>
  </Card>
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
}

function WaterVisual({ progress, celebrate, debris, onDebrisClick, disabled }: WaterVisualProps) {
  const waterPalette = useMemo(() => {
    if (progress >= 100) return ["#60a5fa", "#38bdf8"];
    if (progress >= 60) return ["#22d3ee", "#0ea5e9"];
    if (progress >= 30) return ["#0f766e", "#0e7490"];
    return ["#0f172a", "#082f49"];
  }, [progress]);

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-950">
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-900 p-4">
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
            className={`h-20 rounded-xl border-2 transition ${
              tile.cleared
                ? "border-emerald-300 bg-gradient-to-br from-emerald-500 to-emerald-300 text-emerald-900 shadow-lg"
                : "border-amber-600 bg-gradient-to-br from-amber-900 to-amber-700 text-amber-200"
            }`}
          >
            {tile.cleared ? "🌿 Restored" : "♻️ Tap to Clean"}
          </button>
        ))}
      </div>
    </div>
  );
}


