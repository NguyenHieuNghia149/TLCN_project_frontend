import React, { useEffect, useState, useCallback } from 'react'

import {
  Table,
  Space,
  Tag,
  Typography,
  Card,
  Pagination,
  Button,
  App as AntdApp,
  Modal,
  Descriptions,
  Divider,
  List,
} from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { submissionsService } from '@/services/api/submissions.service'
import { SubmissionDetail } from '@/types/submission.types'

const { Title } = Typography

const UserSubmissionsPage: React.FC = () => {
  const { message } = AntdApp.useApp()
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionDetail | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const pageSize = 10

  const fetchSubmissions = useCallback(
    async (page: number) => {
      setLoading(true)
      try {
        const offset = (page - 1) * pageSize
        const result = await submissionsService.getUserSubmissions({
          limit: pageSize,
          offset,
        })
        setSubmissions(result.submissions)
        setTotal(result.total)
      } catch (error) {
        message.error('Failed to fetch submissions')
        console.error(error)
      } finally {
        setLoading(false)
      }
    },
    [message, pageSize]
  )

  useEffect(() => {
    fetchSubmissions(currentPage)
  }, [currentPage, fetchSubmissions])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleView = (record: SubmissionDetail) => {
    setSelectedSubmission(record)
    setIsModalVisible(true)
  }

  const closeModal = () => {
    setIsModalVisible(false)
    setSelectedSubmission(null)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
        return 'success'
      case 'WRONG_ANSWER':
        return 'error'
      case 'RUNTIME_ERROR':
        return 'magenta'
      case 'COMPILATION_ERROR':
        return 'purple'
      case 'TIME_LIMIT_EXCEEDED':
        return 'warning'
      case 'MEMORY_LIMIT_EXCEEDED':
        return 'geekblue'
      case 'PENDING':
      case 'RUNNING':
        return 'processing'
      default:
        return 'default'
    }
  }

  const columns = [
    {
      title: 'Problem',
      key: 'problem',
      render: (_: unknown, record: SubmissionDetail) => (
        <span style={{ fontWeight: 500 }}>
          {record.problemTitle || record.problemId}
        </span>
      ),
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <span>{score !== undefined ? score : '-'}</span>
      ),
    },
    {
      title: 'Submitted At',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: SubmissionDetail) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ padding: '24px' }}>
        <Card>
          <div
            style={{
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Title level={2} style={{ margin: 0 }}>
              My Submissions
            </Title>
            <Button
              onClick={() => fetchSubmissions(currentPage)}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={submissions}
            rowKey="submissionId"
            loading={loading}
            pagination={false}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </Card>

        <Modal
          title={<Title level={4}>Submission Details</Title>}
          open={isModalVisible}
          onCancel={closeModal}
          footer={[
            <Button key="close" onClick={closeModal}>
              Close
            </Button>,
          ]}
          width={800}
        >
          {selectedSubmission && (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Problem">
                  {selectedSubmission.problemTitle ||
                    selectedSubmission.problemId}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedSubmission.status)}>
                    {selectedSubmission.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Language">
                  <Tag>{selectedSubmission.language}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Score">
                  {selectedSubmission.score ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Execution Time">
                  {selectedSubmission.executionTime
                    ? `${selectedSubmission.executionTime} ms`
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Submitted At">
                  {new Date(selectedSubmission.submittedAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Source Code</Divider>
              <div
                style={{
                  backgroundColor: '#1e1e1e',
                  padding: '12px',
                  borderRadius: '8px',
                  color: '#d4d4d4',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                }}
              >
                {selectedSubmission.sourceCode || '// No source code available'}
              </div>

              {selectedSubmission.result?.results && (
                <>
                  <Divider orientation="left">Test Cases</Divider>
                  <List
                    size="small"
                    bordered
                    dataSource={selectedSubmission.result.results}
                    renderItem={(item, index) => (
                      <List.Item>
                        <div style={{ width: '100%' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 4,
                            }}
                          >
                            <strong>Case #{index + 1}</strong>
                            <Tag color={item.ok ? 'success' : 'error'}>
                              {item.ok ? 'Passed' : 'Failed'}
                            </Tag>
                          </div>
                          {!item.ok && (
                            <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
                              <div>Expected: {item.expectedOutput}</div>
                              <div>Actual: {item.actualOutput}</div>
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                </>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

export default UserSubmissionsPage
