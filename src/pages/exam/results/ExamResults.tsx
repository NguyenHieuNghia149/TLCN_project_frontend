import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '@/components/common/Button/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/api/useAuth'
import { isLegacyExamId } from '@/pages/exam/legacy/legacy-exam-redirect'
import { examService } from '@/services/api/exam.service'
import type { ExamAccessState, PublicExamLanding } from '@/types/exam.types'
import { normalizeLearnerResultStatus, type ResultStatus } from './result-status'
import {
  normalizeLearnerBreakdown,
  type LearnerResultBreakdownItem,
} from './result-breakdown'

type LearnerResultTableColumn = {
  id: string
  title: string
}

type LearnerResultTableRow = {
  index: number
  email: string
  submittedAt: string | null
  totalScore: number | null
  perProblemScores: Record<
    string,
    {
      obtained: number
      maxPoints: number | null
    }
  >
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString()
}

function formatChallengeScore(obtained: number, maxPoints: number | null) {
  return maxPoints !== null ? `${obtained}/${maxPoints}` : `${obtained}`
}

function extractApiErrorStatus(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (error as { response?: { status?: unknown } }).response
    if (typeof response?.status === 'number') {
      return response.status
    }
  }
  return null
}

function extractApiErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (
      error as {
        response?: { data?: { message?: unknown } }
      }
    ).response
    const message = response?.data?.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

const ExamResults: React.FC = () => {
  const { examSlug = '' } = useParams<{ examSlug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<PublicExamLanding | null>(null)
  const [accessState, setAccessState] = useState<ExamAccessState | null>(null)
  const [resultStatus, setResultStatus] = useState<ResultStatus>('pending')
  const [score, setScore] = useState<number | null>(null)
  const [breakdown, setBreakdown] = useState<LearnerResultBreakdownItem[]>([])
  const [submissionPayload, setSubmissionPayload] = useState<
    Record<string, unknown> | null
  >(null)

  useEffect(() => {
    if (!examSlug) {
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [publicExam, currentAccess] = await Promise.all([
          examService.getPublicExam(examSlug),
          examService.getExamAccessState(examSlug),
        ])

        if (cancelled) return

        setExam(publicExam)
        setAccessState(currentAccess)

        if (!currentAccess.participationId) {
          setResultStatus('pending')
          return
        }

        try {
          const details = await examService.getSubmissionDetails(
            publicExam.id,
            currentAccess.participationId
          )
          if (cancelled) return

          const normalized = normalizeLearnerResultStatus(
            details.scoreStatus,
            details.totalScore
          )
          const perProblem = normalizeLearnerBreakdown(details)
          setSubmissionPayload(details)

          if (normalized.status === 'pending') {
            setResultStatus('pending')
            setScore(null)
            setBreakdown(perProblem)
            return
          }

          if (normalized.status === 'failed') {
            setResultStatus('failed')
            setScore(null)
            setBreakdown(perProblem)
            return
          }

          setResultStatus('scored')
          setScore(normalized.score ?? 0)
          setBreakdown(perProblem)
        } catch (submissionError: unknown) {
          if (cancelled) return
          const statusCode = extractApiErrorStatus(submissionError)
          if (statusCode === 404 || statusCode === 409) {
            setResultStatus('pending')
            setScore(null)
            setBreakdown([])
            setSubmissionPayload(null)
            return
          }
          setResultStatus('failed')
          setScore(null)
          setBreakdown([])
          setSubmissionPayload(null)
        }
      } catch (apiError: unknown) {
        if (cancelled) return
        if (isLegacyExamId(examSlug)) {
          try {
            const legacyExam = await examService.getExamById(examSlug)
            if (legacyExam?.slug && legacyExam.slug !== examSlug) {
              navigate(`/exam/${legacyExam.slug}/results`, { replace: true })
              return
            }
          } catch {
            // Ignore fallback failures and surface original error below.
          }
        }
        setError(
          extractApiErrorMessage(apiError, 'Failed to load exam results')
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [examSlug, navigate])

  const challengeColumns = useMemo<LearnerResultTableColumn[]>(() => {
    const fromBreakdown = breakdown.map(item => ({
      id: item.problemId,
      title: item.challengeTitle,
    }))
    if (fromBreakdown.length > 0) {
      return fromBreakdown
    }

    const submission = submissionPayload
    if (!submission) {
      return []
    }

    const rawPerProblem = submission.perProblem
    if (Array.isArray(rawPerProblem)) {
      return rawPerProblem
        .map((item, index) => {
          const row = asRecord(item)
          if (!row) return null
          const problemId =
            asNonEmptyString(row.problemId) ||
            asNonEmptyString(row.challengeId) ||
            `problem-${index + 1}`
          const title =
            asNonEmptyString(row.challengeTitle) ||
            asNonEmptyString(row.title) ||
            problemId
          return { id: problemId, title }
        })
        .filter((item): item is LearnerResultTableColumn => item !== null)
    }

    const rawSolutions = submission.solutions
    if (Array.isArray(rawSolutions)) {
      return rawSolutions
        .map((item, index) => {
          const row = asRecord(item)
          if (!row) return null
          const problemId =
            asNonEmptyString(row.challengeId) ||
            asNonEmptyString(row.problemId) ||
            `problem-${index + 1}`
          const title =
            asNonEmptyString(row.challengeTitle) ||
            asNonEmptyString(row.title) ||
            problemId
          return { id: problemId, title }
        })
        .filter((item): item is LearnerResultTableColumn => item !== null)
    }

    return []
  }, [breakdown, submissionPayload])

  const resultRow = useMemo<LearnerResultTableRow | null>(() => {
    if (!accessState?.participationId) {
      return null
    }

    const perProblemScores: LearnerResultTableRow['perProblemScores'] =
      breakdown.reduce((acc, item) => {
        acc[item.problemId] = {
          obtained: item.obtained,
          maxPoints: item.maxPoints,
        }
        return acc
      }, {} as LearnerResultTableRow['perProblemScores'])

    const submission = submissionPayload
    const submissionUser = asRecord(submission?.user)
    const email =
      asNonEmptyString(submissionUser?.email) ||
      asNonEmptyString(submission?.email) ||
      user?.email ||
      '--'
    const submittedAt = asNonEmptyString(submission?.submittedAt)

    return {
      index: 1,
      email,
      submittedAt,
      totalScore: resultStatus === 'scored' ? (score ?? 0) : null,
      perProblemScores,
    }
  }, [
    accessState?.participationId,
    breakdown,
    resultStatus,
    score,
    submissionPayload,
    user?.email,
  ])

  const statusHint = useMemo(() => {
    if (resultStatus === 'pending') {
      return 'Submission has been received and is currently being scored.'
    }
    if (resultStatus === 'failed') {
      return 'Scoring is temporarily unavailable due to a technical error. Please refresh later.'
    }
    return null
  }, [resultStatus])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-8 py-10 text-center">
          <p className="text-lg font-semibold">{error || 'Exam not found'}</p>
          <Button className="mt-4" onClick={() => navigate('/exam')}>
            Back to exams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">{exam.title}</h1>
              <p className="mt-2 text-sm text-slate-400">Exam results</p>
              {statusHint ? (
                <p className="mt-3 text-sm text-amber-200">{statusHint}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/exam')} variant="secondary">
                Back to exams
              </Button>
              <Button onClick={() => navigate(`/exam/${examSlug}`)}>
                Go to exam landing
              </Button>
            </div>
          </div>
          {accessState?.participationId ? (
            <p className="mt-4 text-xs text-slate-400">
              Participation: {accessState.participationId}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <h2 className="text-lg font-semibold">Result table</h2>
          <p className="mt-2 text-sm text-slate-400">
            Learner view only contains your own submission row.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3">STT</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Submitted</th>
                  {challengeColumns.map(column => (
                    <th key={column.id} className="pb-3">
                      {column.title}
                    </th>
                  ))}
                  <th className="pb-3">Total score</th>
                </tr>
              </thead>
              <tbody>
                {!resultRow ? (
                  <tr>
                    <td
                      className="py-4 text-slate-400"
                      colSpan={4 + challengeColumns.length}
                    >
                      No submission row yet.
                    </td>
                  </tr>
                ) : (
                  <tr className="border-b border-emerald-300/25 bg-emerald-300/10">
                    <td className="py-3">{resultRow.index}</td>
                    <td className="py-3 font-semibold text-emerald-100">{resultRow.email}</td>
                    <td className="py-3">
                      {resultRow.submittedAt
                        ? formatDateTime(resultRow.submittedAt)
                        : '--'}
                    </td>
                    {challengeColumns.map(column => {
                      const problemScore = resultRow.perProblemScores[column.id]
                      return (
                        <td key={`${column.id}-${resultRow.index}`} className="py-3">
                          {problemScore
                            ? formatChallengeScore(
                                problemScore.obtained,
                                problemScore.maxPoints
                              )
                            : '--'}
                        </td>
                      )
                    })}
                    <td className="py-3 font-semibold">
                      {resultRow.totalScore !== null ? resultRow.totalScore : '--'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ExamResults
