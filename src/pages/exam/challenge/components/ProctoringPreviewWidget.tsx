import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Minimize2, Maximize2 } from 'lucide-react'

type ProctoringPreviewWidgetProps = {
  cameraActive: boolean
  fullscreenActive: boolean
  screenShareActive: boolean
  cameraRequired: boolean
  fullscreenRequired: boolean
  screenShareRequired: boolean
  cameraStream: MediaStream | null
  onRequestCamera?: () => Promise<boolean> | boolean | void
}

type DragOffset = {
  x: number
  y: number
}

type DragStart = {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

const ProctoringPreviewWidget: React.FC<ProctoringPreviewWidgetProps> = ({
  cameraActive,
  fullscreenActive,
  screenShareActive,
  cameraRequired,
  fullscreenRequired,
  screenShareRequired,
  cameraStream,
  onRequestCamera,
}) => {
  const [minimized, setMinimized] = useState(false)
  const [requestingCamera, setRequestingCamera] = useState(false)
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 })
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const dragStartRef = useRef<DragStart | null>(null)

  const startDragging = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return

      event.preventDefault()
      dragStartRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: dragOffset.x,
        originY: dragOffset.y,
      }
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    [dragOffset.x, dragOffset.y]
  )

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const dragStart = dragStartRef.current
      if (!dragStart || event.pointerId !== dragStart.pointerId) return

      event.preventDefault()
      setDragOffset({
        x: dragStart.originX + event.clientX - dragStart.startX,
        y: dragStart.originY + event.clientY - dragStart.startY,
      })
    }

    const onPointerUp = (event: PointerEvent) => {
      const dragStart = dragStartRef.current
      if (!dragStart || event.pointerId !== dragStart.pointerId) return
      dragStartRef.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  const handleRequestCamera = async () => {
    if (!onRequestCamera) return

    setRequestingCamera(true)
    try {
      await onRequestCamera()
    } finally {
      setRequestingCamera(false)
    }
  }

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    } else if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [cameraStream, minimized])

  const hasAnyRequired =
    cameraRequired || fullscreenRequired || screenShareRequired
  if (!hasAnyRequired) return null

  const cameraStatus = cameraRequired
    ? cameraActive
      ? 'Camera active'
      : 'Camera inactive'
    : null
  const fullscreenStatus = fullscreenRequired
    ? fullscreenActive
      ? 'Fullscreen active'
      : 'Fullscreen inactive'
    : null
  const screenShareStatus = screenShareRequired
    ? screenShareActive
      ? 'Screen share active'
      : 'Screen share inactive'
    : null
  const floatingStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
  }

  if (minimized) {
    return (
      <div
        data-testid="proctoring-minimized-indicator"
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border px-3 py-2"
        style={{
          backgroundColor: 'var(--exam-card-bg)',
          borderColor: 'var(--exam-card-border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          ...floatingStyle,
        }}
      >
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            backgroundColor:
              (!cameraRequired || cameraActive) &&
              (!fullscreenRequired || fullscreenActive) &&
              (!screenShareRequired || screenShareActive)
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
      data-testid="proctoring-preview-widget"
      className="fixed bottom-4 right-4 z-40 rounded-xl border text-xs"
      style={{
        backgroundColor: 'var(--exam-card-bg)',
        borderColor: 'var(--exam-card-border)',
        color: 'var(--text-color)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        width: '200px',
        ...floatingStyle,
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

      <div
        className="flex items-center justify-between px-3 py-2"
        aria-label="Drag proctoring preview"
        onPointerDown={startDragging}
        style={{ cursor: 'move', touchAction: 'none' }}
      >
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
          onClick={event => {
            event.stopPropagation()
            setMinimized(true)
          }}
          onPointerDown={event => event.stopPropagation()}
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
        {screenShareStatus ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{
                backgroundColor: screenShareActive
                  ? 'var(--exam-success)'
                  : 'var(--exam-danger)',
              }}
            />
            <span style={{ color: 'var(--muted-text)' }}>
              {screenShareStatus}
            </span>
          </div>
        ) : null}
        {cameraRequired && !cameraActive && onRequestCamera ? (
          <button
            type="button"
            className="mt-2 w-full rounded px-2 py-1 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--exam-primary)',
              border: 'none',
              color: '#fff',
              cursor: requestingCamera ? 'wait' : 'pointer',
              opacity: requestingCamera ? 0.8 : 1,
            }}
            disabled={requestingCamera}
            onClick={() => {
              void handleRequestCamera()
            }}
          >
            {requestingCamera ? 'Requesting camera...' : 'Turn on camera'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default ProctoringPreviewWidget
