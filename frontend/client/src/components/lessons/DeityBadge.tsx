import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const deityStyles: Record<string, { label: string; gradient: string }> = {
  zeus: { label: "Zeus", gradient: "from-yellow-200/80 via-yellow-500/80 to-amber-600/80" },
  athena: { label: "Athena", gradient: "from-sky-200/80 via-sky-400/80 to-blue-600/80" },
  artemis: { label: "Artemis", gradient: "from-emerald-200/80 via-emerald-400/80 to-emerald-600/80" },
  persephone: { label: "Persephone", gradient: "from-rose-200/80 via-rose-400/80 to-pink-600/80" },
};

export function DeityBadge({ god }: { god?: string | null }) {
  const key = god?.toLowerCase() ?? "universal";
  const style = deityStyles[key] ?? {
    label: god ?? "Universal Wisdom",
    gradient: "from-teal-200/80 via-teal-400/80 to-indigo-500/80",
  };

  return (
    <Badge
      className={cn(
        "bg-gradient-to-r text-xs font-semibold uppercase tracking-wide text-foreground/90 border-none shadow",
        style.gradient
      )}
    >
      {style.label}
    </Badge>
  );
}

