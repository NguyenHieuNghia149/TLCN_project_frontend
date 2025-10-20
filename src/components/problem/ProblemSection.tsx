import React from 'react'
import { ProblemDetailResponse } from '@/types/challenge.types'
import './ProblemSection.css'
import { formatConstraintText } from '@/utils/textFormatter'

interface TabType {
  id: 'question' | 'solution' | 'submissions' | 'discussion'
  label: string
}

interface ProblemSectionProps {
  activeTab: 'question' | 'solution' | 'submissions' | 'discussion'
  onTabChange: (
    tab: 'question' | 'solution' | 'submissions' | 'discussion'
  ) => void
  problemData?: ProblemDetailResponse['data']
}

const TABS: TabType[] = [
  { id: 'question', label: 'Question' },
  { id: 'solution', label: 'Solution' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'discussion', label: 'Discussion' },
]

const ProblemSection: React.FC<ProblemSectionProps> = ({
  activeTab,
  onTabChange,
  problemData,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'hard':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  }

  return (
    <div className="flex w-1/2 flex-col overflow-hidden border-r border-gray-800">
      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900 hover:translate-x-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-green-500 bg-gray-800 text-white'
                : 'text-gray-400 hover:border-transparent hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'question' && problemData && (
          <div className="space-y-4">
            <div className="mb-4 flex items-start justify-between">
              <h1 className="text-2xl font-bold">
                {problemData.problem.title}
              </h1>
              <span className="flex items-center gap-1 text-sm text-green-400">
                ✓ Solved
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1 text-sm font-medium ${getDifficultyColor(problemData.problem.difficulty)}`}
              >
                {getDifficultyText(problemData.problem.difficulty)}
              </button>
            </div>

            {/* HTML Description */}
            <div
              className="problem-description"
              dangerouslySetInnerHTML={{
                __html: problemData.problem.description,
              }}
            />

            {/* Tags */}
            <details className="mt-6 rounded border border-gray-700 p-4">
              <summary className="cursor-pointer font-semibold text-white hover:text-gray-200">
                Tags
              </summary>
              <div className="mt-2 whitespace-pre-line text-gray-400">
                {problemData.problem.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="mr-2 rounded bg-gray-700 px-2 py-1 text-sm text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </details>

            {/* Constraints */}
            <details className="mt-6 rounded border border-gray-700 p-4">
              <summary className="cursor-pointer font-semibold text-white hover:text-gray-200">
                Constraints
              </summary>
              <div
                className="mt-2 text-gray-400"
                dangerouslySetInnerHTML={{
                  __html: formatConstraintText(problemData.problem.constraint),
                }}
              />
            </details>

            {/* Test Cases */}
            <details className="mt-3 rounded border border-gray-700 p-4">
              <summary className="cursor-pointer font-semibold text-white hover:text-gray-200">
                Test Cases ({problemData.testcases.length})
              </summary>
              <div className="mt-2 space-y-3">
                {problemData.testcases.map((testCase, index) => (
                  <div key={testCase.id} className="rounded bg-gray-800 p-3">
                    <div className="mb-2 text-sm font-medium text-gray-300">
                      Test Case {index + 1} (Points: {testCase.point})
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-400">Input:</span>
                        <pre className="mt-1 rounded bg-gray-900 p-2 text-gray-200">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-gray-400">Expected Output:</span>
                        <pre className="mt-1 rounded bg-gray-900 p-2 text-gray-200">
                          {testCase.output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {activeTab === 'solution' && problemData && (
          <div className="space-y-4">
            <h1 className="text-[30px] font-bold">
              {problemData.solution.title}
            </h1>
            <p className="text-gray-300">{problemData.solution.description}</p>

            {problemData.solution.solutionApproaches.map(approach => (
              <div key={approach.id} className="rounded border-gray-700 p-4">
                <h3 className="mb-2 text-[25px] font-semibold">
                  {approach.title}
                </h3>
                <p className="mb-3 text-gray-300">{approach.description}</p>
                <p className="mb-2 text-[20px] font-semibold">
                  Time & Space Complexity
                </p>
                <div className="mb-3 flex gap-4 text-sm">
                  <span className="text-green-400">
                    Time: {approach.timeComplexity}
                  </span>
                  <span className="text-blue-400">
                    Space: {approach.spaceComplexity}
                  </span>
                </div>

                <div className="mb-3">
                  <h4 className="mb-2 font-medium text-gray-300">
                    Explanation:
                  </h4>
                  <p className="text-gray-400">{approach.explanation}</p>
                </div>

                <div>
                  <h4 className="mb-2 font-medium text-gray-300">
                    Solution Code:
                  </h4>
                  <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-sm text-gray-200">
                    <code>{approach.sourceCode}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="text-sm text-gray-400">
            <p>Your submissions will appear here...</p>
          </div>
        )}

        {activeTab === 'discussion' && (
          <div className="text-sm text-gray-400">
            <p>Add your discussion here...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProblemSection
