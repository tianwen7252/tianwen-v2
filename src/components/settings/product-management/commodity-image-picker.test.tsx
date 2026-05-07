import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommodityImagePicker } from './commodity-image-picker'
import { COMMODITY_IMAGE_KEYS } from '@/constants/commodity-images'

describe('CommodityImagePicker', () => {
  it('renders a tile for every catalogue key plus the clear tile', () => {
    render(<CommodityImagePicker value="" onChange={vi.fn()} />)

    expect(screen.getByTestId('image-picker-clear')).toBeTruthy()
    for (const key of COMMODITY_IMAGE_KEYS) {
      expect(screen.getByTestId(`image-tile-${key}`)).toBeTruthy()
    }
  })

  it('calls onChange with the selected key when a tile is clicked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<CommodityImagePicker value="" onChange={handleChange} />)

    await user.click(screen.getByTestId('image-tile-braised-pork-belly-rice'))
    expect(handleChange).toHaveBeenCalledWith('braised-pork-belly-rice')
  })

  it('calls onChange with empty string when the "no image" tile is clicked', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <CommodityImagePicker
        value="braised-pork-belly-rice"
        onChange={handleChange}
      />,
    )

    await user.click(screen.getByTestId('image-picker-clear'))
    expect(handleChange).toHaveBeenCalledWith('')
  })

  it('marks the currently selected tile as pressed', () => {
    render(
      <CommodityImagePicker
        value="braised-pork-belly-rice"
        onChange={vi.fn()}
      />,
    )

    const tile = screen.getByTestId('image-tile-braised-pork-belly-rice')
    expect(tile.getAttribute('aria-pressed')).toBe('true')
  })

  it('marks the clear tile as pressed when value is empty', () => {
    render(<CommodityImagePicker value="" onChange={vi.fn()} />)
    expect(
      screen.getByTestId('image-picker-clear').getAttribute('aria-pressed'),
    ).toBe('true')
  })

  it('filters tiles by the search query', () => {
    render(<CommodityImagePicker value="" onChange={vi.fn()} />)
    const search = screen.getByTestId('image-picker-search')

    fireEvent.change(search, { target: { value: 'dumpling' } })

    // Dumpling images stay
    expect(screen.queryByTestId('image-tile-chive-dumpling')).toBeTruthy()
    // Non-dumpling images are hidden
    expect(
      screen.queryByTestId('image-tile-braised-pork-belly-rice'),
    ).toBeNull()
  })

  it('shows an empty-state hint when no tile matches the search', () => {
    render(<CommodityImagePicker value="" onChange={vi.fn()} />)
    fireEvent.change(screen.getByTestId('image-picker-search'), {
      target: { value: 'no-such-key-xyz' },
    })

    expect(screen.getByTestId('image-picker-empty')).toBeTruthy()
  })
})
