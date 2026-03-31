/**
 * AnalyticsTabBar — tab switcher for the analytics page.
 * Provides "商品統計" and "員工統計" tab options.
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { RippleButton } from '@/components/ui/ripple-button'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnalyticsTab = 'product' | 'staff'

interface AnalyticsTabBarProps {
  readonly activeTab: AnalyticsTab
  readonly onTabChange: (tab: AnalyticsTab) => void
}

// ─── Tab key definitions ──────────────────────────────────────────────────────

const TAB_KEYS: { value: AnalyticsTab; labelKey: string }[] = [
  { value: 'product', labelKey: 'analytics.productStats' },
  { value: 'staff', labelKey: 'analytics.staffStats' },
]

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Horizontal tab bar for switching between product and staff statistics.
 * Uses RippleButton for each tab per project conventions.
 */
export function AnalyticsTabBar({
  activeTab,
  onTabChange,
}: AnalyticsTabBarProps) {
  const { t } = useTranslation()

  return (
    <div role="tablist" className="flex gap-1 rounded-lg bg-muted p-1">
      {TAB_KEYS.map(tab => (
        <RippleButton
          key={tab.value}
          role="tab"
          type="button"
          aria-selected={activeTab === tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            'flex-1 rounded-md px-4 py-2 text-base font-normal transition-colors',
            activeTab === tab.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t(tab.labelKey)}
        </RippleButton>
      ))}
    </div>
  )
}
