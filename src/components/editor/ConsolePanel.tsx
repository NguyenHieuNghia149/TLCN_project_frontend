import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import TestCasePanel from '../problem/TestCasePanel'

interface TestCase {
  id: string
  name: string
  input: string
  expectedOutput: string
}

interface OutputState {
  status: 'idle' | 'running' | 'accepted' | 'rejected'
  message: string
  passedTests?: number
  totalTests?: number
}

interface ConsolePanelProps {
  consoleExpanded: boolean
  onToggleConsole: () => void
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
  activeConsoleTab,
  onConsoleTabChange,
  testCases,
  selectedTestCase,
  onTestCaseSelect,
  output,
  onRun,
  onSubmit,
}) => {
  return (
    <div
      className={`flex flex-col border-t border-gray-800 bg-gray-950 transition-all duration-300 ${
        consoleExpanded ? 'h-80' : 'h-24'
      }`}
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
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => onConsoleTabChange('testcase')}
              className={`px-4 py-2 transition-colors ${
                activeConsoleTab === 'testcase'
                  ? 'border-b-2 text-white hover:border-transparent'
                  : 'text-gray-400 hover:border-transparent hover:text-white'
              }`}
            >
              Test Case
            </button>
            <button
              onClick={() => onConsoleTabChange('output')}
              className={`px-4 py-2 ${
                activeConsoleTab === 'output'
                  ? 'border-b-2 text-white hover:border-transparent'
                  : 'text-gray-400 hover:border-transparent hover:text-white'
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
            <div className="flex-1 space-y-4 overflow-auto p-4">
              {output.status === 'running' && (
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  {output.message}
                </div>
              )}
              {output.status === 'accepted' && (
                <div className="space-y-2">
                  <div className="font-semibold text-green-400">✓ Accepted</div>
                  {output.passedTests !== undefined && (
                    <div className="text-sm text-gray-300">
                      Passed test cases: {output.passedTests} /{' '}
                      {output.totalTests}
                    </div>
                  )}
                  <div className="text-sm text-gray-300">{output.message}</div>
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
            onClick={onRun}
            className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
          >
            Run
          </button>
          <button
            onClick={onSubmit}
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
