import { useEffect, useRef, useState } from 'react'
import { Minimize2, Maximize2 } from 'lucide-react'

type ProctoringPreviewWidgetProps = {
  cameraActive: boolean
  screenShareActive: boolean
  fullscreenActive: boolean
  cameraRequired: boolean
  screenShareRequired: boolean
  fullscreenRequired: boolean
  cameraStream: MediaStream | null
}

const ProctoringPreviewWidget: React.FC<ProctoringPreviewWidgetProps> = ({
  cameraActive,
  screenShareActive,
  fullscreenActive,
  cameraRequired,
  screenShareRequired,
  fullscreenRequired,
  cameraStream,
}) => {
  const [minimized, setMinimized] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    } else if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [cameraStream])

  const hasAnyRequired =
    cameraRequired || screenShareRequired || fullscreenRequired
  if (!hasAnyRequired) return null

  const cameraStatus = cameraRequired
    ? cameraActive
      ? 'Camera active'
      : 'Camera inactive'
    : null
  const screenStatus = screenShareRequired
    ? screenShareActive
      ? 'Screen sharing active'
      : 'Screen sharing inactive'
    : null
  const fullscreenStatus = fullscreenRequired
    ? fullscreenActive
      ? 'Fullscreen active'
      : 'Fullscreen inactive'
    : null

  if (minimized) {
    return (
      <div
        data-testid="proctoring-minimized-indicator"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border px-3 py-2"
        style={{
          backgroundColor: 'var(--exam-card-bg)',
          borderColor: 'var(--exam-card-border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            backgroundColor:
              (!cameraRequired || cameraActive) &&
              (!screenShareRequired || screenShareActive) &&
              (!fullscreenRequired || fullscreenActive)
                ? 'var(--exam-success)'
                : 'var(--exam-warning)',
          }}
        />
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium"
          style={{
            color: 'var(--muted-text)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setMinimized(false)}
          aria-label="Restore proctoring preview"
        >
          <Maximize2 size={12} />
          Restore
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-40 rounded-xl border text-xs"
      style={{
        backgroundColor: 'var(--exam-card-bg)',
        borderColor: 'var(--exam-card-border)',
        color: 'var(--text-color)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        width: '200px',
      }}
      role="status"
      aria-label="Proctoring device status"
    >
      {cameraRequired && cameraActive && cameraStream ? (
        <div
          className="overflow-hidden rounded-t-xl"
          style={{ backgroundColor: '#000' }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '112px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      ) : cameraRequired ? (
        <div
          className="flex items-center justify-center rounded-t-xl"
          style={{
            backgroundColor: 'var(--exam-danger-subtle)',
            height: '112px',
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--exam-danger)' }}
          >
            No camera feed
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between px-3 py-2">
        <span
          className="text-xs font-semibold"
          style={{ color: 'var(--muted-text)' }}
        >
          Proctoring
        </span>
        <button
          type="button"
          className="flex items-center rounded p-1"
          style={{
            color: 'var(--muted-text)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setMinimized(true)}
          aria-label="Minimize proctoring preview"
        >
          <Minimize2 size={12} />
        </button>
      </div>

      <div className="space-y-1 px-3 pb-3">
        {cameraStatus ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: cameraActive
                  ? 'var(--exam-success)'
                  : 'var(--exam-danger)',
              }}
            />
            <span style={{ color: 'var(--muted-text)' }}>{cameraStatus}</span>
          </div>
        ) : null}
        {screenStatus ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: screenShareActive
                  ? 'var(--exam-success)'
                  : 'var(--exam-danger)',
              }}
            />
            <span style={{ color: 'var(--muted-text)' }}>{screenStatus}</span>
          </div>
        ) : null}
        {fullscreenStatus ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: fullscreenActive
                  ? 'var(--exam-success)'
                  : 'var(--exam-danger)',
              }}
            />
            <span style={{ color: 'var(--muted-text)' }}>
              {fullscreenStatus}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ProctoringPreviewWidget
