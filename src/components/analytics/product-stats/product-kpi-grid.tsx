/**
 * ProductKpiGrid — 3-column × 2-row grid of 6 product KPI cards.
 * All numeric values animate via NumberTicker.
 */

import { useTranslation } from 'react-i18next'
import type { ProductKpis } from '@/lib/repositories/statistics-repository'
import { NumberTicker } from '@/components/ui/number-ticker'
import { formatCurrency } from '@/lib/currency'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductKpiGridProps {
  kpis: ProductKpis
}

// ─── TWD ticker ───────────────────────────────────────────────────────────────

interface TwdTickerProps {
  value: number
  testId: string
}

function TwdTicker({ value, testId }: TwdTickerProps) {
  return <span data-testid={testId}>{formatCurrency(value)}</span>
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Displays all 6 product KPIs in a responsive 3-column grid.
 */
export function ProductKpiGrid({ kpis }: ProductKpiGridProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Row 1 — revenue KPIs */}

      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('analytics.totalRevenue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-(--color-gold)">
            <TwdTicker value={kpis.totalRevenue} testId="kpi-totalRevenue" />
          </div>
        </CardContent>
      </Card>

      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('analytics.orderCount')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">
            <span data-testid="kpi-orderCount">
              <NumberTicker value={kpis.orderCount} />
            </span>
          </div>
        </CardContent>
      </Card>

      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('analytics.morningRevenue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-(--color-gold)">
            <TwdTicker
              value={kpis.morningRevenue}
              testId="kpi-morningRevenue"
            />
          </div>
        </CardContent>
      </Card>

      {/* Row 2 */}

      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('analytics.afternoonRevenue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-(--color-gold)">
            <TwdTicker
              value={kpis.afternoonRevenue}
              testId="kpi-afternoonRevenue"
            />
          </div>
        </CardContent>
      </Card>

      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('analytics.totalQuantity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">
            <span data-testid="kpi-totalQuantity">
              <NumberTicker value={kpis.totalQuantity} />
            </span>
          </div>
        </CardContent>
      </Card>

      <Card shadow className="py-4">
        <CardHeader className="py-0">
          <CardTitle fontSize="text-md" className="text-muted-foreground">
            {t('analytics.bentoQuantity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl">
            <span data-testid="kpi-bentoQuantity">
              <NumberTicker value={kpis.bentoQuantity} />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
