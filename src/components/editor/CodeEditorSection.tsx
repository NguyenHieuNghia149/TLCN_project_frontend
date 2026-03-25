import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  RotateCcw,
  Settings,
  Maximize2,
  Bug,
  Copy,
  Check,
  Sun,
  Moon,
} from 'lucide-react'

import { SUBMISSION_LANGUAGE_OPTIONS } from '@/constants/submissionLanguages'
import { useTheme } from '@/contexts/useTheme'
import type { TestCase, OutputState } from '@/types/editor.types'
import type { SupportedLanguage } from '@/types/submission.types'

import ConsolePanel from './ConsolePanel'
import MonacoEditorWrapper from './MonacoEditorWrapper'

interface CodeEditorSectionProps {
  code: string
  onCodeChange: (code: string) => void
  selectedLanguage: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  testCases: TestCase[]
  selectedTestCase: string
  onTestCaseSelect: (testCaseId: string) => void
  output: OutputState
  onRun: () => void
  onSubmit: () => void
  onReset: () => void
}

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
  const { theme: appTheme } = useTheme()
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>(
    appTheme === 'dark' ? 'dark' : 'light'
  )
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    'testcase' | 'output'
  >('testcase')

  const selectedLanguageOption = useMemo(
    () =>
      SUBMISSION_LANGUAGE_OPTIONS.find(
        option => option.value === selectedLanguage
      ) ?? SUBMISSION_LANGUAGE_OPTIONS[0],
    [selectedLanguage]
  )

  useEffect(() => {
    setEditorTheme(appTheme === 'dark' ? 'dark' : 'light')
  }, [appTheme])

  const startResizeConsole = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const startY = event.clientY
      const startHeight = consoleHeight
      const containerElement = containerRef.current
      const containerRect = containerElement?.getBoundingClientRect()
      const maxHeight = containerRect
        ? Math.max(120, Math.floor(containerRect.height * 0.9))
        : 600

      const onMove = (moveEvent: MouseEvent) => {
        const delta = startY - moveEvent.clientY
        const nextHeight = Math.min(
          maxHeight,
          Math.max(120, startHeight + delta)
        )
        setConsoleHeight(nextHeight)
        if (!consoleExpanded) {
          setConsoleExpanded(true)
        }
      }

      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [consoleExpanded, consoleHeight]
  )

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="flex flex-1 flex-col"
      style={{
        backgroundColor: 'var(--editor-bg)',
        border: '1px solid var(--surface-border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-between border-b p-3"
        style={{
          borderColor: 'var(--surface-border)',
          backgroundColor: 'var(--exam-toolbar-bg)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(open => !open)}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--exam-panel-bg)',
                color: 'var(--text-color)',
                border: '1px solid var(--surface-border)',
              }}
              onMouseEnter={event => {
                event.currentTarget.style.backgroundColor = 'var(--editor-bg)'
              }}
              onMouseLeave={event => {
                event.currentTarget.style.backgroundColor =
                  'var(--exam-panel-bg)'
              }}
            >
              <span>{selectedLanguageOption.label}</span>
              <ChevronDown size={16} />
            </button>

            {showLanguageDropdown && (
              <div
                className="absolute left-0 top-full z-10 mt-1 rounded border shadow-lg"
                style={{
                  backgroundColor: 'var(--exam-panel-bg)',
                  borderColor: 'var(--surface-border)',
                }}
              >
                {SUBMISSION_LANGUAGE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onLanguageChange(option.value)
                      setShowLanguageDropdown(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm transition-colors"
                    style={{
                      color: 'var(--text-color)',
                      backgroundColor:
                        selectedLanguage === option.value
                          ? 'var(--editor-bg)'
                          : 'transparent',
                    }}
                    onMouseEnter={event => {
                      if (selectedLanguage !== option.value) {
                        event.currentTarget.style.backgroundColor =
                          'var(--editor-bg)'
                      }
                    }}
                    onMouseLeave={event => {
                      if (selectedLanguage !== option.value) {
                        event.currentTarget.style.backgroundColor =
                          'transparent'
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() =>
              setEditorTheme(prevTheme =>
                prevTheme === 'dark' ? 'light' : 'dark'
              )
            }
            className="rounded px-3 py-2 transition-colors"
            style={{
              backgroundColor: 'var(--exam-panel-bg)',
              color: 'var(--text-color)',
              border: '1px solid var(--surface-border)',
            }}
            onMouseEnter={event => {
              event.currentTarget.style.backgroundColor = 'var(--editor-bg)'
            }}
            onMouseLeave={event => {
              event.currentTarget.style.backgroundColor = 'var(--exam-panel-bg)'
            }}
            title="Toggle editor theme"
            aria-label="Toggle editor theme"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {editorTheme === 'dark' ? (
                <>
                  <Sun size={16} style={{ color: 'var(--accent)' }} />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={16} style={{ color: 'var(--accent)' }} />
                  <span>Dark</span>
                </>
              )}
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            title="Reset Code"
            className="rounded p-2 transition-colors"
            style={{ color: 'var(--text-color)' }}
            onMouseEnter={event => {
              event.currentTarget.style.backgroundColor = 'var(--editor-bg)'
            }}
            onMouseLeave={event => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handleCopyCode}
            title="Copy Code"
            className="rounded p-2 transition-colors"
            style={{ color: 'var(--text-color)' }}
            onMouseEnter={event => {
              event.currentTarget.style.backgroundColor = 'var(--editor-bg)'
            }}
            onMouseLeave={event => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            {copied ? (
              <Check size={18} style={{ color: '#10b981' }} />
            ) : (
              <Copy size={18} />
            )}
          </button>
          <button
            title="Settings"
            className="rounded p-2 transition-colors"
            style={{ color: 'var(--text-color)' }}
            onMouseEnter={event => {
              event.currentTarget.style.backgroundColor = 'var(--editor-bg)'
            }}
            onMouseLeave={event => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Settings size={18} />
          </button>
          <button
            title="Report Bug"
            className="rounded p-2 transition-colors"
            style={{ color: 'var(--text-color)' }}
            onMouseEnter={event => {
              event.currentTarget.style.backgroundColor = 'var(--editor-bg)'
            }}
            onMouseLeave={event => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Bug size={18} />
          </button>
          <button
            title="Fullscreen"
            className="rounded p-2 transition-colors"
            style={{ color: 'var(--text-color)' }}
            onMouseEnter={event => {
              event.currentTarget.style.backgroundColor = 'var(--editor-bg)'
            }}
            onMouseLeave={event => {
              event.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex flex-1 flex-col overflow-hidden"
        style={{ minHeight: 0 }}
      >
        <div
          className="flex-1 overflow-hidden px-3 py-3"
          style={{ minHeight: 0 }}
        >
          <MonacoEditorWrapper
            value={code}
            onChange={onCodeChange}
            language={selectedLanguageOption.monacoLanguage}
            editorTheme={
              editorTheme === 'dark' ? 'custom-dark' : 'custom-light'
            }
          />
        </div>

        <div
          onMouseDown={startResizeConsole}
          className="h-2 w-full cursor-row-resize transition-colors"
          style={{ backgroundColor: 'var(--surface-border)' }}
          title="Drag to resize"
          onMouseEnter={event => {
            event.currentTarget.style.backgroundColor = 'var(--accent)'
          }}
          onMouseLeave={event => {
            event.currentTarget.style.backgroundColor = 'var(--surface-border)'
          }}
        />
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
