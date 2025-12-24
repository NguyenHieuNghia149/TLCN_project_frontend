import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import TestCasePanel from '../problem/TestCasePanel'
import type { TestCase, OutputState } from '@/types/editor.types'
import {
  getSubmissionStatusLabel,
  getSubmissionStatusColor,
} from '@/utils/submissionStatus'

// Types moved to src/types/editor.types.ts

interface ConsolePanelProps {
  consoleExpanded: boolean
  onToggleConsole: () => void
  consoleHeight?: number
  activeConsoleTab: 'testcase' | 'output'
  onConsoleTabChange: (tab: 'testcase' | 'output') => void
  testCases: TestCase[]
  selectedTestCase: string
  onTestCaseSelect: (testCaseId: string) => void
  output: OutputState
  onRun: () => void
  onSubmit: () => void
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({
  consoleExpanded,
  onToggleConsole,
  consoleHeight,
  activeConsoleTab,
  onConsoleTabChange,
  testCases,
  selectedTestCase,
  onTestCaseSelect,
  output,
  onRun,
  onSubmit,
}) => {
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0)
  // Using stacked layout (no tabs)

  useEffect(() => {
    if (Array.isArray(output.results) && output.results.length > 0) {
      // Clamp index if results length changed
      setSelectedResultIndex(prev =>
        Math.min(prev, output.results ? output.results.length - 1 : 0)
      )
    } else {
      setSelectedResultIndex(0)
    }
  }, [output.results])

  return (
    <div
      className="flex flex-col border-t transition-all duration-300"
      style={{
        height: consoleExpanded ? consoleHeight || 320 : 110,
        backgroundColor: 'var(--exam-panel-bg)',
        borderColor: 'var(--surface-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b px-4 py-3 transition-colors"
        style={{ borderColor: 'var(--surface-border)' }}
        onClick={onToggleConsole}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--editor-bg)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{ color: 'var(--text-color)' }}
        >
          {consoleExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
          <span className="font-semibold">Console</span>
        </div>
      </div>

      {/* Tabs */}
      {consoleExpanded && (
        <>
          <div
            className="flex border-b"
            style={{
              borderColor: 'var(--surface-border)',
              backgroundColor: 'var(--exam-toolbar-bg)',
            }}
          >
            <button
              onClick={() => onConsoleTabChange('testcase')}
              className="rounded px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  activeConsoleTab === 'testcase'
                    ? 'var(--accent)'
                    : 'transparent',
                color:
                  activeConsoleTab === 'testcase'
                    ? '#ffffff'
                    : 'var(--muted-text)',
                marginLeft: '0.5rem',
              }}
              onMouseEnter={e => {
                if (activeConsoleTab !== 'testcase') {
                  e.currentTarget.style.backgroundColor = 'var(--editor-bg)'
                  e.currentTarget.style.color = 'var(--text-color)'
                }
              }}
              onMouseLeave={e => {
                if (activeConsoleTab !== 'testcase') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--muted-text)'
                }
              }}
            >
              Test Case
            </button>
            <button
              onClick={() => onConsoleTabChange('output')}
              className="ml-2 rounded px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  activeConsoleTab === 'output'
                    ? 'var(--accent)'
                    : 'transparent',
                color:
                  activeConsoleTab === 'output'
                    ? '#ffffff'
                    : 'var(--muted-text)',
              }}
              onMouseEnter={e => {
                if (activeConsoleTab !== 'output') {
                  e.currentTarget.style.backgroundColor = 'var(--editor-bg)'
                  e.currentTarget.style.color = 'var(--text-color)'
                }
              }}
              onMouseLeave={e => {
                if (activeConsoleTab !== 'output') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--muted-text)'
                }
              }}
            >
              Output
            </button>
          </div>

          {/* Console Content */}
          {activeConsoleTab === 'testcase' && (
            <TestCasePanel
              testCases={testCases}
              selectedTestCase={selectedTestCase}
              onTestCaseSelect={onTestCaseSelect}
            />
          )}

          {activeConsoleTab === 'output' && (
            <div
              className="flex min-h-0 flex-1 overflow-hidden"
              style={{ backgroundColor: 'var(--exam-panel-bg)' }}
            >
              {/* When running or idle, show single column status */}
              {output.status === 'running' && (
                <div className="space-y-4 p-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    {output.message}
                  </div>
                </div>
              )}

              {output.status !== 'running' && (
                <div className="flex min-h-0 w-full flex-col">
                  {/* Submit: Simple summary only */}
                  {output.isSubmit ? (
                    <div className="flex min-h-0 flex-1 items-center justify-center p-8">
                      <div className="text-center">
                        {(() => {
                          const hasResults =
                            Array.isArray(output.results) &&
                            output.results.length > 0

                          if (!hasResults) {
                            return (
                              <div className="text-lg text-[var(--muted-text)]">
                                {output.message}
                              </div>
                            )
                          }

                          const allPassed = output.results!.every(
                            r => r.ok === true
                          )
                          const passedCount = output.passedTests ?? 0
                          const totalCount =
                            output.totalTests ?? output.results!.length

                          // Use normalized status for label and color
                          const statusLabel = output.normalizedStatus
                            ? getSubmissionStatusLabel(output.normalizedStatus)
                            : allPassed
                              ? 'Accepted'
                              : 'Failed'
                          const statusColor = output.normalizedStatus
                            ? getSubmissionStatusColor(output.normalizedStatus)
                            : allPassed
                              ? 'text-green-400'
                              : 'text-red-400'

                          if (allPassed) {
                            return (
                              <>
                                <div
                                  className={`mb-4 text-4xl font-bold ${statusColor}`}
                                >
                                  ✓ {statusLabel}
                                </div>
                                <div className="text-lg text-[var(--muted-text)]">
                                  Passed test cases: {passedCount}/{totalCount}
                                </div>
                                <div className="mt-6 rounded border border-green-700 bg-green-900/20 p-4 text-green-200">
                                  🎉 You have successfully completed this
                                  problem!
                                </div>
                              </>
                            )
                          } else {
                            return (
                              <>
                                <div
                                  className={`mb-4 text-4xl font-bold ${statusColor}`}
                                >
                                  ✗ {statusLabel}
                                </div>
                                <div className="text-lg text-[var(--muted-text)]">
                                  Passed test cases: {passedCount}/{totalCount}
                                </div>
                                {output.error && (
                                  <div className="mt-6 rounded border border-red-700 bg-red-900/20 p-4 text-left">
                                    <div className="mb-2 text-sm font-semibold text-red-300">
                                      Error
                                    </div>
                                    <pre className="whitespace-pre-wrap font-mono text-xs text-red-200">
                                      {output.error}
                                    </pre>
                                  </div>
                                )}
                              </>
                            )
                          }
                        })()}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Run: Detailed testcase view */}
                      <div className="flex items-center gap-3">
                        {Array.isArray(output.results) &&
                        output.results.length > 0 ? (
                          output.results.map((r, idx) => {
                            const isSelected = selectedResultIndex === idx
                            // Color logic: failed => red, passed/undefined => neutral; selected => blue
                            const statusClass =
                              r.ok === false
                                ? 'bg-red-800 text-red-50 hover:bg-red-700'
                                : 'bg-[var(--surface-border)] text-[var(--text-color)] hover:opacity-80'
                            const cls = isSelected
                              ? 'bg-blue-600 text-white'
                              : statusClass
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedResultIndex(idx)}
                                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${cls}`}
                              >
                                Case {idx + 1}
                              </button>
                            )
                          })
                        ) : (
                          <span className="text-xs text-[var(--muted-text)]">
                            No results
                          </span>
                        )}
                      </div>
                      {output.passedTests !== undefined &&
                        output.totalTests !== undefined && (
                          <div className="ml-auto mr-4 text-right text-sm text-[var(--muted-text)]">
                            Passed test cases: {output.passedTests}/
                            {output.totalTests}
                          </div>
                        )}
                      {/* Detail panel stacked sections */}
                      <div className="min-w-0 flex-1 overflow-auto bg-[var(--code-bg)] p-4">
                        {/* Summary header - Check actual results */}
                        <div className="mb-3 space-y-1">
                          {(() => {
                            const hasResults =
                              Array.isArray(output.results) &&
                              output.results.length > 0

                            if (!hasResults) {
                              return null
                            }

                            const allPassed = output.results!.every(
                              r => r.ok === true
                            )
                            const passedCount = output.results!.filter(
                              r => r.ok === true
                            ).length
                            const totalCount = output.results!.length

                            if (allPassed) {
                              return (
                                <>
                                  <div className="font-semibold text-green-400">
                                    ✓ All Test Cases Passed
                                  </div>
                                  <div className="text-sm text-[var(--muted-text)]">
                                    {passedCount}/{totalCount} test cases passed
                                  </div>
                                </>
                              )
                            } else {
                              return (
                                <>
                                  <div className="font-semibold text-red-400">
                                    ✗ Some Test Cases Failed
                                  </div>
                                  <div className="text-sm text-[var(--muted-text)]">
                                    {passedCount}/{totalCount} test cases passed
                                  </div>
                                </>
                              )
                            }
                          })()}
                          {typeof output.processingTime === 'number' && (
                            <div className="text-xs text-[var(--muted-text)]">
                              Time: {output.processingTime} ms
                            </div>
                          )}
                          {output.error && (
                            <pre className="whitespace-pre-wrap rounded border border-red-600 bg-red-900/30 p-3 font-mono text-sm text-red-200">
                              {output.error}
                            </pre>
                          )}
                        </div>

                        {/* Selected result details stacked */}
                        {Array.isArray(output.results) &&
                          output.results.length > 0 && (
                            <>
                              {(() => {
                                const r =
                                  output.results![selectedResultIndex] ||
                                  output.results![0]
                                return (
                                  <div className="space-y-4">
                                    {r.stderr && (
                                      <div>
                                        <div className="mb-1 text-sm font-semibold text-red-300">
                                          {(() => {
                                            const stderr =
                                              r.stderr.toLowerCase()
                                            if (
                                              stderr.includes('time limit') ||
                                              stderr.includes('timeout')
                                            ) {
                                              return '⏱ Time Limit Exceeded'
                                            }
                                            if (
                                              stderr.includes('memory limit') ||
                                              stderr.includes('out of memory')
                                            ) {
                                              return '💾 Memory Limit Exceeded'
                                            }
                                            if (
                                              stderr.includes(
                                                'runtime error'
                                              ) ||
                                              stderr.includes(
                                                'segmentation fault'
                                              ) ||
                                              stderr.includes('sigsegv')
                                            ) {
                                              return '⚠️ Runtime Error'
                                            }
                                            if (
                                              stderr.includes(
                                                'compilation error'
                                              )
                                            ) {
                                              return '🔧 Compilation Error'
                                            }
                                            return '❌ Error'
                                          })()}
                                        </div>
                                        <pre className="whitespace-pre-wrap rounded border border-red-600 bg-red-900/30 p-3 font-mono text-sm text-red-200">
                                          {r.stderr}
                                        </pre>
                                      </div>
                                    )}
                                    {!r.ok && !r.stderr && (
                                      <div>
                                        <div className="mb-1 text-sm font-semibold text-yellow-300">
                                          ❓ Wrong Answer
                                        </div>
                                        <div className="text-xs text-[var(--muted-text)]">
                                          Output does not match expected output
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-sm text-[var(--muted-text)]">
                                        Input:
                                      </span>
                                      <div className="mt-1 rounded border border-[var(--surface-border)] bg-[var(--exam-panel-bg)] px-3 py-2 font-mono text-sm text-[var(--text-color)]">
                                        {r.input}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-sm text-[var(--muted-text)]">
                                        Expected output:
                                      </span>
                                      {(() => {
                                        const related = testCases[r.index]
                                        const isPublic =
                                          related?.isPublic !== false
                                        if (isPublic) {
                                          return (
                                            <div className="mt-1 rounded border border-[var(--surface-border)] bg-[var(--exam-panel-bg)] px-3 py-2 font-mono text-sm text-[var(--text-color)]">
                                              {r.expectedOutput}
                                            </div>
                                          )
                                        }
                                        return (
                                          <div className="mt-1 rounded border border-[var(--surface-border)] bg-[var(--exam-panel-bg)] px-3 py-2 text-sm text-[var(--muted-text)]">
                                            🔒 Output is hidden for private test
                                            case
                                          </div>
                                        )
                                      })()}
                                    </div>
                                    <div>
                                      <span className="text-sm text-[var(--muted-text)]">
                                        Your output:
                                      </span>
                                      <div
                                        className={`mt-1 rounded border px-3 py-2 font-mono text-sm ${r.ok ? 'border-green-700 bg-green-900/20 text-green-200' : 'border-[var(--surface-border)] bg-[var(--exam-panel-bg)] text-[var(--text-color)]'}`}
                                      >
                                        {r.actualOutput}
                                      </div>
                                    </div>
                                    <div className="text-xs text-[var(--muted-text)]">
                                      #{r.index} • • Time: {r.executionTime} ms
                                    </div>
                                  </div>
                                )
                              })()}
                            </>
                          )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {output.status === 'idle' && (
                <div className="text-[var(--muted-text)]">{output.message}</div>
              )}
            </div>
          )}
        </>
      )}

      {/* Submit Buttons - Always visible */}
      <div
        className="flex items-center justify-between border-t px-4 py-3"
        style={{
          borderColor: 'var(--surface-border)',
          backgroundColor: 'var(--exam-toolbar-bg)',
        }}
      >
        <button
          onClick={onToggleConsole}
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '0.8'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          {consoleExpanded ? 'Collapse' : 'Expand'} Console
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!consoleExpanded) onToggleConsole()
              onConsoleTabChange('output')
              onRun()
            }}
            className="rounded px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{
              backgroundColor: 'var(--editor-bg)',
              color: 'var(--text-color)',
              border: '1px solid var(--surface-border)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--exam-panel-bg)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--editor-bg)'
            }}
          >
            Run
          </button>
          <button
            onClick={() => {
              if (!consoleExpanded) onToggleConsole()
              onConsoleTabChange('output')
              onSubmit()
            }}
            className="rounded px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#10b981' }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#059669'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#10b981'
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsolePanel
