import React from 'react'

type ExamEntryLobbyPanelProps = {
  status: 'eligible' | 'started'
  canStart: boolean
  actionLoading: boolean
  primaryReason: string | null
  allReasons: string[]
  onStartOrResume: () => void
}

const ExamEntryLobbyPanel: React.FC<ExamEntryLobbyPanelProps> = ({
  status,
  canStart,
  actionLoading,
  primaryReason,
  allReasons,
  onStartOrResume,
}) => {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-sm text-slate-300">Status: {status}</p>
      {!canStart ? (
        <div className="mt-3 space-y-2 text-sm text-amber-100">
          <p className="font-semibold">
            {primaryReason || 'Cannot start exam yet.'}
          </p>
          {allReasons.length > 1 ? (
            <ul className="list-disc space-y-1 pl-5 text-amber-50">
              {allReasons.map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onStartOrResume}
        disabled={actionLoading || !canStart}
        className="mt-4 rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
      >
        {status === 'started'
          ? actionLoading
            ? 'Opening...'
            : 'Resume'
          : actionLoading
            ? 'Starting...'
            : 'Start'}
      </button>
    </div>
  )
}

export default ExamEntryLobbyPanel
