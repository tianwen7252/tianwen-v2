import { useState, useRef, useEffect, useCallback } from 'react'
import { CircleX, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/cn'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ComboboxOption {
  readonly value: string
  readonly label: string
}

interface ComboboxProps {
  /** Available options to select from */
  readonly options: readonly ComboboxOption[]
  /** Current value */
  readonly value: string
  /** Called when the value changes (via selection or custom input) */
  readonly onChange: (value: string) => void
  /** Called when an option is deleted */
  readonly onDelete?: (value: string) => void
  /** Placeholder text */
  readonly placeholder?: string
  /** CSS class for the input wrapper */
  readonly className?: string
  /** Called when input focus state changes */
  readonly onFocusChange?: (focused: boolean) => void
}

// ─── Component ────────────────────���──────────────────────────────��──────────

/**
 * Combobox with search filtering, custom value support, and option deletion.
 * When search text doesn't match any option, the typed text is used as the value.
 */
export function Combobox({
  options,
  value,
  onChange,
  onDelete,
  placeholder,
  className,
  onFocusChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(value)
  const inputFocusedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value changes to search
  useEffect(() => {
    setSearch(value)
  }, [value])

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  )
  const hasFilteredOptions = filtered.length > 0

  const handleInputChange = (text: string) => {
    setSearch(text)
    onChange(text)
    if (hasFilteredOptions && !open) setOpen(true)
  }

  const handleFocus = useCallback(() => {
    inputFocusedRef.current = true
    onFocusChange?.(true)
    if (options.length > 0) {
      setOpen(true)
    }
  }, [options.length, onFocusChange])

  const handleBlur = useCallback(() => {
    inputFocusedRef.current = false
    onFocusChange?.(false)
    // Delay close to allow onMouseDown on options to fire first
    setTimeout(() => {
      if (!inputFocusedRef.current) {
        setOpen(false)
      }
    }, 150)
  }, [onFocusChange])

  const handleSelect = (optionValue: string) => {
    const option = options.find(o => o.value === optionValue)
    const label = option?.label ?? optionValue
    setSearch(label)
    onChange(label)
    setOpen(false)
  }

  // Prevent Radix from closing popover when input is focused
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen && inputFocusedRef.current) return
    setOpen(nextOpen)
  }, [])

  // Close popover when no options remain
  useEffect(() => {
    if (options.length === 0 && open) {
      setOpen(false)
    }
  }, [options.length, open])

  return (
    <Popover open={open && hasFilteredOptions} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={search}
            placeholder={placeholder}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              'w-full rounded-md border border-border bg-card px-3 py-2 pr-8 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring',
              className,
            )}
          />
          {search && (
            <RippleButton
              onMouseDown={e => {
                e.preventDefault()
                setSearch('')
                onChange('')
                inputRef.current?.focus()
              }}
              rippleColor="rgba(0,0,0,0.1)"
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
            >
              <CircleX className="size-5" />
            </RippleButton>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-1"
        side="top"
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
        onCloseAutoFocus={e => e.preventDefault()}
      >
        <ul className="max-h-48 overflow-y-auto">
          {filtered.map(opt => (
            <li
              key={opt.value}
              onMouseDown={e => {
                e.preventDefault()
                handleSelect(opt.value)
              }}
              className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-base hover:bg-accent"
            >
              <span className="truncate">{opt.label}</span>
              {onDelete && (
                <RippleButton
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDelete(opt.value)
                  }}
                  rippleColor="rgba(0,0,0,0.1)"
                  className="ml-2 flex shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </RippleButton>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
