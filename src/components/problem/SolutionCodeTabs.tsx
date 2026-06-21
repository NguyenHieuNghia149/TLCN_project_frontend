import React, { useEffect, useMemo, useState } from 'react'
import hljs from 'highlight.js/lib/common'
import { Check, Copy, Expand, Minimize2 } from 'lucide-react'

import type { CodeVariant } from '@/types/challenge.types'

import './SolutionCodeTabs.css'

type SolutionCodeTabsProps = {
  codeVariants: CodeVariant[]
  languageLabels?: Record<string, string>
  preferredLanguage?: string
}

const HIGHLIGHT_LANGUAGE_MAP: Record<string, string> = {
  cpp: 'cpp',
  cplusplus: 'cpp',
  java: 'java',
  python: 'python',
  py: 'python',
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  csharp: 'csharp',
  cs: 'csharp',
  go: 'go',
  golang: 'go',
  kotlin: 'kotlin',
  swift: 'swift',
  rust: 'rust',
}

function resolveInitialLanguage(
  codeVariants: CodeVariant[],
  preferredLanguage?: string
): string {
  if (
    preferredLanguage &&
    codeVariants.some(variant => variant.language === preferredLanguage)
  ) {
    return preferredLanguage
  }

  return codeVariants[0]?.language ?? ''
}

function resolveHighlightLanguage(language: string): string | undefined {
  return HIGHLIGHT_LANGUAGE_MAP[language] ?? (language || undefined)
}

function highlightCode(sourceCode: string, language: string): string {
  const resolvedLanguage = resolveHighlightLanguage(language)

  if (resolvedLanguage) {
    try {
      return hljs.highlight(sourceCode, {
        language: resolvedLanguage,
        ignoreIllegals: true,
      }).value
    } catch {
      // Fall through to auto highlighting.
    }
  }

  return hljs.highlightAuto(sourceCode).value
}

const SolutionCodeTabs: React.FC<SolutionCodeTabsProps> = ({
  codeVariants,
  languageLabels,
  preferredLanguage,
}) => {
  const [activeLanguage, setActiveLanguage] = useState(() =>
    resolveInitialLanguage(codeVariants, preferredLanguage)
  )
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    setActiveLanguage(resolveInitialLanguage(codeVariants, preferredLanguage))
  }, [codeVariants, preferredLanguage])

  useEffect(() => {
    if (!isExpanded) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  const activeVariant = useMemo(
    () =>
      codeVariants.find(variant => variant.language === activeLanguage) ??
      codeVariants[0],
    [activeLanguage, codeVariants]
  )

  const highlightedCode = useMemo(() => {
    if (!activeVariant) {
      return ''
    }

    return highlightCode(activeVariant.sourceCode, activeVariant.language)
  }, [activeVariant])

  if (!activeVariant) {
    return null
  }

  const handleCopyCode = async () => {
    if (!navigator.clipboard?.writeText) {
      return
    }

    await navigator.clipboard.writeText(activeVariant.sourceCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const renderViewer = (expanded: boolean) => (
    <div
      className={`solution-code-tabs__shell ${expanded ? 'solution-code-tabs__shell--expanded' : ''}`}
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded || undefined}
      aria-label={expanded ? 'Solution code viewer' : undefined}
    >
      <div className="solution-code-tabs__header">
        <div className="solution-code-tabs__tab-strip" role="tablist">
          {codeVariants.map(variant => {
            const isActive = variant.language === activeVariant.language
            const label = languageLabels?.[variant.language] ?? variant.language

            return (
              <button
                key={variant.language}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-pressed={isActive}
                onClick={() => setActiveLanguage(variant.language)}
                className={`solution-code-tabs__tab ${isActive ? 'solution-code-tabs__tab--active' : ''}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="solution-code-tabs__toolbar">
          <button
            type="button"
            className="solution-code-tabs__icon-button"
            onClick={() => setIsExpanded(open => !open)}
            aria-label={expanded ? 'Exit fullscreen' : 'Expand code viewer'}
            title={expanded ? 'Exit fullscreen' : 'Expand code viewer'}
          >
            {expanded ? <Minimize2 size={18} /> : <Expand size={18} />}
          </button>
        </div>
      </div>

      <div className="solution-code-tabs__panel">
        <button
          type="button"
          className="solution-code-tabs__copy-button"
          onClick={() => void handleCopyCode()}
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>

        <pre className="solution-code-tabs__pre">
          <code
            className={`hljs solution-code-tabs__code language-${activeVariant.language}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  )

  return (
    <>
      {renderViewer(false)}
      {isExpanded && (
        <>
          <button
            type="button"
            className="solution-code-tabs__backdrop"
            aria-label="Close fullscreen code viewer"
            onClick={() => setIsExpanded(false)}
          />
          {renderViewer(true)}
        </>
      )}
    </>
  )
}

export default SolutionCodeTabs
