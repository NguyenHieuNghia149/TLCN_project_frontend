import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Input,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  InboxOutlined,
  PlusOutlined,
  StopOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { examService } from '@/services/api/exam.service'
import type { Exam } from '@/types/exam.types'

const PAGE_SIZE = 10

const statusColorMap: Record<string, string> = {
  published: '#16a34a',
  cancelled: '#dc2626',
  archived: '#6b7280',
  draft: '#d97706',
}

const accessColorMap: Record<string, string> = {
  open_registration: '#2563eb',
  invite_only: '#7c3aed',
  hybrid: '#0891b2',
}

type ApiValidationErrors = {
  formErrors?: string[]
  fieldErrors?: Record<string, string[]>
}

type ApiErrorPayload = {
  message?: string
  error?: {
    message?: string
    details?: unknown
  }
  errors?: ApiValidationErrors
}

function pickFirstValidationMessage(
  errors?: ApiValidationErrors
): string | null {
  if (!errors) {
    return null
  }

  const firstFormError = errors.formErrors?.find(
    item => typeof item === 'string' && item.trim().length > 0
  )
  if (firstFormError) {
    return firstFormError
  }

  const fieldEntries = Object.entries(errors.fieldErrors ?? {})
  for (const [field, messages] of fieldEntries) {
    if (!Array.isArray(messages)) {
      continue
    }

    const firstMessage = messages.find(
      message => typeof message === 'string' && message.trim().length > 0
    )
    if (firstMessage) {
      return `${field}: ${firstMessage}`
    }
  }

  return null
}

function pickDetailMessage(details: unknown): string | null {
  if (typeof details === 'string' && details.trim().length > 0) {
    return details
  }

  if (Array.isArray(details)) {
    for (const detail of details) {
      if (typeof detail === 'string' && detail.trim().length > 0) {
        return detail
      }
      if (
        detail &&
        typeof detail === 'object' &&
        'message' in detail &&
        typeof (detail as { message?: unknown }).message === 'string'
      ) {
        return (detail as { message: string }).message
      }
    }
  }

  if (details && typeof details === 'object') {
    if (
      'message' in details &&
      typeof (details as { message?: unknown }).message === 'string'
    ) {
      return (details as { message: string }).message
    }

    if (
      'errors' in details &&
      (details as { errors?: unknown }).errors &&
      typeof (details as { errors?: unknown }).errors === 'object'
    ) {
      return pickFirstValidationMessage(
        (details as { errors?: ApiValidationErrors }).errors
      )
    }

    const context = details as {
      currentStatus?: unknown
      participantCount?: unknown
      endDate?: unknown
    }
    const parts: string[] = []
    if (typeof context.currentStatus === 'string') {
      parts.push(`status=${context.currentStatus}`)
    }
    if (typeof context.participantCount === 'number') {
      parts.push(`participants=${context.participantCount}`)
    }
    if (typeof context.endDate === 'string') {
      parts.push(`endDate=${new Date(context.endDate).toLocaleString()}`)
    }
    if (parts.length > 0) {
      return parts.join(', ')
    }
  }

  return null
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const payload = (error as { response?: { data?: ApiErrorPayload } })
      .response?.data
    if (payload) {
      const backendMessage = payload.error?.message || payload.message
      const detailMessage = pickDetailMessage(payload.error?.details)
      const validationMessage = pickFirstValidationMessage(payload.errors)

      if (
        backendMessage &&
        detailMessage &&
        detailMessage !== backendMessage &&
        !backendMessage.toLowerCase().includes('validation')
      ) {
        return `${backendMessage}: ${detailMessage}`
      }

      return detailMessage || validationMessage || backendMessage || fallback
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

function isExamEnded(endDate: string): boolean {
  return new Date().getTime() > new Date(endDate).getTime()
}

function canPublishExam(exam: Exam): boolean {
  return (exam.status || 'draft') === 'draft'
}

function canCancelExam(exam: Exam): boolean {
  return (exam.status || 'draft') === 'published'
}

function canArchiveExam(exam: Exam): boolean {
  const status = exam.status || 'draft'
  if (status === 'cancelled') {
    return true
  }
  if (status === 'published') {
    return isExamEnded(exam.endDate)
  }
  return false
}

const AdminExamList: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { modal, notification } = App.useApp()

  const [loading, setLoading] = useState(false)
  const [publishingExamId, setPublishingExamId] = useState<string | null>(null)
  const [cancellingExamId, setCancellingExamId] = useState<string | null>(null)
  const [archivingExamId, setArchivingExamId] = useState<string | null>(null)
  const [allExams, setAllExams] = useState<Exam[]>([])
  const [searchText, setSearchText] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  )
  const [modeFilter, setModeFilter] = useState(
    searchParams.get('mode') || 'all'
  )
  const [pagination, setPagination] = useState({
    current: Math.max(Number(searchParams.get('page') || '1'), 1),
    pageSize: PAGE_SIZE,
  })

  const fetchAdminExams = useCallback(
    async (search?: string) => {
      setLoading(true)
      try {
        const response = await examService.getAdminExams(
          500,
          0,
          search || undefined
        )
        setAllExams(Array.isArray(response.data) ? response.data : [])
      } catch (error: unknown) {
        notification.error({
          message: 'Error',
          description: extractApiErrorMessage(error, 'Failed to load exams'),
          placement: 'topRight',
        })
      } finally {
        setLoading(false)
      }
    },
    [notification]
  )

  useEffect(() => {
    void fetchAdminExams(searchText)
  }, [fetchAdminExams, searchText])

  const filteredExams = useMemo(() => {
    return allExams.filter(exam => {
      if (statusFilter !== 'all' && (exam.status || 'draft') !== statusFilter) {
        return false
      }
      if (
        modeFilter !== 'all' &&
        (exam.accessMode || 'open_registration') !== modeFilter
      ) {
        return false
      }
      return true
    })
  }, [allExams, modeFilter, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExams.length / pagination.pageSize)
  )
  const safeCurrentPage = Math.min(pagination.current, totalPages)
  const pagedExams = useMemo(() => {
    const start = (safeCurrentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredExams.slice(start, end)
  }, [filteredExams, pagination.pageSize, safeCurrentPage])

  useEffect(() => {
    const next = new URLSearchParams()
    if (searchText) {
      next.set('q', searchText)
    }
    if (statusFilter !== 'all') {
      next.set('status', statusFilter)
    }
    if (modeFilter !== 'all') {
      next.set('mode', modeFilter)
    }
    if (safeCurrentPage > 1) {
      next.set('page', String(safeCurrentPage))
    }
    setSearchParams(next, { replace: true })
  }, [modeFilter, safeCurrentPage, searchText, setSearchParams, statusFilter])

  useEffect(() => {
    if (safeCurrentPage !== pagination.current) {
      setPagination(current => ({
        ...current,
        current: safeCurrentPage,
      }))
    }
  }, [pagination.current, safeCurrentPage])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination(current => ({
      ...current,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || PAGE_SIZE,
    }))
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setPagination(current => ({ ...current, current: 1 }))
  }

  const handleToggleVisibility = async (examId: string, checked: boolean) => {
    try {
      await examService.updateAdminExam(examId, { isVisible: checked })
      setAllExams(current =>
        current.map(exam =>
          exam.id === examId ? { ...exam, isVisible: checked } : exam
        )
      )
      notification.success({
        message: 'Success',
        description: `Exam is now ${checked ? 'visible' : 'hidden'}`,
        placement: 'topRight',
      })
    } catch (error: unknown) {
      notification.error({
        message: 'Error',
        description: extractApiErrorMessage(
          error,
          'Failed to update visibility'
        ),
        placement: 'topRight',
      })
    }
  }

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Are you sure you want to delete this exam?',
      content:
        'This action cannot be undone. Exams with existing participation cannot be removed.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await examService.deleteExam(id)
          setAllExams(current => current.filter(exam => exam.id !== id))
          notification.success({
            message: 'Success',
            description: 'Exam deleted successfully',
            placement: 'topRight',
          })
        } catch (error: unknown) {
          const err = error as {
            response?: { data?: { code?: string; message?: string } }
          }
          const isParticipationError =
            err.response?.data?.code === 'EXAM_HAS_PARTICIPATIONS' ||
            err.response?.data?.message?.includes('participated')

          notification.error({
            message: 'Cannot Delete Exam',
            description: isParticipationError
              ? 'This exam cannot be deleted because students have already participated in it. You can hide it instead.'
              : 'Failed to delete exam. Please try again later.',
            placement: 'topRight',
            duration: 5,
          })
        }
      },
    })
  }

  const handlePublish = async (examId: string) => {
    setPublishingExamId(examId)
    try {
      const publishedExam = await examService.publishAdminExam(examId)
      setAllExams(current =>
        current.map(exam =>
          exam.id === examId
            ? {
                ...exam,
                status: publishedExam.status,
                isVisible: publishedExam.isVisible,
              }
            : exam
        )
      )
      notification.success({
        message: 'Success',
        description: 'Exam published successfully',
        placement: 'topRight',
      })
    } catch (error: unknown) {
      notification.error({
        message: 'Error',
        description: extractApiErrorMessage(error, 'Failed to publish exam'),
        placement: 'topRight',
      })
    } finally {
      setPublishingExamId(null)
    }
  }

  const handleCancel = (exam: Exam) => {
    modal.confirm({
      title: 'Cancel this exam?',
      content:
        'This action cannot be undone. The exam will become unavailable immediately and cannot be published again.',
      okText: 'Cancel Exam',
      okType: 'danger',
      cancelText: 'Keep Exam',
      onOk: async () => {
        setCancellingExamId(exam.id)
        try {
          const cancelledExam = await examService.cancelAdminExam(exam.id)
          setAllExams(current =>
            current.map(item =>
              item.id === exam.id
                ? {
                    ...item,
                    status: cancelledExam.status,
                    isVisible: cancelledExam.isVisible,
                  }
                : item
            )
          )
          notification.success({
            message: 'Success',
            description: 'Exam cancelled successfully',
            placement: 'topRight',
          })
        } catch (error: unknown) {
          notification.error({
            message: 'Error',
            description: extractApiErrorMessage(error, 'Failed to cancel exam'),
            placement: 'topRight',
          })
        } finally {
          setCancellingExamId(null)
        }
      },
    })
  }

  const handleArchive = (exam: Exam) => {
    modal.confirm({
      title: 'Archive this exam?',
      content:
        'This action cannot be undone. Archived exams remain read-only for history and reporting.',
      okText: 'Archive Exam',
      okType: 'danger',
      cancelText: 'Keep Exam',
      onOk: async () => {
        setArchivingExamId(exam.id)
        try {
          const archivedExam = await examService.archiveAdminExam(exam.id)
          setAllExams(current =>
            current.map(item =>
              item.id === exam.id
                ? {
                    ...item,
                    status: archivedExam.status,
                    isVisible: archivedExam.isVisible,
                  }
                : item
            )
          )
          notification.success({
            message: 'Success',
            description: 'Exam archived successfully',
            placement: 'topRight',
          })
        } catch (error: unknown) {
          notification.error({
            message: 'Error',
            description: extractApiErrorMessage(
              error,
              'Failed to archive exam'
            ),
            placement: 'topRight',
          })
        } finally {
          setArchivingExamId(null)
        }
      },
    })
  }

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status?: Exam['status']) => {
        const resolvedStatus = status || 'draft'
        const color = statusColorMap[resolvedStatus] || statusColorMap.draft
        return (
          <span
            className="rounded px-2 py-1 text-xs font-semibold uppercase"
            style={{
              color,
              border: `1px solid ${color}`,
            }}
          >
            {resolvedStatus.replace('_', ' ')}
          </span>
        )
      },
    },
    {
      title: 'Access',
      dataIndex: 'accessMode',
      key: 'accessMode',
      render: (accessMode?: Exam['accessMode']) => {
        const resolvedMode = accessMode || 'open_registration'
        const color =
          accessColorMap[resolvedMode] || accessColorMap.open_registration
        return (
          <span
            className="rounded px-2 py-1 text-xs font-semibold uppercase"
            style={{
              color,
              border: `1px solid ${color}`,
            }}
          >
            {resolvedMode.replace('_', ' ')}
          </span>
        )
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Duration (min)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Visibility',
      dataIndex: 'isVisible',
      key: 'isVisible',
      render: (visible: boolean, record: Exam) => (
        <Switch
          checked={visible}
          disabled={(record.status || 'draft') !== 'published'}
          onChange={checked => {
            void handleToggleVisibility(record.id, checked)
          }}
          checkedChildren="Visible"
          unCheckedChildren="Hidden"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Exam) => (
        <Space size="middle" wrap>
          <Tooltip title="Manage Participants">
            <Button
              type="primary"
              ghost
              shape="circle"
              icon={<TeamOutlined />}
              aria-label={`Manage participants for ${record.title}`}
              onClick={() =>
                navigate(`/admin/exams/edit/${record.id}?step=participants`, {
                  state: { returnPage: safeCurrentPage },
                })
              }
            />
          </Tooltip>
          {canPublishExam(record) ? (
            <Tooltip title="Publish">
              <Button
                type="primary"
                ghost
                shape="circle"
                icon={<CheckCircleOutlined />}
                aria-label={`Publish exam ${record.title}`}
                loading={publishingExamId === record.id}
                disabled={publishingExamId !== null}
                onClick={() => {
                  void handlePublish(record.id)
                }}
              />
            </Tooltip>
          ) : null}
          {canCancelExam(record) ? (
            <Tooltip title="Cancel exam">
              <Button
                type="primary"
                danger
                ghost
                shape="circle"
                icon={<StopOutlined />}
                aria-label={`Cancel exam ${record.title}`}
                loading={cancellingExamId === record.id}
                disabled={
                  publishingExamId !== null ||
                  archivingExamId !== null ||
                  cancellingExamId !== null
                }
                onClick={() => {
                  handleCancel(record)
                }}
              />
            </Tooltip>
          ) : null}
          {canArchiveExam(record) ? (
            <Tooltip title="Archive exam">
              <Button
                type="primary"
                ghost
                shape="circle"
                icon={<InboxOutlined />}
                aria-label={`Archive exam ${record.title}`}
                loading={archivingExamId === record.id}
                disabled={
                  publishingExamId !== null ||
                  archivingExamId !== null ||
                  cancellingExamId !== null
                }
                onClick={() => {
                  handleArchive(record)
                }}
              />
            </Tooltip>
          ) : null}
          <Tooltip title="View Results">
            <Button
              type="primary"
              ghost
              shape="circle"
              icon={<EyeOutlined />}
              aria-label={`View results for ${record.title}`}
              onClick={() => navigate(`/admin/exams/${record.id}/results`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              ghost
              shape="circle"
              icon={<EditOutlined />}
              aria-label={`Edit ${record.title}`}
              onClick={() =>
                navigate(`/admin/exams/edit/${record.id}`, {
                  state: { returnPage: safeCurrentPage },
                })
              }
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              danger
              ghost
              shape="circle"
              icon={<DeleteOutlined />}
              aria-label={`Delete ${record.title}`}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div
      className="min-h-screen px-4 py-6 transition-colors duration-300 md:px-6"
      style={{
        backgroundColor: 'var(--admin-bg-primary)',
      }}
    >
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1
            className="whitespace-nowrap text-2xl font-bold transition-colors duration-300"
            style={{ color: 'var(--admin-text-primary)' }}
          >
            Exam Management
          </h1>
          <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
            <div className="w-full max-w-md flex-1">
              <Input.Search
                placeholder="Search by title..."
                allowClear
                onSearch={handleSearch}
                enterButton
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              style={{ width: 160 }}
              onChange={value => {
                setStatusFilter(value)
                setPagination(current => ({ ...current, current: 1 }))
              }}
              options={[
                { value: 'all', label: 'All status' },
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <Select
              value={modeFilter}
              style={{ width: 190 }}
              onChange={value => {
                setModeFilter(value)
                setPagination(current => ({ ...current, current: 1 }))
              }}
              options={[
                { value: 'all', label: 'All access modes' },
                { value: 'open_registration', label: 'Open registration' },
                { value: 'invite_only', label: 'Invite only' },
                { value: 'hybrid', label: 'Hybrid' },
              ]}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/exams/create')}
              size="large"
            >
              Create Exam
            </Button>
          </div>
        </div>

        <Card
          className="transition-colors duration-300"
          style={{
            backgroundColor: 'var(--admin-card-bg)',
            borderColor: 'var(--admin-card-border)',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
          }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={pagedExams}
            loading={loading}
            pagination={{
              current: safeCurrentPage,
              pageSize: pagination.pageSize,
              total: filteredExams.length,
            }}
            onChange={handleTableChange}
          />
        </Card>
      </div>
    </div>
  )
}

export default AdminExamList
