import { Exam, ExamSubmission } from '@/types/exam.types'
import { Challenge } from '@/types/challenge.types'
import { User } from '@/types/auth.types'

const baseChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    title: 'Two Sum Optimized',
    description: 'Return the indices of two numbers that add up to target.',
    difficulty: 'easy',
    topic: 'Array',
    totalPoints: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'challenge-2',
    title: 'Longest Unique Substring',
    description: 'Find the longest substring without repeating characters.',
    difficulty: 'medium',
    topic: 'String',
    totalPoints: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'challenge-3',
    title: 'Merge K Sorted Lists',
    description: 'Merge k sorted linked lists and return one sorted list.',
    difficulty: 'hard',
    topic: 'Linked List',
    totalPoints: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const baseExam: Exam = {
  id: 'exam-001',
  title: 'Algorithms Midterm',
  password: 'exam-pass',
  duration: 120,
  challenges: baseChallenges,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdBy: 'teacher-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const students: User[] = [
  {
    id: 'student-1',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-2',
    firstname: 'Jane',
    lastname: 'Smith',
    email: 'jane@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-3',
    firstname: 'Bob',
    lastname: 'Johnson',
    email: 'bob@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-4',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-5',
    firstname: 'Jane',
    lastname: 'Smith',
    email: 'jane@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-6',
    firstname: 'Bob',
    lastname: 'Johnson',
    email: 'bob@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-7',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-8',
    firstname: 'Jane',
    lastname: 'Smith',
    email: 'jane@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-9',
    firstname: 'Bob',
    lastname: 'Johnson',
    email: 'bob@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-10',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-11',
    firstname: 'Jane',
    lastname: 'Smith',
    email: 'jane@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'student-12',
    firstname: 'Bob',
    lastname: 'Johnson',
    email: 'bob@example.com',
    role: 'student',
    avatar: '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
]

export const buildMockExam = (overrides?: Partial<Exam>): Exam => ({
  ...baseExam,
  ...overrides,
})

export const buildMockExamList = (count = 6): Exam[] =>
  Array.from({ length: count }, (_, index) =>
    buildMockExam({
      id: `exam-${index + 1}`,
      title:
        index % 2 === 0
          ? `Algorithms Challenge ${index + 1}`
          : `Data Structures Test ${index + 1}`,
      createdBy: index % 2 === 0 ? 'teacher-1' : 'teacher-2',
      startDate: new Date(
        Date.now() + index * 24 * 60 * 60 * 1000
      ).toISOString(),
      endDate: new Date(
        Date.now() + (index + 3) * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
  )

export const buildMockSubmissions = (
  examId = baseExam.id
): ExamSubmission[] => [
  {
    id: 'submission-1',
    examId,
    userId: students[0].id,
    user: students[0],
    solutions: [],
    totalScore: 85,
    startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duration: 60,
  },
  {
    id: 'submission-2',
    examId,
    userId: students[1].id,
    user: students[1],
    solutions: [],
    totalScore: 92,
    startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    duration: 70,
  },
  {
    id: 'submission-3',
    examId,
    userId: students[2].id,
    user: students[2],
    solutions: [],
    totalScore: 78,
    startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    duration: 90,
  },
]
