import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Trophy,
  Users,
  Calendar,
  Award,
  Code,
} from 'lucide-react'
import Input from '@/components/common/Input/Input'
import Button from '@/components/common/Button/Button'
import { ExamSubmission, Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/api/useAuth'
import { examService } from '@/services/api/exam.service'

const PAGE_SIZE = 10

const ExamResultAdmin: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] =
    useState<ExamSubmission | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const { user } = useAuth()
  const isTeacherOrOwner = user?.role === 'teacher' || user?.role === 'owner'

  const getParticipationIdFromSubmission = (
    submission: unknown
  ): string | undefined => {
    const s = submission as Record<string, unknown>
    const toStringIfDefined = (v: unknown) =>
      v === undefined || v === null ? undefined : String(v)
    const candidate1 = toStringIfDefined(s['id'])
    if (candidate1) return candidate1
    const candidate2 = toStringIfDefined(s['submissionId'])
    if (candidate2) return candidate2
    const candidate3 = toStringIfDefined(s['participationId'])
    if (candidate3) return candidate3
    const partVal = s['participation'] as Record<string, unknown> | undefined
    const candidate4 = partVal ? toStringIfDefined(partVal['id']) : undefined
    if (candidate4) return candidate4
    return undefined
  }

  const handleViewDetails = async (submission: ExamSubmission) => {
    try {
      setLoadingDetails(true)
      const participationId = getParticipationIdFromSubmission(submission)
      if (!participationId) {
        console.error(
          '[ExamResultsAdmin] Missing participation id for submission',
          submission
        )
        setError('Submission id not found')
        return
      }
      const response = await examService.getSubmissionDetails(
        examId!,
        participationId
      )
      setSelectedSubmission(response)
      setShowDetails(true)
    } catch (err) {
      console.error('Failed to fetch submission details:', err)
      setError('Failed to load submission details')
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        if (examId) {
          const apiExam = await examService.getExamById(examId)
          setExam(apiExam)

          const lb = await examService.getLeaderboard(examId, 200, 0)
          const items = lb?.data || lb || []
          const normalized = (items as unknown[]).map(s => {
            const sRec = s as Record<string, unknown>
            const idFromCandidates = getParticipationIdFromSubmission(s)
            const idFromRaw = sRec['id'] ? String(sRec['id']) : undefined
            let id = idFromCandidates || idFromRaw
            // Fallback to a deterministic unique id if none provided (userId-submittedAt)
            if (!id) {
              const userObj = sRec['user'] as
                | Record<string, unknown>
                | undefined
              const uid = String(
                sRec['userId'] || (userObj && userObj['id']) || 'unknown'
              )
              const submittedAt = String(sRec['submittedAt'] || Date.now())
              id = `${uid}-${submittedAt}`
            }
            return {
              ...(sRec as Record<string, unknown>),
              id,
            } as unknown as ExamSubmission
          })
          setSubmissions(normalized)
        }
      } catch (err) {
        console.error('Failed to fetch exam results:', err)
        setError('Failed to load exam results')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [examId])

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const getDisplayName = (
    firstname?: string,
    lastname?: string,
    fallbackEmailOrId?: string
  ) => {
    const name = [firstname, lastname].filter(Boolean).join(' ')
    if (name) return { displayName: name, isFallback: false }
    if (fallbackEmailOrId)
      return { displayName: fallbackEmailOrId, isFallback: true }
    return { displayName: 'Unknown student', isFallback: true }
  }

  const scoreColor = (score: number) => {
    if (score >= 90) return '#10b981'
    if (score >= 70) return '#f59e0b'
    return '#ef4444'
  }

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter(submission => {
        const nameInfo = getDisplayName(
          submission.user?.firstname,
          submission.user?.lastname,
          submission.user?.email || submission.userId
        )
        return nameInfo.displayName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      })
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
  }, [submissions, searchTerm])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / PAGE_SIZE)
  )

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredSubmissions.slice(startIndex, endIndex)
  }, [filteredSubmissions, page])

  const allProblemIds = useMemo(() => {
    const ids = new Set<string>()
    submissions.forEach(sub => {
      sub.perProblem?.forEach(p => ids.add(p.problemId))
    })
    return Array.from(ids)
  }, [submissions])

  const stats = useMemo(() => {
    if (submissions.length === 0)
      return { avgScore: 0, highestScore: 0, totalStudents: 0 }
    const avgScore =
      submissions.reduce((sum, s) => sum + s.totalScore, 0) / submissions.length
    const highestScore = Math.max(...submissions.map(s => s.totalScore))
    return {
      avgScore: Math.round(avgScore),
      highestScore,
      totalStudents: submissions.length,
    }
  }, [submissions])

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  useEffect(() => {
    const resultsTable = document.getElementById('results-table')
    if (resultsTable) {
      resultsTable.scrollIntoView({ behavior: 'smooth' })
    }
  }, [page])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!exam) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--background-color)' }}
      >
        <div
          className="rounded-xl border px-8 py-10 text-center shadow-sm"
          style={{
            borderColor: 'var(--surface-border)',
            color: 'var(--text-color)',
          }}
        >
          <p className="text-lg font-semibold">Exam not found</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Trophy size={20} style={{ color: 'var(--accent)' }} />
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--accent)' }}
            >
              Exam Results (Admin)
            </p>
          </div>
          <h1 className="mb-1 text-3xl font-bold">{exam.title}</h1>
          <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
            View and manage student submissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{
              borderColor: 'var(--surface-border)',
              background:
                'linear-gradient(135deg, rgba(32, 215, 97, 0.05) 0%, transparent 100%)',
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className="rounded-lg p-2"
                style={{ backgroundColor: 'rgba(32, 215, 97, 0.1)' }}
              >
                <Users size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
            <p className="text-sm font-medium">Total Students</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted-text)' }}>
              Submitted their work
            </p>
          </div>

          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{
              borderColor: 'var(--surface-border)',
              background:
                'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, transparent 100%)',
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className="rounded-lg p-2"
                style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
              >
                <Award size={20} className="text-amber-600" />
              </div>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </div>
            <p className="text-sm font-medium">Average Score</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted-text)' }}>
              Class performance
            </p>
          </div>

          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{
              borderColor: 'var(--surface-border)',
              background:
                'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%)',
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className="rounded-lg p-2"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              >
                <Trophy size={20} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{stats.highestScore}%</p>
            </div>
            <p className="text-sm font-medium">Highest Score</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--muted-text)' }}>
              Best performance
            </p>
          </div>
        </div>

        {/* Results Table Section */}
        <section
          className="rounded-xl border shadow-sm"
          style={{
            borderColor: 'var(--surface-border)',
            backgroundColor: 'var(--surface-color)',
          }}
        >
          <div
            className="border-b p-6"
            style={{ borderColor: 'var(--surface-border)' }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-md flex-1">
                <Input
                  icon={<Search size={16} />}
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--muted-text)' }}
              >
                <Users size={16} />
                <span className="font-medium">
                  {filteredSubmissions.length} submission
                  {filteredSubmissions.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          <div id="results-table" className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: 'var(--surface-border)',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <th
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--muted-text)' }}
                  >
                    STT
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Student
                  </th>
                  {allProblemIds.map((problemId, idx) => (
                    <th
                      key={problemId}
                      className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider"
                    >
                      Q{idx + 1}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Submitted
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={allProblemIds.length + 5}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Search
                          size={40}
                          style={{ color: 'var(--muted-text)', opacity: 0.3 }}
                        />
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--muted-text)' }}
                        >
                          No submissions found
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--muted-text)' }}
                        >
                          Try adjusting your search filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((submission, index) => {
                    const rankNumber = (page - 1) * PAGE_SIZE + index + 1
                    const isCurrentUser = submission.userId === user?.id
                    const nameInfo = getDisplayName(
                      submission.user?.firstname,
                      submission.user?.lastname,
                      submission.user?.email || submission.userId
                    )

                    return (
                      <tr
                        key={`${submission.id}-${submission.userId}`}
                        className="border-b transition-colors hover:bg-opacity-50"
                        style={{
                          borderColor: 'var(--surface-border)',
                          backgroundColor: isCurrentUser
                            ? 'rgba(32, 215, 97, 0.08)'
                            : 'transparent',
                        }}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold">
                            {rankNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="whitespace-nowrap font-semibold">
                              {nameInfo.displayName}
                              {nameInfo.isFallback && (
                                <span
                                  className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold"
                                  style={{
                                    backgroundColor:
                                      'rgba(156, 163, 175, 0.12)',
                                    color: 'var(--muted-text)',
                                  }}
                                >
                                  email
                                </span>
                              )}
                            </span>
                            {isCurrentUser && (
                              <span
                                className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold"
                                style={{
                                  backgroundColor: 'rgba(32, 215, 97, 0.15)',
                                  color: 'var(--accent)',
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {allProblemIds.map(problemId => {
                          const problemScore = submission.perProblem?.find(
                            p => p.problemId === problemId
                          )
                          const score = problemScore
                            ? Math.round(
                                (problemScore.obtained /
                                  problemScore.maxPoints) *
                                  100
                              )
                            : 0
                          const points = problemScore
                            ? problemScore.obtained
                            : 0
                          const maxPoints = problemScore
                            ? problemScore.maxPoints
                            : 0
                          return (
                            <td
                              key={`${submission.id}-${problemId}`}
                              className="px-6 py-4 text-center"
                            >
                              <span
                                className="text-sm font-bold"
                                style={{ color: scoreColor(score) }}
                              >
                                {points}/{maxPoints}
                              </span>
                            </td>
                          )
                        })}

                        <td className="px-6 py-4 text-center">
                          <span
                            className="text-base font-bold"
                            style={{ color: scoreColor(submission.totalScore) }}
                          >
                            {submission.totalScore}
                          </span>
                        </td>

                        <td
                          className="whitespace-nowrap px-6 py-4 text-sm"
                          style={{ color: 'var(--muted-text)' }}
                        >
                          {formatDateTime(submission.submittedAt)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          {
                            // compute and disable if no id
                          }
                          {isTeacherOrOwner && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(submission)}
                              disabled={
                                loadingDetails ||
                                !getParticipationIdFromSubmission(submission)
                              }
                            >
                              <Code size={16} />
                              {loadingDetails ? 'Loading...' : 'View Code'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              className="border-t px-6 py-4"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="text-sm" style={{ color: 'var(--muted-text)' }}>
                  Showing{' '}
                  <span
                    className="font-semibold"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {(page - 1) * PAGE_SIZE + 1}
                  </span>{' '}
                  to{' '}
                  <span
                    className="font-semibold"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {Math.min(page * PAGE_SIZE, filteredSubmissions.length)}
                  </span>{' '}
                  of{' '}
                  <span
                    className="font-semibold"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {filteredSubmissions.length}
                  </span>{' '}
                  results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="secondary"
                    size="sm"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      p => {
                        if (
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 1
                        ) {
                          return (
                            <Button
                              key={p}
                              onClick={() => setPage(p)}
                              variant={page === p ? 'primary' : 'ghost'}
                              size="sm"
                              className="min-w-[36px]"
                            >
                              {p}
                            </Button>
                          )
                        }
                        if (
                          (p === page - 2 && page > 2) ||
                          (p === page + 2 && page < totalPages - 1)
                        ) {
                          return (
                            <span
                              key={`ellipsis-${p}`}
                              className="px-2 py-1 text-sm"
                              style={{ color: 'var(--muted-text)' }}
                            >
                              ...
                            </span>
                          )
                        }
                        return null
                      }
                    )}
                  </div>
                  <Button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Details Modal */}
        {showDetails && selectedSubmission && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border shadow-2xl"
              style={{
                backgroundColor: 'var(--background-color)',
                borderColor: 'var(--surface-border)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="sticky top-0 flex items-center justify-between border-b p-6 backdrop-blur-sm"
                style={{
                  borderColor: 'var(--surface-border)',
                  backgroundColor: 'var(--background-color)',
                }}
              >
                <div>
                  <h2 className="text-xl font-bold">Submission Details</h2>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: 'var(--muted-text)' }}
                  >
                    {
                      getDisplayName(
                        selectedSubmission.user?.firstname,
                        selectedSubmission.user?.lastname,
                        selectedSubmission.user?.email ||
                          selectedSubmission?.userId
                      ).displayName
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="rounded-lg p-2 transition-colors hover:opacity-70"
                  style={{ backgroundColor: 'var(--surface-color)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Submission Summary */}
                <div
                  className="mb-6 grid grid-cols-3 gap-4 rounded-xl border p-5"
                  style={{
                    borderColor: 'var(--surface-border)',
                    backgroundColor: 'var(--surface-color)',
                  }}
                >
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted-text)' }}
                    >
                      Submitted At
                    </p>
                    <p className="mt-2 font-semibold">
                      {formatDateTime(selectedSubmission.submittedAt)}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted-text)' }}
                    >
                      Total Score
                    </p>
                    <p
                      className="mt-2 text-2xl font-bold"
                      style={{ color: 'var(--accent)' }}
                    >
                      {selectedSubmission.totalScore}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--muted-text)' }}
                    >
                      Time Spent
                    </p>
                    <p className="mt-2 font-semibold">
                      {selectedSubmission.duration || 0} min
                    </p>
                  </div>
                </div>

                {/* Challenge Solutions */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
                    <Code size={18} />
                    Challenge Solutions
                  </h3>
                  {selectedSubmission.solutions &&
                  selectedSubmission.solutions.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSubmission.solutions.map((solution, idx) => (
                        <div
                          key={`${solution.challengeId}-${idx}`}
                          className="rounded-xl border p-5 shadow-sm"
                          style={{
                            borderColor: 'var(--surface-border)',
                            backgroundColor: 'var(--surface-color)',
                          }}
                        >
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <p
                                className="text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--muted-text)' }}
                              >
                                Challenge
                              </p>
                              <p className="mt-1 font-semibold">
                                {solution.challengeTitle ||
                                  solution.challengeId}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--muted-text)' }}
                              >
                                Score
                              </p>
                              <p
                                className="mt-1 text-2xl font-bold"
                                style={{
                                  color:
                                    solution.score >= 90
                                      ? 'var(--accent)'
                                      : solution.score >= 70
                                        ? '#f59e0b'
                                        : '#ef4444',
                                }}
                              >
                                {solution.score}
                              </p>
                            </div>
                          </div>

                          <div
                            className="mb-4 flex items-center gap-4 text-sm"
                            style={{ color: 'var(--muted-text)' }}
                          >
                            <span>
                              Language:{' '}
                              <span className="font-mono font-semibold">
                                {solution.language}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              Submitted: {formatDateTime(solution.submittedAt)}
                            </span>
                          </div>

                          {solution.results && solution.results.length > 0 && (
                            <div className="mb-4">
                              <p className="mb-2 text-sm font-semibold">
                                Test Results
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {solution.results.map((result, i) => (
                                  <div
                                    key={i}
                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                                    style={{
                                      backgroundColor: result.passed
                                        ? 'rgba(32, 215, 97, 0.15)'
                                        : 'rgba(239, 68, 68, 0.15)',
                                      color: result.passed
                                        ? 'var(--accent)'
                                        : '#ef4444',
                                    }}
                                  >
                                    {result.passed ? '✓' : '✗'} Test {i + 1}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Display code */}
                          <div>
                            <p className="mb-2 text-sm font-semibold">Code</p>
                            <pre
                              className="overflow-x-auto rounded-lg border bg-gray-900 p-4 text-sm text-gray-100"
                              style={{ borderColor: 'var(--surface-border)' }}
                            >
                              <code>{solution.code}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="py-8 text-center"
                      style={{ color: 'var(--muted-text)' }}
                    >
                      <Code
                        size={40}
                        style={{ opacity: 0.3, margin: '0 auto' }}
                      />
                      <p className="mt-2">No solutions found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExamResultAdmin
