import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/stores'
import { Eye, AlertTriangle, Copy } from 'lucide-react'
import MonacoEditorWrapper from '@/components/editor/MonacoEditorWrapper'
import { submissionsService } from '@/services/api/submissions.service'
import type { SubmissionDetail } from '@/types/submission.types'

export interface SubmissionsTabProps {
  problemId: string
  participationId?: string | null
}

const toUiStatus = (s: string | undefined) => {
  if (!s) return 'unknown'
  if (s === 'ACCEPTED' || s === 'accepted') return 'accepted'
  if (s === 'WRONG_ANSWER' || s === 'wrong') return 'wrong'
  if (s === 'RUNTIME_ERROR' || s === 'runtime') return 'runtime'
  if (s === 'TIME_LIMIT_EXCEEDED' || s === 'timeout') return 'timeout'
  return 'unknown'
}

const getStatusLabel = (s: string) => {
  if (s === 'accepted') return 'Accepted'
  if (s === 'wrong') return 'Wrong Answer'
  if (s === 'runtime') return 'Runtime Error'
  if (s === 'timeout') return 'Time Limit'
  return 'Unknown'
}

const getStatusColor = (s: string) => {
  if (s === 'accepted') return 'text-green-400'
  if (s === 'wrong') return 'text-red-400'
  if (s === 'runtime') return 'text-orange-400'
  if (s === 'timeout') return 'text-yellow-400'
  return 'text-gray-300'
}

const getStatusBgColor = (s: string) => {
  if (s === 'accepted') return 'bg-gray-950'
  return 'bg-transparent'
}

const SubmissionsTab: React.FC<SubmissionsTabProps> = ({
  problemId,
  participationId,
}) => {
  const reduxParticipation = useSelector(
    (s: RootState) => s.exam?.currentParticipationId
  )
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingSubmissionId, setViewingSubmissionId] = useState<string | null>(
    null
  )
  const [viewingDetail, setViewingDetail] = useState<SubmissionDetail | null>(
    null
  )
  const [detailLoading, setDetailLoading] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const participationIdToUse: string | undefined =
          participationId || reduxParticipation || undefined

        const res = await submissionsService.getProblemSubmissions(problemId, {
          limit: 10,
          offset: 0,
          participationId: participationIdToUse,
        })
        if (mounted) setSubmissions(res.submissions)
      } catch (e) {
        if (mounted)
          setError(
            (e as { message?: string }).message || 'Failed to load submissions'
          )
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [problemId, reduxParticipation, participationId])

  useEffect(() => {
    let mounted = true
    if (!viewingSubmissionId) {
      setViewingDetail(null)
      return
    }
    ;(async () => {
      try {
        setDetailLoading(true)
        const detail =
          await submissionsService.getSubmission(viewingSubmissionId)
        if (mounted) setViewingDetail(detail)
      } catch {
        if (mounted) setViewingDetail(null)
      } finally {
        if (mounted) setDetailLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [viewingSubmissionId])

  const displayRows = useMemo(
    () =>
      submissions.map(s => ({
        id: s.submissionId,
        status: toUiStatus(s.status),
        date: new Date(s.submittedAt).toLocaleString(),
        language: s.language.toUpperCase(),
        code: '',
        testsPassed: s.result?.passed,
        totalTests: s.result?.total,
      })),
    [submissions]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-300">
        Loading submissions...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded border border-red-700 bg-red-900/20 p-4 text-red-200">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 p-6">
      {displayRows.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-2 text-gray-400">
            <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
          </div>
          <p className="text-lg text-gray-400">No submissions yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Submit your solution to see it here
          </p>
        </div>
      )}

      {!viewingSubmissionId && displayRows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950">
                <th className="w-1/4 px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Submission
                </th>
                <th className="w-1/6 px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Language
                </th>
                <th className="w-1/4 px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Code
                </th>
                <th className="w-1/4 px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Analysis
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayRows.map(row => (
                <tr
                  key={row.id}
                  className={`transition-colors ${getStatusBgColor(row.status)}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className={`text-base font-bold ${getStatusColor(row.status)}`}
                        >
                          {getStatusLabel(row.status)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{row.date}</p>
                      </div>
                      {typeof row.testsPassed === 'number' &&
                        row.status !== 'accepted' && (
                          <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300">
                            {row.testsPassed}/{row.totalTests} passed
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-300">
                      {row.language}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setViewingSubmissionId(row.id)}
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-blue-500 transition-colors"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {row.status === 'accepted' ? (
                      <button className="rounded px-3 py-2 text-sm font-medium text-yellow-500 transition-colors">
                        Analyze Complexity
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingSubmissionId && (
        <div className="rounded-lg border border-gray-800 bg-gray-900">
          {(() => {
            const sub =
              submissions.find(s => s.submissionId === viewingSubmissionId) ||
              viewingDetail ||
              undefined
            const ui = toUiStatus(sub?.status || '')
            const statusColor =
              ui === 'accepted'
                ? 'text-green-400'
                : ui === 'wrong'
                  ? 'text-red-400'
                  : ui === 'runtime'
                    ? 'text-orange-400'
                    : ui === 'timeout'
                      ? 'text-yellow-400'
                      : 'text-gray-300'
            const submittedAt = sub?.submittedAt
              ? new Date(sub.submittedAt).toLocaleString()
              : ''
            const runtimeSeconds = sub?.executionTime
              ? (sub.executionTime / 1000).toFixed(3)
              : undefined
            return (
              <>
                <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 p-4">
                  <button
                    onClick={() => setViewingSubmissionId(null)}
                    className="text-l font-bold text-gray-300 hover:text-white"
                  >
                    ← All Submissions
                  </button>
                </div>
                <div className="p-4" style={{ maxWidth: 800 }}>
                  <header className="mb-3 flex flex-col gap-2">
                    <div className="flex w-full items-center justify-between">
                      <h1 className={`${statusColor} text-xl font-semibold`}>
                        {getStatusLabel(ui)}
                      </h1>
                      <p className="text-sm text-gray-400">{submittedAt}</p>
                    </div>
                    <div className="flex w-full items-center justify-between text-sm">
                      <p className="text-gray-300">
                        Language: {sub?.language?.toUpperCase()}
                      </p>
                      <div className="flex items-center gap-6 text-gray-400">
                        {runtimeSeconds && (
                          <p>Runtime: {runtimeSeconds} seconds</p>
                        )}
                      </div>
                    </div>
                  </header>
                  <div className="mb-4 overflow-hidden rounded border border-gray-800 bg-gray-950">
                    <div className="border-b border-gray-700 bg-gray-800 px-4 py-2">
                      <p className="text-sm text-gray-400">Summary</p>
                    </div>
                    <div className="p-4 text-sm text-gray-200">
                      <span>
                        Passed {sub?.result?.passed ?? 0}/
                        {sub?.result?.total ?? 0}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded border border-gray-800 bg-gray-950">
                    <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
                      <p className="text-sm text-gray-400">Code</p>
                      <div className="flex items-center gap-3">
                        {detailLoading && (
                          <span className="text-xs text-gray-400">
                            Loading...
                          </span>
                        )}
                        <button
                          onClick={() => {
                            const anyDetail = viewingDetail as unknown as {
                              sourceCode?: string
                              code?: string
                            } | null
                            const text =
                              anyDetail?.sourceCode || anyDetail?.code || ''
                            if (text) navigator.clipboard.writeText(text)
                          }}
                          className="flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
                        >
                          <Copy size={14} /> Copy
                        </button>
                      </div>
                    </div>
                    <div style={{ height: 800 }}>
                      <MonacoEditorWrapper
                        value={
                          (viewingDetail as unknown as { sourceCode?: string })
                            ?.sourceCode || ''
                        }
                        onChange={() => {}}
                        language={(
                          viewingDetail?.language || 'cpp'
                        ).toLowerCase()}
                        readOnly={true}
                        height={800}
                        editorTheme="vs-dark"
                      />
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default SubmissionsTab
