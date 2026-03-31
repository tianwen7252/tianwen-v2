/**
 * Tests for the SortableList generic component.
 * Verifies rendering, prop passing, item ordering, and empty state.
 *
 * Note: Actual drag-and-drop interactions are covered by E2E tests.
 * Unit tests focus on structure, rendering, and prop contracts.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SortableList } from './sortable-list'
import type { DragHandleProps } from './sortable-list'

// ── Test Data ──────────────────────────────────────────────────────────────

interface TestItem {
  readonly id: string
  readonly name: string
}

const TEST_ITEMS: readonly TestItem[] = [
  { id: 'item-1', name: 'Apple' },
  { id: 'item-2', name: 'Banana' },
  { id: 'item-3', name: 'Cherry' },
] as const

function getId(item: TestItem): string {
  return item.id
}

function renderTestItem(item: TestItem, dragHandleProps: DragHandleProps) {
  return (
    <div data-testid={`item-${item.id}`}>
      <button
        data-testid={`drag-handle-${item.id}`}
        {...dragHandleProps.attributes}
        {...dragHandleProps.listeners}
      >
        Drag
      </button>
      <span>{item.name}</span>
    </div>
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SortableList', () => {
  it('renders all items', () => {
    const onReorder = vi.fn()
    render(
      <SortableList
        items={TEST_ITEMS}
        getId={getId}
        renderItem={renderTestItem}
        onReorder={onReorder}
      />,
    )

    expect(screen.getByText('Apple')).toBeTruthy()
    expect(screen.getByText('Banana')).toBeTruthy()
    expect(screen.getByText('Cherry')).toBeTruthy()
  })

  it('renders each item with a drag handle area', () => {
    const onReorder = vi.fn()
    render(
      <SortableList
        items={TEST_ITEMS}
        getId={getId}
        renderItem={renderTestItem}
        onReorder={onReorder}
      />,
    )

    expect(screen.getByTestId('drag-handle-item-1')).toBeTruthy()
    expect(screen.getByTestId('drag-handle-item-2')).toBeTruthy()
    expect(screen.getByTestId('drag-handle-item-3')).toBeTruthy()
  })

  it('displays items in the correct order', () => {
    const onReorder = vi.fn()
    render(
      <SortableList
        items={TEST_ITEMS}
        getId={getId}
        renderItem={renderTestItem}
        onReorder={onReorder}
      />,
    )

    const items = screen.getAllByTestId(/^item-item-/)
    expect(items).toHaveLength(3)
    expect(items[0]?.textContent).toContain('Apple')
    expect(items[1]?.textContent).toContain('Banana')
    expect(items[2]?.textContent).toContain('Cherry')
  })

  it('renders without crashing with an empty array', () => {
    const onReorder = vi.fn()
    const { container } = render(
      <SortableList
        items={[]}
        getId={getId}
        renderItem={renderTestItem}
        onReorder={onReorder}
      />,
    )

    // Should render the container but no items
    expect(container).toBeTruthy()
    expect(screen.queryByTestId(/^item-item-/)).toBeNull()
  })

  it('passes onReorder callback as a function prop', () => {
    const onReorder = vi.fn()
    // Verify the component accepts the onReorder prop without errors
    const { unmount } = render(
      <SortableList
        items={TEST_ITEMS}
        getId={getId}
        renderItem={renderTestItem}
        onReorder={onReorder}
      />,
    )

    // onReorder should not be called on initial render
    expect(onReorder).not.toHaveBeenCalled()
    unmount()
  })

  it('renders with a single item', () => {
    const onReorder = vi.fn()
    const singleItem: readonly TestItem[] = [{ id: 'only', name: 'Solo' }]
    render(
      <SortableList
        items={singleItem}
        getId={getId}
        renderItem={renderTestItem}
        onReorder={onReorder}
      />,
    )

    expect(screen.getByText('Solo')).toBeTruthy()
    expect(screen.getAllByTestId(/^item-/)).toHaveLength(1)
  })

  it('applies drag handle attributes to the handle element', () => {
    const onReorder = vi.fn()
    render(
      <SortableList
        items={TEST_ITEMS}
        getId={getId}
        renderItem={renderTestItem}
        onReorder={onReorder}
      />,
    )

    const handle = screen.getByTestId('drag-handle-item-1')
    // useSortable provides role and tabindex attributes
    expect(handle.getAttribute('role')).toBe('button')
    expect(handle.getAttribute('tabindex')).toBe('0')
  })
})
