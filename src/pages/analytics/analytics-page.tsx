/**
 * AnalyticsPage — main statistics page.
 * Hosts the tab bar (product/staff) and date picker,
 * then conditionally renders the appropriate stats section.
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useDbQuery } from '@/hooks/use-db-query'
import { getShiftCheckoutRepo } from '@/lib/repositories/provider'
import { AnalyticsTabBar } from '@/components/analytics/analytics-tab-bar'
import { AnalyticsDatePicker } from '@/components/analytics/analytics-date-picker'
import { ProductKpiGrid } from '@/components/analytics/product-stats/product-kpi-grid'
import { RevenueTimeSeriesChart } from '@/components/analytics/product-stats/revenue-time-series-chart'
import { OrderTimeChart } from '@/components/analytics/product-stats/order-time-chart'
import { Bottom10Bentos } from '@/components/analytics/product-stats/bottom5-bentos'
import { Top10ProductsChart } from '@/components/analytics/product-stats/top10-products-chart'
import { CategorySalesChart } from '@/components/analytics/product-stats/category-sales-chart'
import { RevenueComparisonChart } from '@/components/analytics/product-stats/revenue-comparison-chart'
import { AvgOrderValueChart } from '@/components/analytics/product-stats/avg-order-value-chart'
import { ProductTrendChart } from '@/components/analytics/product-stats/product-trend-chart'
import { RevenueHeatmap } from '@/components/analytics/product-stats/revenue-heatmap'
import { OrderNotesChart } from '@/components/analytics/product-stats/order-notes-chart'
import { DeliveryOrdersChart } from '@/components/analytics/product-stats/delivery-orders-chart'
import { ProfitStubChart } from '@/components/analytics/product-stats/profit-stub-chart'
import { StaffStats } from '@/components/analytics/staff-stats/staff-stats'
import { ProductStatsSkeleton } from '@/components/analytics/chart-card-skeleton'
import { useProductChartData } from '@/hooks/use-product-chart-data'
import type { AnalyticsTab } from '@/components/analytics/analytics-tab-bar'
import type { StatisticsRepository } from '@/lib/repositories/statistics-repository'

// ─── ProductStats ─────────────────────────────────────────────────────────────

interface ProductStatsProps {
  startDate: Date
  endDate: Date
  /** Repository for KPI queries. Required; caller must supply a valid instance. */
  statisticsRepo: StatisticsRepository
}

function ProductStats({
  startDate,
  endDate,
  statisticsRepo,
}: ProductStatsProps) {
  const { t } = useTranslation()
  const data = useProductChartData({ startDate, endDate, statisticsRepo })

  // Fetch checkout data for the selected date range
  const dateKey = useMemo(
    () => dayjs(startDate).format('YYYY-MM-DD'),
    [startDate],
  )
  const checkouts = useDbQuery(
    () => getShiftCheckoutRepo().findByDate(dateKey),
    [dateKey],
    [],
  )

  if (data.loading) {
    return (
      <section aria-label={t('analytics.productStats')}>
        <ProductStatsSkeleton />
      </section>
    )
  }

  return (
    <section
      aria-label={t('analytics.productStats')}
      className="flex flex-col gap-6"
    >
      {data.error !== null && (
        <p className="text-destructive text-base">{data.error}</p>
      )}

      {data.kpis !== null && (
        <ProductKpiGrid kpis={data.kpis} checkouts={checkouts} />
      )}

      <RevenueTimeSeriesChart data={data.amPmRevenue} />

      <OrderTimeChart data={data.hourlyData} />

      <RevenueHeatmap
        data={data.heatmapData}
        year={data.currentYear}
        month={data.currentMonth}
      />

      <Top10ProductsChart
        items={data.topItems}
        sortBy={data.sortBy}
        onSortChange={data.onSortChange}
      />

      {data.commodityTypes.map(ct => {
        const salesRows = data.categorySalesData[ct.typeId] ?? []
        return (
          <CategorySalesChart
            key={ct.typeId}
            title={`${ct.label}${t('analytics.salesStatsSuffix')}`}
            data={salesRows}
          />
        )
      })}

      <RevenueComparisonChart
        currentData={data.dailyRevenue}
        prevData={data.prevMonthData}
      />

      <AvgOrderValueChart data={data.avgOrderValue} />

      {data.commodities.length > 0 && (
        <ProductTrendChart
          data={data.productTrendData}
          commodities={data.commodities}
          commodityTypes={data.commodityTypes}
          selectedId={data.selectedCommodityId}
          onSelectChange={data.onSelectCommodityChange}
        />
      )}

      <OrderNotesChart data={data.orderNotes} />

      <DeliveryOrdersChart data={data.deliveryProducts} />

      <ProfitStubChart />

      {data.bottomBentos.length > 0 && (
        <Bottom10Bentos items={data.bottomBentos} />
      )}
    </section>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AnalyticsPageProps {
  /**
   * Statistics repository for product KPI queries.
   * When omitted, the component attempts to use getStatisticsRepo() from the
   * global provider. Tests should always supply this prop to avoid the
   * provider singleton.
   */
  statisticsRepo?: StatisticsRepository
}

/**
 * Analytics page scaffold: tab bar + date picker + conditional stats sections.
 * Default date is today (single day).
 */
export function AnalyticsPage({
  statisticsRepo: repoProp,
}: AnalyticsPageProps = {}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('product')
  const [startDate, setStartDate] = useState<Date>(
    dayjs().startOf('day').toDate(),
  )
  const [endDate, setEndDate] = useState<Date>(dayjs().endOf('day').toDate())
  const [dynamicRepo, setDynamicRepo] = useState<StatisticsRepository | null>(
    null,
  )
  const [providerError, setProviderError] = useState<string | null>(null)

  // Lazily resolve the global singleton on first render when no prop is given.
  useEffect(() => {
    if (repoProp !== undefined) return
    import('@/lib/repositories/provider')
      .then(({ getStatisticsRepo }) => {
        try {
          setDynamicRepo(getStatisticsRepo())
        } catch (err) {
          setProviderError(
            err instanceof Error
              ? err.message
              : t('analytics.providerInitError'),
          )
        }
      })
      .catch(() => {
        setProviderError(t('analytics.providerLoadError'))
      })
  }, [repoProp, t])

  // repoProp always takes precedence; fall back to the lazily resolved singleton.
  const resolvedRepo = repoProp ?? dynamicRepo

  function handleDateChange(start: Date, end: Date) {
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <AnalyticsTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <AnalyticsDatePicker
        startDate={startDate}
        endDate={endDate}
        onChange={handleDateChange}
      />

      {activeTab === 'product' ? (
        providerError !== null ? (
          <section aria-label={t('analytics.productStats')}>
            <p className="text-destructive text-base">{providerError}</p>
          </section>
        ) : resolvedRepo !== null ? (
          <ProductStats
            startDate={startDate}
            endDate={endDate}
            statisticsRepo={resolvedRepo}
          />
        ) : (
          <section aria-label={t('analytics.productStats')} />
        )
      ) : providerError !== null ? (
        <section aria-label={t('analytics.staffStats')}>
          <p className="text-destructive text-base">{providerError}</p>
        </section>
      ) : resolvedRepo !== null ? (
        <StaffStats
          startDate={startDate}
          endDate={endDate}
          statisticsRepo={resolvedRepo}
        />
      ) : (
        <section aria-label={t('analytics.staffStats')} />
      )}
    </div>
  )
}
