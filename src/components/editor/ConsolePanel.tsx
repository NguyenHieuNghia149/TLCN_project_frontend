import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import TestCasePanel from '../problem/TestCasePanel'
import type { TestCase, OutputState } from '@/types/editor.types'

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
      className={`flex flex-col border-t border-gray-800 bg-gray-900 transition-all duration-300`}
      style={{ height: consoleExpanded ? consoleHeight || 320 : 110 }}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b border-gray-800 px-4 py-3 hover:bg-gray-900"
        onClick={onToggleConsole}
      >
        <div className="flex items-center gap-2">
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
          <div className="flex border-b border-gray-800 bg-gray-900">
            <button
              onClick={() => onConsoleTabChange('testcase')}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                activeConsoleTab === 'testcase'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Test Case
            </button>
            <button
              onClick={() => onConsoleTabChange('output')}
              className={`ml-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
                activeConsoleTab === 'output'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
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
            <div className="flex min-h-0 flex-1 overflow-hidden bg-gray-900">
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
                  {/* Top header style like TestCasePanel */}
                  <div className="flex items-center gap-3">
                    {Array.isArray(output.results) &&
                    output.results.length > 0 ? (
                      output.results.map((r, idx) => {
                        const isSelected = selectedResultIndex === idx
                        // Color logic: failed => red, passed/undefined => neutral; selected => blue
                        const statusClass =
                          r.ok === false
                            ? 'bg-red-800 text-red-50 hover:bg-red-700'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
                      <span className="text-xs text-gray-500">No results</span>
                    )}
                  </div>
                  {output.passedTests !== undefined &&
                    output.totalTests !== undefined && (
                      <div className="text-xs text-gray-400">
                        {output.passedTests}/{output.totalTests}
                      </div>
                    )}
                  {/* Detail panel stacked sections */}
                  <div className="min-w-0 flex-1 overflow-auto bg-gray-900 p-4">
                    {/* Summary header */}
                    <div className="mb-3 space-y-1">
                      {output.status === 'accepted' ? (
                        <div className="font-semibold text-green-400">
                          ✓ Accepted
                        </div>
                      ) : output.status === 'rejected' ? (
                        <div className="font-semibold text-red-400">
                          ✗ Error
                        </div>
                      ) : null}
                      <div className="text-sm text-gray-300">
                        {output.message}
                      </div>
                      {typeof output.processingTime === 'number' && (
                        <div className="text-xs text-gray-500">
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
                                      Error
                                    </div>
                                    <pre className="whitespace-pre-wrap rounded border border-red-600 bg-red-900/30 p-3 font-mono text-sm text-red-200">
                                      {r.stderr}
                                    </pre>
                                  </div>
                                )}
                                <div>
                                  <span className="text-sm text-gray-400">
                                    Input:
                                  </span>
                                  <div className="mt-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100">
                                    {r.input}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-400">
                                    Expected output:
                                  </span>
                                  <div className="mt-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100">
                                    {r.expectedOutput}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-400">
                                    Your output:
                                  </span>
                                  <div
                                    className={`mt-1 rounded border px-3 py-2 font-mono text-sm ${r.ok ? 'border-green-700 bg-green-900/20 text-green-200' : 'border-gray-700 bg-gray-800 text-gray-100'}`}
                                  >
                                    {r.actualOutput}
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  #{r.index} • {r.ok ? 'Passed' : 'Failed'} •
                                  Time: {r.executionTime} ms
                                </div>
                              </div>
                            )
                          })()}
                        </>
                      )}
                  </div>
                </div>
              )}

              {output.status === 'idle' && (
                <div className="text-gray-500">{output.message}</div>
              )}
            </div>
          )}
        </>
      )}

      {/* Submit Buttons - Always visible */}
      <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3">
        <button
          onClick={onToggleConsole}
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
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
            className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
          >
            Run
          </button>
          <button
            onClick={() => {
              if (!consoleExpanded) onToggleConsole()
              onConsoleTabChange('output')
              onSubmit()
            }}
            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsolePanel
