import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Calendar, Code, RefreshCw, Search } from 'lucide-react'
import { Drawer } from 'antd'

import Button from '@/components/common/Button/Button'
import Input from '@/components/common/Input/Input'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { AdminThemeContext } from '@/contexts/AdminThemeContextDef'
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

type AdminResultsThemeStyles = {
  page: React.CSSProperties
  card: React.CSSProperties
  mutedText: React.CSSProperties
  metricLabel: React.CSSProperties
  pendingCount: React.CSSProperties
  scoredCount: React.CSSProperties
  failedCount: React.CSSProperties
  notice: React.CSSProperties
  noticeBadge: React.CSSProperties
  tableHeader: React.CSSProperties
  tableRow: React.CSSProperties
  drawerCard: React.CSSProperties
  drawerMuted: React.CSSProperties
  drawerStrong: React.CSSProperties
  codeBlock: React.CSSProperties
}

function buildAdminResultsThemeStyles(
  mode: 'light' | 'dark'
): AdminResultsThemeStyles {
  const isDark = mode === 'dark'

  return {
    page: {
      backgroundColor: 'var(--admin-bg-primary)',
      color: 'var(--admin-text-primary)',
    },
    card: {
      backgroundColor: 'var(--admin-card-bg)',
      borderColor: 'var(--admin-card-border)',
      color: 'var(--admin-text-primary)',
      boxShadow: 'var(--admin-card-shadow)',
    },
    mutedText: {
      color: 'var(--admin-text-secondary)',
    },
    metricLabel: {
      color: 'var(--admin-text-secondary)',
    },
    pendingCount: {
      color: isDark ? '#fcd34d' : '#b45309',
    },
    scoredCount: {
      color: isDark ? '#6ee7b7' : '#047857',
    },
    failedCount: {
      color: isDark ? '#fda4af' : '#be123c',
    },
    notice: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.10)' : '#fffbeb',
      borderColor: isDark ? 'rgba(251, 191, 36, 0.30)' : '#f59e0b',
      color: isDark ? '#fde68a' : '#92400e',
    },
    noticeBadge: {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.10)' : '#fffbeb',
      borderColor: isDark ? 'rgba(251, 191, 36, 0.30)' : '#f59e0b',
      color: isDark ? '#fde68a' : '#92400e',
    },
    tableHeader: {
      borderColor: 'var(--admin-table-border)',
      color: 'var(--admin-table-header-text)',
    },
    tableRow: {
      borderColor: 'var(--admin-border-light)',
    },
    drawerCard: {
      backgroundColor: 'var(--admin-bg-secondary)',
      borderColor: 'var(--admin-card-border)',
      color: 'var(--admin-text-primary)',
    },
    drawerMuted: {
      color: 'var(--admin-text-secondary)',
    },
    drawerStrong: {
      color: 'var(--admin-text-primary)',
    },
    codeBlock: {
      backgroundColor: isDark ? '#020617' : '#0f172a',
      borderColor: isDark ? 'rgba(148, 163, 184, 0.24)' : '#cbd5e1',
      color: '#bbf7d0',
    },
  }
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
  const adminThemeContext = useContext(AdminThemeContext)
  const adminTheme = adminThemeContext?.adminTheme ?? 'dark'
  const themeStyles = useMemo(
    () => buildAdminResultsThemeStyles(adminTheme),
    [adminTheme]
  )
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
                typeof maxPointsRaw === 'number' &&
                Number.isFinite(maxPointsRaw)
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
      <div
        className="flex min-h-screen items-center justify-center px-4 transition-colors duration-300"
        style={themeStyles.page}
      >
        <div
          className="rounded-2xl border px-8 py-10 text-center transition-colors duration-300"
          style={themeStyles.card}
        >
          <p className="text-lg font-semibold">{error || 'Exam not found'}</p>
          <Button className="mt-4" onClick={() => navigate(backTo)}>
            {backTo === '/admin/exams'
              ? 'Back to admin exams'
              : 'Back to exams'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen px-4 py-10 transition-colors duration-300"
      style={themeStyles.page}
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section
          className="rounded-3xl border p-7 transition-colors duration-300"
          style={themeStyles.card}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{exam.title}</h1>
              <p className="mt-1 text-sm" style={themeStyles.mutedText}>
                Admin results dashboard
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => navigate(backTo)}>
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
          <div
            className="rounded-2xl border p-5 transition-colors duration-300"
            style={themeStyles.card}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={themeStyles.metricLabel}
            >
              Pending scoring
            </p>
            <p
              className="mt-3 text-3xl font-semibold"
              style={themeStyles.pendingCount}
            >
              {statusPills.pending}
            </p>
          </div>
          <div
            className="rounded-2xl border p-5 transition-colors duration-300"
            style={themeStyles.card}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={themeStyles.metricLabel}
            >
              Scored
            </p>
            <p
              className="mt-3 text-3xl font-semibold"
              style={themeStyles.scoredCount}
            >
              {statusPills.scored}
            </p>
          </div>
          <div
            className="rounded-2xl border p-5 transition-colors duration-300"
            style={themeStyles.card}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={themeStyles.metricLabel}
            >
              Failed scoring
            </p>
            <p
              className="mt-3 text-3xl font-semibold"
              style={themeStyles.failedCount}
            >
              {statusPills.failed}
            </p>
          </div>
        </section>

        <section
          className="rounded-2xl border px-4 py-3 text-sm leading-relaxed transition-colors duration-300"
          style={themeStyles.notice}
        >
          `failed` means a technical scoring error, not a failed exam attempt.
          Scoring is processed asynchronously and this page auto-refreshes while
          pending rows exist.
        </section>

        <section
          className="rounded-2xl border p-6 transition-colors duration-300"
          style={themeStyles.card}
        >
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
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={themeStyles.noticeBadge}
              >
                Auto-refresh every 15s while tab is active
              </span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b" style={themeStyles.tableHeader}>
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
                      className="py-6"
                      style={themeStyles.mutedText}
                      colSpan={5 + challengeColumns.length}
                    >
                      No result rows found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => (
                    <tr
                      key={row.id}
                      className="border-b"
                      style={themeStyles.tableRow}
                    >
                      <td className="py-3">
                        <div className="font-semibold">{row.displayName}</div>
                      </td>
                      <td className="py-3">{row.email}</td>
                      <td className="py-3">
                        {formatDateTime(row.submittedAt)}
                      </td>
                      {challengeColumns.map(challenge => {
                        const score = row.perProblemScores[challenge.id]
                        return (
                          <td
                            key={`${row.id}-${challenge.id}`}
                            className="py-3"
                          >
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
                <div
                  className="rounded-xl border p-3"
                  style={themeStyles.drawerCard}
                >
                  <p
                    className="text-xs font-semibold uppercase"
                    style={themeStyles.drawerMuted}
                  >
                    Candidate
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold"
                    style={themeStyles.drawerStrong}
                  >
                    {submissionDetail.userName}
                  </p>
                  <p className="mt-1 text-xs" style={themeStyles.drawerMuted}>
                    {submissionDetail.email}
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={themeStyles.drawerCard}
                >
                  <p
                    className="text-xs font-semibold uppercase"
                    style={themeStyles.drawerMuted}
                  >
                    Participation
                  </p>
                  <p
                    className="mt-1 break-all text-sm"
                    style={themeStyles.drawerStrong}
                  >
                    {submissionDetail.participationId}
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={themeStyles.drawerCard}
                >
                  <p
                    className="text-xs font-semibold uppercase"
                    style={themeStyles.drawerMuted}
                  >
                    Started at
                  </p>
                  <p className="mt-1 text-sm" style={themeStyles.drawerStrong}>
                    {formatOptionalDateTime(submissionDetail.startedAt)}
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={themeStyles.drawerCard}
                >
                  <p
                    className="text-xs font-semibold uppercase"
                    style={themeStyles.drawerMuted}
                  >
                    Submitted at
                  </p>
                  <p className="mt-1 text-sm" style={themeStyles.drawerStrong}>
                    {formatOptionalDateTime(submissionDetail.submittedAt)}
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={themeStyles.drawerCard}
                >
                  <p
                    className="text-xs font-semibold uppercase"
                    style={themeStyles.drawerMuted}
                  >
                    Duration
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold"
                    style={themeStyles.drawerStrong}
                  >
                    {submissionDetail.durationMinutes !== null
                      ? `${submissionDetail.durationMinutes} minutes`
                      : '--'}
                  </p>
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={themeStyles.drawerCard}
                >
                  <p
                    className="text-xs font-semibold uppercase"
                    style={themeStyles.drawerMuted}
                  >
                    Total score
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold"
                    style={themeStyles.drawerStrong}
                  >
                    {submissionDetail.totalScore ?? '--'}
                  </p>
                </div>
              </section>

              <section>
                <h3
                  className="text-sm font-semibold"
                  style={themeStyles.drawerStrong}
                >
                  Challenge details
                </h3>
                {submissionDetail.solutions.length === 0 ? (
                  <p
                    className="mt-2 rounded-lg border p-3 text-sm"
                    style={themeStyles.drawerCard}
                  >
                    No challenge submission data for this participation.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {submissionDetail.solutions.map(solution => (
                      <article
                        key={solution.challengeId}
                        className="rounded-xl border p-4"
                        style={themeStyles.drawerCard}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={themeStyles.drawerStrong}
                            >
                              {solution.challengeTitle}
                            </p>
                            <p
                              className="mt-0.5 text-xs"
                              style={themeStyles.drawerMuted}
                            >
                              {solution.challengeId}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Score: {solution.score ?? '--'}
                          </span>
                        </div>

                        <div
                          className="mt-3 grid grid-cols-1 gap-2 text-xs md:grid-cols-3"
                          style={themeStyles.drawerMuted}
                        >
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
                          <p
                            className="mb-1 text-xs font-semibold uppercase tracking-wide"
                            style={themeStyles.drawerMuted}
                          >
                            Code
                          </p>
                          <pre
                            className="max-h-64 overflow-auto rounded-lg border p-3 text-xs"
                            style={themeStyles.codeBlock}
                          >
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
