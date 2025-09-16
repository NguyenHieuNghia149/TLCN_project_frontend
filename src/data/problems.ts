export interface Problem {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  description: string
  examples: {
    input: string
    output: string
    explanation?: string
  }[]
  constraints: string[]
  functionSignature: {
    [language: string]: string
  }
  testCases: {
    input: string
    expectedOutput: string
  }[]
}

export const problems: Problem[] = [
  {
    id: 'solve-me-first',
    title: 'Solve Me First',
    difficulty: 'Easy',
    category: 'Warmup',
    description:
      'Complete the function solveMeFirst to compute the sum of two integers.',
    examples: [
      {
        input: 'a = 7, b = 3',
        output: '10',
        explanation: 'The sum of 7 and 3 is 10.',
      },
      {
        input: 'a = 2, b = 3',
        output: '5',
      },
    ],
    constraints: ['1 <= a, b <= 1000'],
    functionSignature: {
      cpp: 'int solveMeFirst(int a, int b)',
      python: 'def solveMeFirst(a, b):',
      javascript: 'function solveMeFirst(a, b)',
    },
    testCases: [
      { input: '7 3', expectedOutput: '10' },
      { input: '2 3', expectedOutput: '5' },
      { input: '100 200', expectedOutput: '300' },
    ],
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'String',
    description:
      'Given a string s, return true if it is a palindrome, otherwise return false. A palindrome is a string that reads the same forward and backward. It is also case-insensitive and ignores all non-alphanumeric characters.',
    examples: [
      {
        input: 's = "Was it a car or a cat I saw?"',
        output: 'true',
        explanation:
          "After considering only alphanumerical characters we have 'wasitacaroracatisaw', which is a palindrome.",
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: "'raceacar' is not a palindrome.",
      },
    ],
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.',
    ],
    functionSignature: {
      cpp: 'bool isPalindrome(string s)',
      python: 'def isPalindrome(self, s: str) -> bool:',
      javascript: 'function isPalindrome(s)',
    },
    testCases: [
      { input: '"Was it a car or a cat I saw?"', expectedOutput: 'true' },
      { input: '"race a car"', expectedOutput: 'false' },
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true' },
    ],
  },
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Array',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
    ],
    functionSignature: {
      cpp: 'vector<int> twoSum(vector<int>& nums, int target)',
      python: 'def twoSum(self, nums: List[int], target: int) -> List[int]:',
      javascript: 'function twoSum(nums, target)',
    },
    testCases: [
      { input: '[2,7,11,15] 9', expectedOutput: '[0,1]' },
      { input: '[3,2,4] 6', expectedOutput: '[1,2]' },
      { input: '[3,3] 6', expectedOutput: '[0,1]' },
    ],
  },
]

export const getProblemById = (id: string): Problem | undefined => {
  return problems.find(problem => problem.id === id)
}
