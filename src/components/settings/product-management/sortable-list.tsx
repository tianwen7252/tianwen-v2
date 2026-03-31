/**
 * SortableList — Generic drag-and-drop reorderable list component.
 * Built on @dnd-kit with iPad-optimized sensors and vertical-only dragging.
 *
 * Usage:
 *   <SortableList
 *     items={items}
 *     getId={(item) => item.id}
 *     renderItem={(item, dragHandleProps) => <Card item={item} {...dragHandleProps} />}
 *     onReorder={(orderedIds) => updateOrder(orderedIds)}
 *   />
 */

import { type ReactNode, useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from '@dnd-kit/core'

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Props forwarded to the renderItem callback for positioning the drag handle.
 * The consumer decides where to render the handle in their item component.
 */
export interface DragHandleProps {
  readonly attributes: DraggableAttributes
  readonly listeners: DraggableSyntheticListeners
  /** True when rendered inside the DragOverlay (floating clone) */
  readonly isOverlay?: boolean
}

interface SortableListProps<T> {
  readonly items: readonly T[]
  readonly getId: (item: T) => string
  readonly renderItem: (item: T, dragHandleProps: DragHandleProps) => ReactNode
  readonly onReorder: (orderedIds: readonly string[]) => void
}

// ── Drop animation config ──────────────────────────────────────────────────

const DROP_ANIMATION: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
}

// ── Overlay drag handle stub ───────────────────────────────────────────────

/**
 * Static placeholder handle props used inside DragOverlay.
 * The overlay clone is purely visual — listeners are intentionally omitted.
 */
const OVERLAY_DRAG_HANDLE_PROPS: DragHandleProps = {
  attributes: {
    role: 'button',
    tabIndex: 0,
    'aria-disabled': false,
    'aria-pressed': undefined,
    'aria-roledescription': 'sortable',
    'aria-describedby': 'dnd-overlay-description',
  },
  listeners: undefined,
  isOverlay: true,
}

// ── SortableItem ───────────────────────────────────────────────────────────

interface SortableItemProps<T> {
  readonly item: T
  readonly id: string
  readonly renderItem: (item: T, dragHandleProps: DragHandleProps) => ReactNode
}

function SortableItem<T>({ item, id, renderItem }: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const dragHandleProps: DragHandleProps = { attributes, listeners }

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      {renderItem(item, dragHandleProps)}
    </div>
  )
}

// ── SortableList ───────────────────────────────────────────────────────────

export function SortableList<T>({
  items,
  getId,
  renderItem,
  onReorder,
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // iPad-optimized sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Memoize so that handleDragEnd always reads the current snapshot
  // rather than capturing a stale closure over a previous render's array.
  const itemIds = useMemo(() => items.map(getId), [items, getId])

  const activeItem = activeId
    ? (items.find(item => getId(item) === activeId) ?? null)
    : null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)

      const { active, over } = event
      if (!over || active.id === over.id) {
        return
      }

      const oldIndex = itemIds.indexOf(String(active.id))
      const newIndex = itemIds.indexOf(String(over.id))

      if (oldIndex === -1 || newIndex === -1) {
        return
      }

      const reorderedIds = arrayMove(itemIds, oldIndex, newIndex)
      onReorder(reorderedIds)
    },
    [itemIds, onReorder],
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.map(item => {
          const id = getId(item)
          return (
            <SortableItem
              key={id}
              item={item}
              id={id}
              renderItem={renderItem}
            />
          )
        })}
      </SortableContext>

      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {activeItem
          ? renderItem(activeItem, OVERLAY_DRAG_HANDLE_PROPS)
          : null}
      </DragOverlay>
    </DndContext>
  )
}
