import React, { useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Form,
  Spin,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import {
  DeleteOutlined,
  EyeOutlined,
  SwapOutlined,
  PlusOutlined,
  HolderOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store/stores'
import type {
  AdminRoadmapRow,
  AdminRoadmapDetailResponse,
} from '@/services/api/adminRoadmap.service'
import { adminRoadmapAPI } from '@/services/api/adminRoadmap.service'
import { apiClient } from '@/config/axios.config'
import {
  asyncDeleteAdminRoadmap,
  asyncFetchAdminRoadmaps,
  asyncUpdateAdminRoadmapVisibility,
  asyncCreateAdminRoadmap,
} from '@/store/slices/adminRoadmapSlice'

const SortableItem = ({ item, index, handleDeleteItem, modal }: unknown) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border-b border-slate-200 bg-white last:border-b-0"
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex flex-1 items-center text-sm">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab px-2 py-1 text-slate-400 transition-colors hover:text-slate-600"
          >
            <HolderOutlined />
          </div>
          <span className="ml-1 mr-2 font-medium">#{index + 1}</span>
          <Tag color="blue">{item.itemType}</Tag>
          <span className="ml-2 font-medium text-slate-600">
            {item.itemTitle || item.itemId}
          </span>
        </div>
        <div>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={e => {
              e.stopPropagation()
              modal.confirm({
                title: 'Remove Item',
                content:
                  'Are you sure you want to remove this item from the roadmap?',
                okText: 'Remove',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => handleDeleteItem(item.id),
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}

const ManageRoadmap: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { notification, modal } = App.useApp()
  const list = useSelector((s: RootState) => s.adminRoadmaps.list)
  const operation = useSelector((s: RootState) => s.adminRoadmaps.operation)

  const [keyword, setKeyword] = useState('')
  const [visibility, setVisibility] = useState<
    'public' | 'private' | undefined
  >(undefined)
  const [createdBy, setCreatedBy] = useState<string>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailData, setDetailData] =
    useState<AdminRoadmapDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showAddItemsModal, setShowAddItemsModal] = useState(false)
  const [currentRoadmapIdForItems, setCurrentRoadmapIdForItems] =
    useState<string>('')
  const [addItemsLoading, setAddItemsLoading] = useState(false)
  const [lessonsList, setLessonsList] = useState<unknown[]>([])
  const [problemsList, setProblemsList] = useState<unknown[]>([])
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [problemsLoading, setProblemsLoading] = useState(false)
  const [form] = Form.useForm()
  const [addItemsForm] = Form.useForm()
  const selectedItemType = Form.useWatch('itemType', addItemsForm)

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([])
  const [savingDetail, setSavingDetail] = useState(false)

  useEffect(() => {
    dispatch(asyncFetchAdminRoadmaps({ limit: 20, offset: 0 }))
  }, [dispatch])

  const onSearch = () => {
    dispatch(
      asyncFetchAdminRoadmaps({
        limit: list.limit,
        offset: 0,
        keyword: keyword || undefined,
        visibility,
        createdBy: createdBy || undefined,
      })
    )
  }

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const limit = newPagination.pageSize ?? list.limit
    const current = newPagination.current ?? 1
    const offset = (current - 1) * limit
    dispatch(
      asyncFetchAdminRoadmaps({
        limit,
        offset,
        keyword: keyword || undefined,
        visibility,
        createdBy: createdBy || undefined,
      })
    )
  }

  const handleCreateRoadmap = async (values: unknown) => {
    try {
      await dispatch(
        asyncCreateAdminRoadmap({
          title: values.title,
          description: values.description,
          visibility: values.visibility || 'public',
        })
      ).unwrap()

      notification.success({
        message: 'Success',
        description: 'Roadmap created successfully',
        placement: 'topRight',
      })

      setShowCreateForm(false)
      form.resetFields()
    } catch (err: unknown) {
      notification.error({
        message: 'Error',
        description: String(err || 'Failed to create roadmap'),
        placement: 'topRight',
      })
    }
  }

  const handleViewDetail = async (roadmapId: string) => {
    setDetailLoading(true)
    setHasUnsavedChanges(false)
    setDeletedItemIds([])
    try {
      const detail = await adminRoadmapAPI.getRoadmapDetail(roadmapId)
      setDetailData(detail)
      setShowDetailModal(true)
    } catch {
      notification.error({
        message: 'Error',
        description: 'Failed to load roadmap details',
        placement: 'topRight',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleAddItemsClick = (roadmapId: string) => {
    setCurrentRoadmapIdForItems(roadmapId)
    setShowAddItemsModal(true)
    addItemsForm.resetFields()
    loadLessonsAndProblems()
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    if (detailData) {
      const oldIndex = detailData.data.items.findIndex(i => i.id === active.id)
      const newIndex = detailData.data.items.findIndex(i => i.id === over.id)

      const newItems = arrayMove(detailData.data.items, oldIndex, newIndex)

      setDetailData({
        ...detailData,
        data: { ...detailData.data, items: newItems },
      })
      setHasUnsavedChanges(true)
    }
  }

  const loadLessonsAndProblems = async () => {
    try {
      setLessonsLoading(true)
      setProblemsLoading(true)

      // Fetch available lessons and problems from admin endpoint
      const response = await apiClient.get(
        '/admin/roadmaps/available-items/list'
      )

      const data = response.data?.data
      setLessonsList(data?.lessons || [])
      setProblemsList(data?.problems || [])
    } catch (err) {
      console.error('Failed to load available items:', err)
      setLessonsList([])
      setProblemsList([])
    } finally {
      setLessonsLoading(false)
      setProblemsLoading(false)
    }
  }

  const handleAddItem = async (values: unknown) => {
    if (!currentRoadmapIdForItems) return

    try {
      setAddItemsLoading(true)
      await adminRoadmapAPI.addItemToRoadmap(currentRoadmapIdForItems, {
        itemType: values.itemType,
        itemId: values.itemId,
        order: values.order || 1,
      })

      notification.success({
        message: 'Success',
        description: 'Item added to roadmap',
        placement: 'topRight',
      })

      addItemsForm.resetFields()
      setShowAddItemsModal(false)

      // Refresh detail data
      const detail = await adminRoadmapAPI.getRoadmapDetail(
        currentRoadmapIdForItems
      )
      setDetailData(detail)
    } catch (err: unknown) {
      notification.error({
        message: 'Error',
        description: String(err || 'Failed to add item'),
        placement: 'topRight',
      })
    } finally {
      setAddItemsLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!detailData?.data.roadmap.id) return

    setDeletedItemIds(prev => [...prev, itemId])
    setDetailData({
      ...detailData,
      data: {
        ...detailData.data,
        items: detailData.data.items.filter(i => i.id !== itemId),
      },
    })
    setHasUnsavedChanges(true)
  }

  const handleSaveDetail = async () => {
    if (!detailData?.data.roadmap.id) return

    setSavingDetail(true)
    try {
      const roadmapId = detailData.data.roadmap.id

      // 1. Delete items that were removed
      if (deletedItemIds.length > 0) {
        for (const itemId of deletedItemIds) {
          await adminRoadmapAPI.removeItemFromRoadmap(roadmapId, itemId)
        }
      }

      // 2. Reorder remaining items
      const itemIds = detailData.data.items.map(i => i.id)
      if (itemIds.length > 0) {
        await adminRoadmapAPI.reorderItems(roadmapId, itemIds)
      }

      notification.success({
        message: 'Success',
        description: 'Roadmap detail saved successfully',
        placement: 'topRight',
      })

      setHasUnsavedChanges(false)
      setDeletedItemIds([])
      setShowDetailModal(false)
      setDetailData(null)
    } catch (err: unknown) {
      notification.error({
        message: 'Error',
        description: String(err || 'Failed to save roadmap details'),
        placement: 'topRight',
      })
    } finally {
      setSavingDetail(false)
    }
  }

  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      modal.confirm({
        title: 'Unsaved Changes',
        content:
          'You have unsaved changes. Are you sure you want to close without saving?',
        onOk: () => {
          setShowDetailModal(false)
          setDetailData(null)
          setHasUnsavedChanges(false)
          setDeletedItemIds([])
        },
      })
    } else {
      setShowDetailModal(false)
      setDetailData(null)
    }
  }

  const columns = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: (text: string) => <strong>{text}</strong>,
      },
      {
        title: 'Creator',
        key: 'creator',
        render: (_: unknown, record: AdminRoadmapRow) => {
          if (!record) return '—'
          const name =
            `${record.creatorFirstName || ''} ${record.creatorLastName || ''}`.trim()
          return (
            <div>
              <div className="text-sm font-medium">{name || '—'}</div>
              <div className="text-xs text-slate-500">
                {record.creatorEmail || record.createdBy}
              </div>
            </div>
          )
        },
      },
      {
        title: 'Visibility',
        dataIndex: 'visibility',
        key: 'visibility',
        render: (value: 'public' | 'private' | undefined) => (
          <Tag color={value === 'public' ? 'green' : 'orange'}>
            {value ? value.toUpperCase() : 'UNKNOWN'}
          </Tag>
        ),
      },
      {
        title: 'Items',
        dataIndex: 'itemCount',
        key: 'itemCount',
        render: (value: number) => <Tag color="blue">{value}</Tag>,
      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: string) =>
          value ? new Date(value).toLocaleString() : '—',
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: unknown, record: AdminRoadmapRow) => (
          <Space size="middle">
            <Tooltip title="View detail">
              <Button
                type="primary"
                ghost
                shape="circle"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record.id)}
                loading={detailLoading}
              />
            </Tooltip>
            <Tooltip title="Toggle visibility">
              <Button
                shape="circle"
                icon={<SwapOutlined />}
                onClick={async () => {
                  const next =
                    record.visibility === 'public' ? 'private' : 'public'
                  try {
                    await dispatch(
                      asyncUpdateAdminRoadmapVisibility({
                        id: record.id,
                        visibility: next,
                      })
                    ).unwrap()
                    notification.success({
                      message: 'Success',
                      description: `Visibility updated to ${next}`,
                      placement: 'topRight',
                    })
                  } catch (err: unknown) {
                    notification.error({
                      message: 'Error',
                      description: String(err || 'Failed to update visibility'),
                      placement: 'topRight',
                    })
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                danger
                type="primary"
                ghost
                shape="circle"
                icon={<DeleteOutlined />}
                onClick={() => {
                  modal.confirm({
                    title: `Delete roadmap "${record.title}"?`,
                    content:
                      'This will delete items and progress. This action cannot be undone.',
                    okText: 'Delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    onOk: async () => {
                      try {
                        await dispatch(
                          asyncDeleteAdminRoadmap({ id: record.id })
                        ).unwrap()
                        notification.success({
                          message: 'Deleted',
                          description: 'Roadmap deleted successfully',
                          placement: 'topRight',
                        })
                      } catch (err: unknown) {
                        notification.error({
                          message: 'Error',
                          description: String(
                            err || 'Failed to delete roadmap'
                          ),
                          placement: 'topRight',
                        })
                      }
                    },
                  })
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, keyword, createdBy, visibility, list.limit, modal, notification]
  )

  return (
    <div
      className="min-h-screen p-6 transition-colors duration-300"
      style={{ backgroundColor: 'var(--background-color)' }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1
          className="whitespace-nowrap text-2xl font-bold"
          style={{ color: 'var(--text-color)' }}
        >
          Manage Roadmaps
        </h1>
        <div className="flex flex-1 items-center justify-end gap-3">
          <Input
            placeholder="Search title/description..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={onSearch}
            style={{ maxWidth: 320 }}
            allowClear
          />
          <Select
            placeholder="Visibility"
            allowClear
            value={visibility}
            onChange={v => setVisibility(v)}
            style={{ width: 140 }}
            options={[
              { value: 'public', label: 'Public' },
              { value: 'private', label: 'Private' },
            ]}
          />
          <Input
            placeholder="Creator userId"
            value={createdBy}
            onChange={e => setCreatedBy(e.target.value)}
            style={{ maxWidth: 220 }}
            allowClear
          />
          <Button type="primary" onClick={onSearch}>
            Apply
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateForm(true)}
          >
            Create
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
          // @ts-expect-error - Table columns typing is overly strict here
          columns={columns}
          dataSource={list.items}
          loading={list.loading}
          pagination={{
            current: Math.floor(list.offset / list.limit) + 1,
            pageSize: list.limit,
            total: list.total,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={
          <div>
            Roadmap: {detailData?.data.roadmap.title || ''}
            {hasUnsavedChanges && (
              <span className="ml-2 text-sm font-normal italic text-orange-500">
                (Unsaved changes)
              </span>
            )}
          </div>
        }
        open={showDetailModal}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveDetail}
            loading={savingDetail}
            disabled={!hasUnsavedChanges}
          >
            Save
          </Button>,
        ]}
        width={700}
      >
        <Spin spinning={detailLoading}>
          {detailData && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Description
                </p>
                <p className="text-sm text-slate-700">
                  {detailData.data.roadmap.description || '—'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Visibility
                  </p>
                  <Tag
                    color={
                      detailData.data.roadmap.visibility === 'public'
                        ? 'green'
                        : 'orange'
                    }
                  >
                    {detailData.data.roadmap.visibility.toUpperCase()}
                  </Tag>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Creator
                  </p>
                  <p className="text-sm text-slate-700">
                    {`${detailData.data.roadmap.creatorFirstName || ''} ${detailData.data.roadmap.creatorLastName || ''}`.trim() ||
                      '—'}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    Roadmap Items ({detailData.data.items.length})
                  </p>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      handleAddItemsClick(detailData.data.roadmap.id)
                    }
                  >
                    Add Item
                  </Button>
                </div>
                {detailData.data.items.length > 0 ? (
                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={detailData.data.items.map((i: unknown) => i.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {detailData.data.items.map(
                          (item: unknown, index: number) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              index={index}
                              handleDeleteItem={handleDeleteItem}
                              modal={modal}
                            />
                          )
                        )}
                      </SortableContext>
                    </DndContext>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No items added yet</p>
                )}
              </div>
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title="Create New Roadmap"
        open={showCreateForm}
        onCancel={() => {
          setShowCreateForm(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRoadmap}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter roadmap title' }]}
          >
            <Input placeholder="Enter roadmap title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ message: 'Max 1000 characters' }]}
          >
            <Input.TextArea
              placeholder="Enter roadmap description"
              rows={4}
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            name="visibility"
            label="Visibility"
            initialValue="public"
            rules={[{ required: true, message: 'Please select visibility' }]}
          >
            <Select
              options={[
                { value: 'public', label: 'Public' },
                { value: 'private', label: 'Private' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowCreateForm(false)
                  form.resetFields()
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={operation.loading}
              >
                Create Roadmap
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add Item to Roadmap"
        open={showAddItemsModal}
        onCancel={() => {
          setShowAddItemsModal(false)
          addItemsForm.resetFields()
        }}
        footer={null}
        width={700}
      >
        <Form form={addItemsForm} layout="vertical" onFinish={handleAddItem}>
          <Form.Item
            name="itemType"
            label="Item Type"
            rules={[{ required: true, message: 'Please select item type' }]}
          >
            <Select
              placeholder="Select item type (Lesson or Problem)"
              options={[
                { value: 'lesson', label: 'Lesson' },
                { value: 'problem', label: 'Problem' },
              ]}
              onChange={() => {
                addItemsForm.setFieldValue('itemId', undefined)
              }}
            />
          </Form.Item>

          <Form.Item
            name="itemId"
            label="Select Item"
            rules={[{ required: true, message: 'Please select an item' }]}
          >
            <Select
              placeholder="Select a lesson or problem..."
              loading={lessonsLoading || problemsLoading}
            >
              {selectedItemType === 'lesson' && (
                <>
                  {lessonsList.map((lesson: unknown) => (
                    <Select.Option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </Select.Option>
                  ))}
                </>
              )}
              {selectedItemType === 'problem' && (
                <>
                  {problemsList.map((problem: unknown) => (
                    <Select.Option key={problem.id} value={problem.id}>
                      {problem.title}
                    </Select.Option>
                  ))}
                </>
              )}
            </Select>
          </Form.Item>

          <Form.Item
            name="order"
            label="Order (Optional)"
            rules={[{ type: 'number', message: 'Please enter a valid number' }]}
          >
            <Input type="number" placeholder="Default: 1" min={1} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowAddItemsModal(false)
                  addItemsForm.resetFields()
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={addItemsLoading}
              >
                Add Item
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ManageRoadmap
