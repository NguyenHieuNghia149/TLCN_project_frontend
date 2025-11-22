import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { ExamSubmission, Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/api/useAuth'

const ExamResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Mock exam data
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

        // Mock submissions data
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

  // Helper to get full name
  const getFullName = (firstname?: string, lastname?: string) => {
    return `${firstname || ''} ${lastname || ''}`.trim()
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

  if (loading) {
    return <LoadingSpinner />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isInstructor =
    !!user &&
    (user.role === 'admin' ||
      user.role === 'lecturer' ||
      (exam ? user.id === exam.createdBy : false))

  return (
    <div className="min-h-screen bg-[#02030a] text-gray-100">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <header className="rounded-[32px] border border-white/5 bg-gradient-to-br from-[#10132a] via-[#090b16] to-[#04050a] p-8 shadow-[0_40px_120px_rgba(2,3,8,0.9)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              <p className="mt-1 text-sm text-gray-400">
                Recently submitted solutions from your cohort
              </p>
            </div>

            {isInstructor && (
              <button
                onClick={() => navigate(`/exam/${examId}/results/manage`)}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-primary-400/40 hover:bg-primary-500/10"
              >
                Open instructor view
              </button>
            )}
          </div>
        </header>

        <section className="rounded-[32px] border border-white/5 bg-[#060812] p-6 shadow-[0_30px_90px_rgba(2,3,10,0.85)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
                Submissions
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Who has turned in?
              </h2>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search student..."
                className="h-11 w-full rounded-2xl border border-white/5 bg-[#0b0f1d] pl-11 pr-4 text-sm text-gray-100 outline-none transition focus:border-primary-400/50 focus:bg-[#11162a]"
              />
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-gray-400">
              No one has submitted yet. Your results will appear here once
              classmates finish.
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {filteredSubmissions.map(submission => (
                <li
                  key={submission.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-5 py-4 text-sm text-gray-300"
                >
                  <div>
                    <p className="text-base font-semibold text-white">
                      {getFullName(
                        submission.user?.firstname,
                        submission.user?.lastname
                      ) || 'Unknown student'}
                    </p>
                    <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                      {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500">
                      Total score
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${scoreClass(
                        submission.totalScore
                      )}`}
                    >
                      {submission.totalScore}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default ExamResults

const scoreClass = (score: number) => {
  if (score >= 90) return 'bg-emerald-500/15 text-emerald-200'
  if (score >= 80) return 'bg-primary-500/15 text-primary-200'
  if (score >= 70) return 'bg-amber-500/15 text-amber-200'
  if (score >= 60) return 'bg-rose-500/15 text-rose-200'
  return 'bg-rose-600/20 text-rose-100'
}
