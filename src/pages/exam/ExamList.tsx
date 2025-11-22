import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Clock, MoreVertical, Search } from 'lucide-react'
import { useAuth } from '@/hooks/api/useAuth'
import { Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import './ExamList.scss'

const ExamList: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'my' | 'participated'>(
    'all'
  )

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true)
      try {
        const mockExams: Exam[] = [
          {
            id: '1',
            title: 'Algorithms Midterm Test',
            password: 'test123',
            duration: 90,
            challenges: [],
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            createdBy: 'lecturer1',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Data Structures Final',
            password: 'final456',
            duration: 120,
            challenges: [],
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
            createdBy: 'lecturer2',
            createdAt: new Date().toISOString(),
          },
        ]
        setExams(mockExams)
      } catch (error) {
        console.error('Failed to fetch exams:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  const isLecturer = user?.role === 'lecturer' || user?.role === 'admin'

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    if (filterType === 'my') {
      return matchesSearch && exam.createdBy === user?.id
    }

    return matchesSearch
  })

  const stats = {
    total: exams.length,
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
    <div className="min-h-screen bg-[#03040a] text-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#101325] via-[#090a14] to-[#05060c] p-8 shadow-[0_40px_120px_rgba(3,4,12,0.85)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-gray-500">
                Assessment Hub
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white lg:text-4xl">
                Exam Control Center
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Craft immersive coding exams, monitor performance and keep your
                cohorts engaged.
              </p>
            </div>
            {isLecturer && (
              <button
                onClick={() => navigate('/exam/create')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-primary-400/50 hover:bg-primary-500/10"
              >
                <Plus size={18} />
                New Exam
              </button>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatPill label="Total Exams" value={stats.total} />
            <StatPill
              label="Active Now"
              value={stats.active}
              accent="emerald"
            />
            <StatPill label="Upcoming" value={stats.upcoming} accent="amber" />
          </div>
        </section>

        <section className="mt-10 space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-[#060812] p-6 shadow-[0_30px_80px_rgba(2,3,10,0.8)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search exam by title..."
                  className="h-12 w-full rounded-2xl border border-white/5 bg-[#0b0f1d] pl-12 pr-4 text-sm text-gray-100 outline-none transition focus:border-primary-400/50 focus:bg-[#11162a]"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <FilterChip
                  label="All exams"
                  active={filterType === 'all'}
                  onClick={() => setFilterType('all')}
                />
                {isLecturer && (
                  <FilterChip
                    label="My exams"
                    active={filterType === 'my'}
                    onClick={() => setFilterType('my')}
                  />
                )}
                <FilterChip
                  label="Participated"
                  active={filterType === 'participated'}
                  onClick={() => setFilterType('participated')}
                />
              </div>
            </div>
          </div>

          {filteredExams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#070910] p-12 text-center text-gray-400">
              <p className="text-lg font-semibold text-white">No exams found</p>
              <p className="mt-2 text-sm">
                {isLecturer
                  ? 'Create your first curated exam to get started.'
                  : 'Please check back soon or contact your instructor.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredExams.map(exam => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  isOwner={exam.createdBy === user?.id}
                  onView={() => navigate(`/exam/${exam.id}`)}
                  onResults={() => navigate(`/exam/${exam.id}/results/manage`)}
                />
              ))}
            </div>
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
    <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c101f] via-[#070912] to-[#04050a] p-6 shadow-[0_35px_100px_rgba(3,5,15,0.9)] transition hover:-translate-y-1">
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-transparent to-emerald-400/20 blur-3xl" />
      </div>

      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-gray-500">
              <span>{formatDate(exam.startDate)}</span>
              <span className="text-gray-600">•</span>
              <span>{exam.duration}m</span>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {exam.title}
            </h3>
          </div>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(prev => !prev)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:text-white"
              >
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-white/10 bg-[#070a12] p-2 text-sm shadow-2xl">
                  <button
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-gray-300 hover:bg-white/5"
                    onClick={() => navigate(`/exam/edit/${exam.id}`)}
                  >
                    Edit exam
                  </button>
                  <button
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-gray-300 hover:bg-white/5"
                    onClick={onResults}
                  >
                    View results
                  </button>
                  <button className="flex w-full items-center rounded-xl px-3 py-2 text-left text-rose-300 hover:bg-rose-500/10">
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 rounded-2xl border border-white/5 bg-[#090c17] p-4 text-sm text-gray-300">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-emerald-300" />
            <span>{exam.duration} minutes</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-primary-300" />
            <span>
              {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
              Challenges
            </p>
            <p className="text-lg font-semibold text-white">
              {exam.challenges?.length || 0}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] ${
              isActive
                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-400/40 bg-rose-500/10 text-rose-200'
            }`}
          >
            {isActive ? 'Active' : 'Closed'}
          </span>
          <button
            onClick={onView}
            className="inline-flex items-center rounded-2xl bg-gradient-to-r from-primary-500 to-sky-400 px-4 py-2 text-sm font-semibold text-black shadow-[0_20px_45px_rgba(59,130,246,0.5)] transition hover:from-primary-400 hover:to-sky-300"
          >
            {isOwner ? 'Manage exam' : 'Enter exam'}
          </button>
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
  const accentClasses =
    accent === 'emerald'
      ? 'from-emerald-500/20 to-emerald-500/5 text-emerald-200'
      : accent === 'amber'
        ? 'from-amber-500/20 to-amber-500/5 text-amber-200'
        : 'from-white/10 to-transparent text-white'

  return (
    <div
      className={`rounded-2xl border border-white/5 bg-gradient-to-br ${accentClasses} p-5`}
    >
      <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  )
}

const FilterChip: React.FC<{
  label: string
  active: boolean
  onClick: () => void
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
      active
        ? 'border-primary-400/60 bg-primary-500/10 text-white'
        : 'border-white/10 text-gray-400 hover:border-primary-400/30 hover:text-white'
    }`}
  >
    {label}
  </button>
)

export default ExamList
