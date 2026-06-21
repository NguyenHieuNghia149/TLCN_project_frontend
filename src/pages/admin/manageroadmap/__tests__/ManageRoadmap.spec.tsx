// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { App as AntApp } from 'antd'

import ManageRoadmap from '@/pages/admin/manageroadmap/ManageRoadmap'
import adminRoadmapsReducer from '@/store/slices/adminRoadmapSlice'

vi.mock('@/services/api/adminRoadmap.service', async () => {
  return {
    adminRoadmapAPI: {
      listRoadmaps: vi.fn().mockResolvedValue({
        success: true,
        data: {
          roadmaps: [
            {
              id: 'r1',
              title: 'Roadmap 1',
              description: null,
              createdBy: 'u1',
              visibility: 'public',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
              creatorEmail: null,
              creatorFirstName: null,
              creatorLastName: null,
              itemCount: 0,
            },
          ],
          pagination: { limit: 20, offset: 0, total: 1 },
        },
      }),
      updateVisibility: vi.fn(),
      deleteRoadmap: vi.fn(),
      getRoadmapDetail: vi.fn(),
    },
  }
})

describe('ManageRoadmap page', () => {
  beforeAll(() => {
    // antd relies on matchMedia for responsive hooks
    if (!window.matchMedia) {
      window.matchMedia = (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList
    }

    // jsdom doesn't support getComputedStyle with pseudo-elements (antd sometimes calls it)
    const original = window.getComputedStyle
    window.getComputedStyle = ((elt: Element) =>
      original(elt)) as unknown as typeof window.getComputedStyle
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders list after load', async () => {
    const store = configureStore({
      reducer: { adminRoadmaps: adminRoadmapsReducer },
    })

    render(
      <Provider store={store}>
        <AntApp>
          <ManageRoadmap />
        </AntApp>
      </Provider>
    )

    expect(await screen.findByText('Roadmap 1')).toBeTruthy()
  })
})
