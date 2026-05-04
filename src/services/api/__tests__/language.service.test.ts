import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock, putMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
}))

vi.mock('@/config/axios.config', () => ({
  apiClient: {
    get: getMock,
    put: putMock,
  },
}))

import { languageService } from '@/services/api/language.service'

describe('languageService', () => {
  beforeEach(() => {
    getMock.mockReset()
    putMock.mockReset()
  })

  it('loads active executable languages for the public app', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: '1',
            key: 'cpp',
            displayName: 'C++',
            isActive: true,
            sortOrder: 0,
          },
          {
            id: '2',
            key: 'java',
            displayName: 'Java',
            isActive: true,
            sortOrder: 1,
          },
        ],
      },
    })

    await expect(languageService.getLanguages()).resolves.toEqual([
      { id: '1', key: 'cpp', displayName: 'C++', isActive: true, sortOrder: 0 },
      {
        id: '2',
        key: 'java',
        displayName: 'Java',
        isActive: true,
        sortOrder: 1,
      },
    ])

    expect(getMock).toHaveBeenCalledWith('/languages')
  })

  it('loads the full language catalog for admin pages', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: '1',
            key: 'cpp',
            displayName: 'C++',
            isActive: true,
            sortOrder: 0,
          },
          {
            id: '4',
            key: 'go',
            displayName: 'Go',
            isActive: false,
            sortOrder: 3,
          },
        ],
      },
    })

    await expect(languageService.getAdminLanguages()).resolves.toEqual([
      { id: '1', key: 'cpp', displayName: 'C++', isActive: true, sortOrder: 0 },
      { id: '4', key: 'go', displayName: 'Go', isActive: false, sortOrder: 3 },
    ])

    expect(getMock).toHaveBeenCalledWith('/admin/languages')
  })

  it('updates admin-managed language flags and labels', async () => {
    putMock.mockResolvedValueOnce({
      data: {
        id: '2',
        key: 'java',
        displayName: 'Java 21',
        isActive: false,
        sortOrder: 5,
      },
    })

    await expect(
      languageService.updateLanguage('2', {
        displayName: 'Java 21',
        isActive: false,
        sortOrder: 5,
      })
    ).resolves.toEqual({
      id: '2',
      key: 'java',
      displayName: 'Java 21',
      isActive: false,
      sortOrder: 5,
    })

    expect(putMock).toHaveBeenCalledWith('/admin/languages/2', {
      displayName: 'Java 21',
      isActive: false,
      sortOrder: 5,
    })
  })
})
