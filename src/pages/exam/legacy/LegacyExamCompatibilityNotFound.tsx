import React from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/api/useAuth'

const LegacyExamCompatibilityNotFound: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManageExam =
    user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'owner'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-8 text-center">
        <h1 className="text-2xl font-semibold">
          This exam link is no longer available
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          The legacy link could not be mapped to a public slug.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-semibold text-slate-950"
            onClick={() => navigate('/exam')}
          >
            Go to Exams
          </button>
          {canManageExam ? (
            <button
              type="button"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white"
              onClick={() => navigate('/admin/exams')}
            >
              Go to Admin Exams
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default LegacyExamCompatibilityNotFound
