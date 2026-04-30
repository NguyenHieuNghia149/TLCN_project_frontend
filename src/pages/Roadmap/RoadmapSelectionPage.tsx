import React, { useEffect, useState } from 'react'
import { App, Button, Card, Empty, Input, Space, Spin, Tag } from 'antd'
import { CheckOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { AdminRoadmapRow } from '@/services/api/adminRoadmap.service'
import { adminRoadmapAPI } from '@/services/api/adminRoadmap.service'
import { apiClient } from '@/config/axios.config'

interface UserRoadmapSelection {
  id: string
  userId: string
  roadmapId: string
  selectedAt: string
  startedAt: string | null
  completedAt: string | null
}

const RoadmapSelectionPage: React.FC = () => {
  const { notification } = App.useApp()
  const [roadmaps, setRoadmaps] = useState<AdminRoadmapRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(
    null
  )
  const [userSelection, setUserSelection] =
    useState<UserRoadmapSelection | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    loadRoadmaps()
    loadUserSelection()
  }, [])

  const loadRoadmaps = async () => {
    try {
      setLoading(true)
      const response = await adminRoadmapAPI.listRoadmaps({
        limit: 50,
        offset: 0,
        visibility: 'public',
      })
      setRoadmaps(response.data.roadmaps)
    } catch {
      notification.error({
        message: 'Error',
        description: 'Failed to load roadmaps',
        placement: 'topRight',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUserSelection = async () => {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: UserRoadmapSelection | null
      }>('/user/roadmap-selection')
      if (response.data.success && response.data.data) {
        setUserSelection(response.data.data)
        setSelectedRoadmapId(response.data.data.roadmapId)
      }
    } catch {
      // Ignore error - user may not have selection yet
    }
  }

  const handleSelectRoadmap = async (roadmapId: string) => {
    try {
      const response = await apiClient.post<{
        success: boolean
        data: UserRoadmapSelection
      }>('/user/roadmap-selection', { roadmapId })

      if (response.data.success) {
        setUserSelection(response.data.data)
        setSelectedRoadmapId(roadmapId)
        notification.success({
          message: 'Success',
          description:
            'Roadmap selected successfully! It has been added to your learning path.',
          placement: 'topRight',
        })
      }
    } catch {
      notification.error({
        message: 'Error',
        description: String(
          err?.response?.data?.message || 'Failed to select roadmap'
        ),
        placement: 'topRight',
      })
    }
  }

  const filteredRoadmaps = roadmaps.filter(
    r =>
      r.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--background-color)' }}
    >
      <div className="mx-auto max-w-6xl">
        <h1
          className="mb-6 text-3xl font-bold"
          style={{ color: 'var(--text-color)' }}
        >
          Choose Your Learning Path
        </h1>

        {userSelection && (
          <Card
            className="mb-6"
            style={{
              backgroundColor: 'var(--card-color)',
              borderColor: 'var(--surface-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  Currently selected roadmap:
                </p>
                <p className="text-lg font-semibold">
                  {roadmaps.find(r => r.id === userSelection.roadmapId)?.title}
                </p>
              </div>
              <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
            </div>
          </Card>
        )}

        <div className="mb-6">
          <Input
            size="large"
            placeholder="Search roadmaps by title or description..."
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ maxWidth: 500 }}
          />
        </div>

        <Spin spinning={loading}>
          {filteredRoadmaps.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRoadmaps.map(roadmap => (
                <Card
                  key={roadmap.id}
                  className="transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--card-color)',
                    borderColor:
                      selectedRoadmapId === roadmap.id
                        ? 'var(--primary-color)'
                        : 'var(--surface-border)',
                    borderWidth: selectedRoadmapId === roadmap.id ? 2 : 1,
                  }}
                  hoverable
                >
                  <div className="mb-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="flex-1 text-lg font-bold">
                        {roadmap.title}
                      </h3>
                      {selectedRoadmapId === roadmap.id && (
                        <CheckOutlined
                          style={{ color: '#1890ff', fontSize: 18 }}
                        />
                      )}
                    </div>
                    <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                      {roadmap.description || 'No description'}
                    </p>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Items</span>
                      <Tag color="blue">{roadmap.itemCount}</Tag>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Visibility</span>
                      <Tag color="green">PUBLIC</Tag>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Created</span>
                      <span className="text-xs text-slate-600">
                        {new Date(roadmap.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Space style={{ width: '100%' }} direction="vertical">
                    <Button
                      type={
                        selectedRoadmapId === roadmap.id ? 'primary' : 'default'
                      }
                      block
                      onClick={() => handleSelectRoadmap(roadmap.id)}
                      icon={
                        selectedRoadmapId === roadmap.id ? (
                          <CheckOutlined />
                        ) : undefined
                      }
                    >
                      {selectedRoadmapId === roadmap.id
                        ? 'Selected'
                        : 'Select Roadmap'}
                    </Button>
                    <Button block type="dashed" ghost>
                      View Details
                    </Button>
                  </Space>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              description={
                searchKeyword
                  ? 'No roadmaps found'
                  : 'No public roadmaps available'
              }
            />
          )}
        </Spin>
      </div>
    </div>
  )
}

export default RoadmapSelectionPage
