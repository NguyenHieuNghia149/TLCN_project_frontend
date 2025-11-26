import React from 'react'

interface TestCase {
  id: string
  name: string
  input: string
  expectedOutput: string
}

interface TestCasePanelProps {
  testCases: TestCase[]
  selectedTestCase: string
  onTestCaseSelect: (testCaseId: string) => void
}

const TestCasePanel: React.FC<TestCasePanelProps> = ({
  testCases,
  selectedTestCase,
  onTestCaseSelect,
}) => {
  const currentTestCase = testCases.find(tc => tc.id === selectedTestCase)

  return (
    <div className="testcase-panel">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {testCases.map(tc => (
            <button
              key={tc.id}
              onClick={() => onTestCaseSelect(tc.id)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${
                selectedTestCase === tc.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-transparent text-[var(--muted-text)] hover:bg-[rgba(0,0,0,0.04)]'
              }`}
              aria-pressed={selectedTestCase === tc.id}
            >
              {tc.name}
            </button>
          ))}
          <button
            aria-label="Add test case"
            title="Add test case"
            className="text-lg text-[var(--muted-text)] hover:text-[var(--text-color)]"
          >
            +
          </button>
        </div>
        <button className="text-sm font-medium text-[var(--accent)] hover:opacity-90">
          Reset Test Cases
        </button>
      </div>
      {currentTestCase && (
        <div className="space-y-2">
          <div>
            <span className="muted text-sm">Input</span>
            <div
              className="mt-1 rounded border px-3 py-2 font-mono text-sm"
              style={{
                borderColor: 'var(--surface-border)',
                backgroundColor: 'var(--editor-bg)',
                color: 'var(--text-color)',
              }}
            >
              {currentTestCase.input}
            </div>
          </div>
          <div>
            <span className="muted text-sm">Expected Output</span>
            <div
              className="mt-1 rounded border px-3 py-2 font-mono text-sm"
              style={{
                borderColor: 'var(--surface-border)',
                backgroundColor: 'var(--editor-bg)',
                color: 'var(--text-color)',
              }}
            >
              {currentTestCase.expectedOutput}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestCasePanel
