import { ClockIn } from '@/components/clock-in'
import { AppErrorBoundary } from '@/components/app-error-boundary'

export function ClockInPage() {
  return (
    <div>
      {/* ClockIn component with module-level error boundary */}
      <AppErrorBoundary title="打卡頁面發生錯誤">
        <ClockIn />
      </AppErrorBoundary>
    </div>
  )
}
