import React, { useEffect, useState, useContext } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  InputNumber,
  Switch,
  notification,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { challengeService } from '@/services/api/challenge.service'
import { topicService } from '@/services/api/topic.service'
import { Editor } from '@tinymce/tinymce-react'
import MonacoEditor from '@monaco-editor/react'
import ProblemSection from '@/components/problem/ProblemSection'
import { AdminThemeContext } from '@/contexts/AdminThemeContextDef'
import { ProblemDetailResponse } from '@/types/challenge.types'

const { Option } = Select

interface TestCase {
  input: string
  output: string
  point: number
  isPublic: boolean
}

interface SolutionApproach {
  title: string
  language: string
  sourceCode: string
  timeComplexity?: string
  spaceComplexity?: string
  explanation?: string
  description?: string
  order?: number
}

interface Solution {
  title: string
  description?: string
  videoUrl?: string
  isVisible: boolean
  solutionApproaches: SolutionApproach[]
}

interface ChallengeFormValues {
  title: string
  description: string
  difficulty: string
  visibility: string
  constraint?: string
  tags?: string[]
  timeLimit: number
  memoryLimit: string
  topicid: string
  topicName?: string
  lessonName?: string
  testcases: TestCase[]
  solution?: Solution
}

const RichTextEditor: React.FC<{
  value?: string
  onChange?: (content: string) => void
  onBlur?: () => void
  theme?: 'light' | 'dark'
}> = ({ value, onChange, onBlur, theme = 'light' }) => {
  return (
    <Editor
      // apiKey="your-api-key" // Optional: Add your TinyMCE API key here to remove the warning
      apiKey="mbktsx5e61er2k8coefqk7u51n3sf1m7z1r9qyqcpv01grpw"
      value={value}
      onEditorChange={onChange}
      onBlur={onBlur}
      init={{
        height: 300,
        menubar: true,
        plugins: [
          'advlist',
          'autolink',
          'lists',
          'link',
          'image',
          'charmap',
          'preview',
          'anchor',
          'searchreplace',
          'visualblocks',
          'code',
          'fullscreen',
          'insertdatetime',
          'media',
          'table',
          'code',
          'help',
          'wordcount',
        ],
        toolbar:
          'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style:
          'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
        content_css: theme === 'dark' ? 'dark' : 'default',
      }}
    />
  )
}

const AdminCreateChallenge: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [topics, setTopics] = useState<{ id: string; topicName: string }[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<ChallengeFormValues | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<
    'question' | 'solution' | 'submissions' | 'discussion'
  >('question')

  const { adminTheme } = useContext(AdminThemeContext) || {
    adminTheme: 'light',
  }

  // const [notificationApi, contextHolder] = notification.useNotification()

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const [topicsData, tagsData] = await Promise.all([
          topicService.getTopics(),
          challengeService.getAllTags(),
        ])
        setTopics(topicsData as { id: string; topicName: string }[])
        setAvailableTags(tagsData)
      } catch {
        notification.error({
          message: 'Error',
          description: 'Failed to load initial data',
          placement: 'topRight',
        })
      }
    }
    loadTopics()
  }, [])

  const fetchChallenge = React.useCallback(
    async (challengeId: string) => {
      setLoading(true)
      try {
        const data = await challengeService.getChallengeById(challengeId)
        // Transform data for form
        const problem = data.data.problem || data.data // Handle potential different response structure

        // Default empty solution if none exists
        const solutionData = data.data.solution || {
          title: 'Reference Solution',
          isVisible: true,
          solutionApproaches: [],
        }

        const formData = {
          ...problem,
          topicid: problem.topicId,
          topicName: problem.topicName,
          lessonName: problem.lessonName,
          testcases: data.data.testcases,
          solution: solutionData,
        }
        form.setFieldsValue(formData)
      } catch {
        notification.error({
          message: 'Error',
          description: 'Failed to load challenge',
          placement: 'topRight',
        })
      } finally {
        setLoading(false)
      }
    },
    [form]
  )

  useEffect(() => {
    if (id) {
      fetchChallenge(id)
    }
  }, [id, fetchChallenge])

  const onFinish = async (values: ChallengeFormValues) => {
    setLoading(true)
    try {
      // Direct pass-through of values now that backend handles nested solution
      const payload = values as unknown as Record<string, unknown>
      const solutionPayload = payload.solution as
        | Record<string, unknown>
        | undefined

      if (
        solutionPayload &&
        Array.isArray(solutionPayload.solutionApproaches)
      ) {
        // Ensure orders are set
        solutionPayload.solutionApproaches =
          solutionPayload.solutionApproaches.map(
            (ap: unknown, index: number) => ({
              ...(ap as object),
              order: index + 1,
            })
          )
      }

      if (id) {
        await challengeService.updateChallenge(id, payload)
        navigate('/admin/challenges', {
          state: { successMessage: 'Challenge updated successfully' },
        })
      } else {
        await challengeService.createChallenge(payload)
        navigate('/admin/challenges', {
          state: { successMessage: 'Challenge created successfully' },
        })
      }
    } catch (error: unknown) {
      console.error('Full Update Error:', error)
      const err = error as { response?: { data?: { message?: string } } }
      notification.error({
        message: 'Error',
        description: err.response?.data?.message || 'Failed to save challenge',
        placement: 'topRight',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    try {
      const values = await form.validateFields()
      setPreviewData(values as ChallengeFormValues)
      setPreviewMode(true)
    } catch {
      notification.error({
        message: 'Error',
        description: 'Please fill in all required fields before previewing',
        placement: 'topRight',
      })
    }
  }

  const renderPreview = () => {
    if (!previewData) return null

    // Construct mock data for ProblemSection
    const mockProblemData: ProblemDetailResponse['data'] = {
      problem: {
        id: id || 'preview-id',
        title: previewData.title,
        description: previewData.description,
        difficulty: previewData.difficulty as 'easy' | 'medium' | 'hard',
        constraint: previewData.constraint || '',
        tags: previewData.tags || [],
        totalPoints: 0,
        isSolved: false,
        isFavorite: false,
      },
      testcases:
        previewData.testcases?.map((tc: TestCase, i: number) => ({
          ...tc,
          id: `temp-${i}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })) || [],
      solution: previewData.solution
        ? {
            id: 'temp-solution',
            title: previewData.solution.title,
            description: previewData.solution.description || '',
            videoUrl: previewData.solution.videoUrl || '',
            imageUrl: '',
            isVisible: previewData.solution.isVisible,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            solutionApproaches:
              previewData.solution.solutionApproaches?.map(
                (ap: SolutionApproach, i: number) => ({
                  id: `temp-ap-${i}`,
                  title: ap.title,
                  language: ap.language,
                  sourceCode: ap.sourceCode,
                  timeComplexity: ap.timeComplexity || '',
                  spaceComplexity: ap.spaceComplexity || '',
                  explanation: ap.explanation || '',
                  description: ap.description || '',
                  order: i + 1,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
              ) || [],
          }
        : {
            id: 'no-solution',
            title: 'No Solution',
            description: '',
            videoUrl: '',
            imageUrl: '',
            isVisible: false,
            solutionApproaches: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
    }

    return (
      <div className="flex h-screen flex-col border-gray-700 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
          <Button
            onClick={() => setPreviewMode(false)}
            className="text-white hover:text-blue-400"
          >
            Back to Edit
          </Button>
          <Button type="primary" onClick={() => onFinish(previewData)}>
            {id ? 'Update Challenge' : 'Create Challenge'}
          </Button>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <ProblemSection
            activeTab={activeTab}
            onTabChange={setActiveTab}
            problemData={mockProblemData}
          />
        </div>
      </div>
    )
  }

  if (previewMode) {
    return renderPreview()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 transition-colors duration-300 dark:bg-gray-950">
      {/* {contextHolder} */}
      <div className="mb-4 flex items-center gap-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/challenges')}
        />
        <h1 className="text-2xl font-bold text-gray-900 transition-colors duration-300 dark:text-white">
          {id ? 'Edit Challenge' : 'Create Challenge'}
        </h1>
      </div>

      <Card className="bg-white transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          validateTrigger={['onChange', 'onBlur']}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (HTML supported)"
            tooltip="You can enter HTML tags here. Use Preview to verify."
            rules={[
              { required: true, message: 'Please enter description' },
              {
                validator: async (_, value) => {
                  if (value && value.trim() !== '' && value !== '<p><br></p>') {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error('Description cannot be empty')
                  )
                },
              },
            ]}
          >
            <RichTextEditor theme={adminTheme} />
          </Form.Item>

          <Form.Item
            name="constraint"
            label="Constraint"
            tooltip="Constraints on input/output (e.g. 1 <= N <= 10^5)"
            rules={[
              { required: true, message: 'Please enter constraints' },
              {
                validator: async (_, value) => {
                  if (value && value.trim() !== '' && value !== '<p><br></p>') {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error('Constraints cannot be empty')
                  )
                },
              },
            ]}
          >
            <RichTextEditor theme={adminTheme} />
          </Form.Item>

          <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
            <Form.Item name="difficulty" label="Difficulty" initialValue="easy">
              <Select style={{ width: 120 }}>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="visibility"
              label="Visibility"
              initialValue="public"
            >
              <Select style={{ width: 120 }}>
                <Option value="public">Public</Option>
                <Option value="private">Private</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="timeLimit"
              label="Time Limit (ms)"
              initialValue={1000}
            >
              <InputNumber />
            </Form.Item>
            <Form.Item
              name="memoryLimit"
              label="Memory Limit"
              initialValue="128m"
            >
              <Input />
            </Form.Item>
          </Space>

          <Form.Item name="topicid" label="Topic" rules={[{ required: true }]}>
            <Select
              placeholder="Select a topic"
              loading={loading}
              showSearch
              optionFilterProp="children"
            >
              {topics.map(t => (
                <Option key={t.id} value={t.id}>
                  {t.topicName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="tags" label="Tags">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Select or create tags"
              tokenSeparators={[',']}
            >
              {availableTags.map(tag => (
                <Option key={tag} value={tag}>
                  {tag}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">Testcases</Divider>
          <Form.List name="testcases">
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    size="small"
                    title={`Testcase ${index + 1}`}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    }
                    className="border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'input']}
                          label="Input"
                          rules={[{ required: true, message: 'Missing input' }]}
                          className="mb-0"
                        >
                          <Input.TextArea
                            placeholder="Input data..."
                            rows={4}
                            className="font-mono text-sm"
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'output']}
                          label="Output"
                          rules={[
                            { required: true, message: 'Missing output' },
                          ]}
                          className="mb-0"
                        >
                          <Input.TextArea
                            placeholder="Expected output..."
                            rows={4}
                            className="font-mono text-sm"
                          />
                        </Form.Item>
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t pt-2">
                        <Space>
                          <Form.Item
                            {...restField}
                            name={[name, 'point']}
                            label="Points"
                            initialValue={10}
                            className="mb-0"
                          >
                            <InputNumber min={0} />
                          </Form.Item>
                        </Space>

                        <Form.Item
                          {...restField}
                          name={[name, 'isPublic']}
                          valuePropName="checked"
                          initialValue={false}
                          className="mb-0"
                          label="Visibility"
                        >
                          <Switch
                            checkedChildren="Public"
                            unCheckedChildren="Hidden"
                          />
                        </Form.Item>
                      </div>
                    </Space>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  className="h-12"
                >
                  Add Testcase
                </Button>
              </div>
            )}
          </Form.List>

          <Divider orientation="left">Reference Solution</Divider>
          <div className="mb-4 rounded border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                name={['solution', 'title']}
                label="Solution Title"
                initialValue="Reference Solution"
              >
                <Input />
              </Form.Item>
              <Form.Item name={['solution', 'videoUrl']} label="Video URL">
                <Input placeholder="https://youtube.com/..." />
              </Form.Item>
            </div>
            <Form.Item
              name={['solution', 'description']}
              label="Overall Description"
            >
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item
              name={['solution', 'isVisible']}
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Public" unCheckedChildren="Private" />
            </Form.Item>
          </div>

          <h3 className="mb-2 font-semibold">Solution Approaches</h3>
          <Form.List name={['solution', 'solutionApproaches']}>
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    type="inner"
                    title={`Approach ${index + 1}`}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    }
                    className="border-blue-100 bg-white transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'title']}
                          label="Approach Title"
                          rules={[{ required: true }]}
                        >
                          <Input placeholder="e.g. Brute Force" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'language']}
                          label="Language"
                          initialValue="javascript"
                        >
                          <Select>
                            <Option value="javascript">JavaScript</Option>
                            <Option value="typescript">TypeScript</Option>
                            <Option value="python">Python</Option>
                            <Option value="java">Java</Option>
                            <Option value="cpp">C++</Option>
                          </Select>
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'timeComplexity']}
                          label="Time Complexity"
                        >
                          <Input placeholder="e.g. O(n)" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'spaceComplexity']}
                          label="Space Complexity"
                        >
                          <Input placeholder="e.g. O(1)" />
                        </Form.Item>
                      </div>

                      <Form.Item
                        {...restField}
                        name={[name, 'explanation']}
                        label="Explanation"
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Explain how this approach works..."
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'sourceCode']}
                        label="Code"
                        rules={[{ required: true }]}
                      >
                        <MonacoEditor
                          height="250px"
                          defaultLanguage="javascript"
                          theme="vs-dark"
                        />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  className="h-12 border-blue-300 text-blue-500"
                >
                  Add Solution Approach
                </Button>
              </div>
            )}
          </Form.List>

          <div className="mt-8 flex justify-end gap-2 border-t pt-4">
            <Button type="default" size="large" onClick={handlePreview}>
              Preview Challenge
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
            >
              {id ? 'Update Challenge' : 'Create Challenge'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default AdminCreateChallenge
