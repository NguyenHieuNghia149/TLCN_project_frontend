import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ArrowRight,
  Eye,
} from 'lucide-react'
import Input from '@/components/common/Input/Input'
import { useAuth } from '@/hooks/api/useAuth'
import { Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
import { examService } from '@/services/api/exam.service'
import { isTeacherOrOwner } from '@/utils/roleUtils'
import {
  getLearnerExamCardState,
  getLearnerExamPrimaryAction,
  LearnerExamLifecycle,
  LearnerExamPrimaryAction,
} from '@/pages/exam/list/exam-card-state'
import { filterVisibleListExams } from '@/pages/exam/list/exam-list-visibility'
import './ExamList.scss'

const PAGE_SIZE = 6

/* ─── Countdown / relative time helpers ─── */

function formatRelativeTime(targetMs: number, nowMs: number): string {
  const diffMs = targetMs - nowMs
  const absDiffMs = Math.abs(diffMs)
  const isPast = diffMs < 0

  if (absDiffMs < 60_000) return isPast ? 'just now' : 'in less than a minute'

  const minutes = Math.floor(absDiffMs / 60_000)
  const hours = Math.floor(absDiffMs / 3_600_000)
  const days = Math.floor(absDiffMs / 86_400_000)

  if (days > 7) {
    return new Date(targetMs).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }
  if (days >= 1) {
    const label = `${days}d ${hours % 24}h`
    return isPast ? `${label} ago` : `in ${label}`
  }
  if (hours >= 1) {
    const label = `${hours}h ${minutes % 60}m`
    return isPast ? `${label} ago` : `in ${label}`
  }
  const label = `${minutes}m`
  return isPast ? `${label} ago` : `in ${label}`
}

function getExamCountdownText(
  exam: Exam,
  lifecycle: LearnerExamLifecycle,
  nowMs: number
): string | null {
  const startMs = new Date(exam.startDate).getTime()
  const endMs = new Date(exam.endDate).getTime()

  if (lifecycle === 'upcoming') {
    return `Starts ${formatRelativeTime(startMs, nowMs)}`
  }
  if (lifecycle === 'active') {
    const timeLeft = endMs - nowMs
    if (timeLeft <= 86_400_000) {
      return `Ends ${formatRelativeTime(endMs, nowMs)}`
    }
    return `Ends ${new Date(endMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  if (lifecycle === 'closed') {
    return `Ended ${new Date(endMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  return null
}

/* ─── CTA helpers ─── */

function getStudentCTA(action: LearnerExamPrimaryAction): {
  label: string
  variant: 'primary' | 'secondary' | 'ghost'
  disabled: boolean
  icon: React.ReactNode
} {
  switch (action.kind) {
    case 'enter':
    case 'continue':
      return {
        label: action.label,
        variant: action.label === 'View Details' ? 'secondary' : 'primary',
        disabled: false,
        icon: <ArrowRight size={16} />,
      }
    case 'results':
      return {
        label: action.label,
        variant: 'secondary',
        disabled: false,
        icon: <Eye size={16} />,
      }
    case 'disabled':
      return {
        label: action.label,
        variant: action.label === 'Not Started' ? 'secondary' : 'ghost',
        disabled: true,
        icon: action.label === 'Not Started' ? <Clock size={16} /> : null,
      }
    default:
      return {
        label: 'View',
        variant: 'secondary',
        disabled: false,
        icon: null,
      }
  }
}

/* ─── Status dot color map ─── */
const statusDotColors: Record<LearnerExamLifecycle, string> = {
  active: 'var(--exam-success)',
  upcoming: 'var(--exam-warning)',
  closed: 'var(--exam-danger)',
  cancelled: 'var(--exam-danger)',
  draft: 'var(--exam-muted)',
  archived: 'var(--exam-muted)',
}

/* ─── Main component ─── */

const ExamList: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const initialFilter = searchParams.get('filter')
  const normalizedFilter: 'all' | 'participated' =
    initialFilter === 'participated' ? 'participated' : 'all'
  const initialPage = Math.max(Number(searchParams.get('page') || '1'), 1)
  const [exams, setExams] = useState<Exam[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const initialSearchTerm = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(initialSearchTerm)
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'participated'>(
    normalizedFilter
  )
  const [page, setPage] = useState(initialPage)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const accessModeCacheRef = useRef<
    Map<string, NonNullable<Exam['accessMode']>>
  >(new Map())
  const [participatedExamIds, setParticipatedExamIds] = useState<Set<string>>(
    () => new Set()
  )
  const canManageExam = isTeacherOrOwner(user)

  // Global countdown tick — 1 interval for all cards (60s)
  const [, setCountdownTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdownTick(t => t + 1)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const hydrateLearnerAccessModes = useCallback(
    async (items: Exam[]): Promise<Exam[]> => {
      if (canManageExam || items.length === 0) {
        return items
      }

      const unresolved = items.filter(item => !item.accessMode && !!item.slug)
      if (unresolved.length === 0) {
        return items
      }

      const resolvedById = new Map<string, NonNullable<Exam['accessMode']>>()

      await Promise.all(
        unresolved.map(async item => {
          const cacheKey = item.id || item.slug!
          const cachedMode = accessModeCacheRef.current.get(cacheKey)
          if (cachedMode) {
            resolvedById.set(cacheKey, cachedMode)
            return
          }

          try {
            const publicExam = await examService.getPublicExam(item.slug!)
            if (publicExam?.accessMode) {
              accessModeCacheRef.current.set(cacheKey, publicExam.accessMode)
              resolvedById.set(cacheKey, publicExam.accessMode)
            }
          } catch {
            // Keep item unchanged; fallback only.
          }
        })
      )

      if (resolvedById.size === 0) {
        return items
      }

      return items.map(item => {
        if (item.accessMode) {
          return item
        }

        const cacheKey = item.id || item.slug || ''
        const resolvedMode =
          resolvedById.get(cacheKey) || accessModeCacheRef.current.get(cacheKey)

        if (!resolvedMode) {
          return item
        }

        return {
          ...item,
          accessMode: resolvedMode,
        }
      })
    },
    [canManageExam]
  )

  useEffect(() => {
    if (searchInput === searchTerm) {
      setIsSearchDebouncing(false)
      return
    }

    setIsSearchDebouncing(true)
    const debounceTimer = window.setTimeout(() => {
      setSearchTerm(searchInput)
      setIsSearchDebouncing(false)
    }, 350)

    return () => {
      window.clearTimeout(debounceTimer)
    }
  }, [searchInput, searchTerm])

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true)
      setError(null)
      try {
        const json = await examService.getExams(
          PAGE_SIZE,
          (page - 1) * PAGE_SIZE,
          searchTerm || undefined,
          filterType,
          true // isVisible=true for student view
        )
        let items: Exam[] = json?.data || []
        items = await hydrateLearnerAccessModes(items)
        setExams(items)
        setTotal(Number(json?.total || 0))
      } catch (apiErr) {
        console.error('Failed to load exams from API', apiErr)
        setError('Failed to load exams')
        setExams([])
        setTotal(0)
      } finally {
        setLoading(false)
        setHasLoadedOnce(true)
      }
    }

    fetchExams()
  }, [filterType, hydrateLearnerAccessModes, page, reloadTick, searchTerm])

  useEffect(() => {
    let cancelled = false

    const fetchParticipatedExamIds = async () => {
      try {
        const limit = 100
        let offset = 0
        let total = 0
        const ids = new Set<string>()

        do {
          const response = await examService.getExams(
            limit,
            offset,
            undefined,
            'participated',
            true
          )

          ;(response.data || []).forEach(item => ids.add(item.id))
          total = Number(response.total || 0)
          offset += limit
        } while (offset < total)

        if (!cancelled) {
          setParticipatedExamIds(ids)
        }
      } catch (participatedErr) {
        console.error('Failed to load participated exams', participatedErr)
        if (!cancelled) {
          setParticipatedExamIds(new Set())
        }
      }
    }

    fetchParticipatedExamIds()

    return () => {
      cancelled = true
    }
  }, [reloadTick, user?.id])

  // Learner list must hide invite-only exams (invite path is link-driven).
  const filteredExams = useMemo(
    () => filterVisibleListExams(exams, canManageExam),
    [canManageExam, exams]
  )

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // We apply filters/search on the current page items returned from server
  const displayedExams = useMemo(() => {
    return filteredExams
  }, [filteredExams])

  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setPage(1)
  }, [filterType, searchTerm])

  useEffect(() => {
    const next = new URLSearchParams()
    if (searchTerm) {
      next.set('q', searchTerm)
    }
    if (filterType !== 'all') {
      next.set('filter', filterType)
    }
    if (page > 1) {
      next.set('page', String(page))
    }
    setSearchParams(next, { replace: true })
  }, [filterType, page, searchTerm, setSearchParams])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  if (loading && !hasLoadedOnce) {
    return <LoadingSpinner />
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
        transition: 'background-color 200ms ease, color 200ms ease',
      }}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:py-12">
        {/* ─── Header ─── */}
        <section className="mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--text-color)' }}
          >
            Exams
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--exam-muted)' }}>
            Your upcoming and past exams
          </p>
        </section>

        {/* ─── Search + Filter ─── */}
        <section className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md flex-1">
              <Input
                value={searchInput}
                onChange={event => setSearchInput(event.target.value)}
                placeholder="Search exam by title..."
                icon={<Search size={18} />}
                className="w-full"
              />
              {isSearchDebouncing ? (
                <p
                  className="mt-2 text-xs"
                  style={{ color: 'var(--exam-muted)' }}
                >
                  Updating results...
                </p>
              ) : null}
            </div>
            <div
              className="flex gap-1 rounded-lg border p-1"
              style={{
                borderColor: 'var(--exam-card-border)',
                backgroundColor: 'var(--exam-card-bg)',
              }}
            >
              <FilterTab
                label="All Exams"
                active={filterType === 'all'}
                onClick={() => setFilterType('all')}
              />
              <FilterTab
                label="Participated"
                active={filterType === 'participated'}
                onClick={() => setFilterType('participated')}
              />
            </div>
          </div>
        </section>

        {/* ─── Error state ─── */}
        {error ? (
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: 'var(--exam-danger-subtle)',
              backgroundColor: 'var(--exam-danger-subtle)',
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--exam-danger)' }}
            >
              Failed to load exams.
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--exam-muted)' }}>
              Please check your connection and try again.
            </p>
            <Button
              onClick={() => setReloadTick(current => current + 1)}
              variant="secondary"
              size="sm"
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        ) : null}

        {/* ─── Empty state ─── */}
        {filteredExams.length === 0 ? (
          error ? null : (
            <div
              className="rounded-xl border border-dashed p-10 text-center"
              style={{
                borderColor: 'var(--exam-card-border)',
                transition: 'border-color 200ms ease',
              }}
            >
              <p
                className="text-lg font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                No exams found
              </p>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--exam-muted)' }}
              >
                {canManageExam
                  ? 'Create your first exam to get started.'
                  : 'Please check back soon or contact your instructor.'}
              </p>
            </div>
          )
        ) : (
          <>
            {/* ─── Exam grid ─── */}
            <div className="grid gap-5 md:grid-cols-2">
              {displayedExams.map(exam => {
                const canManageThisExam =
                  canManageExam || exam.createdBy === user?.id
                return (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    isOwner={canManageThisExam}
                    participated={participatedExamIds.has(exam.id)}
                    onEnter={() =>
                      canManageThisExam
                        ? navigate(`/exam/${exam.id}/manage`)
                        : navigate(`/exam/${exam.slug || exam.id}`)
                    }
                    onResults={() =>
                      canManageThisExam
                        ? navigate(`/exam/${exam.id}/results/manage`)
                        : navigate(`/exam/${exam.slug || exam.id}/results`)
                    }
                    onTryExam={() => navigate(`/exam/${exam.slug || exam.id}`)}
                  />
                )
              })}
            </div>

            {/* ─── Pagination ─── */}
            {totalPages > 1 && (
              <div
                className="mt-8 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: 'var(--exam-card-border)' }}
              >
                <div className="text-sm" style={{ color: 'var(--exam-muted)' }}>
                  Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                  {Math.min(page * PAGE_SIZE, total)} of {total} exams
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
                              className="min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
                              style={{
                                borderColor:
                                  page === pageNum
                                    ? 'var(--exam-accent)'
                                    : 'var(--exam-card-border)',
                                backgroundColor:
                                  page === pageNum
                                    ? 'var(--exam-accent-subtle)'
                                    : 'transparent',
                                color:
                                  page === pageNum
                                    ? 'var(--exam-accent)'
                                    : 'var(--text-color)',
                              }}
                            >
                              {pageNum}
                            </button>
                          )
                        } else if (
                          pageNum === page - 2 ||
                          pageNum === page + 2
                        ) {
                          return (
                            <span
                              key={pageNum}
                              className="px-2 text-sm"
                              style={{ color: 'var(--exam-muted)' }}
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
          </>
        )}
      </div>
    </div>
  )
}

/* ─── ExamCard ─── */

interface ExamCardProps {
  exam: Exam
  isOwner: boolean
  participated: boolean
  onEnter: () => void
  onResults: () => void
  onTryExam: () => void
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  isOwner,
  participated,
  onEnter,
  onResults,
  onTryExam,
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const examState = getLearnerExamCardState({
    examStatus: exam.status,
    startDate: exam.startDate,
    endDate: exam.endDate,
  })

  const nowMs = Date.now()
  const countdownText = getExamCountdownText(exam, examState.lifecycle, nowMs)
  const hasParticipationSummary =
    exam.attemptsUsed !== undefined ||
    exam.latestParticipationStatus !== undefined ||
    exam.hasInProgressParticipation !== undefined ||
    exam.hasCompletedParticipation !== undefined
  const attemptsUsed = hasParticipationSummary
    ? Number(exam.attemptsUsed ?? 0)
    : participated
      ? 1
      : 0
  const primaryAction = getLearnerExamPrimaryAction({
    lifecycle: examState.lifecycle,
    attemptsUsed,
    maxAttempts: exam.maxAttempts,
    latestParticipationStatus: exam.latestParticipationStatus ?? null,
    hasInProgressParticipation: exam.hasInProgressParticipation ?? false,
    hasCompletedParticipation:
      exam.hasCompletedParticipation ??
      (!hasParticipationSummary && participated),
  })
  const studentCta = getStudentCTA(primaryAction)
  const dotColor = statusDotColors[examState.lifecycle]

  const handlePrimaryCta = () => {
    if (isOwner) {
      onEnter()
      return
    }
    if (primaryAction.kind === 'results') {
      onResults()
    } else {
      onEnter()
    }
  }

  return (
    <div
      className="exam-card-v2"
      style={{
        backgroundColor: 'var(--exam-card-bg)',
        borderColor: 'var(--exam-card-border)',
        boxShadow: 'var(--exam-card-shadow)',
      }}
    >
      <div className="exam-card-v2__content">
        {/* Top: Status dot + badge + menu */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="exam-card-v2__dot"
              style={{ backgroundColor: dotColor }}
              aria-hidden="true"
            />
            <span
              className="exam-card-v2__badge"
              style={{
                color: dotColor,
                backgroundColor: `color-mix(in srgb, ${dotColor} 12%, transparent)`,
              }}
            >
              {examState.badgeLabel}
            </span>
          </div>
          {isOwner && (
            <div className="relative">
              <Button
                onClick={() => setShowMenu(prev => !prev)}
                variant="ghost"
                className="rounded-full p-2"
                size="sm"
                aria-label="Exam options"
              >
                <MoreVertical size={16} />
              </Button>
              {showMenu && (
                <div
                  className="absolute right-0 z-20 mt-1 w-40 rounded-xl border p-1.5 text-sm shadow-2xl"
                  style={{
                    backgroundColor: 'var(--exam-card-bg)',
                    borderColor: 'var(--exam-card-border)',
                  }}
                >
                  <Button
                    className="flex w-full items-center rounded-lg px-3 py-2 text-left"
                    onClick={onEnter}
                    variant="ghost"
                    style={{ color: 'var(--text-color)' }}
                  >
                    Manage exam
                  </Button>
                  <Button
                    className="flex w-full items-center rounded-lg px-3 py-2 text-left"
                    onClick={onResults}
                    variant="ghost"
                    style={{ color: 'var(--text-color)' }}
                  >
                    View results
                  </Button>
                  <Button
                    className="flex w-full items-center rounded-lg px-3 py-2 text-left"
                    onClick={onTryExam}
                    variant="ghost"
                    style={{ color: 'var(--text-color)' }}
                  >
                    Try exam
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          className="mt-3 text-lg font-semibold leading-snug"
          style={{ color: 'var(--text-color)' }}
        >
          {exam.title}
        </h3>

        {/* Info row */}
        <div
          className="mt-3 flex flex-wrap items-center gap-4 text-sm"
          style={{ color: 'var(--exam-muted)' }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(exam.startDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {exam.duration} min
          </span>
          {exam.challenges && exam.challenges.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <CircleDot size={14} />
              {exam.challenges.length} challenges
            </span>
          )}
        </div>

        {/* Countdown text */}
        {countdownText && (
          <p
            className="mt-3 text-xs font-medium"
            style={{
              color:
                examState.lifecycle === 'active'
                  ? 'var(--exam-success)'
                  : examState.lifecycle === 'upcoming'
                    ? 'var(--exam-warning)'
                    : 'var(--exam-muted)',
            }}
          >
            {countdownText}
          </p>
        )}
      </div>

      {/* Footer: CTA */}
      <div
        className="exam-card-v2__footer"
        style={{ borderColor: 'var(--exam-card-border)' }}
      >
        {isOwner ? (
          <Button
            onClick={onEnter}
            variant="primary"
            size="sm"
            icon={<ArrowRight size={16} />}
            aria-label="Manage exam"
          >
            Manage
          </Button>
        ) : (
          <Button
            onClick={handlePrimaryCta}
            variant={studentCta.variant}
            size="sm"
            disabled={studentCta.disabled}
            icon={studentCta.icon}
            aria-label={studentCta.label}
          >
            {studentCta.label}
          </Button>
        )}
      </div>
    </div>
  )
}

/* ─── Filter Tab (underline style) ─── */

const FilterTab: React.FC<{
  label: string
  active: boolean
  onClick: () => void
}> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="exam-filter-tab"
    style={{
      color: active ? 'var(--exam-accent)' : 'var(--exam-muted)',
      backgroundColor: active ? 'var(--exam-accent-subtle)' : 'transparent',
      fontWeight: active ? 600 : 500,
    }}
    aria-pressed={active}
  >
    {label}
  </button>
)

export default ExamList
