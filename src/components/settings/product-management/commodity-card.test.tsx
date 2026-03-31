/**
 * Tests for CommodityCard component.
 * Verifies rendering of commodity info, tags, action buttons,
 * and drag handle integration.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommodityCard } from './commodity-card'
import type { Commodity } from '@/lib/schemas'
import type { DragHandleProps } from './sortable-list'

// ── Test Data ──────────────────────────────────────────────────────────────

const BASE_COMMODITY: Commodity = {
  id: 'com-001',
  typeId: 'bento',
  name: '油淋雞腿飯',
  price: 90,
  priority: 1,
  onMarket: true,
  includesSoup: true,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

const COMMODITY_NO_SOUP: Commodity = {
  ...BASE_COMMODITY,
  id: 'com-002',
  name: '排骨飯',
  includesSoup: false,
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

describe('CommodityCard', () => {
  describe('rendering', () => {
    it('should render commodity name', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={BASE_COMMODITY}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )
      expect(screen.getByText('油淋雞腿飯')).toBeTruthy()
    })

    it('should render commodity price with $ prefix', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={BASE_COMMODITY}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )
      expect(screen.getByText('$90')).toBeTruthy()
    })

    it('should render priority badge', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={BASE_COMMODITY}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )
      expect(screen.getByText('1')).toBeTruthy()
    })

    it('should render drag handle with correct attributes', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={BASE_COMMODITY}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )
      const handle = screen.getByTestId('drag-handle')
      expect(handle.getAttribute('role')).toBe('button')
      expect(handle.getAttribute('tabindex')).toBe('0')
    })
  })

  describe('tags', () => {
    it('should render includesSoup tag when true', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={BASE_COMMODITY}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )
      expect(screen.getByTestId('soup-tag')).toBeTruthy()
    })

    it('should not render includesSoup tag when false', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={COMMODITY_NO_SOUP}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )
      expect(screen.queryByTestId('soup-tag')).toBeNull()
    })
  })

  describe('actions', () => {
    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={BASE_COMMODITY}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )

      const editButton = screen.getByTestId('edit-button')
      await user.click(editButton)
      expect(onEdit).toHaveBeenCalledWith(BASE_COMMODITY)
    })

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={BASE_COMMODITY}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )

      const deleteButton = screen.getByTestId('delete-button')
      await user.click(deleteButton)
      expect(onDelete).toHaveBeenCalledWith(BASE_COMMODITY)
    })

    it('should render edit and delete buttons', () => {
      const onEdit = vi.fn()
      const onDelete = vi.fn()
      render(
        <CommodityCard
          commodity={BASE_COMMODITY}
          dragHandleProps={MOCK_DRAG_HANDLE_PROPS}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      )
      expect(screen.getByTestId('edit-button')).toBeTruthy()
      expect(screen.getByTestId('delete-button')).toBeTruthy()
    })
  })
})
