import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { Mission } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Leaf, Sparkles, XCircle } from "lucide-react";

interface MissionCompletionModalProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  mission: Mission;
  summary: {
    coins: number;
    xp: number;
    ecoKarma: number;
  };
  onViewReport(): void;
}

export function MissionCompletionModal({
  open,
  onOpenChange,
  mission,
  summary,
  onViewReport,
}: MissionCompletionModalProps) {
  useEffect(() => {
    if (open) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-primary/30 bg-gradient-to-b from-background via-background to-primary/10">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 font-serif text-3xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Region Cleansed
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {mission.title} is complete. The gods acknowledge your effort.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/30 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mission Reward</p>
            <h2 className="font-serif text-2xl">{mission.title}</h2>
            <Badge variant="outline" className="mt-2">
              {mission.category ?? "Standard"} • {mission.region ?? "Global"}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <RewardCard icon={Coins} label="Coins" value={`+${summary.coins}`} accent="text-amber-400" />
            <RewardCard icon={Sparkles} label="XP" value={`+${summary.xp}`} accent="text-primary" />
            <RewardCard
              icon={Leaf}
              label="Eco Karma"
              value={`+${summary.ecoKarma}`}
              accent="text-emerald-400"
            />
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">
            Tip: View the quest report to submit proof or unlock lore entries linked to this region.
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={onViewReport}>
              <Sparkles className="h-4 w-4" />
              View Report
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => onOpenChange(false)}>
              <XCircle className="h-4 w-4" />
              Keep Exploring
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const RewardCard = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  accent: string;
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/70 p-4">
    <div className="rounded-full bg-primary/10 p-2">
      <Icon className={`h-5 w-5 ${accent}`} />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  </div>
);

