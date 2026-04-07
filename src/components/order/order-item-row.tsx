import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { RippleButton } from '@/components/ui/ripple-button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { BorderBeam } from '@/components/ui/border-beam'
import type { CartItem } from '@/stores/order-store'

// Shared button class constants to avoid duplication
const iconBtnCn =
  'inline-flex size-8 items-center justify-center rounded-md outline-none ' +
  'hover:bg-accent hover:text-accent-foreground ' +
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ' +
  'disabled:pointer-events-none disabled:opacity-50'

const popoverBtnCn =
  'inline-flex h-8 flex-1 items-center justify-center rounded-md px-3 text-base outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ' +
  'disabled:pointer-events-none disabled:opacity-50'

export interface OrderItemRowProps {
  readonly item: CartItem
  readonly onRemove: (cartItemId: string) => void
  readonly onUpdateQuantity: (cartItemId: string, quantity: number) => void
  readonly onUpdateNote: (cartItemId: string, note: string) => void
}

/** Single cart item row displaying name, quantity controls, price, and optional note */
export function OrderItemRow({
  item,
  onRemove,
  onUpdateQuantity,
}: OrderItemRowProps) {
  const { t } = useTranslation()
  const totalPrice = item.price * item.quantity
  const isCustom = item.commodityId.startsWith('custom-')
  const prevQuantityRef = useRef(item.quantity)
  const quantityRef = useRef<HTMLSpanElement>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (item.quantity !== prevQuantityRef.current) {
      prevQuantityRef.current = item.quantity
      const el = quantityRef.current
      if (el) {
        // Remove then re-add class with forced reflow to restart animation
        el.classList.remove('animate-qty-bounce')
        void el.offsetWidth
        el.classList.add('animate-qty-bounce')
      }
    }
  }, [item.quantity])

  // Auto-focus input when popover opens
  useEffect(() => {
    if (popoverOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [popoverOpen])

  const handleDecrease = () => {
    if (item.quantity <= 1) {
      onRemove(item.id)
    } else {
      onUpdateQuantity(item.id, item.quantity - 1)
    }
  }

  const handleIncrease = () => {
    onUpdateQuantity(item.id, item.quantity + 1)
  }

  const handleOpenPopover = () => {
    setEditValue(String(item.quantity))
    setPopoverOpen(true)
  }

  const handleConfirm = useCallback(() => {
    setPopoverOpen(false)
    const parsed = parseInt(editValue, 10)
    if (isNaN(parsed) || parsed <= 0) return
    if (parsed !== item.quantity) {
      onUpdateQuantity(item.id, parsed)
    }
  }, [editValue, item.id, item.quantity, onUpdateQuantity])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    else if (e.key === 'Escape') setPopoverOpen(false)
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {/* Top row: name, quantity controls, price */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'flex-1 whitespace-nowrap text-lg',
            isCustom && 'text-(--color-red)',
          )}
        >
          {item.name}
        </span>

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <RippleButton
            aria-label="decrease"
            onClick={handleDecrease}
            className={iconBtnCn}
          >
            <Minus className="size-3" />
          </RippleButton>

          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <span
                ref={quantityRef}
                className="min-w-[1.5rem] cursor-pointer rounded px-1 text-center text-base outline-none hover:bg-muted"
                onAnimationEnd={(e) =>
                  e.currentTarget.classList.remove('animate-qty-bounce')
                }
                onClick={handleOpenPopover}
                role="button"
                tabIndex={0}
              >
                x{item.quantity}
              </span>
            </PopoverTrigger>
            <PopoverContent
              className="relative w-auto overflow-hidden p-3"
              align="center"
              side="left"
              style={{ boxShadow: '0 0 20px #ddd' }}
            >
              <BorderBeam
                size={100}
                borderWidth={1}
                // className="from-transparent via-[#a8c896] to-transparent"
              />
              <div className="flex flex-col items-center gap-3">
                <p className="text-md text-accent">{item.name}</p>
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-center text-xl font-bold outline-none focus:border-primary"
                  style={{ userSelect: 'text' }}
                />
                <div className="flex gap-2">
                  <RippleButton
                    className={cn(
                      popoverBtnCn,
                      'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
                    )}
                    onClick={() => setPopoverOpen(false)}
                  >
                    {t('common.cancel')}
                  </RippleButton>
                  <RippleButton
                    className={cn(
                      popoverBtnCn,
                      'bg-primary text-primary-foreground',
                    )}
                    onClick={handleConfirm}
                  >
                    {t('common.confirm')}
                  </RippleButton>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <RippleButton
            aria-label="increase"
            onClick={handleIncrease}
            className={iconBtnCn}
          >
            <Plus className="size-3" />
          </RippleButton>
        </div>

        {/* Price */}
        <span className="min-w-[3rem] text-right text-base font-medium">
          ${totalPrice.toLocaleString()}
        </span>

        {/* Remove button */}
        <RippleButton
          aria-label="remove"
          onClick={() => onRemove(item.id)}
          className={cn(
            iconBtnCn,
            'text-muted-foreground hover:text-destructive',
          )}
        >
          <X className="size-3" />
        </RippleButton>
      </div>

      {/* Note (only shown when non-empty) */}
      {item.note !== '' && (
        <p
          data-testid="order-item-note"
          className="pl-1 text-md text-muted-foreground"
        >
          {item.note}
        </p>
      )}
    </div>
  )
}
