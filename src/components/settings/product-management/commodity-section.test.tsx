/**
 * Tests for CommoditySection component.
 * Verifies tab rendering, tab switching, local-only changes pattern,
 * and SectionRef exposure for the unified save flow.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { CommoditySection } from './commodity-section'
import {
  getCommodityTypeRepo,
  getCommodityRepo,
  getPriceChangeLogRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'
import type { SectionRef } from './types'

// Mock the repository provider to use in-memory mock repositories
vi.mock('@/lib/repositories', () => ({
  getCommodityTypeRepo: () => getCommodityTypeRepo(),
  getCommodityRepo: () => getCommodityRepo(),
  getPriceChangeLogRepo: () => getPriceChangeLogRepo(),
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
        <button onClick={onConfirm}>confirm-delete</button>
        <button onClick={onCancel}>cancel-delete</button>
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

describe('CommoditySection', () => {
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
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('商品設定')
    })

    it('should render category tabs', async () => {
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('餐盒')
      expect(screen.getByText('單點')).toBeTruthy()
      expect(screen.getByText('飲料')).toBeTruthy()
      expect(screen.getByText('水餃')).toBeTruthy()
    })

    it('should render add product button', async () => {
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('新增商品')
    })
  })

  describe('tab switching', () => {
    it('should show bento products by default (first tab selected)', async () => {
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('油淋雞腿飯')
    })

    it('should switch to a different tab when clicked', async () => {
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      const drinkTab = screen.getByTestId('category-tab-drink')
      await user.click(drinkTab)

      await waitFor(() => {
        expect(screen.queryByText('油淋雞腿飯')).toBeNull()
      })
    })
  })

  describe('add product (local only)', () => {
    it('should open add product modal when add button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('新增商品')
      await user.click(screen.getByText('新增商品'))
      expect(screen.getByRole('dialog', { name: '新增商品' })).toBeTruthy()
    })

    it('should add product locally without writing to DB', async () => {
      const onHasChanges = vi.fn()
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={onHasChanges}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      await user.click(screen.getByText('新增商品'))

      // Fill the form
      const nameInput = screen.getByPlaceholderText('品名')
      await user.type(nameInput, '新商品')
      const priceInput = screen.getByPlaceholderText('0')
      await user.clear(priceInput)
      await user.type(priceInput, '100')

      // Submit the form
      await user.click(screen.getByRole('button', { name: '確認' }))

      // Should appear in the list
      await waitFor(() => {
        expect(screen.getByText('新商品')).toBeTruthy()
      })

      // onHasChanges should have been called with true
      expect(onHasChanges).toHaveBeenCalledWith(true)

      // DB should NOT have this commodity yet
      const dbItems = await getCommodityRepo().findByTypeId('bento')
      const found = dbItems.find(c => c.name === '新商品')
      expect(found).toBeUndefined()
    })
  })

  describe('delete product (local only)', () => {
    it('should open confirm modal when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)

      expect(screen.getByTestId('confirm-modal')).toBeTruthy()
    })

    it('should mark product for deletion locally without writing to DB', async () => {
      const onHasChanges = vi.fn()
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={onHasChanges}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)

      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('confirm-delete'))

      // Item should disappear from list
      await waitFor(() => {
        expect(screen.queryByText('油淋雞腿飯')).toBeNull()
      })

      // DB should still have it
      const dbItems = await getCommodityRepo().findByTypeId('bento')
      const found = dbItems.find(c => c.name === '油淋雞腿飯')
      expect(found).toBeTruthy()
      expect(found?.onMarket).toBe(true)

      // onHasChanges should be called
      expect(onHasChanges).toHaveBeenCalledWith(true)
    })

    it('should cancel deletion and keep product', async () => {
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)

      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('cancel-delete'))

      expect(screen.queryByTestId('confirm-modal')).toBeNull()
      expect(screen.getByText('油淋雞腿飯')).toBeTruthy()
    })
  })

  describe('SectionRef — getChangeSummary', () => {
    it('should return empty array when no changes', async () => {
      const ref = React.createRef<SectionRef>()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      const summary = ref.current?.getChangeSummary() ?? []
      expect(summary).toEqual([])
    })

    it('should include add summary after adding a product', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      await user.click(screen.getByText('新增商品'))
      const nameInput = screen.getByPlaceholderText('品名')
      await user.type(nameInput, '測試商品')
      const priceInput = screen.getByPlaceholderText('0')
      await user.clear(priceInput)
      await user.type(priceInput, '50')
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(screen.getByText('測試商品')).toBeTruthy()
      })

      const summary = ref.current?.getChangeSummary() ?? []
      expect(summary.some(s => s.type === 'add')).toBe(true)
    })

    it('should include delete summary after deleting a product', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)
      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('confirm-delete'))

      await waitFor(() => {
        expect(screen.queryByText('油淋雞腿飯')).toBeNull()
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
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('油淋雞腿飯')
      await user.click(screen.getByText('新增商品'))
      const nameInput = screen.getByPlaceholderText('品名')
      await user.type(nameInput, '存檔測試')
      const priceInput = screen.getByPlaceholderText('0')
      await user.clear(priceInput)
      await user.type(priceInput, '200')
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(screen.getByText('存檔測試')).toBeTruthy()
      })

      await act(async () => {
        await ref.current?.save()
      })

      // DB should now have the new commodity
      const dbItems = await getCommodityRepo().findByTypeId('bento')
      const found = dbItems.find(c => c.name === '存檔測試')
      expect(found).toBeTruthy()
      expect(found?.price).toBe(200)
    })

    it('should write pending deletes to DB when save is called', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('油淋雞腿飯')

      // Get the first commodity's ID from DB before deleting
      const itemsBefore = await getCommodityRepo().findByTypeId('bento')
      const firstItem = itemsBefore[0]!

      const deleteButtons = screen.getAllByTestId('delete-button')
      await user.click(deleteButtons[0]!)
      const confirmModal = screen.getByTestId('confirm-modal')
      await user.click(within(confirmModal).getByText('confirm-delete'))

      await waitFor(() => {
        expect(screen.queryByText(firstItem.name)).toBeNull()
      })

      await act(async () => {
        await ref.current?.save()
      })

      // DB should have onMarket=false for deleted item
      const dbItem = await getCommodityRepo().findById(firstItem.id)
      expect(dbItem?.onMarket).toBe(false)
    })

    it('should create price change log when commodity price is edited', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      // Wait for commodities to load
      await screen.findByText('油淋雞腿飯')

      // Get original commodity from DB to compare prices
      const originalItems = await getCommodityRepo().findByTypeId('bento')
      const originalItem = originalItems[0]!
      const originalPrice = originalItem.price

      // Click edit on first commodity
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)

      // Change price
      const priceInput = screen.getByPlaceholderText('0')
      await user.clear(priceInput)
      await user.type(priceInput, '999')
      await user.click(screen.getByRole('button', { name: '確認' }))

      // Save
      await act(async () => {
        await ref.current?.save()
      })

      // Verify price change log was created
      const logs = await getPriceChangeLogRepo().findAll()
      expect(logs.length).toBe(1)
      expect(logs[0]!.commodityId).toBe(originalItem.id)
      expect(logs[0]!.oldPrice).toBe(originalPrice)
      expect(logs[0]!.newPrice).toBe(999)
    })

    it('should NOT create price change log when price is unchanged', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('油淋雞腿飯')

      // Edit commodity but only change name, not price
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)

      const nameInput = screen.getByPlaceholderText('品名')
      await user.clear(nameInput)
      await user.type(nameInput, '改名便當')
      await user.click(screen.getByRole('button', { name: '確認' }))

      // Save
      await act(async () => {
        await ref.current?.save()
      })

      // No price change log should exist
      const logs = await getPriceChangeLogRepo().findAll()
      expect(logs.length).toBe(0)
    })
  })

  describe('swipe to delete', () => {
    it('should wrap each commodity card with SwipeToDelete', async () => {
      render(
        <CommoditySection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('油淋雞腿飯')
      const swipeWrappers = screen.getAllByTestId('swipe-to-delete')
      expect(swipeWrappers.length).toBeGreaterThan(0)
    })
  })
})
