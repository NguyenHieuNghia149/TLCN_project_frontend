import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  Exam,
  ExamSubmission,
  ExamState,
  ExamStatistics,
} from '@/types/exam.types'

const initialState: ExamState = {
  exams: [],
  currentExam: null,
  submissions: [],
  currentSubmission: null,
  // participation/session info for current exam
  currentParticipationId: null,
  currentParticipationStartAt: null,
  currentParticipationExpiresAt: null,
  isLoading: false,
  error: null,
  statistics: null,
}

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    // Error states
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    clearError: state => {
      state.error = null
    },

    // Exam list actions
    setExams: (state, action: PayloadAction<Exam[]>) => {
      state.exams = action.payload
      state.isLoading = false
    },

    addExam: (state, action: PayloadAction<Exam>) => {
      state.exams.push(action.payload)
      state.isLoading = false
    },

    updateExam: (state, action: PayloadAction<Exam>) => {
      const index = state.exams.findIndex(e => e.id === action.payload.id)
      if (index !== -1) {
        state.exams[index] = action.payload
      }
      state.currentExam = action.payload
      state.isLoading = false
    },

    deleteExam: (state, action: PayloadAction<string>) => {
      state.exams = state.exams.filter(e => e.id !== action.payload)
      state.isLoading = false
    },

    // Current exam actions
    setCurrentExam: (state, action: PayloadAction<Exam | null>) => {
      state.currentExam = action.payload
      state.isLoading = false
    },

    // Participation/session actions
    setParticipation: (
      state,
      action: PayloadAction<{
        participationId: string | null
        startAt?: number | string | null
        expiresAt?: number | string | null
        // optional: the current challenge id for resume
        currentChallengeId?: string | null
      }>
    ) => {
      state.currentParticipationId = action.payload.participationId
      state.currentParticipationStartAt = action.payload.startAt ?? null
      state.currentParticipationExpiresAt = action.payload.expiresAt ?? null
      state.currentParticipationChallengeId =
        action.payload.currentChallengeId ?? null
      state.isLoading = false
    },

    clearParticipation: state => {
      state.currentParticipationId = null
      state.currentParticipationStartAt = null
      state.currentParticipationExpiresAt = null
      state.currentParticipationChallengeId = null
    },

    // Submissions actions
    setSubmissions: (state, action: PayloadAction<ExamSubmission[]>) => {
      state.submissions = action.payload
      state.isLoading = false
    },

    addSubmission: (state, action: PayloadAction<ExamSubmission>) => {
      state.submissions.push(action.payload)
      state.isLoading = false
    },

    setCurrentSubmission: (
      state,
      action: PayloadAction<ExamSubmission | null>
    ) => {
      state.currentSubmission = action.payload
      state.isLoading = false
    },

    // Statistics actions
    setStatistics: (state, action: PayloadAction<ExamStatistics>) => {
      state.statistics = action.payload
      state.isLoading = false
    },

    // Clear all
    clearExamState: state => {
      state.exams = []
      state.currentExam = null
      state.submissions = []
      state.currentSubmission = null
      state.statistics = null
      state.error = null
    },
  },
})

export const {
  setLoading,
  setError,
  clearError,
  setExams,
  addExam,
  updateExam,
  deleteExam,
  setCurrentExam,
  setParticipation,
  clearParticipation,
  setSubmissions,
  addSubmission,
  setCurrentSubmission,
  setStatistics,
  clearExamState,
} = examSlice.actions

export default examSlice.reducer
