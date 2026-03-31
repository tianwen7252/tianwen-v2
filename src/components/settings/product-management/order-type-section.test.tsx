/**
 * Tests for OrderTypeSection component.
 * Verifies section rendering, local-only add/edit/delete flows,
 * and SectionRef exposure for the unified save flow.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { OrderTypeSection } from './order-type-section'
import {
  getOrderTypeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'
import type { SectionRef } from './types'

// Mock the repository provider to use in-memory mock repositories
vi.mock('@/lib/repositories', () => ({
  getOrderTypeRepo: () => getOrderTypeRepo(),
}))

// Mock the modal component to avoid Radix Portal issues in tests
vi.mock('@/components/modal', () => ({
  Modal: ({
    open,
    title,
    children,
    footer,
    onClose,
  }: {
    open: boolean
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
    onClose: () => void
  }) =>
    open ? (
      <div data-testid="modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        {footer}
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null,
  ConfirmModal: ({
    open,
    title,
    children,
    onConfirm,
    onCancel,
  }: {
    open: boolean
    title: string
    children?: React.ReactNode
    onConfirm: () => void
    onCancel: () => void
  }) =>
    open ? (
      <div data-testid="confirm-modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <button onClick={onConfirm}>confirm-action</button>
        <button onClick={onCancel}>cancel-action</button>
      </div>
    ) : null,
}))

// Mock sonner notify
const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()
vi.mock('@/components/ui/sonner', () => ({
  notify: {
    success: (...args: unknown[]) => mockNotifySuccess(...args),
    error: (...args: unknown[]) => mockNotifyError(...args),
  },
}))

// Mock SortableList to avoid dnd-kit complexity in unit tests
vi.mock('./sortable-list', () => ({
  SortableList: ({
    items,
    renderItem,
    getId,
    onReorder,
  }: {
    items: readonly unknown[]
    renderItem: (item: unknown, dragProps: unknown) => React.ReactNode
    getId: (item: unknown) => string
    onReorder: (ids: readonly string[]) => void
  }) => (
    <div data-testid="sortable-list">
      {items.map(item => (
        <div key={getId(item)} data-testid={`sortable-item-${getId(item)}`}>
          {renderItem(item, {
            attributes: {
              role: 'button',
              tabIndex: 0,
              'aria-disabled': false,
              'aria-pressed': undefined,
              'aria-roledescription': 'sortable',
              'aria-describedby': 'test-desc',
            },
            listeners: undefined,
          })}
        </div>
      ))}
      <button
        data-testid="trigger-reorder"
        onClick={() => {
          const ids = items.map(item => getId(item)).reverse()
          onReorder(ids)
        }}
      >
        reorder
      </button>
    </div>
  ),
}))

describe('OrderTypeSection', () => {
  beforeEach(() => {
    resetMockRepositories()
    mockNotifySuccess.mockClear()
    mockNotifyError.mockClear()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  describe('rendering', () => {
    it('should render the section title', async () => {
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('訂單分類')
    })

    it('should render the add button', async () => {
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('新增分類')
    })

    it('should render all default order types', async () => {
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('攤位')
      expect(screen.getByText('外送')).toBeTruthy()
      expect(screen.getByText('電話自取')).toBeTruthy()
    })

    it('should render default badges on default order types', async () => {
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('攤位')
      const badges = screen.getAllByTestId('default-badge')
      expect(badges.length).toBe(3)
    })
  })

  describe('add order type (local only)', () => {
    it('should open add form modal when add button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('新增分類')
      await user.click(screen.getByText('新增分類'))
      expect(screen.getByRole('dialog', { name: '新增分類' })).toBeTruthy()
    })

    it('should add order type locally without writing to DB', async () => {
      const onHasChanges = vi.fn()
      const user = userEvent.setup()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={onHasChanges}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('新增分類')
      await user.click(screen.getByText('新增分類'))

      // Fill the form
      const nameInput = screen.getByPlaceholderText('名稱')
      await user.type(nameInput, '自訂分類')
      await user.click(screen.getByRole('button', { name: '確認' }))

      // Should appear in the list
      await waitFor(() => {
        expect(screen.getByText('自訂分類')).toBeTruthy()
      })

      // DB should NOT have this order type yet
      const dbItems = await getOrderTypeRepo().findAll()
      const found = dbItems.find(ot => ot.name === '自訂分類')
      expect(found).toBeUndefined()

      // onHasChanges should have been called
      expect(onHasChanges).toHaveBeenCalledWith(true)
    })
  })

  describe('delete order type (local only)', () => {
    it('should mark custom order type for deletion locally', async () => {
      // First add a custom type to DB so it shows up
      await getOrderTypeRepo().create({
        name: '測試分類',
        priority: 4,
        type: 'order',
        color: 'red',
      })

      const onHasChanges = vi.fn()
      const user = userEvent.setup()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={onHasChanges}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('測試分類')
      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)

      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('confirm-action'))

      // Item should disappear from display
      await waitFor(() => {
        expect(screen.queryByText('測試分類')).toBeNull()
      })

      // DB should still have it
      const dbItems = await getOrderTypeRepo().findAll()
      const found = dbItems.find(ot => ot.name === '測試分類')
      expect(found).toBeTruthy()

      expect(onHasChanges).toHaveBeenCalledWith(true)
    })

    it('should cancel deletion and keep order type', async () => {
      await getOrderTypeRepo().create({
        name: '測試分類',
        priority: 4,
        type: 'order',
        color: 'red',
      })

      const user = userEvent.setup()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('測試分類')
      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)

      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('cancel-action'))

      expect(screen.queryByTestId('confirm-modal')).toBeNull()
      expect(screen.getByText('測試分類')).toBeTruthy()
    })

    it('should not show delete button on default order types', async () => {
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('攤位')
      expect(screen.queryByTestId('delete-button')).toBeNull()
    })
  })

  describe('SectionRef — getChangeSummary', () => {
    it('should return empty array when no changes', async () => {
      const ref = React.createRef<SectionRef>()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('攤位')
      const summary = ref.current?.getChangeSummary() ?? []
      expect(summary).toEqual([])
    })

    it('should include add summary after adding an order type', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('新增分類')
      await user.click(screen.getByText('新增分類'))
      const nameInput = screen.getByPlaceholderText('名稱')
      await user.type(nameInput, '快遞')
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(screen.getByText('快遞')).toBeTruthy()
      })

      const summary = ref.current?.getChangeSummary() ?? []
      expect(summary.some(s => s.type === 'add')).toBe(true)
    })

    it('should include delete summary after deleting an order type', async () => {
      await getOrderTypeRepo().create({
        name: '待刪分類',
        priority: 4,
        type: 'order',
        color: '',
      })

      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('待刪分類')
      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)
      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('confirm-action'))

      await waitFor(() => {
        expect(screen.queryByText('待刪分類')).toBeNull()
      })

      const summary = ref.current?.getChangeSummary() ?? []
      expect(summary.some(s => s.type === 'delete')).toBe(true)
    })
  })

  describe('SectionRef — save', () => {
    it('should write pending adds to DB when save is called', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('新增分類')
      await user.click(screen.getByText('新增分類'))
      const nameInput = screen.getByPlaceholderText('名稱')
      await user.type(nameInput, '存檔分類')
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(screen.getByText('存檔分類')).toBeTruthy()
      })

      await act(async () => {
        await ref.current?.save()
      })

      const dbItems = await getOrderTypeRepo().findAll()
      const found = dbItems.find(ot => ot.name === '存檔分類')
      expect(found).toBeTruthy()
    })

    it('should write pending deletes to DB when save is called', async () => {
      const created = await getOrderTypeRepo().create({
        name: '刪除測試',
        priority: 4,
        type: 'order',
        color: '',
      })

      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('刪除測試')
      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)
      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('confirm-action'))

      await waitFor(() => {
        expect(screen.queryByText('刪除測試')).toBeNull()
      })

      await act(async () => {
        await ref.current?.save()
      })

      // DB should no longer have this order type
      const dbItem = await getOrderTypeRepo().findById(created.id)
      expect(dbItem).toBeUndefined()
    })
  })

  describe('max limit', () => {
    it('should disable add button when 10 order types exist (including pending)', async () => {
      // Add 7 more to DB to reach 10 total (3 defaults + 7 custom)
      for (let i = 0; i < 7; i++) {
        await getOrderTypeRepo().create({
          name: `自訂${i + 1}`,
          priority: 4 + i,
          type: 'order',
          color: '',
        })
      }

      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('自訂7')

      const addButton = screen.getByText('新增分類').closest('button')
      expect(addButton?.disabled).toBe(true)
    })
  })

  describe('swipe to delete', () => {
    it('should wrap each order type card with SwipeToDelete', async () => {
      render(
        <OrderTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('攤位')
      const swipeWrappers = screen.getAllByTestId('swipe-to-delete')
      expect(swipeWrappers.length).toBeGreaterThan(0)
    })
  })
})
