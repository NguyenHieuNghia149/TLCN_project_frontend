import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store/stores'
import { ArrowLeft, Lock, Eye, EyeOff, Clock, X } from 'lucide-react'
import Input from '@/components/common/Input/Input'
import { Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
import { useAuth } from '@/hooks/api/useAuth'
import { examService } from '@/services/api/exam.service'
import { setParticipation } from '@/store/slices/examSlice'
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
  const [resumeAvailable, setResumeAvailable] = useState(false)
  const [resumeChallengeId, setResumeChallengeId] = useState<string | null>(
    null
  )

  const dispatch = useDispatch()
  const reduxParticipationId = useSelector(
    (s: RootState) => s.exam?.currentParticipationId
  )
  const reduxStartAt = useSelector(
    (s: RootState) => s.exam?.currentParticipationStartAt
  )

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true)
        if (examId) {
          try {
            const apiExam = await examService.getExamById(examId)

            setExam(apiExam)
            // Attempt to recover an active participation when Redux doesn't have it.
            try {
              const participationId = reduxParticipationId
              const startAtRaw = reduxStartAt

              // If Redux already contains participation info, prefer it (no client storage).
              if (participationId && startAtRaw) {
                // calculate remaining
                const asNumber = Number(startAtRaw)
                let startAtMs: number | null = null
                if (!Number.isNaN(asNumber) && isFinite(asNumber)) {
                  startAtMs = asNumber
                } else {
                  const parsed = Date.parse(String(startAtRaw))
                  if (!Number.isNaN(parsed)) startAtMs = parsed
                }
                if (startAtMs) {
                  const totalSeconds = (apiExam.duration || 0) * 60
                  const elapsed = Math.floor((Date.now() - startAtMs) / 1000)
                  const remaining = Math.max(0, totalSeconds - elapsed)
                  if (remaining > 0) {
                    setResumeAvailable(true)
                    setResumeChallengeId(apiExam.challenges?.[0]?.id ?? null)
                  }
                }
              } else {
                // No Redux participation — ask the server for "my" participation for this exam
                try {
                  const myPartRes = await examService.getMyParticipation(
                    apiExam.id
                  )
                  const part = myPartRes?.data || myPartRes
                  const partId = part?.id || part?.participationId
                  const serverStart =
                    part?.startedAt ||
                    part?.startAt ||
                    part?.startTimestamp ||
                    part?.startedAtMs

                  if (partId) {
                    // Dispatch into Redux (do not persist to any client storage)
                    const startAtValue = serverStart ?? Date.now()
                    try {
                      dispatch(
                        setParticipation({
                          participationId: partId,
                          startAt: startAtValue,
                        })
                      )
                    } catch (e) {
                      console.warn(
                        'Failed to dispatch recovered participation to redux',
                        e
                      )
                    }

                    // compute remaining time and mark resume available if still active
                    let startAtMs: number | null = null
                    const asNumber = Number(startAtValue)
                    if (!Number.isNaN(asNumber) && isFinite(asNumber)) {
                      startAtMs = asNumber
                    } else {
                      const parsed = Date.parse(String(startAtValue))
                      if (!Number.isNaN(parsed)) startAtMs = parsed
                    }
                    if (startAtMs) {
                      const totalSeconds = (apiExam.duration || 0) * 60
                      const elapsed = Math.floor(
                        (Date.now() - startAtMs) / 1000
                      )
                      const remaining = Math.max(0, totalSeconds - elapsed)
                      if (remaining > 0) {
                        setResumeAvailable(true)
                        setResumeChallengeId(
                          apiExam.challenges?.[0]?.id ?? null
                        )
                      }
                    }
                  }
                } catch {
                  // ignore server recovery failure — user will need to join manually
                }
              }
            } catch {
              // ignore resume checks
            }
          } catch (apiErr) {
            console.error('Failed to load exam from API', apiErr)
            setExam(null)
          }
        }
      } catch (error) {
        console.error('Failed to fetch exam:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [examId, reduxParticipationId, reduxStartAt, dispatch])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const handlePasswordSubmit = async () => {
    if (!exam) return

    // 1. Kiểm tra password ở phía Client trước (nếu có)
    if (exam.password && password !== exam.password) {
      setPasswordError('Incorrect password')
      setPassword('') // Reset password field
      return
    }

    try {
      // 2. Gọi API Join Exam
      // Cần await ở đây để đảm bảo join thành công mới đi tiếp
      const res = await examService.joinExam(exam.id, password)

      // 3b. Lưu thời điểm bắt đầu phiên thi để tính thời gian còn lại khi reload
      // Prefer server-provided start time if available, else use local Date.now()
      const startAtRaw =
        res?.data?.startAt || res?.data?.startTimestamp || res?.data?.startedAt
      let startAtValue: number | string = Date.now()
      if (startAtRaw) {
        // If server returns ISO string, store as-is (we'll parse later), if number store as number
        startAtValue = startAtRaw
      }

      // 3. Lưu participationId (quan trọng để backend xác nhận session)
      const participationId =
        res?.data?.id ||
        res?.data?.participationId ||
        res?.participationId ||
        res?.id
      if (participationId) {
        // store in redux first
        try {
          dispatch(setParticipation({ participationId, startAt: startAtValue }))
        } catch (e) {
          console.warn('Failed to dispatch participation to redux', e)
        }
        // NOTE: do NOT persist participationId to localStorage for security.
        // Keep it only in Redux (in-memory) to avoid leaking session identifiers.
      }

      // Do NOT persist `currentExamStartAt` to localStorage for security/privacy.

      setIsVerified(true)
      setShowPasswordModal(false)
      setPassword('')
      setPasswordError('')

      let challenges = exam.challenges || []
      if (challenges.length === 0) {
        try {
          const freshExam = await examService.getExamById(exam.id)
          challenges = freshExam?.challenges || []
          setExam(freshExam)
        } catch (err) {
          console.warn('Could not refetch exam details:', err)
        }
      }

      const firstChallenge = challenges?.[0]
      if (firstChallenge) {
        const examId = exam.id
        const challengeId = firstChallenge.id
        navigate(`/exam/${examId}/challenge/${challengeId}`)
      } else {
        alert('This exam has no challenges configured.')
      }
    } catch (err) {
      console.error('Join exam failed:', err)
      const maybeResp = err as { response?: { status?: number } }
      if (
        maybeResp?.response?.status === 403 ||
        maybeResp?.response?.status === 401
      ) {
        setPasswordError('Incorrect password or access denied')
      } else {
        setPasswordError('Failed to join exam. Please try again.')
      }
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
          {/* {resumeAvailable && resumeChallengeId && (
            <Button
              onClick={() => navigate(`/exam/${exam.id}/challenge/${resumeChallengeId}`)}
              variant="primary"
              size="sm"
            >
              Resume exam
            </Button>
          )} */}
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
            {/* {isActive && !isVerified && (
              <Button onClick={handleStartExam} variant="primary">
                Unlock exam
              </Button>
            )} */}
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
              {resumeAvailable && resumeChallengeId ? (
                <div className="flex flex-col items-center gap-3">
                  <p
                    className="muted mt-2 text-center text-sm"
                    title="Your session is still active on the server; click Resume to continue"
                  >
                    You were disconnected — resume exam to continue your
                    session.
                  </p>
                  <Button
                    onClick={() =>
                      navigate(
                        `/exam/${exam.id}/challenge/${resumeChallengeId}`
                      )
                    }
                    variant="primary"
                    title="Resume your active exam session"
                  >
                    Resume exam
                  </Button>
                </div>
              ) : (
                <Button onClick={handleStartExam} variant="secondary">
                  Verify access
                </Button>
              )}
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
