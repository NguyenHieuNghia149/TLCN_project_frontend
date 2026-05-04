import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '@/components/common/Button/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/api/useAuth'
import { isLegacyExamId } from '@/pages/exam/legacy/legacy-exam-redirect'
import { examService } from '@/services/api/exam.service'
import type { ExamAccessState, PublicExamLanding } from '@/types/exam.types'
import {
  normalizeLearnerResultStatus,
  type ResultStatus,
} from './result-status'
import {
  normalizeLearnerBreakdown,
  type LearnerResultBreakdownItem,
} from './result-breakdown'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function asFiniteNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString()
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

/* ─── Score animation hook ─── */
function useScoreAnimation(targetPct: number, duration = 1200) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) {
      ref.current.style.setProperty('--score-pct', String(targetPct))
      return
    }
    const start = performance.now()
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    let raf: number
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const value = easeOutCubic(progress) * targetPct
      ref.current?.style.setProperty('--score-pct', String(value))
      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [targetPct, duration])
  return ref
}

/* ─── Color helper for progress bars ─── */
function getScoreColor(ratio: number): string {
  if (ratio >= 0.8) return 'var(--exam-success)'
  if (ratio >= 0.4) return 'var(--exam-warning)'
  return 'var(--exam-danger)'
}

function getStatusLabel(status: ResultStatus): {
  label: string
  color: string
} {
  switch (status) {
    case 'scored':
      return { label: 'Scored', color: 'var(--exam-success)' }
    case 'pending':
      return { label: 'Pending', color: 'var(--exam-warning)' }
    case 'failed':
      return { label: 'Scoring Error', color: 'var(--exam-danger)' }
    default:
      return { label: 'Unknown', color: 'var(--exam-muted)' }
  }
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
  const [submissionPayload, setSubmissionPayload] = useState<Record<
    string,
    unknown
  > | null>(null)

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

  /* ─── Computed data ─── */

  const maxScore = useMemo(() => {
    const payloadMax = asFiniteNumberOrNull(submissionPayload?.totalMaxScore)
    if (payloadMax !== null) return payloadMax
    if (breakdown.length === 0) return 0
    return breakdown.reduce((sum, item) => sum + (item.maxPoints ?? 0), 0)
  }, [breakdown, submissionPayload])

  const scorePct = useMemo(() => {
    if (score === null || maxScore === 0) return 0
    return Math.round((score / maxScore) * 100)
  }, [score, maxScore])

  const scoreCircleRef = useScoreAnimation(scorePct)
  const statusInfo = getStatusLabel(resultStatus)

  const submittedAt = useMemo(() => {
    if (!submissionPayload) return null
    return asNonEmptyString(submissionPayload.submittedAt)
  }, [submissionPayload])

  const resultRow = useMemo(() => {
    if (!accessState?.participationId) return null
    const submission = submissionPayload
    const submissionUser = asRecord(submission?.user)
    return (
      asNonEmptyString(submissionUser?.email as string) ||
      asNonEmptyString(submission?.email as string) ||
      user?.email ||
      '--'
    )
  }, [accessState?.participationId, submissionPayload, user?.email])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !exam) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
        }}
      >
        <div
          className="rounded-2xl border px-8 py-10 text-center"
          style={{
            borderColor: 'var(--exam-card-border)',
            backgroundColor: 'var(--exam-card-bg)',
          }}
        >
          <p className="text-lg font-semibold">{error || 'Exam not found'}</p>
          <Button className="mt-4" onClick={() => navigate('/exam')}>
            Back to exams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
        transition: 'background-color 200ms ease, color 200ms ease',
      }}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* ─── Header ─── */}
        <section
          className="rounded-2xl border p-8"
          style={{
            borderColor: 'var(--exam-card-border)',
            backgroundColor: 'var(--exam-card-bg)',
            boxShadow: 'var(--exam-card-shadow)',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1
                className="text-3xl font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                {exam.title}
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--exam-muted)' }}
              >
                Exam results
              </p>
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
        </section>

        {/* ─── Score Summary ─── */}
        <section
          className="rounded-2xl border p-6"
          style={{
            borderColor: 'var(--exam-card-border)',
            backgroundColor: 'var(--exam-card-bg)',
            animation: 'exam-fade-in 0.4s ease both',
          }}
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* Score circle */}
            <div
              ref={scoreCircleRef}
              className="relative flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center rounded-full"
              style={{
                ['--score-pct' as string]: '0',
                background: `conic-gradient(${getScoreColor(scorePct / 100)} calc(var(--score-pct) * 1%), var(--exam-card-border) 0)`,
                animation: 'exam-score-appear 0.5s ease both',
              }}
            >
              <div
                className="flex h-[96px] w-[96px] items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--exam-card-bg)' }}
              >
                <div className="text-center">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {resultStatus === 'scored' ? `${scorePct}%` : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Score details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <span
                  className="inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusInfo.color }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: statusInfo.color }}
                >
                  {statusInfo.label}
                </span>
              </div>
              {resultStatus === 'scored' && score !== null && maxScore > 0 && (
                <p
                  className="mt-2 text-lg font-semibold"
                  style={{ color: 'var(--text-color)' }}
                >
                  {score} / {maxScore} points
                </p>
              )}
              {resultStatus === 'scored' && score !== null && maxScore <= 0 && (
                <p
                  className="mt-2 text-lg font-semibold"
                  style={{ color: 'var(--text-color)' }}
                >
                  {score} points
                </p>
              )}
              {resultRow && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--exam-muted)' }}
                >
                  {resultRow}
                </p>
              )}
              {submittedAt && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--exam-muted)' }}
                >
                  Submitted: {formatDateTime(submittedAt)}
                </p>
              )}
              {resultStatus === 'pending' && (
                <p
                  className="mt-2 text-sm"
                  style={{ color: 'var(--exam-warning)' }}
                >
                  Submission is being scored. Please check back later.
                </p>
              )}
              {resultStatus === 'failed' && (
                <p
                  className="mt-2 text-sm"
                  style={{ color: 'var(--exam-danger)' }}
                >
                  Scoring encountered an error. Please refresh or contact
                  support.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ─── Per-challenge breakdown ─── */}
        {breakdown.length > 0 && (
          <section
            className="rounded-2xl border p-8"
            style={{
              borderColor: 'var(--exam-card-border)',
              backgroundColor: 'var(--exam-card-bg)',
              animation: 'exam-fade-in 0.5s ease 0.1s both',
              boxShadow: 'var(--exam-card-shadow)',
            }}
          >
            <div className="mb-6 flex items-center gap-2">
              <div
                className="h-6 w-1 rounded-full"
                style={{ backgroundColor: 'var(--exam-accent)' }}
              />
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--text-color)' }}
              >
                Detailed Performance
              </h2>
            </div>

            <div className="space-y-6">
              {breakdown.map(item => {
                const max = item.maxPoints
                const ratio = max && max > 0 ? item.obtained / max : 0
                const barColor = getScoreColor(ratio)
                return (
                  <div key={item.problemId} className="group">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: 'var(--text-color)' }}
                        >
                          {item.challengeTitle}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--exam-muted)' }}
                        >
                          {ratio === 1
                            ? 'Perfect score'
                            : ratio > 0
                              ? 'Partial credit'
                              : 'No points awarded'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-lg font-bold"
                          style={{ color: barColor }}
                        >
                          {item.obtained}
                        </span>
                        <span
                          className="ml-1 text-sm"
                          style={{ color: 'var(--exam-muted)' }}
                        >
                          / {max ?? '--'}
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: 'var(--exam-card-border)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.round(ratio * 100)}%`,
                          backgroundColor: barColor,
                          boxShadow:
                            ratio > 0 ? `0 0 10px ${barColor}40` : 'none',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default ExamResults
