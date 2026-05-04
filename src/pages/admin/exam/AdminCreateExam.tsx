import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  MailOutlined,
  MergeCellsOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import dayjs, { type Dayjs } from 'dayjs'

import { challengeService } from '@/services/api/challenge.service'
import { examService } from '@/services/api/exam.service'
import {
  resolveWizardStepIndex,
  syncWizardSearchParams,
} from './admin-exam-wizard.query'
import InviteDispatchResult, {
  type InviteDispatchSummary,
} from './components/notifications/InviteDispatchResult'
import type { ChallengeItem } from '@/types/challenge.types'
import type {
  AdminExamParticipant,
  AdminUserLookupItem,
  CreateExamPayload,
  Exam,
} from '@/types/exam.types'

const STEP_ITEMS = [
  { key: 'basic', title: 'Basic' },
  { key: 'access', title: 'Access' },
  { key: 'participants', title: 'Participants' },
  { key: 'challenges', title: 'Challenges' },
  { key: 'notifications', title: 'Notifications' },
  { key: 'review', title: 'Review' },
] as const

type WizardStepKey = (typeof STEP_ITEMS)[number]['key']

type ExamFormValues = {
  title: string
  slug?: string
  examPassword?: string
  duration: number
  startDate: Dayjs
  endDate: Dayjs
  isVisible: boolean
  maxAttempts: number
  accessMode: 'open_registration' | 'invite_only' | 'hybrid'
  selfRegistrationApprovalMode?: 'auto' | 'manual' | null
  selfRegistrationPasswordRequired: boolean
  allowExternalCandidates: boolean
  registrationOpenAt?: Dayjs | null
  registrationCloseAt?: Dayjs | null
}

type ParticipantTableRow = {
  key: string
  id: string
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
  inviteSentAt: string | null
  latestInviteExpiresAt: string | null
  latestEntrySessionStatus:
    | 'opened'
    | 'verified'
    | 'eligible'
    | 'started'
    | 'expired'
    | null
  latestParticipationStatus: string | null
  attemptsUsed: number
  canUseInviteLink: boolean
  isMerged: boolean
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function parseCsvParticipants(
  csvText: string
): Array<{ email: string; fullName: string }> {
  return csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [emailPart, ...rest] = line.split(',')
      const email = normalizeEmail(emailPart || '')
      const fullName = rest.join(',').trim() || email
      return { email, fullName }
    })
    .filter(item => item.email.length > 0)
}

function getApprovalColor(status: ParticipantTableRow['approvalStatus']) {
  switch (status) {
    case 'approved':
      return 'green'
    case 'rejected':
      return 'red'
    default:
      return 'gold'
  }
}

function getAccessColor(status: ParticipantTableRow['accessStatus']) {
  switch (status) {
    case 'active':
      return 'processing'
    case 'eligible':
      return 'cyan'
    case 'completed':
      return 'blue'
    case 'revoked':
      return 'red'
    case 'invited':
      return 'purple'
    default:
      return 'default'
  }
}

function getExamStatusColor(status?: Exam['status']) {
  switch (status) {
    case 'published':
      return 'green'
    case 'cancelled':
      return 'red'
    case 'archived':
      return 'default'
    default:
      return 'gold'
  }
}

function toParticipantRows(
  participants: AdminExamParticipant[]
): ParticipantTableRow[] {
  return participants.map(participant => ({
    key: participant.id,
    id: participant.id,
    userId: participant.userId,
    mergedIntoParticipantId: participant.mergedIntoParticipantId ?? null,
    normalizedEmail: participant.normalizedEmail,
    fullName: participant.fullName,
    source: participant.source,
    approvalStatus: participant.approvalStatus,
    accessStatus: participant.accessStatus,
    inviteSentAt: participant.inviteSentAt,
    latestInviteExpiresAt: participant.latestInviteExpiresAt,
    latestEntrySessionStatus: participant.latestEntrySessionStatus,
    latestParticipationStatus: participant.latestParticipationStatus,
    attemptsUsed: participant.attemptsUsed,
    canUseInviteLink: participant.canUseInviteLink,
    isMerged: participant.isMerged,
  }))
}

function normalizeParticipantsList(payload: unknown): AdminExamParticipant[] {
  return Array.isArray(payload) ? (payload as AdminExamParticipant[]) : []
}

function extractErrorMessage(fallbackMessage: string, error: unknown): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const responsePayload = (
      error as {
        response?: {
          data?: {
            message?: string
            error?: {
              message?: string
              details?: unknown
            }
          }
        }
      }
    ).response?.data

    if (responsePayload?.error?.message) {
      let detailMsg = ''
      if (typeof responsePayload.error.details === 'string') {
        detailMsg = `: ${responsePayload.error.details}`
      } else if (Array.isArray(responsePayload.error.details)) {
        const strDetails = responsePayload.error.details.filter(
          d => typeof d === 'string'
        )
        if (strDetails.length > 0) {
          detailMsg = `: ${strDetails.join(', ')}`
        }
      }
      return `${responsePayload.error.message}${detailMsg}`
    }

    if (responsePayload?.message) {
      return responsePayload.message
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}

const AdminCreateExam: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const returnPage = location.state?.returnPage
  const isClientManageRoute = location.pathname.startsWith('/exam/')
  const examListPath = isClientManageRoute ? '/exam' : '/admin/exams'
  const pageBackgroundColor = isClientManageRoute
    ? 'transparent'
    : 'var(--admin-bg-primary)'
  const pageTextColor = isClientManageRoute
    ? 'inherit'
    : 'var(--admin-text-primary)'
  const [form] = Form.useForm<ExamFormValues>()
  const { notification } = App.useApp()

  const initialStep = resolveWizardStepIndex(
    searchParams.get('step'),
    STEP_ITEMS.map(item => item.key)
  )
  const [currentStep, setCurrentStep] = useState(initialStep)
  const stepQueryValue = searchParams.get('step')
  const currentStepKey: WizardStepKey = STEP_ITEMS[currentStep]?.key ?? 'basic'
  const [loadingExam, setLoadingExam] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [bulkInviteLoading, setBulkInviteLoading] = useState(false)

  const [examRecord, setExamRecord] = useState<Exam | null>(null)
  const [persistedExamId, setPersistedExamId] = useState<string | null>(
    id ?? null
  )

  const [selectedChallenges, setSelectedChallenges] = useState<ChallengeItem[]>(
    []
  )
  const [allChallenges, setAllChallenges] = useState<ChallengeItem[]>([])
  const [challengeSearch, setChallengeSearch] = useState('')
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false)

  const [participants, setParticipants] = useState<AdminExamParticipant[]>([])
  const [showMergedParticipants, setShowMergedParticipants] = useState(false)
  const [externalEmail, setExternalEmail] = useState('')
  const [externalFullName, setExternalFullName] = useState('')
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [csvImportText, setCsvImportText] = useState('')
  const [inviteDispatchSummary, setInviteDispatchSummary] =
    useState<InviteDispatchSummary | null>(null)

  const [userLookupOptions, setUserLookupOptions] = useState<
    AdminUserLookupItem[]
  >([])
  const [userLookupLoading, setUserLookupLoading] = useState(false)
  const [selectedInternalUserId, setSelectedInternalUserId] = useState<string>()

  const [bindTargetParticipant, setBindTargetParticipant] =
    useState<AdminExamParticipant | null>(null)
  const [bindUserId, setBindUserId] = useState<string>()

  const [mergeModalOpen, setMergeModalOpen] = useState(false)
  const [mergeSourceParticipantId, setMergeSourceParticipantId] =
    useState<string>()
  const [mergeTargetParticipantId, setMergeTargetParticipantId] =
    useState<string>()
  const [rowActionKey, setRowActionKey] = useState<string | null>(null)

  const accessModeWatch = Form.useWatch('accessMode', form)
  const accessMode =
    accessModeWatch ?? form.getFieldValue('accessMode') ?? 'open_registration'

  const allowExternalWatch = Form.useWatch('allowExternalCandidates', form)
  const allowExternalCandidates =
    allowExternalWatch ?? form.getFieldValue('allowExternalCandidates') ?? false
  const resolvedExamId = id ?? persistedExamId

  const visibleParticipants = useMemo(() => {
    const participantList = normalizeParticipantsList(participants)
    return showMergedParticipants
      ? participantList
      : participantList.filter(participant => !participant.isMerged)
  }, [participants, showMergedParticipants])

  const combinedParticipantRows = useMemo(
    () => toParticipantRows(visibleParticipants),
    [visibleParticipants]
  )

  const participantStats = useMemo(
    () => ({
      total: visibleParticipants.length,
      approved: visibleParticipants.filter(
        row => row.approvalStatus === 'approved'
      ).length,
      pending: visibleParticipants.filter(
        row => row.approvalStatus === 'pending'
      ).length,
      inviteReady: visibleParticipants.filter(
        row =>
          row.approvalStatus === 'approved' &&
          row.canUseInviteLink &&
          row.accessStatus !== 'revoked'
      ).length,
    }),
    [visibleParticipants]
  )

  const applyExamToForm = (exam: Exam) => {
    setExamRecord(exam)
    form.setFieldsValue({
      title: exam.title,
      slug: exam.slug,
      duration: exam.duration,
      examPassword: undefined,
      startDate: dayjs(exam.startDate),
      endDate: dayjs(exam.endDate),
      isVisible: exam.isVisible,
      maxAttempts: exam.maxAttempts,
      accessMode: exam.accessMode || 'open_registration',
      selfRegistrationApprovalMode:
        exam.selfRegistrationApprovalMode || 'manual',
      selfRegistrationPasswordRequired:
        exam.selfRegistrationPasswordRequired || false,
      allowExternalCandidates: exam.allowExternalCandidates || false,
      registrationOpenAt: exam.registrationOpenAt
        ? dayjs(exam.registrationOpenAt)
        : null,
      registrationCloseAt: exam.registrationCloseAt
        ? dayjs(exam.registrationCloseAt)
        : null,
    })
    setSelectedChallenges(
      Array.isArray(exam.challenges)
        ? exam.challenges.map(challenge => ({
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            difficulty: challenge.difficulty,
            topic: challenge.topic,
            topicName: challenge.topicName,
            createdAt: challenge.createdAt,
            totalPoints: challenge.totalPoints,
            isSolved: false,
            isFavorite: false,
            visibility: challenge.visibility,
          }))
        : []
    )
  }

  const handleError = (fallbackMessage: string, error: unknown) => {
    const message = extractErrorMessage(fallbackMessage, error)
    notification.error({
      message: 'Error',
      description: message,
      placement: 'topRight',
    })
  }

  const fetchChallengesForSelection = async (search?: string) => {
    try {
      const response = await challengeService.getAllChallenges(1, 100, search)
      setAllChallenges(response.items)
    } catch (error) {
      handleError('Failed to load challenge catalog', error)
    }
  }

  const loadParticipantList = async (examId: string) => {
    setParticipantsLoading(true)
    try {
      const response = await examService.getAdminExamParticipants(examId)
      setParticipants(normalizeParticipantsList(response))
    } catch (error) {
      handleError('Failed to load participants', error)
    } finally {
      setParticipantsLoading(false)
    }
  }

  const loadExam = async (examId: string) => {
    setLoadingExam(true)
    try {
      const exam = await examService.getAdminExamById(examId)
      applyExamToForm(exam)
      setPersistedExamId(exam.id)
      await loadParticipantList(exam.id)
    } catch (error) {
      handleError('Failed to load exam', error)
    } finally {
      setLoadingExam(false)
    }
  }

  useEffect(() => {
    const targetStep = resolveWizardStepIndex(
      stepQueryValue,
      STEP_ITEMS.map(item => item.key)
    )
    setCurrentStep(previousStep =>
      previousStep === targetStep ? previousStep : targetStep
    )
  }, [stepQueryValue])

  useEffect(() => {
    setSearchParams(
      current => syncWizardSearchParams(current, currentStepKey),
      { replace: true }
    )
  }, [currentStepKey, setSearchParams])

  useEffect(() => {
    if (!id) {
      return
    }

    void loadExam(id)
  }, [id])

  const loadUserOptions = async (query: string) => {
    setUserLookupLoading(true)
    try {
      const items = await examService.searchAdminUsers(query)
      setUserLookupOptions(items)
    } catch (error) {
      handleError('Failed to search internal users', error)
    } finally {
      setUserLookupLoading(false)
    }
  }

  const navigateBackToList = () => {
    navigate(returnPage ? `${examListPath}?page=${returnPage}` : examListPath)
  }

  const syncToEditRouteIfNeeded = (
    examId: string,
    nextStep: WizardStepKey = currentStepKey
  ) => {
    if (!id) {
      const editRoute = isClientManageRoute
        ? `/exam/${examId}/manage?step=${nextStep}`
        : `/admin/exams/edit/${examId}?step=${nextStep}`

      navigate(editRoute, {
        replace: true,
        state: { returnPage },
      })
    }
  }

  const ensureExamPersistedForRoster = async () => {
    if (resolvedExamId) {
      return resolvedExamId
    }

    await form.validateFields()
    const values = form.getFieldsValue(true) as ExamFormValues
    const payload = buildPayload(values)
    const createdExam = await examService.createAdminExam(payload)

    setPersistedExamId(createdExam.id)
    applyExamToForm(createdExam)
    await loadParticipantList(createdExam.id)
    syncToEditRouteIfNeeded(createdExam.id, currentStepKey)

    return createdExam.id
  }

  const handleAddInternalParticipant = async () => {
    const option = userLookupOptions.find(
      user => user.id === selectedInternalUserId
    )
    if (!option) {
      notification.warning({
        message: 'Select a user',
        description: 'Choose an internal user before adding them to the exam.',
        placement: 'topRight',
      })
      return
    }

    setSaving(true)
    try {
      const examIdForRoster = await ensureExamPersistedForRoster()
      await examService.addAdminExamParticipants(examIdForRoster, {
        participants: [{ userId: option.id, fullName: option.fullName }],
      })
      await loadParticipantList(examIdForRoster)
      notification.success({
        message: 'Participant added',
        description: `${option.fullName} has been added to the exam.`,
        placement: 'topRight',
      })
      setSelectedInternalUserId(undefined)
    } catch (error) {
      handleError('Failed to add internal participant', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddExternalParticipant = async () => {
    if (!allowExternalCandidates) {
      notification.warning({
        message: 'External candidates disabled',
        description:
          'Enable external candidates in the Access step before adding email-only participants.',
        placement: 'topRight',
      })
      return
    }

    const normalizedEmail = normalizeEmail(externalEmail)
    if (!normalizedEmail) {
      notification.warning({
        message: 'Missing email',
        description: 'Provide an email address for the participant.',
        placement: 'topRight',
      })
      return
    }

    setSaving(true)
    try {
      const examIdForRoster = await ensureExamPersistedForRoster()
      await examService.addAdminExamParticipants(examIdForRoster, {
        participants: [
          {
            email: normalizedEmail,
            fullName: externalFullName.trim() || normalizedEmail,
          },
        ],
      })
      await loadParticipantList(examIdForRoster)
      notification.success({
        message: 'Participant added',
        description: `${normalizedEmail} has been added to the exam.`,
        placement: 'topRight',
      })
      setExternalEmail('')
      setExternalFullName('')
    } catch (error) {
      handleError('Failed to add participant', error)
    } finally {
      setSaving(false)
    }
  }

  const handleImportCsvParticipants = async () => {
    if (!allowExternalCandidates) {
      notification.warning({
        message: 'External candidates disabled',
        description:
          'Enable external candidates in the Access step before importing an external roster.',
        placement: 'topRight',
      })
      return
    }

    const parsed = parseCsvParticipants(csvImportText)
    if (parsed.length === 0) {
      notification.warning({
        message: 'No participants found',
        description:
          'Use one participant per line in the format email,full name.',
        placement: 'topRight',
      })
      return
    }

    setSaving(true)
    try {
      const examIdForRoster = await ensureExamPersistedForRoster()
      await examService.importAdminExamParticipants(examIdForRoster, {
        participants: parsed.map(item => ({
          email: item.email,
          fullName: item.fullName,
        })),
      })
      await loadParticipantList(examIdForRoster)
      notification.success({
        message: 'CSV imported',
        description: `Imported ${parsed.length} participant(s).`,
        placement: 'topRight',
      })
      setCsvImportOpen(false)
      setCsvImportText('')
    } catch (error) {
      handleError('Failed to import participants', error)
    } finally {
      setSaving(false)
    }
  }

  const buildPayload = (values: ExamFormValues): CreateExamPayload => ({
    title: values.title.trim(),
    slug: values.slug?.trim() || slugify(values.title),
    examPassword: values.examPassword || undefined,
    duration: values.duration,
    startDate: values.startDate.toISOString(),
    endDate: values.endDate.toISOString(),
    isVisible: values.isVisible,
    maxAttempts: values.maxAttempts,
    accessMode: values.accessMode,
    selfRegistrationApprovalMode:
      values.accessMode === 'invite_only'
        ? null
        : values.selfRegistrationApprovalMode || 'manual',
    selfRegistrationPasswordRequired:
      values.accessMode === 'invite_only'
        ? false
        : values.selfRegistrationPasswordRequired,
    allowExternalCandidates: values.allowExternalCandidates,
    registrationOpenAt: values.registrationOpenAt
      ? values.registrationOpenAt.toISOString()
      : null,
    registrationCloseAt: values.registrationCloseAt
      ? values.registrationCloseAt.toISOString()
      : null,
    challenges: selectedChallenges.map((challenge, index) => ({
      type: 'existing',
      challengeId: challenge.id,
      orderIndex: index,
    })),
  })

  const persistExam = async () => {
    if (selectedChallenges.length === 0) {
      notification.warning({
        message: 'Choose challenges',
        description:
          'Add at least one challenge before saving or publishing this exam.',
        placement: 'topRight',
      })
      throw new Error('MISSING_CHALLENGES')
    }

    await form.validateFields()
    const values = form.getFieldsValue(true) as ExamFormValues

    const payload = buildPayload(values)
    const savedExam = resolvedExamId
      ? await examService.updateAdminExam(resolvedExamId, payload)
      : await examService.createAdminExam(payload)

    const examId = savedExam.id
    setPersistedExamId(examId)

    const refreshedExam = await examService.getAdminExamById(examId)
    applyExamToForm(refreshedExam)
    await loadParticipantList(examId)

    return refreshedExam
  }

  const handleSaveExam = async () => {
    setSaving(true)
    try {
      const savedExam = await persistExam()
      syncToEditRouteIfNeeded(savedExam.id, currentStepKey)
      notification.success({
        message: id ? 'Exam updated' : 'Exam created',
        description: `${savedExam.title} is now saved.`,
        placement: 'topRight',
      })
    } catch (error) {
      handleError('Failed to save exam', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePublishExam = async () => {
    setPublishing(true)
    try {
      const savedExam = await persistExam()
      const wasPublishedBefore =
        savedExam.status === 'published' || examRecord?.status === 'published'
      const publishedExam = wasPublishedBefore
        ? savedExam
        : await examService.publishAdminExam(savedExam.id)

      setExamRecord(publishedExam)
      notification.success({
        message: wasPublishedBefore ? 'Settings saved' : 'Exam published',
        description: wasPublishedBefore
          ? `${publishedExam.title} settings were updated successfully.`
          : `${publishedExam.title} is now live and visible to participants.`,
        placement: 'topRight',
      })
      syncToEditRouteIfNeeded(publishedExam.id, 'notifications')
    } catch (error) {
      handleError('Failed to publish exam', error)
    } finally {
      setPublishing(false)
    }
  }

  const handleSendApprovedInvites = async () => {
    setBulkInviteLoading(true)
    try {
      const savedExam = await persistExam()
      const publishedExam =
        savedExam.status === 'published' || examRecord?.status === 'published'
          ? savedExam
          : await examService.publishAdminExam(savedExam.id)
      setExamRecord(publishedExam)

      if ((publishedExam.accessMode ?? accessMode) === 'open_registration') {
        notification.info({
          message: 'Invite delivery not applicable',
          description:
            'Open-registration exams do not use invite delivery. Participants join through registration flow.',
          placement: 'topRight',
        })
        return
      }

      const latestParticipants = await examService.getAdminExamParticipants(
        publishedExam.id
      )
      const normalizedLatestParticipants =
        normalizeParticipantsList(latestParticipants)
      setParticipants(normalizedLatestParticipants)

      const inviteCandidates = normalizedLatestParticipants.filter(
        participant =>
          participant.approvalStatus === 'approved' &&
          participant.canUseInviteLink &&
          participant.accessStatus !== 'revoked'
      )

      if (inviteCandidates.length === 0) {
        notification.info({
          message: 'No invite-ready participants',
          description:
            'Approved invite-only or hybrid participants will appear here once they are ready.',
          placement: 'topRight',
        })
        return
      }

      const results = await Promise.allSettled(
        inviteCandidates.map(participant =>
          examService.resendAdminExamParticipantInvite(
            publishedExam.id,
            participant.id
          )
        )
      )

      const successCount = results.filter(
        result => result.status === 'fulfilled'
      ).length
      const failedCount = results.length - successCount
      const failedParticipants = inviteCandidates.filter(
        (_participant, index) => results[index]?.status === 'rejected'
      )
      setInviteDispatchSummary({
        total: results.length,
        sent: successCount,
        failed: failedCount,
        failedParticipantIds: failedParticipants.map(
          participant => participant.id
        ),
        failedRecipients: failedParticipants.map(
          participant =>
            `${participant.fullName} (${participant.normalizedEmail})`
        ),
      })

      await loadParticipantList(publishedExam.id)

      notification[failedCount > 0 ? 'warning' : 'success']({
        message: 'Invite dispatch finished',
        description:
          failedCount > 0
            ? `Sent ${successCount} invite(s). ${failedCount} invite(s) failed and may need retry.`
            : `Sent ${successCount} invite(s).`,
        placement: 'topRight',
      })
      syncToEditRouteIfNeeded(publishedExam.id, 'notifications')
    } catch (error) {
      handleError('Failed to send participant invites', error)
    } finally {
      setBulkInviteLoading(false)
    }
  }

  const handleRetryFailedInvites = async () => {
    if (
      !resolvedExamId ||
      !inviteDispatchSummary ||
      inviteDispatchSummary.failed === 0
    ) {
      return
    }

    setBulkInviteLoading(true)
    try {
      const targets = participants.filter(participant =>
        inviteDispatchSummary.failedParticipantIds.includes(participant.id)
      )
      if (targets.length === 0) {
        notification.info({
          message: 'No failed recipients to retry',
          placement: 'topRight',
        })
        return
      }

      const results = await Promise.allSettled(
        targets.map(participant =>
          examService.resendAdminExamParticipantInvite(
            resolvedExamId,
            participant.id
          )
        )
      )

      const successCount = results.filter(
        result => result.status === 'fulfilled'
      ).length
      const failedParticipants = targets.filter(
        (_participant, index) => results[index]?.status === 'rejected'
      )

      setInviteDispatchSummary({
        total: targets.length,
        sent: successCount,
        failed: failedParticipants.length,
        failedParticipantIds: failedParticipants.map(
          participant => participant.id
        ),
        failedRecipients: failedParticipants.map(
          participant =>
            `${participant.fullName} (${participant.normalizedEmail})`
        ),
      })

      await loadParticipantList(resolvedExamId)

      notification[failedParticipants.length > 0 ? 'warning' : 'success']({
        message: 'Retry dispatch completed',
        description:
          failedParticipants.length > 0
            ? `Resent ${successCount} invite(s). ${failedParticipants.length} invite(s) still failing.`
            : `Resent ${successCount} invite(s).`,
        placement: 'topRight',
      })
    } catch (error) {
      handleError('Failed to retry invite dispatch', error)
    } finally {
      setBulkInviteLoading(false)
    }
  }

  const handleParticipantAction = async (
    actionKey: string,
    action: () => Promise<void>
  ) => {
    setRowActionKey(actionKey)
    try {
      await action()
    } finally {
      setRowActionKey(null)
    }
  }

  const handleApproveParticipant = async (participantId: string) => {
    if (!resolvedExamId) {
      return
    }
    await handleParticipantAction(`approve:${participantId}`, async () => {
      await examService.approveAdminExamParticipant(
        resolvedExamId,
        participantId
      )
      await loadParticipantList(resolvedExamId)
      notification.success({
        message: 'Participant approved',
        description: 'The participant can now access the exam flow.',
        placement: 'topRight',
      })
    })
  }

  const handleRejectParticipant = async (participantId: string) => {
    if (!resolvedExamId) {
      return
    }
    await handleParticipantAction(`reject:${participantId}`, async () => {
      await examService.rejectAdminExamParticipant(
        resolvedExamId,
        participantId
      )
      await loadParticipantList(resolvedExamId)
      notification.success({
        message: 'Participant rejected',
        description: 'The participant was marked as rejected.',
        placement: 'topRight',
      })
    })
  }

  const handleRevokeParticipant = async (participantId: string) => {
    if (!resolvedExamId) {
      return
    }
    await handleParticipantAction(`revoke:${participantId}`, async () => {
      await examService.revokeAdminExamParticipant(
        resolvedExamId,
        participantId
      )
      await loadParticipantList(resolvedExamId)
      notification.success({
        message: 'Participant revoked',
        description: 'Invite access was revoked for this participant.',
        placement: 'topRight',
      })
    })
  }

  const handleResendInvite = async (participantId: string) => {
    if (!resolvedExamId) {
      return
    }
    await handleParticipantAction(`invite:${participantId}`, async () => {
      await examService.resendAdminExamParticipantInvite(
        resolvedExamId,
        participantId
      )
      await loadParticipantList(resolvedExamId)
      notification.success({
        message: 'Invite sent',
        description: 'A fresh invite link has been sent to the participant.',
        placement: 'topRight',
      })
    })
  }

  const handleBindAccount = async () => {
    if (!resolvedExamId || !bindTargetParticipant || !bindUserId) {
      return
    }

    await handleParticipantAction(
      `bind:${bindTargetParticipant.id}`,
      async () => {
        await examService.bindAdminExamParticipantAccount(
          resolvedExamId,
          bindTargetParticipant.id,
          bindUserId
        )
        await loadParticipantList(resolvedExamId)
        notification.success({
          message: 'Account bound',
          description:
            'The participant is now linked to the selected internal account.',
          placement: 'topRight',
        })
        setBindTargetParticipant(null)
        setBindUserId(undefined)
      }
    )
  }

  const handleMergeParticipants = async () => {
    if (
      !resolvedExamId ||
      !mergeSourceParticipantId ||
      !mergeTargetParticipantId
    ) {
      return
    }

    await handleParticipantAction(
      `merge:${mergeSourceParticipantId}:${mergeTargetParticipantId}`,
      async () => {
        await examService.mergeAdminExamParticipants(resolvedExamId, {
          sourceParticipantId: mergeSourceParticipantId,
          targetParticipantId: mergeTargetParticipantId,
        })
        await loadParticipantList(resolvedExamId)
        notification.success({
          message: 'Participants merged',
          description:
            'Participant history was re-linked to the canonical row.',
          placement: 'topRight',
        })
        setMergeModalOpen(false)
        setMergeSourceParticipantId(undefined)
        setMergeTargetParticipantId(undefined)
      }
    )
  }

  const handleOpenBindModal = async (participant: AdminExamParticipant) => {
    setBindTargetParticipant(participant)
    setBindUserId(undefined)
    await loadUserOptions(participant.normalizedEmail)
  }

  const handleMoveChallenge = (index: number, direction: 'up' | 'down') => {
    setSelectedChallenges(current => {
      const next = [...current]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex < 0 || swapIndex >= next.length) {
        return current
      }
      const temp = next[index]
      next[index] = next[swapIndex]
      next[swapIndex] = temp
      return next
    })
  }

  const handleAddChallenge = (challenge: ChallengeItem) => {
    if (selectedChallenges.some(item => item.id === challenge.id)) {
      notification.warning({
        message: 'Already selected',
        description: 'This challenge is already part of the exam.',
        placement: 'topRight',
      })
      return
    }

    setSelectedChallenges(current => [...current, challenge])
  }

  const handleRemoveChallenge = (challengeId: string) => {
    setSelectedChallenges(current =>
      current.filter(challenge => challenge.id !== challengeId)
    )
  }

  const stepFields: Array<Array<keyof ExamFormValues>> = [
    [
      'title',
      'slug',
      'startDate',
      'endDate',
      'duration',
      'maxAttempts',
      'isVisible',
    ],
    [
      'accessMode',
      'selfRegistrationApprovalMode',
      'selfRegistrationPasswordRequired',
      'allowExternalCandidates',
      'registrationOpenAt',
      'registrationCloseAt',
    ],
    [],
    [],
    [],
    [],
  ]

  const handleNext = async () => {
    try {
      const fields = stepFields[currentStep]
      if (fields.length > 0) {
        await form.validateFields(fields)
      }

      if (currentStep === 3 && selectedChallenges.length === 0) {
        notification.warning({
          message: 'Choose challenges',
          description: 'Add at least one challenge before continuing.',
          placement: 'topRight',
        })
        return
      }

      setCurrentStep(step => Math.min(step + 1, STEP_ITEMS.length - 1))
    } catch (error) {
      const validationError = error as {
        errorFields?: Array<{ name: (string | number)[] }>
      }
      const firstErrorField = validationError.errorFields?.[0]?.name
      if (firstErrorField && firstErrorField.length > 0) {
        form.scrollToField(firstErrorField)
      }
      notification.warning({
        message: 'Cannot move to next step',
        description: 'Please complete required fields in this step first.',
        placement: 'topRight',
      })
      return
    }
  }

  const handlePrevious = () => {
    setCurrentStep(step => Math.max(step - 1, 0))
  }

  const challengeColumns: ColumnsType<ChallengeItem> = [
    {
      title: '#',
      width: 72,
      render: (_value, _record, index) => index + 1,
    },
    {
      title: 'Challenge',
      dataIndex: 'title',
      key: 'title',
      render: (_value, record) => (
        <div>
          <div className="font-semibold">{record.title}</div>
          <div className="text-xs opacity-70">
            {record.topicName || record.topic || 'No topic'}
          </div>
        </div>
      ),
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: ChallengeItem['difficulty']) => (
        <Tag
          color={
            difficulty === 'easy'
              ? 'green'
              : difficulty === 'medium'
                ? 'orange'
                : 'red'
          }
        >
          {difficulty.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Visibility',
      dataIndex: 'visibility',
      key: 'visibility',
      render: (visibility: string) => (
        <Tag
          color={
            visibility === 'public'
              ? 'blue'
              : visibility === 'exam_only'
                ? 'red'
                : 'default'
          }
        >
          {visibility.toUpperCase().replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_value, record, index) => (
        <Space>
          <Tooltip title="Move up">
            <Button
              icon={<ArrowUpOutlined />}
              disabled={index === 0}
              onClick={() => handleMoveChallenge(index, 'up')}
            />
          </Tooltip>
          <Tooltip title="Move down">
            <Button
              icon={<ArrowDownOutlined />}
              disabled={index === selectedChallenges.length - 1}
              onClick={() => handleMoveChallenge(index, 'down')}
            />
          </Tooltip>
          <Tooltip title="Remove">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveChallenge(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const participantColumns: ColumnsType<ParticipantTableRow> = [
    {
      title: 'Participant',
      key: 'participant',
      render: (_value, record) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{record.fullName}</span>
            {record.isMerged ? <Tag color="default">Merged</Tag> : null}
          </div>
          <div className="text-xs opacity-70">{record.normalizedEmail}</div>
        </div>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: ParticipantTableRow['source']) => (
        <Tag
          color={
            source === 'self_registration'
              ? 'cyan'
              : source === 'invite'
                ? 'purple'
                : 'blue'
          }
        >
          {source.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Approval',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (approvalStatus: ParticipantTableRow['approvalStatus']) => (
        <Tag color={getApprovalColor(approvalStatus)}>
          {approvalStatus.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Access',
      dataIndex: 'accessStatus',
      key: 'accessStatus',
      render: (accessStatus: ParticipantTableRow['accessStatus']) => (
        <Tag color={getAccessColor(accessStatus)}>
          {(accessStatus || 'pending').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Activity',
      key: 'activity',
      render: (_value, record) => (
        <div className="text-xs">
          <div>Attempts: {record.attemptsUsed}</div>
          <div>Entry: {record.latestEntrySessionStatus || 'none'}</div>
          <div>Participation: {record.latestParticipationStatus || 'none'}</div>
        </div>
      ),
    },
    {
      title: 'Invite',
      key: 'invite',
      render: (_value, record) => (
        <div className="text-xs">
          <div>
            Sent:{' '}
            {record.inviteSentAt
              ? dayjs(record.inviteSentAt).format('DD/MM HH:mm')
              : 'no'}
          </div>
          <div>
            Expires:{' '}
            {record.latestInviteExpiresAt
              ? dayjs(record.latestInviteExpiresAt).format('DD/MM HH:mm')
              : 'n/a'}
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 320,
      render: (_value, record) => {
        if (record.isMerged) {
          return <Tag color="default">Merged row</Tag>
        }

        const participant = participants.find(item => item.id === record.id)
        if (!participant || !resolvedExamId) {
          return null
        }

        return (
          <Space wrap>
            {record.approvalStatus !== 'approved' ? (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                loading={rowActionKey === `approve:${record.id}`}
                onClick={() => void handleApproveParticipant(record.id)}
              >
                Approve
              </Button>
            ) : null}
            {record.approvalStatus !== 'rejected' ? (
              <Button
                size="small"
                danger
                loading={rowActionKey === `reject:${record.id}`}
                onClick={() => void handleRejectParticipant(record.id)}
              >
                Reject
              </Button>
            ) : null}
            {record.approvalStatus === 'approved' &&
            record.accessStatus !== 'revoked' ? (
              <Button
                size="small"
                loading={rowActionKey === `revoke:${record.id}`}
                onClick={() => void handleRevokeParticipant(record.id)}
              >
                Revoke
              </Button>
            ) : null}
            {!record.userId ? (
              <Button
                size="small"
                icon={<LinkOutlined />}
                loading={rowActionKey === `bind:${record.id}`}
                onClick={() => void handleOpenBindModal(participant)}
              >
                Bind account
              </Button>
            ) : null}
            {record.canUseInviteLink &&
            record.approvalStatus === 'approved' &&
            examRecord?.status === 'published' &&
            record.accessStatus !== 'revoked' ? (
              <Button
                size="small"
                icon={<SendOutlined />}
                loading={rowActionKey === `invite:${record.id}`}
                onClick={() => void handleResendInvite(record.id)}
              >
                Send invite
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  const renderBasicStep = () => (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="title"
          label="Exam Title"
          rules={[{ required: true, message: 'Please enter an exam title' }]}
        >
          <Input
            placeholder="Spring assessment 2026"
            size="large"
            onChange={event => {
              const currentSlug = form.getFieldValue('slug')
              if (!currentSlug) {
                form.setFieldValue('slug', slugify(event.target.value))
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          rules={[
            { required: true, message: 'Please provide a slug' },
            {
              pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message:
                'Slug must use lowercase letters, numbers, and hyphens only',
            },
          ]}
        >
          <Input placeholder="spring-assessment-2026" size="large" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Form.Item
          name="startDate"
          label="Start date"
          rules={[{ required: true, message: 'Please set a start time' }]}
        >
          <DatePicker showTime className="w-full" size="large" />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="End date"
          dependencies={['startDate']}
          rules={[
            { required: true, message: 'Please set an end time' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const startDate = getFieldValue('startDate')
                if (!value || !startDate || value.isAfter(startDate)) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  new Error('End date must be after start date')
                )
              },
            }),
          ]}
        >
          <DatePicker showTime className="w-full" size="large" />
        </Form.Item>

        <Form.Item
          name="duration"
          label="Duration (minutes)"
          rules={[{ required: true, message: 'Please set a duration' }]}
        >
          <InputNumber min={1} className="w-full" size="large" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Form.Item
          name="maxAttempts"
          label="Max attempts"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={10} className="w-full" />
        </Form.Item>

        <Form.Item
          name="isVisible"
          label="Visibility"
          valuePropName="checked"
          tooltip="Visible exams appear in the public exam list."
        >
          <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
        </Form.Item>
      </div>
    </>
  )

  const renderAccessStep = () => (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="accessMode"
          label="Access mode"
          rules={[{ required: true, message: 'Choose an access mode' }]}
        >
          <Select
            options={[
              { value: 'open_registration', label: 'Open registration' },
              { value: 'invite_only', label: 'Invite only' },
              { value: 'hybrid', label: 'Hybrid' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="selfRegistrationApprovalMode"
          label="Registration approval"
          rules={
            accessMode === 'invite_only'
              ? []
              : [{ required: true, message: 'Choose an approval rule' }]
          }
        >
          <Select
            disabled={accessMode === 'invite_only'}
            options={[
              { value: 'manual', label: 'Manual approval' },
              { value: 'auto', label: 'Auto approve' },
            ]}
          />
        </Form.Item>
      </div>

      <div className="mb-6 flex flex-wrap gap-8">
        <Form.Item
          name="selfRegistrationPasswordRequired"
          label="Require registration password"
          valuePropName="checked"
        >
          <Switch disabled={accessMode === 'invite_only'} />
        </Form.Item>

        <Form.Item
          name="allowExternalCandidates"
          label="Allow external candidates"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </div>

      <Form.Item
        name="examPassword"
        label="Registration password"
        tooltip="Stored server-side as password hash; never returned in public exam APIs."
      >
        <Input.Password
          placeholder={
            accessMode === 'invite_only'
              ? 'Not used for invite-only mode'
              : 'Optional'
          }
          disabled={accessMode === 'invite_only'}
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item name="registrationOpenAt" label="Registration opens">
          <DatePicker showTime className="w-full" size="large" />
        </Form.Item>

        <Form.Item name="registrationCloseAt" label="Registration closes">
          <DatePicker showTime className="w-full" size="large" />
        </Form.Item>
      </div>

      <Alert
        type="info"
        showIcon
        message="Access mode guardrails"
        description={
          accessMode === 'invite_only'
            ? 'Invite-only exams do not use self-registration approval or password on the registration path.'
            : accessMode === 'hybrid'
              ? 'Hybrid exams support both invite links and self-registration. Existing invited participants will reuse their current access state instead of creating duplicate registrations.'
              : 'Open-registration exams accept self-registration and may optionally require an exam password on the registration request.'
        }
      />
    </>
  )

  const renderParticipantsStep = () => (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <Statistic title="Total roster" value={participantStats.total} />
        </Card>
        <Card>
          <Statistic title="Approved" value={participantStats.approved} />
        </Card>
        <Card>
          <Statistic title="Pending" value={participantStats.pending} />
        </Card>
        <Card>
          <Statistic
            title="Invite-ready"
            value={participantStats.inviteReady}
          />
        </Card>
      </div>

      <Alert
        className="mb-6"
        type="info"
        showIcon
        message="Server-persisted roster"
        description="Add/import actions write directly to server. If this exam has no id yet, the first roster action will auto-create a draft exam before persisting participants."
      />

      {!allowExternalCandidates ? (
        <Alert
          className="mb-6"
          type="info"
          showIcon
          message="External candidates are disabled"
          description="You can still add internal users. Email-only participants and CSV roster import unlock after enabling external candidates in the Access step."
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Add internal participant" extra={<UserAddOutlined />}>
          <Space direction="vertical" className="w-full">
            <Select
              showSearch
              size="large"
              placeholder="Search internal users"
              value={selectedInternalUserId}
              filterOption={false}
              onSearch={value => {
                void loadUserOptions(value)
              }}
              onChange={value => setSelectedInternalUserId(value)}
              notFoundContent={
                userLookupLoading ? <Spin size="small" /> : 'No matching users'
              }
              options={userLookupOptions.map(option => ({
                label: `${option.fullName} (${option.email})`,
                value: option.id,
              }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                void handleAddInternalParticipant()
              }}
              loading={saving}
            >
              Add internal user
            </Button>
          </Space>
        </Card>

        <Card title="Add external participant" extra={<MailOutlined />}>
          <Space direction="vertical" className="w-full">
            <Input
              placeholder="candidate@example.com"
              size="large"
              disabled={!allowExternalCandidates}
              value={externalEmail}
              onChange={event => setExternalEmail(event.target.value)}
            />
            <Input
              placeholder="Full name"
              size="large"
              disabled={!allowExternalCandidates}
              value={externalFullName}
              onChange={event => setExternalFullName(event.target.value)}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!allowExternalCandidates}
              onClick={() => {
                void handleAddExternalParticipant()
              }}
              loading={saving}
            >
              Add external candidate
            </Button>
          </Space>
        </Card>

        <Card title="Bulk import" extra={<TeamOutlined />}>
          <Space direction="vertical" className="w-full">
            <Typography.Paragraph className="!mb-0">
              Use one line per participant in the format
              <Typography.Text code className="ml-1">
                email,full name
              </Typography.Text>
              .
            </Typography.Paragraph>
            <Button
              icon={<PlusOutlined />}
              disabled={!allowExternalCandidates}
              onClick={() => setCsvImportOpen(true)}
            >
              Import CSV roster
            </Button>
            <Typography.Text type="secondary">
              Imports persist directly to server roster.
            </Typography.Text>
          </Space>
        </Card>
      </div>

      <Card
        className="mt-6"
        title="Participant roster"
        extra={
          <Space>
            <Switch
              checked={showMergedParticipants}
              onChange={setShowMergedParticipants}
              checkedChildren="Show merged"
              unCheckedChildren="Hide merged"
            />
            <Button
              icon={<ReloadOutlined />}
              disabled={!resolvedExamId}
              loading={participantsLoading}
              onClick={() => {
                if (resolvedExamId) {
                  void loadParticipantList(resolvedExamId)
                }
              }}
            >
              Refresh
            </Button>
            <Button
              icon={<MergeCellsOutlined />}
              disabled={!resolvedExamId || participants.length < 2}
              onClick={() => setMergeModalOpen(true)}
            >
              Merge participants
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="key"
          columns={participantColumns}
          dataSource={combinedParticipantRows}
          loading={participantsLoading}
          pagination={false}
          onRow={record => ({
            onClick: () => {
              setSearchParams(
                current => {
                  const next = new URLSearchParams(current)
                  next.set('step', 'participants')
                  next.set('participantId', record.id)
                  return next
                },
                { replace: true }
              )
            },
          })}
          locale={{
            emptyText: (
              <Empty description="No participants yet. Add internal users, external emails, or import a CSV roster." />
            ),
          }}
        />
      </Card>
    </>
  )

  const renderChallengesStep = () => (
    <Card
      title="Challenge order"
      extra={
        <Button
          icon={<SearchOutlined />}
          onClick={() => {
            void fetchChallengesForSelection(challengeSearch)
            setIsChallengeModalOpen(true)
          }}
        >
          Browse challenge catalog
        </Button>
      }
    >
      <Table
        rowKey="id"
        columns={challengeColumns}
        dataSource={selectedChallenges}
        pagination={false}
        locale={{
          emptyText: (
            <Empty description="No challenges selected. Add at least one challenge to continue." />
          ),
        }}
      />
    </Card>
  )

  const renderNotificationsStep = () => {
    const examSlug =
      form.getFieldValue('slug') || slugify(form.getFieldValue('title') || '')
    const landingUrl = examSlug
      ? `${window.location.origin}/exam/${examSlug}`
      : null
    const isPublished = (examRecord?.status || 'draft') === 'published'
    const inviteDeliverySupported = accessMode !== 'open_registration'
    const inviteDispatchDisabledReason = !inviteDeliverySupported
      ? 'Invite delivery is only available for invite-only and hybrid exams.'
      : participantStats.inviteReady === 0
        ? 'No approved invite-ready participants yet.'
        : null
    const dispatchButtonLabel = isPublished
      ? 'Send approved invites'
      : 'Publish and send approved invites'

    return (
      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <Statistic
              title="Exam status"
              value={examRecord?.status || 'draft'}
              valueStyle={{ textTransform: 'capitalize' }}
            />
          </Card>
          <Card>
            <Statistic
              title="Invite-ready participants"
              value={participantStats.inviteReady}
            />
          </Card>
          <Card>
            <Statistic
              title="Access mode"
              value={accessMode.replace('_', ' ')}
            />
          </Card>
        </div>

        <Alert
          className="my-6"
          type="info"
          showIcon
          message="Notification behavior"
          description="Registration approvals/rejections, reschedules, and cancellations trigger email automatically. Invite links are sent manually from this step or per participant."
        />

        {inviteDispatchSummary ? (
          <InviteDispatchResult
            summary={inviteDispatchSummary}
            loading={bulkInviteLoading}
            onRetryFailed={() => {
              void handleRetryFailedInvites()
            }}
          />
        ) : null}

        <Card title="Publish and delivery">
          <Space direction="vertical" className="w-full">
            <div className="flex flex-wrap items-center gap-3">
              <Tag color={getExamStatusColor(examRecord?.status)}>
                {(examRecord?.status || 'draft').toUpperCase()}
              </Tag>
              {landingUrl ? (
                <Typography.Text copyable={{ text: landingUrl }}>
                  {landingUrl}
                </Typography.Text>
              ) : null}
            </div>

            <Space wrap>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={publishing}
                onClick={() => {
                  void handlePublishExam()
                }}
              >
                {isPublished ? 'Save published settings' : 'Save and publish'}
              </Button>
              <Tooltip title={inviteDispatchDisabledReason || ''}>
                <span>
                  <Button
                    icon={<SendOutlined />}
                    loading={bulkInviteLoading}
                    disabled={Boolean(inviteDispatchDisabledReason)}
                    onClick={() => {
                      void handleSendApprovedInvites()
                    }}
                  >
                    {dispatchButtonLabel}
                  </Button>
                </span>
              </Tooltip>
            </Space>

            <Typography.Paragraph className="!mb-0 text-sm opacity-75">
              Invite dispatch will publish the exam first if needed, then send
              or refresh invite links for every approved participant who can use
              invite access.
            </Typography.Paragraph>
          </Space>
        </Card>
      </>
    )
  }

  const renderReviewStep = () => {
    const values = form.getFieldsValue(true) as Partial<ExamFormValues>
    const titleValue = values.title?.trim() || examRecord?.title || '-'
    const slugValue = values.slug?.trim() || examRecord?.slug || '-'
    const startDateValue =
      values.startDate ||
      (examRecord?.startDate ? dayjs(examRecord.startDate) : null)
    const endDateValue =
      values.endDate || (examRecord?.endDate ? dayjs(examRecord.endDate) : null)
    const durationValue = values.duration ?? examRecord?.duration ?? 0
    const accessModeValue =
      values.accessMode || examRecord?.accessMode || 'open_registration'
    const registrationOpenAtValue =
      values.registrationOpenAt ||
      (examRecord?.registrationOpenAt
        ? dayjs(examRecord.registrationOpenAt)
        : null)
    const registrationCloseAtValue =
      values.registrationCloseAt ||
      (examRecord?.registrationCloseAt
        ? dayjs(examRecord.registrationCloseAt)
        : null)
    const registrationWindow =
      registrationOpenAtValue || registrationCloseAtValue
        ? `${registrationOpenAtValue ? registrationOpenAtValue.format('DD/MM/YYYY HH:mm') : 'Always open'} -> ${
            registrationCloseAtValue
              ? registrationCloseAtValue.format('DD/MM/YYYY HH:mm')
              : 'Until exam end'
          }`
        : 'No registration window restriction'

    return (
      <div className="space-y-6">
        <Card title="Exam summary">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Title">{titleValue}</Descriptions.Item>
            <Descriptions.Item label="Slug">{slugValue}</Descriptions.Item>
            <Descriptions.Item label="Schedule">
              {startDateValue?.format('DD/MM/YYYY HH:mm') || '-'}
              {' -> '}
              {endDateValue?.format('DD/MM/YYYY HH:mm') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {durationValue} minutes
            </Descriptions.Item>
            <Descriptions.Item label="Access mode">
              {accessModeValue.replace('_', ' ')}
            </Descriptions.Item>
            <Descriptions.Item label="Registration window">
              {registrationWindow}
            </Descriptions.Item>
            <Descriptions.Item label="Participants prepared">
              {combinedParticipantRows.length}
            </Descriptions.Item>
            <Descriptions.Item label="Challenges selected">
              {selectedChallenges.length}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Challenge preview">
          {selectedChallenges.length > 0 ? (
            <List
              dataSource={selectedChallenges}
              renderItem={(challenge, index) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${index + 1}. ${challenge.title}`}
                    description={`${challenge.difficulty.toUpperCase()} · ${challenge.visibility.toUpperCase().replace('_', ' ')}`}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No challenges selected" />
          )}
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            onClick={() => {
              void handleSaveExam()
            }}
            loading={saving}
            icon={<EditOutlined />}
          >
            {resolvedExamId ? 'Save changes' : 'Create exam draft'}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              void handlePublishExam()
            }}
            loading={publishing}
            icon={<CheckCircleOutlined />}
          >
            Save and publish
          </Button>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStepKey) {
      case 'basic':
        return renderBasicStep()
      case 'access':
        return renderAccessStep()
      case 'participants':
        return renderParticipantsStep()
      case 'challenges':
        return renderChallengesStep()
      case 'notifications':
        return renderNotificationsStep()
      case 'review':
        return renderReviewStep()
      default:
        return null
    }
  }

  const participantIdFromQuery = searchParams.get('participantId')
  const participantDrawerRecord =
    currentStepKey === 'participants' && participantIdFromQuery
      ? participants.find(
          participant => participant.id === participantIdFromQuery
        ) || null
      : null
  const canonicalParticipantRecord =
    participantDrawerRecord?.mergedIntoParticipantId
      ? participants.find(
          participant =>
            participant.id === participantDrawerRecord.mergedIntoParticipantId
        ) || null
      : null

  const closeParticipantDrawer = useCallback(() => {
    setSearchParams(
      current => {
        const next = new URLSearchParams(current)
        next.delete('participantId')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  useEffect(() => {
    if (currentStepKey !== 'participants' || !participantIdFromQuery) {
      return
    }
    if (participantDrawerRecord) {
      return
    }
    closeParticipantDrawer()
  }, [
    closeParticipantDrawer,
    currentStepKey,
    participantDrawerRecord,
    participantIdFromQuery,
  ])

  return (
    <div
      className="min-h-screen p-6 transition-colors duration-300"
      style={{
        backgroundColor: pageBackgroundColor,
        color: pageTextColor,
      }}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={navigateBackToList} />
          <div>
            <h1 className="text-2xl font-bold">
              {id ? 'Edit Exam' : 'Create Exam'}
            </h1>
            <div className="text-sm opacity-70">
              Multi-step wizard for schedule, access, participants, challenges,
              and invite delivery.
            </div>
          </div>
        </div>
        <Space>
          {examRecord?.status ? (
            <Tag color={getExamStatusColor(examRecord.status)}>
              {examRecord.status.toUpperCase()}
            </Tag>
          ) : null}
          <Button
            onClick={() => {
              void handleSaveExam()
            }}
            loading={saving}
          >
            Save draft
          </Button>
        </Space>
      </div>

      <Card>
        <Steps
          current={currentStep}
          items={STEP_ITEMS.map(item => ({ title: item.title }))}
          responsive
        />

        <Divider />

        <Spin spinning={loadingExam}>
          <Form<ExamFormValues>
            form={form}
            layout="vertical"
            preserve={true}
            initialValues={{
              isVisible: false,
              maxAttempts: 1,
              duration: 90,
              accessMode: 'open_registration',
              selfRegistrationApprovalMode: 'manual',
              selfRegistrationPasswordRequired: false,
              allowExternalCandidates: false,
              startDate: dayjs().add(1, 'hour'),
              endDate: dayjs().add(1, 'day'),
            }}
          >
            {renderStepContent()}
          </Form>
        </Spin>

        <Divider />

        <div className="flex flex-wrap justify-between gap-3">
          <Button onClick={handlePrevious} disabled={currentStep === 0}>
            Previous
          </Button>

          {currentStep < STEP_ITEMS.length - 1 ? (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => void handleNext()}
            >
              Next
            </Button>
          ) : null}
        </div>
      </Card>

      <Drawer
        title="Participant details"
        open={!!participantDrawerRecord}
        width={420}
        onClose={closeParticipantDrawer}
      >
        {participantDrawerRecord ? (
          <Space direction="vertical" className="w-full">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Name">
                {participantDrawerRecord.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {participantDrawerRecord.normalizedEmail}
              </Descriptions.Item>
              <Descriptions.Item label="Source">
                {participantDrawerRecord.source}
              </Descriptions.Item>
              <Descriptions.Item label="Approval">
                {participantDrawerRecord.approvalStatus}
              </Descriptions.Item>
              <Descriptions.Item label="Access">
                {participantDrawerRecord.accessStatus ?? 'pending'}
              </Descriptions.Item>
              <Descriptions.Item label="Attempts used">
                {participantDrawerRecord.attemptsUsed}
              </Descriptions.Item>
              <Descriptions.Item label="Latest entry session">
                {participantDrawerRecord.latestEntrySessionStatus ?? 'none'}
              </Descriptions.Item>
              <Descriptions.Item label="Latest participation">
                {participantDrawerRecord.latestParticipationStatus ?? 'none'}
              </Descriptions.Item>
            </Descriptions>

            <Alert
              type="info"
              showIcon
              message="Timeline summary"
              description={
                participantDrawerRecord.isMerged
                  ? `This row has been merged into ${
                      canonicalParticipantRecord
                        ? `${canonicalParticipantRecord.fullName} (${canonicalParticipantRecord.normalizedEmail})`
                        : participantDrawerRecord.mergedIntoParticipantId ||
                          'another canonical participant'
                    }.`
                  : 'Participant timeline is composed from invite, entry session, participation status, and audit logs.'
              }
            />

            <Card title="Timeline" size="small">
              <List
                size="small"
                dataSource={[
                  {
                    key: 'source',
                    label: `Added via ${participantDrawerRecord.source.replace('_', ' ')}`,
                  },
                  ...(participantDrawerRecord.inviteSentAt
                    ? [
                        {
                          key: 'invite',
                          label: `Invite sent at ${dayjs(participantDrawerRecord.inviteSentAt).format('DD/MM/YYYY HH:mm')}`,
                        },
                      ]
                    : []),
                  ...(participantDrawerRecord.joinedAt
                    ? [
                        {
                          key: 'joined',
                          label: `Joined at ${dayjs(participantDrawerRecord.joinedAt).format('DD/MM/YYYY HH:mm')}`,
                        },
                      ]
                    : []),
                  {
                    key: 'entry',
                    label: `Latest entry session: ${participantDrawerRecord.latestEntrySessionStatus || 'none'}`,
                  },
                  {
                    key: 'attempts',
                    label: `Attempts used: ${participantDrawerRecord.attemptsUsed}`,
                  },
                  ...(participantDrawerRecord.latestParticipationStatus
                    ? [
                        {
                          key: 'participation',
                          label: `Latest participation status: ${participantDrawerRecord.latestParticipationStatus}`,
                        },
                      ]
                    : []),
                  ...(participantDrawerRecord.isMerged
                    ? [
                        {
                          key: 'merged',
                          label: `Merged into ${
                            canonicalParticipantRecord
                              ? `${canonicalParticipantRecord.fullName} (${canonicalParticipantRecord.normalizedEmail})`
                              : participantDrawerRecord.mergedIntoParticipantId ||
                                'canonical participant'
                          }`,
                        },
                      ]
                    : []),
                ]}
                renderItem={item => (
                  <List.Item key={item.key}>{item.label}</List.Item>
                )}
              />
            </Card>

            {participantDrawerRecord.isMerged && canonicalParticipantRecord ? (
              <Button
                type="primary"
                onClick={() =>
                  setSearchParams(
                    current => {
                      const next = new URLSearchParams(current)
                      next.set('step', 'participants')
                      next.set('participantId', canonicalParticipantRecord.id)
                      return next
                    },
                    { replace: true }
                  )
                }
              >
                Open canonical participant
              </Button>
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Browse challenge catalog"
        open={isChallengeModalOpen}
        onCancel={() => setIsChallengeModalOpen(false)}
        footer={null}
        width={900}
      >
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Search challenge catalog"
            prefix={<SearchOutlined />}
            value={challengeSearch}
            onChange={event => setChallengeSearch(event.target.value)}
            onPressEnter={() =>
              void fetchChallengesForSelection(challengeSearch)
            }
          />
          <Button
            type="primary"
            onClick={() => void fetchChallengesForSelection(challengeSearch)}
          >
            Search
          </Button>
        </div>

        <List
          dataSource={allChallenges}
          className="max-h-[60vh] overflow-y-auto"
          renderItem={challenge => (
            <List.Item
              actions={[
                selectedChallenges.some(item => item.id === challenge.id) ? (
                  <Tag color="blue" key="selected">
                    Selected
                  </Tag>
                ) : (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    key="add"
                    onClick={() => handleAddChallenge(challenge)}
                  >
                    Add
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                title={challenge.title}
                description={
                  <Space wrap>
                    <Tag
                      color={
                        challenge.difficulty === 'easy'
                          ? 'green'
                          : challenge.difficulty === 'medium'
                            ? 'orange'
                            : 'red'
                      }
                    >
                      {challenge.difficulty.toUpperCase()}
                    </Tag>
                    <Tag color="default">
                      {(challenge.visibility || 'public')
                        .toUpperCase()
                        .replace('_', ' ')}
                    </Tag>
                    <Typography.Text type="secondary">
                      {challenge.topicName || challenge.topic || 'No topic'}
                    </Typography.Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title="Import CSV roster"
        open={csvImportOpen}
        onCancel={() => setCsvImportOpen(false)}
        onOk={() => void handleImportCsvParticipants()}
        okText="Import"
        okButtonProps={{ loading: saving }}
      >
        <Typography.Paragraph>
          Use one participant per line.
        </Typography.Paragraph>
        <Typography.Paragraph>
          <Typography.Text code>alice@example.com,Alice Nguyen</Typography.Text>
          <br />
          <Typography.Text code>bob@example.com,Bob Tran</Typography.Text>
        </Typography.Paragraph>
        <Input.TextArea
          rows={10}
          value={csvImportText}
          onChange={event => setCsvImportText(event.target.value)}
          placeholder="email,full name"
        />
      </Modal>

      <Modal
        title="Bind participant to internal account"
        open={!!bindTargetParticipant}
        onCancel={() => {
          setBindTargetParticipant(null)
          setBindUserId(undefined)
        }}
        onOk={() => void handleBindAccount()}
        okText="Bind account"
        okButtonProps={{
          disabled: !bindUserId,
          loading: rowActionKey?.startsWith('bind:'),
        }}
      >
        <Space direction="vertical" className="w-full">
          <Typography.Text>
            Bind <strong>{bindTargetParticipant?.fullName}</strong> (
            {bindTargetParticipant?.normalizedEmail}) to an internal user
            record.
          </Typography.Text>
          <Select
            showSearch
            size="large"
            placeholder="Search internal users"
            value={bindUserId}
            filterOption={false}
            onSearch={value => {
              void loadUserOptions(value)
            }}
            onChange={value => setBindUserId(value)}
            notFoundContent={
              userLookupLoading ? <Spin size="small" /> : 'No matching users'
            }
            options={userLookupOptions.map(option => ({
              label: `${option.fullName} (${option.email})`,
              value: option.id,
            }))}
          />
        </Space>
      </Modal>

      <Modal
        title="Merge participants"
        open={mergeModalOpen}
        onCancel={() => setMergeModalOpen(false)}
        onOk={() => void handleMergeParticipants()}
        okText="Merge"
        okButtonProps={{
          disabled:
            !mergeSourceParticipantId ||
            !mergeTargetParticipantId ||
            mergeSourceParticipantId === mergeTargetParticipantId,
          loading: rowActionKey?.startsWith('merge:'),
        }}
      >
        <Space direction="vertical" className="w-full">
          <Select
            placeholder="Source participant (will be archived)"
            value={mergeSourceParticipantId}
            onChange={value => setMergeSourceParticipantId(value)}
            options={participants
              .filter(participant => !participant.isMerged)
              .map(participant => ({
                label: `${participant.fullName} (${participant.normalizedEmail})`,
                value: participant.id,
              }))}
          />
          <Select
            placeholder="Target participant (canonical row)"
            value={mergeTargetParticipantId}
            onChange={value => setMergeTargetParticipantId(value)}
            options={participants
              .filter(participant => !participant.isMerged)
              .map(participant => ({
                label: `${participant.fullName} (${participant.normalizedEmail})`,
                value: participant.id,
              }))}
          />
        </Space>
      </Modal>
    </div>
  )
}

export default AdminCreateExam
