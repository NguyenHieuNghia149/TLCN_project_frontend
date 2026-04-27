import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Code, RefreshCw, Search } from 'lucide-react'
import { Drawer } from 'antd'

import Button from '@/components/common/Button/Button'
import Input from '@/components/common/Input/Input'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { examService } from '@/services/api/exam.service'
import type { Exam } from '@/types/exam.types'
import { normalizeAdminResultStatus, type ResultStatus } from './result-status'
import { normalizeSubmissionDetails } from './submission-detail-view-model'

type ChallengeColumn = {
  id: string
  title: string
}

type AdminResultRow = {
  id: string
  userId: string
  displayName: string
  email: string
  totalScore: number
  submittedAt: string
  scoreStatus: ResultStatus
  perProblemScores: Record<
    string,
    {
      obtained: number
      maxPoints: number | null
    }
  >
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString()
}

function formatOptionalDateTime(iso: string | null) {
  return iso ? formatDateTime(iso) : '--'
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

const ExamResultsAdmin: React.FC = () => {
  const { id, examId: examIdParam } = useParams<{
    id?: string
    examId?: string
  }>()
  const examId = id || examIdParam || ''
  const navigate = useNavigate()
  const location = useLocation()
  const backTo = location.pathname.startsWith('/admin/')
    ? '/admin/exams'
    : '/exam'

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [challengeColumns, setChallengeColumns] = useState<ChallengeColumn[]>(
    []
  )
  const [rows, setRows] = useState<AdminResultRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedParticipationId, setSelectedParticipationId] = useState<
    string | null
  >(null)
  const [selectedDetails, setSelectedDetails] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const fetchResults = useCallback(
    async (isBackground = false) => {
      if (!examId) return

      if (isBackground) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        setError(null)
        const [examPayload, leaderboardPayload] = await Promise.all([
          examService.getAdminExamById(examId),
          examService.getLeaderboard(examId, 200, 0),
        ])

        const leaderboardItems = (
          Array.isArray(leaderboardPayload?.data)
            ? leaderboardPayload.data
            : Array.isArray(leaderboardPayload)
              ? leaderboardPayload
              : []
        ) as Array<Record<string, unknown>>

        const normalizedChallengeColumns: ChallengeColumn[] = Array.isArray(
          examPayload.challenges
        )
          ? examPayload.challenges.map(challenge => ({
              id: String(challenge.id),
              title: String(challenge.title || challenge.id),
            }))
          : []

        const normalizedRows: AdminResultRow[] = leaderboardItems.map(item => {
          const userObj = (item.user ?? {}) as Record<string, unknown>
          const firstName = String(userObj.firstname ?? '').trim()
          const lastName = String(userObj.lastname ?? '').trim()
          const displayName = [firstName, lastName].filter(Boolean).join(' ')
          const email = String(userObj.email ?? item.userId ?? 'unknown')
          const perProblemPayload = Array.isArray(item.perProblem)
            ? (item.perProblem as Array<Record<string, unknown>>)
            : []

          const perProblemScores = perProblemPayload.reduce<
            AdminResultRow['perProblemScores']
          >((acc, perProblemItem) => {
            const problemId = String(perProblemItem.problemId ?? '').trim()
            if (!problemId) {
              return acc
            }
            const obtained = Number(perProblemItem.obtained ?? 0)
            const maxPointsRaw = perProblemItem.maxPoints
            acc[problemId] = {
              obtained: Number.isFinite(obtained) ? obtained : 0,
              maxPoints:
                typeof maxPointsRaw === 'number' && Number.isFinite(maxPointsRaw)
                  ? maxPointsRaw
                  : null,
            }
            return acc
          }, {})

          return {
            id: String(
              item.id ?? item.participationId ?? `${email}-${item.submittedAt}`
            ),
            userId: String(item.userId ?? ''),
            displayName: displayName || email,
            email,
            totalScore: Number(item.totalScore ?? 0),
            submittedAt: String(item.submittedAt ?? new Date(0).toISOString()),
            scoreStatus: normalizeAdminResultStatus(
              item.scoreStatus,
              item.totalScore
            ),
            perProblemScores,
          }
        })

        setExam(examPayload)
        setChallengeColumns(normalizedChallengeColumns)
        setRows(normalizedRows)
      } catch (apiError: unknown) {
        setError(
          extractApiErrorMessage(apiError, 'Failed to load exam results')
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [examId]
  )

  useEffect(() => {
    void fetchResults()
  }, [fetchResults])

  const hasPendingRows = useMemo(
    () => rows.some(row => row.scoreStatus === 'pending'),
    [rows]
  )

  useEffect(() => {
    if (!hasPendingRows) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }
      void fetchResults(true)
    }, 15_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [fetchResults, hasPendingRows])

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) {
      return rows
    }
    return rows.filter(row => {
      return (
        row.displayName.toLowerCase().includes(normalizedSearch) ||
        row.email.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [rows, searchTerm])

  const statusPills = useMemo(
    () => ({
      pending: rows.filter(row => row.scoreStatus === 'pending').length,
      scored: rows.filter(row => row.scoreStatus === 'scored').length,
      failed: rows.filter(row => row.scoreStatus === 'failed').length,
    }),
    [rows]
  )

  const submissionDetail = useMemo(
    () => normalizeSubmissionDetails(selectedDetails),
    [selectedDetails]
  )

  const openSubmissionDetails = useCallback(
    async (participationId: string) => {
      if (!examId) return
      try {
        setDetailsLoading(true)
        const payload = await examService.getSubmissionDetails(
          examId,
          participationId
        )
        setSelectedParticipationId(participationId)
        setSelectedDetails(payload)
      } catch (apiError: unknown) {
        setError(
          extractApiErrorMessage(apiError, 'Failed to load submission details')
        )
      } finally {
        setDetailsLoading(false)
      }
    },
    [examId]
  )

  if (loading) {
    return <LoadingSpinner />
  }

  if (!exam || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-8 py-10 text-center">
          <p className="text-lg font-semibold">{error || 'Exam not found'}</p>
          <Button className="mt-4" onClick={() => navigate(backTo)}>
            {backTo === '/admin/exams' ? 'Back to admin exams' : 'Back to exams'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{exam.title}</h1>
              <p className="mt-1 text-sm text-slate-400">
                Admin results dashboard
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(backTo)}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  void fetchResults(true)
                }}
                disabled={refreshing}
              >
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} />
                  {refreshing ? 'Refreshing...' : 'Refresh now'}
                </span>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pending scoring
            </p>
            <p className="mt-3 text-3xl font-semibold text-amber-300">
              {statusPills.pending}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Scored
            </p>
            <p className="mt-3 text-3xl font-semibold text-emerald-300">
              {statusPills.scored}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Failed scoring
            </p>
            <p className="mt-3 text-3xl font-semibold text-rose-300">
              {statusPills.failed}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
          `failed` means a technical scoring error, not a failed exam attempt.
          Scoring is processed asynchronously and this page auto-refreshes while
          pending rows exist.
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/90 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="w-full max-w-md">
              <Input
                icon={<Search size={16} />}
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
              />
            </div>
            {hasPendingRows ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
                Auto-refresh every 15s while tab is active
              </span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      Submitted
                    </span>
                  </th>
                  {challengeColumns.map(challenge => (
                    <th key={challenge.id} className="pb-3">
                      {challenge.title}
                    </th>
                  ))}
                  <th className="pb-3">Total score</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      className="py-6 text-slate-400"
                      colSpan={5 + challengeColumns.length}
                    >
                      No result rows found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="py-3">
                        <div className="font-semibold">{row.displayName}</div>
                      </td>
                      <td className="py-3">
                        {row.email}
                      </td>
                      <td className="py-3">
                        {formatDateTime(row.submittedAt)}
                      </td>
                      {challengeColumns.map(challenge => {
                        const score = row.perProblemScores[challenge.id]
                        return (
                          <td key={`${row.id}-${challenge.id}`} className="py-3">
                            {score
                              ? score.maxPoints !== null
                                ? `${score.obtained}/${score.maxPoints}`
                                : score.obtained
                              : '--'}
                          </td>
                        )
                      })}
                      <td className="py-3 font-semibold">
                        {row.scoreStatus === 'scored' ? row.totalScore : '--'}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={detailsLoading}
                          onClick={() => void openSubmissionDetails(row.id)}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Code size={14} />
                            View details
                          </span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Drawer
          title="Submission details"
          open={!!selectedParticipationId && !!selectedDetails}
          width={720}
          onClose={() => {
            setSelectedParticipationId(null)
            setSelectedDetails(null)
          }}
          destroyOnClose
        >
          {selectedParticipationId && submissionDetail ? (
            <div className="space-y-4">
              <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Candidate
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {submissionDetail.userName}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {submissionDetail.email}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Participation
                  </p>
                  <p className="mt-1 break-all text-sm text-slate-900">
                    {submissionDetail.participationId}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Started at
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatOptionalDateTime(submissionDetail.startedAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Submitted at
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {formatOptionalDateTime(submissionDetail.submittedAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Duration
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {submissionDetail.durationMinutes !== null
                      ? `${submissionDetail.durationMinutes} minutes`
                      : '--'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Total score
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {submissionDetail.totalScore ?? '--'}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-800">
                  Challenge details
                </h3>
                {submissionDetail.solutions.length === 0 ? (
                  <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    No challenge submission data for this participation.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {submissionDetail.solutions.map(solution => (
                      <article
                        key={solution.challengeId}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {solution.challengeTitle}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {solution.challengeId}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Score: {solution.score ?? '--'}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-3">
                          <p>
                            <span className="font-semibold">Language:</span>{' '}
                            {solution.language}
                          </p>
                          <p>
                            <span className="font-semibold">Submitted:</span>{' '}
                            {formatOptionalDateTime(solution.submittedAt)}
                          </p>
                          <p>
                            <span className="font-semibold">Testcases:</span>{' '}
                            {solution.totalTests > 0
                              ? `${solution.passedCount}/${solution.totalTests} passed`
                              : 'No testcase data'}
                          </p>
                        </div>

                        <div className="mt-3">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Code
                          </p>
                          <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-emerald-200">
                            {solution.code.trim()
                              ? solution.code
                              : '// No code submitted'}
                          </pre>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </Drawer>
      </div>
    </div>
  )
}

export default ExamResultsAdmin
