import { Coins, LogOut, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { useLocation } from "wouter";
import { SelectedGod, UserStats } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  stats?: UserStats;
}

export function Navbar({ stats }: NavbarProps) {
  const [, setLocation] = useLocation();
  const { data: selectedGod } = useQuery({
    queryKey: ['/gods/selected'],
    queryFn: () => api.getSelectedGod(),
  });

  const handleLogout = () => {
    api.clearToken();
    setLocation('/auth');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary animate-glow-pulse" />
            <h1 className="font-serif text-2xl font-bold gradient-text">
              EcoChronos
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {selectedGod && (
              <Button
                variant="ghost"
                className="hidden lg:flex gap-3 border"
                onClick={() => setLocation('/profile')}
                style={{
                  borderColor: selectedGod.color,
                  color: selectedGod.color,
                }}
              >
                <span className="text-xs uppercase tracking-wide">Patron</span>
                <span className="font-semibold">{selectedGod.name}</span>
              </Button>
            )}

            {stats && (
              <div className="hidden md:flex items-center gap-4">
                <div className="min-w-[160px]">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">XP Progress</p>
                  <div className="flex items-center gap-2">
                    <Progress value={stats?.xpProgress.progressPercentage ?? 0} className="h-2 bg-border" />
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.round(stats?.xpProgress.progressPercentage ?? 0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-accent/20 px-4 py-2 border border-accent/30 glow-accent">
                  <Coins className="h-5 w-5 text-accent" />
                  <span className="font-mono text-lg font-bold text-accent" data-testid="text-level">
                    Lv. {stats?.level ?? 1}
                  </span>
                </div>
                <div className="hidden xl:flex items-center gap-2 rounded-lg bg-primary/15 px-4 py-2 border border-primary/30">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Eco Karma</p>
                    <p className="text-sm font-semibold text-primary">
                      {stats?.totalEcoKarma ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!stats && (
              <div className="hidden md:flex items-center gap-4">
                <div className="min-w-[160px]">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">XP Progress</p>
                  <div className="flex items-center gap-2">
                    <Progress value={0} className="h-2 bg-border" />
                    <span className="text-xs font-mono text-muted-foreground">0%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-accent/20 px-4 py-2 border border-accent/30 glow-accent">
                  <Coins className="h-5 w-5 text-accent" />
                  <span className="font-mono text-lg font-bold text-accent" data-testid="text-level">
                    Lv. 1
                  </span>
                </div>
                <div className="hidden xl:flex items-center gap-2 rounded-lg bg-primary/15 px-4 py-2 border border-primary/30">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Eco Karma</p>
                    <p className="text-sm font-semibold text-primary">0</p>
                  </div>
                </div>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full border border-primary/30 p-0">
                  <Avatar className="h-9 w-9 border border-primary/40">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      A
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Traveler Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setLocation('/profile')}>Profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation('/inventory')}>Inventory & Badges</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation('/rewards')}>Rewards Vault</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation('/map')}>World Map</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLocation('/codex')}>Codex</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
