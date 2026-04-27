import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/api/useAuth'
import ExamEntryLobbyPanel from '@/pages/exam/access/components/ExamEntryLobbyPanel'
import ExamEntryStatusPanel from '@/pages/exam/access/components/ExamEntryStatusPanel'
import ExamEntryVerificationPanel from '@/pages/exam/access/components/ExamEntryVerificationPanel'
import { isLegacyExamId } from '@/pages/exam/legacy/legacy-exam-redirect'
import { examService } from '@/services/api/exam.service'
import { tokenManager } from '@/services/auth/token.service'
import { setParticipation } from '@/store/slices/examSlice'
import { initializeSession } from '@/store/slices/authSlice'
import type { AppDispatch } from '@/store/stores'
import type {
  ExamAccessState,
  ExamInviteResolution,
  PublicExamLanding,
} from '@/types/exam.types'
import {
  computeEntryBlockReasons,
  resolveEntryPanelKind,
} from './exam-entry-reasons'

function isFullAccessState(
  value: ExamAccessState | ExamInviteResolution | null
): value is ExamAccessState {
  return !!value && 'examId' in value
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString()
}

function extractApiErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: unknown
            error?: {
              message?: unknown
            }
          }
        }
      }
    ).response
    const message = response?.data?.message
    const nestedErrorMessage = response?.data?.error?.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
    if (typeof nestedErrorMessage === 'string' && nestedErrorMessage.trim()) {
      return nestedErrorMessage
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

const ExamAccessPage: React.FC = () => {
  const { examSlug = '' } = useParams<{ examSlug: string }>()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useAuth()

  const isEntryRoute = location.pathname.endsWith('/entry')

  const [exam, setExam] = useState<PublicExamLanding | null>(null)
  const [accessState, setAccessState] = useState<ExamAccessState | null>(null)
  const [inviteState, setInviteState] = useState<ExamInviteResolution | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [resolvedInviteToken, setResolvedInviteToken] = useState<string | null>(
    null
  )

  const [registrationForm, setRegistrationForm] = useState({
    email: user?.email ?? '',
    fullName:
      [user?.firstname, user?.lastname].filter(Boolean).join(' ').trim() || '',
    examPassword: '',
  })
  const [otpForm, setOtpForm] = useState({
    email: user?.email ?? '',
    otp: '',
  })

  const refreshAccessState = useCallback(async () => {
    if (!examSlug) return
    const state = await examService.getExamAccessState(examSlug)
    setAccessState(state)
    if (state?.participantId) {
      setInviteState(null)
    }
  }, [examSlug])

  useEffect(() => {
    setRegistrationForm(current => ({
      ...current,
      email: current.email || user?.email || '',
      fullName:
        current.fullName ||
        [user?.firstname, user?.lastname].filter(Boolean).join(' ').trim(),
    }))
    setOtpForm(current => ({
      ...current,
      email: current.email || user?.email || '',
    }))
  }, [user])

  useEffect(() => {
    if (!examSlug) {
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const examResult = await examService.getPublicExam(examSlug)
        if (cancelled) return
        setExam(examResult)
        await refreshAccessState()
      } catch (err: unknown) {
        if (cancelled) return
        if (isLegacyExamId(examSlug)) {
          try {
            const legacyExam = await examService.getExamById(examSlug)
            if (legacyExam?.slug && legacyExam.slug !== examSlug) {
              const legacyPath = isEntryRoute
                ? `/exam/${legacyExam.slug}/entry${location.search}`
                : `/exam/${legacyExam.slug}${location.search}`
              navigate(legacyPath, { replace: true })
              return
            }
          } catch {
            // Ignore fallback failures and surface original error below.
          }
        }
        setError(extractApiErrorMessage(err, 'Failed to load exam details'))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [examSlug, isEntryRoute, location.search, navigate, refreshAccessState])

  useEffect(() => {
    if (!examSlug || !inviteToken) {
      return
    }
    if (resolvedInviteToken === inviteToken) {
      return
    }

    let cancelled = false

    const resolveInvite = async () => {
      try {
        const result = await examService.resolveInvite(examSlug, inviteToken)
        if (cancelled) return

        if (isFullAccessState(result)) {
          setAccessState(result)
          setInviteState(null)
        } else {
          setInviteState(result)
        }

        setResolvedInviteToken(inviteToken)
      } catch (err: unknown) {
        if (cancelled) return
        setError(
          extractApiErrorMessage(err, 'Invite link is invalid or expired')
        )
      }
    }

    void resolveInvite()

    return () => {
      cancelled = true
    }
  }, [examSlug, inviteToken, resolvedInviteToken])

  useEffect(() => {
    if (otpCooldown <= 0) return
    const timer = window.setInterval(() => {
      setOtpCooldown(current => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [otpCooldown])

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!examSlug) return
    try {
      setActionLoading(true)
      setError(null)
      const result = await examService.registerForExam(
        examSlug,
        registrationForm
      )
      setAccessState(result)
      setInviteState(null)
      setOtpForm(current => ({
        ...current,
        email: registrationForm.email,
      }))
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Failed to register for this exam'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!examSlug || !otpForm.email) return
    try {
      setActionLoading(true)
      setError(null)
      const result = await examService.sendExamOtp(examSlug, otpForm.email)
      setOtpCooldown(result.cooldownSeconds)
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Failed to send OTP'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!examSlug) return
    try {
      setActionLoading(true)
      setError(null)
      const result = await examService.verifyExamOtp(examSlug, otpForm)
      if (result.tokens?.accessToken) {
        tokenManager.setAccessToken(result.tokens.accessToken)
      }
      await dispatch(initializeSession()).unwrap()
      await refreshAccessState()
      setAccessState(result)
      setInviteState(null)
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Failed to verify OTP'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartOrResume = async () => {
    const entrySessionId =
      accessState?.entrySessionId || inviteState?.entrySessionId
    if (!entrySessionId || !examSlug || !exam?.id) {
      return
    }

    const nowMs = Date.now()
    const examEndMs = new Date(exam.endDate).getTime()
    const examBlocked =
      exam.status !== 'published' ||
      nowMs > examEndMs ||
      accessState?.accessStatus === 'completed' ||
      accessState?.accessStatus === 'revoked'
    if (examBlocked) {
      setError('Exam is closed. You can no longer enter the workspace.')
      return
    }

    try {
      setActionLoading(true)
      setError(null)
      const result = await examService.startEntrySession(entrySessionId)
      if (!result.firstChallengeId) {
        throw new Error('Exam does not have any configured challenge.')
      }

      dispatch(
        setParticipation({
          participationId: result.participationId,
          examId: exam.id,
          expiresAt: result.expiresAt,
          currentChallengeId: result.firstChallengeId,
        })
      )

      navigate(`/exam/${examSlug}/challenges/${result.firstChallengeId}`)
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Failed to start exam'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleGoToEntry = () => {
    navigate(`/exam/${examSlug}/entry${location.search}`)
  }

  const handleSignIn = () => {
    const fromPath = isEntryRoute
      ? location.pathname + location.search
      : `/exam/${examSlug}/entry`
    navigate('/login', { state: { from: fromPath } })
  }

  const handleRestartVerification = async () => {
    try {
      setActionLoading(true)
      setError(null)
      setResolvedInviteToken(null)
      setInviteState(null)
      await refreshAccessState()
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Failed to restart verification'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestNewInvite = () => {
    navigate(`/exam/${examSlug}`)
  }

  const handleGoToResults = () => {
    navigate(`/exam/${examSlug}/results`)
  }

  const now = Date.now()
  const registrationNotOpenYet =
    !!exam?.registrationOpenAt &&
    now < new Date(exam.registrationOpenAt).getTime()
  const registrationClosed =
    !!exam?.registrationCloseAt &&
    now > new Date(exam.registrationCloseAt).getTime()

  const hasAccessRecord = !!accessState?.participantId
  const isApproved = accessState?.approvalStatus === 'approved'
  const isPending = accessState?.approvalStatus === 'pending'
  const isRejected = accessState?.approvalStatus === 'rejected'
  const hasStartedParticipation =
    !!accessState?.participationId ||
    accessState?.entrySessionStatus === 'started'
  const examHasEnded = exam ? now > new Date(exam.endDate).getTime() : false
  const examIsPublished = exam?.status === 'published'
  const examIsCancelled = exam?.status === 'cancelled'
  const examLifecycleBlocked =
    !exam || examHasEnded || !examIsPublished || examIsCancelled
  const showClosedWithAttemptPanel =
    !examIsCancelled && examHasEnded && hasStartedParticipation
  const showClosedWithoutAttemptPanel =
    !examIsCancelled && examHasEnded && !hasStartedParticipation

  const requiresLoginRaw = Boolean(
    accessState?.requiresLogin || inviteState?.requiresLogin
  )
  const requiresOtpRaw = Boolean(
    accessState?.requiresOtp || inviteState?.requiresOtp
  )
  const requiresLogin = requiresLoginRaw
  const requiresOtp = !requiresLogin && requiresOtpRaw
  const hasAuthContractConflict = requiresLoginRaw && requiresOtpRaw

  useEffect(() => {
    if (!isAuthenticated || !requiresLoginRaw) return
    void refreshAccessState()
  }, [isAuthenticated, refreshAccessState, requiresLoginRaw])

  const effectiveEntrySessionStatus =
    accessState?.entrySessionStatus ??
    (inviteState?.entrySessionId ? 'opened' : null)
  const entryPanelKind = resolveEntryPanelKind(effectiveEntrySessionStatus)
  const resolvedAccessMode = exam?.accessMode || 'open_registration'

  const canShowRegistrationForm =
    !hasAccessRecord &&
    !inviteState?.participantId &&
    !isPending &&
    !isRejected &&
    resolvedAccessMode !== 'invite_only'

  const { primaryReason, allReasons } = useMemo(
    () => computeEntryBlockReasons(exam, accessState),
    [exam, accessState]
  )
  const inviteResolutionFailed =
    !!inviteToken &&
    !!error &&
    /invite|token|expired|not found|invalid/i.test(error)

  if (loading) {
    return <LoadingSpinner />
  }

  if (!exam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-6 py-8 text-center">
          <h1 className="text-2xl font-semibold">Exam not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/95 to-slate-800/70 p-8 shadow-[0_18px_45px_rgba(2,6,23,0.4)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                {resolvedAccessMode.replace('_', ' ')}
              </span>
              <h1 className="text-3xl font-semibold">{exam.title}</h1>
              <div className="space-y-1 text-sm text-slate-300">
                <p>Starts: {formatDateTime(exam.startDate)}</p>
                <p>Ends: {formatDateTime(exam.endDate)}</p>
                <p>Duration: {exam.duration} minutes</p>
                <p>Max attempts: {exam.maxAttempts}</p>
              </div>
            </div>
            <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Registration
              </p>
              <p className="mt-2">
                {resolvedAccessMode === 'invite_only'
                  ? 'Invite only'
                  : exam.isRegistrationOpen
                    ? 'Open'
                    : 'Closed'}
              </p>
              {exam.registrationOpenAt ? (
                <p className="mt-2">
                  Open at: {formatDateTime(exam.registrationOpenAt)}
                </p>
              ) : null}
              {exam.registrationCloseAt ? (
                <p className="mt-1">
                  Close at: {formatDateTime(exam.registrationCloseAt)}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {examIsCancelled ? (
          <ExamEntryStatusPanel
            title="Exam cancelled"
            description="This exam was cancelled by the organizer and can no longer be entered."
            tone="danger"
          >
            <button
              type="button"
              onClick={handleGoToResults}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Go to results
            </button>
          </ExamEntryStatusPanel>
        ) : null}

        {!examIsCancelled && !examIsPublished ? (
          <ExamEntryStatusPanel
            title="Exam is not open"
            description="This exam is not in published state yet, so entering is disabled."
            tone="warning"
          />
        ) : null}

        {showClosedWithAttemptPanel ? (
          <ExamEntryStatusPanel
            title="Exam closed"
            description="The exam has ended and your previous attempt can no longer be resumed."
            tone="warning"
          >
            <button
              type="button"
              onClick={handleGoToResults}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              View results
            </button>
          </ExamEntryStatusPanel>
        ) : null}

        {showClosedWithoutAttemptPanel ? (
          <ExamEntryStatusPanel
            title="Exam closed"
            description="The exam end time has passed. You can no longer enter the workspace."
            tone="warning"
          >
            <button
              type="button"
              onClick={handleGoToResults}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              View results
            </button>
          </ExamEntryStatusPanel>
        ) : null}

        {error ? (
          <section className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </section>
        ) : null}

        {inviteResolutionFailed ? (
          <ExamEntryStatusPanel
            title="Invite link is invalid or expired"
            description="Request a fresh invite link from the organizer to continue."
            tone="warning"
          >
            <button
              type="button"
              onClick={handleRequestNewInvite}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Request new invite
            </button>
          </ExamEntryStatusPanel>
        ) : null}

        {hasAuthContractConflict ? (
          <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Access contract conflict detected (`requiresLogin` and `requiresOtp`
            both true). Continuing with sign-in first, then refresh access
            state.
          </section>
        ) : null}

        {isPending ? (
          <ExamEntryStatusPanel
            title="Registration pending"
            description="Your registration is waiting for organizer approval."
            tone="warning"
          />
        ) : null}

        {isRejected ? (
          <ExamEntryStatusPanel
            title="Registration rejected"
            description="Your registration was rejected. Please contact the organizer."
            tone="danger"
          />
        ) : null}

        {!isPending && !isRejected && registrationNotOpenYet ? (
          <ExamEntryStatusPanel
            title="Registration not open yet"
            description={`Registration opens at ${
              exam.registrationOpenAt
                ? formatDateTime(exam.registrationOpenAt)
                : '-'
            }.`}
            tone="warning"
          />
        ) : null}

        {!isPending &&
        !isRejected &&
        !registrationNotOpenYet &&
        registrationClosed &&
        !hasAccessRecord ? (
          <ExamEntryStatusPanel
            title="Registration closed"
            description="This exam no longer accepts new registrations."
            tone="danger"
          />
        ) : null}

        {!isPending &&
        !isRejected &&
        resolvedAccessMode === 'invite_only' &&
        !hasAccessRecord ? (
          <ExamEntryStatusPanel
            title="Invite-only exam"
            description="This exam accepts invite links only. Use your personal invite link to continue."
            tone="info"
          />
        ) : null}

        {canShowRegistrationForm &&
        !registrationNotOpenYet &&
        !registrationClosed ? (
          <section className="rounded-2xl border border-white/10 bg-slate-900/85 p-6">
            <h2 className="text-2xl font-semibold">Register for this exam</h2>
            <p className="mt-2 text-sm text-slate-400">
              {exam.selfRegistrationApprovalMode === 'manual'
                ? 'Registration requires organizer approval.'
                : 'Registration is auto-approved.'}
            </p>
            <form
              className="mt-4 grid gap-4 md:grid-cols-2"
              onSubmit={handleRegister}
            >
              <label className="grid gap-2 text-sm text-slate-300">
                Email
                <input
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  type="email"
                  value={registrationForm.email}
                  onChange={event =>
                    setRegistrationForm(current => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Full name
                <input
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                  value={registrationForm.fullName}
                  onChange={event =>
                    setRegistrationForm(current => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              {exam.selfRegistrationPasswordRequired ? (
                <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                  Exam password
                  <input
                    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                    type="password"
                    value={registrationForm.examPassword}
                    onChange={event =>
                      setRegistrationForm(current => ({
                        ...current,
                        examPassword: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              ) : null}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
                >
                  {actionLoading ? 'Submitting...' : 'Register now'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {hasStartedParticipation && !showClosedWithAttemptPanel ? (
          <ExamEntryStatusPanel
            title="Exam in progress"
            description={
              examLifecycleBlocked
                ? 'This session can no longer be resumed because the exam is closed.'
                : 'Your exam session has already started.'
            }
            tone={examLifecycleBlocked ? 'warning' : 'success'}
          >
            {examLifecycleBlocked ? (
              <button
                type="button"
                onClick={handleGoToResults}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
              >
                View results
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOrResume}
                disabled={actionLoading}
                className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
              >
                {actionLoading ? 'Opening...' : 'Resume exam'}
              </button>
            )}
          </ExamEntryStatusPanel>
        ) : null}

        {!hasStartedParticipation &&
        hasAccessRecord &&
        isApproved &&
        !isEntryRoute ? (
          <section className="rounded-2xl border border-white/10 bg-slate-900/85 p-6">
            <h2 className="text-xl font-semibold">Already registered</h2>
            <p className="mt-2 text-sm text-slate-300">
              Your access record is active. Continue from the entry page.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGoToEntry}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Go to entry
              </button>
              {requiresLoginRaw && !isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                >
                  Sign in
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {(isEntryRoute || inviteToken) && !isPending && !isRejected ? (
          <section className="rounded-2xl border border-white/10 bg-slate-900/85 p-6">
            <h2 className="text-2xl font-semibold">Exam entry</h2>

            {entryPanelKind === 'expired' ? (
              <ExamEntryStatusPanel
                title="Entry session expired"
                description="Your entry session has expired. Re-verify to continue."
                tone="warning"
              >
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleRestartVerification()
                    }}
                    disabled={actionLoading}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
                  >
                    {actionLoading ? 'Refreshing...' : 'Restart verification'}
                  </button>
                  {inviteToken ? (
                    <button
                      type="button"
                      onClick={handleRequestNewInvite}
                      className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Request new invite
                    </button>
                  ) : null}
                </div>
              </ExamEntryStatusPanel>
            ) : null}

            {entryPanelKind === 'verification' ? (
              <ExamEntryVerificationPanel
                requiresLogin={requiresLogin}
                isAuthenticated={isAuthenticated}
                requiresOtp={requiresOtp}
                otpEmail={otpForm.email}
                otpCode={otpForm.otp}
                otpCooldown={otpCooldown}
                actionLoading={actionLoading}
                onSignIn={handleSignIn}
                onSendOtp={() => {
                  void handleSendOtp()
                }}
                onOtpEmailChange={value =>
                  setOtpForm(current => ({ ...current, email: value }))
                }
                onOtpCodeChange={value =>
                  setOtpForm(current => ({ ...current, otp: value }))
                }
                onVerifyOtp={handleVerifyOtp}
              />
            ) : null}

            {entryPanelKind === 'lobby' && effectiveEntrySessionStatus ? (
              <ExamEntryLobbyPanel
                status={
                  effectiveEntrySessionStatus === 'started'
                    ? 'started'
                    : 'eligible'
                }
                canStart={Boolean(accessState?.canStart)}
                actionLoading={actionLoading}
                primaryReason={primaryReason}
                allReasons={allReasons}
                onStartOrResume={() => {
                  void handleStartOrResume()
                }}
              />
            ) : null}

            {entryPanelKind === 'none' ? (
              <ExamEntryStatusPanel
                title="No active entry session"
                description="No verification session is active for this exam yet."
                tone="info"
              >
                <button
                  type="button"
                  onClick={() => {
                    void handleRestartVerification()
                  }}
                  disabled={actionLoading}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
                >
                  {actionLoading ? 'Refreshing...' : 'Refresh access state'}
                </button>
              </ExamEntryStatusPanel>
            ) : null}
          </section>
        ) : null}

        <section className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/exam')}
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to exams
          </button>
          {accessState?.accessStatus === 'completed' || examHasEnded ? (
            <button
              type="button"
              onClick={handleGoToResults}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950"
            >
              View results
            </button>
          ) : null}
          {hasAccessRecord && isApproved && !hasStartedParticipation ? (
            <button
              type="button"
              onClick={handleGoToEntry}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950"
            >
              Go to entry
            </button>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default ExamAccessPage


