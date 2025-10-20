// src/services/api/problem.service.ts
import { Challenge } from '@/types/challenge.types'
import { mockChallenges } from '@/mocks/mockChallenges'

export const getChallenges = async (
  page: number,
  topic?: string
): Promise<Challenge[]> => {
  const perPage = 3
  const startIndex = (page - 1) * perPage
  const filtered = topic
    ? mockChallenges.filter(
        ch => ch.topic.toLowerCase() === topic.toLowerCase()
      )
    : mockChallenges

  const pageData = filtered.slice(startIndex, startIndex + perPage)

  // Giả lập độ trễ mạng
  await new Promise(res => setTimeout(res, 800))

  return pageData
}

export const getProblemById = async (
  id: string
): Promise<Challenge | undefined> => {
  await new Promise(res => setTimeout(res, 200))
  return mockChallenges.find(c => c.id === id)
}
