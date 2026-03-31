/**
 * Tests for OrderTypeCard component.
 * Verifies rendering of order type info, color dot, default badge,
 * action buttons, and drag handle integration.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderTypeCard } from './order-type-card'
import type { OrderType } from '@/lib/schemas'
import type { DragHandleProps } from './sortable-list'

// ── Test Data ──────────────────────────────────────────────────────────────

const DEFAULT_ORDER_TYPE: OrderType = {
  id: 'ot-001',
  name: '攤位',
  priority: 1,
  type: 'order',
  color: 'green',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const CUSTOM_ORDER_TYPE: OrderType = {
  id: 'custom-001',
  name: '自訂分類',
  priority: 4,
  type: 'order',
  color: 'purple',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const ORDER_TYPE_NO_COLOR: OrderType = {
  id: 'custom-002',
  name: '無顏色分類',
  priority: 5,
  type: 'order',
  color: '',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const MOCK_DRAG_HANDLE_PROPS: DragHandleProps = {
  attributes: {
    role: 'button',
    tabIndex: 0,
    'aria-disabled': false,
    'aria-pressed': undefined,
    'aria-roledescription': 'sortable',
    'aria-describedby': 'test-desc',
  },
  listeners: undefined,
}

describe('OrderTypeCard', () => {
  describe('rendering', () => {
    it('should render order type name', () => {
      render(
        <OrderTypeCard
          orderType={DEFAULT_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.getByText('攤位')).toBeTruthy()
    })

    it('should render priority badge with order type priority', () => {
      render(
        <OrderTypeCard
          orderType={DEFAULT_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.getByText(String(DEFAULT_ORDER_TYPE.priority))).toBeTruthy()
    })

    it('should render drag handle with correct attributes', () => {
      render(
        <OrderTypeCard
          orderType={DEFAULT_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      const handle = screen.getByTestId('drag-handle')
      expect(handle.getAttribute('role')).toBe('button')
      expect(handle.getAttribute('tabindex')).toBe('0')
    })
  })

  describe('default badge', () => {
    it('should show default badge for order types with id starting with ot-', () => {
      render(
        <OrderTypeCard
          orderType={DEFAULT_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.getByTestId('default-badge')).toBeTruthy()
    })

    it('should not show default badge for custom order types', () => {
      render(
        <OrderTypeCard
          orderType={CUSTOM_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.queryByTestId('default-badge')).toBeNull()
    })
  })

  describe('delete button visibility', () => {
    it('should hide delete button for default order types', () => {
      render(
        <OrderTypeCard
          orderType={DEFAULT_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.queryByTestId('delete-button')).toBeNull()
    })

    it('should show delete button for custom order types', () => {
      render(
        <OrderTypeCard
          orderType={CUSTOM_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.getByTestId('delete-button')).toBeTruthy()
    })
  })

  describe('actions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      render(
        <OrderTypeCard
          orderType={DEFAULT_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={vi.fn()}
        />,
      )

      await user.click(screen.getByTestId('edit-button'))
      expect(onEdit).toHaveBeenCalledWith(DEFAULT_ORDER_TYPE)
    })

    it('should call onDelete when delete button is clicked on custom type', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      render(
        <OrderTypeCard
          orderType={CUSTOM_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />,
      )

      await user.click(screen.getByTestId('delete-button'))
      expect(onDelete).toHaveBeenCalledWith(CUSTOM_ORDER_TYPE)
    })

    it('should always render edit button', () => {
      render(
        <OrderTypeCard
          orderType={DEFAULT_ORDER_TYPE}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.getByTestId('edit-button')).toBeTruthy()
    })
  })

  describe('priority badge', () => {
    it('should render priority badge for order type without color', () => {
      render(
        <OrderTypeCard
          orderType={ORDER_TYPE_NO_COLOR}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      )
      expect(screen.getByText(String(ORDER_TYPE_NO_COLOR.priority))).toBeTruthy()
    })
  })
})
