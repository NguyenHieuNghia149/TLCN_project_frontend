import { AlertTriangle } from 'lucide-react'
import Button from '@/components/common/Button/Button'

type ProctoringFullscreenOverlayProps = {
  onRequestFullscreen: () => void
}

const ProctoringFullscreenOverlay: React.FC<
  ProctoringFullscreenOverlayProps
> = ({ onRequestFullscreen }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      role="alertdialog"
      aria-modal="true"
      aria-label="Fullscreen required for proctored exam"
    >
      <div
        className="w-full max-w-md rounded-xl border p-6 text-center"
        style={{
          backgroundColor: 'var(--background-color)',
          borderColor: 'var(--exam-danger)',
          color: 'var(--text-color)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <AlertTriangle
          size={40}
          style={{ color: 'var(--exam-danger)', margin: '0 auto' }}
        />
        <h2 className="mt-3 text-lg font-semibold">
          Fullscreen is required for this proctored exam.
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-text)' }}>
          The exam requires fullscreen mode. Please return to fullscreen to
          continue working.
        </p>
        <Button
          type="button"
          className="mt-5"
          onClick={() => {
            void onRequestFullscreen()
          }}
        >
          Return to fullscreen
        </Button>
      </div>
    </div>
  )
}

export default ProctoringFullscreenOverlay
