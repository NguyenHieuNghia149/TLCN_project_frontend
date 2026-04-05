import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calendar, Code, RefreshCw, Search } from 'lucide-react'
import { Drawer } from 'antd'

import Button from '@/components/common/Button/Button'
import Input from '@/components/common/Input/Input'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { examService } from '@/services/api/exam.service'
import type { Exam } from '@/types/exam.types'
import { normalizeAdminResultStatus, type ResultStatus } from './result-status'

type AdminResultRow = {
  id: string
  userId: string
  displayName: string
  email: string
  totalScore: number
  submittedAt: string
  scoreStatus: ResultStatus
}

function formatDateTime(iso: string) {
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

const ExamResultsAdmin: React.FC = () => {
  const { id: examId = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
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

        const normalizedRows: AdminResultRow[] = leaderboardItems.map(item => {
          const userObj = (item.user ?? {}) as Record<string, unknown>
          const firstName = String(userObj.firstname ?? '').trim()
          const lastName = String(userObj.lastname ?? '').trim()
          const displayName = [firstName, lastName].filter(Boolean).join(' ')
          const email = String(userObj.email ?? item.userId ?? 'unknown')
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
          }
        })

        setExam(examPayload)
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

  const openSubmissionDetails = async (participationId: string) => {
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
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!exam || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-8 py-10 text-center">
          <p className="text-lg font-semibold">{error || 'Exam not found'}</p>
          <Button className="mt-4" onClick={() => navigate('/admin/exams')}>
            Back to admin exams
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
                onClick={() => navigate('/admin/exams')}
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
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} />
                      Submitted
                    </span>
                  </th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td className="py-6 text-slate-400" colSpan={5}>
                      No result rows found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="py-3">
                        <div className="font-semibold">{row.displayName}</div>
                        <div className="text-xs text-slate-400">
                          {row.email}
                        </div>
                      </td>
                      <td className="py-3">
                        {row.scoreStatus === 'scored' ? (
                          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                            scored
                          </span>
                        ) : row.scoreStatus === 'pending' ? (
                          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
                            pending
                          </span>
                        ) : (
                          <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-rose-100">
                            failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-semibold">
                        {row.scoreStatus === 'scored' ? row.totalScore : '--'}
                      </td>
                      <td className="py-3">
                        {formatDateTime(row.submittedAt)}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void openSubmissionDetails(row.id)}
                          disabled={detailsLoading}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Code size={14} />
                            View code
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
          {selectedParticipationId && selectedDetails ? (
            <>
              <p className="text-sm text-slate-500">
                Participation: {selectedParticipationId}
              </p>
              <pre className="mt-3 max-h-[72vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-900">
                {JSON.stringify(selectedDetails, null, 2)}
              </pre>
            </>
          ) : null}
        </Drawer>
      </div>
    </div>
  )
}

export default ExamResultsAdmin
