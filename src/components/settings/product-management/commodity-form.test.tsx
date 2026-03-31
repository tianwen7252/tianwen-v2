/**
 * Tests for CommodityForm component.
 * Verifies form rendering, validation, add/edit modes, and submit behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommodityForm, type CommodityFormProps } from './commodity-form'
import type { Commodity } from '@/lib/schemas'

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
}))

// ── Test Data ──────────────────────────────────────────────────────────────

const EXISTING_COMMODITY: Commodity = {
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

describe('CommodityForm', () => {
  let onSubmit: CommodityFormProps['onSubmit']
  let onClose: CommodityFormProps['onClose']

  beforeEach(() => {
    onSubmit = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as CommodityFormProps['onSubmit']
    onClose = vi.fn() as unknown as CommodityFormProps['onClose']
  })

  describe('rendering in add mode', () => {
    it('should render the add product title', () => {
      render(
        <CommodityForm
          open={true}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      expect(screen.getByRole('dialog', { name: '新增商品' })).toBeTruthy()
    })

    it('should render empty form fields', () => {
      render(
        <CommodityForm
          open={true}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      const nameInput = screen.getByLabelText('品名')
      expect((nameInput as HTMLInputElement).value).toBe('')

      const priceInput = screen.getByLabelText('價格')
      expect((priceInput as HTMLInputElement).value).toBe('0')
    })

    it('should render cancel and confirm buttons', () => {
      render(
        <CommodityForm
          open={true}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      expect(screen.getByRole('button', { name: '取消' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '確認' })).toBeTruthy()
    })

    it('should not render when closed', () => {
      render(
        <CommodityForm
          open={false}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('rendering in edit mode', () => {
    it('should render the edit product title', () => {
      render(
        <CommodityForm
          open={true}
          commodity={EXISTING_COMMODITY}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      expect(screen.getByRole('dialog', { name: '編輯商品' })).toBeTruthy()
    })

    it('should pre-fill form with existing commodity data', () => {
      render(
        <CommodityForm
          open={true}
          commodity={EXISTING_COMMODITY}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      expect(screen.getByDisplayValue('油淋雞腿飯')).toBeTruthy()
      expect(screen.getByDisplayValue('90')).toBeTruthy()
    })
  })

  describe('form validation', () => {
    it('should show error when name is empty on submit', async () => {
      const user = userEvent.setup()
      render(
        <CommodityForm
          open={true}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      // Set price but leave name empty
      const priceInput = screen.getByLabelText('價格')
      await user.type(priceInput, '100')

      await user.click(screen.getByRole('button', { name: '確認' }))

      // onSubmit should NOT have been called
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should show error when price is negative', async () => {
      const user = userEvent.setup()
      render(
        <CommodityForm
          open={true}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      const nameInput = screen.getByLabelText('品名')
      await user.type(nameInput, '測試商品')

      const priceInput = screen.getByLabelText('價格')
      await user.type(priceInput, '-10')

      await user.click(screen.getByRole('button', { name: '確認' }))

      // onSubmit should NOT have been called
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    it('should call onSubmit with form values when valid', async () => {
      const user = userEvent.setup()
      render(
        <CommodityForm
          open={true}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      const nameInput = screen.getByLabelText('品名')
      await user.type(nameInput, '新商品')

      const priceInput = screen.getByLabelText('價格')
      await user.type(priceInput, '120')

      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '新商品',
            price: 120,
          }),
        )
      })
    })

    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CommodityForm
          open={true}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      await user.click(screen.getByRole('button', { name: '取消' }))
      expect(onClose).toHaveBeenCalled()
    })

    it('should submit with edit values when in edit mode', async () => {
      const user = userEvent.setup()
      render(
        <CommodityForm
          open={true}
          commodity={EXISTING_COMMODITY}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      const nameInput = screen.getByDisplayValue('油淋雞腿飯')
      await user.clear(nameInput)
      await user.type(nameInput, '滷雞腿飯')

      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '滷雞腿飯',
            price: 90,
          }),
        )
      })
    })
  })

  describe('includesSoup toggle', () => {
    it('should render includesSoup field', () => {
      render(
        <CommodityForm
          open={true}
          commodity={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      expect(screen.getByText('附湯')).toBeTruthy()
    })
  })
})
