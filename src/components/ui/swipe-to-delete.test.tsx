import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SwipeToDelete } from './swipe-to-delete'

describe('SwipeToDelete', () => {
  it('should render children', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()}>
        <span>Item content</span>
      </SwipeToDelete>,
    )
    expect(screen.getByText('Item content')).toBeTruthy()
  })

  it('should have data-testid for identification', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()}>
        <span>Item</span>
      </SwipeToDelete>,
    )
    expect(screen.getByTestId('swipe-to-delete')).toBeTruthy()
  })

  it('should call onDelete when swiped past threshold', () => {
    vi.useFakeTimers()
    const onDelete = vi.fn()
    render(
      <SwipeToDelete onDelete={onDelete} threshold={80}>
        <span>Swipeable</span>
      </SwipeToDelete>,
    )

    const content = screen.getByText('Swipeable').parentElement!
    fireEvent.touchStart(content, {
      touches: [{ clientX: 300, clientY: 100 }],
    })
    // Move left 10px first to establish horizontal direction
    fireEvent.touchMove(content, {
      touches: [{ clientX: 285, clientY: 100 }],
    })
    // Move past threshold
    fireEvent.touchMove(content, {
      touches: [{ clientX: 200, clientY: 100 }],
    })
    fireEvent.touchEnd(content)

    vi.advanceTimersByTime(200)
    expect(onDelete).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('should not call onDelete when swipe is below threshold', () => {
    const onDelete = vi.fn()
    render(
      <SwipeToDelete onDelete={onDelete} threshold={80}>
        <span>Swipeable</span>
      </SwipeToDelete>,
    )

    const content = screen.getByText('Swipeable').parentElement!
    fireEvent.touchStart(content, {
      touches: [{ clientX: 300, clientY: 100 }],
    })
    fireEvent.touchMove(content, {
      touches: [{ clientX: 285, clientY: 100 }],
    })
    // Only move 30px — below 80px threshold
    fireEvent.touchMove(content, {
      touches: [{ clientX: 270, clientY: 100 }],
    })
    fireEvent.touchEnd(content)

    expect(onDelete).not.toHaveBeenCalled()
  })

  it('should not trigger on vertical swipe', () => {
    const onDelete = vi.fn()
    render(
      <SwipeToDelete onDelete={onDelete} threshold={80}>
        <span>Swipeable</span>
      </SwipeToDelete>,
    )

    const content = screen.getByText('Swipeable').parentElement!
    fireEvent.touchStart(content, {
      touches: [{ clientX: 300, clientY: 100 }],
    })
    // Vertical movement
    fireEvent.touchMove(content, {
      touches: [{ clientX: 300, clientY: 200 }],
    })
    fireEvent.touchEnd(content)

    expect(onDelete).not.toHaveBeenCalled()
  })

  it('should not allow swipe right (positive offset)', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()}>
        <span>Swipeable</span>
      </SwipeToDelete>,
    )

    const content = screen.getByText('Swipeable').parentElement!
    fireEvent.touchStart(content, {
      touches: [{ clientX: 100, clientY: 100 }],
    })
    fireEvent.touchMove(content, {
      touches: [{ clientX: 115, clientY: 100 }],
    })
    fireEvent.touchMove(content, {
      touches: [{ clientX: 200, clientY: 100 }],
    })
    fireEvent.touchEnd(content)

    // Content should not be offset to the right
    expect(content.style.transform).toBe('translateX(0px)')
  })

  it('should apply custom className', () => {
    render(
      <SwipeToDelete onDelete={vi.fn()} className="custom-class">
        <span>Item</span>
      </SwipeToDelete>,
    )
    expect(
      screen.getByTestId('swipe-to-delete').classList.contains('custom-class'),
    ).toBe(true)
  })
})
