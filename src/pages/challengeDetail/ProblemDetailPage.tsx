import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ProblemSection from '../../components/problem/ProblemSection'
import CodeEditorSection from '../../components/editor/CodeEditorSection'
import { challengeService } from '../../services/api/challenge.service'
import { ProblemDetailResponse } from '../../types/challenge.types'
import ProblemHeader from '../../components/problem/ProblemHeader'

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

const DEFAULT_CODE = `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {
    if (nums1.length > nums2.length) {
        return findMedianSortedArrays(nums2, nums1);
    }
    
    const m = nums1.length;
    const n = nums2.length;
    let left = 0;
    let right = m;
    
    while (left <= right) {
        const partitionX = Math.floor((left + right) / 2);
        const partitionY = Math.floor((m + n + 1) / 2) - partitionX;
        
        const maxLeftX = partitionX === 0 ? -Infinity : nums1[partitionX - 1];
        const minRightX = partitionX === m ? Infinity : nums1[partitionX];
        
        const maxLeftY = partitionY === 0 ? -Infinity : nums2[partitionY - 1];
        const minRightY = partitionY === n ? Infinity : nums2[partitionY];
        
        if (maxLeftX <= minRightY && maxLeftY <= minRightX) {
            if ((m + n) % 2 === 0) {
                return (Math.max(maxLeftX, maxLeftY) + Math.min(minRightX, minRightY)) / 2;
            } else {
                return Math.max(maxLeftX, maxLeftY);
            }
        } else if (maxLeftX > minRightY) {
            right = partitionX - 1;
        } else {
            left = partitionX + 1;
        }
    }
    
    return 0;
}`

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<
    'question' | 'solution' | 'submissions' | 'discussion'
  >('question')
  const [selectedLanguage, setSelectedLanguage] = useState('C++')
  const [code, setCode] = useState(DEFAULT_CODE)
  const [output, setOutput] = useState<OutputState>({
    status: 'idle',
    message: 'Ready to run tests',
  })
  const [selectedTestCase, setSelectedTestCase] = useState<string>('1')
  const [problemData, setProblemData] = useState<
    ProblemDetailResponse['data'] | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topicChallenges, setTopicChallenges] = useState<
    { id: string; title: string }[]
  >([])

  useEffect(() => {
    const fetchProblemData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const response = await challengeService.getChallengeById(id)
        if (response.success) {
          setProblemData(response.data)
        } else {
          setError('Failed to load problem data')
        }
      } catch (err) {
        setError('Error loading problem data')
        console.error('Error fetching problem:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProblemData()
  }, [id])

  // Load challenges in the same topic to enable prev/next navigation
  useEffect(() => {
    const loadTopicChallenges = async () => {
      const topicId = problemData?.problem.topicId
      if (!topicId) {
        setTopicChallenges([])
        return
      }
      try {
        const list = await challengeService.getChallengesByTopicId(topicId)
        const mapped = (list || []).map(
          (item: { id: string; title: string }) => ({
            id: item.id,
            title: item.title,
          })
        )
        setTopicChallenges(mapped)
      } catch {
        setTopicChallenges([])
      }
    }
    loadTopicChallenges()
  }, [problemData?.problem.topicId])

  const currentIndex = useMemo(() => {
    if (!id) return -1
    return topicChallenges.findIndex(c => c.id === id)
  }, [id, topicChallenges])

  const prevId =
    currentIndex > 0 ? topicChallenges[currentIndex - 1]?.id : undefined
  const nextId =
    currentIndex >= 0 && currentIndex < topicChallenges.length - 1
      ? topicChallenges[currentIndex + 1]?.id
      : undefined

  const goPrev = () => {
    if (prevId) navigate(`/problems/${prevId}`)
  }

  const goNext = () => {
    if (nextId) navigate(`/problems/${nextId}`)
  }

  const handleRun = () => {
    setOutput({ status: 'running', message: 'Running tests...' })

    setTimeout(() => {
      setOutput({
        status: 'accepted',
        message: 'All test cases passed!',
        passedTests: problemData?.testcases.length || 0,
        totalTests: problemData?.testcases.length || 0,
      })
    }, 1500)
  }

  const handleSubmit = () => {
    setOutput({ status: 'running', message: 'Submitting...' })
    setTimeout(() => {
      setOutput({
        status: 'accepted',
        message: 'You have successfully completed this problem!',
        passedTests: 19,
        totalTests: 19,
      })
    }, 2000)
  }

  const handleReset = () => {
    setCode(DEFAULT_CODE)
  }

  // Convert API test cases to the format expected by CodeEditorSection
  const testCases: TestCase[] =
    problemData?.testcases.map((tc, index) => ({
      id: tc.id,
      name: `Case ${index + 1}`,
      input: tc.input,
      expectedOutput: tc.output,
    })) || []

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-500"></div>
          <p>Loading problem...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <p className="mb-4 text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Problem Header */}
      <ProblemHeader
        onPrev={goPrev}
        onNext={goNext}
        hasPrev={Boolean(prevId)}
        hasNext={Boolean(nextId)}
        onReset={handleReset}
        problemId={problemData?.problem.id}
      />

      <div className="flex min-h-0 flex-1">
        <ProblemSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          problemData={problemData || undefined}
        />

        <CodeEditorSection
          code={code}
          onCodeChange={setCode}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          testCases={testCases}
          selectedTestCase={selectedTestCase}
          onTestCaseSelect={setSelectedTestCase}
          output={output}
          onRun={handleRun}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />
      </div>
    </div>
  )
}
