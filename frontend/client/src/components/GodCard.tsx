import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { God } from "@/lib/api";
import { Sparkles } from "lucide-react";

interface GodCardProps {
  god: God;
  isSelected?: boolean;
  disabled?: boolean;
  canChange?: boolean;
  onSelect?: () => void;
}

export function GodCard({ god, isSelected, disabled, canChange, onSelect }: GodCardProps) {
  return (
    <Card
      className={`border-2 transition ${
        isSelected ? "border-primary glow-primary" : "border-border hover:border-primary/50"
      }`}
      style={{ borderColor: isSelected ? god.color : undefined }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-2xl">{god.name}</CardTitle>
          <Badge style={{ backgroundColor: `${god.color}20`, color: god.color }}>
            {god.power}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{god.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full gap-2"
          disabled={disabled || (!canChange && isSelected)}
          onClick={onSelect}
        >
          <Sparkles className="h-4 w-4" />
          {isSelected ? (canChange ? "Switch to this Patron" : "Aligned") : "Pledge Allegiance"}
        </Button>
      </CardContent>
    </Card>
  );
}

