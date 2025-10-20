import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'

interface ProblemHeaderProps {
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  onReset?: () => void
  problemId?: string
}

const ProblemHeader: React.FC<ProblemHeaderProps> = ({
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  onReset,
  problemId,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [paused, setPaused] = useState<boolean>(false)

  // Reset timer when problem changes
  useEffect(() => {
    setElapsedSeconds(0)
    setPaused(false)
  }, [problemId])

  // Tick when not paused
  useEffect(() => {
    if (paused) return
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [paused])

  const formattedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = elapsedSeconds % 60

    const hh = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''
    const mm = minutes.toString().padStart(2, '0')
    const ss = seconds.toString().padStart(2, '0')
    return `${hh}${mm}:${ss}`
  }, [elapsedSeconds])

  const togglePause = () => setPaused(p => !p)
  const handleReset = () => {
    setElapsedSeconds(0)
    if (onReset) onReset()
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-800 bg-black px-6 py-2">
      {/* Left: Logo + arrows */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold">
          <span className="text-white">Algo</span>
          <span className="text-[#20d761]">Forge</span>
        </span>{' '}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous problem"
          className={`inline-flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors ${
            hasPrev
              ? 'border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800'
              : 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next problem"
          className={`inline-flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors ${
            hasNext
              ? 'border-gray-700 bg-green-500 text-black hover:bg-green-400'
              : 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Center: Pause | Time | Reset */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePause}
          aria-label={paused ? 'Resume timer' : 'Pause timer'}
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-700 bg-transparent text-gray-200 transition-colors hover:bg-gray-800"
        >
          {paused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </button>
        <div className="select-none text-lg font-semibold text-white">
          {formattedTime}
        </div>
        <button
          onClick={handleReset}
          aria-label="Reset problem"
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-gray-700 bg-transparent text-gray-200 transition-colors hover:bg-gray-800"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Right: User placeholder */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gray-700" aria-hidden />
        <span className="hidden text-sm text-gray-200 sm:inline"></span>
      </div>
    </div>
  )
}

export default ProblemHeader
