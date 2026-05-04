import React from 'react'
import { Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'

type StatusTone = 'info' | 'warning' | 'danger' | 'success'

type ExamEntryStatusPanelProps = {
  title: string
  description: string
  tone?: StatusTone
  children?: React.ReactNode
}

const toneStyles: Record<
  StatusTone,
  {
    borderColor: string
    backgroundColor: string
    color: string
    icon: React.ReactNode
  }
> = {
  info: {
    borderColor: 'var(--exam-accent-subtle)',
    backgroundColor: 'var(--exam-accent-subtle)',
    color: 'var(--exam-accent)',
    icon: <Info size={20} />,
  },
  warning: {
    borderColor: 'var(--exam-warning-subtle)',
    backgroundColor: 'var(--exam-warning-subtle)',
    color: 'var(--exam-warning)',
    icon: <AlertTriangle size={20} />,
  },
  danger: {
    borderColor: 'var(--exam-danger-subtle)',
    backgroundColor: 'var(--exam-danger-subtle)',
    color: 'var(--exam-danger)',
    icon: <XCircle size={20} />,
  },
  success: {
    borderColor: 'var(--exam-success-subtle)',
    backgroundColor: 'var(--exam-success-subtle)',
    color: 'var(--exam-success)',
    icon: <CheckCircle size={20} />,
  },
}

const ExamEntryStatusPanel: React.FC<ExamEntryStatusPanelProps> = ({
  title,
  description,
  tone = 'info',
  children,
}) => {
  const style = toneStyles[tone]
  return (
    <section
      className="rounded-xl border p-5"
      style={{
        borderColor: style.borderColor,
        backgroundColor: style.backgroundColor,
        transition: 'background-color 200ms ease, border-color 200ms ease',
      }}
    >
      <div className="flex items-start gap-3">
        <span style={{ color: style.color, flexShrink: 0, marginTop: 2 }}>
          {style.icon}
        </span>
        <div>
          <h2
            className="text-base font-semibold"
            style={{ color: style.color }}
          >
            {title}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-text)' }}>
            {description}
          </p>
        </div>
      </div>
      {children ? <div className="mt-4 pl-8">{children}</div> : null}
    </section>
  )
}

export default ExamEntryStatusPanel
