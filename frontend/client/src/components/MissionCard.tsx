import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, CheckCircle2, Sword, Loader2 } from "lucide-react";
import { Mission } from "@/lib/api";
import { getMissionIcon } from "@/lib/missions";

interface MissionCardProps {
  mission: Mission;
  onStart?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function MissionCard({ mission, onStart, onComplete, isLoading }: MissionCardProps) {
  const icon = getMissionIcon(mission.title);
  const isLocked = mission.status === 'AVAILABLE' && mission.isUnlocked === false;
  
  const statusConfig = {
    AVAILABLE: {
      badge: <Badge className="bg-primary/20 text-primary border-primary/30" data-testid={`badge-status-${mission.id}`}>Available</Badge>,
      button: (
        <Button
          onClick={onStart}
          disabled={isLoading || isLocked}
          className="w-full glow-primary"
          data-testid={`button-start-${mission.id}`}
        >
          {isLocked ? (
            <>Locked</>
          ) : isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</>
          ) : (
            <><Sword className="mr-2 h-4 w-4" /> Embark on Quest</>
          )}
        </Button>
      ),
    },
    ACTIVE: {
      badge: <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 glow-blue" data-testid={`badge-status-${mission.id}`}>In Progress</Badge>,
      button: (
        <Button
          onClick={onComplete}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 glow-blue"
          data-testid={`button-complete-${mission.id}`}
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" /> Complete Quest</>
          )}
        </Button>
      ),
    },
    COMPLETED: {
      badge: <Badge className="bg-accent/20 text-accent border-accent/30 glow-accent" data-testid={`badge-status-${mission.id}`}>Completed</Badge>,
      button: (
        <Button
          disabled
          className="w-full opacity-60"
          data-testid={`button-completed-${mission.id}`}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> Quest Complete
        </Button>
      ),
    },
  };

  const config = statusConfig[mission.status];

  return (
    <Card
      className="group overflow-visible transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in border-card-border"
      data-testid={`card-mission-${mission.id}`}
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 flex-shrink-0">
              <img
                src={icon}
                alt={mission.title}
                className="h-full w-full object-contain rounded-lg"
              />
              <div className="absolute inset-0 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold text-card-foreground leading-tight" data-testid={`text-title-${mission.id}`}>
                {mission.title}
              </h3>
            </div>
          </div>
          {config.badge}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-description-${mission.id}`}>
          {mission.description}
        </p>

        <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 border border-accent/20 w-fit">
          <Coins className="h-4 w-4 text-accent" />
          <span className="font-mono text-sm font-bold text-accent" data-testid={`text-points-${mission.id}`}>
            {mission.points} Points
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <div className="w-full space-y-2">
          {config.button}
          {isLocked && (
            <p className="text-center text-xs text-muted-foreground">
              Complete prerequisite quests to unlock.
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
