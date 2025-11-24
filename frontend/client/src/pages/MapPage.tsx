import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api, Mission, UserStats } from "@/lib/api";
import { Sparkles, Map as MapIcon, Target, Shield, Compass, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { RegionCard } from "@/components/map/RegionCard";
import { RegionNode } from "@/types/map";

export default function MapPage() {
  const [, setLocation] = useLocation();
  const [selectedRegion, setSelectedRegion] = useState<RegionNode | null>(null);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLocation("/auth");
    }
  }, [setLocation]);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['/user/stats'],
    queryFn: () => api.getUserStats(),
  });

  const { data: missions, isLoading: missionsLoading } = useQuery<Mission[]>({
    queryKey: ['/missions'],
    queryFn: () => api.getMissions(),
  });

  const regions = useMemo<RegionNode[]>(() => {
    // Synthetic region data derived from missions. In a future iteration, replace with /map endpoint.
    if (!missions) return [];
    const grouped = new Map<string, RegionNode>();
    missions.forEach((mission) => {
      const regionName = mission.region ?? "Unknown Region";
      if (!grouped.has(regionName)) {
        grouped.set(regionName, {
          id: regionName.toLowerCase().replace(/\s+/g, "-"),
          name: regionName,
          corruptionLevel: 100,
          missions: [],
          status: "UNSTABLE",
          completedMissions: 0,
          totalMissions: 0,
        });
      }
      const region = grouped.get(regionName)!;
      region.missions.push(mission.id);
      region.totalMissions += 1;
      if (mission.status === "COMPLETED") {
        region.completedMissions += 1;
      }
      const completionRatio =
        region.totalMissions > 0 ? region.completedMissions / region.totalMissions : 0;
      region.corruptionLevel = Math.round(100 - completionRatio * 100);
      region.status =
        region.corruptionLevel <= 30
          ? "SAFE"
          : region.corruptionLevel <= 60
          ? "UNSTABLE"
          : "CRITICAL";
    });
    return Array.from(grouped.values());
  }, [missions]);

  useEffect(() => {
    if (!selectedRegion && regions.length > 0) {
      setSelectedRegion(regions[0]);
    }
  }, [regions, selectedRegion]);

  if (missionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar stats={stats} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar stats={stats} />

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => setLocation('/dashboard')}>
            <MapIcon className="h-4 w-4" /> Mission Board
          </Button>
          <Badge variant="outline" className="uppercase tracking-wide">World Map</Badge>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-8 shadow-2xl"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Avatar Level</p>
                <p className="text-3xl font-serif font-bold">{stats?.level ?? 1}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-accent/20 p-4">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Quests</p>
                <p className="text-3xl font-serif font-bold">
                  {missions?.filter((mission) => mission.status === "ACTIVE").length ?? 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/20 p-4">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Regions</p>
                <p className="text-3xl font-serif font-bold">{regions.length}</p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-primary/30 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <Compass className="h-6 w-6 text-primary" />
                Regions of EcoChronos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {regions.map((region) => (
                <RegionCard
                  key={region.id}
                  region={region}
                  isSelected={selectedRegion?.id === region.id}
                  onSelect={() => setSelectedRegion(region)}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="border border-accent/30 bg-card/80">
            {selectedRegion ? (
              <>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-accent/20 p-3">
                      <AlertTriangle className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Region Status
                      </p>
                      <CardTitle className="font-serif text-3xl">
                        {selectedRegion.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Corruption Level</span>
                    <strong>{selectedRegion.corruptionLevel}%</strong>
                  </div>
                  <div className="rounded-xl border border-border px-4 py-3 bg-muted/20">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Mission Briefings
                    </p>
                    <div className="mt-3 space-y-2">
                      {selectedRegion.missions.slice(0, 4).map((missionId) => {
                        const mission = missions?.find((m) => m.id === missionId);
                        if (!mission) return null;
                        return (
                          <Button
                            key={mission.id}
                            variant="ghost"
                            className="w-full justify-between text-left"
                            onClick={() => setLocation(`/mission/${mission.id}`)}
                          >
                            <span>{mission.title}</span>
                            <Badge variant="outline">{mission.status}</Badge>
                          </Button>
                        );
                      })}
                      {selectedRegion.missions.length > 4 && (
                        <p className="text-xs text-muted-foreground">
                          +{selectedRegion.missions.length - 4} additional quests
                        </p>
                      )}
                    </div>
                  </div>
                  <p>
                    Cleansing this region will unlock unique lore entries and rare rewards.
                    Focus on quests marked CRITICAL to reduce corruption faster.
                  </p>
                </CardContent>
              </>
            ) : (
              <CardContent className="text-center text-muted-foreground">
                Select a region to view quest chains.
              </CardContent>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

