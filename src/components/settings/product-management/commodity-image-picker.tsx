/**
 * CommodityImagePicker — grid of built-in commodity artwork.
 * Used inside CommodityForm so the user can choose which PNG under
 * public/images/commodities to associate with the commodity. The
 * picker stores the short image key (e.g. "braised-pork-belly-rice"),
 * which is later expanded by resolveProductImage at render time.
 */

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageOff, Check } from 'lucide-react'
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

  const handleClear = useCallback(() => {
    onChange('')
  }, [onChange])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-base text-foreground">
        {t('productMgmt.commodities.pickImage')}
      </span>

      <ScrollArea className="h-[260px]">
        <div
          className="grid gap-3 m-2"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
          }}
        >
          {/* "No image" tile — always first */}
          <button
            type="button"
            onClick={handleClear}
            data-testid="image-picker-clear"
            aria-pressed={value === ''}
            title={t('productMgmt.commodities.noImage')}
            className={cn(
              'group relative flex aspect-square items-center justify-center rounded-md border border-dashed transition-colors',
              value === ''
                ? 'border-[var(--color-green)] bg-[color-mix(in_srgb,var(--color-green)_12%,transparent)] text-[var(--color-green)]'
                : 'border-border bg-background text-muted-foreground hover:border-[var(--color-green)] hover:text-foreground',
            )}
          >
            <ImageOff size={22} />
            {value === '' && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-[var(--color-green)] text-white">
                <Check size={10} />
              </span>
            )}
          </button>

          {COMMODITY_IMAGE_KEYS.map(key => {
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
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
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
      </ScrollArea>
    </div>
  )
}
