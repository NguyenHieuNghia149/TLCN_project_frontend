import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Input from '@/components/common/Input/Input'
import Button from '@/components/common/Button/Button'
import { ExamSubmission, Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/api/useAuth'
import { examService } from '@/services/api/exam.service'

const PAGE_SIZE = 10

const ExamResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [, setError] = useState<string | null>(null)
  const { user } = useAuth()

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
          setSubmissions(items)
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

  const getFullName = (firstname?: string, lastname?: string) =>
    [firstname, lastname].filter(Boolean).join(' ') || 'Unknown student'

  const scoreClass = (score: number) => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-600'
    if (score >= 70) return 'bg-amber-100 text-amber-600'
    return 'bg-rose-100 text-rose-600'
  }

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter(submission => {
        const fullName = getFullName(
          submission.user?.firstname,
          submission.user?.lastname
        )
        return fullName.toLowerCase().includes(searchTerm.toLowerCase())
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
          className="rounded-xl border px-8 py-10 text-center"
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
      <div className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="flex flex-wrap items-center gap-3">
          {/* <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            size="sm"
            icon={<ChevronLeft size={16} />}
          >
            Back to exam
          </Button> */}
          <div>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--muted-text)' }}
            >
              Exam results
            </p>
            <h1 className="text-2xl font-semibold">{exam.title}</h1>
          </div>
        </div>

        <section
          className="mt-8 rounded-lg border p-6"
          style={{ borderColor: 'var(--surface-border)' }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Input
              icon={<Search size={16} />}
              placeholder="Search by student name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />

            <div className="text-sm" style={{ color: 'var(--muted-text)' }}>
              {filteredSubmissions.length} submission
              {filteredSubmissions.length === 1 ? '' : 's'}
            </div>
          </div>

          <div
            id="results-table"
            className="mt-6 overflow-x-auto rounded-lg border"
            style={{ borderColor: 'var(--surface-border)' }}
          >
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'var(--surface-border)' }}
                >
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--muted-text)' }}
                  >
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Submitted at
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                    Total score
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm"
                      style={{ color: 'var(--muted-text)' }}
                    >
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  paginatedSubmissions.map((submission, index) => (
                    <tr
                      key={`${submission.id}-${submission.userId}`}
                      className="border-b"
                      style={{
                        borderColor: 'var(--surface-border)',
                        backgroundColor:
                          submission.userId === user?.id
                            ? 'rgba(32, 215, 97, 0.05)'
                            : 'transparent',
                      }}
                    >
                      <td className="px-4 py-4">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getFullName(
                              submission.user?.firstname,
                              submission.user?.lastname
                            )}
                          </span>
                          {submission.userId === user?.id && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{
                                backgroundColor: 'rgba(32, 215, 97, 0.1)',
                                color: 'var(--accent)',
                              }}
                            >
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-4 py-4"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        {formatDateTime(submission.submittedAt)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${scoreClass(
                            submission.totalScore
                          )}`}
                        >
                          {submission.totalScore}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              className="mt-6 flex flex-col items-center gap-4 border-t pt-4 sm:flex-row sm:justify-between"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <div className="text-sm" style={{ color: 'var(--muted-text)' }}>
                Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                {Math.min(page * PAGE_SIZE, filteredSubmissions.length)} of{' '}
                {filteredSubmissions.length} results
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
          )}
        </section>
      </div>
    </div>
  )
}

export default ExamResults
