import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { DeityBadge } from "./DeityBadge";
import { LessonDetail } from "@/lib/api";
import { DeityHero } from "./DeityHero";
import { LessonQuiz } from "./LessonQuiz";
import { useLessonQuiz } from "@/hooks/useLessonQuiz";
import { useToast } from "@/hooks/use-toast";

interface LessonStageProps {
  lesson: LessonDetail;
  isCompleting: boolean;
  onComplete(): void;
}

export function LessonStage({ lesson, isCompleting, onComplete }: LessonStageProps) {
  const slides = extractSlides(lesson);
  const [activeSlide, setActiveSlide] = useState(0);
  const progress = slides.length > 0 ? Math.round(((activeSlide + 1) / slides.length) * 100) : 100;

  const canAdvance = activeSlide < slides.length - 1;
  const canRetreat = activeSlide > 0;
  const { toast } = useToast();
  const {
    questions,
    isLoading: quizLoading,
    isSubmitting: quizSubmitting,
    submitQuiz,
  } = useLessonQuiz(lesson.id);

  const handleQuizSubmit = async (answers: number[]) => {
    try {
      const result = await submitQuiz(answers);
      toast({
        title: result.passed ? "Quiz passed!" : "Quiz recorded",
        description: `Score: ${result.score}%`,
      });
      return { score: result.score, results: result.results };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Quiz submission failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
      throw error;
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-background via-background to-primary/5 shadow-2xl">
      <DeityHero god={lesson.god} />

      <div className="relative z-10 p-8 space-y-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-wide text-muted-foreground">
            <DeityBadge god={lesson.god} />
            <Badge variant="secondary">Chapter #{lesson.order}</Badge>
            <Badge variant={lesson.progress?.completed ? "default" : "secondary"}>
              {lesson.progress?.completed ? "Completed" : "In progress"}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Lesson Detail</p>
            <h1 className="mt-2 font-serif text-4xl md:text-5xl text-foreground">{lesson.title}</h1>
            <p className="mt-3 max-w-3xl text-base text-muted-foreground">{lesson.description}</p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoTile label="Attempts" value={lesson.progress?.quizAttempts ?? 0} />
          <InfoTile label="Score" value={`${lesson.progress?.quizScore ?? "—"}%`} />
          <InfoTile label="Slides" value={slides.length || "—"} />
        </div>

        <Separator />

        <article className="space-y-4">
          {slides.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Slide {activeSlide + 1} of {slides.length}</span>
                  <span className="text-primary">{progress}%</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" disabled={!canRetreat} onClick={() => setActiveSlide((index) => Math.max(0, index - 1))}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" disabled={!canAdvance} onClick={() => setActiveSlide((index) => Math.min(slides.length - 1, index + 1))}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border border-border/50 bg-background/70 p-6 space-y-3"
              >
                {slides[activeSlide].title && (
                  <h2 className="font-serif text-2xl text-primary">{slides[activeSlide].title}</h2>
                )}
                {slides[activeSlide].body && (
                  <p className="text-base leading-relaxed text-muted-foreground">{slides[activeSlide].body}</p>
                )}
              </motion.div>
            </>
          ) : (
            <RichTextContent content={lesson} />
          )}
        </article>

        <footer className="space-y-4 border-t border-border/40 pt-6">
          {quizLoading ? (
            <div className="rounded-2xl border border-border/40 bg-background/70 p-4 text-sm text-muted-foreground">
              Loading quiz...
            </div>
          ) : (
            questions.length > 0 && (
              <LessonQuiz
                questions={questions}
                onSubmit={handleQuizSubmit}
                isSubmitting={quizSubmitting}
              />
            )
          )}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>
                {lesson.progress?.completed
                  ? "Knowledge recorded in the Codex."
                  : "Absorb every slide, then mark the lesson complete."}
              </span>
            </div>
            <Button
              className="ml-auto gap-2"
              disabled={lesson.progress?.completed || isCompleting}
              onClick={onComplete}
            >
              <CheckCircle2 className="h-4 w-4" />
              {lesson.progress?.completed ? "Already completed" : "Mark as completed"}
            </Button>
          </div>
        </footer>
      </div>
    </section>
  );
}

const InfoTile = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-border/40 bg-background/70 p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-2xl font-semibold text-foreground">{value}</p>
  </div>
);

function RichTextContent({ content }: { content: LessonDetail }) {
  const paragraphs = useMemo(() => {
    if (typeof content.content === "string") {
      return content.content.split("\n").filter(Boolean);
    }
    return null;
  }, [content]);

  if (!paragraphs || paragraphs.length === 0) {
    return <p className="text-sm text-muted-foreground">No content available.</p>;
  }

  return (
    <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

function extractSlides(lesson: LessonDetail) {
  if (typeof lesson.content === "object" && lesson.content && "slides" in lesson.content) {
    const slides = lesson.content.slides;
    if (Array.isArray(slides)) {
      return slides.map((slide) => ({
        title:
          typeof slide === "object" && slide && "title" in slide
            ? (slide.title as string)
            : undefined,
        body:
          typeof slide === "object" && slide && "body" in slide
            ? (slide.body as string)
            : typeof slide === "object" && slide && "content" in slide
            ? (slide.content as string)
            : undefined,
      }));
    }
  }
  return [];
}

