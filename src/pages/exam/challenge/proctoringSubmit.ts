import type { ProctoringSubmitPayload } from '@/types/exam.types'

type FinalFlushResult = {
  submitAttemptId: string
  finalFlushReceiptId?: string
}

type SubmitExamWithFinalProctoringFlushOptions<T> = {
  examSlug: string
  participationId: string
  finalFlush: (submitAttemptId: string) => Promise<FinalFlushResult>
  submitExam: (examSlug: string, payload: ProctoringSubmitPayload) => Promise<T>
  submitAttemptIdFactory?: () => string
}

function defaultSubmitAttemptId(): string {
  const uuid =
    globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `submit-${uuid}`
}

export async function submitExamWithFinalProctoringFlush<T>({
  examSlug,
  finalFlush,
  submitExam,
  submitAttemptIdFactory = defaultSubmitAttemptId,
}: SubmitExamWithFinalProctoringFlushOptions<T>): Promise<T> {
  const submitAttemptId = submitAttemptIdFactory()
  const flushResult = await finalFlush(submitAttemptId)

  return submitExam(examSlug, {
    submitAttemptId,
    finalFlushReceiptId: flushResult.finalFlushReceiptId,
  })
}
