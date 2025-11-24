import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, LessonQuizQuestion, LessonQuizResult } from "@/lib/api";

interface SubmitPayload {
  score: number;
  passed: boolean;
  results: LessonQuizResult[];
}

export function useLessonQuiz(lessonId: string | null) {
  const queryClient = useQueryClient();

  const quizQuery = useQuery({
    queryKey: ["lesson-quiz", lessonId],
    queryFn: () => api.getLessonQuiz(lessonId!),
    enabled: Boolean(lessonId),
  });

  const submitMutation = useMutation({
    mutationFn: (answers: number[]) => api.submitLessonQuiz(lessonId!, answers),
    onSuccess: () => {
      if (!lessonId) return;
      queryClient.invalidateQueries({ queryKey: ["/learning/lessons", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["/learning/progress"] });
    },
  });

  return {
    questions: quizQuery.data?.questions ?? ([] as LessonQuizQuestion[]),
    isLoading: quizQuery.isLoading,
    isSubmitting: submitMutation.isPending,
    submitQuiz: submitMutation.mutateAsync,
    lastResult: submitMutation.data as SubmitPayload | undefined,
  };
}

