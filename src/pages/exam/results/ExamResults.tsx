import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '@/components/common/Button/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { examService } from '@/services/api/exam.service'
import type { ExamAccessState, PublicExamLanding } from '@/types/exam.types'
import {
  normalizeLearnerResultStatus,
  type ResultStatus,
} from './result-status'

type ProblemBreakdown = {
  problemId: string
  obtained: number
  maxPoints: number
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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<PublicExamLanding | null>(null)
  const [accessState, setAccessState] = useState<ExamAccessState | null>(null)
  const [resultStatus, setResultStatus] = useState<ResultStatus>('pending')
  const [score, setScore] = useState<number | null>(null)
  const [breakdown, setBreakdown] = useState<ProblemBreakdown[]>([])

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
          const perProblem = Array.isArray(details.perProblem)
            ? (details.perProblem as ProblemBreakdown[])
            : []

          if (normalized.status === 'pending') {
            setResultStatus('pending')
            setScore(null)
            setBreakdown([])
            return
          }

          if (normalized.status === 'failed') {
            setResultStatus('failed')
            setScore(null)
            setBreakdown([])
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
            return
          }
          setResultStatus('failed')
          setScore(null)
          setBreakdown([])
        }
      } catch (apiError: unknown) {
        if (cancelled) return
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
  }, [examSlug])

  const statusCopy = useMemo(() => {
    if (resultStatus === 'scored') {
      return {
        title: 'Scored',
        description: 'Your result is ready.',
        colorClass: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
      }
    }
    if (resultStatus === 'failed') {
      return {
        title: 'Scoring failed',
        description:
          'A technical scoring error occurred. Please refresh later.',
        colorClass: 'text-rose-200 border-rose-400/30 bg-rose-400/10',
      }
    }
    return {
      title: 'Pending scoring',
      description: 'Your submission is received and waiting for scoring.',
      colorClass: 'text-amber-100 border-amber-400/30 bg-amber-400/10',
    }
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
          <h1 className="text-3xl font-semibold">{exam.title}</h1>
          <p className="mt-2 text-sm text-slate-400">Exam results</p>
        </section>

        <section className={`rounded-2xl border p-6 ${statusCopy.colorClass}`}>
          <h2 className="text-xl font-semibold">{statusCopy.title}</h2>
          <p className="mt-2 text-sm">{statusCopy.description}</p>
          {accessState?.participationId ? (
            <p className="mt-2 text-xs opacity-80">
              Participation: {accessState.participationId}
            </p>
          ) : null}
        </section>

        {resultStatus === 'scored' ? (
          <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
            <h2 className="text-lg font-semibold">Total score</h2>
            <p className="mt-3 text-4xl font-bold text-emerald-300">
              {score ?? 0}
            </p>
            {score === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                Score is zero and already scored. This is not a pending state.
              </p>
            ) : null}
          </section>
        ) : null}

        {resultStatus === 'scored' && breakdown.length > 0 ? (
          <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
            <h2 className="text-lg font-semibold">Per challenge breakdown</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3">Challenge</th>
                    <th className="pb-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map(item => (
                    <tr
                      key={item.problemId}
                      className="border-b border-white/5"
                    >
                      <td className="py-3">{item.problemId}</td>
                      <td className="py-3">
                        {item.obtained}/{item.maxPoints}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/exam')} variant="secondary">
            Back to exams
          </Button>
          <Button onClick={() => navigate(`/exam/${examSlug}`)}>
            Go to exam landing
          </Button>
        </section>
      </div>
    </div>
  )
}

export default ExamResults
