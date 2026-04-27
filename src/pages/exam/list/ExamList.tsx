import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  // Plus,
  Calendar,
  Clock,
  MoreVertical,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Input from '@/components/common/Input/Input'
import { useAuth } from '@/hooks/api/useAuth'
import { Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
import { examService } from '@/services/api/exam.service'
import { isTeacherOrOwner } from '@/utils/roleUtils'
import { getLearnerExamCardState } from '@/pages/exam/list/exam-card-state'
import { filterVisibleListExams } from '@/pages/exam/list/exam-list-visibility'
import './ExamList.scss'

const PAGE_SIZE = 6

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

  const stats = {
    // total comes from server pagination
    total: total,
    // upcoming/active are calculated from current page items; not global counts
    upcoming: filteredExams.filter(
      exam => Date.now() < new Date(exam.startDate).getTime()
    ).length,
    active: filteredExams.filter(exam => {
      const now = Date.now()
      const start = new Date(exam.startDate).getTime()
      const end = new Date(exam.endDate).getTime()
      return (
        now >= start &&
        now <= end &&
        (exam.status === 'published' || exam.status === undefined)
      )
    }).length,
  }

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
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:py-12">
        <section
          className="rounded-lg border p-6"
          style={{
            backgroundColor: 'var(--card-color)',
            borderColor: 'var(--surface-border)',
            transition: 'background-color 200ms ease, border-color 200ms ease',
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: 'var(--muted-text)' }}
              >
                Assessment Hub
              </p>
              <h1
                className="mt-2 text-2xl font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                Exam Control Center
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ color: 'var(--muted-text)' }}
              >
                Craft focused coding exams and monitor cohort performance.
              </p>
            </div>
            {/* {canManageExam && (
              <Button
                onClick={() => navigate('/exam/create')}
                variant="primary"
                size="md"
                icon={<Plus size={16} />}
              >
                New Exam
              </Button>
            )}  */}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatPill label="Total Exams" value={stats.total} />
            <StatPill
              label="Active Now"
              value={stats.active}
              accent="emerald"
            />
            <StatPill label="Upcoming" value={stats.upcoming} accent="amber" />
          </div>
        </section>

        <section className="mt-8 space-y-6">
          <div
            className="rounded-lg border p-4"
            style={{
              borderColor: 'var(--surface-border)',
              backgroundColor: 'var(--exam-panel-bg)',
              transition:
                'background-color 200ms ease, border-color 200ms ease',
            }}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
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
                    style={{ color: 'var(--muted-text)' }}
                  >
                    Updating results...
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <FilterChip
                  label="All exams"
                  active={filterType === 'all'}
                  onClick={() => setFilterType('all')}
                />
                {/* {canManageExam && (
                  <FilterChip
                    label="My exams"
                    active={filterType === 'my'}
                    onClick={() => setFilterType('my')}
                  />
                )} */}
                <FilterChip
                  label="Participated"
                  active={filterType === 'participated'}
                  onClick={() => setFilterType('participated')}
                />
              </div>
            </div>
          </div>

          {error ? (
            <div
              className="rounded-lg border p-4"
              style={{
                borderColor: 'rgba(248, 113, 113, 0.5)',
                backgroundColor: 'rgba(248, 113, 113, 0.08)',
              }}
            >
              <p className="text-sm font-semibold text-rose-300">
                Failed to load exams.
              </p>
              <p className="mt-1 text-sm text-rose-200">
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

          {filteredExams.length === 0 ? (
            error ? null : (
              <div
                className="rounded-md border-dashed p-8 text-center"
                style={{
                  borderColor: 'var(--surface-border)',
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
                  style={{ color: 'var(--muted-text)' }}
                >
                  {canManageExam
                    ? 'Create your first curated exam to get started.'
                    : 'Please check back soon or contact your instructor.'}
                </p>
              </div>
            )
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {displayedExams.map(exam => {
                  const canManageThisExam =
                    canManageExam || exam.createdBy === user?.id
                  return (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      isOwner={canManageThisExam}
                      canViewResults={
                        canManageThisExam ||
                        filterType === 'participated' ||
                        participatedExamIds.has(exam.id)
                      }
                      onView={() =>
                        canManageThisExam
                          ? navigate(`/exam/${exam.id}/manage`)
                          : navigate(`/exam/${exam.slug || exam.id}`)
                      }
                      onResults={() =>
                        canManageThisExam
                          ? navigate(`/exam/${exam.id}/results/manage`)
                          : navigate(`/exam/${exam.slug || exam.id}/results`)
                      }
                      onTryExam={() =>
                        navigate(`/exam/${exam.slug || exam.id}`)
                      }
                    />
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="mt-6 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: 'var(--surface-border)' }}
                >
                  <div
                    className="text-sm"
                    style={{ color: 'var(--muted-text)' }}
                  >
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
                                className="min-w-[2.5rem] rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                                style={{
                                  borderColor:
                                    page === pageNum
                                      ? 'var(--accent)'
                                      : 'var(--surface-border)',
                                  backgroundColor:
                                    page === pageNum
                                      ? 'rgba(32, 215, 97, 0.1)'
                                      : 'transparent',
                                  color:
                                    page === pageNum
                                      ? 'var(--accent)'
                                      : 'var(--text-color)',
                                }}
                                onMouseEnter={e => {
                                  if (page !== pageNum) {
                                    e.currentTarget.style.backgroundColor =
                                      'var(--exam-panel-bg)'
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (page !== pageNum) {
                                    e.currentTarget.style.backgroundColor =
                                      'transparent'
                                  }
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
        </section>
      </div>
    </div>
  )
}

interface ExamCardProps {
  exam: Exam
  isOwner: boolean
  canViewResults: boolean
  onView: () => void
  onResults: () => void
  onTryExam: () => void
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  isOwner,
  canViewResults,
  onView,
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
  const isHardBlockedLifecycle =
    examState.lifecycle === 'closed' ||
    examState.lifecycle === 'cancelled' ||
    examState.lifecycle === 'archived' ||
    examState.lifecycle === 'draft'
  const isLearnerEnterDisabled = !isOwner && isHardBlockedLifecycle
  const learnerCtaLabel =
    examState.lifecycle === 'active' ? 'Enter exam' : 'View exam'

  const statusStylesByLifecycle: Record<
    ReturnType<typeof getLearnerExamCardState>['lifecycle'],
    { border: string; background: string; color: string }
  > = {
    active: {
      border: 'rgba(16, 185, 129, 0.4)',
      background: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
    },
    upcoming: {
      border: 'rgba(245, 158, 11, 0.4)',
      background: 'rgba(245, 158, 11, 0.1)',
      color: '#f59e0b',
    },
    closed: {
      border: 'rgba(248, 113, 113, 0.35)',
      background: 'rgba(248, 113, 113, 0.08)',
      color: '#f87171',
    },
    cancelled: {
      border: 'rgba(244, 63, 94, 0.35)',
      background: 'rgba(244, 63, 94, 0.08)',
      color: '#fb7185',
    },
    draft: {
      border: 'rgba(148, 163, 184, 0.35)',
      background: 'rgba(148, 163, 184, 0.08)',
      color: '#cbd5e1',
    },
    archived: {
      border: 'rgba(148, 163, 184, 0.35)',
      background: 'rgba(148, 163, 184, 0.08)',
      color: '#94a3b8',
    },
  }

  const statusStyle = statusStylesByLifecycle[examState.lifecycle]

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--surface-border)',
        backgroundColor: 'var(--card-color)',
        boxShadow: '0 14px 28px rgba(0, 0, 0, 0.14)',
      }}
    >
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="flex items-center gap-2 text-xs uppercase tracking-wider"
              style={{ color: 'var(--muted-text)' }}
            >
              <span>{formatDate(exam.startDate)}</span>
              <span>•</span>
              <span>{exam.duration}m</span>
            </div>
            <h3
              className="mt-2 text-xl font-semibold"
              style={{ color: 'var(--text-color)' }}
            >
              {exam.title}
            </h3>
          </div>
          {isOwner && (
            <div className="relative">
              <Button
                onClick={() => setShowMenu(prev => !prev)}
                variant="ghost"
                className="rounded-full p-2"
                size="sm"
              >
                <MoreVertical size={18} />
              </Button>
              {showMenu && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl border p-2 text-sm shadow-2xl"
                  style={{
                    backgroundColor: 'var(--card-color)',
                    borderColor: 'var(--surface-border)',
                  }}
                >
                  <Button
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left"
                    onClick={onView}
                    variant="ghost"
                    style={{ color: 'var(--text-color)' }}
                  >
                    Edit exam
                  </Button>
                  <Button
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left"
                    onClick={onResults}
                    variant="ghost"
                    style={{ color: 'var(--text-color)' }}
                    disabled={!canViewResults}
                  >
                    View results
                  </Button>
                  <Button
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-rose-500"
                    variant="outline"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="grid gap-4 rounded-lg border p-4 text-sm"
          style={{
            borderColor: 'var(--surface-border)',
            backgroundColor: 'var(--exam-panel-bg)',
          }}
        >
          <div
            className="flex items-center gap-3"
            style={{ color: 'var(--text-color)' }}
          >
            <Clock size={16} style={{ color: 'var(--accent)' }} />
            <span>{exam.duration} minutes</span>
          </div>
          <div
            className="flex items-center gap-3"
            style={{ color: 'var(--text-color)' }}
          >
            <Calendar size={16} style={{ color: 'var(--accent)' }} />
            <span>
              {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
            </span>
          </div>
          {/* <div className="flex items-center justify-between">
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--muted-text)' }}
            >
              Challenges
            </p>
            <p
              className="text-lg font-semibold"
              style={{ color: 'var(--text-color)' }}
            >
              {exam.challenges?.length || 0}
            </p>
          </div> */}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{
              borderColor: statusStyle.border,
              backgroundColor: statusStyle.background,
              color: statusStyle.color,
            }}
          >
            {examState.badgeLabel}
          </span>
          <div className="flex items-center gap-2">
            {isOwner && examState.canEnter ? (
              <Button
                onClick={onTryExam}
                variant="secondary"
                size="sm"
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold"
                aria-label="Try exam"
              >
                Try exam
              </Button>
            ) : null}
            {canViewResults ? (
              <Button
                onClick={onResults}
                variant="secondary"
                size="sm"
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold"
                aria-label="View results"
              >
                View results
              </Button>
            ) : null}
            <Button
              onClick={onView}
              variant="primary"
              size="sm"
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold"
              disabled={isLearnerEnterDisabled}
              aria-label={isOwner ? 'Manage exam' : 'Enter exam'}
            >
              {isOwner ? 'Manage exam' : learnerCtaLabel}
            </Button>
          </div>
        </div>
        {isLearnerEnterDisabled ? (
          <p className="mt-2 text-xs" style={{ color: 'var(--muted-text)' }}>
            Exam is not enterable in current state.
          </p>
        ) : null}
      </div>
    </div>
  )
}

const StatPill: React.FC<{
  label: string
  value: number
  accent?: 'emerald' | 'amber'
}> = ({ label, value, accent }) => {
  const accentColor =
    accent === 'emerald'
      ? '#10b981'
      : accent === 'amber'
        ? '#f59e0b'
        : 'var(--accent)'

  return (
    <div
      className="rounded-lg border p-5"
      style={{
        borderColor: 'var(--surface-border)',
        backgroundColor: 'var(--exam-panel-bg)',
        transition: 'background-color 200ms ease, border-color 200ms ease',
      }}
    >
      <p
        className="text-xs uppercase tracking-wider"
        style={{ color: 'var(--muted-text)' }}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold" style={{ color: accentColor }}>
        {value}
      </p>
    </div>
  )
}

const FilterChip: React.FC<{
  label: string
  active: boolean
  onClick: () => void
}> = ({ label, active, onClick }) => (
  <Button
    onClick={onClick}
    size="sm"
    variant={active ? 'primary' : 'ghost'}
    className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition"
    style={{
      borderColor: active ? 'var(--accent)' : 'var(--surface-border)',
      backgroundColor: active ? 'var(--accent)' : 'transparent',
      color: active ? '#ffffff' : 'var(--muted-text)',
    }}
    aria-pressed={active}
  >
    {label}
  </Button>
)

export default ExamList
