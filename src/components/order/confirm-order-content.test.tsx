import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CategoryGroup } from '@/lib/group-cart-items'
import { ConfirmOrderContent } from './confirm-order-content'
import {
  getOrderTypeRepo,
  resetMockRepositories,
} from '@/test/mock-repositories'

// Mock the repository provider so OrderNoteTags can load from mock DB
vi.mock('@/lib/repositories', () => ({
  getOrderTypeRepo: () => getOrderTypeRepo(),
}))

// ─── Factories ───────────────────────────────────────────────────────────────

function makeBentoGroup(overrides: Partial<CategoryGroup> = {}): CategoryGroup {
  return {
    key: 'bento',
    label: 'order.categoryBento',
    items: [
      {
        id: 'item-1',
        commodityId: 'com-1',
        typeId: 'bento',
        name: '雞腿飯',
        price: 100,
        quantity: 2,
        note: '',
        includesSoup: true,
      },
    ],
    ...overrides,
  }
}

function makeDrinkGroup(overrides: Partial<CategoryGroup> = {}): CategoryGroup {
  return {
    key: 'drink',
    label: 'order.categoryDrink',
    items: [
      {
        id: 'item-2',
        commodityId: 'com-2',
        typeId: 'drink',
        name: '紅茶',
        price: 30,
        quantity: 1,
        note: '',
        includesSoup: false,
      },
    ],
    ...overrides,
  }
}

function makeDiscountGroup(
  overrides: Partial<CategoryGroup> = {},
): CategoryGroup {
  return {
    key: 'discount',
    label: 'order.categoryDiscount',
    items: [],
    discounts: [
      {
        id: 'disc-1',
        label: '會員折扣',
        amount: 50,
      },
    ],
    ...overrides,
  }
}

const defaultProps = {
  groups: [] as readonly CategoryGroup[],
  selectedTags: [] as string[],
  onSelectedTagsChange: vi.fn(),
  bentoCount: 0,
  soupCount: 0,
  total: 0,
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ConfirmOrderContent', () => {
  beforeEach(() => {
    resetMockRepositories()
  })

  afterEach(() => {
    resetMockRepositories()
  })

  it('should render categorized items with category headers', () => {
    const groups = [makeBentoGroup(), makeDrinkGroup()]
    render(
      <ConfirmOrderContent {...defaultProps} groups={groups} total={230} />,
    )
    // Category headers (translated from i18n keys)
    expect(screen.getByText('餐盒')).toBeTruthy()
    expect(screen.getByText('飲料')).toBeTruthy()
  })

  it('should render item rows with name, quantity, and price', () => {
    const groups = [makeBentoGroup()]
    render(
      <ConfirmOrderContent {...defaultProps} groups={groups} total={200} />,
    )
    expect(screen.getByText('雞腿飯')).toBeTruthy()
    expect(screen.getByText('x2')).toBeTruthy()
    expect(screen.getByText('$200')).toBeTruthy()
  })

  it('should render discount rows with negative amounts', () => {
    const groups = [makeDiscountGroup()]
    render(<ConfirmOrderContent {...defaultProps} groups={groups} total={0} />)
    expect(screen.getByText('優惠')).toBeTruthy()
    expect(screen.getByText('會員折扣')).toBeTruthy()
    expect(screen.getByText('-$50')).toBeTruthy()
  })

  it('should render OrderNoteTags section', async () => {
    render(<ConfirmOrderContent {...defaultProps} />)
    // i18n key: order.orderNote -> '訂單備註'
    expect(screen.getByText('訂單備註')).toBeTruthy()
    // Default note tags load async from DB
    await screen.findByText('攤位')
    expect(screen.getByText('外送')).toBeTruthy()
    expect(screen.getByText('電話自取')).toBeTruthy()
  })

  it('should render ChangePrediction when total > 0', () => {
    render(<ConfirmOrderContent {...defaultProps} total={140} />)
    // Change prediction for total=140: $1000 找 $860, $500 找 $360, $200 找 $60
    expect(screen.getByText('$1000 找 $860')).toBeTruthy()
    expect(screen.getByText('$500 找 $360')).toBeTruthy()
    expect(screen.getByText('$200 找 $60')).toBeTruthy()
  })

  it('should not render ChangePrediction badges when total is 0', () => {
    render(<ConfirmOrderContent {...defaultProps} total={0} />)
    expect(screen.queryByTestId('change-badge')).toBeNull()
  })

  it('should show bento and soup counts when bentoCount > 0', () => {
    render(
      <ConfirmOrderContent
        {...defaultProps}
        bentoCount={3}
        soupCount={3}
        total={300}
      />,
    )
    const bentoSoupRow = screen.getByTestId('confirm-bento-soup-row')
    expect(bentoSoupRow.textContent).toContain('3個便當')
    expect(bentoSoupRow.textContent).toContain('3杯湯')
  })

  it('should not show bento/soup row when bentoCount is 0', () => {
    render(
      <ConfirmOrderContent
        {...defaultProps}
        bentoCount={0}
        soupCount={0}
        total={30}
      />,
    )
    expect(screen.queryByTestId('confirm-bento-soup-row')).toBeNull()
  })

  it('should render empty left panel when groups is empty', () => {
    render(<ConfirmOrderContent {...defaultProps} groups={[]} />)
    // Right panel should still render (OrderNoteTags)
    expect(screen.getByText('訂單備註')).toBeTruthy()
  })
})
