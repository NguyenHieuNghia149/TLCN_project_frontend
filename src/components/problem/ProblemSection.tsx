import React from 'react'

interface TabType {
  id: 'question' | 'solution' | 'submissions' | 'discussion'
  label: string
}

interface ProblemSectionProps {
  activeTab: 'question' | 'solution' | 'submissions' | 'discussion'
  onTabChange: (
    tab: 'question' | 'solution' | 'submissions' | 'discussion'
  ) => void
}

const TABS: TabType[] = [
  { id: 'question', label: 'Question' },
  { id: 'solution', label: 'Solution' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'discussion', label: 'Discussion' },
]

const PROBLEM_DESCRIPTION = `Given an integer array nums, return an array output where output[i] is the product of all the elements of nums except nums[i].

Each product is guaranteed to fit in a 32-bit integer.

Follow-up: Could you solve it in O(n) time without using the division operation?

Example 1:
Input: nums = [1,2,4,6]
Output: [48,24,12,8]

Example 2:
Input: nums = [-1,0,1,2,3]
Output: [0,-6,0,0,0]

Constraints:
• 2 <= nums.length <= 1000
• -20 <= nums[i] <= 20`

const ProblemSection: React.FC<ProblemSectionProps> = ({
  activeTab,
  onTabChange,
}) => {
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
        {activeTab === 'question' && (
          <div className="space-y-4">
            <div className="mb-4 flex items-start justify-between">
              <h1 className="text-2xl font-bold">
                Products of Array Except Self
              </h1>
              <span className="flex items-center gap-1 text-sm text-green-400">
                ✓ Solved
              </span>
            </div>

            <button className="rounded bg-yellow-600 px-3 py-1 text-sm font-medium text-white">
              Medium
            </button>

            <div className="space-y-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
              {PROBLEM_DESCRIPTION}
            </div>

            <details className="mt-6 rounded border border-gray-700 p-4">
              <summary className="cursor-pointer font-semibold text-white hover:text-gray-200">
                Recommended Time & Space Complexity
              </summary>
              <p className="mt-2 text-gray-400">
                You should aim for a solution as good or better than O(n) time
                and O(n) space, where n is the size of the input array.
              </p>
            </details>

            <details className="mt-3 rounded border border-gray-700 p-4">
              <summary className="cursor-pointer font-semibold text-white hover:text-gray-200">
                Hint 1
              </summary>
              <p className="mt-2 text-gray-400">
                A brute-force solution would be to iterate through the array
                with index i and compute the product of the array except for
                that index element. This would be an O(n²) solution. Can you
                think of a better way?
              </p>
            </details>

            <details className="mt-3 rounded border border-gray-700 p-4">
              <summary className="cursor-pointer font-semibold text-white hover:text-gray-200">
                Hint 3
              </summary>
              <p className="mt-2 text-gray-400">
                We can use the prefix and suffix technique. First, we iterate
                from left to right and store the prefix products for each index
                in a prefix array, excluding the current index's number. Then,
                we iterate from right to left and store the suffix products for
                each index in a suffix array, also excluding the current index's
                number.
              </p>
            </details>
          </div>
        )}

        {activeTab === 'solution' && (
          <div className="text-sm text-gray-400">
            <p>Solution content coming soon...</p>
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
