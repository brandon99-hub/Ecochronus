import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { LessonQuizQuestion, LessonQuizResult } from "@/lib/api";

interface LessonQuizProps {
  questions: LessonQuizQuestion[];
  onSubmit?(answers: number[]): Promise<{ score: number; results: LessonQuizResult[] }>;
  isSubmitting?: boolean;
}

export function LessonQuiz({ questions, onSubmit, isSubmitting }: LessonQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<LessonQuizResult[] | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const score = useMemo(() => {
    if (!results) return null;
    const correct = results.filter((result) => result.isCorrect).length;
    return Math.round((correct / questions.length) * 100);
  }, [results, questions.length]);

  const handleSubmit = async () => {
    if (!onSubmit) return;
    setIsBusy(true);
    try {
      const orderedAnswers = questions.map((question) => answers[question.id]);
      const response = await onSubmit(orderedAnswers);
      setResults(response.results);
    } finally {
      setIsBusy(false);
    }
  };

  if (questions.length === 0) {
    return null;
  }

  const loading = isSubmitting || isBusy;
  const allAnswered = questions.every((question) => typeof answers[question.id] === "number");

  const getQuestionResult = (questionId: string) =>
    results?.find((result) => result.questionId === questionId);

  return (
    <Card className="border border-primary/20 bg-card/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-serif">
          Lesson Quiz
          {typeof score === "number" && (
            <Badge variant={score >= 70 ? "default" : "destructive"}>{score}%</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, index) => {
          const selected = answers[question.id];
          const result = getQuestionResult(question.id);
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-3 rounded-2xl border border-border/40 bg-background/70 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Question {index + 1}
                </p>
                {result && (
                  <Badge variant={result.isCorrect ? "default" : "destructive"}>
                    {result.isCorrect ? "Correct" : "Incorrect"}
                  </Badge>
                )}
              </div>
              <p className="font-semibold text-foreground">{question.question}</p>
              <div className="grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const showCorrect = result?.correctAnswer === optionIndex;
                  return (
                    <button
                      key={optionIndex}
                      disabled={Boolean(results)}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
                      }
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        showCorrect
                          ? "border-emerald-400 bg-emerald-500/10 text-emerald-900"
                          : isSelected
                          ? "border-primary/50 bg-primary/10"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {result && result.explanation && (
                <p className="text-sm text-muted-foreground">{result.explanation}</p>
              )}
            </motion.div>
          );
        })}

        <div className="flex flex-wrap items-center gap-4">
          <Button
            className="gap-2"
            disabled={!onSubmit || Boolean(results) || !allAnswered || loading}
            onClick={handleSubmit}
          >
            <CheckCircle2 className="h-4 w-4" />
            Submit Quiz
          </Button>
          {typeof score === "number" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {score >= 70 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Knowledge affirmed!
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-rose-500" />
                  Review the lesson and try again.
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

