import React, { useEffect, useState } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  InputNumber,
  Switch,
  DatePicker, // Keep if still needed or remove if fully successfully replaced. Actually, let's keep it for now but I will check if I can fully replace.
  notification,
  Divider,
  List,
  Modal,
  Tag,
  Dropdown,
  type MenuProps,
} from 'antd'
import {
  PlusOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { examService } from '@/services/api/exam.service'
import { CreateExamPayload } from '@/types/exam.types'
import { challengeService } from '@/services/api/challenge.service'
import { ChallengeItem } from '@/types/challenge.types'
import dayjs from 'dayjs'

const AdminCreateExam: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const returnPage = location.state?.returnPage
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // Challenge Selection State
  const [selectedChallenges, setSelectedChallenges] = useState<ChallengeItem[]>(
    []
  )
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [allChallenges, setAllChallenges] = useState<ChallengeItem[]>([])
  const [challengeSearch, setChallengeSearch] = useState('')

  const [notificationApi, contextHolder] = notification.useNotification()

  useEffect(() => {
    if (id) {
      fetchExam(id)
    }
  }, [id])

  // Form Values Type
  interface ExamFormValues {
    title: string
    password?: string
    duration: number
    startDate: dayjs.Dayjs
    endDate: dayjs.Dayjs
    isVisible: boolean
    maxAttempts: number
  }

  const fetchExam = React.useCallback(
    async (examId: string) => {
      setLoading(true)
      try {
        const data = await examService.getExamById(examId)
        form.setFieldsValue({
          ...data,
          startDate: dayjs(data.startDate),
          endDate: dayjs(data.endDate),
        })
        if (data.challenges) {
          setSelectedChallenges(data.challenges)
        }
      } catch {
        notificationApi.error({
          message: 'Error',
          description: 'Failed to load exam',
          placement: 'topRight',
        })
      } finally {
        setLoading(false)
      }
    },
    [form, notificationApi]
  )

  useEffect(() => {
    if (id) {
      fetchExam(id)
    }
  }, [id, fetchExam])

  const fetchChallengesForSelection = async (search?: string) => {
    try {
      // Fetch available challenges (first page, maybe increase size or implement proper search)
      const res = await challengeService.getAllChallenges(1, 100, search)
      setAllChallenges(res.items)
    } catch {
      notificationApi.error({
        message: 'Error',
        description: 'Failed to load challenges list',
        placement: 'topRight',
      })
    }
  }

  const handleOpenChallengeModal = () => {
    fetchChallengesForSelection()
    setIsModalVisible(true)
  }

  const handleAddChallenge = (challenge: ChallengeItem) => {
    if (selectedChallenges.some(c => c.id === challenge.id)) {
      notificationApi.warning({
        message: 'Warning',
        description: 'Challenge already added',
        placement: 'topRight',
      })
      return
    }
    setSelectedChallenges([...selectedChallenges, challenge])
    notificationApi.success({
      message: 'Success',
      description: 'Challenge added',
      placement: 'topRight',
    })
  }

  const handleRemoveChallenge = (challengeId: string) => {
    setSelectedChallenges(selectedChallenges.filter(c => c.id !== challengeId))
  }

  const handleUpdateVisibility = async (
    challengeId: string,
    newVisibility: string
  ) => {
    try {
      await challengeService.updateChallenge(challengeId, {
        visibility: newVisibility,
      })
      notificationApi.success({
        message: 'Success',
        description: `Challenge visibility set to ${newVisibility.replace('_', ' ')}`,
        placement: 'topRight',
      })

      // Update local state
      const updateChallengeState = (list: ChallengeItem[]) =>
        list.map(c =>
          c.id === challengeId ? { ...c, visibility: newVisibility } : c
        )

      setSelectedChallenges(prev => updateChallengeState(prev))
      setAllChallenges(prev => updateChallengeState(prev))
    } catch {
      notificationApi.error({
        message: 'Error',
        description: 'Failed to update challenge visibility',
        placement: 'topRight',
      })
    }
  }

  const getVisibilityItems = (challengeId: string): MenuProps['items'] => [
    {
      key: 'public',
      label: 'Public',
      onClick: () => handleUpdateVisibility(challengeId, 'public'),
    },
    {
      key: 'exam_only',
      label: 'Exam Only',
      onClick: () => handleUpdateVisibility(challengeId, 'exam_only'),
    },
    {
      key: 'private',
      label: 'Private',
      onClick: () => handleUpdateVisibility(challengeId, 'private'),
    },
  ]

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'blue'
      case 'exam_only':
        return 'red'
      case 'private':
        return 'default'
      default:
        return 'default'
    }
  }

  const onFinish = async (values: ExamFormValues) => {
    setLoading(true)
    try {
      const payload: CreateExamPayload = {
        title: values.title,
        password: values.password,
        duration: values.duration,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        isVisible: values.isVisible,
        maxAttempts: values.maxAttempts,
        challenges: selectedChallenges.map((c, index) => ({
          type: 'existing',
          challengeId: c.id,
          orderIndex: index,
        })),
      }

      if (id) {
        await examService.updateExam(id, payload)
        notificationApi.success({
          message: 'Success',
          description: 'Exam updated successfully',
          placement: 'topRight',
        })
      } else {
        await examService.createExam(payload)
        notificationApi.success({
          message: 'Success',
          description: 'Exam created successfully',
          placement: 'topRight',
        })
      }
      // Delay navigation to let user see the notification
      setTimeout(() => {
        navigate(
          returnPage ? `/admin/exams?page=${returnPage}` : '/admin/exams'
        )
      }, 1000)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      notificationApi.error({
        message: 'Error',
        description: err.response?.data?.message || 'Failed to save exam',
        placement: 'topRight',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      {contextHolder}
      <div className="mb-4 flex items-center gap-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() =>
            navigate(
              returnPage ? `/admin/exams?page=${returnPage}` : '/admin/exams'
            )
          }
        />
        <h1 className="text-2xl font-bold">
          {id ? 'Edit Exam' : 'Create Exam'}
        </h1>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            isVisible: false,
            maxAttempts: 1,
            duration: 90,
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item
              name="title"
              label="Exam Title"
              rules={[{ required: true, message: 'Please enter title' }]}
            >
              <Input placeholder="Enter exam title" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Access Password"
              rules={[{ required: true, message: 'Please set a password' }]}
            >
              <Input.Password placeholder="Set access password" size="large" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Form.Item
              name="startDate"
              label="Start Date & Time"
              rules={[{ required: true }]}
            >
              <DatePicker showTime className="w-full" size="large" />
            </Form.Item>

            <Form.Item
              name="endDate"
              label="End Date & Time"
              rules={[{ required: true }]}
            >
              <DatePicker showTime className="w-full" size="large" />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Duration (minutes)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="w-full" size="large" />
            </Form.Item>
          </div>

          <div className="mb-6 flex gap-8">
            <Form.Item
              name="isVisible"
              label="Visibility"
              valuePropName="checked"
              className="mb-0"
            >
              <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
            </Form.Item>

            <Form.Item name="maxAttempts" label="Max Attempts" className="mb-0">
              <InputNumber min={1} max={10} />
            </Form.Item>
          </div>

          <Divider orientation="left">Selected Challenges</Divider>

          <div className="mb-4 rounded border p-4">
            <List
              itemLayout="horizontal"
              dataSource={selectedChallenges}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveChallenge(item.id)}
                    />,
                  ]}
                  className="mb-2 rounded border px-4"
                >
                  <List.Item.Meta
                    title={
                      <span className="font-semibold">
                        #{index + 1} {item.title}
                      </span>
                    }
                    description={
                      <Space>
                        <Tag
                          color={
                            item.difficulty === 'easy'
                              ? 'green'
                              : item.difficulty === 'medium'
                                ? 'orange'
                                : 'red'
                          }
                        >
                          {item.difficulty.toUpperCase()}
                        </Tag>
                        <Dropdown
                          menu={{ items: getVisibilityItems(item.id) }}
                          trigger={['click']}
                        >
                          <Tag
                            color={getVisibilityColor(item.visibility)}
                            className="cursor-pointer select-none"
                          >
                            {item.visibility
                              ? item.visibility.toUpperCase().replace('_', ' ')
                              : 'UNKNOWN'}
                          </Tag>
                        </Dropdown>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No challenges selected yet' }}
            />
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              className="mt-4 h-12"
              onClick={handleOpenChallengeModal}
            >
              Add Challenges
            </Button>
          </div>

          <div className="flex justify-end border-t pt-4 dark:border-gray-700">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              className="px-8"
            >
              {id ? 'Update Exam' : 'Create Exam'}
            </Button>
          </div>
        </Form>
      </Card>

      {/* Challenge Selection Modal */}
      <Modal
        title="Select Challenges"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Search challenges..."
            prefix={<SearchOutlined />}
            value={challengeSearch}
            onChange={e => setChallengeSearch(e.target.value)}
            onPressEnter={() => fetchChallengesForSelection(challengeSearch)}
          />
          <Button
            type="primary"
            onClick={() => fetchChallengesForSelection(challengeSearch)}
          >
            Search
          </Button>
        </div>
        <List
          dataSource={allChallenges}
          renderItem={item => (
            <List.Item
              className="mb-2 rounded-lg border p-3"
              actions={[
                selectedChallenges.some(s => s.id === item.id) ? (
                  <Tag color="blue" className="m-0">
                    Selected
                  </Tag>
                ) : (
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddChallenge(item)}
                  >
                    Add
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                title={<span className="font-semibold">{item.title}</span>}
                description={
                  <div className="mt-1 flex gap-2">
                    <Tag
                      className="m-0"
                      color={
                        item.difficulty === 'easy'
                          ? 'green'
                          : item.difficulty === 'medium'
                            ? 'orange'
                            : 'red'
                      }
                    >
                      {item.difficulty.toUpperCase()}
                    </Tag>
                    <Dropdown
                      menu={{ items: getVisibilityItems(item.id) }}
                      trigger={['click']}
                      // Prevent modal from closing when clicking dropdown
                      // But we need to stop propagation on the trigger itself
                    >
                      <div onClick={e => e.stopPropagation()}>
                        <Tag
                          color={getVisibilityColor(item.visibility)}
                          className="m-0 cursor-pointer select-none"
                        >
                          {item.visibility
                            ? item.visibility.toUpperCase().replace('_', ' ')
                            : 'UNKNOWN'}
                        </Tag>
                      </div>
                    </Dropdown>
                  </div>
                }
              />
            </List.Item>
          )}
          className="max-h-[60vh] overflow-y-auto px-1"
        />
      </Modal>
    </div>
  )
}

export default AdminCreateExam
