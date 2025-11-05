import React from 'react'
import { ProblemDetailResponse } from '@/types/challenge.types'
import './ProblemSection.css'
import { formatConstraintText } from '@/utils/textFormatter'
import SubmissionsTab from './SubmissionsTab'

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

  const convertToEmbedUrl = (url: string) => {
    // Handle different YouTube URL formats
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes('youtube.com/embed/')) {
      return url // Already an embed URL
    }
    return url // Return original if not recognized
  }

  return (
    <div className="flex w-1/2 flex-col overflow-hidden border-r border-gray-800">
      {/* Tabs */}
      <div className="flex border-b border-gray-800 hover:translate-x-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-green-500 text-white'
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
              {problemData.problem.isSolved && (
                <span className="flex items-center gap-1 text-sm text-green-400">
                  ✓ Solved
                </span>
              )}
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
            {/* <details className="mt-3 rounded border border-gray-700 p-4">
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
            </details> */}
          </div>
        )}

        {activeTab === 'solution' && problemData && (
          <div className="space-y-4">
            {/* <h1 className="text-[30px] font-bold">
              {problemData.solution.title}
            </h1>
            <p className="text-gray-300">{problemData.solution.description}</p> */}

            {/* YouTube URL */}
            {problemData.solution.videoUrl && (
              <div className="mb-6">
                <h3 className="mb-3 text-[30px] font-semibold text-white">
                  Video Explanation
                </h3>
                <div className="rounded-lg bg-gray-800 p-4">
                  <iframe
                    width="100%"
                    height="315"
                    src={convertToEmbedUrl(problemData.solution.videoUrl)}
                    title="Solution Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded"
                  ></iframe>
                </div>
              </div>
            )}

            {problemData.solution.solutionApproaches.map((approach, index) => (
              <div key={approach.id}>
                <div className="rounded border-gray-700 p-4">
                  <h3 className="mb-2 text-[30px] font-semibold">
                    {approach.title}
                  </h3>
                  {/* <p className="mb-3 text-gray-300">{approach.description}</p> */}

                  <div>
                    {/* <h4 className="mb-2 font-medium text-gray-300">
                      Solution Code:
                    </h4> */}
                    <pre className="text-m overflow-x-auto rounded bg-gray-900 p-3 text-gray-200">
                      <code>{approach.sourceCode}</code>
                    </pre>
                  </div>

                  <p className="mb-2 mt-8 text-[25px] font-semibold">
                    Time & Space Complexity
                  </p>
                  <div className="mb-3 ml-5 space-y-2 text-[18px] text-gray-300">
                    <div className="flex items-start">
                      <span className="mr-2 text-gray-400">•</span>
                      <span>
                        <span className="text-gray-400">Time complexity:</span>
                        <span className="ml-1 font-mono text-gray-200">
                          {approach.timeComplexity}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="mr-2 text-gray-400">•</span>
                      <span>
                        <span className="text-gray-400">Space complexity:</span>
                        <span className="ml-1 font-mono text-gray-200">
                          {approach.spaceComplexity}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 mt-3">
                    <h4 className="mb-2 font-medium text-gray-300">
                      Explanation:
                    </h4>
                    <p className="text-gray-400">{approach.explanation}</p>
                  </div>
                </div>

                {/* Separator after each approach except the last one */}
                {index < problemData.solution.solutionApproaches.length - 1 && (
                  <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-gray-600"></div>
                    <div className="mx-4 text-gray-500">•</div>
                    <div className="flex-1 border-t border-gray-600"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'submissions' && problemData && (
          <SubmissionsTab problemId={problemData.problem.id} />
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
