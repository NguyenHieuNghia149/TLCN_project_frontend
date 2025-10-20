import React, { useState } from 'react'
import ProblemSection from '../../components/problem/ProblemSection'
import CodeEditorSection from '../../components/editor/CodeEditorSection'

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

const TEST_CASES: TestCase[] = [
  {
    id: '1',
    name: 'Case 1',
    input: '[1,2,4,6]',
    expectedOutput: '[48,24,12,8]',
  },
  {
    id: '2',
    name: 'Case 2',
    input: '[-1,0,1,2,3]',
    expectedOutput: '[0,-6,0,0,0]',
  },
  {
    id: '3',
    name: 'Case 3',
    input: '[2,3,4,5]',
    expectedOutput: '[60,40,30,24]',
  },
]

const DEFAULT_CODE = `vector<int> productExceptSelf(vector<int>& nums) {
    int n = nums.size();
    vector<int> res(n);
    
    for(int i = 0; i < n; i++) {
        int tmp = 1;
    }
    
    return res;
}`

export default function ProblemDetailPage() {
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

  const handleRun = () => {
    setOutput({ status: 'running', message: 'Running tests...' })

    setTimeout(() => {
      setOutput({
        status: 'accepted',
        message: 'All test cases passed!',
        passedTests: TEST_CASES.length,
        totalTests: TEST_CASES.length,
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

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <ProblemSection activeTab={activeTab} onTabChange={setActiveTab} />

      <CodeEditorSection
        code={code}
        onCodeChange={setCode}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        testCases={TEST_CASES}
        selectedTestCase={selectedTestCase}
        onTestCaseSelect={setSelectedTestCase}
        output={output}
        onRun={handleRun}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />
    </div>
  )
}
