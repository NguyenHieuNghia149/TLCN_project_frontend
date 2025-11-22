import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Code, Check, X } from 'lucide-react'
import { ExamSubmission } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const ExamSubmissionDetail: React.FC = () => {
  const { examId, submissionId } = useParams<{
    examId: string
    submissionId: string
  }>()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<ExamSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview')

  React.useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true)
        const mockSubmission: ExamSubmission = {
          id: submissionId || '1',
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
          solutions: [
            {
              challengeId: '1',
              code: 'function twoSum(nums, target) {\n  // Solution code here\n}',
              language: 'javascript',
              score: 80,
              results: [
                {
                  testCaseId: '1',
                  passed: true,
                  actualOutput: '[0, 1]',
                  expectedOutput: '[0, 1]',
                },
                {
                  testCaseId: '2',
                  passed: true,
                  actualOutput: '[1, 2]',
                  expectedOutput: '[1, 2]',
                },
              ],
              submittedAt: new Date().toISOString(),
            },
          ],
          totalScore: 80,
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          duration: 60,
        }
        setSubmission(mockSubmission)
      } catch (error) {
        console.error('Failed to fetch submission:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmission()
  }, [examId, submissionId])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!submission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020309] text-gray-200">
        <div className="rounded-3xl border border-white/5 bg-[#05060d] px-12 py-16 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Submission not found
          </h2>
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
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-center gap-4 rounded-[32px] border border-white/5 bg-gradient-to-br from-[#10132a] via-[#090b16] to-[#04050a] p-6 shadow-[0_40px_120px_rgba(3,4,12,0.9)]">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-gray-300 transition hover:border-white/30 hover:bg-white/10"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {submission.user?.firstname} {submission.user?.lastname}
            </h1>
            <p className="text-sm text-gray-400">
              Submitted {formatDate(submission.submittedAt)} • Duration{' '}
              {submission.duration} mins
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/5 bg-[#060812] p-6">
          <div className="flex gap-4 border-b border-white/5 pb-4">
            {(['overview', 'details'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${
                  activeTab === tab
                    ? 'bg-primary-500/20 text-primary-200'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6 pt-6">
              <div className="flex flex-wrap gap-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#0b0f1f] to-[#05060d] p-6">
                <OverviewStat
                  label="Total score"
                  value={`${submission.totalScore}%`}
                />
                <OverviewStat
                  label="Solutions"
                  value={submission.solutions.length}
                />
                <OverviewStat
                  label="Time spent"
                  value={`${submission.duration}m`}
                />
              </div>

              <div className="rounded-3xl border border-white/5 bg-[#05060d] p-6">
                <h3 className="text-lg font-semibold text-white">
                  Challenge results
                </h3>
                <div className="mt-4 space-y-4">
                  {submission.solutions.map((solution, index) => (
                    <div
                      key={solution.challengeId}
                      className="rounded-2xl border border-white/5 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          Challenge {index + 1}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreBadge(
                            solution.score
                          )}`}
                        >
                          {solution.score}%
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                        {solution.results?.map((result, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                              result.passed
                                ? 'bg-emerald-500/10 text-emerald-200'
                                : 'bg-rose-500/10 text-rose-200'
                            }`}
                          >
                            {result.passed ? (
                              <Check size={12} />
                            ) : (
                              <X size={12} />
                            )}
                            Test {idx + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6 pt-6">
              {submission.solutions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#05060d] p-12 text-center text-sm text-gray-400">
                  No solution details available
                </div>
              ) : (
                submission.solutions.map((solution, index) => (
                  <div
                    key={solution.challengeId}
                    className="rounded-3xl border border-white/5 bg-[#05060d] p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Challenge {index + 1}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-300">
                          {solution.language}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreBadge(
                            solution.score
                          )}`}
                        >
                          {solution.score}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                          <Code size={16} />
                          Code
                        </div>
                        <pre className="mt-2 max-h-[320px] overflow-auto rounded-2xl bg-[#0f111a] p-4 text-xs text-gray-200">
                          <code>{solution.code}</code>
                        </pre>
                      </div>

                      {solution.results && (
                        <div className="space-y-3">
                          {solution.results.map((result, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl border border-white/5 bg-white/5 p-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                  Test case {idx + 1}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                    result.passed
                                      ? 'bg-emerald-500/10 text-emerald-200'
                                      : 'bg-rose-500/10 text-rose-200'
                                  }`}
                                >
                                  {result.passed ? (
                                    <Check size={12} />
                                  ) : (
                                    <X size={12} />
                                  )}
                                  {result.passed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                              <div className="mt-4 grid gap-3 text-xs text-gray-300 lg:grid-cols-2">
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
                                    Expected
                                  </p>
                                  <div className="mt-1 rounded-xl bg-[#111426] p-3 text-white">
                                    <code>{result.expectedOutput}</code>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
                                    Actual
                                  </p>
                                  <div className="mt-1 rounded-xl bg-[#111426] p-3 text-white">
                                    <code>{result.actualOutput}</code>
                                  </div>
                                </div>
                              </div>
                              {result.error && (
                                <div className="mt-3 rounded-xl border border-rose-400/40 bg-rose-500/5 p-3 text-xs text-rose-200">
                                  <p className="text-[11px] uppercase tracking-[0.35em]">
                                    Error
                                  </p>
                                  <code>{result.error}</code>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const OverviewStat: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-1 text-white">
    <span className="text-4xl font-semibold">{value}</span>
    <span className="text-xs uppercase tracking-[0.4em] text-gray-500">
      {label}
    </span>
  </div>
)

const scoreBadge = (score: number) => {
  if (score >= 90) return 'bg-emerald-500/10 text-emerald-200'
  if (score >= 80) return 'bg-primary-500/10 text-primary-200'
  if (score >= 70) return 'bg-amber-500/10 text-amber-200'
  if (score >= 60) return 'bg-rose-500/10 text-rose-200'
  return 'bg-rose-600/20 text-rose-100'
}

export default ExamSubmissionDetail
