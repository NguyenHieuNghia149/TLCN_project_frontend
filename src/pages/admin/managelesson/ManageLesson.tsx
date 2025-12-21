import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Card,
  Space,
  Modal,
  Form,
  Input,
  Select,
  notification,
  Tooltip,
  Tag,
  Upload,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  adminLessonAPI,
  AdminLessonResponse,
} from '@/services/api/adminLesson.service'
import { apiClient } from '@/config/axios.config'
import { parseDocxToHtml, isValidDocxFile } from '@/utils/parseDocx'

interface ApiTopicData {
  id: string
  topicName: string
}

interface LessonItem {
  id: string
  title: string
  content?: string | null
  videoUrl?: string | null
  topicId: string
  topicName?: string | null
  createdAt: string
  updatedAt: string
}

const ManageLesson: React.FC = () => {
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editing, setEditing] = useState<LessonItem | null>(null)
  const [topics, setTopics] = useState<ApiTopicData[]>([])
  const [uploadingFile, setUploadingFile] = useState<boolean>(false)
  const [contentFromFile, setContentFromFile] = useState<string>('')
  const [form] = Form.useForm()
  const [notificationApi, contextHolder] = notification.useNotification()

  // Fetch topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await apiClient.get<{
          success: boolean
          data: ApiTopicData[]
        }>('/topics')
        const topicsData = (res.data?.data || []) as ApiTopicData[]
        setTopics(topicsData)
      } catch (error) {
        console.error('Failed to fetch topics:', error)
      }
    }
    fetchTopics()
  }, [])

  const fetchLessons = React.useCallback(
    async (page: number = 1, pageSize: number = 10, search?: string) => {
      setLoading(true)
      try {
        const result = await adminLessonAPI.listLessons({
          page,
          limit: pageSize,
          search: search || undefined,
        })
        const lessonData = result.data.data || []
        const items: LessonItem[] = lessonData.map(
          (l: AdminLessonResponse) => ({
            id: l.id,
            title: l.title,
            content: l.content,
            videoUrl: l.videoUrl,
            topicId: l.topicId,
            topicName: l.topicName,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
          })
        )
        setLessons(items)
        setPagination({
          current: page,
          pageSize: pageSize,
          total: result.data.pagination.total,
        })
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        notificationApi.error({
          message: 'Error',
          description:
            err?.response?.data?.message || 'Failed to fetch lessons',
          placement: 'topRight',
        })
      } finally {
        setLoading(false)
      }
    },
    [notificationApi]
  )

  useEffect(() => {
    fetchLessons(pagination.current, pagination.pageSize, searchText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 10
    fetchLessons(newPage, newPageSize, searchText)
  }

  const onSearch = (value: string) => {
    setSearchText(value)
    fetchLessons(1, pagination.pageSize, value)
  }

  const onCreate = () => {
    setEditing(null)
    form.resetFields()
    setContentFromFile('')
    setShowForm(true)
  }

  const onEdit = (lesson: LessonItem) => {
    setEditing(lesson)
    form.setFieldsValue({
      title: lesson.title,
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      topicId: lesson.topicId,
    })
    setContentFromFile('')
    setShowForm(true)
  }

  const onDelete = (lesson: LessonItem) => {
    Modal.confirm({
      title: `Delete lesson "${lesson.title}"?`,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await adminLessonAPI.deleteLesson(lesson.id)
          notificationApi.success({
            message: 'Success',
            description: 'Lesson deleted successfully',
            placement: 'topRight',
          })
          fetchLessons(pagination.current, pagination.pageSize, searchText)
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } }
          notificationApi.error({
            message: 'Error',
            description:
              err.response?.data?.message || 'Failed to delete lesson',
            placement: 'topRight',
          })
        }
      },
    })
  }

  const handleWordFileUpload = async (file: File) => {
    if (!isValidDocxFile(file)) {
      notificationApi.error({
        message: 'Invalid File',
        description: 'Please select a valid .docx file',
        placement: 'topRight',
      })
      return false
    }

    setUploadingFile(true)
    try {
      const { html, error } = await parseDocxToHtml(file)

      if (error) {
        notificationApi.error({
          message: 'Error',
          description: error,
          placement: 'topRight',
        })
        return false
      }

      if (html) {
        setContentFromFile(html)
        form.setFieldsValue({ content: html })
        notificationApi.success({
          message: 'Success',
          description: `Content from "${file.name}" loaded successfully`,
          placement: 'topRight',
        })
      } else {
        notificationApi.error({
          message: 'Error',
          description: 'Unable to extract content from file',
          placement: 'topRight',
        })
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error processing file'
      notificationApi.error({
        message: 'Error',
        description: errorMessage,
        placement: 'topRight',
      })
    } finally {
      setUploadingFile(false)
    }
    return false // Prevent default upload behavior
  }

  const handleFormSubmit = async (values: {
    title: string
    content: string
    videoUrl?: string
    topicId: string
  }) => {
    if (!values.content || !values.content.trim()) {
      notificationApi.error({
        message: 'Validation Error',
        description: 'Content is required',
        placement: 'topRight',
      })
      return
    }

    try {
      const payload = {
        title: values.title,
        content: values.content,
        videoUrl: values.videoUrl || undefined,
        topicId: values.topicId,
      }

      if (editing) {
        await adminLessonAPI.updateLesson(editing.id, payload)
        notificationApi.success({
          message: 'Success',
          description: 'Lesson updated successfully',
          placement: 'topRight',
        })
      } else {
        await adminLessonAPI.createLesson(payload)
        notificationApi.success({
          message: 'Success',
          description: 'Lesson created successfully',
          placement: 'topRight',
        })
      }

      setShowForm(false)
      setEditing(null)
      setContentFromFile('')
      form.resetFields()
      fetchLessons(pagination.current, pagination.pageSize, searchText)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      notificationApi.error({
        message: 'Error',
        description: err.response?.data?.message || 'Failed to save lesson',
        placement: 'topRight',
      })
    }
  }

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Topic',
      dataIndex: 'topicName',
      key: 'topicName',
      render: (text: string) => <Tag color="blue">{text || 'N/A'}</Tag>,
    },
    {
      title: 'Content Preview',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => {
        if (!text) return '-'
        const plainText = text.replace(/<[^>]*>/g, '')
        return plainText.substring(0, 50) + (plainText.length > 50 ? '...' : '')
      },
    },
    {
      title: 'Video URL',
      dataIndex: 'videoUrl',
      key: 'videoUrl',
      render: (url: string) =>
        url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: LessonItem) => (
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
              onClick={() => onDelete(record)}
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
          <BookOutlined className="mr-2" />
          Manage Lessons
        </h1>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="w-full max-w-md">
            <Input.Search
              placeholder="Search by title, content, topic..."
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
            New Lesson
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
          dataSource={lessons}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editing ? 'Edit Lesson' : 'Create Lesson'}
        open={showForm}
        onCancel={() => {
          setShowForm(false)
          setEditing(null)
          setContentFromFile('')
          form.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter lesson title' }]}
          >
            <Input placeholder="Enter lesson title" />
          </Form.Item>

          <Form.Item
            name="topicId"
            label="Topic"
            rules={[{ required: true, message: 'Please select a topic' }]}
          >
            <Select placeholder="Select a topic">
              {topics.map(t => (
                <Select.Option key={t.id} value={t.id}>
                  {t.topicName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Content">
            <div className="mb-2">
              <Upload
                beforeUpload={file => {
                  handleWordFileUpload(file)
                  return false
                }}
                maxCount={1}
                accept=".docx,.doc"
                showUploadList={false}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={uploadingFile}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? 'Uploading...' : 'Upload Word File (.docx)'}
                </Button>
              </Upload>
              {contentFromFile && (
                <Tag color="green" className="mt-2">
                  ✓ Content loaded from file
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setContentFromFile('')
                      form.setFieldsValue({ content: '' })
                    }}
                  >
                    Clear
                  </Button>
                </Tag>
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <Input.TextArea
              rows={8}
              placeholder="Enter lesson content or upload Word file"
            />
          </Form.Item>

          <Form.Item name="videoUrl" label="Video URL">
            <Input type="url" placeholder="https://example.com/video.mp4" />
          </Form.Item>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              onClick={() => {
                setShowForm(false)
                setEditing(null)
                setContentFromFile('')
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
    </div>
  )
}

export default ManageLesson
