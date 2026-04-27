import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '@/components/common/Button/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { examService } from '@/services/api/exam.service'
import type { Exam } from '@/types/exam.types'

type SubmissionSolution = {
  challengeId: string
  challengeTitle: string
  language: string
  code: string
  score: number
  submittedAt: string
}

type SubmissionDetailViewModel = {
  totalScore: number
  submittedAt: string
  participantName: string
  participantEmail: string
  solutions: SubmissionSolution[]
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeSubmissionDetails(
  payload: unknown
): SubmissionDetailViewModel {
  const root = asRecord(payload)
  const user = asRecord(root.user)

  const solutionsRaw = Array.isArray(root.solutions) ? root.solutions : []
  const solutions: SubmissionSolution[] = solutionsRaw.map(item => {
    const row = asRecord(item)
    const challengeId = asString(row.challengeId, 'unknown-challenge')
    return {
      challengeId,
      challengeTitle: asString(row.challengeTitle, challengeId),
      language: asString(row.language, 'unknown'),
      code: asString(row.code, ''),
      score: asNumber(row.score, 0),
      submittedAt: asString(row.submittedAt, ''),
    }
  })

  const participantFirstName = asString(user.firstname)
  const participantLastName = asString(user.lastname)
  const participantEmail = asString(user.email)
  const participantName =
    [participantFirstName, participantLastName].filter(Boolean).join(' ') ||
    participantEmail ||
    'Unknown candidate'

  return {
    totalScore: asNumber(root.totalScore, 0),
    submittedAt: asString(root.submittedAt, ''),
    participantName,
    participantEmail,
    solutions,
  }
}

function formatDateTime(iso: string) {
  if (!iso) return '--'
  return new Date(iso).toLocaleString()
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

const ExamResultSubmissionDetail: React.FC = () => {
  const { id: examId = '', participationId = '' } = useParams<{
    id: string
    participationId: string
  }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [details, setDetails] = useState<SubmissionDetailViewModel | null>(null)

  useEffect(() => {
    if (!examId || !participationId) return

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [examPayload, detailsPayload] = await Promise.all([
          examService.getAdminExamById(examId),
          examService.getSubmissionDetails(examId, participationId),
        ])

        if (cancelled) return

        setExam(examPayload)
        setDetails(normalizeSubmissionDetails(detailsPayload))
      } catch (apiError: unknown) {
        if (cancelled) return
        setError(
          extractApiErrorMessage(apiError, 'Failed to load submission details')
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
  }, [examId, participationId])

  const sortedSolutions = useMemo(() => {
    return [...(details?.solutions || [])].sort((a, b) =>
      a.challengeTitle.localeCompare(b.challengeTitle)
    )
  }, [details?.solutions])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!exam || !details || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-8 py-10 text-center">
          <p className="text-lg font-semibold">
            {error || 'Submission details not found'}
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate(`/admin/exams/${examId}/results`)}
          >
            Back to results
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{exam.title}</h1>
              <p className="mt-1 text-sm text-slate-400">Submission details</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate(`/admin/exams/${examId}/results`)}
            >
              Back to results
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Candidate
            </p>
            <p className="mt-3 text-lg font-semibold">
              {details.participantName}
            </p>
            {details.participantEmail ? (
              <p className="mt-1 text-sm text-slate-400">
                {details.participantEmail}
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Submitted at
            </p>
            <p className="mt-3 text-lg font-semibold">
              {formatDateTime(details.submittedAt)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total score
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-300">
              {details.totalScore}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <h2 className="text-lg font-semibold">Per challenge score</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3">Challenge</th>
                  <th className="pb-3">Language</th>
                  <th className="pb-3">Submitted at</th>
                  <th className="pb-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedSolutions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-slate-400">
                      No submitted solutions for this participation.
                    </td>
                  </tr>
                ) : (
                  sortedSolutions.map(solution => (
                    <tr
                      key={solution.challengeId}
                      className="border-b border-white/5"
                    >
                      <td className="py-3 font-medium">
                        {solution.challengeTitle}
                      </td>
                      <td className="py-3">{solution.language}</td>
                      <td className="py-3">
                        {formatDateTime(solution.submittedAt)}
                      </td>
                      <td className="py-3 font-semibold">{solution.score}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {sortedSolutions.map(solution => (
          <section
            key={`${solution.challengeId}-code`}
            className="rounded-2xl border border-white/10 bg-slate-900/90 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold">
                {solution.challengeTitle}
              </h3>
              <span className="rounded-full border border-slate-600 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                {solution.language}
              </span>
            </div>
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-xs text-slate-200">
              <code>{solution.code || '// Empty submission'}</code>
            </pre>
          </section>
        ))}
      </div>
    </div>
  )
}

export default ExamResultSubmissionDetail
