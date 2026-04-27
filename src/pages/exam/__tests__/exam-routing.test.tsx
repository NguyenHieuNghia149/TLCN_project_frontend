// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import router from '@/routes'

type RouteLike = {
  path?: string
  children?: RouteLike[]
}

function flattenPaths(routes: RouteLike[]): string[] {
  const result: string[] = []

  const visit = (nodes: RouteLike[]) => {
    for (const node of nodes) {
      if (typeof node.path === 'string') {
        result.push(node.path)
      }
      if (Array.isArray(node.children) && node.children.length > 0) {
        visit(node.children)
      }
    }
  }

  visit(routes)
  return result
}

describe('exam routing contract', () => {
  it('contains canonical learner and admin exam routes', () => {
    const routePaths = new Set(
      flattenPaths((router as unknown as { routes: RouteLike[] }).routes)
    )

    const requiredPaths = [
      'exam',
      'exam/:examSlug',
      'exam/:examSlug/entry',
      'exam/:id/manage',
      'exam/:examSlug/challenges/:challengeId',
      'exam/:examSlug/results',
      'admin/exams',
      'admin/exams/create',
      'admin/exams/edit/:id',
      'admin/exams/:id/results',
    ]

    for (const path of requiredPaths) {
      expect(routePaths.has(path)).toBe(true)
    }
  })

  it('keeps legacy compatibility routes and blocks obsolete learner edit route', () => {
    const routePaths = new Set(
      flattenPaths((router as unknown as { routes: RouteLike[] }).routes)
    )

    expect(routePaths.has('exam/:examId/results/manage')).toBe(true)
    expect(routePaths.has('exam/:examId/results')).toBe(true)
    expect(routePaths.has('exam/:examId/challenge/:challengeId')).toBe(true)
    expect(routePaths.has('exam/edit/:id')).toBe(false)
  })
})
