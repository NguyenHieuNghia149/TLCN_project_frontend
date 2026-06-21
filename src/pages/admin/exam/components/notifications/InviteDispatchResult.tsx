import React from 'react'
import { Alert, Button, Card, List, Space, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

export type InviteDispatchSummary = {
  total: number
  sent: number
  failed: number
  failedParticipantIds: string[]
  failedRecipients: string[]
}

type InviteDispatchResultProps = {
  summary: InviteDispatchSummary
  loading: boolean
  onRetryFailed: () => void
}

const InviteDispatchResult: React.FC<InviteDispatchResultProps> = ({
  summary,
  loading,
  onRetryFailed,
}) => {
  return (
    <Card className="mb-6" title="Last dispatch summary">
      <Space direction="vertical" className="w-full">
        <Typography.Text>
          Total: <strong>{summary.total}</strong>
        </Typography.Text>
        <Typography.Text>
          Sent: <strong>{summary.sent}</strong>
        </Typography.Text>
        <Typography.Text>
          Failed: <strong>{summary.failed}</strong>
        </Typography.Text>

        {summary.failed > 0 ? (
          <>
            <Alert
              type="warning"
              showIcon
              message="Some invites failed"
              description="Failed recipients are listed below. Successful deliveries were kept."
            />
            <List
              size="small"
              bordered
              dataSource={summary.failedRecipients}
              renderItem={item => <List.Item>{item}</List.Item>}
            />
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onRetryFailed}
            >
              Retry failed only
            </Button>
          </>
        ) : null}
      </Space>
    </Card>
  )
}

export default InviteDispatchResult
