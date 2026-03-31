/**
 * Tests for PriceChangeLogSection component.
 * Verifies rendering, pagination, date grouping, and empty state.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PriceChangeLogSection } from './price-change-log-section'
import {
  getPriceChangeLogRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'

// Mock the repository provider to use in-memory mock repositories
vi.mock('@/lib/repositories', () => ({
  getPriceChangeLogRepo: () => getPriceChangeLogRepo(),
}))

describe('PriceChangeLogSection', () => {
  beforeEach(() => {
    resetMockRepositories()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the section title', async () => {
    render(<PriceChangeLogSection refreshKey={0} />)

    await waitFor(() => {
      expect(screen.getByText('歷史價格變動')).toBeDefined()
    })
  })

  it('shows empty state when no logs exist', async () => {
    render(<PriceChangeLogSection refreshKey={0} />)

    await waitFor(() => {
      expect(screen.getByText('尚無價格變動紀錄')).toBeDefined()
    })
  })

  it('displays price change entries', async () => {
    const repo = getPriceChangeLogRepo()
    await repo.create({
      commodityId: 'com-001',
      commodityName: '滷肉便當',
      oldPrice: 100,
      newPrice: 120,
    })

    render(<PriceChangeLogSection refreshKey={0} />)

    await waitFor(() => {
      expect(screen.getByText('滷肉便當')).toBeDefined()
      expect(screen.getByText('$100')).toBeDefined()
      expect(screen.getByText('$120')).toBeDefined()
    })
  })

  it('groups entries by date', async () => {
    const repo = getPriceChangeLogRepo()

    // Create two entries at the same timestamp (same date)
    await repo.create({
      commodityId: 'com-001',
      commodityName: '滷肉便當',
      oldPrice: 100,
      newPrice: 120,
    })
    await repo.create({
      commodityId: 'com-002',
      commodityName: '紅茶',
      oldPrice: 30,
      newPrice: 35,
    })

    render(<PriceChangeLogSection refreshKey={0} />)

    await waitFor(() => {
      // Both items should be rendered
      expect(screen.getByText('滷肉便當')).toBeDefined()
      expect(screen.getByText('紅茶')).toBeDefined()
    })
  })

  it('does not show pagination when total items fit on one page', async () => {
    const repo = getPriceChangeLogRepo()
    await repo.create({
      commodityId: 'com-001',
      commodityName: '滷肉便當',
      oldPrice: 100,
      newPrice: 120,
    })

    render(<PriceChangeLogSection refreshKey={0} />)

    await waitFor(() => {
      expect(screen.getByText('滷肉便當')).toBeDefined()
    })

    // Pagination buttons should not be rendered when only 1 item
    expect(screen.queryByText('上一頁')).toBeNull()
    expect(screen.queryByText('下一頁')).toBeNull()
  })

  it('refreshes when refreshKey changes', async () => {
    const { rerender } = render(<PriceChangeLogSection refreshKey={0} />)

    await waitFor(() => {
      expect(screen.getByText('尚無價格變動紀錄')).toBeDefined()
    })

    // Add a log entry
    const repo = getPriceChangeLogRepo()
    await repo.create({
      commodityId: 'com-001',
      commodityName: '滷肉便當',
      oldPrice: 100,
      newPrice: 120,
    })

    // Re-render with new refreshKey
    rerender(<PriceChangeLogSection refreshKey={1} />)

    await waitFor(() => {
      expect(screen.getByText('滷肉便當')).toBeDefined()
    })
  })
})
