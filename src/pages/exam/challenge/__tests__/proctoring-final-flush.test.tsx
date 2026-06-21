import { describe, expect, it, vi } from 'vitest'

import { submitExamWithFinalProctoringFlush } from '@/pages/exam/challenge/proctoringSubmit'

describe('submitExamWithFinalProctoringFlush', () => {
  it('flushes final telemetry before submitting and forwards the receipt', async () => {
    const finalFlush = vi.fn().mockResolvedValue({
      submitAttemptId: 'attempt-1',
      finalFlushReceiptId: 'receipt-1',
    })
    const submitExam = vi.fn().mockResolvedValue({
      participationId: 'participation-1',
      submittedAt: '2026-06-12T10:00:00.000Z',
      scoreStatus: 'pending',
    })

    await submitExamWithFinalProctoringFlush({
      examSlug: 'spring-midterm',
      participationId: 'participation-1',
      finalFlush,
      submitExam,
      submitAttemptIdFactory: () => 'attempt-1',
    })

    expect(finalFlush).toHaveBeenCalledWith('attempt-1')
    expect(submitExam).toHaveBeenCalledWith('spring-midterm', {
      submitAttemptId: 'attempt-1',
      finalFlushReceiptId: 'receipt-1',
    })
    expect(finalFlush.mock.invocationCallOrder[0]).toBeLessThan(
      submitExam.mock.invocationCallOrder[0]
    )
  })
})
