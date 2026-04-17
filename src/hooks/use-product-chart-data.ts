/**
 * useProductChartData — custom hook that fetches all product chart data.
 * Extracted from ProductStats to keep the analytics page under 800 lines.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { formatWeekDays } from '@/lib/analytics/format-week-days'
import type {
  StatisticsRepository,
  ProductKpis,
  HourBucket,
  ProductRanking,
  DailyRevenue,
  AmPmRevenueRow,
  CategorySalesRow,
  OrderNoteCount,
  DeliveryProductRow,
} from '@/lib/repositories/statistics-repository'
import type { CommodityType } from '@/types/database'

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseProductChartDataParams {
  startDate: Date
  endDate: Date
  statisticsRepo: StatisticsRepository
  /** HH:mm cutoff for morning/evening split (from getEffectiveCutoff). */
  cutoffTime?: string
}

export interface ProductChartData {
  loading: boolean
  kpis: ProductKpis | null
  hourlyData: HourBucket[]
  topItems: ProductRanking[]
  bottomBentos: ProductRanking[]
  sortBy: 'quantity' | 'revenue'
  onSortChange: (value: 'quantity' | 'revenue') => void
  dailyRevenue: DailyRevenue[]
  prevMonthData: DailyRevenue[]
  avgOrderValue: DailyRevenue[]
  productTrendData: DailyRevenue[]
  commodities: Array<{ id: string; name: string; typeId: string }>
  selectedCommodityId: string
  onSelectCommodityChange: (id: string) => void
  heatmapData: DailyRevenue[]
  currentMonth: number
  currentYear: number
  error: string | null
  // New chart data (V2-95 through V2-100)
  amPmRevenue: AmPmRevenueRow[]
  categorySalesData: Record<string, CategorySalesRow[]>
  commodityTypes: CommodityType[]
  orderNotes: OrderNoteCount[]
  deliveryProducts: DeliveryProductRow[]
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProductChartData({
  startDate,
  endDate,
  statisticsRepo,
  cutoffTime,
}: UseProductChartDataParams): ProductChartData {
  const { t } = useTranslation()

  // Loading state
  const [loading, setLoading] = useState(true)

  // Existing states
  const [kpis, setKpis] = useState<ProductKpis | null>(null)
  const [hourlyData, setHourlyData] = useState<HourBucket[]>([])
  const [topItems, setTopItems] = useState<ProductRanking[]>([])
  const [bottomBentos, setBottomBentos] = useState<ProductRanking[]>([])
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('quantity')
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([])
  const [heatmapData, setHeatmapData] = useState<DailyRevenue[]>([])
  const [prevMonthData, setPrevMonthData] = useState<DailyRevenue[]>([])
  const [avgOrderValue, setAvgOrderValue] = useState<DailyRevenue[]>([])
  const [productTrendData, setProductTrendData] = useState<DailyRevenue[]>([])
  const [commodities, setCommodities] = useState<
    Array<{ id: string; name: string; typeId: string }>
  >([])
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // New states for V2-95 through V2-100 charts
  const [amPmRevenue, setAmPmRevenue] = useState<AmPmRevenueRow[]>([])
  const [categorySalesData, setCategorySalesData] = useState<
    Record<string, CategorySalesRow[]>
  >({})
  const [commodityTypes, setCommodityTypes] = useState<CommodityType[]>([])
  const [orderNotes, setOrderNotes] = useState<OrderNoteCount[]>([])
  const [deliveryProducts, setDeliveryProducts] = useState<
    DeliveryProductRow[]
  >([])

  // ── Main data fetch (date range dependent) ──────────────────────────────────

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setKpis(null)
    setHourlyData([])
    setBottomBentos([])
    setDailyRevenue([])
    setHeatmapData([])
    setPrevMonthData([])
    setAvgOrderValue([])
    setAmPmRevenue([])
    setOrderNotes([])
    setDeliveryProducts([])
    setError(null)

    const range = {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    }

    // Previous month range derived from the start of the current range.
    const prevStart = dayjs(startDate)
      .subtract(1, 'month')
      .startOf('month')
      .toDate()
    const prevEnd = dayjs(startDate)
      .subtract(1, 'month')
      .endOf('month')
      .toDate()
    const prevRange = {
      startDate: prevStart.getTime(),
      endDate: prevEnd.getTime(),
    }

    // Full-month range for the heatmap (always fetches entire month)
    const monthStart = dayjs(startDate).startOf('month').toDate()
    const monthEnd = dayjs(startDate).endOf('month').toDate()
    const monthRange = {
      startDate: monthStart.getTime(),
      endDate: monthEnd.getTime(),
    }

    Promise.all([
      statisticsRepo.getProductKpis(range, cutoffTime),
      statisticsRepo.getHourlyOrderDistribution(range),
      statisticsRepo.getBottomBentos(range, 10),
      statisticsRepo.getDailyRevenue(range),
      statisticsRepo.getDailyRevenue(prevRange),
      statisticsRepo.getAvgOrderValue(range),
      statisticsRepo.getAmPmRevenue(range),
      statisticsRepo.getOrderNotesDistribution(range),
      statisticsRepo.getDeliveryProductBreakdown(range),
      statisticsRepo.getDailyRevenue(monthRange),
    ])
      .then(
        ([
          kpisResult,
          hourlyResult,
          bottomResult,
          currentRev,
          prevRev,
          avgResult,
          amPmData,
          notesData,
          deliveryData,
          monthRevData,
        ]) => {
          if (cancelled) return
          setKpis(kpisResult)
          setHourlyData(hourlyResult)
          setBottomBentos(bottomResult)
          // Pad both series to fill the full date range.
          setDailyRevenue(formatWeekDays(currentRev, startDate, endDate))
          setPrevMonthData(formatWeekDays(prevRev, prevStart, prevEnd))
          setAvgOrderValue(formatWeekDays(avgResult, startDate, endDate))
          setHeatmapData(monthRevData)
          setAmPmRevenue(amPmData)
          setOrderNotes(notesData)
          setDeliveryProducts(deliveryData)
          setLoading(false)
        },
      )
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t('analytics.loadError'),
          )
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [statisticsRepo, startDate, endDate, cutoffTime, t])

  // ── Top products (sortBy dependent) ─────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    setTopItems([])

    const range = {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    }

    statisticsRepo
      .getTopProducts(range, 10, sortBy)
      .then(result => {
        if (!cancelled) setTopItems(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t('analytics.rankLoadError'),
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [statisticsRepo, startDate, endDate, sortBy, t])

  // ── Commodities list + commodity types (once on mount) ──────────────────────
  // Combined into a single effect to avoid multiple dynamic imports, which
  // improves both performance and testability.

  useEffect(() => {
    let cancelled = false
    import('@/lib/repositories/provider')
      .then(({ getCommodityRepo, getCommodityTypeRepo }) => {
        // Fetch both commodities and types in parallel
        const commoditiesPromise = ((): Promise<
          Array<{ id: string; name: string; typeId: string }>
        > => {
          try {
            return getCommodityRepo()
              .findOnMarket()
              .then(items =>
                items.map(c => ({ id: c.id, name: c.name, typeId: c.typeId })),
              )
          } catch {
            return Promise.resolve([])
          }
        })()

        const typesPromise = ((): Promise<CommodityType[]> => {
          try {
            return getCommodityTypeRepo().findAll()
          } catch {
            return Promise.resolve([])
          }
        })()

        return Promise.all([commoditiesPromise, typesPromise])
      })
      .then(([commodityList, typesList]) => {
        if (cancelled) return
        setCommodities(commodityList)
        if (commodityList.length > 0 && selectedCommodityId === '') {
          setSelectedCommodityId(commodityList[0]!.id)
        }
        setCommodityTypes(typesList)
      })
      .catch(() => {
        // Non-critical — charts simply show no data to pick from.
      })

    return () => {
      cancelled = true
    }
    // Run only once; selectedCommodityId intentionally omitted to avoid
    // re-running the import when the user changes the selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statisticsRepo])

  // ── Product trend data (commodity + date range dependent) ──────────────────

  useEffect(() => {
    if (!selectedCommodityId) return

    let cancelled = false
    setProductTrendData([])

    const range = {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    }

    statisticsRepo
      .getProductDailyRevenue(range, selectedCommodityId)
      .then(result => {
        if (!cancelled) {
          setProductTrendData(formatWeekDays(result, startDate, endDate))
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t('analytics.trendLoadError'),
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [statisticsRepo, startDate, endDate, selectedCommodityId, t])

  // ── Category sales per type (depends on commodity types + date range) ──────

  useEffect(() => {
    if (commodityTypes.length === 0) return

    let cancelled = false
    setCategorySalesData({})

    const range = {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    }

    const fetchAll = commodityTypes.map(ct =>
      statisticsRepo
        .getCategorySales(range, ct.typeId)
        .then(rows => ({ typeId: ct.typeId, rows })),
    )

    Promise.all(fetchAll)
      .then(results => {
        if (cancelled) return
        const data: Record<string, CategorySalesRow[]> = {}
        for (const { typeId, rows } of results) {
          data[typeId] = rows
        }
        setCategorySalesData(data)
      })
      .catch(() => {
        // Non-critical — category sales charts simply won't render.
      })

    return () => {
      cancelled = true
    }
  }, [statisticsRepo, startDate, endDate, commodityTypes])

  const currentMonth = startDate.getMonth() + 1
  const currentYear = startDate.getFullYear()

  return {
    loading,
    kpis,
    hourlyData,
    topItems,
    bottomBentos,
    sortBy,
    onSortChange: setSortBy,
    dailyRevenue,
    heatmapData,
    prevMonthData,
    avgOrderValue,
    productTrendData,
    commodities,
    selectedCommodityId,
    onSelectCommodityChange: setSelectedCommodityId,
    currentMonth,
    currentYear,
    error,
    amPmRevenue,
    categorySalesData,
    commodityTypes,
    orderNotes,
    deliveryProducts,
  }
}
