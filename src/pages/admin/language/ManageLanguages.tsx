import React, { useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Input,
  InputNumber,
  Space,
  Switch,
  Table,
  Typography,
} from 'antd'

import { useAdminLanguages, useUpdateLanguage } from '@/hooks/api/useLanguages'
import type { LanguageCatalogEntry } from '@/types/language.types'

type EditableLanguage = {
  displayName: string
  isActive: boolean
  sortOrder: number
}

const ManageLanguages: React.FC = () => {
  const { notification, modal } = App.useApp()
  const { data: languages = [], isLoading } = useAdminLanguages()
  const updateLanguageMutation = useUpdateLanguage()
  const [drafts, setDrafts] = useState<Record<string, EditableLanguage>>({})

  useEffect(() => {
    setDrafts(
      languages.reduce<Record<string, EditableLanguage>>(
        (accumulator, language) => {
          accumulator[language.id] = {
            displayName: language.displayName,
            isActive: language.isActive,
            sortOrder: language.sortOrder,
          }
          return accumulator
        },
        {}
      )
    )
  }, [languages])

  const handleDraftChange = (id: string, patch: Partial<EditableLanguage>) => {
    setDrafts(previous => ({
      ...previous,
      [id]: {
        displayName: previous[id]?.displayName ?? '',
        isActive: previous[id]?.isActive ?? false,
        sortOrder: previous[id]?.sortOrder ?? 0,
        ...patch,
      },
    }))
  }

  const handleSave = async (language: LanguageCatalogEntry) => {
    const draft = drafts[language.id]
    if (!draft) {
      return
    }

    try {
      await updateLanguageMutation.mutateAsync({
        id: language.id,
        payload: draft,
      })
      notification.success({
        message: 'Language updated',
        description: `${language.key} has been saved.`,
        placement: 'topRight',
      })
    } catch (error) {
      notification.error({
        message: 'Update failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update the language catalog entry.',
        placement: 'topRight',
      })
    }
  }

  const rows = useMemo(
    () =>
      languages.map(language => {
        const draft = drafts[language.id] ?? {
          displayName: language.displayName,
          isActive: language.isActive,
          sortOrder: language.sortOrder,
        }

        return {
          ...language,
          draft,
        }
      }),
    [drafts, languages]
  )

  return (
    <div className="min-h-screen bg-background p-6 transition-colors duration-300">
      <div className="mb-4">
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          Manage Languages
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Toggle executable languages and control how they appear in the editor,
          submit flow, and multilingual solutions.
        </Typography.Paragraph>
      </div>

      <Card className="border-border bg-card transition-colors duration-300">
        <Table
          rowKey="id"
          loading={isLoading}
          pagination={false}
          dataSource={rows}
          columns={[
            {
              title: 'Key',
              dataIndex: 'key',
              key: 'key',
              width: 160,
              render: (value: string) => (
                <Typography.Text code>{value}</Typography.Text>
              ),
            },
            {
              title: 'Display Name',
              key: 'displayName',
              render: (
                _,
                record: LanguageCatalogEntry & { draft: EditableLanguage }
              ) => (
                <Input
                  value={record.draft.displayName}
                  onChange={event =>
                    handleDraftChange(record.id, {
                      displayName: event.target.value,
                    })
                  }
                />
              ),
            },
            {
              title: 'Sort Order',
              key: 'sortOrder',
              width: 180,
              render: (
                _,
                record: LanguageCatalogEntry & { draft: EditableLanguage }
              ) => (
                <InputNumber
                  min={0}
                  value={record.draft.sortOrder}
                  onChange={value =>
                    handleDraftChange(record.id, {
                      sortOrder: typeof value === 'number' ? value : 0,
                    })
                  }
                />
              ),
            },
            {
              title: 'Active',
              key: 'isActive',
              width: 160,
              render: (
                _,
                record: LanguageCatalogEntry & { draft: EditableLanguage }
              ) => (
                <Switch
                  checked={record.draft.isActive}
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                  onChange={checked => {
                    if (checked && !record.isActive) {
                      modal.confirm({
                        title: 'Activate language?',
                        content: `Activating ${record.displayName} will require future challenge solution edits to include code for this language.`,
                        onOk: () => {
                          handleDraftChange(record.id, { isActive: true })
                        },
                      })
                      return
                    }

                    handleDraftChange(record.id, { isActive: checked })
                  }}
                />
              ),
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 140,
              render: (
                _,
                record: LanguageCatalogEntry & { draft: EditableLanguage }
              ) => (
                <Space>
                  <Button
                    type="primary"
                    loading={updateLanguageMutation.isPending}
                    onClick={() => void handleSave(record)}
                  >
                    Save
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default ManageLanguages
