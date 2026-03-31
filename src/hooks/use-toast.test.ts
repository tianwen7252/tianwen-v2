import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock notify
const mockNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  notify: mockNotify,
}))

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return success, error, and info methods', async () => {
    const { useToast } = await import('./use-toast')
    const { result } = renderHook(() => useToast())

    expect(typeof result.current.success).toBe('function')
    expect(typeof result.current.error).toBe('function')
    expect(typeof result.current.info).toBe('function')
  })

  it('should call notify.success with the provided message', async () => {
    const { useToast } = await import('./use-toast')
    const { result } = renderHook(() => useToast())

    result.current.success('Operation successful')

    expect(mockNotify.success).toHaveBeenCalledOnce()
    expect(mockNotify.success).toHaveBeenCalledWith('Operation successful')
  })

  it('should call notify.error with the provided message', async () => {
    const { useToast } = await import('./use-toast')
    const { result } = renderHook(() => useToast())

    result.current.error('Something went wrong')

    expect(mockNotify.error).toHaveBeenCalledOnce()
    expect(mockNotify.error).toHaveBeenCalledWith('Something went wrong')
  })

  it('should call notify.info with the provided message', async () => {
    const { useToast } = await import('./use-toast')
    const { result } = renderHook(() => useToast())

    result.current.info('Here is some information')

    expect(mockNotify.info).toHaveBeenCalledOnce()
    expect(mockNotify.info).toHaveBeenCalledWith('Here is some information')
  })

  it('should handle empty string messages', async () => {
    const { useToast } = await import('./use-toast')
    const { result } = renderHook(() => useToast())

    result.current.success('')
    result.current.error('')
    result.current.info('')

    expect(mockNotify.success).toHaveBeenCalledWith('')
    expect(mockNotify.error).toHaveBeenCalledWith('')
    expect(mockNotify.info).toHaveBeenCalledWith('')
  })

  it('should handle messages with special characters', async () => {
    const { useToast } = await import('./use-toast')
    const { result } = renderHook(() => useToast())

    const specialMessage = '員工已新增 (ID: #123) <script>alert("xss")</script>'
    result.current.success(specialMessage)

    expect(mockNotify.success).toHaveBeenCalledWith(specialMessage)
  })

  it('should handle Traditional Chinese messages', async () => {
    const { useToast } = await import('./use-toast')
    const { result } = renderHook(() => useToast())

    result.current.success('員工已新增')
    result.current.error('操作失敗')
    result.current.info('請確認資料')

    expect(mockNotify.success).toHaveBeenCalledWith('員工已新增')
    expect(mockNotify.error).toHaveBeenCalledWith('操作失敗')
    expect(mockNotify.info).toHaveBeenCalledWith('請確認資料')
  })
})
