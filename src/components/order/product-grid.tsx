import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calculator } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  getCommodityTypeRepo,
  getCommodityRepo,
} from '@/lib/repositories/provider'
import { useOrderStore } from '@/stores/order-store'
import { RippleButton } from '@/components/ui/ripple-button'
import { tutorialAnchor } from '@/lib/tutorial/tutorial-anchor'
import { CategoryTabs } from './category-tabs'
import { ProductCard } from './product-card'
import { CalculatorOverlay } from './calculator-overlay'
import { QuickSubmitSwitch } from './quick-submit-switch'

/**
 * Main container component for the product selection area.
 * Fetches categories and commodities via TanStack Query,
 * manages selected category state, and renders the grid of products.
 */
interface ProductGridProps {
  /** Use smaller calculator buttons for modal context */
  readonly compactCalculator?: boolean
}

export function ProductGrid({ compactCalculator = false }: ProductGridProps) {
  const { t } = useTranslation()
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>('bento')
  const [showCalculator, setShowCalculator] = useState(false)

  const addItem = useOrderStore(state => state.addItem)
  const submitSeq = useOrderStore(state => state.submitSeq)
  const quickSubmit = useOrderStore(state => state.quickSubmit)
  const setQuickSubmit = useOrderStore(state => state.setQuickSubmit)

  // Reset category tab to default after order submission (clearCart increments submitSeq)
  useEffect(() => {
    setSelectedTypeId('bento')
  }, [submitSeq])

  // Fetch all commodity types (categories)
  const {
    data: categories = [],
    isLoading: isLoadingTypes,
    isError: isTypesError,
  } = useQuery({
    queryKey: ['commodity-types'],
    queryFn: () => getCommodityTypeRepo().findAll(),
  })

  // Fetch commodities based on selected category
  const {
    data: commodities = [],
    isLoading: isLoadingCommodities,
    isError: isCommoditiesError,
  } = useQuery({
    queryKey: ['commodities', selectedTypeId],
    queryFn: () => {
      if (selectedTypeId === null) {
        return getCommodityRepo().findOnMarket()
      }
      return getCommodityRepo().findByTypeId(selectedTypeId)
    },
  })

  const isLoading = isLoadingTypes || isLoadingCommodities
  const isError = isTypesError || isCommoditiesError

  const handleAddItem = (commodity: {
    id: string
    name: string
    price: number
    typeId: string
    includesSoup: boolean
  }) => {
    addItem(commodity)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-muted-foreground">{t('order.loading')}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-destructive">{t('order.loadError')}</span>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-3"
      {...tutorialAnchor('order.productGrid')}
    >
      {/* Header: category tabs + quick submit switch + calculator toggle */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/56 py-2">
        <CategoryTabs
          categories={categories}
          selectedTypeId={selectedTypeId}
          onSelect={setSelectedTypeId}
        />
        <div className="flex items-center gap-2">
          {!compactCalculator && (
            <QuickSubmitSwitch
              checked={quickSubmit}
              onCheckedChange={setQuickSubmit}
            />
          )}
          <RippleButton
            aria-label={t('order.calculator')}
            rippleColor="rgba(0, 0, 0, 0.1)"
            onClick={() => setShowCalculator(prev => !prev)}
            className="size-8 rounded-md border border-border bg-background text-muted-foreground shadow-xs flex items-center gap-2 justify-center"
          >
            <Calculator className="size-5" />
          </RippleButton>
        </div>
      </div>

      {/* Product grid */}
      {commodities.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <span className="text-muted-foreground">{t('order.noProducts')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {commodities.map(commodity => (
            <ProductCard
              key={commodity.id}
              commodity={commodity}
              onAdd={handleAddItem}
            />
          ))}
        </div>
      )}

      {/* Calculator overlay — extends to cover parent padding via negative insets */}
      {showCalculator && (
        <CalculatorOverlay
          onClose={() => setShowCalculator(false)}
          compact={compactCalculator}
        />
      )}
    </div>
  )
}
