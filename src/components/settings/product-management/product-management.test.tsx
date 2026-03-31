/**
 * Tests for ProductManagement page component.
 * Verifies unified "Save Settings" orchestration across all sections.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductManagement } from './product-management'
import type { SectionRef, ChangeSummaryItem } from './types'

// Track refs passed to sections and onHasChanges callbacks
let typeRef: SectionRef | null = null
let commodityRef: SectionRef | null = null
let orderTypeRef: SectionRef | null = null
let typeOnHasChanges: ((has: boolean) => void) | null = null

// Mock all child sections to isolate ProductManagement rendering
vi.mock('./commodity-type-section', () => ({
  CommodityTypeSection: vi.fn(
    ({
      onHasChanges,
      sectionRef,
    }: {
      refreshKey: number
      onHasChanges: (has: boolean) => void
      sectionRef: React.RefObject<SectionRef | null>
    }) => {
      typeOnHasChanges = onHasChanges
      if (sectionRef && typeRef) {
        sectionRef.current = typeRef
      }
      return (
        <div data-testid="commodity-type-section">CommodityTypeSection</div>
      )
    },
  ),
}))

vi.mock('./commodity-section', () => ({
  CommoditySection: vi.fn(
    ({
      sectionRef,
    }: {
      refreshKey: number
      onHasChanges: (has: boolean) => void
      sectionRef: React.RefObject<SectionRef | null>
    }) => {
      if (sectionRef && commodityRef) {
        sectionRef.current = commodityRef
      }
      return <div data-testid="commodity-section">CommoditySection</div>
    },
  ),
}))

vi.mock('./order-type-section', () => ({
  OrderTypeSection: vi.fn(
    ({
      sectionRef,
    }: {
      refreshKey: number
      onHasChanges: (has: boolean) => void
      sectionRef: React.RefObject<SectionRef | null>
    }) => {
      if (sectionRef && orderTypeRef) {
        sectionRef.current = orderTypeRef
      }
      return <div data-testid="order-type-section">OrderTypeSection</div>
    },
  ),
}))

vi.mock('./price-change-log-section', () => ({
  PriceChangeLogSection: (_props: { refreshKey: number }) => (
    <div data-testid="price-change-log-section">PriceChangeLogSection</div>
  ),
}))

vi.mock('./reset-section', () => ({
  ResetSection: () => <div data-testid="reset-section">ResetSection</div>,
}))

// Mock ConfirmModal
vi.mock('@/components/modal', () => ({
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
      <div data-testid="save-confirm-modal" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <button onClick={onConfirm}>confirm-save</button>
        <button onClick={onCancel}>cancel-save</button>
      </div>
    ) : null,
}))

// Mock sonner
const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()
vi.mock('@/components/ui/sonner', () => ({
  notify: {
    success: (...args: unknown[]) => mockNotifySuccess(...args),
    error: (...args: unknown[]) => mockNotifyError(...args),
  },
}))

function createMockSectionRef(
  summary: readonly ChangeSummaryItem[] = [],
  saveFn?: () => Promise<void>,
): SectionRef {
  return {
    save: saveFn ?? vi.fn(async () => {}),
    getChangeSummary: vi.fn(() => summary),
  }
}

describe('ProductManagement', () => {
  beforeEach(() => {
    typeRef = null
    commodityRef = null
    orderTypeRef = null
    typeOnHasChanges = null
    mockNotifySuccess.mockClear()
    mockNotifyError.mockClear()
  })

  it('should render all 5 sections', () => {
    render(<ProductManagement />)
    expect(screen.getByTestId('commodity-type-section')).toBeTruthy()
    expect(screen.getByTestId('commodity-section')).toBeTruthy()
    expect(screen.getByTestId('order-type-section')).toBeTruthy()
    expect(screen.getByTestId('price-change-log-section')).toBeTruthy()
    expect(screen.getByTestId('reset-section')).toBeTruthy()
  })

  it('should render the Save Settings button', () => {
    render(<ProductManagement />)
    expect(screen.getByText('儲存設定')).toBeTruthy()
  })

  it('should render Save Settings button as disabled when no changes', () => {
    render(<ProductManagement />)
    const saveBtn = screen.getByText('儲存設定').closest('button')
    expect(saveBtn?.disabled).toBe(true)
  })

  it('should enable Save Settings button when any section has changes', async () => {
    render(<ProductManagement />)

    // Simulate section reporting changes
    typeOnHasChanges?.(true)

    await waitFor(() => {
      const saveBtn = screen.getByText('儲存設定').closest('button')
      expect(saveBtn?.disabled).toBe(false)
    })
  })

  it('should disable Save Settings button when all sections revert changes', async () => {
    render(<ProductManagement />)

    typeOnHasChanges?.(true)
    await waitFor(() => {
      expect(screen.getByText('儲存設定').closest('button')?.disabled).toBe(
        false,
      )
    })

    typeOnHasChanges?.(false)
    await waitFor(() => {
      expect(screen.getByText('儲存設定').closest('button')?.disabled).toBe(
        true,
      )
    })
  })

  it('should open confirm modal with change summaries when save is clicked', async () => {
    const typeSummary: ChangeSummaryItem[] = [
      { type: 'label', description: '餐盒 → 主食' },
    ]
    const commoditySummary: ChangeSummaryItem[] = [
      { type: 'add', description: '新增商品：雞腿飯' },
    ]
    typeRef = createMockSectionRef(typeSummary)
    commodityRef = createMockSectionRef(commoditySummary)
    orderTypeRef = createMockSectionRef()

    const user = userEvent.setup()
    render(<ProductManagement />)

    // Enable the button
    typeOnHasChanges?.(true)

    await waitFor(() => {
      expect(screen.getByText('儲存設定').closest('button')?.disabled).toBe(
        false,
      )
    })

    await user.click(screen.getByText('儲存設定'))

    // Confirm modal should be visible with summaries
    expect(screen.getByTestId('save-confirm-modal')).toBeTruthy()
    expect(screen.getByText('餐盒 → 主食')).toBeTruthy()
    expect(screen.getByText('新增商品：雞腿飯')).toBeTruthy()
  })

  it('should call save() on all sections when confirm is clicked', async () => {
    const typeSave = vi.fn(async () => {})
    const commoditySave = vi.fn(async () => {})
    const orderTypeSave = vi.fn(async () => {})

    typeRef = createMockSectionRef(
      [{ type: 'label', description: 'test' }],
      typeSave,
    )
    commodityRef = createMockSectionRef([], commoditySave)
    orderTypeRef = createMockSectionRef([], orderTypeSave)

    const user = userEvent.setup()
    render(<ProductManagement />)

    typeOnHasChanges?.(true)

    await waitFor(() => {
      expect(screen.getByText('儲存設定').closest('button')?.disabled).toBe(
        false,
      )
    })

    await user.click(screen.getByText('儲存設定'))
    await user.click(screen.getByText('confirm-save'))

    await waitFor(() => {
      expect(typeSave).toHaveBeenCalled()
      expect(commoditySave).toHaveBeenCalled()
      expect(orderTypeSave).toHaveBeenCalled()
    })
  })

  it('should show success toast after saving', async () => {
    typeRef = createMockSectionRef([{ type: 'label', description: 'test' }])
    commodityRef = createMockSectionRef()
    orderTypeRef = createMockSectionRef()

    const user = userEvent.setup()
    render(<ProductManagement />)

    typeOnHasChanges?.(true)

    await waitFor(() => {
      expect(screen.getByText('儲存設定').closest('button')?.disabled).toBe(
        false,
      )
    })

    await user.click(screen.getByText('儲存設定'))
    await user.click(screen.getByText('confirm-save'))

    await waitFor(() => {
      expect(mockNotifySuccess).toHaveBeenCalledWith('設定已儲存')
    })
  })

  it('should show error toast if save fails', async () => {
    typeRef = createMockSectionRef(
      [{ type: 'label', description: 'test' }],
      async () => {
        throw new Error('DB error')
      },
    )
    commodityRef = createMockSectionRef()
    orderTypeRef = createMockSectionRef()

    const user = userEvent.setup()
    render(<ProductManagement />)

    typeOnHasChanges?.(true)

    await waitFor(() => {
      expect(screen.getByText('儲存設定').closest('button')?.disabled).toBe(
        false,
      )
    })

    await user.click(screen.getByText('儲存設定'))
    await user.click(screen.getByText('confirm-save'))

    await waitFor(() => {
      expect(mockNotifyError).toHaveBeenCalledWith('儲存失敗')
    })
  })

  it('should close confirm modal when cancel is clicked', async () => {
    typeRef = createMockSectionRef([{ type: 'label', description: 'test' }])
    commodityRef = createMockSectionRef()
    orderTypeRef = createMockSectionRef()

    const user = userEvent.setup()
    render(<ProductManagement />)

    typeOnHasChanges?.(true)

    await waitFor(() => {
      expect(screen.getByText('儲存設定').closest('button')?.disabled).toBe(
        false,
      )
    })

    await user.click(screen.getByText('儲存設定'))
    expect(screen.getByTestId('save-confirm-modal')).toBeTruthy()

    await user.click(screen.getByText('cancel-save'))
    expect(screen.queryByTestId('save-confirm-modal')).toBeNull()
  })
})
