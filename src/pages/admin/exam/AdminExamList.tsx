import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Card,
  Switch,
  Space,
  Modal,
  notification,
  Tooltip,
  Input,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { examService } from '@/services/api/exam.service'
import { Exam } from '@/types/exam.types'

const AdminExamList: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [exams, setExams] = useState<Exam[]>([])
  const [pagination, setPagination] = useState({
    current: parseInt(searchParams.get('page') || '1', 10),
    pageSize: 10,
    total: 0,
  })
  const [searchText, setSearchText] = useState('')

  const [notificationApi, contextHolder] = notification.useNotification()

  const fetchExams = React.useCallback(
    async (page: number = 1, pageSize: number = 10, search?: string) => {
      setLoading(true)
      try {
        const response = await examService.getExams(
          pageSize,
          (page - 1) * pageSize,
          search
        )
        setExams(response.data)
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.total,
        })
      } catch {
        notificationApi.error({
          message: 'Error',
          description: 'Failed to load exams',
          placement: 'topRight',
        })
      } finally {
        setLoading(false)
      }
    },
    [notificationApi]
  )

  useEffect(() => {
    fetchExams(pagination.current, pagination.pageSize, searchText)
  }, [])

  // Automatically sync pagination to URL
  useEffect(() => {
    if (pagination.current !== 1) {
      setSearchParams(
        { page: pagination.current.toString() },
        { replace: true }
      )
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [pagination.current, setSearchParams])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 10

    fetchExams(newPage, newPageSize, searchText)
  }

  const onSearch = (value: string) => {
    setSearchText(value)
    fetchExams(1, pagination.pageSize, value)
  }

  const handleToggleVisibility = async (examId: string, checked: boolean) => {
    try {
      await examService.updateExam(examId, { isVisible: checked })
      notificationApi.success({
        message: 'Success',
        description: `Exam is now ${checked ? 'visible' : 'hidden'}`,
        placement: 'topRight',
      })
      // Update local state to reflect change immediately without full reload if desired,
      // or just let the switch state be controlled/uncontrolled.
      // For optimisitc UI or valid feedback, mapping usually helps:
      setExams(prev =>
        prev.map(exam =>
          exam.id === examId ? { ...exam, isVisible: checked } : exam
        )
      )
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      notificationApi.error({
        message: 'Error',
        description:
          err.response?.data?.message || 'Failed to update visibility',
        placement: 'topRight',
      })
      // Revert switch if needed, but since we update state on success, if we don't update on failure it might be "stuck" visually if uncontrolled.
      // Best to use Controlled state which we are doing via setExams.
    }
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this exam?',
      content:
        'This action cannot be undone. All related participations will be deleted.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await examService.deleteExam(id)
          notificationApi.success({
            message: 'Success',
            description: 'Exam deleted successfully',
            placement: 'topRight',
          })
          fetchExams(pagination.current, pagination.pageSize)
        } catch (error: unknown) {
          const err = error as {
            response?: { data?: { code?: string; message?: string } }
          }
          const isParticipationError =
            err.response?.data?.code === 'EXAM_HAS_PARTICIPATIONS' ||
            err.response?.data?.message?.includes('participated')

          notificationApi.error({
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

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
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
          onChange={checked => handleToggleVisibility(record.id, checked)}
          checkedChildren="Visible"
          unCheckedChildren="Hidden"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Exam) => (
        <Space size="middle">
          <Tooltip title="View Results">
            <Button
              type="primary"
              ghost
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/exam/${record.id}/results/manage`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              ghost
              shape="circle"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/admin/exams/edit/${record.id}`, {
                  state: { returnPage: pagination.current },
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
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div
      className="min-h-screen p-6 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--admin-bg-primary)',
      }}
    >
      {contextHolder}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1
          className="whitespace-nowrap text-2xl font-bold transition-colors duration-300"
          style={{ color: 'var(--admin-text-primary)' }}
        >
          Exam Management
        </h1>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="w-full max-w-md">
            <Input.Search
              placeholder="Search by title..."
              allowClear
              onSearch={onSearch}
              enterButton
              value={searchText}
            />
          </div>
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
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={exams}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}

export default AdminExamList
