import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store/stores'
import { ArrowLeft, Lock, Eye, EyeOff, Clock, X } from 'lucide-react'
import Input from '@/components/common/Input/Input'
import { Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
// import { useAuth } from '@/hooks/api/useAuth'
import { examService } from '@/services/api/exam.service'
import { setParticipation } from '@/store/slices/examSlice'
// import { canManageExam } from '@/utils/roleUtils'
import './ExamDetail.scss'
import useExamTimer from '@/hooks/useExamTimer'

const ExamDetail: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  // const { user } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [completedParticipation, setCompletedParticipation] = useState<{
    status: string
    id: string
  } | null>(null)

  const dispatch = useDispatch()
  const reduxParticipationId = useSelector(
    (s: RootState) => s.exam?.currentParticipationId
  )
  const reduxParticipationExamId = useSelector(
    (s: RootState) => s.exam?.currentParticipationExamId
  )
  const reduxStartAt = useSelector(
    (s: RootState) => s.exam?.currentParticipationStartAt
  )
  type ExamSliceState = {
    currentParticipationExpiresAt?: number | string | null
  }
  const reduxExpiresAt = useSelector(
    (s: RootState) =>
      (s.exam as unknown as ExamSliceState)?.currentParticipationExpiresAt
  )
  const reduxCurrentChallengeId = useSelector(
    (s: RootState) => s.exam?.currentParticipationChallengeId
  )

  const { remaining: remainingSeconds } = useExamTimer({
    startAt: reduxStartAt,
    expiresAt: reduxExpiresAt,
    durationMinutes: exam?.duration ?? 0,
    enabled: Boolean(reduxParticipationId || reduxStartAt || reduxExpiresAt),
  })

  const resumeAvailable = Boolean(reduxParticipationId && remainingSeconds > 0)

  useEffect(() => {}, [reduxParticipationId, remainingSeconds, resumeAvailable])

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true)
        if (examId) {
          try {
            const apiExam = await examService.getExamById(examId)

            setExam(apiExam)

            // Always attempt to recover active participation from server
            // (Redux is in-memory only, so it's cleared on page reload/navigation)
            try {
              const myPartRes = await examService.getMyParticipation(apiExam.id)
              const part = myPartRes

              if (
                part &&
                (part.status === 'SUBMITTED' ||
                  part.status === 'EXPIRED' ||
                  part.status === 'submitted' ||
                  part.status === 'expired')
              ) {
                setCompletedParticipation({ status: part.status, id: part.id })
              } else {
                setCompletedParticipation(null)
              }

              const partId = part?.id || part?.participationId
              const serverStart =
                part?.startedAt ||
                part?.startAt ||
                part?.startTimestamp ||
                part?.startedAtMs
              const serverExpires =
                part?.expiresAt || part?.expires_at || part?.expires

              if (partId) {
                // Check status for completed exams
                const isCompleted = ['SUBMITTED', 'EXPIRED'].includes(
                  part?.status || ''
                )
                if (isCompleted) {
                  setIsVerified(true) // Treat as verified so we don't show password prompt
                  // Don't dispatch to Redux as active session if completed,
                  // or maybe we do but `ExamChallengeDetail` needs to know it's read-only?
                  // For now, let's just use local state to show "View Results"
                } else {
                  // Active session - dispatch to Redux
                  const startAtValue = serverStart ?? Date.now()
                  try {
                    // Attempt to fetch full participation details to determine current challenge for resume.
                    let currentChallengeId: string | null = null
                    try {
                      const partDetailsRes = await examService.getParticipation(
                        apiExam.id,
                        partId
                      )
                      // Response is ExamParticipation directly
                      const details = partDetailsRes
                      currentChallengeId =
                        details?.currentChallengeId ||
                        details?.currentChallenge ||
                        null
                    } catch (detailErr) {
                      console.warn(
                        'Failed to fetch participation details for resume:',
                        detailErr
                      )
                    }
                    dispatch(
                      setParticipation({
                        participationId: partId,
                        examId: apiExam.id, // Set exam scope
                        startAt: startAtValue,
                        expiresAt: serverExpires ?? null,
                        currentChallengeId,
                      })
                    )
                    setIsVerified(true)
                  } catch (e) {
                    console.warn(
                      'Failed to dispatch recovered participation to redux',
                      e
                    )
                  }
                }
              } else {
                setIsVerified(false)
              }
            } catch (err) {
              // ignore server recovery failure — user will need to join manually
              console.warn('Failed to recover participation from server:', err)
              setIsVerified(false)
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
    // Key: Include examId so recovery happens when we return to this exam
    // Include reduxParticipationId so we don't re-fetch if already recovered
    // dispatch from Redux is stable, safe to omit from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, reduxParticipationId])

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
      const startAtRaw = res?.startAt || res?.startTimestamp || res?.startedAt
      const expiresAtRaw = res?.expiresAt || res?.expires_at
      let startAtValue: number | string = Date.now()
      if (startAtRaw) {
        // If server returns ISO string, store as-is (we'll parse later), if number store as number
        startAtValue = startAtRaw
      }

      // 3. Lưu participationId (quan trọng để backend xác nhận session)
      const participationId = res?.id || res?.participationId
      if (participationId) {
        // store in redux first
        try {
          dispatch(
            setParticipation({
              participationId,
              examId: exam.id,
              startAt: startAtValue,
              expiresAt: expiresAtRaw ?? null,
            })
          )
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

  const now = Date.now()
  const startTime = new Date(exam.startDate).getTime()
  const endTime = new Date(exam.endDate).getTime()

  const hasStarted = now >= startTime
  const hasEnded = now > endTime
  const isActive = hasStarted && !hasEnded
  // const isInstructor = canManageExam(user, exam.createdBy)

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
          {!hasStarted && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                color: '#f59e0b',
              }}
            >
              Not Started Yet
            </span>
          )}
          {hasEnded && (
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
          </div>

          {/* Top-level Continue button removed — we'll show a single Continue in the center */}
          {completedParticipation ? (
            <div
              className="mt-6 flex flex-col items-center justify-center rounded-md border-dashed p-6 text-center"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <h3
                className="mt-2 text-lg font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                You have completed this exam
              </h3>
              <p className="muted mt-2 text-sm">
                Status: {completedParticipation.status}
              </p>
              <Button
                onClick={() => navigate(`/exam/${examId}/results`)}
                variant="primary"
                className="mt-4"
              >
                View Results
              </Button>
            </div>
          ) : !isVerified ? (
            // If user has a resumed session available AND IT BELONGS TO THIS EXAM, show a Continue CTA
            reduxParticipationId &&
            reduxParticipationExamId === exam.id &&
            remainingSeconds > 0 ? (
              <div
                className="mt-6 flex flex-col items-center justify-center rounded-md border-dashed p-6 text-center"
                style={{ borderColor: 'var(--surface-border)' }}
              >
                <Lock size={36} style={{ color: '#10b981' }} />
                <h3
                  className="mt-4 text-lg font-semibold"
                  style={{ color: 'var(--text-color)' }}
                >
                  Resume your session
                </h3>
                <p className="muted mt-2 text-sm">
                  You have an active session. Continue where you left off.
                </p>
                <Button
                  onClick={() => {
                    const continueChallengeId =
                      reduxCurrentChallengeId || exam?.challenges?.[0]?.id
                    if (!continueChallengeId) return
                    navigate(
                      `/exam/${exam?.id}/challenge/${continueChallengeId}`
                    )
                  }}
                  variant="primary"
                  className="mt-4"
                >
                  Continue
                </Button>
              </div>
            ) : (
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
                {!hasStarted && (
                  <p
                    className="mt-2 text-sm font-medium"
                    style={{ color: '#f59e0b' }}
                  >
                    This exam hasn't started yet. Please wait until{' '}
                    {formatDate(exam.startDate)}.
                  </p>
                )}
                <Button
                  onClick={handleStartExam}
                  variant="secondary"
                  className="mt-4"
                  disabled={!isActive}
                >
                  {!hasStarted
                    ? 'Not Available Yet'
                    : hasEnded
                      ? 'Exam Ended'
                      : 'Verify access'}
                </Button>
              </div>
            )
          ) : (
            <div
              className="mt-6 flex flex-col items-center justify-center rounded-md border-dashed p-6 text-center"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <h3
                className="mt-2 text-lg font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                You're verified for this exam
              </h3>
              <p className="muted mt-2 text-sm">
                Click continue to begin or resume your exam.
              </p>
              <Button
                onClick={() => {
                  // Continue to resume or start
                  const continueChallengeId =
                    reduxCurrentChallengeId || exam?.challenges?.[0]?.id
                  if (!continueChallengeId) return
                  navigate(`/exam/${exam?.id}/challenge/${continueChallengeId}`)
                }}
                variant="primary"
                className="mt-4"
              >
                Continue
              </Button>
            </div>
          )}
        </section>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md border border-gray-200 bg-white p-6 text-gray-900 shadow-xl dark:border-white/10 dark:bg-[#0f172a] dark:text-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Enter password</h3>
              <Button
                onClick={() => setShowPasswordModal(false)}
                variant="ghost"
                size="sm"
                className="rounded p-2 text-gray-400"
              >
                <X size={16} />
              </Button>
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
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
