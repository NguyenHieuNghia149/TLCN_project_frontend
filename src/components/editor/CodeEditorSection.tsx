import React, { useCallback, useRef, useState } from 'react'
import {
  ChevronDown,
  RotateCcw,
  Settings,
  Maximize2,
  Bug,
  Copy,
  Check,
} from 'lucide-react'
import MonacoEditorWrapper from './MonacoEditorWrapper'
import ConsolePanel from './ConsolePanel'
import type { TestCase, OutputState } from '@/types/editor.types'

// Types moved to src/types/editor.types.ts

interface CodeEditorSectionProps {
  code: string
  onCodeChange: (code: string) => void
  selectedLanguage: string
  onLanguageChange: (language: string) => void
  testCases: TestCase[]
  selectedTestCase: string
  onTestCaseSelect: (testCaseId: string) => void
  output: OutputState
  onRun: () => void
  onSubmit: () => void
  onReset: () => void
}

const LANGUAGES = ['C++', 'Python', 'Java', 'JavaScript']

const CodeEditorSection: React.FC<CodeEditorSectionProps> = ({
  code,
  onCodeChange,
  selectedLanguage,
  onLanguageChange,
  testCases,
  selectedTestCase,
  onTestCaseSelect,
  output,
  onRun,
  onSubmit,
  onReset,
}) => {
  const [copied, setCopied] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [consoleExpanded, setConsoleExpanded] = useState(false)
  const [consoleHeight, setConsoleHeight] = useState<number>(280)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const startResizeConsole = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const startY = e.clientY
      const startHeight = consoleHeight
      const containerEl = containerRef.current
      const containerRect = containerEl?.getBoundingClientRect()
      const maxHeight = containerRect
        ? Math.max(120, Math.floor(containerRect.height * 0.9))
        : 600

      const onMove = (ev: MouseEvent) => {
        const delta = startY - ev.clientY
        const next = Math.min(maxHeight, Math.max(120, startHeight + delta))
        setConsoleHeight(next)
        if (!consoleExpanded) setConsoleExpanded(true)
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [consoleHeight, consoleExpanded]
  )
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    'testcase' | 'output'
  >('testcase')

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex w-1/2 flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 p-3">
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 rounded bg-gray-800 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-700"
            >
              <span>{selectedLanguage}</span>
              <ChevronDown size={16} />
            </button>

            {showLanguageDropdown && (
              <div className="absolute left-0 top-full z-10 mt-1 rounded border border-gray-700 bg-gray-800 shadow-lg">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      onLanguageChange(lang)
                      setShowLanguageDropdown(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 ${
                      selectedLanguage === lang ? 'bg-gray-600' : ''
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            title="Reset Code"
            className="rounded p-2 transition-colors hover:bg-gray-800"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handleCopyCode}
            title="Copy Code"
            className="rounded p-2 transition-colors hover:bg-gray-800"
          >
            {copied ? (
              <Check size={18} className="text-green-400" />
            ) : (
              <Copy size={18} />
            )}
          </button>
          <button
            title="Settings"
            className="rounded p-2 transition-colors hover:bg-gray-800"
          >
            <Settings size={18} />
          </button>
          <button
            title="Report Bug"
            className="rounded p-2 transition-colors hover:bg-gray-800"
          >
            <Bug size={18} />
          </button>
          <button
            title="Fullscreen"
            className="rounded p-2 transition-colors hover:bg-gray-800"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div ref={containerRef} className="flex flex-1 flex-col overflow-hidden">
        {/* Monaco-style Code Editor */}
        <div className="flex-1 overflow-hidden px-3 py-3">
          <MonacoEditorWrapper
            value={code}
            onChange={onCodeChange}
            language={
              selectedLanguage.toLowerCase() === 'c++'
                ? 'cpp'
                : selectedLanguage.toLowerCase()
            }
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={startResizeConsole}
          className="h-2 w-full cursor-row-resize bg-gray-900 hover:bg-gray-800"
          title="Drag to resize"
        />
        {/* Console/Output Area - Resizable, Collapsible */}
        <ConsolePanel
          consoleExpanded={consoleExpanded}
          onToggleConsole={() => setConsoleExpanded(!consoleExpanded)}
          consoleHeight={consoleHeight}
          activeConsoleTab={activeConsoleTab}
          onConsoleTabChange={setActiveConsoleTab}
          testCases={testCases}
          selectedTestCase={selectedTestCase}
          onTestCaseSelect={onTestCaseSelect}
          output={output}
          onRun={onRun}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}

export default CodeEditorSection
