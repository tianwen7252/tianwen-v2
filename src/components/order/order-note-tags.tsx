import { useState, useCallback, useMemo } from 'react'
import { X, Square, SquareCheckBig } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { Input } from '@/components/ui/input'
import { RippleButton } from '@/components/ui/ripple-button'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { getOrderTypeRepo } from '@/lib/repositories'
import { notify } from '@/components/ui/sonner'
import { useDbQuery } from '@/hooks/use-db-query'
import { tutorialAnchor } from '@/lib/tutorial/tutorial-anchor'
import type { OrderType } from '@/lib/schemas'

// ─── Types ──────────────────────────────────────────────────────────────────

interface OrderNoteTagsProps {
  /** Currently selected tag labels */
  readonly selectedTags: readonly string[]
  /** Callback when selected tags change */
  readonly onSelectedTagsChange: (tags: string[]) => void
}

interface TagItem {
  readonly id: string
  readonly name: string
  readonly isDefault: boolean
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Renders order note tags (default + custom) as toggleable pills.
 * Tags are loaded from the order_types DB table.
 */
export function OrderNoteTags({
  selectedTags,
  onSelectedTagsChange,
}: OrderNoteTagsProps) {
  const { t } = useTranslation()
  const [refreshKey, setRefreshKey] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [pendingDeleteTag, setPendingDeleteTag] = useState<string | null>(null)

  // Load all order types from DB
  const orderTypes = useDbQuery(
    () => getOrderTypeRepo().findAll(),
    [refreshKey],
    [] as OrderType[],
  )

  // Map order types to tag items
  const allTags: readonly TagItem[] = useMemo(
    () =>
      orderTypes.map(ot => ({
        id: ot.id,
        name: ot.name,
        isDefault: ot.id.startsWith('ot-'),
      })),
    [orderTypes],
  )

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  const handleToggleTag = useCallback(
    (tag: string) => {
      const isSelected = selectedTags.includes(tag)
      const nextTags = isSelected
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
      onSelectedTagsChange(nextTags)
    },
    [selectedTags, onSelectedTagsChange],
  )

  const handleAddTag = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return
      const trimmed = inputValue.trim()
      if (!trimmed) return

      // Reject duplicates
      if (allTags.some(tag => tag.name === trimmed)) {
        setInputValue('')
        return
      }

      // Determine next priority
      const maxPriority = orderTypes.reduce(
        (max, ot) => Math.max(max, ot.priority),
        0,
      )

      try {
        await getOrderTypeRepo().create({
          name: trimmed,
          priority: maxPriority + 1,
          type: 'order',
          color: '',
        })
        refresh()
      } catch {
        notify.error(t('order.addTagError'))
      }

      setInputValue('')
    },
    [inputValue, allTags, orderTypes, refresh, t],
  )

  const handleDeleteTag = useCallback(
    async (tag: TagItem) => {
      try {
        await getOrderTypeRepo().remove(tag.id)
        // Only update selected tags if removal succeeded
        if (selectedTags.includes(tag.name)) {
          onSelectedTagsChange(selectedTags.filter(t => t !== tag.name))
        }
        refresh()
      } catch {
        notify.error(t('order.deleteTagError'))
      }
    },
    [selectedTags, onSelectedTagsChange, refresh, t],
  )

  return (
    <div className="space-y-2.5" {...tutorialAnchor('order.noteTags')}>
      <h4 className="text-md tracking-wide text-gray-500 mb-5">
        {t('order.orderNote')}
      </h4>

      {/* Tag pills */}
      <div className="flex flex-wrap gap-2">
        {allTags.map(tag => {
          const isSelected = selectedTags.includes(tag.name)

          return (
            <span
              key={tag.id}
              data-tag={tag.name}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors select-none',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
              onClick={() => handleToggleTag(tag.name)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ')
                  handleToggleTag(tag.name)
              }}
            >
              {isSelected ? (
                <SquareCheckBig className="size-3.5" />
              ) : (
                <Square className="size-3.5" />
              )}
              {tag.name}
              {!tag.isDefault && (
                <Popover
                  open={pendingDeleteTag === tag.name}
                  onOpenChange={open => !open && setPendingDeleteTag(null)}
                >
                  <PopoverTrigger asChild>
                    <RippleButton
                      data-tag-delete={tag.name}
                      rippleColor="rgba(0,0,0,0.1)"
                      className="ml-0.5 inline-flex items-center rounded-full p-0.5 hover:bg-destructive/20"
                      onClick={e => {
                        e.stopPropagation()
                        setPendingDeleteTag(tag.name)
                      }}
                      aria-label={`delete ${tag.name}`}
                    >
                      <X className="size-3" />
                    </RippleButton>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-3"
                    side="top"
                    align="center"
                  >
                    {/* stopPropagation prevents React Portal click bubbling to the tag span */}
                    <div
                      className="space-y-2.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <p className="text-base text-gray-600">
                        {t('order.deleteTagConfirm', { tag: tag.name })}
                      </p>
                      <div className="flex gap-2">
                        <RippleButton
                          onClick={() => setPendingDeleteTag(null)}
                          rippleColor="rgba(0,0,0,0.1)"
                          className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-base text-gray-600 transition hover:bg-muted"
                        >
                          {t('common.cancel')}
                        </RippleButton>
                        <RippleButton
                          onClick={() => {
                            handleDeleteTag(tag)
                            setPendingDeleteTag(null)
                          }}
                          rippleColor="rgba(255,255,255,0.3)"
                          className="flex-1 rounded-md bg-destructive px-3 py-1.5 text-base text-destructive-foreground transition hover:opacity-80"
                        >
                          {t('common.delete')}
                        </RippleButton>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </span>
          )
        })}
      </div>

      {/* Add new tag input */}
      <Input
        placeholder={t('order.addTag')}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleAddTag}
        className="h-8 w-[calc(100%-6px)] rounded-lg border-gray-200 bg-white/60 text-sm placeholder:text-gray-400"
      />
    </div>
  )
}
