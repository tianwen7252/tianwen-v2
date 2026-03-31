/**
 * Tests for the PaginationControls component.
 * Verifies rendering, navigation, boundary disabling, and null return.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PaginationControls } from './pagination-controls'

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PaginationControls', () => {
  it('renders page info with correct numbers', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={10}
        onPageChange={vi.fn()}
      />,
    )

    // zh-TW default: "第 3 / 10 頁"
    expect(screen.getByText(/3.*\/.*10/)).toBeTruthy()
  })

  it('calls onPageChange with page-1 when Previous clicked', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()

    render(
      <PaginationControls
        currentPage={5}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    )

    // zh-TW: "上一頁"
    await user.click(screen.getByText('上一頁'))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('calls onPageChange with page+1 when Next clicked', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()

    render(
      <PaginationControls
        currentPage={5}
        totalPages={10}
        onPageChange={onPageChange}
      />,
    )

    // zh-TW: "下一頁"
    await user.click(screen.getByText('下一頁'))
    expect(onPageChange).toHaveBeenCalledWith(6)
  })

  it('disables Previous on page 1', () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    )

    const prevButton = screen.getByText('上一頁').closest('button')
    expect(prevButton?.disabled).toBe(true)
  })

  it('disables Next on last page', () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    )

    const nextButton = screen.getByText('下一頁').closest('button')
    expect(nextButton?.disabled).toBe(true)
  })

  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('returns null when totalPages is 0', () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={0}
        onPageChange={vi.fn()}
      />,
    )

    expect(container.innerHTML).toBe('')
  })

  it('enables both buttons when on a middle page', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={vi.fn()}
      />,
    )

    const prevButton = screen.getByText('上一頁').closest('button')
    const nextButton = screen.getByText('下一頁').closest('button')
    expect(prevButton?.disabled).toBe(false)
    expect(nextButton?.disabled).toBe(false)
  })

  it('does not call onPageChange when Previous is disabled and clicked', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()

    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
      />,
    )

    // Click disabled Previous button
    await user.click(screen.getByText('上一頁'))
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('does not call onPageChange when Next is disabled and clicked', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()

    render(
      <PaginationControls
        currentPage={5}
        totalPages={5}
        onPageChange={onPageChange}
      />,
    )

    // Click disabled Next button
    await user.click(screen.getByText('下一頁'))
    expect(onPageChange).not.toHaveBeenCalled()
  })
})
