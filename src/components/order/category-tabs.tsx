import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { RippleButton } from '@/components/ui/ripple-button'
import type { CommodityType } from '@/lib/schemas'

interface CategoryTabsProps {
  readonly categories: readonly CommodityType[]
  readonly selectedTypeId: string | null
  readonly onSelect: (typeId: string) => void
}

/**
 * Horizontal pill-shaped category tabs for filtering products.
 * Active tab uses the primary (Moss green) theme color.
 */
export function CategoryTabs({
  categories,
  selectedTypeId,
  onSelect,
}: CategoryTabsProps) {
  const { t } = useTranslation()
  if (categories.length === 0) {
    return <div role="tablist" aria-label={t('order.categories')} />
  }

  return (
    <div
      role="tablist"
      aria-label={t('order.categories')}
      className="flex flex-wrap gap-2"
    >
      {categories.map(category => {
        const isActive = category.typeId === selectedTypeId
        return (
          <RippleButton
            key={category.id}
            role="tab"
            data-active={isActive}
            aria-selected={isActive}
            onClick={() => onSelect(category.typeId)}
            rippleColor={isActive ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}
            className={cn(
              'rounded-full px-4 py-1.5 text-base transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )}
          >
            {category.label}
          </RippleButton>
        )
      })}
    </div>
  )
}
