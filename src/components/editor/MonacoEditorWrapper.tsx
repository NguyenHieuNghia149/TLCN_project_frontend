import React, { Suspense } from 'react'
import MonacoEditor from './MonacoEditor'

interface MonacoEditorWrapperProps {
  value: string
  onChange: (val: string) => void
  language?: string
  readOnly?: boolean
  height?: string | number
}

const MonacoEditorWrapper: React.FC<MonacoEditorWrapperProps> = props => {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center rounded border border-gray-800 bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-gray-400">Loading Editor...</p>
          </div>
        </div>
      }
    >
      <MonacoEditor {...props} />
    </Suspense>
  )
}

export default MonacoEditorWrapper
