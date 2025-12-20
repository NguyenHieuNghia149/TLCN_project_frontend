import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import './ExamList.scss'

const PAGE_SIZE = 6

const ExamList: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'my' | 'participated'>(
    'all'
  )
  const [page, setPage] = useState(1)
  const [, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true)
      setError(null)
      try {
        const json = await examService.getExams(
          PAGE_SIZE,
          (page - 1) * PAGE_SIZE,
          searchTerm || undefined,
          filterType || undefined,
          true // isVisible=true for student view
        )
        const items: Exam[] = json?.data || []
        setExams(items)
        setTotal(Number(json?.total || 0))
      } catch (apiErr) {
        console.error('Failed to load exams from API', apiErr)
        setError('Failed to load exams')
        setExams([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [page, searchTerm, filterType])

  const canManageExam = isTeacherOrOwner(user)

  // Server-side search & filter: exams already reflect searchTerm/filterType
  const filteredExams = useMemo(() => exams, [exams])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // We apply filters/search on the current page items returned from server
  const displayedExams = useMemo(() => {
    return filteredExams
  }, [filteredExams])

  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterType])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const stats = {
    // total comes from server pagination
    total: total,
    // upcoming/active are calculated from current page items; not global counts
    upcoming: exams.filter(
      exam => Date.now() < new Date(exam.startDate).getTime()
    ).length,
    active: exams.filter(exam => Date.now() < new Date(exam.endDate).getTime())
      .length,
  }

  if (loading) {
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
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search exam by title..."
                  icon={<Search size={18} />}
                  className="w-full"
                />
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

          {filteredExams.length === 0 ? (
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
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {displayedExams.map(exam => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    isOwner={exam.createdBy === user?.id}
                    onView={() => navigate(`/exam/${exam.id}`)}
                    onResults={() =>
                      navigate(`/exam/${exam.id}/results/manage`)
                    }
                  />
                ))}
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
  onView: () => void
  onResults: () => void
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  isOwner,
  onView,
  onResults,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const isActive = Date.now() < new Date(exam.endDate).getTime()

  return (
    <div
      className="group relative overflow-hidden rounded-lg border p-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--surface-border)',
        backgroundColor: 'var(--card-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                    onClick={() => navigate(`/exam/edit/${exam.id}`)}
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
              borderColor: isActive
                ? 'rgba(16, 185, 129, 0.4)'
                : 'rgba(239, 68, 68, 0.4)',
              backgroundColor: isActive
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              color: isActive ? '#10b981' : '#ef4444',
            }}
          >
            {isActive ? 'Active' : 'Closed'}
          </span>
          <Button
            onClick={onView}
            variant="primary"
            size="sm"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold"
            aria-label={isOwner ? 'Manage exam' : 'Enter exam'}
          >
            {isOwner ? 'Manage exam' : 'Enter exam'}
          </Button>
        </div>
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
