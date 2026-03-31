import { notify } from '@/components/ui/sonner'

/**
 * Custom hook providing toast notification methods.
 * Wraps custom notification toast with typed success/error/info variants.
 *
 * Usage:
 *   const { success, error, info } = useToast()
 *   success('Operation completed')
 */
export function useToast() {
  return {
    success: (message: string) => notify.success(message),
    error: (message: string) => notify.error(message),
    info: (message: string) => notify.info(message),
  } as const
}
