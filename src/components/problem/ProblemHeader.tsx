import React, { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  User,
} from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext/useAuthContext'
import { Link } from 'react-router-dom'

interface ProblemHeaderProps {
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  onReset?: () => void
  problemId?: string
  navigationLoading?: boolean
}

const ProblemHeader: React.FC<ProblemHeaderProps> = ({
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  onReset,
  problemId,
  navigationLoading = false,
}) => {
  const { user, isAuthenticated } = useAuthContext()
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
        <Link to="/dashboard" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">
            <span className="text-white">Algo</span>
            <span className="text-[#20d761]">Forge</span>
          </span>
        </Link>
        <button
          onClick={onPrev}
          disabled={!hasPrev || navigationLoading}
          aria-label="Previous problem"
          title={
            hasPrev ? 'Go to previous problem (Alt + ←)' : 'No previous problem'
          }
          className={`group relative inline-flex h-8 w-8 items-center justify-center rounded border text-sm transition-all duration-200 ${
            hasPrev && !navigationLoading
              ? 'border-gray-700 bg-transparent text-gray-200 hover:scale-105 hover:bg-gray-800'
              : 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          {hasPrev && !navigationLoading && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Previous (Alt + ←)
            </div>
          )}
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext || navigationLoading}
          aria-label="Next problem"
          title={hasNext ? 'Go to next problem (Alt + →)' : 'No next problem'}
          className={`group relative inline-flex h-8 w-8 items-center justify-center rounded border text-sm transition-all duration-200 ${
            hasNext && !navigationLoading
              ? 'border-gray-700 bg-green-500 text-black hover:scale-105 hover:bg-green-400'
              : 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
          {hasNext && !navigationLoading && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Next (Alt + →)
            </div>
          )}
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

      {/* Right: User info */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.firstname} ${user.lastname}`}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-medium text-gray-200">
                {user.firstname} {user.lastname}
              </span>
              <div className="text-xs text-gray-400">{user.email}</div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <span className="hidden text-sm text-gray-400 sm:inline">
              Guest User
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProblemHeader
