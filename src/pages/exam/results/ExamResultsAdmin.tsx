import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Input from '@/components/common/Input/Input'
import { examService } from '@/services/api/exam.service'
import { ExamSubmission, Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
import { useAuth } from '@/hooks/api/useAuth'

const PAGE_SIZE = 10

const ExamResultsAdmin: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const { user } = useAuth()
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        if (!examId) return
        const apiExam = await examService.getExamById(examId)
        setExam(apiExam)

        const lb = await examService.getLeaderboard(examId, 1000, 0)
        const items: ExamSubmission[] =
          (lb && (lb as unknown as { data?: ExamSubmission[] }).data) ||
          (lb as unknown as ExamSubmission[]) ||
          []
        setSubmissions(items)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('Failed to load exam results')
        setSubmissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [examId])

  const getFullName = (firstname?: string, lastname?: string) =>
    `${firstname || ''} ${lastname || ''}`.trim()

  const handleSort = (field: 'name' | 'score' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const filteredAndSortedSubmissions = useMemo(() => {
    return submissions
      .filter(submission => {
        const fullName = getFullName(
          submission.user?.firstname,
          submission.user?.lastname
        )
        return fullName.toLowerCase().includes(searchTerm.toLowerCase())
      })
      .sort((a, b) => {
        let compareValue = 0

        switch (sortBy) {
          case 'name': {
            const nameA = getFullName(a.user?.firstname, a.user?.lastname)
            const nameB = getFullName(b.user?.firstname, b.user?.lastname)
            compareValue = nameA.localeCompare(nameB)
            break
          }
          case 'score':
            compareValue = a.totalScore - b.totalScore
            break
          case 'date':
            compareValue =
              new Date(a.submittedAt).getTime() -
              new Date(b.submittedAt).getTime()
            break
        }

        return sortOrder === 'asc' ? compareValue : -compareValue
      })
  }, [submissions, searchTerm, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSubmissions.length / PAGE_SIZE)
  const paginatedSubmissions = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredAndSortedSubmissions.slice(startIndex, endIndex)
  }, [filteredAndSortedSubmissions, page])

  // Reset to page 1 when search term or sort changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortBy, sortOrder])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const calculateStatistics = () => {
    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
      }
    }

    const scores = submissions.map(s => s.totalScore)
    return {
      totalSubmissions: submissions.length,
      averageScore: Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      ),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
    }
  }

  const stats = calculateStatistics()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#02030a] text-gray-100">
        <div className="rounded-3xl border border-white/5 bg-[#060812] px-10 py-12 text-center">
          <p className="text-xl font-semibold text-white">Exam not found</p>
        </div>
      </div>
    )
  }

  const isInstructor =
    !!user &&
    (user.role === 'admin' ||
      user.role === 'teacher' ||
      user.id === exam.createdBy)

  // For development: allow access for testing
  // In production, this should be removed and only allow actual instructors
  const allowAccess = isInstructor || process.env.NODE_ENV === 'development'

  if (!allowAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#02030a] px-4 text-gray-100">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/5 bg-[#060812] px-8 py-10 text-center">
          <p className="text-xl font-semibold text-white">
            Instructor access only
          </p>
          <p className="text-sm text-gray-400">
            Switch to the shared results page to see the public summary.
          </p>
          <Button
            onClick={() => navigate(`/exam/${examId}/results`)}
            variant="secondary"
            className="w-full"
          >
            Go to class view
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
        transition: 'background-color 200ms ease, color 200ms ease',
      }}
    >
      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 md:py-10">
        <header
          className="flex flex-col gap-6 rounded-lg border p-6 md:flex-row md:items-center md:justify-between md:p-8"
          style={{
            backgroundColor: 'var(--card-color)',
            borderColor: 'var(--surface-border)',
            transition: 'background-color 200ms ease, border-color 200ms ease',
          }}
        >
          <div>
            <Button
              onClick={() => navigate(-1)}
              variant="secondary"
              size="sm"
              icon={<ArrowLeft size={14} />}
            >
              Back
            </Button>
            <h1
              className="mt-4 text-2xl font-semibold md:text-3xl"
              style={{ color: 'var(--text-color)' }}
            >
              {exam?.title}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted-text)' }}>
              Instructor analytics
            </p>
          </div>
          <Button variant="secondary" size="md" icon={<Download size={16} />}>
            Export report
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total submissions" value={stats.totalSubmissions} />
          <StatCard
            label="Average score"
            value={`${stats.averageScore}%`}
            accent="primary"
          />
          <StatCard
            label="Highest score"
            value={`${stats.highestScore}%`}
            accent="emerald"
          />
          <StatCard
            label="Lowest score"
            value={`${stats.lowestScore}%`}
            accent="rose"
          />
        </section>

        <section
          className="space-y-4 rounded-lg border p-6 md:p-8"
          style={{
            backgroundColor: 'var(--exam-panel-bg)',
            borderColor: 'var(--surface-border)',
            transition: 'background-color 200ms ease, border-color 200ms ease',
          }}
        >
          {error && (
            <div className="mb-2 rounded-md bg-rose-900/30 px-4 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: 'var(--muted-text)' }}
              >
                Performance log
              </p>
              <h2
                className="mt-1 text-xl font-semibold md:text-2xl"
                style={{ color: 'var(--text-color)' }}
              >
                Student submissions
              </h2>
            </div>
            <div className="w-full md:w-auto">
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search student..."
                icon={<Search size={16} />}
                className="w-full"
              />
            </div>
          </div>

          <div
            className="overflow-x-auto rounded-lg border"
            style={{ borderColor: 'var(--surface-border)' }}
          >
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead
                className="text-xs uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--exam-toolbar-bg)',
                  color: 'var(--muted-text)',
                }}
              >
                <tr>
                  <th className="px-6 py-4 text-left">#</th>
                  <th className="px-6 py-4 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleSort('name')}
                    >
                      Student
                      <SortIcon
                        field="name"
                        current={sortBy}
                        order={sortOrder}
                      />
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleSort('score')}
                    >
                      Score
                      <SortIcon
                        field="score"
                        current={sortBy}
                        order={sortOrder}
                      />
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-left">Duration</th>
                  <th className="px-6 py-4 text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => handleSort('date')}
                    >
                      Submitted
                      <SortIcon
                        field="date"
                        current={sortBy}
                        order={sortOrder}
                      />
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm"
                      style={{ color: 'var(--muted-text)' }}
                    >
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((submission, index) => (
                    <tr
                      key={`${submission.id}-${submission.userId}-${(page - 1) * PAGE_SIZE + index}`}
                      className="border-t transition-colors"
                      style={{
                        borderColor: 'var(--surface-border)',
                        color: 'var(--text-color)',
                        backgroundColor:
                          index % 2 === 0
                            ? 'var(--exam-panel-bg)'
                            : 'var(--editor-bg)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor =
                          'var(--editor-bg)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor =
                          index % 2 === 0
                            ? 'var(--exam-panel-bg)'
                            : 'var(--editor-bg)'
                      }}
                    >
                      <td
                        className="px-4 py-3 text-sm md:px-6 md:py-4"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full"
                            style={{ backgroundColor: 'var(--editor-bg)' }}
                          />
                          <span style={{ color: 'var(--text-color)' }}>
                            {getFullName(
                              submission.user?.firstname,
                              submission.user?.lastname
                            ) || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 md:px-6 md:py-4"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        {submission.user?.email || '—'}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${scoreClass(
                            submission.totalScore
                          )}`}
                        >
                          {submission.totalScore}%
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 md:px-6 md:py-4"
                        style={{ color: 'var(--text-color)' }}
                      >
                        {submission.duration} mins
                      </td>
                      <td
                        className="px-4 py-3 md:px-6 md:py-4"
                        style={{ color: 'var(--text-color)' }}
                      >
                        {formatDate(submission.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() =>
                              navigate(
                                `/exam/${examId}/submission/${submission.id}`
                              )
                            }
                            variant="ghost"
                            className="rounded-full p-2"
                            title="View submission"
                            size="sm"
                          >
                            <Eye size={16} />
                          </Button>
                          {/* <Button
                            variant="outline"
                            className="rounded-full p-2"
                            title="Delete submission"
                            size="sm"
                          >
                            <Trash2 size={16} />
                          </Button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="mt-6 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <div className="text-sm" style={{ color: 'var(--muted-text)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(
                  page * PAGE_SIZE,
                  filteredAndSortedSubmissions.length
                )}{' '}
                of {filteredAndSortedSubmissions.length} submissions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="secondary"
                  size="sm"
                  icon={<ChevronLeft size={16} />}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    pageNum => {
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= Math.max(1, page - 1) &&
                          pageNum <= Math.min(totalPages, page + 1))
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className="min-w-[2.5rem] rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                            style={{
                              borderColor:
                                page === pageNum
                                  ? 'var(--accent)'
                                  : 'var(--surface-border)',
                              backgroundColor:
                                page === pageNum
                                  ? 'rgba(32, 215, 97, 0.1)'
                                  : 'transparent',
                              color:
                                page === pageNum
                                  ? 'var(--accent)'
                                  : 'var(--text-color)',
                            }}
                            onMouseEnter={e => {
                              if (page !== pageNum) {
                                e.currentTarget.style.backgroundColor =
                                  'var(--exam-panel-bg)'
                              }
                            }}
                            onMouseLeave={e => {
                              if (page !== pageNum) {
                                e.currentTarget.style.backgroundColor =
                                  'transparent'
                              }
                            }}
                          >
                            {pageNum}
                          </button>
                        )
                      } else if (pageNum === page - 2 || pageNum === page + 2) {
                        return (
                          <span
                            key={pageNum}
                            className="px-2 text-sm"
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
                  <span className="flex items-center gap-2">
                    Next
                    <ChevronRight size={16} />
                  </span>
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

interface SortIconProps {
  field: 'name' | 'score' | 'date'
  current: 'name' | 'score' | 'date'
  order: 'asc' | 'desc'
}

const SortIcon: React.FC<SortIconProps> = ({ field, current, order }) => {
  if (field !== current) {
    return <span className="text-gray-600">⇅</span>
  }
  return <span className="text-primary-300">{order === 'asc' ? '↑' : '↓'}</span>
}

// function getScoreLevel(score: number): string {
//   if (score >= 90) return 'excellent'
//   if (score >= 80) return 'good'
//   if (score >= 70) return 'fair'
//   if (score >= 60) return 'poor'
//   return 'fail'
// }

export default ExamResultsAdmin

const StatCard: React.FC<{
  label: string
  value: string | number
  accent?: 'primary' | 'emerald' | 'rose'
}> = ({ label, value, accent }) => {
  const accentColor =
    accent === 'emerald'
      ? '#10b981'
      : accent === 'rose'
        ? '#ef4444'
        : accent === 'primary'
          ? 'var(--accent)'
          : 'var(--text-color)'

  return (
    <div
      className="rounded-lg border p-5"
      style={{
        borderColor: 'var(--surface-border)',
        backgroundColor: 'var(--exam-panel-bg)',
        transition: 'background-color 200ms ease, border-color 200ms ease',
      }}
    >
      <p
        className="text-xs uppercase tracking-wider"
        style={{ color: 'var(--muted-text)' }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold md:text-3xl"
        style={{ color: accentColor }}
      >
        {value}
      </p>
    </div>
  )
}

const scoreClass = (score: number) => {
  if (score >= 90) return 'bg-emerald-500/15 text-emerald-200'
  if (score >= 80) return 'bg-primary-500/15 text-primary-200'
  if (score >= 70) return 'bg-amber-500/15 text-amber-200'
  if (score >= 60) return 'bg-rose-500/15 text-rose-200'
  return 'bg-rose-600/20 text-rose-100'
}
