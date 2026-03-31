import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryTabs } from './category-tabs'
import type { CommodityType } from '@/lib/schemas'

/** Factory to create mock CommodityType objects */
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

const mockCategories: readonly CommodityType[] = [
  makeCategoryType({ id: 'ct-1', typeId: 'type-1', label: '便當' }),
  makeCategoryType({ id: 'ct-2', typeId: 'type-2', label: '單點' }),
  makeCategoryType({ id: 'ct-3', typeId: 'type-3', label: '飲料' }),
  makeCategoryType({ id: 'ct-4', typeId: 'type-4', label: '水餃' }),
]

describe('CategoryTabs', () => {
  it('should render all category labels as tabs', () => {
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedTypeId={null}
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByRole('tab', { name: '便當' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: '單點' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: '飲料' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: '水餃' })).toBeTruthy()
  })

  it('should render nothing when categories array is empty', () => {
    const { container } = render(
      <CategoryTabs categories={[]} selectedTypeId={null} onSelect={vi.fn()} />,
    )
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(0)
  })

  it('should apply active styling to selected category', () => {
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedTypeId="type-1"
        onSelect={vi.fn()}
      />,
    )
    const activeButton = screen.getByRole('tab', { name: '便當' })
    expect(activeButton.getAttribute('data-active')).toBe('true')
  })

  it('should not apply active styling to unselected categories', () => {
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedTypeId="type-1"
        onSelect={vi.fn()}
      />,
    )
    const inactiveButton = screen.getByRole('tab', { name: '單點' })
    expect(inactiveButton.getAttribute('data-active')).toBe('false')
  })

  it('should call onSelect with typeId when a tab is clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedTypeId={null}
        onSelect={onSelect}
      />,
    )
    await user.click(screen.getByRole('tab', { name: '飲料' }))
    expect(onSelect).toHaveBeenCalledWith('type-3')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('should mark no tabs as active when selectedTypeId is null', () => {
    const { container } = render(
      <CategoryTabs
        categories={mockCategories}
        selectedTypeId={null}
        onSelect={vi.fn()}
      />,
    )
    const activeButtons = container.querySelectorAll('[data-active="true"]')
    expect(activeButtons.length).toBe(0)
  })

  it('should render all categories as tab elements', () => {
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedTypeId="type-1"
        onSelect={vi.fn()}
      />,
    )
    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBe(4)
  })

  it('should have accessible role="tablist" on the container', () => {
    render(
      <CategoryTabs
        categories={mockCategories}
        selectedTypeId="type-1"
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByRole('tablist')).toBeTruthy()
  })

  it('should handle a single category', () => {
    const singleCategory = [mockCategories[0]!]
    render(
      <CategoryTabs
        categories={singleCategory}
        selectedTypeId="type-1"
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByRole('tab', { name: '便當' })).toBeTruthy()
  })
})
