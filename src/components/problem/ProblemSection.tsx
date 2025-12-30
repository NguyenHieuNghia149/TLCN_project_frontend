import React from 'react'
import { ProblemDetailResponse } from '@/types/challenge.types'
import './ProblemSection.css'
import { formatConstraintText } from '@/utils/textFormatter'
import SubmissionsTab from './SubmissionsTab'
import CommentsSection from '../lesson/CommentsSection'

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
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-border">
      {/* Tabs */}
      <div className="flex border-b border-border hover:translate-x-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-green-500 text-foreground'
                : 'text-muted-foreground hover:border-transparent hover:text-foreground'
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
            <details className="mt-6 rounded border border-border p-4">
              <summary className="cursor-pointer font-semibold text-foreground hover:text-muted-foreground">
                Tags
              </summary>
              <div className="mt-2 whitespace-pre-line text-muted-foreground">
                {problemData.problem.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="mr-2 rounded bg-muted px-2 py-1 text-sm text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </details>

            {/* Constraints */}
            <details className="mt-6 rounded border border-border p-4">
              <summary className="cursor-pointer font-semibold text-foreground hover:text-muted-foreground">
                Constraints
              </summary>
              <div
                className="mt-2 text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: formatConstraintText(problemData.problem.constraint),
                }}
              />
            </details>
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
                <h3 className="mb-3 text-[30px] font-semibold text-foreground">
                  Video Explanation
                </h3>
                <div className="rounded-lg bg-card p-4">
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
                <div className="rounded border-border p-4">
                  <h3 className="mb-2 text-[30px] font-semibold">
                    {approach.title}
                  </h3>
                  {/* <p className="mb-3 text-gray-300">{approach.description}</p> */}

                  <div>
                    {/* <h4 className="mb-2 font-medium text-gray-300">
                      Solution Code:
                    </h4> */}
                    <pre className="text-m overflow-x-auto rounded bg-muted p-3 text-foreground">
                      <code>{approach.sourceCode}</code>
                    </pre>
                  </div>

                  <p className="mb-2 mt-8 text-[25px] font-semibold">
                    Time & Space Complexity
                  </p>
                  <div className="mb-3 ml-5 space-y-2 text-[18px] text-muted-foreground">
                    <div className="flex items-start">
                      <span className="mr-2 text-muted-foreground">•</span>
                      <span>
                        <span className="text-muted-foreground">
                          Time complexity:
                        </span>
                        <span className="ml-1 font-mono text-foreground">
                          {approach.timeComplexity}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="mr-2 text-muted-foreground">•</span>
                      <span>
                        <span className="text-muted-foreground">
                          Space complexity:
                        </span>
                        <span className="ml-1 font-mono text-foreground">
                          {approach.spaceComplexity}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="mb-3 mt-3">
                    <h4 className="mb-2 font-medium text-muted-foreground">
                      Explanation:
                    </h4>
                    <p className="text-muted-foreground">
                      {approach.explanation}
                    </p>
                  </div>
                </div>

                {/* Separator after each approach except the last one */}
                {index < problemData.solution.solutionApproaches.length - 1 && (
                  <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-border"></div>
                    <div className="mx-4 text-muted-foreground">•</div>
                    <div className="flex-1 border-t border-border"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'submissions' && problemData && (
          <SubmissionsTab problemId={problemData.problem.id} />
        )}

        {activeTab === 'discussion' && problemData && (
          <CommentsSection problemId={problemData.problem.id} />
        )}
      </div>
    </div>
  )
}

export default ProblemSection
