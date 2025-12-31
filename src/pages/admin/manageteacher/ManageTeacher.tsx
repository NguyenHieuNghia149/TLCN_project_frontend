import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Card,
  Space,
  App,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  Tag,
  DatePicker,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import { PlusOutlined, EditOutlined, UserOutlined } from '@ant-design/icons'
import { apiClient } from '@/config/axios.config'
import dayjs from 'dayjs'

interface ApiResponse {
  data?:
    | {
        data?: Array<ApiUserData>
        pagination?: { total?: number }
      }
    | Array<ApiUserData>
  pagination?: { total?: number }
  total?: number
}

interface ApiUserData {
  id: string
  firstName?: string
  lastName?: string
  email: string
  status?: 'active' | 'banned'
  createdAt?: string
  gender?: string
  dateOfBirth?: string
  lastLoginAt?: string
}

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  createdAt?: string
  status?: 'active' | 'banned'
  gender?: string
  dateOfBirth?: string
  lastLoginAt?: string
  firstName?: string
  lastName?: string
}

const ManageTeacher: React.FC = () => {
  const [teachers, setTeachers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [form] = Form.useForm()

  const { notification } = App.useApp()

  const fetchTeachers = React.useCallback(
    async (page: number = 1, pageSize: number = 10, search?: string) => {
      setLoading(true)
      try {
        const res = await apiClient.get<ApiResponse>('/admin/users', {
          params: {
            page,
            limit: pageSize,
            search: search || undefined,
            role: 'teacher',
          },
        })
        const payload = res.data?.data || res.data
        const userData: ApiUserData[] = Array.isArray(payload)
          ? payload
          : (
              payload as {
                data?: ApiUserData[]
                pagination?: { total?: number }
              }
            )?.data || []
        const totalCount =
          res.data?.pagination?.total ||
          res.data?.total ||
          (payload && !Array.isArray(payload)
            ? (payload as { pagination?: { total?: number } }).pagination?.total
            : undefined) ||
          userData.length

        const items: UserItem[] = (userData as ApiUserData[]).map(
          (u: ApiUserData) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: 'teacher',
            status: u.status || 'active',
            createdAt: u.createdAt,
            gender: u.gender,
            dateOfBirth: u.dateOfBirth,
            lastLoginAt: u.lastLoginAt,
          })
        )

        setTeachers(items)
        setPagination({
          current: page,
          pageSize: pageSize,
          total: totalCount,
        })
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        notification.error({
          message: 'Error',
          description:
            err?.response?.data?.message || 'Failed to fetch teachers',
          placement: 'topRight',
        })
      } finally {
        setLoading(false)
      }
    },
    [notification]
  )

  useEffect(() => {
    fetchTeachers(pagination.current, pagination.pageSize, searchText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    const newPage = newPagination.current || 1
    const newPageSize = newPagination.pageSize || 10
    fetchTeachers(newPage, newPageSize, searchText)
  }

  const onSearch = (value: string) => {
    setSearchText(value)
    fetchTeachers(1, pagination.pageSize, value)
  }

  const onCreate = () => {
    setEditing(null)
    form.resetFields()
    setShowForm(true)
  }

  const onEdit = (teacher: UserItem) => {
    setEditing(teacher)
    form.setFieldsValue({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      status: teacher.status,
      gender: teacher.gender || undefined,
      dateOfBirth: teacher.dateOfBirth ? dayjs(teacher.dateOfBirth) : undefined,
    })
    setShowForm(true)
  }

  const handleFormSubmit = async (values: {
    firstName: string
    lastName: string
    email: string
    status: 'active' | 'banned'
    password?: string
    gender?: string
    dateOfBirth?: dayjs.Dayjs
  }) => {
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: 'teacher',
        status: values.status,
        gender: values.gender || undefined,
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.toISOString()
          : undefined,
        ...(editing ? {} : { password: values.password }),
      }

      if (editing) {
        await apiClient.put(`/admin/users/${editing.id}`, payload)
        notification.success({
          message: 'Success',
          description: 'Teacher updated successfully',
          placement: 'topRight',
        })
      } else {
        await apiClient.post(`/admin/users`, payload)
        notification.success({
          message: 'Success',
          description: 'Teacher created successfully',
          placement: 'topRight',
        })
      }

      setShowForm(false)
      setEditing(null)
      form.resetFields()
      fetchTeachers(pagination.current, pagination.pageSize, searchText)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      notification.error({
        message: 'Error',
        description: err.response?.data?.message || 'Failed to save teacher',
        placement: 'topRight',
      })
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => gender || '-',
    },
    {
      title: 'Date of Birth',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: 'active' | 'banned') => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: UserItem) => (
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1
          className="whitespace-nowrap text-2xl font-bold transition-colors duration-300"
          style={{ color: 'var(--text-color)' }}
        >
          <UserOutlined className="mr-2" />
          Manage Teachers
        </h1>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="w-full max-w-md">
            <Input.Search
              placeholder="Search by name, email..."
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
            New Teacher
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
          dataSource={teachers}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editing ? 'Edit Teacher' : 'Create Teacher'}
        open={showForm}
        onCancel={() => {
          setShowForm(false)
          setEditing(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            status: 'active',
          }}
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[{ required: true, message: 'Please enter first name' }]}
          >
            <Input placeholder="Enter first name" />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[{ required: true, message: 'Please enter last name' }]}
          >
            <Input placeholder="Enter last name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item name="gender" label="Gender">
            <Select placeholder="Select gender" allowClear>
              <Select.Option value="male">Male</Select.Option>
              <Select.Option value="female">Female</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="dateOfBirth" label="Date of Birth">
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="banned">Banned</Select.Option>
            </Select>
          </Form.Item>

          {!editing && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password placeholder="Enter password (min 8 characters)" />
            </Form.Item>
          )}

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
    </div>
  )
}

export default ManageTeacher
