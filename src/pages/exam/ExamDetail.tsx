import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Eye, EyeOff, Clock, X } from 'lucide-react'
import { Exam } from '@/types/exam.types'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/api/useAuth'
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
        const mockExam: Exam = {
          id: examId || '1',
          title: 'Algorithms Midterm Test',
          password: 'test123',
          duration: 90,
          challenges: [
            {
              id: '1',
              title: 'Two Sum',
              description: 'Find two numbers that add up to target',
              difficulty: 'easy',
              topic: 'Array',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '2',
              title: 'Longest Substring',
              description: 'Find longest substring without repeating chars',
              difficulty: 'medium',
              topic: 'String',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'lecturer1',
          createdAt: new Date().toISOString(),
        }
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
  const isInstructor =
    !!user &&
    (user.role === 'admin' ||
      user.role === 'lecturer' ||
      user.id === exam.createdBy)

  return (
    <div className="min-h-screen bg-[#03040a] text-gray-100">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-primary-400/40 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {!isActive && (
            <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-rose-200">
              Exam Closed
            </span>
          )}
          {isInstructor && (
            <button
              onClick={() => navigate(`/exam/${exam.id}/results/manage`)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-200 transition hover:border-primary-400/40 hover:text-white"
            >
              Instructor stats
            </button>
          )}
        </div>

        <section className="rounded-[32px] border border-white/5 bg-gradient-to-br from-[#10142c] via-[#090b16] to-[#04050a] p-8 shadow-[0_40px_120px_rgba(3,4,12,0.9)]">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            Secure session
          </p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white lg:text-4xl">
                {exam.title}
              </h1>
              <p className="mt-3 text-sm text-gray-400">
                {formatDate(exam.startDate)} → {formatDate(exam.endDate)}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <InfoBadge
                icon={<Clock size={18} />}
                label="Duration"
                value={`${exam.duration} mins`}
              />
              <InfoBadge
                icon={<Lock size={18} />}
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

        <section className="rounded-[32px] border border-white/5 bg-[#060812] p-8 shadow-[0_40px_120px_rgba(2,3,10,0.85)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
                Exam playlist
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Challenges overview
              </h2>
            </div>
            {isActive && !isVerified && (
              <button
                onClick={handleStartExam}
                className="inline-flex items-center rounded-2xl bg-gradient-to-r from-primary-500 to-sky-400 px-4 py-2 text-sm font-semibold text-black shadow-[0_20px_55px_rgba(59,130,246,0.55)]"
              >
                Unlock exam
              </button>
            )}
          </div>

          {isActive && !isVerified ? (
            <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#070910] px-10 py-16 text-center">
              <Lock size={36} className="text-amber-300" />
              <h3 className="mt-4 text-xl font-semibold text-white">
                Enter password to preview challenges
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                This session is locked to prevent unauthorized access.
              </p>
              <button
                onClick={handleStartExam}
                className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition hover:border-primary-400/40 hover:bg-primary-500/10"
              >
                Verify access
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {exam.challenges?.map((challenge, index) => (
                <button
                  key={challenge.id}
                  onClick={() =>
                    navigate(
                      `/exam/${exam.id}/challenge/${challenge.id}/preview`
                    )
                  }
                  className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#0b0f1f] via-[#080a14] to-[#05060c] p-6 text-left shadow-[0_30px_90px_rgba(3,4,12,0.85)] transition hover:-translate-y-1"
                >
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/15 to-emerald-500/15 blur-3xl" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-gray-500">
                      <span>Challenge {index + 1}</span>
                      <span>{challenge.topic}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {challenge.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-gray-400">
                      {challenge.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-gray-300">
                        {challenge.difficulty}
                      </span>
                      <span className="text-sm font-semibold text-primary-200">
                        View detail
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/5 bg-[#05060c] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Enter password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              This exam is protected. Request the access password from your
              mentor.
            </p>

            <div className="mt-6 space-y-2">
              <div className="relative">
                <input
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
                  className={`h-12 w-full rounded-2xl border bg-[#090c19] px-4 pr-12 text-sm text-gray-100 outline-none ${
                    passwordError
                      ? 'border-rose-400/60'
                      : 'border-white/5 focus:border-primary-400/50'
                  }`}
                />
                <button
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-rose-300">{passwordError}</p>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 rounded-2xl bg-gradient-to-r from-primary-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-black shadow-[0_20px_45px_rgba(59,130,246,0.5)]"
              >
                Unlock
              </button>
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
