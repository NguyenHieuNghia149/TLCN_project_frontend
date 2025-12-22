import React from 'react'
import { Button, Modal } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const TestDelete: React.FC = () => {
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Test Delete Modal',
      content: `Are you sure you want to delete exam ${id}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        alert('Delete confirmed!')
      },
      onCancel: () => {
        // User cancelled
      },
    })
  }

  return (
    <div style={{ padding: 50 }}>
      <h1>Test Delete Button</h1>
      <Button
        type="primary"
        danger
        icon={<DeleteOutlined />}
        onClick={() => {
          alert('Button clicked!')
          handleDelete('test-exam-123')
        }}
      >
        Test Delete
      </Button>
    </div>
  )
}

export default TestDelete
