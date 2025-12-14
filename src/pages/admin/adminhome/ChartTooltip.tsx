import React from 'react'
import './ChartTooltip.scss'

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    color?: string
    name?: string
    value?: number | string
  }>
  label?: string
}

const ChartTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip__label">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="chart-tooltip__item"
            style={{ color: entry.color }}
          >
            <span className="chart-tooltip__name">{entry.name}:</span>
            <span className="chart-tooltip__value">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default ChartTooltip
