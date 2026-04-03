import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Copy,
  Maximize2,
  Minimize2,
  Moon,
  RotateCcw,
  Sun,
} from 'lucide-react'

import {
  SUBMISSION_LANGUAGE_OPTIONS,
  type LanguageOption,
} from '@/constants/submissionLanguages'
import { useTheme } from '@/contexts/useTheme'
import type { OutputState, TestCase } from '@/types/editor.types'
import type { SupportedLanguage } from '@/types/submission.types'

import ConsolePanel from './ConsolePanel'
import MonacoEditorWrapper from './MonacoEditorWrapper'

import './CodeEditorSection.css'

interface CodeEditorSectionProps {
  code: string
  onCodeChange: (code: string) => void
  selectedLanguage: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  languageOptions?: LanguageOption[]
  testCases: TestCase[]
  selectedTestCase: string
  onTestCaseSelect: (testCaseId: string) => void
  output: OutputState
  onRun: () => void
  onSubmit: () => void
  onReset: () => void
}

const DEFAULT_FONT_SIZE = 16
const MIN_FONT_SIZE = 13
const MAX_FONT_SIZE = 20

const CodeEditorSection: React.FC<CodeEditorSectionProps> = ({
  code,
  onCodeChange,
  selectedLanguage,
  onLanguageChange,
  languageOptions,
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
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>('dark')
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    'testcase' | 'output'
  >('testcase')
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on')
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const { theme: appTheme } = useTheme()

  const availableLanguageOptions =
    languageOptions && languageOptions.length > 0
      ? languageOptions
      : SUBMISSION_LANGUAGE_OPTIONS

  const selectedLanguageOption = useMemo(
    () =>
      availableLanguageOptions.find(
        option => option.value === selectedLanguage
      ) ?? availableLanguageOptions[0],
    [availableLanguageOptions, selectedLanguage]
  )

  useEffect(() => {
    setEditorTheme(appTheme === 'dark' ? 'dark' : 'light')
  }, [appTheme])

  useEffect(() => {
    if (!isFullscreen) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

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

  const handleCopyCode = async () => {
    if (!navigator.clipboard?.writeText) {
      return
    }

    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const isDarkEditor = editorTheme === 'dark'
  const editorLineHeight = useMemo(
    () => Math.round(fontSize * 1.65),
    [fontSize]
  )

  const shellStyle = useMemo(
    () =>
      ({
        '--code-editor-shell-bg': isDarkEditor ? '#1f1f1f' : '#f8fafc',
        '--code-editor-header-bg': isDarkEditor ? '#242424' : '#ffffff',
        '--code-editor-panel-bg': isDarkEditor ? '#1f1f1f' : '#f8fafc',
        '--code-editor-monaco-frame': isDarkEditor ? '#232323' : '#ffffff',
        '--code-editor-border': isDarkEditor
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(15, 23, 42, 0.12)',
        '--code-editor-text': isDarkEditor
          ? 'rgba(255, 255, 255, 0.86)'
          : '#0f172a',
        '--code-editor-text-strong': isDarkEditor ? '#ffffff' : '#020617',
        '--code-editor-muted': isDarkEditor
          ? 'rgba(255, 255, 255, 0.62)'
          : '#475569',
        '--code-editor-control-bg': isDarkEditor
          ? 'rgba(255, 255, 255, 0.03)'
          : 'rgba(255, 255, 255, 0.94)',
        '--code-editor-control-hover': isDarkEditor
          ? 'rgba(255, 255, 255, 0.08)'
          : '#eff6ff',
        '--code-editor-control-active': isDarkEditor
          ? 'rgba(98, 176, 255, 0.14)'
          : '#dbeafe',
        '--code-editor-accent-border': isDarkEditor
          ? 'rgba(98, 176, 255, 0.34)'
          : 'rgba(37, 99, 235, 0.24)',
        '--code-editor-badge-bg': isDarkEditor
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(15, 23, 42, 0.06)',
        '--code-editor-shadow': isDarkEditor
          ? '0 18px 40px rgba(0, 0, 0, 0.24)'
          : '0 16px 32px rgba(15, 23, 42, 0.12)',
        '--code-editor-backdrop': 'rgba(8, 10, 14, 0.72)',
      }) as React.CSSProperties,
    [isDarkEditor]
  )

  const languageControlSurface = isDarkEditor
    ? 'rgba(255, 255, 255, 0.03)'
    : 'rgba(255, 255, 255, 0.94)'
  const languageControlHoverSurface = isDarkEditor
    ? 'rgba(255, 255, 255, 0.08)'
    : '#eff6ff'
  const languageMenuSurface = isDarkEditor ? '#252525' : '#ffffff'
  const languageMenuHoverSurface = isDarkEditor
    ? 'rgba(255, 255, 255, 0.08)'
    : '#f1f5f9'
  const languageMenuSelectedSurface = isDarkEditor
    ? 'rgba(98, 176, 255, 0.14)'
    : '#dbeafe'

  return (
    <>
      {isFullscreen && (
        <button
          type="button"
          className="code-editor-backdrop"
          aria-label="Close fullscreen editor"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      <div
        ref={containerRef}
        role={isFullscreen ? 'dialog' : undefined}
        aria-modal={isFullscreen || undefined}
        aria-label={isFullscreen ? 'Code editor' : undefined}
        className={`code-editor-shell ${isFullscreen ? 'code-editor-shell--fullscreen' : ''}`}
        style={shellStyle}
      >
        <div className="code-editor-toolbar">
          <div className="code-editor-toolbar__group">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(open => !open)}
                className="code-editor-control"
                style={{
                  backgroundColor: languageControlSurface,
                  borderColor: 'var(--code-editor-border)',
                }}
                onMouseEnter={event => {
                  event.currentTarget.style.backgroundColor =
                    languageControlHoverSurface
                }}
                onMouseLeave={event => {
                  event.currentTarget.style.backgroundColor =
                    languageControlSurface
                }}
              >
                <span>{selectedLanguageOption?.label ?? selectedLanguage}</span>
                <ChevronDown size={16} />
              </button>

              {showLanguageDropdown && (
                <div
                  className="code-editor-dropdown"
                  style={{ backgroundColor: languageMenuSurface }}
                >
                  {availableLanguageOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className="code-editor-dropdown-item"
                      data-selected={selectedLanguage === option.value}
                      style={{
                        backgroundColor:
                          selectedLanguage === option.value
                            ? languageMenuSelectedSurface
                            : languageMenuSurface,
                      }}
                      onClick={() => {
                        onLanguageChange(option.value)
                        setShowLanguageDropdown(false)
                      }}
                      onMouseEnter={event => {
                        if (selectedLanguage !== option.value) {
                          event.currentTarget.style.backgroundColor =
                            languageMenuHoverSurface
                        }
                      }}
                      onMouseLeave={event => {
                        if (selectedLanguage !== option.value) {
                          event.currentTarget.style.backgroundColor =
                            languageMenuSurface
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
              type="button"
              onClick={() =>
                setEditorTheme(prevTheme =>
                  prevTheme === 'dark' ? 'light' : 'dark'
                )
              }
              className="code-editor-control"
              aria-label="Toggle editor theme"
              title="Toggle editor theme"
            >
              {editorTheme === 'dark' ? (
                <>
                  <Sun size={16} />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={16} />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="code-editor-control"
              aria-pressed={wordWrap === 'on'}
              aria-label={
                wordWrap === 'on' ? 'Disable word wrap' : 'Enable word wrap'
              }
              title={
                wordWrap === 'on' ? 'Disable word wrap' : 'Enable word wrap'
              }
              onClick={() =>
                setWordWrap(current => (current === 'on' ? 'off' : 'on'))
              }
            >
              <span>Wrap</span>
              <span className="code-editor-control__badge">
                {wordWrap === 'on' ? 'On' : 'Off'}
              </span>
            </button>
          </div>

          <div className="code-editor-toolbar__group">
            <button
              type="button"
              className="code-editor-icon-button"
              aria-label="Decrease font size"
              title="Decrease font size"
              onClick={() =>
                setFontSize(current => Math.max(MIN_FONT_SIZE, current - 1))
              }
            >
              <span className="text-xs font-semibold">A-</span>
            </button>

            <div className="code-editor-font-chip" aria-live="polite">
              {fontSize}px
            </div>

            <button
              type="button"
              className="code-editor-icon-button"
              aria-label="Increase font size"
              title="Increase font size"
              onClick={() =>
                setFontSize(current => Math.min(MAX_FONT_SIZE, current + 1))
              }
            >
              <span className="text-xs font-semibold">A+</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              title="Reset code"
              aria-label="Reset code"
              className="code-editor-icon-button"
            >
              <RotateCcw size={18} />
            </button>

            <button
              type="button"
              onClick={() => void handleCopyCode()}
              title="Copy code"
              aria-label="Copy code"
              className="code-editor-icon-button"
            >
              {copied ? (
                <Check size={18} style={{ color: '#10b981' }} />
              ) : (
                <Copy size={18} />
              )}
            </button>

            <button
              type="button"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="code-editor-icon-button"
              onClick={() => setIsFullscreen(open => !open)}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        <div className="code-editor-body">
          <div className="code-editor-frame">
            <div className="code-editor-monaco-frame">
              <MonacoEditorWrapper
                value={code}
                onChange={onCodeChange}
                language={selectedLanguageOption?.monacoLanguage ?? 'plaintext'}
                editorTheme={
                  editorTheme === 'dark' ? 'custom-dark' : 'custom-light'
                }
                fontSize={fontSize}
                lineHeight={editorLineHeight}
                wordWrap={wordWrap}
              />
            </div>
          </div>

          <div
            onMouseDown={startResizeConsole}
            className="code-editor-resizer"
            title="Drag to resize"
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
    </>
  )
}

export default CodeEditorSection
