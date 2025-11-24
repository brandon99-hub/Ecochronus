import { motion } from "framer-motion";

const deityArt: Record<string, { glow: string; pattern: string }> = {
  zeus: {
    glow: "rgba(250, 204, 21, 0.35)",
    pattern:
      "radial-gradient(circle at 20% 20%, rgba(250,250,250,0.2), transparent 45%), linear-gradient(120deg, rgba(250,204,21,0.2), transparent)",
  },
  athena: {
    glow: "rgba(96, 165, 250, 0.3)",
    pattern:
      "radial-gradient(circle at 70% 30%, rgba(191,219,254,0.3), transparent 50%), linear-gradient(140deg, rgba(59,130,246,0.25), transparent)",
  },
  artemis: {
    glow: "rgba(52, 211, 153, 0.3)",
    pattern:
      "radial-gradient(circle at 80% 20%, rgba(209,250,229,0.3), transparent 45%), linear-gradient(110deg, rgba(16,185,129,0.25), transparent)",
  },
  persephone: {
    glow: "rgba(244,114,182,0.35)",
    pattern:
      "radial-gradient(circle at 30% 60%, rgba(251,207,232,0.35), transparent 45%), linear-gradient(130deg, rgba(244,114,182,0.25), transparent)",
  },
  universal: {
    glow: "rgba(94, 234, 212, 0.35)",
    pattern:
      "radial-gradient(circle at 50% 50%, rgba(209,250,229,0.3), transparent 50%), linear-gradient(120deg, rgba(45,212,191,0.25), transparent)",
  },
};

export function DeityHero({ god }: { god?: string | null }) {
  const key = god?.toLowerCase() ?? "universal";
  const art = deityArt[key] ?? deityArt.universal;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: `${art.pattern}`,
        boxShadow: `0 0 120px 40px ${art.glow} inset`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.9 }}
      transition={{ duration: 0.6 }}
    />
  );
}

