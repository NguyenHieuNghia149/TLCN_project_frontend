import type { User } from './auth.types'
import type {
  ChallengeItem,
  Solution as ProblemSolution,
  TestCase as ChallengeTestCase,
} from './challenge.types'
import type {
  FunctionSignature,
  StarterCodeByLanguage,
} from './functionSignature.types'

export interface Exam {
  id: string
  title: string
  slug?: string
  duration: number // in minutes
  challenges: ChallengeItem[]
  startDate: string // ISO datetime
  endDate: string // ISO datetime
  createdBy?: string // userId
  isVisible: boolean
  maxAttempts: number
  status?: 'draft' | 'published' | 'archived' | 'cancelled'
  accessMode?: 'open_registration' | 'invite_only' | 'hybrid'
  attemptsUsed?: number
  latestParticipationStatus?:
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'EXPIRED'
    | 'ABANDONED'
    | null
  hasInProgressParticipation?: boolean
  hasCompletedParticipation?: boolean
  selfRegistrationApprovalMode?: 'auto' | 'manual' | null
  selfRegistrationPasswordRequired?: boolean
  allowExternalCandidates?: boolean
  registrationOpenAt?: string | null
  registrationCloseAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateExamPayload {
  title: string
  slug?: string
  examPassword?: string
  duration: number
  startDate: string
  endDate: string
  isVisible: boolean
  maxAttempts: number
  accessMode?: 'open_registration' | 'invite_only' | 'hybrid'
  selfRegistrationApprovalMode?: 'auto' | 'manual' | null
  selfRegistrationPasswordRequired?: boolean
  allowExternalCandidates?: boolean
  registrationOpenAt?: string | null
  registrationCloseAt?: string | null
  challenges: Array<{
    type: 'existing' | 'new'
    challengeId: string
    orderIndex?: number
  }>
}

export interface UpdateExamPayload {
  title?: string
  slug?: string
  examPassword?: string
  duration?: number
  startDate?: string
  endDate?: string
  isVisible?: boolean
  maxAttempts?: number
  accessMode?: 'open_registration' | 'invite_only' | 'hybrid'
  selfRegistrationApprovalMode?: 'auto' | 'manual' | null
  selfRegistrationPasswordRequired?: boolean
  allowExternalCandidates?: boolean
  registrationOpenAt?: string | null
  registrationCloseAt?: string | null
  challenges?: Array<{
    type: 'existing' | 'new'
    challengeId: string
    orderIndex?: number
  }>
}

export interface PublicExamLanding {
  id: string
  slug: string
  title: string
  status: 'draft' | 'published' | 'archived' | 'cancelled'
  accessMode: 'open_registration' | 'invite_only' | 'hybrid'
  startDate: string
  endDate: string
  registrationOpenAt: string | null
  registrationCloseAt: string | null
  duration: number
  maxAttempts: number
  challengeCount: number
  allowExternalCandidates: boolean
  selfRegistrationApprovalMode: 'auto' | 'manual' | null
  selfRegistrationPasswordRequired: boolean
  isRegistrationOpen: boolean
  canUseInviteLink: boolean
}

export interface AdminExamParticipant {
  id: string
  examId: string
  userId: string | null
  mergedIntoParticipantId?: string | null
  normalizedEmail: string
  fullName: string
  source: 'invite' | 'self_registration' | 'manual_add'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  accessStatus:
    | 'invited'
    | 'eligible'
    | 'active'
    | 'revoked'
    | 'completed'
    | null
  approvedBy: string | null
  inviteSentAt: string | null
  joinedAt: string | null
  latestInviteId: string | null
  latestInviteExpiresAt: string | null
  latestEntrySessionId: string | null
  latestEntrySessionStatus: 'opened' | 'eligible' | 'started' | 'expired' | null
  latestParticipationId: string | null
  latestParticipationStatus: string | null
  attemptsUsed: number
  canUseInviteLink: boolean
  isMerged: boolean
}

export interface AdminExamParticipantDraft {
  localId: string
  userId?: string
  email: string
  fullName: string
  source: 'manual_add' | 'invite'
}

export interface AdminUserLookupItem {
  id: string
  email: string
  fullName: string
  role: string
}

export interface ExamAccessState {
  examId: string
  participantId: string | null
  entrySessionId: string | null
  participationId: string | null
  approvalStatus: 'pending' | 'approved' | 'rejected' | null
  accessStatus:
    | 'invited'
    | 'eligible'
    | 'active'
    | 'revoked'
    | 'completed'
    | null
  entrySessionStatus: 'opened' | 'eligible' | 'started' | 'expired' | null
  canStart: boolean
  examStartsAt: string
  participationExpiresAt: string | null
  requiresLogin: boolean
  requiresOtp: boolean
  requiresPassword: boolean
}

export type ProctoringDisplaySurface =
  | 'monitor'
  | 'window'
  | 'browser'
  | 'surface_unknown'

export interface ProctoringSettings {
  examId: string
  enabled: boolean
  requireCamera: boolean
  requireScreenShare: boolean
  requireFullscreen: boolean
  requireMonitorDisplaySurface: boolean
  precheckValiditySeconds: number
  heartbeatIntervalSeconds: number
  missedHeartbeatGraceMultiplier: number
  screenShareResumeTimeoutSeconds: number
  fullscreenResumeTimeoutSeconds: number
  allowedEventTypesJson: string[]
  riskWeightsJson: Record<string, number>
  riskThresholdsJson: Record<string, number>
  clipboardPolicy: 'log_only' | 'block' | 'ignore' | string
  aiAnomalyEnabled: boolean
  aiShadowMode: boolean
  aiJobWindowSeconds: number
  consentNoticeVersion: string
  legalLinksJson: Record<string, string>
  dataRetentionDays: number
  dataDeletionSlaDays: number
  sensitiveDataDeletionTargetHours: number
}

export interface ProctoringConsentRecord {
  id: string
  status: 'accepted' | 'withdrawn' | 'superseded'
  acceptedAt?: string
  withdrawnAt?: string | null
}

export interface ProctoringPrecheckRecord {
  id: string
  passed: boolean
  expiresAt: string
  failureReasonsJson?: string[]
}

export interface ProctoringBypassGrant {
  bypassCodeId: string
  status: 'issued' | 'used' | 'revoked' | 'expired'
  expiresAt?: string
}

export interface ProctoringStartPayload {
  clientSessionId: string
  consentRecordId?: string
  precheckId?: string
  bypassCodeId?: string
}

export interface ProctoringSubmitPayload {
  submitAttemptId: string
  finalFlushReceiptId?: string
}

export interface ProctoringFinalFlushResponse {
  receiptId?: string
  finalFlushReceiptId?: string
  status?: string
}

export interface ProctoringSocketTokenResponse {
  token: string
  expiresAt: string
}

export interface AdminUpdateProctoringSettingsPayload {
  enabled?: boolean
  requireCamera?: boolean
  requireScreenShare?: boolean
  requireFullscreen?: boolean
  requireMonitorDisplaySurface?: boolean
  clipboardPolicy?: 'log_only' | 'block' | 'ignore'
  aiAnomalyEnabled?: boolean
  aiShadowMode?: boolean
  aiAdvisoryVisible?: boolean
  llmSummaryEnabled?: boolean
}

export type AdminProctoringReviewDecision =
  | 'pending'
  | 'no_action'
  | 'needs_re_review'
  | 'refer_for_policy_review'

export interface AiFeatureContribution {
  featureName: string
  numericValue: number
  contribution: number
  direction: 'increased_risk' | 'decreased_risk'
  displayLabel: string
}

export interface AdminProctoringAiAdvisory {
  visible: boolean
  status: 'hidden_shadow_mode' | 'hidden_no_gate' | 'visible' | 'unavailable'
  modelVersion?: string
  featureSchemaVersion?: string
  scoringSchemaVersion?: string
  latestRiskLevel?: string
  maxAnomalyScore?: number
  windows: Array<{
    windowId: string
    windowStart: string | null
    windowEnd: string | null
    anomalyScore: number
    riskLevel: string
    explanationStatus: string
    topContributors: AiFeatureContribution[]
  }>
}

export interface AdminProctoringLlmSummary {
  visible: boolean
  status:
    | 'hidden_disabled'
    | 'pending'
    | 'accepted'
    | 'validation_failed'
    | 'provider_failed'
    | 'dead_letter'
    | 'unavailable'
  summaryId?: string
  provider?: string
  modelVersion?: string
  judgeModelVersion?: string | null
  promptVersion?: string
  validationStatus?: string
  validationScore?: number | null
  summaryText?: string
  riskFacts: Array<{
    type: string
    count: number
    totalDurationMs: number
    evidenceEventIds: string[]
  }>
  citations: Array<{ eventId: string; reason: string }>
  missingDataNotes: string[]
  modelNotes: string[]
  completedAt?: string | null
}

export interface AdminProctoringReview {
  summary: {
    id: string
    examId: string
    participationId: string
    riskScore: number
    riskLevel: string
    eventCountsJson: Record<string, number>
    velocityJson: Record<string, unknown>
    finalFlushStatus: string | null
    deterministicSchemaVersion: string
    computedAt: string | null
    reviewerDecision: AdminProctoringReviewDecision | string
    reviewerId: string | null
    reviewerNotes: string | null
    reviewedAt: string | null
  } | null
  timeline: {
    items: Array<{
      id: string
      type: string
      eventName: string
      severity: string
      clientSeq: number
      capturedAt: string | null
      receivedAt: string | null
      finalFlushReceiptId: string | null
      payloadJson: Record<string, unknown>
    }>
    total: number
    limit: number
    offset: number
  }
  evidence: {
    consent: Array<Record<string, unknown>>
    precheck: Array<Record<string, unknown>>
    bypass: Array<Record<string, unknown>>
    finalFlush: Array<Record<string, unknown>>
    dataRequests: Array<Record<string, unknown>>
  }
  aiAdvisory?: AdminProctoringAiAdvisory
  llmSummary?: AdminProctoringLlmSummary
}

export type ExamSyncStatus = 'active' | 'submitted' | 'expired'

export interface ExamSessionSyncResponse {
  synced: boolean
  lastSyncedAt: string
  participationExpiresAt: string
  status: ExamSyncStatus
}

export interface ExamInviteResolution {
  participantId: string
  entrySessionId: string
  requiresLogin: boolean
  requiresOtp: boolean
  maskedEmail: string
  accessStatus: string
}
export interface ExamParticipation {
  id: string
  participationId?: string // Alias for id
  userId: string
  examId: string
  startedAt?: string
  startAt?: string | number // Alias
  startTimestamp?: number // Alias
  startedAtMs?: number // Alias
  expiresAt?: string | number
  expires_at?: string // Alias
  expires?: string | number // Alias
  currentChallengeId?: string
  currentChallenge?: string // Alias
  currentAnswers?: Record<string, { sourceCode?: string; language?: string }> // Session answers
  answers?: Record<string, { sourceCode?: string; language?: string }> // Alias
  scoreStatus?: 'pending' | 'scored' | 'failed'
  scoredAt?: string | null
  totalScore: number
  submittedAt?: string
  status?: string // Add status property
  createdAt: string
  updatedAt?: string
}

export interface ExamParticipationResponse {
  success: boolean
  data: ExamParticipation
}

export interface ExamChallengeData {
  id: string
  title: string
  description?: string
  content?: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  totalPoints: number
  constraint: string
  tags: string[]
  orderIndex: number
  functionSignature?: FunctionSignature | null
  starterCodeByLanguage?: StarterCodeByLanguage | null
  testcases: ChallengeTestCase[]
  solution?: ProblemSolution
  initialCode?: string
}

export interface ExamChallengeResponse {
  success: boolean
  data: ExamChallengeData
}

export interface ExamSubmission {
  id: string
  userId: string
  examId: string
  user?: User // User details for display
  solutions?: ChallengeSolution[]
  totalScore: number
  totalMaxScore?: number
  startedAt?: string
  submittedAt: string
  duration?: number // actual time spent in minutes
  perProblem?: Array<{
    problemId: string
    obtained: number
    maxPoints: number
    challengeTitle?: string
  }>
  rank?: number
}

export interface ChallengeSolution {
  challengeId: string
  challengeTitle?: string
  code: string
  language: string
  score: number
  maxPoints?: number
  results?: TestCaseResult[]
  submittedAt: string
}

export interface TestCaseResult {
  testCaseId: string
  passed: boolean
  actualOutput: string
  expectedOutput: string
  error?: string
}

export interface ExamResponse {
  success: boolean
  data: Exam
}

export interface ExamListResponse {
  success: boolean
  data: Exam[]
  total: number
}

export interface ExamSubmissionResponse {
  success: boolean
  data: ExamSubmission
}

export interface ExamSubmissionDetailsResponse {
  success: boolean
  data: {
    totalScore: number
    totalMaxScore?: number
    perProblem?: Array<{
      problemId: string
      challengeTitle?: string
      obtained: number
      maxPoints: number
    }>
  }
}

export interface ExamStatisticsResponse {
  success: boolean
  data: {
    totalParticipants: number
    submissions: ExamSubmission[]
    averageScore: number
    statistics: {
      challengeId: string
      challengeTitle: string
      averageScore: number
      passedCount: number
    }[]
  }
}

export interface ExamStatistics {
  totalParticipants: number
  averageScore: number
  challengeStats: {
    challengeId: string
    challengeTitle: string
    averageScore: number
    passedCount: number
  }[]
}

export interface ExamState {
  exams: Exam[]
  currentExam: Exam | null
  submissions: ExamSubmission[]
  currentSubmission: ExamSubmission | null
  // current participation/session info (optional during migration)
  currentParticipationId?: string | null
  currentParticipationExamId?: string | null // NEW: Scope participation to specific exam
  currentParticipationStartAt?: number | string | null
  currentParticipationExpiresAt?: number | string | null
  // optional: which challenge the user is currently on (for resume)
  currentParticipationChallengeId?: string | null
  isLoading: boolean
  error: string | null
  statistics: ExamStatistics | null
}
