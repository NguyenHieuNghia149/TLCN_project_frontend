// src/services/api/problem.service.ts
import { Challenge } from '@/types/challenge.types'
import { mockChallenges } from '@/mocks/mockChallenges'

/**
 * Giả lập API lấy danh sách challenge theo trang & topic.
 * Mỗi trang gồm 3 challenge để dễ test lazy loading.
 */
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
