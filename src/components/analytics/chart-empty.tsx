/**
 * ChartEmpty — empty state placeholder for charts with no data.
 * Displays a ChartSpline icon with a message prompting the user
 * to select a different date range.
 */

import { useTranslation } from 'react-i18next'
import { ChartSpline } from 'lucide-react'

export function ChartEmpty() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-10">
      <ChartSpline className="h-12 w-12 text-muted-foreground/40" />
      <p className="text-base text-muted-foreground">
        {t('analytics.noChartData')}
      </p>
      <p className="text-muted-foreground/60">
        {t('analytics.noChartDataDesc')}
      </p>
    </div>
  )
}
