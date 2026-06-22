import { describe, expect, it } from 'vitest'
import {
  hasRenderableLessonProgress,
  hasRenderableTopicProgress,
} from '../homeContinuePractice'

describe('home continue practice guards', () => {
  it('rejects topic progress when there is no solved progress', () => {
    expect(
      hasRenderableTopicProgress({
        topicId: 'topic-1',
        topicName: 'Algorithms',
        totalProblems: 10,
        solvedProblems: 0,
        completionPercentage: 0,
        lastSubmittedAt: null,
      })
    ).toBe(false)
  })

  it('rejects lesson progress when total lessons is zero', () => {
    expect(
      hasRenderableLessonProgress({
        lessonId: 'lesson-1',
        lessonTitle: 'Intro',
        topicId: 'topic-1',
        topicName: 'Algorithms',
        totalLessons: 0,
        completedLessons: 1,
        completionPercentage: 0,
        lastCompletedAt: null,
      })
    ).toBe(false)
  })

  it('accepts valid recent topic and lesson progress', () => {
    expect(
      hasRenderableTopicProgress({
        topicId: 'topic-1',
        topicName: 'Algorithms',
        totalProblems: 10,
        solvedProblems: 2,
        completionPercentage: 20,
        lastSubmittedAt: null,
      })
    ).toBe(true)

    expect(
      hasRenderableLessonProgress({
        lessonId: 'lesson-1',
        lessonTitle: 'Intro',
        topicId: 'topic-1',
        topicName: 'Algorithms',
        totalLessons: 5,
        completedLessons: 1,
        completionPercentage: 20,
        lastCompletedAt: null,
      })
    ).toBe(true)
  })
})
