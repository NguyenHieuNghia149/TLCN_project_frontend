import { Camera } from 'lucide-react'
import Button from '@/components/common/Button/Button'

type ProctoringCameraOverlayProps = {
  onRequestCamera: () => Promise<boolean> | boolean | void
}

const ProctoringCameraOverlay: React.FC<ProctoringCameraOverlayProps> = ({
  onRequestCamera,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      role="alertdialog"
      aria-modal="true"
      aria-label="Camera required for proctored exam"
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
        <Camera
          size={40}
          style={{ color: 'var(--exam-danger)', margin: '0 auto' }}
        />
        <h2 className="mt-3 text-lg font-semibold">
          Camera access is required for this proctored exam.
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--muted-text)' }}>
          Allow camera access to continue working. The browser will show a
          permission prompt when you click the button below.
        </p>
        <Button
          type="button"
          className="mt-5"
          onClick={() => {
            void onRequestCamera()
          }}
        >
          Turn on camera
        </Button>
      </div>
    </div>
  )
}

export default ProctoringCameraOverlay
