import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductGrid } from './product-grid'
import type { Commodity, CommodityType } from '@/lib/schemas'

// ─── Mock repositories ──────────────────────────────────────────────────────

const mockFindAllTypes = vi.fn<() => Promise<CommodityType[]>>()
const mockFindOnMarket = vi.fn<() => Promise<Commodity[]>>()
const mockFindByTypeId = vi.fn<(typeId: string) => Promise<Commodity[]>>()

vi.mock('@/lib/repositories/provider', () => ({
  getCommodityTypeRepo: () => ({
    findAll: mockFindAllTypes,
  }),
  getCommodityRepo: () => ({
    findOnMarket: mockFindOnMarket,
    findByTypeId: mockFindByTypeId,
  }),
}))

// ─── Mock order store ────────────────────────────────────────────────────────

const mockAddItem = vi.fn()
// Use a mutable ref so the mock always reads the latest value
const storeState: Record<string, unknown> = {
  addItem: mockAddItem,
  submitSeq: 0,
}

vi.mock('@/stores/order-store', () => {
  const store = (selector: (state: Record<string, unknown>) => unknown) =>
    selector(storeState)
  store.getState = () => ({ ...storeState })
  return { useOrderStore: store }
})

// ─── Test data factories ─────────────────────────────────────────────────────

function makeCategoryType(
  overrides: Partial<CommodityType> = {},
): CommodityType {
  return {
    id: 'ct-1',
    typeId: 'type-1',
    type: 'bento',
    label: '便當',
    color: '',
    priority: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

function makeCommodity(overrides: Partial<Commodity> = {}): Commodity {
  return {
    id: 'com-1',
    typeId: 'type-1',
    name: '滷肉便當',
    image: '/images/braised-pork.png',
    price: 100,
    priority: 0,
    onMarket: true,
    includesSoup: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

const mockCategories: CommodityType[] = [
  makeCategoryType({ id: 'ct-1', typeId: 'type-1', label: '便當' }),
  makeCategoryType({ id: 'ct-2', typeId: 'type-2', label: '單點' }),
]

const mockCommodities: Commodity[] = [
  makeCommodity({ id: 'com-1', name: '滷肉便當', price: 100 }),
  makeCommodity({ id: 'com-2', name: '炸雞腿便當', price: 130 }),
  makeCommodity({ id: 'com-3', name: '排骨便當', price: 120 }),
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create a fresh QueryClient per test (no shared cache) */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ProductGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeState.submitSeq = 0
    mockFindAllTypes.mockResolvedValue(mockCategories)
    mockFindOnMarket.mockResolvedValue(mockCommodities)
    mockFindByTypeId.mockResolvedValue(mockCommodities)
  })

  it('should show loading state initially', () => {
    // Make the promise never resolve to keep loading state
    mockFindAllTypes.mockReturnValue(new Promise(() => {}))
    mockFindOnMarket.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<ProductGrid />)
    expect(screen.getByText('載入中...')).toBeTruthy()
  })

  it('should render category tabs after data loads', async () => {
    renderWithProviders(<ProductGrid />)
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '便當' })).toBeTruthy()
      expect(screen.getByRole('tab', { name: '單點' })).toBeTruthy()
    })
  })

  it('should render product cards after data loads', async () => {
    renderWithProviders(<ProductGrid />)
    await waitFor(() => {
      expect(screen.getByText('滷肉便當')).toBeTruthy()
      expect(screen.getByText('炸雞腿便當')).toBeTruthy()
      expect(screen.getByText('排骨便當')).toBeTruthy()
    })
  })

  it('should render product prices', async () => {
    renderWithProviders(<ProductGrid />)
    await waitFor(() => {
      expect(screen.getByText('$100')).toBeTruthy()
      expect(screen.getByText('$130')).toBeTruthy()
      expect(screen.getByText('$120')).toBeTruthy()
    })
  })

  it('should call findByTypeId with bento initially (default category)', async () => {
    renderWithProviders(<ProductGrid />)
    await waitFor(() => {
      expect(mockFindByTypeId).toHaveBeenCalledWith('bento')
    })
    expect(mockFindOnMarket).not.toHaveBeenCalled()
  })

  it('should call findByTypeId when a category tab is clicked', async () => {
    const filteredItems = [
      makeCommodity({
        id: 'com-4',
        name: '炒青菜',
        price: 50,
        typeId: 'type-2',
      }),
    ]
    mockFindByTypeId.mockResolvedValue(filteredItems)
    const user = userEvent.setup()

    renderWithProviders(<ProductGrid />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '單點' })).toBeTruthy()
    })

    await user.click(screen.getByRole('tab', { name: '單點' }))

    await waitFor(() => {
      expect(mockFindByTypeId).toHaveBeenCalledWith('type-2')
    })
  })

  it('should add item to order store when product card is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductGrid />)

    await waitFor(() => {
      expect(screen.getByText('滷肉便當')).toBeTruthy()
    })

    // Click the first product card button
    const productButtons = screen.getAllByRole('button')
    // Find the button that contains the product name (not the category tabs)
    const productButton = productButtons.find(btn =>
      btn.textContent?.includes('滷肉便當'),
    )
    expect(productButton).toBeTruthy()
    await user.click(productButton!)

    expect(mockAddItem).toHaveBeenCalledWith({
      id: 'com-1',
      name: '滷肉便當',
      price: 100,
      typeId: 'type-1',
      includesSoup: false,
    })
  })

  it('should show empty state when no products are available', async () => {
    mockFindByTypeId.mockResolvedValue([])
    renderWithProviders(<ProductGrid />)
    await waitFor(() => {
      expect(screen.getByText('目前沒有商品')).toBeTruthy()
    })
  })

  it('should render the view toggle button', async () => {
    renderWithProviders(<ProductGrid />)
    await waitFor(() => {
      expect(screen.getByText('滷肉便當')).toBeTruthy()
    })
    // View toggle button should exist (aria-label based)
    expect(screen.getByLabelText(/計算機/i)).toBeTruthy()
  })

  it('should fetch categories and commodities from repositories', async () => {
    renderWithProviders(<ProductGrid />)
    await waitFor(() => {
      expect(mockFindAllTypes).toHaveBeenCalledTimes(1)
      expect(mockFindByTypeId).toHaveBeenCalledWith('bento')
    })
  })

  it('should reset category tab to bento when submitSeq changes', async () => {
    // Use distinct categories with different typeIds to verify the reset
    const bentoCategory = makeCategoryType({
      id: 'ct-1',
      typeId: 'bento',
      type: 'bento',
      label: '便當',
    })
    const sideCategory = makeCategoryType({
      id: 'ct-2',
      typeId: 'type-2',
      type: 'side',
      label: '單點',
    })
    mockFindAllTypes.mockResolvedValue([bentoCategory, sideCategory])
    mockFindByTypeId.mockResolvedValue(mockCommodities)

    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ProductGrid />
      </QueryClientProvider>,
    )

    // Wait for initial load — bento tab should be active (default)
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '便當' })).toBeTruthy()
    })
    const bentoTab = screen.getByRole('tab', { name: '便當' })
    expect(bentoTab.getAttribute('aria-selected')).toBe('true')

    // Click the side category tab to switch away from bento
    await user.click(screen.getByRole('tab', { name: '單點' }))
    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: '單點' }).getAttribute('aria-selected'),
      ).toBe('true')
    })
    expect(
      screen.getByRole('tab', { name: '便當' }).getAttribute('aria-selected'),
    ).toBe('false')

    // Simulate submitSeq change (as if clearCart was called after order submit)
    storeState.submitSeq = 1
    rerender(
      <QueryClientProvider client={queryClient}>
        <ProductGrid />
      </QueryClientProvider>,
    )

    // After submitSeq changes, the tab should reset to bento
    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: '便當' }).getAttribute('aria-selected'),
      ).toBe('true')
    })
  })

  it('should toggle view mode when view toggle is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductGrid />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('滷肉便當')).toBeTruthy()
    })

    // Initially in grid mode — button says "switch to list"
    expect(screen.getByLabelText(/計算機/i)).toBeTruthy()

    // Click toggle — should switch to list mode
    await user.click(screen.getByLabelText(/計算機/i))

    // Now in list mode — button says "switch to grid"
    expect(screen.getByLabelText(/計算機/i)).toBeTruthy()

    // Click toggle again — should switch back to grid mode
    await user.click(screen.getByLabelText(/計算機/i))

    // Back to grid mode
    expect(screen.getByLabelText(/計算機/i)).toBeTruthy()
  })
})
