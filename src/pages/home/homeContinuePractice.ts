import type {
  LessonProgress,
  TopicProgress,
} from '@/services/api/learningprocess.service'

export function hasRenderableTopicProgress(
  progress: TopicProgress | null | undefined
): progress is TopicProgress {
  return Boolean(
    progress &&
    progress.topicId &&
    progress.topicName &&
    progress.totalProblems > 0 &&
    progress.solvedProblems > 0
  )
}

export function hasRenderableLessonProgress(
  progress: LessonProgress | null | undefined
): progress is LessonProgress {
  return Boolean(
    progress &&
    progress.lessonId &&
    progress.topicId &&
    progress.topicName &&
    progress.totalLessons > 0 &&
    progress.completedLessons > 0
  )
}
