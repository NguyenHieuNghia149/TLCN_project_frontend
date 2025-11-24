import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Code, Check, X } from 'lucide-react'
import { ExamSubmission } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'

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
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
        transition: 'background-color 200ms ease, color 200ms ease',
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-10">
        <div
          className="flex flex-wrap items-center gap-4 rounded-md border p-4 md:p-6"
          style={{
            borderColor: 'var(--surface-border)',
            backgroundColor: 'var(--exam-panel-bg)',
            transition: 'background-color 200ms ease, border-color 200ms ease',
          }}
        >
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            size="sm"
            icon={<ArrowLeft size={14} />}
          >
            Back
          </Button>
          <div>
            <h1
              className="text-lg font-semibold md:text-xl"
              style={{ color: 'var(--text-color)' }}
            >
              {submission.user?.firstname} {submission.user?.lastname}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted-text)' }}>
              Submitted {formatDate(submission.submittedAt)} • Duration{' '}
              {submission.duration} mins
            </p>
          </div>
        </div>

        <div
          className="rounded-md border p-4 md:p-6"
          style={{
            borderColor: 'var(--surface-border)',
            backgroundColor: 'var(--exam-panel-bg)',
            transition: 'background-color 200ms ease, border-color 200ms ease',
          }}
        >
          <div
            className="flex gap-4 border-b pb-4"
            style={{ borderColor: 'var(--surface-border)' }}
          >
            {(['overview', 'details'] as const).map(tab => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                style={{
                  color:
                    activeTab === tab
                      ? 'var(--text-color)'
                      : 'var(--muted-text)',
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6 pt-4">
              <div
                className="flex flex-wrap gap-6 rounded-md border p-4 md:p-6"
                style={{
                  borderColor: 'var(--surface-border)',
                  backgroundColor: 'var(--editor-bg)',
                  transition:
                    'background-color 200ms ease, border-color 200ms ease',
                }}
              >
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

              <div
                className="rounded-md border p-4 md:p-6"
                style={{
                  borderColor: 'var(--surface-border)',
                  backgroundColor: 'var(--editor-bg)',
                  transition:
                    'background-color 200ms ease, border-color 200ms ease',
                }}
              >
                <h3
                  className="text-lg font-semibold md:text-xl"
                  style={{ color: 'var(--text-color)' }}
                >
                  Challenge results
                </h3>
                <div className="mt-4 space-y-4">
                  {submission.solutions.map((solution, index) => (
                    <div
                      key={solution.challengeId}
                      className="rounded-md border p-4"
                      style={{
                        borderColor: 'var(--surface-border)',
                        backgroundColor: 'var(--exam-panel-bg)',
                        transition:
                          'background-color 200ms ease, border-color 200ms ease',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm"
                          style={{ color: 'var(--muted-text)' }}
                        >
                          Challenge {index + 1}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreBadge(solution.score)}`}
                        >
                          {solution.score}%
                        </span>
                      </div>
                      <div
                        className="mt-3 flex flex-wrap gap-2 text-xs"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        {solution.results?.map((result, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1"
                            style={{
                              backgroundColor: result.passed
                                ? 'rgba(16,185,129,0.1)'
                                : 'rgba(240,68,68,0.1)',
                              border: `1px solid ${result.passed ? 'rgba(16,185,129,0.3)' : 'rgba(240,68,68,0.3)'}`,
                            }}
                          >
                            {result.passed ? (
                              <Check size={12} />
                            ) : (
                              <X size={12} />
                            )}{' '}
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
            <div className="space-y-6 pt-4">
              {submission.solutions.length === 0 ? (
                <div
                  className="rounded-md border-dashed p-6 text-center"
                  style={{
                    borderColor: 'var(--surface-border)',
                    color: 'var(--muted-text)',
                  }}
                >
                  No solution details available
                </div>
              ) : (
                submission.solutions.map((solution, index) => (
                  <div
                    key={solution.challengeId}
                    className="rounded-md border p-4 md:p-6"
                    style={{
                      borderColor: 'var(--surface-border)',
                      backgroundColor: 'var(--editor-bg)',
                      transition:
                        'background-color 200ms ease, border-color 200ms ease',
                    }}
                  >
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"
                      style={{ borderColor: 'var(--surface-border)' }}
                    >
                      <h3
                        className="text-lg font-semibold md:text-xl"
                        style={{ color: 'var(--text-color)' }}
                      >
                        Challenge {index + 1}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full border px-3 py-1 text-xs uppercase tracking-wider"
                          style={{
                            borderColor: 'var(--surface-border)',
                            color: 'var(--muted-text)',
                          }}
                        >
                          {solution.language}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreBadge(solution.score)}`}
                        >
                          {solution.score}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <div
                          className="flex items-center gap-2 text-sm font-semibold"
                          style={{ color: 'var(--text-color)' }}
                        >
                          <Code size={16} />
                          Code
                        </div>
                        <pre
                          className="mt-2 max-h-[320px] overflow-auto rounded-md border p-4"
                          style={{
                            backgroundColor: 'var(--exam-panel-bg)',
                            color: 'var(--text-color)',
                            borderColor: 'var(--surface-border)',
                          }}
                        >
                          <code>{solution.code}</code>
                        </pre>
                      </div>

                      {solution.results && (
                        <div className="space-y-3">
                          {solution.results.map((result, idx) => (
                            <div
                              key={idx}
                              className="rounded-md border p-4"
                              style={{
                                borderColor: 'var(--surface-border)',
                                backgroundColor: 'var(--exam-panel-bg)',
                                transition:
                                  'background-color 200ms ease, border-color 200ms ease',
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-sm"
                                  style={{ color: 'var(--muted-text)' }}
                                >
                                  Test case {idx + 1}
                                </span>
                                <span
                                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
                                  style={{
                                    backgroundColor: result.passed
                                      ? 'rgba(16,185,129,0.1)'
                                      : 'rgba(240,68,68,0.1)',
                                    borderColor: result.passed
                                      ? 'rgba(16,185,129,0.3)'
                                      : 'rgba(240,68,68,0.3)',
                                  }}
                                >
                                  {result.passed ? (
                                    <Check size={12} />
                                  ) : (
                                    <X size={12} />
                                  )}
                                  {result.passed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                              <div className="mt-4 grid gap-3 text-sm lg:grid-cols-2">
                                <div>
                                  <p
                                    className="text-xs uppercase tracking-wider"
                                    style={{ color: 'var(--muted-text)' }}
                                  >
                                    Expected
                                  </p>
                                  <div
                                    className="mt-1 rounded-md border p-3"
                                    style={{
                                      backgroundColor: 'var(--editor-bg)',
                                      borderColor: 'var(--surface-border)',
                                    }}
                                  >
                                    <code
                                      style={{ color: 'var(--text-color)' }}
                                    >
                                      {result.expectedOutput}
                                    </code>
                                  </div>
                                </div>
                                <div>
                                  <p
                                    className="text-xs uppercase tracking-wider"
                                    style={{ color: 'var(--muted-text)' }}
                                  >
                                    Actual
                                  </p>
                                  <div
                                    className="mt-1 rounded-md border p-3"
                                    style={{
                                      backgroundColor: 'var(--editor-bg)',
                                      borderColor: 'var(--surface-border)',
                                    }}
                                  >
                                    <code
                                      style={{ color: 'var(--text-color)' }}
                                    >
                                      {result.actualOutput}
                                    </code>
                                  </div>
                                </div>
                              </div>
                              {result.error && (
                                <div
                                  className="mt-3 rounded-md border p-3"
                                  style={{
                                    backgroundColor: 'rgba(240,68,68,0.1)',
                                    borderColor: 'rgba(240,68,68,0.3)',
                                  }}
                                >
                                  <p
                                    className="text-xs uppercase tracking-wider"
                                    style={{ color: 'var(--muted-text)' }}
                                  >
                                    Error
                                  </p>
                                  <code style={{ color: '#ef4444' }}>
                                    {result.error}
                                  </code>
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
  <div className="flex flex-1 flex-col items-center justify-center gap-1">
    <span
      className="text-3xl font-semibold md:text-4xl"
      style={{ color: 'var(--text-color)' }}
    >
      {value}
    </span>
    <span
      className="text-xs uppercase tracking-wider"
      style={{ color: 'var(--muted-text)' }}
    >
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
