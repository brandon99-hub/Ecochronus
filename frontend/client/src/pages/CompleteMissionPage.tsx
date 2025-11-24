import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api, Mission, UserStats } from "@/lib/api";
import { ArrowLeft, Scroll, Loader2, Sparkles, CheckCircle2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { getMissionIcon } from "@/lib/missions";

export default function CompleteMissionPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLocation('/auth');
    }
  }, [setLocation]);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['/user/stats'],
    queryFn: () => api.getUserStats(),
  });

  const { data: missions, isLoading } = useQuery<Mission[]>({
    queryKey: ['/missions'],
    queryFn: () => api.getMissions(),
  });

  const mission = missions?.find((m) => m.id === id);

  const completeMissionMutation = useMutation({
    mutationFn: () => {
      const parsedQuantity = quantity ? parseInt(quantity, 10) : undefined;
      return api.completeMission(id!, {
        description,
        category: category || undefined,
        quantity: parsedQuantity && !isNaN(parsedQuantity) ? parsedQuantity : undefined,
      });
    },
    onSuccess: () => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['/missions'] });
      queryClient.invalidateQueries({ queryKey: ['/user/stats'] });
      
      setTimeout(() => {
        toast({
          title: "Quest complete!",
          description: `You earned ${mission?.points || 0} points! Earth is healing!`,
        });
        setLocation('/dashboard');
      }, 2000);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to complete mission",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please describe what you did",
      });
      return;
    }
    completeMissionMutation.mutate();
  };

  const handleBack = () => {
    setLocation('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar stats={stats} />
        <LoadingSpinner />
      </div>
    );
  }

  if (!mission || mission.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar stats={stats} />
        <div className="container mx-auto px-6 py-12 text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">
            {mission?.status === 'COMPLETED' ? 'Quest Already Completed' : 'Quest Not Active'}
          </h2>
          <Button onClick={handleBack} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-accent/50 shadow-2xl glow-accent overflow-visible">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-accent/20 p-6">
                  <CheckCircle2 className="h-16 w-16 text-accent" />
                </div>
              </div>
              <div>
                <h2 className="font-serif text-3xl font-bold gradient-text mb-2">
                  Quest Complete!
                </h2>
                <p className="text-xl text-muted-foreground">
                  +{mission.points} Points Earned
                </p>
              </div>
              <p className="text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const missionIcon = getMissionIcon(mission.title);

  return (
    <div className="min-h-screen bg-background">
      <Navbar stats={stats} />

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-4 py-2">
            <Scroll className="h-4 w-4 text-primary" />
            <p className="text-xs uppercase tracking-wide text-primary">Quest Report</p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-4">
                <img
                  src={missionIcon}
                  alt={mission.title}
                  className="h-16 w-16 rounded-xl border border-primary/30 object-contain"
                />
                <div>
                  <h1 className="font-serif text-3xl font-bold gradient-text" data-testid="text-quest-name">
                    {mission.title}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Submit evidence to finalize this quest.
                  </p>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pb-8">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Field Notes *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your heroic actions in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[160px] resize-none"
                    required
                    data-testid="input-description"
                  />
                  <p className="text-sm text-muted-foreground">
                    Include measurements, people involved, and any obstacles you overcame.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-base font-semibold">
                      Activity Type
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category" data-testid="select-category">
                        <SelectValue placeholder="Select activity type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cleanup">🌊 Cleanup</SelectItem>
                        <SelectItem value="Tree Planting">🌳 Tree Planting</SelectItem>
                        <SelectItem value="Recycling">♻️ Recycling</SelectItem>
                        <SelectItem value="Energy Saving">⚡ Energy Saving</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-base font-semibold">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="How many? (optional)"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="0"
                      data-testid="input-quantity"
                    />
                    <p className="text-sm text-muted-foreground">
                      Number of bags collected, trees planted, etc.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-accent/10 border border-accent/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <p className="font-semibold text-accent">Reward</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete this quest to earn <span className="font-mono font-bold text-accent">{mission.points}</span> points and impress your patron deity.
                  </p>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  type="submit"
                  className="w-full glow-primary"
                  size="lg"
                  disabled={completeMissionMutation.isPending}
                  data-testid="button-submit"
                >
                  {completeMissionMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Report...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-5 w-5" /> Submit Quest Report</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="border border-accent/30 bg-card/80">
              <CardHeader className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-accent">Mission Intel</p>
                <h3 className="font-serif text-2xl font-semibold">Status Overview</h3>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Quest Status</span>
                  <strong>{mission.status}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reward</span>
                  <strong>{mission.points} pts</strong>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-primary">Reminder</p>
                  <p className="text-sm text-primary">
                    You can always return to this screen if you need to edit your report before submission.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/20 bg-card/80">
              <CardHeader className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-serif text-2xl font-semibold">Order Guidelines</h3>
                  <p className="text-sm text-muted-foreground">
                    Boost your credibility with these tips
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Mention any local partners or teammates who helped.</p>
                <p>• Share measurable impact (weight, volume, headcount).</p>
                <p>• Add a quick reflection: what did you learn, and what’s next?</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
