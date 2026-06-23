import { io, type Socket } from 'socket.io-client'

import { API_CONFIG } from '@/config/api.config'
import type {
  ProctoringFinalFlushRequest,
  ProctoringTelemetryFrame,
} from '@/services/proctoring/proctoringTelemetryQueue'

type ProctoringSocketClientOptions = {
  baseURL?: string
  timeoutMs?: number
}

type SessionHelloPayload = {
  participationId: string
  clientSessionId: string
  userId: string
  lastSeenClientSeq: number
}

type ConnectOptions = {
  proctoringToken: string
}

function resolveSocketBaseURL(baseURL: string): string {
  try {
    const url = new URL(baseURL)
    url.pathname = url.pathname.replace(/\/api\/?$/, '')
    return url.toString().replace(/\/$/, '')
  } catch {
    return baseURL.replace(/\/api\/?$/, '').replace(/\/$/, '')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export class ProctoringSocketClient {
  private socket: Socket | null = null
  private readonly baseURL: string
  private readonly timeoutMs: number
  private lastHello: SessionHelloPayload | null = null
  private sessionRejectedListener: (() => void) | null = null

  constructor(options: ProctoringSocketClientOptions = {}) {
    this.baseURL = resolveSocketBaseURL(options.baseURL ?? API_CONFIG.baseURL)
    this.timeoutMs = options.timeoutMs ?? 3000
  }

  get connected(): boolean {
    return Boolean(this.socket?.connected)
  }

  connect(hello: SessionHelloPayload, options: ConnectOptions): void {
    this.lastHello = hello
    if (!this.socket) {
      this.socket = io(`${this.baseURL}/proctoring`, {
        transports: ['websocket', 'polling'],
        path: '/api/socket.io',
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 8000,
        randomizationFactor: 0.5,
        auth: {
          proctoringToken: options.proctoringToken,
        },
      })

      this.socket.on('connect', () => {
        if (this.lastHello) {
          this.socket?.emit('session.hello', this.lastHello)
        }
      })
      this.socket.on('connect_error', () => {
        // Reconnection is handled by Socket.IO; callers keep local buffering.
      })
      this.socket.on('disconnect', () => {
        // Disconnects are retryable for the candidate UI.
      })
      this.socket.on('session.rejected', () => {
        this.sessionRejectedListener?.()
      })
    } else {
      this.socket.auth = {
        ...(this.socket.auth as Record<string, unknown> | undefined),
        proctoringToken: options.proctoringToken,
      }
    }

    if (!this.socket.connected) {
      this.socket.connect()
      return
    }

    this.socket.emit('session.hello', hello)
  }

  onSessionRejected(listener: () => void): void {
    this.sessionRejectedListener = listener
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  async sendBatch(events: ProctoringTelemetryFrame[]): Promise<boolean> {
    if (!events.length) {
      return true
    }
    const lastClientSeq = events.reduce(
      (max, e) => Math.max(max, e.clientSeq),
      0
    )
    return this.emitWithAck('telemetry.batch', { events }, lastClientSeq)
  }

  async sendUrgent(event: ProctoringTelemetryFrame): Promise<boolean> {
    return this.emitWithAck('telemetry.urgent', { event }, event.clientSeq)
  }

  async requestFinalFlush(
    request: ProctoringFinalFlushRequest
  ): Promise<boolean | string> {
    const accepted = await this.emitWithAck(
      'final_flush.request',
      request,
      request.lastClientSeq ?? undefined
    )
    return accepted
  }

  private emitWithAck(
    eventName: string,
    payload: unknown,
    lastClientSeq?: number
  ): Promise<boolean> {
    if (!this.socket?.connected) {
      return Promise.resolve(false)
    }

    const nonce = crypto.randomUUID()

    return new Promise(resolve => {
      let settled = false
      const finish = (value: boolean) => {
        if (settled) return
        settled = true
        this.socket?.off('telemetry.ack', onAck)
        this.socket?.off('telemetry.retry_required', onRetry)
        window.clearTimeout(timeoutId)
        resolve(value)
      }

      const isOwnResponse = (p: unknown): boolean => {
        if (!isRecord(p) || typeof p.nonce !== 'string') return true
        return p.nonce === nonce
      }

      const onAck = (ackPayload: unknown) => {
        if (!isOwnResponse(ackPayload)) {
          return
        }
        if (
          lastClientSeq !== undefined &&
          isRecord(ackPayload) &&
          typeof ackPayload.lastClientSeq === 'number' &&
          ackPayload.lastClientSeq < lastClientSeq
        ) {
          return
        }
        finish(true)
      }
      const onRetry = (retryPayload: unknown) => {
        if (!isOwnResponse(retryPayload)) {
          return
        }
        if (
          lastClientSeq !== undefined &&
          isRecord(retryPayload) &&
          typeof retryPayload.lastClientSeq === 'number' &&
          retryPayload.lastClientSeq < lastClientSeq
        ) {
          return
        }
        finish(false)
      }
      const timeoutId = window.setTimeout(() => finish(false), this.timeoutMs)

      this.socket?.on('telemetry.ack', onAck)
      this.socket?.on('telemetry.retry_required', onRetry)
      this.socket?.emit(eventName, {
        ...(payload as Record<string, unknown>),
        nonce,
      })
    })
  }
}
