import React, { useState } from 'react'
import { Star, Check, Info } from 'lucide-react'
import styles from './ProblemPage.module.scss'
interface Problem {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  maxScore: number
  successRate: number
  solved: boolean
  description: string
}

const ProblemPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Algorithms' | 'Data Structures'>(
    'Data Structures'
  )
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'solved' | 'unsolved'
  >('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([])
  //   const [skillFilter, setSkillFilter] = useState<string[]>([]);

  const problems: Problem[] = [
    {
      id: '1',
      title: 'Mini-Max Sum',
      difficulty: 'Easy',
      category: 'Problem Solving (Basic)',
      maxScore: 10,
      successRate: 94.66,
      solved: false,
      description:
        'Find the maximum and minimum values obtained by summing four of five integers.',
    },
    {
      id: '2',
      title: 'Solve Me First',
      difficulty: 'Easy',
      category: 'Problem Solving (Basic)',
      maxScore: 1,
      successRate: 97.6,
      solved: true,
      description:
        'Complete the function that takes two integers and returns their sum.',
    },
    {
      id: '3',
      title: 'Simple Array Sum',
      difficulty: 'Easy',
      category: 'Problem Solving (Basic)',
      maxScore: 10,
      successRate: 94.78,
      solved: true,
      description: 'Given an array of integers, find the sum of its elements.',
    },
    {
      id: '4',
      title: 'Compare the Triplets',
      difficulty: 'Easy',
      category: 'Problem Solving (Basic)',
      maxScore: 10,
      successRate: 92.34,
      solved: false,
      description: 'Compare two arrays and count the comparison points.',
    },
    {
      id: '5',
      title: 'A Very Big Sum',
      difficulty: 'Easy',
      category: 'Problem Solving (Basic)',
      maxScore: 10,
      successRate: 96.12,
      solved: true,
      description: 'Calculate and print the sum of the elements in an array.',
    },
  ]

  const filteredProblems = problems.filter(problem => {
    if (statusFilter === 'solved' && !problem.solved) return false
    if (statusFilter === 'unsolved' && problem.solved) return false
    if (
      difficultyFilter.length > 0 &&
      !difficultyFilter.includes(problem.difficulty)
    )
      return false
    return true
  })

  const toggleDifficultyFilter = (difficulty: string) => {
    setDifficultyFilter(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-400'
      case 'Medium':
        return 'text-yellow-400'
      case 'Hard':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-[#121418] text-gray-100">
      {/* Main Content */}

      <header className="min-h-24 bg-[#1f202a]">
        <div className={styles.container}>
          <div className="flex items-center justify-between">
            <div>
              {/* <div className={styles.textNav}>Prepare </div> */}
              <div className="flex items-center">
                <div className={styles.textNav}>Prepare</div>
                <span className="-nav-item separator mt-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
                <div className={styles.textNav}>Problem Solving</div>
              </div>
              <h1 className="text-2xl font-bold">Problem Solving</h1>
            </div>
            <div className="text-right">
              <div className="mb-1 text-sm">
                <span className="font-light text-orange-400">
                  39 more points
                </span>
                <span className="font-bold text-white">
                  {' '}
                  to get your next star!
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Rank: <span className="font-semibold text-white">2377771</span>{' '}
                | Points:{' '}
                <span className="font-semibold text-white">61/100</span>
                <Info className="ml-1 inline h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb & Title */}

        {/* Tabs */}
        <div className="mb-8 flex gap-6 border-transparent">
          <button
            onClick={() => setActiveTab('Algorithms')}
            className={`border-transparent pb-4 text-[14px] font-light ${
              activeTab === 'Algorithms'
                ? 'border-transparent text-white hover:border-transparent'
                : 'border-transparent text-blue-500 hover:border-transparent'
            }`}
          >
            Algorithms
          </button>
          <button
            onClick={() => setActiveTab('Data Structures')}
            className={`border-transparent pb-4 text-sm font-light ${
              activeTab === 'Data Structures'
                ? 'border-transparent text-white hover:border-transparent'
                : 'border-transparent text-blue-500 hover:border-transparent'
            }`}
          >
            Data Structures
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Problem List */}
          <div className="space-y-4 lg:col-span-3">
            {filteredProblems.map(problem => (
              <div
                key={problem.id}
                className="rounded-lg border border-gray-800 bg-[#1f202a] p-6 transition-colors hover:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-semibold">
                      {problem.title}
                    </h3>
                    <div className="mb-3 flex items-center gap-4 text-sm">
                      <span className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </span>
                      <span className="text-gray-400">{problem.category}</span>
                      <span className="text-gray-400">
                        Max Score: {problem.maxScore}
                      </span>
                      <span className="text-gray-400">
                        Success Rate: {problem.successRate}%
                      </span>
                    </div>
                    {/* <p className="text-gray-400 text-sm">{problem.description}</p> */}
                  </div>
                  <div className="ml-6 flex items-center gap-3">
                    <button className="rounded-lg p-2 transition-colors hover:bg-gray-800">
                      <Star className="h-5 w-5 text-gray-400" />
                    </button>
                    {problem.solved ? (
                      <button className="flex w-[150px] items-center justify-center gap-2 rounded-lg border border-gray-700 bg-transparent px-6 py-2 text-[14px] font-medium text-white transition-colors hover:border-transparent hover:bg-gray-600">
                        Solved
                        <Check className="h-4 w-4" />
                      </button>
                    ) : (
                      <button className="w-[150px] rounded-lg bg-green-500 px-6 py-2 text-[14px] font-extralight text-black transition-colors hover:border-transparent hover:bg-green-300">
                        Solve Challenge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters Sidebar */}
          <div className="space-y-6">
            {/* Status Filter */}
            <div className="rounded-lg bg-transparent p-6">
              <h3 className="mb-4 text-base font-bold uppercase tracking-wider text-gray-400">
                Status
              </h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={statusFilter === 'solved'}
                    onChange={() =>
                      setStatusFilter(
                        statusFilter === 'solved' ? 'all' : 'solved'
                      )
                    }
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-base font-medium text-white">
                    Solved
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={statusFilter === 'unsolved'}
                    onChange={() =>
                      setStatusFilter(
                        statusFilter === 'unsolved' ? 'all' : 'unsolved'
                      )
                    }
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-base font-medium text-white">
                    Unsolved
                  </span>
                </label>
              </div>
            </div>

            {/* Skills Filter */}
            <div className="min-h-20 rounded-lg bg-transparent p-6">
              <h3 className="mb-4 text-base font-bold uppercase tracking-wider text-gray-400">
                Skills
              </h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-base font-medium text-white">
                    Problem Solving (Intermediate)
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm">Problem Solving (Advanced)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm">Problem Solving (Basic)</span>
                </label>
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="rounded-lg bg-transparent p-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
                Difficulty
              </h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={difficultyFilter.includes('Easy')}
                    onChange={() => toggleDifficultyFilter('Easy')}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm">Easy</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={difficultyFilter.includes('Medium')}
                    onChange={() => toggleDifficultyFilter('Medium')}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm">Medium</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={difficultyFilter.includes('Hard')}
                    onChange={() => toggleDifficultyFilter('Hard')}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm">Hard</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProblemPage
