/**
 * Tests for OrderTypeForm component.
 * Verifies form rendering, validation, add/edit modes,
 * color picker, and submit behavior.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderTypeForm, type OrderTypeFormProps } from './order-type-form'
import type { OrderType } from '@/lib/schemas'

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

const EXISTING_ORDER_TYPE: OrderType = {
  id: 'ot-001',
  name: '攤位',
  priority: 1,
  type: 'order',
  color: 'green',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
}

describe('OrderTypeForm', () => {
  let onSubmit: OrderTypeFormProps['onSubmit']
  let onClose: OrderTypeFormProps['onClose']

  beforeEach(() => {
    onSubmit = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as OrderTypeFormProps['onSubmit']
    onClose = vi.fn() as unknown as OrderTypeFormProps['onClose']
  })

  describe('rendering in add mode', () => {
    it('should render the add type title', () => {
      render(
        <OrderTypeForm
          open={true}
          orderType={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      // i18n: productMgmt.orderTypes.addType -> '新增分類'
      expect(screen.getByRole('dialog', { name: '新增分類' })).toBeTruthy()
    })

    it('should render empty name field', () => {
      render(
        <OrderTypeForm
          open={true}
          orderType={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      const nameInput = screen.getByLabelText('名稱')
      expect((nameInput as HTMLInputElement).value).toBe('')
    })

    it('should render color picker pills', () => {
      render(
        <OrderTypeForm
          open={true}
          orderType={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      // Should render all 7 color options
      expect(screen.getByTestId('color-pill-')).toBeTruthy() // none
      expect(screen.getByTestId('color-pill-green')).toBeTruthy()
      expect(screen.getByTestId('color-pill-blue')).toBeTruthy()
      expect(screen.getByTestId('color-pill-yellow')).toBeTruthy()
      expect(screen.getByTestId('color-pill-red')).toBeTruthy()
      expect(screen.getByTestId('color-pill-purple')).toBeTruthy()
      expect(screen.getByTestId('color-pill-gray')).toBeTruthy()
    })

    it('should render cancel and confirm buttons', () => {
      render(
        <OrderTypeForm
          open={true}
          orderType={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      expect(screen.getByRole('button', { name: '取消' })).toBeTruthy()
      expect(screen.getByRole('button', { name: '確認' })).toBeTruthy()
    })

    it('should not render when closed', () => {
      render(
        <OrderTypeForm
          open={false}
          orderType={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  describe('rendering in edit mode', () => {
    it('should render the edit type title', () => {
      render(
        <OrderTypeForm
          open={true}
          orderType={EXISTING_ORDER_TYPE}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )
      // i18n: productMgmt.orderTypes.editType -> '編輯分類'
      expect(screen.getByRole('dialog', { name: '編輯分類' })).toBeTruthy()
    })

    it('should pre-fill form with existing order type data', () => {
      render(
        <OrderTypeForm
          open={true}
          orderType={EXISTING_ORDER_TYPE}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      expect(screen.getByDisplayValue('攤位')).toBeTruthy()
    })

    it('should highlight the existing color in edit mode', () => {
      render(
        <OrderTypeForm
          open={true}
          orderType={EXISTING_ORDER_TYPE}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      const greenPill = screen.getByTestId('color-pill-green')
      // The green pill should have the selected ring style
      expect(greenPill.className).toContain('ring')
    })
  })

  describe('color picker interaction', () => {
    it('should select color when clicking a color pill', async () => {
      const user = userEvent.setup()
      render(
        <OrderTypeForm
          open={true}
          orderType={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      // Click blue pill
      await user.click(screen.getByTestId('color-pill-blue'))

      // Blue pill should now have ring style
      const bluePill = screen.getByTestId('color-pill-blue')
      expect(bluePill.className).toContain('ring')
    })
  })

  describe('form validation', () => {
    it('should not submit when name is empty', async () => {
      const user = userEvent.setup()
      render(
        <OrderTypeForm
          open={true}
          orderType={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      await user.click(screen.getByRole('button', { name: '確認' }))
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    it('should call onSubmit with form values when valid', async () => {
      const user = userEvent.setup()
      render(
        <OrderTypeForm
          open={true}
          orderType={null}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      const nameInput = screen.getByLabelText('名稱')
      await user.type(nameInput, '新分類')

      await user.click(screen.getByTestId('color-pill-red'))
      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '新分類',
            color: 'red',
          }),
        )
      })
    })

    it('should call onClose when cancel is clicked', async () => {
      const user = userEvent.setup()
      render(
        <OrderTypeForm
          open={true}
          orderType={null}
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
        <OrderTypeForm
          open={true}
          orderType={EXISTING_ORDER_TYPE}
          onSubmit={onSubmit}
          onClose={onClose}
        />,
      )

      const nameInput = screen.getByDisplayValue('攤位')
      await user.clear(nameInput)
      await user.type(nameInput, '外帶')

      await user.click(screen.getByRole('button', { name: '確認' }))

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '外帶',
            color: 'green',
          }),
        )
      })
    })
  })
})
