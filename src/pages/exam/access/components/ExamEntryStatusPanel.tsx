import React from 'react'

type StatusTone = 'info' | 'warning' | 'danger' | 'success'

type ExamEntryStatusPanelProps = {
  title: string
  description: string
  tone?: StatusTone
  children?: React.ReactNode
}

const toneClassMap: Record<StatusTone, string> = {
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  danger: 'border-rose-400/30 bg-rose-400/10 text-rose-100',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
}

const ExamEntryStatusPanel: React.FC<ExamEntryStatusPanelProps> = ({
  title,
  description,
  tone = 'info',
  children,
}) => {
  return (
    <section className={`rounded-2xl border p-6 ${toneClassMap[tone]}`}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  )
}

export default ExamEntryStatusPanel
