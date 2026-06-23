// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const socketMock = vi.hoisted(() => ({
  connected: false,
  auth: {},
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}))

const ioMock = vi.hoisted(() => vi.fn(() => socketMock))

vi.mock('socket.io-client', () => ({
  io: ioMock,
}))

import { ProctoringSocketClient } from '@/services/proctoring/proctoringSocketClient'

describe('ProctoringSocketClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    socketMock.connected = false
    socketMock.auth = {}
  })

  it('passes the proctoring token through Socket.IO auth and emits hello without token payload', () => {
    let connectHandler: (() => void) | undefined
    socketMock.on.mockImplementation((event: string, handler: () => void) => {
      if (event === 'connect') {
        connectHandler = handler
      }
      return socketMock
    })

    const client = new ProctoringSocketClient({
      baseURL: 'http://localhost:3001/api',
    })

    client.connect(
      {
        participationId: 'participation-1',
        clientSessionId: 'client-1',
        userId: 'candidate-1',
        lastSeenClientSeq: 0,
      },
      { proctoringToken: 'socket-token-1' }
    )

    expect(ioMock).toHaveBeenCalledWith('http://localhost:3001/proctoring', {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.5,
      auth: { proctoringToken: 'socket-token-1' },
    })
    expect(socketMock.connect).toHaveBeenCalledTimes(1)

    connectHandler?.()

    expect(socketMock.emit).toHaveBeenCalledWith('session.hello', {
      participationId: 'participation-1',
      clientSessionId: 'client-1',
      userId: 'candidate-1',
      lastSeenClientSeq: 0,
    })
  })
})
