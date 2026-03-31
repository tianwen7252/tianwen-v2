/**
 * Tests for CommodityTypeSection component.
 * Verifies rendering, edit via modal, reorder, and SectionRef exposure
 * (save + getChangeSummary) for the unified save flow.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { CommodityTypeSection } from './commodity-type-section'
import {
  getCommodityTypeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'
import type { SectionRef } from './types'

// Mock the repository provider to use in-memory mock repositories
vi.mock('@/lib/repositories', () => ({
  getCommodityTypeRepo: () => getCommodityTypeRepo(),
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

// Mock the modal components to avoid Radix Portal issues in tests
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
        <button onClick={onConfirm}>confirm-save</button>
        <button onClick={onCancel}>cancel-save</button>
      </div>
    ) : null,
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
          // Reverse the order for test purposes
          const ids = items.map(item => getId(item)).reverse()
          onReorder(ids)
        }}
      >
        reorder
      </button>
    </div>
  ),
}))

describe('CommodityTypeSection', () => {
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
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('商品種類')
    })

    it('should render all 4 commodity types as rows in a sortable list', async () => {
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('餐盒')
      expect(screen.getByText('單點')).toBeTruthy()
      expect(screen.getByText('飲料')).toBeTruthy()
      expect(screen.getByText('水餃')).toBeTruthy()
      expect(screen.getByTestId('sortable-list')).toBeTruthy()
    })

    it('should render priority badges for each type', async () => {
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('餐盒')
      expect(screen.getByText('1')).toBeTruthy()
      expect(screen.getByText('2')).toBeTruthy()
      expect(screen.getByText('3')).toBeTruthy()
      expect(screen.getByText('4')).toBeTruthy()
    })

    it('should render drag handles for each type', async () => {
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('餐盒')
      const handles = screen.getAllByTestId('drag-handle')
      expect(handles.length).toBe(4)
    })

    it('should render edit buttons for each type', async () => {
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('餐盒')
      const editButtons = screen.getAllByTestId('edit-button')
      expect(editButtons.length).toBe(4)
    })

    it('should NOT render the Save Settings button (moved to parent)', async () => {
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )
      await screen.findByText('商品種類')
      expect(screen.queryByText('儲存設定')).toBeNull()
    })
  })

  describe('edit via modal', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('餐盒')
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)

      expect(screen.getByRole('dialog', { name: '編輯種類名稱' })).toBeTruthy()
    })

    it('should pre-fill the input with the current label', async () => {
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('餐盒')
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)

      expect(screen.getByDisplayValue('餐盒')).toBeTruthy()
    })

    it('should apply label change locally when confirm is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('餐盒')
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)

      const input = screen.getByDisplayValue('餐盒')
      await user.clear(input)
      await user.type(input, '主食')
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(screen.getByText('主食')).toBeTruthy()
      })
      // DB should NOT be updated yet
      const dbValue = await getCommodityTypeRepo().findById('ct-001')
      expect(dbValue?.label).toBe('餐盒')
    })

    it('should close modal when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('餐盒')
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)
      expect(screen.getByTestId('modal')).toBeTruthy()

      await user.click(screen.getByRole('button', { name: '取消' }))
      expect(screen.queryByTestId('modal')).toBeNull()
    })
  })

  describe('onHasChanges callback', () => {
    it('should call onHasChanges(true) when a label is changed', async () => {
      const onHasChanges = vi.fn()
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={onHasChanges}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('餐盒')
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)

      const input = screen.getByDisplayValue('餐盒')
      await user.clear(input)
      await user.type(input, '主食')
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(onHasChanges).toHaveBeenCalledWith(true)
      })
    })

    it('should call onHasChanges(true) when items are reordered', async () => {
      const onHasChanges = vi.fn()
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={onHasChanges}
          sectionRef={React.createRef()}
        />,
      )

      await screen.findByText('餐盒')
      await user.click(screen.getByTestId('trigger-reorder'))

      await waitFor(() => {
        expect(onHasChanges).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('SectionRef — getChangeSummary', () => {
    it('should return empty array when no changes', async () => {
      const ref = React.createRef<SectionRef>()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('餐盒')
      const summary = ref.current?.getChangeSummary() ?? []
      expect(summary).toEqual([])
    })

    it('should return label change in summary after edit', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('餐盒')
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)
      const input = screen.getByDisplayValue('餐盒')
      await user.clear(input)
      await user.type(input, '主食')
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(screen.getByText('主食')).toBeTruthy()
      })

      const summary = ref.current?.getChangeSummary() ?? []
      expect(summary.length).toBeGreaterThanOrEqual(1)
      expect(summary.some(s => s.type === 'label')).toBe(true)
    })

    it('should return reorder change in summary after drag', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('餐盒')
      await user.click(screen.getByTestId('trigger-reorder'))

      await waitFor(() => {
        const summary = ref.current?.getChangeSummary() ?? []
        expect(summary.some(s => s.type === 'reorder')).toBe(true)
      })
    })
  })

  describe('SectionRef — save', () => {
    it('should write label changes to DB when save is called', async () => {
      const ref = React.createRef<SectionRef>()
      const user = userEvent.setup()
      render(
        <CommodityTypeSection
          refreshKey={0}
          onHasChanges={vi.fn()}
          sectionRef={ref}
        />,
      )

      await screen.findByText('餐盒')
      const editButtons = screen.getAllByTestId('edit-button')
      await user.click(editButtons[0]!)
      const input = screen.getByDisplayValue('餐盒')
      await user.clear(input)
      await user.type(input, '主食')
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(screen.getByText('主食')).toBeTruthy()
      })

      // Call save via ref
      await act(async () => {
        await ref.current?.save()
      })

      // DB should now have the updated label
      const dbValue = await getCommodityTypeRepo().findById('ct-001')
      expect(dbValue?.label).toBe('主食')
    })
  })
})
