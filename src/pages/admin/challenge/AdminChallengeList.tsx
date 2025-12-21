import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Card,
  Tag,
  Space,
  Modal,
  notification,
  Tooltip,
  Input,
} from 'antd'
import type { TablePaginationConfig } from 'antd'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { challengeService } from '@/services/api/challenge.service'
import { ChallengeItem } from '@/types/challenge.types'

const AdminChallengeList: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [notificationApi, contextHolder] = notification.useNotification()

  const notificationShownRef = React.useRef(false)

  useEffect(() => {
    if (location.state?.successMessage && !notificationShownRef.current) {
      notificationApi.success({
        message: 'Success',
        description: location.state.successMessage,
        placement: 'topRight',
      })
      notificationShownRef.current = true
      // Clear state to prevent showing again on refresh (replace history)
      window.history.replaceState({}, document.title)
    }
  }, [location.state, notificationApi])
  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(
    undefined
  )

  const fetchChallenges = React.useCallback(
    async (
      page: number = 1,
      pageSize: number = 10,
      search?: string,
      sField?: string,
      sOrder?: 'asc' | 'desc'
    ) => {
      setLoading(true)
      try {
        const response = await challengeService.getAllChallenges(
          page,
          pageSize,
          search,
          sField,
          sOrder
        )
        setChallenges(response.items)
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.total,
        })
      } catch {
        notificationApi.error({
          message: 'Error',
          description: 'Failed to load challenges',
          placement: 'topRight',
        })
      } finally {
        setLoading(false)
      }
    },
    [notificationApi]
  )

  useEffect(() => {
    fetchChallenges(1, 10)
  }, [fetchChallenges])

  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<ChallengeItem> | SorterResult<ChallengeItem>[]
  ) => {
    const sortResult = Array.isArray(sorter) ? sorter[0] : sorter
    const field = sortResult.field as string | undefined
    const order =
      sortResult.order === 'ascend'
        ? 'asc'
        : sortResult.order === 'descend'
          ? 'desc'
          : undefined

    setSortField(field)
    setSortOrder(order)

    fetchChallenges(
      newPagination.current || 1,
      newPagination.pageSize || 10,
      searchText,
      field,
      order
    )
  }

  const onSearch = (value: string) => {
    setSearchText(value)
    fetchChallenges(1, pagination.pageSize, value, sortField, sortOrder)
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this challenge?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await challengeService.deleteChallenge(id)
          notificationApi.success({
            message: 'Success',
            description: 'Challenge deleted successfully',
            placement: 'topRight',
          })
          fetchChallenges(pagination.current, pagination.pageSize)
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } }
          notificationApi.error({
            message: 'Error',
            description:
              err.response?.data?.message || 'Failed to delete challenge',
            placement: 'topRight',
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
      sorter: true,
    },
    {
      title: 'Topic',
      dataIndex: 'topicName',
      key: 'topicName',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      sorter: true,
      render: (difficulty: string) => {
        let color = 'green'
        if (difficulty === 'medium') color = 'orange'
        if (difficulty === 'hard') color = 'red'
        return <Tag color={color}>{difficulty.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Visibility',
      dataIndex: 'visibility',
      key: 'visibility',
      sorter: true,
      render: (visibility: string) => (
        <Tag color={visibility === 'public' ? 'blue' : 'default'}>
          {visibility ? visibility.toUpperCase() : 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ChallengeItem) => (
        <Space size="middle">
          <Tooltip title="View/Edit">
            <Button
              type="primary"
              ghost
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/challenges/edit/${record.id}`)}
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
    <div className="p-6">
      {contextHolder}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="whitespace-nowrap text-2xl font-bold">
          Challenge Management
        </h1>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="w-full max-w-md">
            <Input.Search
              placeholder="Search by title..."
              allowClear
              onSearch={onSearch}
              enterButton
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/challenges/create')}
          >
            Create Challenge
          </Button>
        </div>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={challenges}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}

export default AdminChallengeList
