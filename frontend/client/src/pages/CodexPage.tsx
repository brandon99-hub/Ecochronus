import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api, God, Lesson, LessonDetail, LearningProgress, SelectedGod, UserStats } from "@/lib/api";
import { Sparkles, Book, CheckCircle2, Scroll, Flame, Hourglass, ArrowLeft, Zap, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { GodCard } from "@/components/GodCard";

export default function CodexPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const { data: gods } = useQuery<God[]>({
    queryKey: ['/gods/list'],
    queryFn: () => api.listGods(),
  });

  const { data: selectedGod } = useQuery<SelectedGod | null>({
    queryKey: ['/gods/selected'],
    queryFn: () => api.getSelectedGod(),
  });

  const [isSwitchingPatron, setIsSwitchingPatron] = useState(false);

  const selectGodMutation = useMutation({
    mutationFn: ({ godId, force }: { godId: string; force: boolean }) => api.selectGod(godId, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/gods/selected'] });
      setIsSwitchingPatron(false);
    },
  });


  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLocation("/auth");
    }
  }, [setLocation]);

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['/user/stats'],
    queryFn: () => api.getUserStats(),
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery<Lesson[]>({
    queryKey: ['/learning/lessons'],
    queryFn: () => api.getLessons(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: progress } = useQuery<LearningProgress>({
    queryKey: ['/learning/progress'],
    queryFn: () => api.getLearningProgress(),
  });

  useEffect(() => {
    if (lessons && lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(lessons[0].id);
    }
  }, [lessons, selectedLessonId]);

  const { data: lessonDetail, isLoading: lessonLoading } = useQuery<LessonDetail>({
    queryKey: ['/learning/lessons', selectedLessonId],
    queryFn: () => api.getLesson(selectedLessonId!),
    enabled: Boolean(selectedLessonId),
  });

  const completeLessonMutation = useMutation({
    mutationFn: () => api.completeLesson(selectedLessonId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/learning/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/learning/progress'] });
    },
  });

  const renderLessonContent = () => {
    if (!lessonDetail?.content) {
      return <p className="text-sm text-muted-foreground">No content available.</p>;
    }

    if (typeof lessonDetail.content === "string") {
      return lessonDetail.content.split("\n").map((paragraph, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          {paragraph}
        </p>
      ));
    }

    const slides = Array.isArray((lessonDetail.content as { slides?: unknown[] }).slides)
      ? (lessonDetail.content as { slides?: Array<Record<string, unknown>> }).slides
      : null;

    if (slides && slides.length > 0) {
      return slides.map((slide, index) => (
        <div key={index} className="space-y-1 rounded-lg border border-border p-3">
          {"title" in slide && typeof slide.title === "string" && (
            <p className="font-semibold text-primary">{slide.title}</p>
          )}
          {"body" in slide && typeof slide.body === "string" && (
            <p className="text-sm text-muted-foreground">{slide.body}</p>
          )}
        </div>
      ));
    }

    return (
      <pre className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground overflow-x-auto">
        {JSON.stringify(lessonDetail.content, null, 2)}
      </pre>
    );
  };

  if (lessonsLoading) {
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
          <Badge variant="outline" className="uppercase tracking-wide">Lore Codex</Badge>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-background p-8 shadow-2xl"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/20 p-4">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Lessons Complete</p>
                <p className="text-3xl font-serif font-bold">
                  {progress?.completedLessons ?? 0}/{progress?.totalLessons ?? lessons?.length ?? 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-accent/20 p-4">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Codex Mastery</p>
                <p className="text-3xl font-serif font-bold">{progress?.completionPercent ?? 0}%</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/20 p-4">
                <Hourglass className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Quiz Score</p>
                <p className="text-3xl font-serif font-bold">{progress?.averageQuizScore ?? 0}%</p>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="border border-primary/20 bg-card/80">
            <CardHeader className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Pantheon Alignment
                </p>
                <CardTitle className="font-serif text-3xl">
                  Choose Your Patron
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {gods ? (
                <div className="grid gap-4">
                  {selectedGod && (
                    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                      <span className="text-sm text-muted-foreground">
                        Currently aligned with <strong>{selectedGod.name}</strong>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSwitchingPatron((prev) => !prev)}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {isSwitchingPatron ? "Cancel" : "Change Patron"}
                      </Button>
                    </div>
                  )}
                  {gods.map((god) => (
                    <GodCard
                      key={god.id}
                      god={god}
                      isSelected={selectedGod?.id === god.id}
                      disabled={selectGodMutation.isPending}
                      canChange={!selectedGod || isSwitchingPatron}
                      onSelect={() =>
                        selectGodMutation.mutate({ godId: god.id, force: Boolean(selectedGod) })
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading pantheon...</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <Scroll className="h-5 w-5 text-primary" />
                Lesson Index
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-auto pr-2">
              {lessons?.map((lesson) => {
                const isSelected = selectedLessonId === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                      isSelected ? "border-primary/50 bg-primary/10" : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Chapter {lesson.order}
                        </p>
                        <p className="font-semibold">{lesson.title}</p>
                      </div>
                      {lesson.completed ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">New</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {lesson.description}
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border border-primary/20 bg-card/80">
            <CardHeader className="flex items-center gap-3">
              <Flame className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Lesson Detail
                </p>
                <CardTitle className="font-serif text-3xl">
                  {lessonDetail?.title ?? "Select a lesson"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lessonLoading || !lessonDetail ? (
                <p className="text-muted-foreground text-sm">Choose a lesson from the list.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{lessonDetail.description}</p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Patron Deity</p>
                      <p className="font-semibold">{lessonDetail.god ?? "Universal Wisdom"}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Chapter</p>
                      <p className="font-semibold">#{lessonDetail.order}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                      <p className="font-semibold">
                        {lessonDetail.progress?.completed ? "Completed" : "In progress"}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
                    {renderLessonContent()}
                  </div>
                </>
              )}
            </CardContent>
            {lessonDetail && (
              <CardContent className="border-t border-border/60 py-4 flex flex-wrap items-center gap-4">
                <Badge variant="secondary">
                  Attempts: {lessonDetail.progress?.quizAttempts ?? 0}
                </Badge>
                <Badge variant="outline">
                  Score: {lessonDetail.progress?.quizScore ?? "—"}%
                </Badge>
                <Button
                  className="ml-auto gap-2"
                  disabled={completeLessonMutation.isPending || lessonDetail.progress?.completed}
                  onClick={() => completeLessonMutation.mutate()}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {lessonDetail.progress?.completed ? "Already completed" : "Mark as completed"}
                </Button>
              </CardContent>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

