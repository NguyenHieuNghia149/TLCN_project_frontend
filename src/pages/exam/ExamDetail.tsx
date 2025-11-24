import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, EyeOff, Clock, X } from 'lucide-react'
import Input from '@/components/common/Input/Input'
import { Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
import { useAuth } from '@/hooks/api/useAuth'
import { buildMockExam } from '@/mocks/exam.mock'
import { canManageExam } from '@/utils/roleUtils'
import './ExamDetail.scss'

const ExamDetail: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true)
        const mockExam: Exam = buildMockExam({
          id: examId || 'exam-001',
        })
        setExam(mockExam)
      } catch (error) {
        console.error('Failed to fetch exam:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [examId])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const handlePasswordSubmit = () => {
    if (!exam) return

    if (password === exam.password) {
      setIsVerified(true)
      setShowPasswordModal(false)
      setPassword('')
      setPasswordError('')
    } else {
      setPasswordError('Incorrect password')
      setPassword('')
    }
  }

  const handleStartExam = () => {
    if (!isVerified) {
      setShowPasswordModal(true)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03040a] text-gray-300">
        <div className="rounded-3xl border border-white/5 bg-[#070912] px-10 py-12 text-center">
          <h2 className="text-2xl font-semibold text-white">Exam not found</h2>
        </div>
      </div>
    )
  }

  const isActive = Date.now() < new Date(exam.endDate).getTime()
  const isInstructor = canManageExam(user, exam.createdBy)

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            size="sm"
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
          {!isActive && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(240, 68, 68, 0.06)',
                color: 'var(--muted-text)',
              }}
            >
              Exam Closed
            </span>
          )}
          {isInstructor && (
            <Button
              onClick={() => navigate(`/exam/${exam.id}/results/manage`)}
              variant="secondary"
              size="sm"
            >
              Instructor stats
            </Button>
          )}
        </div>

        <section className="card p-6">
          <p className="muted text-xs uppercase tracking-wider">
            Secure session
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1
                className="text-2xl font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                {exam.title}
              </h1>
              <p className="muted mt-2 text-sm">
                {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <InfoBadge
                icon={<Clock size={16} />}
                label="Duration"
                value={`${exam.duration} mins`}
              />
              <InfoBadge
                icon={<Lock size={16} />}
                label="Access"
                value="Password required"
              />
              <InfoBadge
                label="Challenges"
                value={`${exam.challenges?.length || 0}`}
              />
            </div>
          </div>
        </section>

        <section
          className="rounded-lg border p-6"
          style={{
            borderColor: 'var(--surface-border)',
            backgroundColor: 'var(--exam-panel-bg)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="muted text-xs uppercase tracking-wider">
                Exam playlist
              </p>
              <h2
                className="mt-2 text-lg font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                Challenges overview
              </h2>
            </div>
            {isActive && !isVerified && (
              <Button onClick={handleStartExam} variant="primary">
                Unlock exam
              </Button>
            )}
          </div>

          {isActive && !isVerified ? (
            <div
              className="mt-6 flex flex-col items-center justify-center rounded-md border-dashed p-6 text-center"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <Lock size={36} style={{ color: '#f59e0b' }} />
              <h3
                className="mt-4 text-lg font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                Enter password to preview challenges
              </h3>
              <p className="muted mt-2 text-sm">
                This session is locked to prevent unauthorized access.
              </p>
              <Button onClick={handleStartExam} variant="secondary">
                Verify access
              </Button>
            </div>
          ) : (
            <div
              className="mt-6 overflow-hidden rounded-md border"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead
                    style={{
                      backgroundColor: 'var(--exam-toolbar-bg)',
                      borderBottom: '1px solid var(--surface-border)',
                    }}
                  >
                    <tr>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        #
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        Challenge
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        Topic
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        Difficulty
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        Status
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exam.challenges?.map((challenge, index) => (
                      <tr
                        key={challenge.id}
                        className="border-b transition-colors hover:bg-opacity-50"
                        style={{
                          borderColor: 'var(--surface-border)',
                          backgroundColor:
                            index % 2 === 0
                              ? 'var(--exam-panel-bg)'
                              : 'var(--editor-bg)',
                        }}
                      >
                        <td
                          className="px-4 py-3 text-sm font-medium"
                          style={{ color: 'var(--text-color)' }}
                        >
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div
                              className="text-sm font-semibold"
                              style={{ color: 'var(--text-color)' }}
                            >
                              {challenge.title}
                            </div>
                            <div className="muted mt-1 line-clamp-1 text-xs">
                              {challenge.description}
                            </div>
                          </div>
                        </td>
                        <td className="muted px-4 py-3 text-sm">
                          {challenge.topic}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase"
                            style={{
                              backgroundColor:
                                challenge.difficulty === 'easy'
                                  ? 'rgba(16, 185, 129, 0.1)'
                                  : challenge.difficulty === 'medium'
                                    ? 'rgba(251, 191, 36, 0.1)'
                                    : 'rgba(239, 68, 68, 0.1)',
                              color:
                                challenge.difficulty === 'easy'
                                  ? '#10b981'
                                  : challenge.difficulty === 'medium'
                                    ? '#f59e0b'
                                    : '#ef4444',
                              border: '1px solid var(--surface-border)',
                            }}
                          >
                            {challenge.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="muted text-xs">Not started</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            onClick={() =>
                              navigate(
                                `/exam/${exam.id}/challenge/${challenge.id}/preview`
                              )
                            }
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-md border p-6"
            style={{
              borderColor: 'var(--surface-border)',
              backgroundColor: 'var(--exam-panel-bg)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                Enter password
              </h3>
              <Button
                onClick={() => setShowPasswordModal(false)}
                variant="ghost"
                size="sm"
                className="rounded p-2 text-gray-400"
              >
                <X size={16} />
              </Button>
            </div>

            <p className="muted mt-4 text-sm">
              This exam is protected. Request the access password from your
              mentor.
            </p>

            <div className="mt-6 space-y-2">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => {
                  setPassword(event.target.value)
                  setPasswordError('')
                }}
                onKeyDown={event =>
                  event.key === 'Enter' && handlePasswordSubmit()
                }
                placeholder="Exam password"
                rightButton={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                }
                error={passwordError}
                className="w-full"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowPasswordModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                variant="primary"
                className="flex-1"
              >
                Unlock
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const InfoBadge: React.FC<{
  icon?: React.ReactNode
  label: string
  value: string
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm">
    {icon && <span className="text-primary-200">{icon}</span>}
    <div>
      <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500">
        {label}
      </p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  </div>
)

export default ExamDetail
