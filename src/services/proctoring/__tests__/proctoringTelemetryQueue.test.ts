import { describe, expect, it, vi } from 'vitest'

import {
  ProctoringTelemetryQueue,
  sanitizeProctoringPayload,
} from '@/services/proctoring/proctoringTelemetryQueue'

describe('ProctoringTelemetryQueue', () => {
  it('keeps ordered metadata in a bounded queue and drops oldest overflow', () => {
    const queue = new ProctoringTelemetryQueue({
      participationId: 'participation-1',
      clientSessionId: 'client-1',
      maxSize: 2,
      now: () => new Date('2026-06-12T10:00:00.000Z'),
    })

    queue.enqueue('focus_lost', { reason: 'blur' })
    queue.enqueue('visibility_hidden', { state: 'hidden' })
    queue.enqueue('network_offline', { online: false })

    expect(queue.snapshot()).toMatchObject([
      {
        clientSeq: 2,
        capturedAt: '2026-06-12T10:00:00.000Z',
        buffered: true,
        payloadJson: { eventName: 'visibility_hidden', state: 'hidden' },
      },
      {
        clientSeq: 3,
        capturedAt: '2026-06-12T10:00:00.000Z',
        buffered: true,
        payloadJson: { eventName: 'network_offline', online: false },
      },
    ])
    expect(queue.droppedCount).toBe(1)
  })

  it('removes raw clipboard, media, keystroke, and source code fields', () => {
    expect(
      sanitizeProctoringPayload({
        eventName: 'paste',
        clipboardText: 'secret',
        rawClipboardText: 'secret',
        sourceCode: 'return 1',
        nested: {
          media: 'blob',
          keyContent: 'A',
          safe: 'metadata',
        },
      })
    ).toEqual({
      eventName: 'paste',
      nested: {
        safe: 'metadata',
      },
    })
  })

  it('flushes through websocket first and keeps events for HTTP fallback when websocket fails', async () => {
    const queue = new ProctoringTelemetryQueue({
      participationId: 'participation-1',
      clientSessionId: 'client-1',
      now: () => new Date('2026-06-12T10:00:00.000Z'),
    })
    queue.enqueue('paste', { textLength: 12 })

    const wsFlush = vi.fn().mockResolvedValue(false)
    const httpFlush = vi.fn().mockResolvedValue({ receiptId: 'receipt-1' })

    const result = await queue.finalFlush({
      submitAttemptId: 'attempt-1',
      wsFlush,
      httpFlush,
    })

    expect(wsFlush).toHaveBeenCalledWith(
      expect.objectContaining({
        submitAttemptId: 'attempt-1',
        expectedEventCount: 1,
        firstClientSeq: 1,
        lastClientSeq: 1,
      })
    )
    expect(httpFlush).toHaveBeenCalledWith(
      expect.objectContaining({
        submitAttemptId: 'attempt-1',
        events: [
          expect.objectContaining({
            clientSeq: 1,
            payloadJson: { eventName: 'paste', textLength: 12 },
          }),
        ],
      })
    )
    expect(result).toEqual({ finalFlushReceiptId: 'receipt-1' })
  })
})
