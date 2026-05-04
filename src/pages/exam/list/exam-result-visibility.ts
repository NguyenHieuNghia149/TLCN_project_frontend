export function canViewLearnerExamResults(input: {
  examId: string
  isOwner: boolean
  filterType: 'all' | 'participated'
  participatedExamIds: Set<string>
}): boolean {
  if (input.isOwner) {
    return true
  }

  if (input.filterType === 'participated') {
    return true
  }

  return input.participatedExamIds.has(input.examId)
}
