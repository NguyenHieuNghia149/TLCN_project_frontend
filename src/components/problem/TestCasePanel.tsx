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
    <div className="flex flex-1 flex-col overflow-auto bg-gray-900 px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {testCases.map(tc => (
            <button
              key={tc.id}
              onClick={() => onTestCaseSelect(tc.id)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                selectedTestCase === tc.id
                  ? 'border-transparent bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:border-transparent hover:bg-gray-700'
              }`}
            >
              {tc.name}
            </button>
          ))}
          <button className="text-lg text-gray-400 hover:text-gray-300">
            +
          </button>
        </div>
        <button className="text-sm font-medium text-blue-400 hover:text-blue-300">
          Reset Test Cases
        </button>
      </div>
      {currentTestCase && (
        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-400">nums =</span>
            <div className="mt-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100">
              {currentTestCase.input}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestCasePanel
