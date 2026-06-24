export type SummarySection = {
  key: 'overview' | 'timeline' | 'missing'
  title: string
  lines: string[]
}

type TimelineItem = {
  eventId: string
  eventName: string
  capturedAt: string | null
}

type RiskFact = {
  type: string
  count: number
  totalDurationMs: number
  evidenceEventIds: string[]
}

type Citation = {
  eventId: string
  reason: string
}

export type BuildLlmNarrativeSummaryInput = {
  summaryText?: string | null
  riskFacts?: RiskFact[]
  citations?: Citation[]
  missingDataNotes?: string[]
  timeline?: TimelineItem[]
}

const SUMMARY_SECTION_PATTERNS: Array<{
  key: SummarySection['key']
  title: string
  pattern: RegExp
}> = [
  {
    key: 'overview',
    title: 'Overview',
    pattern: /(Review these signals:|Can xem lai(?: cac)? tin hieu sau:)/i,
  },
  {
    key: 'timeline',
    title: 'Timeline highlights',
    pattern: /(Timeline highlights:|Moc thoi gian noi bat:)/i,
  },
  {
    key: 'missing',
    title: 'Missing data',
    pattern: /(Missing data:|Du lieu con thieu:)/i,
  },
]

const GENERIC_SUMMARY_PHRASES = [
  'anomaly facts',
  'exam with id',
  'summary for the exam',
  'anomaly summary',
]

const EVENT_LABELS: Record<string, string> = {
  focus_lost: 'focus lost',
  focus_returned: 'focus returned',
  visibility_hidden: 'visibility hidden',
  visibility_visible: 'visibility visible',
  fullscreen_exit: 'fullscreen exited',
  fullscreen_enter: 'fullscreen entered',
  clipboard_event: 'clipboard event',
  camera_stopped: 'camera stopped',
  camera_started: 'camera started',
  camera_track_muted: 'camera muted',
  camera_track_unmuted: 'camera resumed',
  camera_permission_denied: 'camera permission denied',
  camera_error: 'camera error',
  screen_share_ended: 'screen share ended',
  screen_share_started: 'screen share started',
  bypass_code_used: 'bypass code used',
  heartbeat: 'heartbeat',
}

function splitSummaryLines(value: string) {
  return value
    .split(';')
    .map(line => line.trim())
    .filter(Boolean)
}

function humanizeSignalName(value: string) {
  return EVENT_LABELS[value] ?? value.replace(/_/g, ' ').trim()
}

function formatEventTime(value: string | null) {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  const yyyy = parsed.getUTCFullYear()
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(parsed.getUTCDate()).padStart(2, '0')
  const hh = String(parsed.getUTCHours()).padStart(2, '0')
  const mi = String(parsed.getUTCMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}

function joinNaturalLanguage(parts: string[]) {
  if (parts.length === 0) {
    return ''
  }
  if (parts.length === 1) {
    return parts[0] ?? ''
  }
  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`
  }
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
}

function looksLikeStructuredEvidenceText(summaryText: string) {
  return SUMMARY_SECTION_PATTERNS.some(section =>
    section.pattern.test(summaryText)
  )
}

function shouldReuseSourceSummary(summaryText: string) {
  const normalized = summaryText.trim()
  if (!normalized) {
    return false
  }
  if (looksLikeStructuredEvidenceText(normalized)) {
    return false
  }
  const lowered = normalized.toLowerCase()
  return !GENERIC_SUMMARY_PHRASES.some(phrase => lowered.includes(phrase))
}

function toNarrativeFact(fact: RiskFact) {
  const label = humanizeSignalName(fact.type)
  const eventLabel = fact.count === 1 ? 'event' : 'events'
  return `${fact.count} ${label} ${eventLabel}`
}

export function parseLlmSummarySections(text: string): SummarySection[] {
  const normalized = text.trim()
  if (!normalized) {
    return []
  }

  const matches = SUMMARY_SECTION_PATTERNS.flatMap(section => {
    const match = section.pattern.exec(normalized)
    if (!match || typeof match.index !== 'number') {
      return []
    }
    return [{ ...section, index: match.index, matchedText: match[0] }]
  }).sort((a, b) => a.index - b.index)

  if (matches.length === 0) {
    return [
      {
        key: 'overview',
        title: 'Overview',
        lines: [normalized],
      },
    ]
  }

  const sections: SummarySection[] = []
  const leadingText = normalized.slice(0, matches[0]!.index).trim()
  if (leadingText) {
    sections.push({
      key: 'overview',
      title: 'Overview',
      lines: [leadingText],
    })
  }

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index]!
    const next = matches[index + 1]
    const start = current.index + current.matchedText.length
    const end = next ? next.index : normalized.length
    const content = normalized.slice(start, end).trim()
    if (!content) {
      continue
    }

    const lines = splitSummaryLines(content)
    if (lines.length === 0) {
      continue
    }

    const existing = sections.find(section => section.key === current.key)
    if (existing) {
      existing.lines.push(...lines)
      continue
    }

    sections.push({
      key: current.key,
      title: current.title,
      lines,
    })
  }

  return sections
}

export function buildLlmNarrativeSummary(
  input: BuildLlmNarrativeSummaryInput
): string {
  const summaryText = input.summaryText?.trim() ?? ''
  if (shouldReuseSourceSummary(summaryText)) {
    return summaryText
  }

  const facts = [...(input.riskFacts ?? [])]
    .filter(fact => fact.count > 0)
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.totalDurationMs - a.totalDurationMs ||
        a.type.localeCompare(b.type)
    )
    .slice(0, 3)

  const timeline = [...(input.timeline ?? [])].sort((a, b) =>
    String(a.capturedAt ?? '').localeCompare(String(b.capturedAt ?? ''))
  )
  const timelineLookup = new Map(timeline.map(item => [item.eventId, item]))
  const citations = input.citations ?? []
  const missingDataNotes = (input.missingDataNotes ?? []).filter(Boolean)

  const sentences: string[] = []

  if (facts.length > 0) {
    sentences.push(
      `This session recorded ${joinNaturalLanguage(
        facts.map(toNarrativeFact)
      )}.`
    )
  } else if (timeline.length > 0) {
    sentences.push(
      'No structured risk facts were extracted, but the timeline still contains reviewable events.'
    )
  } else {
    sentences.push(
      'No structured risk facts were extracted from the available telemetry.'
    )
  }

  const highlightSegments: string[] = []
  const seen = new Set<string>()
  for (const citation of citations) {
    if (seen.has(citation.eventId)) {
      continue
    }
    seen.add(citation.eventId)
    const item = timelineLookup.get(citation.eventId)
    if (!item) {
      continue
    }
    const time = formatEventTime(item.capturedAt)
    const label = humanizeSignalName(item.eventName)
    highlightSegments.push(time ? `${time} ${label}` : label)
    if (highlightSegments.length >= 2) {
      break
    }
  }

  if (highlightSegments.length === 0) {
    for (const item of timeline.slice(0, 2)) {
      const time = formatEventTime(item.capturedAt)
      const label = humanizeSignalName(item.eventName)
      highlightSegments.push(time ? `${time} ${label}` : label)
      if (highlightSegments.length >= 2) {
        break
      }
    }
  }

  if (highlightSegments.length > 0) {
    sentences.push(
      `Key moments included ${joinNaturalLanguage(highlightSegments)}.`
    )
  }

  if (missingDataNotes.length > 0) {
    sentences.push(
      `Some evidence was unavailable: ${missingDataNotes.slice(0, 2).join('; ')}.`
    )
  }

  sentences.push(
    'Use the evidence details below to confirm whether follow-up is needed.'
  )

  return sentences.join(' ').trim()
}
