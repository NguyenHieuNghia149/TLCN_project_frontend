import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Card,
  Space,
  Modal,
  Form,
  Input,
  notification,
  Tooltip,
  Tag,
  Alert,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import adminTopicAPI, {
  AdminTopicResponse,
} from '@/services/api/adminTopic.service'

interface TopicItem {
  id: string
  topicName: string
  createdAt?: string
  updatedAt?: string
}

const ManageTopic: React.FC = () => {
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editing, setEditing] = useState<TopicItem | null>(null)
  const [topicStats, setTopicStats] = useState<{
    [key: string]: { totalLessons: number; totalProblems: number }
  }>({})
  const [deleteVerifyModal, setDeleteVerifyModal] = useState<TopicItem | null>(
    null
  )
  const [verifyInput, setVerifyInput] = useState<string>('')

  const [form] = Form.useForm()
  const [notificationApi, contextHolder] = notification.useNotification()

  const fetchTopics = React.useCallback(
    async (page: number = 1, pageSize: number = 10, search?: string) => {
      setLoading(true)
      try {
        const result = await adminTopicAPI.listTopics({
          page,
          limit: pageSize,
          search: search || undefined,
        })
        const topicData = result.data.data || []
        const items: TopicItem[] = topicData.map((t: AdminTopicResponse) => ({
          id: t.id,
          topicName: t.topicName,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))

        setTopics(items)
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.data.pagination.total,
        })

        // Fetch stats for each topic
        const stats: typeof topicStats = {}
        for (const item of items) {
          try {
            const statsResult = await adminTopicAPI.getTopicStats(item.id)
            stats[item.id] = {
              totalLessons: statsResult.data.totalLessons,
              totalProblems: statsResult.data.totalProblems,
            }
          } catch (err) {
            console.error(`Failed to fetch stats for topic ${item.id}:`, err)
          }
        }
        setTopicStats(stats)
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        notificationApi.error({
          message: 'Error',
          description: err?.response?.data?.message || 'Failed to fetch topics',
          placement: 'topRight',
        })
      } finally {
        setLoading(false)
      }
    },
    [notificationApi]
  )

  useEffect(() => {
    fetchTopics(pagination.current, pagination.pageSize, searchText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 10
    fetchTopics(newPage, newPageSize, searchText)
  }

  const onSearch = (value: string) => {
    setSearchText(value)
    fetchTopics(1, pagination.pageSize, value)
  }

  const onCreate = () => {
    setEditing(null)
    form.resetFields()
    setShowForm(true)
  }

  const onEdit = (topic: TopicItem) => {
    setEditing(topic)
    form.setFieldsValue({
      topicName: topic.topicName,
    })
    setShowForm(true)
  }

  const onDeleteClick = (topic: TopicItem) => {
    const stats = topicStats[topic.id]
    const hasContent =
      stats && (stats.totalLessons > 0 || stats.totalProblems > 0)

    if (hasContent) {
      // Show verification modal for topics with content
      setDeleteVerifyModal(topic)
      setVerifyInput('')
    } else {
      // Direct delete for empty topics
      Modal.confirm({
        title: `Delete topic "${topic.topicName}"?`,
        content: 'This action cannot be undone.',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: () => handleDelete(topic.id),
      })
    }
  }

  const handleDelete = async (topicId: string) => {
    try {
      await adminTopicAPI.deleteTopic(topicId)
      notificationApi.success({
        message: 'Success',
        description: 'Topic deleted successfully',
        placement: 'topRight',
      })
      fetchTopics(pagination.current, pagination.pageSize, searchText)
      setDeleteVerifyModal(null)
      setVerifyInput('')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      notificationApi.error({
        message: 'Error',
        description: err.response?.data?.message || 'Failed to delete topic',
        placement: 'topRight',
      })
    }
  }

  const handleVerifiedDelete = () => {
    if (!deleteVerifyModal) return

    if (verifyInput !== deleteVerifyModal.topicName) {
      notificationApi.error({
        message: 'Verification Failed',
        description: 'Topic name does not match. Please check again.',
        placement: 'topRight',
      })
      return
    }

    handleDelete(deleteVerifyModal.id)
  }

  const handleFormSubmit = async (values: { topicName: string }) => {
    try {
      if (editing) {
        await adminTopicAPI.updateTopic(editing.id, {
          topicName: values.topicName,
        })
        notificationApi.success({
          message: 'Success',
          description: 'Topic updated successfully',
          placement: 'topRight',
        })
      } else {
        await adminTopicAPI.createTopic({
          topicName: values.topicName,
        })
        notificationApi.success({
          message: 'Success',
          description: 'Topic created successfully',
          placement: 'topRight',
        })
      }

      setShowForm(false)
      setEditing(null)
      form.resetFields()
      fetchTopics(pagination.current, pagination.pageSize, searchText)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      notificationApi.error({
        message: 'Error',
        description: err.response?.data?.message || 'Failed to save topic',
        placement: 'topRight',
      })
    }
  }

  const columns = [
    {
      title: 'Topic Name',
      dataIndex: 'topicName',
      key: 'topicName',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Lessons',
      key: 'lessons',
      render: (_: unknown, record: TopicItem) => (
        <Tag color="blue">{topicStats[record.id]?.totalLessons || 0}</Tag>
      ),
    },
    {
      title: 'Problems',
      key: 'problems',
      render: (_: unknown, record: TopicItem) => (
        <Tag color="green">{topicStats[record.id]?.totalProblems || 0}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: TopicItem) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <Button
              type="primary"
              ghost
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="primary"
              danger
              ghost
              shape="circle"
              icon={<DeleteOutlined />}
              onClick={() => onDeleteClick(record)}
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
        backgroundColor: 'var(--background-color)',
      }}
    >
      {contextHolder}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1
          className="whitespace-nowrap text-2xl font-bold transition-colors duration-300"
          style={{ color: 'var(--text-color)' }}
        >
          <FileTextOutlined className="mr-2" />
          Manage Topics
        </h1>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="w-full max-w-md">
            <Input.Search
              placeholder="Search topics..."
              allowClear
              onSearch={onSearch}
              enterButton
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
            size="large"
          >
            New Topic
          </Button>
        </div>
      </div>

      <Card
        className="transition-colors duration-300"
        style={{
          backgroundColor: 'var(--card-color)',
          borderColor: 'var(--surface-border)',
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={topics}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? 'Edit Topic' : 'Add New Topic'}
        open={showForm}
        onCancel={() => {
          setShowForm(false)
          setEditing(null)
          form.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="topicName"
            label="Topic Name"
            rules={[{ required: true, message: 'Please enter topic name' }]}
          >
            <Input placeholder="Enter topic name" />
          </Form.Item>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              onClick={() => {
                setShowForm(false)
                setEditing(null)
                form.resetFields()
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Delete Verification Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Confirm Delete</span>
          </div>
        }
        open={!!deleteVerifyModal}
        onCancel={() => {
          setDeleteVerifyModal(null)
          setVerifyInput('')
        }}
        footer={null}
        width={550}
      >
        {deleteVerifyModal && (
          <>
            <Alert
              message="Warning"
              description={`This action will delete all lessons and problems in topic "${deleteVerifyModal.topicName}". This cannot be undone!`}
              type="warning"
              showIcon
              className="mb-4"
            />

            <p className="mb-3">
              To confirm deleting the topic{' '}
              <strong>"{deleteVerifyModal.topicName}"</strong>, please enter the
              topic name below:
            </p>

            <Input
              value={verifyInput}
              onChange={e => setVerifyInput(e.target.value)}
              placeholder={`Enter "${deleteVerifyModal.topicName}"`}
              autoFocus
            />

            {verifyInput && (
              <div className="mt-2">
                {verifyInput === deleteVerifyModal.topicName ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    Topic name matches ✓
                  </Tag>
                ) : (
                  <Tag icon={<ExclamationCircleOutlined />} color="error">
                    Topic name does not match
                  </Tag>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
              <Button
                onClick={() => {
                  setDeleteVerifyModal(null)
                  setVerifyInput('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                onClick={handleVerifiedDelete}
                disabled={verifyInput !== deleteVerifyModal.topicName}
              >
                Delete Topic
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

export default ManageTopic
