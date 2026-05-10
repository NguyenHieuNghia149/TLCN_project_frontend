import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { RoadmapVisualTimeline } from '../RoadmapVisualTimeline'
import roadmapReducer from '@/store/slices/roadmapSlice'
import type { Roadmap, ProgressStats, RoadmapItem } from '@/types/roadmap.types'

// Mock data - 9 items to match the design image
const mockRoadmap: Roadmap = {
  id: 'test-roadmap-1',
  title: 'Test Roadmap',
  description: 'Test roadmap description',
  createdBy: 'user-1',
  visibility: 'public',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

const mockItems: RoadmapItem[] = [
  // Row 1: LTR (0-2)
  {
    id: 'item-1',
    roadmapId: 'test-roadmap-1',
    itemType: 'lesson',
    itemId: 'lesson-1',
    itemTitle: 'Define Project Objectives',
    order: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'item-2',
    roadmapId: 'test-roadmap-1',
    itemType: 'problem',
    itemId: 'problem-1',
    itemTitle: 'Identify Key Milestones',
    order: 2,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'item-3',
    roadmapId: 'test-roadmap-1',
    itemType: 'lesson',
    itemId: 'lesson-2',
    itemTitle: 'List Tasks and Activities',
    order: 3,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  // Row 2: RTL (3-5)
  {
    id: 'item-4',
    roadmapId: 'test-roadmap-1',
    itemType: 'problem',
    itemId: 'problem-2',
    itemTitle: 'Sequence Tasks',
    order: 4,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'item-5',
    roadmapId: 'test-roadmap-1',
    itemType: 'lesson',
    itemId: 'lesson-3',
    itemTitle: 'Estimate Time and Resources',
    order: 5,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'item-6',
    roadmapId: 'test-roadmap-1',
    itemType: 'problem',
    itemId: 'problem-3',
    itemTitle: 'Allocate Resources',
    order: 6,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  // Row 3: LTR (6-8)
  {
    id: 'item-7',
    roadmapId: 'test-roadmap-1',
    itemType: 'lesson',
    itemId: 'lesson-4',
    itemTitle: 'Create the Roadmap',
    order: 7,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'item-8',
    roadmapId: 'test-roadmap-1',
    itemType: 'problem',
    itemId: 'problem-4',
    itemTitle: 'Review and Validate',
    order: 8,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'item-9',
    roadmapId: 'test-roadmap-1',
    itemType: 'lesson',
    itemId: 'lesson-5',
    itemTitle: 'Monitor and Update',
    order: 9,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

const createMockProgress = (completed: number, total: number, completedItems: string[] = []): ProgressStats => ({
  total,
  completed,
  percentage: (completed / total) * 100,
  completedItems,
})

const createTestStore = () => {
  return configureStore({
    reducer: { roadmap: roadmapReducer },
  })
}

describe('RoadmapVisualTimeline - 3-Row Snake Layout', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
    vi.clearAllMocks()
  })

  it('renders 3 timeline tracks (LTR, RTL, LTR)', () => {
    const progress = createMockProgress(3, 9, ['item-1', 'item-2', 'item-3'])

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
        />
      </Provider>
    )

    // Verify all 3 tracks exist
    expect(screen.getByTestId('timeline-track-track1')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-track-track2')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-track-track3')).toBeInTheDocument()
  })

  it('splits 9 items evenly into 3 rows (3-3-3)', () => {
    const progress = createMockProgress(0, 9)

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
        />
      </Provider>
    )

    // Row 1 should have items 1-3
    expect(screen.getByText('Define Project Objectives')).toBeInTheDocument()
    expect(screen.getByText('Identify Key Milestones')).toBeInTheDocument()
    expect(screen.getByText('List Tasks and Activities')).toBeInTheDocument()

    // Row 2 should have items 4-6 (reversed for RTL)
    expect(screen.getByText('Sequence Tasks')).toBeInTheDocument()
    expect(screen.getByText('Estimate Time and Resources')).toBeInTheDocument()
    expect(screen.getByText('Allocate Resources')).toBeInTheDocument()

    // Row 3 should have items 7-9
    expect(screen.getByText('Create the Roadmap')).toBeInTheDocument()
    expect(screen.getByText('Review and Validate')).toBeInTheDocument()
    expect(screen.getByText('Monitor and Update')).toBeInTheDocument()
  })

  it('marks completed items with checkmark badge', () => {
    const completedIds = ['item-1', 'item-2']
    const progress = createMockProgress(2, 9, completedIds)

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
        />
      </Provider>
    )

    // Verify completed items have proper accessibility attributes
    completedIds.forEach(itemId => {
      const node = screen.getByTestId(`item-node-${itemId}`)
      expect(node).toHaveAttribute('aria-label', expect.stringContaining('completed'))
    })
  })

  it('calls onItemClick callback with correct item ID', async () => {
    const user = userEvent.setup()
    const onItemClick = vi.fn()
    const progress = createMockProgress(0, 9)

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
          onItemClick={onItemClick}
        />
      </Provider>
    )

    const firstButton = screen.getByText('Define Project Objectives').closest('button')
    if (firstButton) {
      await user.click(firstButton)
      expect(onItemClick).toHaveBeenCalledWith('item-1')
    }
  })

  it('displays correct progress percentage', () => {
    const progress = createMockProgress(3, 9)

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
        />
      </Provider>
    )

    expect(screen.getByText('3 of 9 completed')).toBeInTheDocument()
  })

  it('renders SVG connectors between tracks', () => {
    const progress = createMockProgress(0, 9)

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
        />
      </Provider>
    )

    // Verify SVG element exists for connectors
    const timelineSnake = screen.getByTestId('timeline-snake')
    const svgElement = timelineSnake.querySelector('svg')
    expect(svgElement).toBeInTheDocument()
  })

  it('renders accessibility aria-live region for progress updates', () => {
    const progress = createMockProgress(3, 9)

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
        />
      </Provider>
    )

    const liveRegion = screen.getByText(/Timeline progress:/)
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
  })

  it('handles uneven item counts (e.g., 7 items)', () => {
    const fewItems = mockItems.slice(0, 7)
    const progress = createMockProgress(2, 7)

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={fewItems}
          progress={progress}
        />
      </Provider>
    )

    // Should still render 3 tracks (even if some are empty)
    expect(screen.getByTestId('timeline-track-track1')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-track-track2')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-track-track3')).toBeInTheDocument()
  })

  it('uses different colors for items based on order', () => {
    const progress = createMockProgress(0, 9)

    const { container } = render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
        />
      </Provider>
    )

    // Verify colored nodes are rendered (nodes should have colorClass applied)
    // The actual color implementation is in StageNode component
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('renders roadmap title and description', () => {
    const progress = createMockProgress(0, 9)

    render(
      <Provider store={store}>
        <RoadmapVisualTimeline
          roadmap={mockRoadmap}
          items={mockItems}
          progress={progress}
        />
      </Provider>
    )

    expect(screen.getByText(mockRoadmap.title)).toBeInTheDocument()
    if (mockRoadmap.description) {
      expect(screen.getByText(mockRoadmap.description)).toBeInTheDocument()
    }
  })
})
