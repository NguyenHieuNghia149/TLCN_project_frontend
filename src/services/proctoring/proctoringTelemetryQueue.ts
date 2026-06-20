export type ProctoringTelemetrySeverity = 'info' | 'warning' | 'critical'

export type ProctoringClientEventName =
  | 'focus_lost'
  | 'focus_returned'
  | 'visibility_hidden'
  | 'visibility_visible'
  | 'fullscreen_exit'
  | 'fullscreen_enter'
  | 'camera_started'
  | 'camera_stopped'
  | 'camera_permission_denied'
  | 'camera_track_muted'
  | 'camera_track_unmuted'
  | 'camera_error'
  | 'screen_share_ended'
  | 'network_offline'
  | 'network_online'
  | 'heartbeat'
  | 'clipboard_event'
  | 'paste'

export type ProctoringTelemetryFrame = {
  type: 'telemetry.batch' | 'telemetry.urgent'
  participationId: string
  clientSessionId: string
  clientSeq: number
  capturedAt: string
  receivedAt: string
  schemaVersion: number
  severity: ProctoringTelemetrySeverity
  payloadJson: Record<string, unknown>
  entrySessionId?: string | null
  finalFlushReceiptId?: string | null
  buffered: boolean
}

export type ProctoringFinalFlushRequest = {
  participationId: string
  clientSessionId: string
  submitAttemptId: string
  finalFlushReceiptId?: string
  expectedEventCount: number
  acceptedCount: number
  firstClientSeq: number | null
  lastClientSeq: number | null
  capturedAt: string
  clientSeq: number
}

type QueueOptions = {
  participationId: string
  clientSessionId: string
  entrySessionId?: string | null
  maxSize?: number
  now?: () => Date
  initialClientSeq?: number
  onClientSeq?: (clientSeq: number) => void
}

type FinalFlushOptions = {
  submitAttemptId: string
  wsFlush?: (request: ProctoringFinalFlushRequest) => Promise<boolean | string>
  httpFlush?: (request: {
    clientSessionId: string
    submitAttemptId: string
    finalFlushReceiptId?: string
    events: ProctoringTelemetryFrame[]
    firstClientSeq: number | null
    lastClientSeq: number | null
    expectedEventCount: number
  }) => Promise<{ receiptId?: string; finalFlushReceiptId?: string } | void>
}

const forbiddenPayloadKeys = new Set([
  'rawmedia',
  'media',
  'imagedata',
  'videodata',
  'audiodata',
  'deviceid',
  'groupid',
  'label',
  'trackid',
  'clipboardtext',
  'rawclipboardtext',
  'text',
  'rawtext',
  'content',
  'keystrokes',
  'keystrokecontent',
  'keycontent',
  'sourcecode',
  'code',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizedKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isForbiddenKey(key: string) {
  return forbiddenPayloadKeys.has(normalizedKey(key))
}

export function sanitizeProctoringPayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return Object.entries(payload).reduce<Record<string, unknown>>(
    (sanitized, [key, value]) => {
      if (isForbiddenKey(key)) {
        return sanitized
      }

      if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          isRecord(item) ? sanitizeProctoringPayload(item) : item
        )
        return sanitized
      }

      if (isRecord(value)) {
        sanitized[key] = sanitizeProctoringPayload(value)
        return sanitized
      }

      sanitized[key] = value
      return sanitized
    },
    {}
  )
}

export class ProctoringTelemetryQueue {
  private readonly participationId: string
  private readonly clientSessionId: string
  private readonly entrySessionId: string | null
  private readonly maxSize: number
  private readonly now: () => Date
  private readonly onClientSeq?: (clientSeq: number) => void
  private events: ProctoringTelemetryFrame[] = []
  private nextClientSeq: number

  droppedCount = 0

  constructor(options: QueueOptions) {
    this.participationId = options.participationId
    this.clientSessionId = options.clientSessionId
    this.entrySessionId = options.entrySessionId ?? null
    this.maxSize = options.maxSize ?? 200
    this.now = options.now ?? (() => new Date())
    this.nextClientSeq = (options.initialClientSeq ?? 0) + 1
    this.onClientSeq = options.onClientSeq
  }

  enqueue(
    eventName: ProctoringClientEventName,
    payload: Record<string, unknown> = {},
    options: {
      severity?: ProctoringTelemetrySeverity
      type?: 'telemetry.batch' | 'telemetry.urgent'
    } = {}
  ): ProctoringTelemetryFrame {
    const capturedAt = this.now().toISOString()
    const clientSeq = this.nextClientSeq
    this.nextClientSeq += 1
    this.onClientSeq?.(clientSeq)

    const frame: ProctoringTelemetryFrame = {
      type: options.type ?? 'telemetry.batch',
      participationId: this.participationId,
      clientSessionId: this.clientSessionId,
      clientSeq,
      capturedAt,
      receivedAt: capturedAt,
      schemaVersion: 1,
      severity: options.severity ?? 'info',
      payloadJson: sanitizeProctoringPayload({
        eventName,
        ...payload,
      }),
      entrySessionId: this.entrySessionId,
      finalFlushReceiptId: null,
      buffered: true,
    }

    this.events.push(frame)
    while (this.events.length > this.maxSize) {
      this.events.shift()
      this.droppedCount += 1
    }

    return frame
  }

  snapshot(): ProctoringTelemetryFrame[] {
    return this.events.map(event => ({ ...event }))
  }

  clearThrough(clientSeq: number): void {
    this.events = this.events.filter(event => event.clientSeq > clientSeq)
  }

  clearAll(): void {
    this.events = []
  }

  async finalFlush(options: FinalFlushOptions): Promise<{
    finalFlushReceiptId?: string
  }> {
    const events = this.snapshot()
    const firstClientSeq = events[0]?.clientSeq ?? null
    const lastClientSeq = events[events.length - 1]?.clientSeq ?? null
    const flushSeq = this.nextClientSeq
    this.nextClientSeq += 1
    this.onClientSeq?.(flushSeq)

    const request: ProctoringFinalFlushRequest = {
      participationId: this.participationId,
      clientSessionId: this.clientSessionId,
      submitAttemptId: options.submitAttemptId,
      expectedEventCount: events.length,
      acceptedCount: 0,
      firstClientSeq,
      lastClientSeq,
      capturedAt: this.now().toISOString(),
      clientSeq: flushSeq,
    }

    if (options.wsFlush) {
      try {
        const wsResult = await options.wsFlush(request)
        if (typeof wsResult === 'string' && wsResult) {
          this.clearAll()
          return {
            finalFlushReceiptId: wsResult,
          }
        }
        if (wsResult === true && request.finalFlushReceiptId) {
          this.clearAll()
          return {
            finalFlushReceiptId: request.finalFlushReceiptId,
          }
        }
      } catch {
        // HTTP fallback below is the recovery path.
      }
    }

    if (!options.httpFlush) {
      return {}
    }

    const httpResult = await options.httpFlush({
      clientSessionId: this.clientSessionId,
      submitAttemptId: options.submitAttemptId,
      finalFlushReceiptId: request.finalFlushReceiptId,
      events,
      firstClientSeq,
      lastClientSeq,
      expectedEventCount: events.length,
    })
    const finalFlushReceiptId =
      httpResult?.finalFlushReceiptId ?? httpResult?.receiptId

    if (finalFlushReceiptId) {
      this.clearAll()
    }

    return {
      finalFlushReceiptId,
    }
  }
}
