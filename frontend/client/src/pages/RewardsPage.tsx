import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api, RewardsResponse, UserStats } from "@/lib/api";
import { Coins, Gift, ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const PAGE_SIZE = 12;

export default function RewardsPage() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLocation("/auth");
    }
  }, [setLocation]);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['/user/stats'],
    queryFn: () => api.getUserStats(),
  });

  const { data: rewardsResponse, isLoading } = useQuery<RewardsResponse>({
    queryKey: ['/rewards', { page, limit: PAGE_SIZE }],
    queryFn: () => api.getRewards(page, PAGE_SIZE),
    keepPreviousData: true,
  });

  const filteredRewards = useMemo(() => {
    if (!rewardsResponse) return [];
    if (typeFilter === "ALL") return rewardsResponse.rewards;
    return rewardsResponse.rewards.filter((reward) => reward.type === typeFilter);
  }, [rewardsResponse, typeFilter]);

  const totalPages = rewardsResponse?.pagination.totalPages ?? 1;
  const availableTypes = useMemo(() => {
    if (!rewardsResponse?.rewards) return [];
    return Array.from(new Set(rewardsResponse.rewards.map((reward) => reward.type).filter(Boolean)));
  }, [rewardsResponse]);

  if (isLoading) {
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
            <ArrowLeft className="h-4 w-4" />
            Back to Missions
          </Button>
          <Badge variant="outline" className="uppercase tracking-wide">Rewards Vault</Badge>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-8 shadow-2xl"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-4">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Eco Karma</p>
                <p className="text-3xl font-serif font-bold">{stats?.totalEcoKarma ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-accent/20 p-4">
                <Gift className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rewards Logged</p>
                <p className="text-3xl font-serif font-bold">
                  {rewardsResponse?.pagination.total ?? 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/20 p-4">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Page</p>
                <p className="text-3xl font-serif font-bold">{page}</p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="rounded-2xl border border-border/70 bg-card/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Filter Rewards</p>
              <h3 className="font-serif text-2xl font-semibold">View by type</h3>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRewards.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3 border-dashed border-border/70 p-10 text-center">
              <CardContent>
                <p className="text-muted-foreground">No rewards match this filter.</p>
              </CardContent>
            </Card>
          )}

          {filteredRewards.map((reward) => (
            <Card key={reward.id} className="border border-primary/20 bg-card/90">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="font-serif text-2xl flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  +{reward.amount}
                </CardTitle>
                <Badge variant="secondary">{reward.type.replace(/_/g, " ")}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Issued At</span>
                  <span>{new Date(reward.issuedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mission Ref</span>
                  <span>{reward.missionProgressId ?? "—"}</span>
                </div>
                {reward.metadata && (
                  <div>
                    <p className="text-xs uppercase tracking-wide">Metadata</p>
                    <pre className="mt-1 rounded-lg bg-muted/40 p-2 text-[11px] leading-tight">
                      {JSON.stringify(reward.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </main>
    </div>
  );
}

