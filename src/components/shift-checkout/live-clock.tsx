import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { cn } from '@/lib/cn'

interface LiveClockProps {
  readonly className?: string
}

export function LiveClock({ className }: LiveClockProps) {
  const [time, setTime] = useState(() => dayjs().format('HH:mm:ss'))

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs().format('HH:mm:ss'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      data-testid="live-clock"
      className={cn('font-mono text-xl text-muted-foreground', className)}
    >
      {time}
    </div>
  )
}
