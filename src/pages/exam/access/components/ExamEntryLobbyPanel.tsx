import Button from '@/components/common/Button/Button'

type ExamEntryLobbyPanelProps = {
  status: 'eligible' | 'started'
  canStart: boolean
  actionLoading: boolean
  primaryReason: string | null
  allReasons: string[]
  requiresPassword: boolean
  passwordValue: string
  onPasswordChange: (value: string) => void
  onStartOrResume: () => void
}

const ExamEntryLobbyPanel: React.FC<ExamEntryLobbyPanelProps> = ({
  status,
  canStart,
  actionLoading,
  primaryReason,
  allReasons,
  requiresPassword,
  passwordValue,
  onPasswordChange,
  onStartOrResume,
}) => {
  return (
    <div
      className="mt-4 rounded-xl border p-5"
      style={{
        borderColor: 'var(--exam-card-border)',
        backgroundColor: 'var(--exam-card-bg)',
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--muted-text)' }}
        >
          Status:{' '}
          <span
            className="ml-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs uppercase tracking-wider text-blue-500"
            style={{
              backgroundColor: 'var(--exam-accent-subtle)',
              color: 'var(--exam-accent)',
            }}
          >
            {status}
          </span>
        </p>
      </div>

      {!canStart ? (
        <div
          className="mt-4 space-y-2 rounded-lg border p-3 text-sm"
          style={{
            borderColor: 'var(--exam-warning-subtle)',
            backgroundColor: 'var(--exam-warning-subtle)',
            color: 'var(--exam-warning)',
          }}
        >
          <p className="font-semibold">
            {primaryReason || 'Cannot start exam yet.'}
          </p>
          {allReasons.length > 1 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs opacity-80">
              {allReasons.map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {requiresPassword ? (
        <label
          className="mt-5 grid gap-2 text-sm"
          style={{ color: 'var(--muted-text)' }}
        >
          Exam password
          <input
            autoComplete="current-password"
            className="rounded-xl border px-4 py-3"
            placeholder="Enter exam password"
            style={{
              borderColor: 'var(--exam-card-border)',
              backgroundColor: 'var(--background-color)',
              color: 'var(--text-color)',
            }}
            type="password"
            value={passwordValue}
            onChange={event => onPasswordChange(event.target.value)}
          />
        </label>
      ) : null}

      <div className="mt-6">
        <Button
          onClick={onStartOrResume}
          loading={actionLoading}
          disabled={!canStart}
          fullWidth
          size="lg"
          variant={canStart ? 'primary' : 'secondary'}
        >
          {status === 'started' ? 'Resume Exam' : 'Start Exam'}
        </Button>
      </div>
    </div>
  )
}

export default ExamEntryLobbyPanel
