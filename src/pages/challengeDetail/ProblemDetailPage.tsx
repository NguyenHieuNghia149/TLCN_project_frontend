import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'

import CodeEditorSection from '@/components/editor/CodeEditorSection'
import ProblemHeader from '@/components/problem/ProblemHeader'
import ProblemSection from '@/components/problem/ProblemSection'
import { useProblemNavigation } from '@/hooks/common/useProblemNavigation'
import { useLanguageDrafts } from '@/hooks/useLanguageDrafts'
import { useSubmissionExecution } from '@/hooks/useSubmissionExecution'
import { challengeService } from '@/services/api/challenge.service'
import type { RootState } from '@/store/stores'
import type { TestCase } from '@/types/editor.types'
import type { ProblemDetailResponse } from '@/types/challenge.types'

export default function ProblemDetailPage({
  problemIdOverride,
}: {
  problemIdOverride?: string
}) {
  const params = useParams<{ id?: string }>()
  const id = problemIdOverride ?? params.id
  const [activeTab, setActiveTab] = useState<
    'question' | 'solution' | 'submissions' | 'discussion'
  >('question')
  const [selectedTestCase, setSelectedTestCase] = useState<string>('1')
  const [problemData, setProblemData] = useState<
    ProblemDetailResponse['data'] | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const splitPaneRef = useRef<HTMLDivElement | null>(null)
  const isDraggingSplitRef = useRef(false)
  const [problemPanelWidth, setProblemPanelWidth] = useState(60)

  const reduxParticipationId = useSelector(
    (state: RootState) => state.exam?.currentParticipationId
  )
  const participationIdToUse = reduxParticipationId || undefined

  const editorStorageKey = id ? `problem_${id}_editor_state` : undefined
  const legacyCodeStorageKey = id ? `problem_${id}_code` : undefined

  const {
    code,
    selectedLanguage,
    setSelectedLanguage,
    onCodeChange,
    onResetCurrentLanguage,
  } = useLanguageDrafts({
    storageKey: editorStorageKey,
    legacyCodeStorageKey,
    starterCodeByLanguage: problemData?.problem.starterCodeByLanguage,
  })

  const testCases: TestCase[] =
    problemData?.testcases.map((testCase, index) => ({
      id: testCase.id,
      name: `Case ${index + 1}`,
      input: testCase.displayInput,
      expectedOutput: testCase.displayOutput,
      isPublic: testCase.isPublic,
    })) || []

  const { output, run, submit, resetOutput } = useSubmissionExecution({
    testCases,
  })

  const { navigationLoading, hasPrev, hasNext, goPrev, goNext } =
    useProblemNavigation({
      currentProblemId: id,
      topicId: problemData?.problem.topicId,
    })

  useEffect(() => {
    const fetchProblemData = async () => {
      if (!id) {
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await challengeService.getChallengeById(id)
        if (response.success) {
          setProblemData(response.data)
        } else {
          setError('Failed to load problem data')
        }
      } catch (fetchError) {
        setError('Error loading problem data')
        console.error('Error fetching problem:', fetchError)
      } finally {
        setLoading(false)
      }
    }

    void fetchProblemData()
  }, [id])

  useEffect(() => {
    setSelectedTestCase('1')
    resetOutput()
  }, [id, resetOutput])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      }

      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrev, goNext])

  const handleRun = useCallback(async () => {
    if (!problemData?.problem.id) {
      return
    }

    await run({
      sourceCode: code,
      language: selectedLanguage,
      problemId: problemData.problem.id,
      participationId: participationIdToUse,
    })
  }, [
    code,
    participationIdToUse,
    problemData?.problem.id,
    run,
    selectedLanguage,
  ])

  const handleSubmit = useCallback(async () => {
    if (!problemData?.problem.id) {
      return
    }

    await submit({
      sourceCode: code,
      language: selectedLanguage,
      problemId: problemData.problem.id,
      participationId: participationIdToUse,
    })
  }, [
    code,
    participationIdToUse,
    problemData?.problem.id,
    selectedLanguage,
    submit,
  ])

  const handleReset = useCallback(() => {
    onResetCurrentLanguage()
    resetOutput()
  }, [onResetCurrentLanguage, resetOutput])

  const clampWidth = useCallback((nextWidth: number) => {
    const MIN = 35
    const MAX = 75
    return Math.min(MAX, Math.max(MIN, nextWidth))
  }, [])

  const updateSplitFromClientX = useCallback(
    (clientX: number) => {
      if (!splitPaneRef.current) return
      const rect = splitPaneRef.current.getBoundingClientRect()
      if (rect.width === 0) return
      const relativeX = clientX - rect.left
      const nextWidth = (relativeX / rect.width) * 100
      setProblemPanelWidth(clampWidth(nextWidth))
    },
    [clampWidth]
  )

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingSplitRef.current) return
      event.preventDefault()
      updateSplitFromClientX(event.clientX)
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!isDraggingSplitRef.current) return
      const touch = event.touches[0]
      if (!touch) return
      updateSplitFromClientX(touch.clientX)
    }

    const stopDragging = () => {
      isDraggingSplitRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('mouseup', stopDragging)
    window.addEventListener('touchend', stopDragging)
    window.addEventListener('touchcancel', stopDragging)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseup', stopDragging)
      window.removeEventListener('touchend', stopDragging)
      window.removeEventListener('touchcancel', stopDragging)
    }
  }, [updateSplitFromClientX])

  const startDraggingSplit = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    isDraggingSplitRef.current = true
    if ('touches' in event) {
      const touch = event.touches[0]
      if (touch) {
        updateSplitFromClientX(touch.clientX)
      }
    }
  }

  const resetSplit = () => setProblemPanelWidth(60)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-500"></div>
          <p>Loading problem...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
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
    <div className="flex h-screen flex-col bg-background text-foreground">
      <ProblemHeader
        onPrev={goPrev}
        onNext={goNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onReset={handleReset}
        problemId={problemData?.problem.id}
        navigationLoading={navigationLoading}
      />

      <div
        ref={splitPaneRef}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
      >
        <div
          className="flex h-full min-h-0 min-w-[200px] flex-col overflow-hidden border-b border-border lg:border-b-0 lg:border-r"
          style={{
            flexBasis: `${problemPanelWidth}%`,
            maxWidth: `${problemPanelWidth}%`,
          }}
        >
          <ProblemSection
            activeTab={activeTab}
            onTabChange={setActiveTab}
            problemData={problemData || undefined}
          />
        </div>
        <div
          className="hidden w-0.5 cursor-col-resize select-none bg-border lg:block"
          onMouseDown={startDraggingSplit}
          onTouchStart={startDraggingSplit}
          onDoubleClick={resetSplit}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          tabIndex={-1}
        />
        <div
          className="flex h-full min-h-0 min-w-[320px] flex-1 overflow-hidden"
          style={{
            flexBasis: `${100 - problemPanelWidth}%`,
            maxWidth: `${100 - problemPanelWidth}%`,
          }}
        >
          <CodeEditorSection
            code={code}
            onCodeChange={onCodeChange}
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
    </div>
  )
}
