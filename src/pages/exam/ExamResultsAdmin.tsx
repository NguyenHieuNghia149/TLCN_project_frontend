import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Search, Eye, Trash2 } from 'lucide-react'
import { ExamSubmission, Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/api/useAuth'

const ExamResultsAdmin: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const mockExam: Exam = {
          id: examId || '1',
          title: 'Algorithms Midterm Test',
          password: 'test123',
          duration: 90,
          challenges: [],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'lecturer1',
          createdAt: new Date().toISOString(),
        }

        const mockSubmissions: ExamSubmission[] = [
          {
            id: '1',
            userId: 'student1',
            examId: examId || '1',
            user: {
              id: 'student1',
              firstname: 'John',
              lastname: 'Doe',
              email: 'john@example.com',
              role: 'student',
              avatar: '',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
            solutions: [],
            totalScore: 85,
            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            submittedAt: new Date(
              Date.now() - 1 * 60 * 60 * 1000
            ).toISOString(),
            duration: 60,
          },
          {
            id: '2',
            userId: 'student2',
            examId: examId || '1',
            user: {
              id: 'student2',
              firstname: 'Jane',
              lastname: 'Smith',
              email: 'jane@example.com',
              role: 'student',
              avatar: '',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
            solutions: [],
            totalScore: 92,
            startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            submittedAt: new Date(
              Date.now() - 2 * 60 * 60 * 1000
            ).toISOString(),
            duration: 75,
          },
          {
            id: '3',
            userId: 'student3',
            examId: examId || '1',
            user: {
              id: 'student3',
              firstname: 'Bob',
              lastname: 'Johnson',
              email: 'bob@example.com',
              role: 'student',
              avatar: '',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
            solutions: [],
            totalScore: 78,
            startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            submittedAt: new Date(
              Date.now() - 3 * 60 * 60 * 1000
            ).toISOString(),
            duration: 85,
          },
        ]

        setExam(mockExam)
        setSubmissions(mockSubmissions)
      } catch (error) {
        console.error('Failed to fetch data:', error)
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

  const filteredAndSortedSubmissions = submissions
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
      user.role === 'lecturer' ||
      user.id === exam.createdBy)

  if (!isInstructor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#02030a] px-4 text-gray-100">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/5 bg-[#060812] px-8 py-10 text-center">
          <p className="text-xl font-semibold text-white">
            Instructor access only
          </p>
          <p className="text-sm text-gray-400">
            Switch to the shared results page to see the public summary.
          </p>
          <button
            onClick={() => navigate(`/exam/${examId}/results`)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary-400/40 hover:bg-primary-500/10"
          >
            Go to class view
          </button>
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
    <div className="min-h-screen bg-[#02030a] text-gray-100">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <header className="flex flex-col gap-6 rounded-[32px] border border-white/5 bg-gradient-to-br from-[#10132a] via-[#090b16] to-[#04050a] p-8 shadow-[0_40px_120px_rgba(2,3,8,0.9)] md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-gray-300 transition hover:border-white/30 hover:bg-white/10"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <h1 className="mt-4 text-3xl font-semibold text-white">
              {exam?.title}
            </h1>
            <p className="mt-1 text-sm text-gray-400">Instructor analytics</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-primary-400/40 hover:bg-primary-500/10">
            <Download size={16} />
            Export report
          </button>
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

        <section className="space-y-4 rounded-[32px] border border-white/5 bg-[#060812] p-8 shadow-[0_40px_120px_rgba(2,3,10,0.85)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
                Performance log
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                Student submissions
              </h2>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search student..."
                className="h-12 w-full rounded-2xl border border-white/5 bg-[#0b0f1d] pl-12 pr-4 text-sm text-gray-100 outline-none transition focus:border-primary-400/50 focus:bg-[#11162a]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-white/5">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-gray-400">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <button
                      className="flex items-center gap-2"
                      onClick={() => handleSort('name')}
                    >
                      Student
                      <SortIcon
                        field="name"
                        current={sortBy}
                        order={sortOrder}
                      />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">
                    <button
                      className="flex items-center gap-2"
                      onClick={() => handleSort('score')}
                    >
                      Score
                      <SortIcon
                        field="score"
                        current={sortBy}
                        order={sortOrder}
                      />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">Duration</th>
                  <th className="px-6 py-4 text-left">
                    <button
                      className="flex items-center gap-2"
                      onClick={() => handleSort('date')}
                    >
                      Submitted
                      <SortIcon
                        field="date"
                        current={sortBy}
                        order={sortOrder}
                      />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedSubmissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-gray-500"
                    >
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedSubmissions.map(submission => (
                    <tr
                      key={submission.id}
                      className="border-t border-white/5 text-gray-300 transition hover:bg-white/5"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-white/5" />
                          <span className="text-white">
                            {getFullName(
                              submission.user?.firstname,
                              submission.user?.lastname
                            ) || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {submission.user?.email || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${scoreClass(
                            submission.totalScore
                          )}`}
                        >
                          {submission.totalScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4">{submission.duration} mins</td>
                      <td className="px-6 py-4">
                        {formatDate(submission.submittedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/exam/${examId}/submission/${submission.id}`
                              )
                            }
                            className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:border-primary-400/40 hover:text-white"
                            title="View submission"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="rounded-full border border-rose-400/40 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20"
                            title="Delete submission"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
  const accentClasses =
    accent === 'emerald'
      ? 'from-emerald-500/20 to-emerald-500/5 text-emerald-200'
      : accent === 'rose'
        ? 'from-rose-500/20 to-rose-500/5 text-rose-200'
        : accent === 'primary'
          ? 'from-primary-500/20 to-primary-500/5 text-primary-200'
          : 'from-white/10 to-transparent text-white'

  return (
    <div
      className={`rounded-[28px] border border-white/5 bg-gradient-to-br ${accentClasses} p-5 shadow-[0_30px_90px_rgba(2,3,10,0.85)]`}
    >
      <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
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
