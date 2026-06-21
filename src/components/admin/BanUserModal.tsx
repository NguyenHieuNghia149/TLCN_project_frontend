import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { asyncBanUser, clearBanError } from '@/store/slices/adminSlice'
import { RootState, AppDispatch } from '@/store/stores'
import { Modal, Input, Typography, Alert } from 'antd'

const { Text } = Typography
const { TextArea } = Input

interface BanUserModalProps {
  isOpen: boolean
  userId?: string
  userName?: string
  onClose: () => void
  onSuccess?: () => void
}

const BAN_REASON_MIN_LENGTH = 10
const BAN_REASON_MAX_LENGTH = 500

export const BanUserModal: React.FC<BanUserModalProps> = ({
  isOpen,
  userId,
  userName,
  onClose,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { banOperation } = useSelector((state: RootState) => state.admin)
  const [reason, setReason] = useState('')
  const [validationError, setValidationError] = useState('')

  const validateReason = (value: string): boolean => {
    if (value.length < BAN_REASON_MIN_LENGTH) {
      setValidationError(
        `Reason must be at least ${BAN_REASON_MIN_LENGTH} characters`
      )
      return false
    }
    if (value.length > BAN_REASON_MAX_LENGTH) {
      setValidationError(
        `Reason must not exceed ${BAN_REASON_MAX_LENGTH} characters`
      )
      return false
    }
    setValidationError('')
    return true
  }

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setReason(value)
    if (value) {
      validateReason(value)
    } else {
      setValidationError('')
    }
  }

  const handleBan = async () => {
    if (!userId) return
    if (!validateReason(reason)) return

    dispatch(asyncBanUser({ userId, reason })).then(action => {
      if (action.type === asyncBanUser.fulfilled.type) {
        setReason('')
        setValidationError('')
        onSuccess?.()
        onClose()
      }
    })
  }

  const handleCloseModal = () => {
    dispatch(clearBanError())
    setReason('')
    setValidationError('')
    onClose()
  }

  const isDisabled =
    banOperation.loading ||
    !reason ||
    reason.length < BAN_REASON_MIN_LENGTH ||
    reason.length > BAN_REASON_MAX_LENGTH

  return (
    <Modal
      title="Ban User"
      open={isOpen}
      onCancel={handleCloseModal}
      onOk={handleBan}
      okText={banOperation.loading ? 'Banning...' : 'Confirm Ban'}
      okButtonProps={{
        danger: true,
        disabled: isDisabled,
        loading: banOperation.loading,
      }}
      cancelButtonProps={{
        disabled: banOperation.loading,
      }}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Text>
          Are you sure you want to ban <Text strong>{userName}</Text>?
        </Text>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Ban Reason ({reason.length}/{BAN_REASON_MAX_LENGTH})
        </Text>
      </div>

      <TextArea
        value={reason}
        onChange={handleReasonChange}
        placeholder="Enter the reason for banning this user..."
        rows={4}
        maxLength={BAN_REASON_MAX_LENGTH}
        disabled={banOperation.loading}
        status={validationError ? 'error' : undefined}
      />

      {validationError && (
        <Text
          type="danger"
          style={{ fontSize: 12, display: 'block', marginTop: 4 }}
        >
          {validationError}
        </Text>
      )}

      <Text
        type="secondary"
        style={{ fontSize: 11, display: 'block', marginTop: 4 }}
      >
        Reason must be between {BAN_REASON_MIN_LENGTH} and{' '}
        {BAN_REASON_MAX_LENGTH} characters
      </Text>

      {banOperation.error && (
        <Alert
          type="error"
          message={banOperation.error}
          style={{ marginTop: 12 }}
          showIcon
        />
      )}
    </Modal>
  )
}
