import React from 'react'
import { Navigate, useParams } from 'react-router-dom'

import LoadingSpinner from '@/components/common/LoadingSpinner'
import { examService } from '@/services/api/exam.service'
import LegacyExamCompatibilityNotFound from './LegacyExamCompatibilityNotFound'
import {
  resolveLegacyRedirectTarget,
  type LegacyExamRedirectMode,
} from './legacy-exam-redirect'

interface LegacyExamRedirectProps {
  mode: LegacyExamRedirectMode
}

const LegacyExamRedirect: React.FC<LegacyExamRedirectProps> = ({ mode }) => {
  const { examId, challengeId } = useParams<{
    examId?: string
    challengeId?: string
  }>()
  const [target, setTarget] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const run = async () => {
      if (!examId) {
        setLoading(false)
        return
      }

      if (mode === 'admin-results') {
        setTarget(
          resolveLegacyRedirectTarget({
            mode,
            examId,
          })
        )
        setLoading(false)
        return
      }

      try {
        const exam = await examService.getExamById(examId)
        setTarget(
          resolveLegacyRedirectTarget({
            mode,
            examId,
            challengeId,
            slug: exam?.slug,
          })
        )
      } catch {
        setTarget(null)
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [challengeId, examId, mode])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!target) {
    return <LegacyExamCompatibilityNotFound />
  }

  return <Navigate to={target} replace />
}

export default LegacyExamRedirect
