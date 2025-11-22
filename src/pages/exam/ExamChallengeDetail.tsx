import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Layers,
  Flame,
  BookOpen,
  BarChart3,
} from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Challenge } from '@/types/challenge.types'
import CodeEditorSection from '@/components/editor/CodeEditorSection'
import './ExamChallengeDetail.scss'

interface ChallengePreview extends Challenge {
  samples?: Array<{ input: string; output: string }>
  constraints?: string[]
  htmlDescription?: string
}

const ExamChallengeDetail: React.FC = () => {
  const { examId, challengeId } = useParams<{
    examId: string
    challengeId: string
  }>()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState<ChallengePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'problem' | 'solutions'>('problem')
  const [selectedLanguage, setSelectedLanguage] = useState('C++')
  const [code, setCode] = useState('')

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setLoading(true)
        // In real app, fetch from API
        const mock: ChallengePreview = {
          id: challengeId || '1',
          title: 'Two Sum',
          description:
            'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Assume each input has exactly one solution, and you may not use the same element twice.',
          difficulty: 'easy',
          topic: 'Arrays',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalPoints: 30,
          samples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
            { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
            { input: 'nums = [3,3], target = 6', output: '[0,1]' },
          ],
          constraints: [
            '2 ≤ nums.length ≤ 10⁴',
            '-10⁹ ≤ nums[i] ≤ 10⁹',
            '-10⁹ ≤ target ≤ 10⁹',
            'Only one valid answer exists.',
          ],
          htmlDescription: `
            <p>Given an integer array <strong>nums</strong> and an integer <strong>target</strong>, return <strong>indices of the two numbers</strong> such that they add up to <strong>target</strong>.</p>
            <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the <strong>same</strong> element twice.</p>
            <p>You can return the answer in any order.</p>
          `,
        }
        setChallenge(mock)
        setCode(`// Write your ${selectedLanguage} solution here\n`)
      } catch (error) {
        console.error('Failed to fetch challenge preview', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChallenge()
  }, [challengeId, selectedLanguage])

  if (loading) {
    return (
      <div className="exam-challenge-loading">
        <LoadingSpinner />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="exam-challenge-error">
        <div className="error-content">
          <h2>Challenge not found</h2>
          <p>The challenge you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(`/exam/${examId}`)}
            className="btn-back-home"
          >
            Back to Exam
          </button>
        </div>
      </div>
    )
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'difficulty-easy'
      case 'medium':
        return 'difficulty-medium'
      case 'hard':
        return 'difficulty-hard'
      default:
        return 'difficulty-easy'
    }
  }

  return (
    <div className="exam-challenge-detail-page">
      {/* Header */}
      <header className="exam-challenge-header">
        <div className="header-left">
          <button
            onClick={() => navigate(`/exam/${examId}`)}
            className="btn-back"
            title="Back to exam"
          >
            <ArrowLeft size={18} />
            <span>Back to Exam</span>
          </button>
          <div className="challenge-title-group">
            <h1 className="challenge-title">{challenge.title}</h1>
            <div className="title-badges">
              <span
                className={`difficulty-badge ${getDifficultyColor(challenge.difficulty)}`}
              >
                <Flame size={14} />
                {challenge.difficulty.toUpperCase()}
              </span>
              <span className="topic-badge">
                <Layers size={14} />
                {challenge.topic}
              </span>
              {typeof challenge.totalPoints === 'number' && (
                <span className="points-badge">
                  <BarChart3 size={14} />
                  {challenge.totalPoints} pts
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="timer-widget">
            <Clock size={18} />
            <span className="timer-text">Time remaining: --:--</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="exam-challenge-content">
        {/* Problem Panel */}
        <div className="problem-panel">
          <div className="panel-tabs">
            <button
              className={`tab-btn ${activeTab === 'problem' ? 'active' : ''}`}
              onClick={() => setActiveTab('problem')}
            >
              <BookOpen size={16} />
              <span>Problem</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'solutions' ? 'active' : ''}`}
              onClick={() => setActiveTab('solutions')}
            >
              <BarChart3 size={16} />
              <span>Solutions</span>
            </button>
          </div>

          <div className="panel-content">
            {activeTab === 'problem' && (
              <div className="problem-content">
                <div className="description-section">
                  <h2>Description</h2>
                  <div
                    className="description-text"
                    dangerouslySetInnerHTML={{
                      __html:
                        challenge.htmlDescription || challenge.description,
                    }}
                  />
                </div>

                <div className="samples-section">
                  <h3>Examples</h3>
                  <div className="samples-list">
                    {challenge.samples?.map((sample, index) => (
                      <div key={index} className="sample-item">
                        <div className="sample-number">Example {index + 1}</div>
                        <div className="sample-data">
                          <div className="sample-input">
                            <strong>Input:</strong>
                            <code>{sample.input}</code>
                          </div>
                          <div className="sample-output">
                            <strong>Output:</strong>
                            <code>{sample.output}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="constraints-section">
                  <h3>Constraints</h3>
                  <ul className="constraints-list">
                    {challenge.constraints?.map((constraint, index) => (
                      <li key={index}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'solutions' && (
              <div className="solutions-content">
                <div className="solution-info">
                  <p>Solutions will be available after exam completion.</p>
                  <p className="solution-note">
                    During the exam, focus on solving the problem using your own
                    approach.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor Panel */}
        <div className="editor-panel">
          <CodeEditorSection
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            code={code}
            setCode={setCode}
            problemId={challenge.id}
            onRun={() => {
              console.log('Running code:', { code, language: selectedLanguage })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ExamChallengeDetail
