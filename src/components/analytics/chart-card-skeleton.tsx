/**
 * ChartCardSkeleton — skeleton loading placeholder for chart cards.
 * Shows animated pulse placeholders matching the card layout.
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[250px] w-full rounded-md" />
      </CardContent>
    </Card>
  )
}

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function StaffKpiGridSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ProductStatsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <KpiGridSkeleton />
      {Array.from({ length: 6 }, (_, i) => (
        <ChartCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StaffStatsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <StaffKpiGridSkeleton />
      {Array.from({ length: 3 }, (_, i) => (
        <ChartCardSkeleton key={i} />
      ))}
    </div>
  )
}
