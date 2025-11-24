import { useMemo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { RegionNode } from "@/types/map";

interface RegionCardProps {
  region: RegionNode;
  isSelected: boolean;
  onSelect(): void;
}

export function RegionCard({ region, isSelected, onSelect }: RegionCardProps) {
  const health = Math.max(0, 100 - region.corruptionLevel);
  const palette = useMemo(() => getPalette(health), [health]);

  return (
    <motion.button
      onClick={onSelect}
      className={`relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition hover:-translate-y-1 ${
        isSelected ? "border-primary/70 shadow-lg" : "border-border hover:bg-muted/20"
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${palette.start}, ${palette.end})`,
          opacity: isSelected ? 0.15 : 0.08,
        }}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="font-semibold capitalize">{region.name.replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {region.completedMissions}/{region.totalMissions} quests cleansed
          </p>
        </div>
        <Badge className={palette.badgeClass}>{region.corruptionLevel}%</Badge>
      </div>
      <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${health}%` }}
          style={{ backgroundColor: palette.progress }}
        />
      </div>
    </motion.button>
  );
}

function getPalette(health: number) {
  if (health >= 70) {
    return {
      start: "rgba(34,197,94,0.5)",
      end: "rgba(16,185,129,0.4)",
      progress: "#22c55e",
      badgeClass: "bg-emerald-100 text-emerald-700",
    };
  }
  if (health >= 40) {
    return {
      start: "rgba(251,191,36,0.5)",
      end: "rgba(250,204,21,0.4)",
      progress: "#facc15",
      badgeClass: "bg-amber-100 text-amber-700",
    };
  }
  return {
    start: "rgba(248,113,113,0.5)",
    end: "rgba(244,63,94,0.4)",
    progress: "#f87171",
    badgeClass: "bg-rose-100 text-rose-700",
  };
}

