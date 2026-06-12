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

function resolveSocketBaseURL(baseURL: string): string {
  try {
    const url = new URL(baseURL)
    url.pathname = url.pathname.replace(/\/api\/?$/, '')
    return url.toString().replace(/\/$/, '')
  } catch {
    return baseURL.replace(/\/api\/?$/, '').replace(/\/$/, '')
  }
}

export class ProctoringSocketClient {
  private socket: Socket | null = null
  private readonly baseURL: string
  private readonly timeoutMs: number
  private lastHello: SessionHelloPayload | null = null

  constructor(options: ProctoringSocketClientOptions = {}) {
    this.baseURL = resolveSocketBaseURL(options.baseURL ?? API_CONFIG.baseURL)
    this.timeoutMs = options.timeoutMs ?? 3000
  }

  get connected(): boolean {
    return Boolean(this.socket?.connected)
  }

  connect(hello: SessionHelloPayload): void {
    this.lastHello = hello
    if (!this.socket) {
      this.socket = io(`${this.baseURL}/proctoring`, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionDelayMax: 8000,
        randomizationFactor: 0.5,
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
    }

    if (!this.socket.connected) {
      this.socket.connect()
      return
    }

    this.socket.emit('session.hello', hello)
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  async sendBatch(events: ProctoringTelemetryFrame[]): Promise<boolean> {
    if (!events.length) {
      return true
    }
    return this.emitWithAck('telemetry.batch', { events })
  }

  async sendUrgent(event: ProctoringTelemetryFrame): Promise<boolean> {
    return this.emitWithAck('telemetry.urgent', { event })
  }

  async requestFinalFlush(
    request: ProctoringFinalFlushRequest
  ): Promise<boolean | string> {
    const accepted = await this.emitWithAck('final_flush.request', request)
    return accepted
  }

  private emitWithAck(eventName: string, payload: unknown): Promise<boolean> {
    if (!this.socket?.connected) {
      return Promise.resolve(false)
    }

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
      const onAck = () => finish(true)
      const onRetry = () => finish(false)
      const timeoutId = window.setTimeout(() => finish(false), this.timeoutMs)

      this.socket?.once('telemetry.ack', onAck)
      this.socket?.once('telemetry.retry_required', onRetry)
      this.socket?.emit(eventName, payload)
    })
  }
}
