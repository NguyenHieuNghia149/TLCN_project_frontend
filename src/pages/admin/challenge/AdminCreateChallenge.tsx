import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Space,
  InputNumber,
  Switch,
  App,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { Editor } from '@tinymce/tinymce-react'
import MonacoEditor from '@monaco-editor/react'

import ProblemSection from '@/components/problem/ProblemSection'
import {
  buildSubmissionLanguageOptions,
  type LanguageOption,
} from '@/constants/submissionLanguages'
import { AdminThemeContext } from '@/contexts/AdminThemeContextDef'
import { useLanguages } from '@/hooks/api/useLanguages'
import { challengeService } from '@/services/api/challenge.service'
import { topicService } from '@/services/api/topic.service'
import { ProblemDetailResponse } from '@/types/challenge.types'

const { Option } = Select

interface TestCase {
  input: string
  output: string
  point: number
  isPublic: boolean
}

interface CodeVariantFormValue {
  language: string
  sourceCode: string
}

interface SolutionApproachFormValue {
  title: string
  description?: string
  explanation?: string
  timeComplexity?: string
  spaceComplexity?: string
  order?: number
  codeVariants: CodeVariantFormValue[]
}

interface SolutionFormValue {
  title: string
  description?: string
  videoUrl?: string
  isVisible: boolean
  solutionApproaches: SolutionApproachFormValue[]
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
  solution?: SolutionFormValue
}

const RichTextEditor: React.FC<{
  value?: string
  onChange?: (content: string) => void
  onBlur?: () => void
  theme?: 'light' | 'dark'
}> = ({ value, onChange, onBlur, theme = 'light' }) => {
  return (
    <Editor
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

function buildEmptyCodeVariants(
  languageOptions: LanguageOption[]
): CodeVariantFormValue[] {
  return languageOptions.map(language => ({
    language: language.value,
    sourceCode: '',
  }))
}

function normalizeCodeVariantsForForm(
  codeVariants: Array<{ language?: string; sourceCode?: string }> | undefined,
  languageOptions: LanguageOption[]
): CodeVariantFormValue[] {
  const sourceCodeByLanguage = new Map<string, string>()

  for (const variant of codeVariants ?? []) {
    if (typeof variant.language === 'string') {
      sourceCodeByLanguage.set(variant.language, variant.sourceCode ?? '')
    }
  }

  return languageOptions.map(language => ({
    language: language.value,
    sourceCode: sourceCodeByLanguage.get(language.value) ?? '',
  }))
}

function normalizeApproachesForSubmit(
  solutionApproaches: SolutionApproachFormValue[] | undefined,
  languageOptions: LanguageOption[]
): SolutionApproachFormValue[] {
  return (solutionApproaches ?? []).map((approach, index) => ({
    ...approach,
    order: index + 1,
    codeVariants: normalizeCodeVariantsForForm(
      approach.codeVariants,
      languageOptions
    ),
  }))
}

function normalizeSolutionForForm(
  solution: ProblemDetailResponse['data']['solution'] | undefined,
  languageOptions: LanguageOption[]
): SolutionFormValue {
  if (!solution) {
    return {
      title: 'Reference Solution',
      description: '',
      videoUrl: '',
      isVisible: true,
      solutionApproaches: [],
    }
  }

  return {
    title: solution.title || 'Reference Solution',
    description: solution.description || '',
    videoUrl: solution.videoUrl || '',
    isVisible: solution.isVisible,
    solutionApproaches: (solution.solutionApproaches ?? []).map(approach => ({
      title: approach.title,
      description: approach.description || '',
      explanation: approach.explanation || '',
      timeComplexity: approach.timeComplexity || '',
      spaceComplexity: approach.spaceComplexity || '',
      order: approach.order,
      codeVariants: normalizeCodeVariantsForForm(
        approach.codeVariants,
        languageOptions
      ),
    })),
  }
}

function mapSolutionForPreview(
  solution: SolutionFormValue | undefined,
  languageOptions: LanguageOption[]
): ProblemDetailResponse['data']['solution'] {
  if (!solution) {
    return {
      id: 'no-solution',
      title: 'No Solution',
      description: '',
      videoUrl: '',
      imageUrl: '',
      isVisible: false,
      solutionApproaches: [],
      createdAt: '',
      updatedAt: '',
    }
  }

  return {
    id: 'temp-solution',
    title: solution.title,
    description: solution.description || '',
    videoUrl: solution.videoUrl || '',
    imageUrl: '',
    isVisible: solution.isVisible,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    solutionApproaches: normalizeApproachesForSubmit(
      solution.solutionApproaches,
      languageOptions
    ).map((approach, index) => {
      return {
        id: `temp-ap-${index}`,
        title: approach.title,
        description: approach.description || '',
        explanation: approach.explanation || '',
        timeComplexity: approach.timeComplexity || '',
        spaceComplexity: approach.spaceComplexity || '',
        order: index + 1,
        codeVariants: approach.codeVariants,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }),
  }
}

const AdminCreateChallenge: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm<ChallengeFormValues>()
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
  const { data: languages } = useLanguages()
  const languageOptions = useMemo(
    () => buildSubmissionLanguageOptions(languages),
    [languages]
  )

  const { adminTheme } = useContext(AdminThemeContext) || {
    adminTheme: 'light',
  }

  const { notification } = App.useApp()

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

    void loadTopics()
  }, [notification])

  const fetchChallenge = useCallback(
    async (challengeId: string) => {
      setLoading(true)
      try {
        const data = await challengeService.getChallengeById(challengeId, true)
        const problem = data.data.problem || data.data
        const solution = normalizeSolutionForForm(
          data.data.solution,
          languageOptions
        )

        const formData: ChallengeFormValues = {
          ...problem,
          visibility:
            (problem as { visibility?: string }).visibility ?? 'public',
          timeLimit: (problem as { timeLimit?: number }).timeLimit ?? 1000,
          memoryLimit:
            (problem as { memoryLimit?: string }).memoryLimit ?? '128m',
          topicid: problem.topicId || '',
          topicName: problem.topicName,
          lessonName: problem.lessonName,
          testcases: data.data.testcases.map(testCase => ({
            input: testCase.displayInput,
            output: testCase.displayOutput,
            point: testCase.point,
            isPublic: testCase.isPublic,
          })),
          solution,
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
    [form, languageOptions, notification]
  )

  useEffect(() => {
    if (id) {
      void fetchChallenge(id)
    }
  }, [fetchChallenge, id])

  const onFinish = async (values: ChallengeFormValues) => {
    setLoading(true)
    try {
      const payload: ChallengeFormValues = {
        ...values,
        solution: values.solution
          ? {
              ...values.solution,
              solutionApproaches: normalizeApproachesForSubmit(
                values.solution.solutionApproaches,
                languageOptions
              ),
            }
          : undefined,
      }

      if (id) {
        await challengeService.updateChallenge(
          id,
          payload as unknown as Record<string, unknown>
        )
        navigate('/admin/challenges', {
          state: { successMessage: 'Challenge updated successfully' },
        })
      } else {
        await challengeService.createChallenge(
          payload as unknown as Record<string, unknown>
        )
        navigate('/admin/challenges', {
          state: { successMessage: 'Challenge created successfully' },
        })
      }
    } catch (error: unknown) {
      console.error('Full Update Error:', error)
      const err = error as {
        response?: { data?: { code?: string; message?: string } }
      }

      const hasSubmissions =
        err.response?.data?.code === 'CHALLENGE_HAS_SUBMISSIONS' ||
        err.response?.data?.message?.includes('submitted')

      notification.error({
        message: hasSubmissions ? 'Cannot Update Challenge' : 'Error',
        description: hasSubmissions
          ? 'This challenge cannot be updated because users have already submitted solutions to it. You can only change the visibility setting.'
          : err.response?.data?.message || 'Failed to save challenge',
        placement: 'topRight',
        duration: 5,
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
        previewData.testcases?.map((tc: TestCase, index: number) => ({
          id: `temp-${index}`,
          inputJson: {},
          outputJson: tc.output,
          displayInput: tc.input,
          displayOutput: tc.output,
          isPublic: tc.isPublic,
          point: tc.point,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })) || [],
      solution: mapSolutionForPreview(previewData.solution, languageOptions),
    }

    return (
      <div className="flex h-screen flex-col border-border bg-background">
        <div className="flex items-center justify-between border-b border-border bg-card p-4">
          <Button onClick={() => setPreviewMode(false)}>Back to Edit</Button>
          <Button type="primary" onClick={() => void onFinish(previewData)}>
            {id ? 'Update Challenge' : 'Create Challenge'}
          </Button>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <ProblemSection
            activeTab={activeTab}
            onTabChange={setActiveTab}
            problemData={mockProblemData}
            solutionLanguageOptions={languageOptions}
          />
        </div>
      </div>
    )
  }

  if (previewMode) {
    return renderPreview()
  }

  return (
    <div className="min-h-screen bg-background p-6 transition-colors duration-300">
      <div className="mb-4 flex items-center gap-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/challenges')}
        />
        <h1 className="text-2xl font-bold text-foreground transition-colors duration-300">
          {id ? 'Edit Challenge' : 'Create Challenge'}
        </h1>
      </div>

      <Card className="border-border bg-card transition-colors duration-300">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          validateTrigger={['onChange', 'onBlur']}
          initialValues={{
            difficulty: 'easy',
            visibility: 'public',
            timeLimit: 1000,
            memoryLimit: '128m',
            solution: {
              title: 'Reference Solution',
              description: '',
              videoUrl: '',
              isVisible: true,
              solutionApproaches: [],
            },
          }}
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
            <Form.Item name="difficulty" label="Difficulty">
              <Select style={{ width: 120 }}>
                <Option value="easy">Easy</Option>
                <Option value="medium">Medium</Option>
                <Option value="hard">Hard</Option>
              </Select>
            </Form.Item>
            <Form.Item name="visibility" label="Visibility">
              <Select style={{ width: 120 }}>
                <Option value="public">Public</Option>
                <Option value="private">Private</Option>
              </Select>
            </Form.Item>
            <Form.Item name="timeLimit" label="Time Limit (ms)">
              <InputNumber />
            </Form.Item>
            <Form.Item name="memoryLimit" label="Memory Limit">
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
              {topics.map(topic => (
                <Option key={topic.id} value={topic.id}>
                  {topic.topicName}
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
                    className="border-border bg-card shadow-sm transition-colors duration-300"
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
                  onClick={() =>
                    add({ input: '', output: '', point: 10, isPublic: false })
                  }
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
          <div className="mb-4 rounded border border-border bg-muted/50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                name={['solution', 'title']}
                label="Solution Title"
                rules={[
                  { required: true, message: 'Please enter solution title' },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name={['solution', 'videoUrl']}
                label="Video URL"
                rules={[
                  {
                    type: 'url',
                    warningOnly: true,
                    message: 'Please enter a valid URL',
                  },
                ]}
              >
                <Input placeholder="https://youtube.com/..." />
              </Form.Item>
            </div>
            <Form.Item
              name={['solution', 'description']}
              label="Overall Description"
            >
              <Input.TextArea rows={2} />
            </Form.Item>
            <Form.Item name={['solution', 'isVisible']} valuePropName="checked">
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
                    className="border-border bg-card transition-colors duration-300"
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'title']}
                        label="Approach Title"
                        rules={[
                          {
                            required: true,
                            message: 'Please enter approach title',
                          },
                        ]}
                      >
                        <Input placeholder="e.g. Brute Force" />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                        label="Shared Description"
                      >
                        <Input.TextArea
                          rows={2}
                          placeholder="One description shared across all languages"
                        />
                      </Form.Item>

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

                      <Divider orientation="left">Code Variants</Divider>
                      {languageOptions.map((languageOption, languageIndex) => (
                        <div
                          key={languageOption.value}
                          className="rounded border border-border p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-medium text-foreground">
                              {languageOption.label}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              Required
                            </span>
                          </div>
                          <Form.Item
                            name={[
                              name,
                              'codeVariants',
                              languageIndex,
                              'language',
                            ]}
                            initialValue={languageOption.value}
                            hidden
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name={[
                              name,
                              'codeVariants',
                              languageIndex,
                              'sourceCode',
                            ]}
                            label={`Code (${languageOption.label})`}
                            rules={[
                              {
                                required: true,
                                message: `Please enter ${languageOption.label} solution code`,
                              },
                            ]}
                          >
                            <MonacoEditor
                              height="250px"
                              language={languageOption.monacoLanguage}
                              theme={
                                adminTheme === 'dark' ? 'vs-dark' : 'light'
                              }
                            />
                          </Form.Item>
                        </div>
                      ))}
                    </Space>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      title: '',
                      description: '',
                      explanation: '',
                      timeComplexity: '',
                      spaceComplexity: '',
                      codeVariants: buildEmptyCodeVariants(languageOptions),
                    })
                  }
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
