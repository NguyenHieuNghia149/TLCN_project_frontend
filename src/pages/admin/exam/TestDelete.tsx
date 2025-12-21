import React from 'react'
import { Button, Modal } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const TestDelete: React.FC = () => {
  const handleDelete = (id: string) => {
    console.log('🔴 DELETE FUNCTION CALLED:', id)
    Modal.confirm({
      title: 'Test Delete Modal',
      content: `Are you sure you want to delete exam ${id}?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        console.log('✅ User confirmed delete')
        alert('Delete confirmed!')
      },
      onCancel: () => {
        console.log('❌ User cancelled')
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
          console.log('🟢 BUTTON CLICKED')
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
