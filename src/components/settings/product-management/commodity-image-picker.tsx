/**
 * CommodityImagePicker — grid of built-in commodity artwork.
 * Used inside CommodityForm so the user can choose which PNG under
 * public/images/commodities to associate with the commodity. The
 * picker stores the short image key (e.g. "braised-pork-belly-rice"),
 * which is later expanded by resolveProductImage at render time.
 */

import { useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ImageOff, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { COMMODITY_IMAGE_KEYS } from '@/constants/commodity-images'
import { resolveProductImage } from '@/lib/resolve-product-image'
import { cn } from '@/lib/cn'

export interface CommodityImagePickerProps {
  readonly value: string
  readonly onChange: (next: string) => void
  /** Optional className applied to the outer wrapper. */
  readonly className?: string
}

export function CommodityImagePicker({
  value,
  onChange,
  className,
}: CommodityImagePickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return COMMODITY_IMAGE_KEYS
    return COMMODITY_IMAGE_KEYS.filter(key => key.includes(q))
  }, [query])

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-base text-foreground">
          {t('productMgmt.commodities.pickImage')}
        </span>
        <div className="relative w-56">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('productMgmt.commodities.searchImage')}
            className="pl-9 text-base"
            aria-label={t('productMgmt.commodities.searchImage')}
            data-testid="image-picker-search"
          />
        </div>
      </div>

      <ScrollArea
        className="h-[260px] rounded-lg border border-border bg-card/50 p-3"
        watchDeps={[filtered]}
      >
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
          }}
        >
          {/* "No image" tile — always first */}
          <button
            type="button"
            onClick={handleClear}
            data-testid="image-picker-clear"
            className={cn(
              'group relative flex aspect-square items-center justify-center rounded-md border border-dashed transition-colors',
              value === ''
                ? 'border-[var(--color-green)] bg-[color-mix(in_srgb,var(--color-green)_12%,transparent)] text-[var(--color-green)]'
                : 'border-border bg-background text-muted-foreground hover:border-[var(--color-green)] hover:text-foreground',
            )}
            aria-pressed={value === ''}
            title={t('productMgmt.commodities.noImage')}
          >
            <ImageOff size={22} />
            {value === '' && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[var(--color-green)] text-white">
                <Check size={10} />
              </span>
            )}
          </button>

          {filtered.map(key => {
            const isSelected = value === key
            const src = resolveProductImage(key)
            return (
              <button
                type="button"
                key={key}
                onClick={() => onChange(key)}
                data-testid={`image-tile-${key}`}
                aria-pressed={isSelected}
                title={key}
                className={cn(
                  'group relative flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-background transition-all',
                  isSelected
                    ? 'border-[var(--color-green)] ring-2 ring-[var(--color-green)] ring-offset-1'
                    : 'border-border hover:border-[var(--color-green)]/60 hover:shadow-sm',
                )}
              >
                <img
                  src={src}
                  alt={key}
                  loading="lazy"
                  className="size-full object-contain p-1"
                />
                {isSelected && (
                  <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[var(--color-green)] text-white">
                    <Check size={10} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div
            className="flex h-full min-h-[120px] items-center justify-center text-base text-muted-foreground"
            data-testid="image-picker-empty"
          >
            {t('productMgmt.commodities.noImageMatch')}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
