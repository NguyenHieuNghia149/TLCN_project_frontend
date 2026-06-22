// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const indexCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const mainLayoutCss = readFileSync(
  resolve(process.cwd(), 'src/layouts/MainLayout/MainLayout.scss'),
  'utf8'
)
const mainLayoutTsx = readFileSync(
  resolve(process.cwd(), 'src/layouts/MainLayout/MainLayout.tsx'),
  'utf8'
)

function normalizeCss(source: string): string {
  return source.replace(/\s+/g, '')
}

function getRuleBlocks(source: string): string[] {
  return normalizeCss(source)
    .split('}')
    .map(block => `${block}}`)
    .filter(block => block !== '}')
}

describe('global layout styles', () => {
  it('does not make the body a flex layout container', () => {
    const bodyRule = getRuleBlocks(indexCss).find(block =>
      block.startsWith('body{')
    )

    expect(bodyRule).toBeDefined()
    expect(bodyRule).not.toContain('display:flex;')
    expect(bodyRule).not.toContain('place-items:center;')
  })

  it('does not lock #root to 100% height', () => {
    const layoutRules = getRuleBlocks(mainLayoutCss).filter(
      block =>
        block.includes('#root{') ||
        block.startsWith('html,body{') ||
        block.startsWith('html,body,#root{')
    )

    expect(layoutRules).not.toHaveLength(0)
    expect(layoutRules.some(block => /(^|[;{])height:100%;/.test(block))).toBe(
      false
    )
  })

  it('separates the breadcrumb from the outlet body container', () => {
    expect(mainLayoutTsx).toContain('className="main-layout-body"')
  })

  it('does not make the main layout content its own vertical scroller', () => {
    const mainContentRule = getRuleBlocks(mainLayoutCss).find(block =>
      block.startsWith('.main-layout-content{')
    )

    expect(mainContentRule).toBeDefined()
    expect(mainContentRule).not.toContain('overflow-y:auto;')
    expect(mainContentRule).not.toContain('overflow:auto;')
  })
})
