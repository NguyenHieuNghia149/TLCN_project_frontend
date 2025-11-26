import React from 'react'
import { ProblemDetailResponse } from '@/types/challenge.types'
import './ProblemSection.css'
import { formatConstraintText } from '@/utils/textFormatter'
import SubmissionsTab from './SubmissionsTab'

interface ExamProblemSectionProps {
  activeTab: 'question' | 'submissions'
  onTabChange: (tab: 'question' | 'submissions') => void
  problemData?: ProblemDetailResponse['data']
}

const ExamProblemSection: React.FC<ExamProblemSectionProps> = ({
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
    <div
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r"
      style={{ borderColor: 'var(--surface-border)' }}
    >
      {/* Tabs */}
      <div
        className="flex border-b"
        style={{ borderColor: 'var(--surface-border)' }}
      >
        <button
          onClick={() => onTabChange('question')}
          className="px-4 py-3 font-medium transition-colors"
          style={{
            borderBottom:
              activeTab === 'question'
                ? '2px solid var(--accent)'
                : '2px solid transparent',
            color:
              activeTab === 'question'
                ? 'var(--text-color)'
                : 'var(--muted-text)',
          }}
        >
          Question
        </button>
        <button
          onClick={() => onTabChange('submissions')}
          className="px-4 py-3 font-medium transition-colors"
          style={{
            borderBottom:
              activeTab === 'submissions'
                ? '2px solid var(--accent)'
                : '2px solid transparent',
            color:
              activeTab === 'submissions'
                ? 'var(--text-color)'
                : 'var(--muted-text)',
          }}
        >
          Submissions
        </button>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto p-6"
        style={{ backgroundColor: 'var(--exam-panel-bg)' }}
      >
        {activeTab === 'question' && problemData && (
          <div className="space-y-4">
            <div className="mb-4 flex items-start justify-between">
              <h1
                className="text-2xl font-bold"
                style={{ color: 'var(--text-color)' }}
              >
                {problemData.problem.title}
              </h1>
              {problemData.problem.isSolved && (
                <span
                  className="flex items-center gap-1 text-sm"
                  style={{ color: '#10b981' }}
                >
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
              {problemData.problem.totalPoints && (
                <span
                  className="text-sm"
                  style={{ color: 'var(--muted-text)' }}
                >
                  {problemData.problem.totalPoints} points
                </span>
              )}
            </div>

            {/* HTML Description */}
            <div
              className="problem-description"
              style={{ color: 'var(--text-color)' }}
              dangerouslySetInnerHTML={{
                __html: problemData.problem.description,
              }}
            />

            {/* Tags */}
            <details
              className="mt-6 rounded border p-4"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <summary
                className="cursor-pointer font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                Tags
              </summary>
              <div
                className="mt-2 whitespace-pre-line"
                style={{ color: 'var(--muted-text)' }}
              >
                {problemData.problem.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="mr-2 rounded px-2 py-1 text-sm"
                    style={{
                      backgroundColor: 'var(--editor-bg)',
                      color: 'var(--text-color)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </details>

            {/* Constraints */}
            <details
              className="mt-6 rounded border p-4"
              style={{ borderColor: 'var(--surface-border)' }}
            >
              <summary
                className="cursor-pointer font-semibold"
                style={{ color: 'var(--text-color)' }}
              >
                Constraints
              </summary>
              <div
                className="mt-2"
                style={{ color: 'var(--muted-text)' }}
                dangerouslySetInnerHTML={{
                  __html: formatConstraintText(problemData.problem.constraint),
                }}
              />
            </details>
          </div>
        )}

        {activeTab === 'submissions' && problemData && (
          <SubmissionsTab problemId={problemData.problem.id} />
        )}
      </div>
    </div>
  )
}

export default ExamProblemSection
