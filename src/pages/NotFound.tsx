import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Compass, Home, ArrowLeft } from 'lucide-react'
import Button from '@/components/common/Button/Button'

const NotFound: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div
      className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      <div
        className="mx-auto max-w-lg space-y-6 rounded-2xl border px-8 py-12 shadow-lg"
        style={{
          borderColor: 'var(--surface-border)',
          backgroundColor: 'var(--exam-panel-bg)',
        }}
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border"
          style={{
            borderColor: 'var(--surface-border)',
            backgroundColor: 'var(--editor-bg)',
          }}
        >
          <Compass size={32} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p
            className="text-sm uppercase tracking-widest"
            style={{ color: 'var(--muted-text)' }}
          >
            Error 404
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            This page got lost in the maze
          </h1>
          <p className="mt-3 text-sm" style={{ color: 'var(--muted-text)' }}>
            We couldn't find anything at
            <span className="mx-1 font-semibold text-white">
              {location.pathname}
            </span>
            . It may have been moved or never existed.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            size="sm"
            icon={<ArrowLeft size={16} />}
          >
            Go back
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
            size="sm"
            icon={<Home size={16} />}
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
