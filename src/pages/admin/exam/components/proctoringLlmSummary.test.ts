import { describe, expect, it } from 'vitest'

import {
  buildLlmNarrativeSummary,
  parseLlmSummarySections,
} from './proctoringLlmSummary'

describe('proctoringLlmSummary', () => {
  it('builds a narrative summary from structured evidence for admin review', () => {
    const narrative = buildLlmNarrativeSummary({
      summaryText:
        'Review these signals: heartbeat x30, camera error x1, focus lost x1. Timeline highlights: 2026-06-24 03:49 camera started; 2026-06-24 03:52 focus lost. Missing data: no camera continuity events.',
      riskFacts: [
        {
          type: 'heartbeat',
          count: 30,
          totalDurationMs: 0,
          evidenceEventIds: ['event-1'],
        },
        {
          type: 'camera_error',
          count: 1,
          totalDurationMs: 0,
          evidenceEventIds: ['event-2'],
        },
        {
          type: 'focus_lost',
          count: 1,
          totalDurationMs: 0,
          evidenceEventIds: ['event-3'],
        },
      ],
      citations: [
        { eventId: 'event-1', reason: 'summary evidence' },
        { eventId: 'event-2', reason: 'summary evidence' },
      ],
      missingDataNotes: ['no camera continuity events'],
      timeline: [
        {
          eventId: 'event-1',
          eventName: 'camera_started',
          capturedAt: '2026-06-24T03:49:00.000Z',
        },
        {
          eventId: 'event-2',
          eventName: 'focus_lost',
          capturedAt: '2026-06-24T03:52:00.000Z',
        },
      ],
    })

    expect(narrative).toContain(
      'This session recorded 30 heartbeat events, 1 camera error event, and 1 focus lost event.'
    )
    expect(narrative).toContain(
      'Key moments included 2026-06-24 03:49 camera started and 2026-06-24 03:52 focus lost.'
    )
    expect(narrative).toContain(
      'Some evidence was unavailable: no camera continuity events.'
    )
    expect(narrative).toContain(
      'Use the evidence details below to confirm whether follow-up is needed.'
    )
  })

  it('keeps evidence sections separate from the narrative text', () => {
    const sections = parseLlmSummarySections(
      'Review these signals: focus lost x1; visibility hidden x1. Timeline highlights: 2026-06-24 03:52 focus lost. Missing data: no camera continuity events.'
    )

    expect(sections).toEqual([
      {
        key: 'overview',
        title: 'Overview',
        lines: ['focus lost x1', 'visibility hidden x1.'],
      },
      {
        key: 'timeline',
        title: 'Timeline highlights',
        lines: ['2026-06-24 03:52 focus lost.'],
      },
      {
        key: 'missing',
        title: 'Missing data',
        lines: ['no camera continuity events.'],
      },
    ])
  })
})
