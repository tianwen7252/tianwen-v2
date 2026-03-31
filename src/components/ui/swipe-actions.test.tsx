import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SwipeActions } from './swipe-actions'

/** Helper to create a minimal SwipeAction for testing */
function createAction(
  overrides: Partial<{
    readonly key: string
    readonly icon: React.ReactNode
    readonly color: string
    readonly label: string
    readonly onClick: () => void
  }> = {},
) {
  return {
    key: overrides.key ?? 'edit',
    icon: overrides.icon ?? <span>icon</span>,
    color: overrides.color ?? '#3b82f6',
    label: overrides.label ?? 'Edit',
    onClick: overrides.onClick ?? vi.fn(),
  } as const
}

describe('SwipeActions', () => {
  it('should render children content', () => {
    render(
      <SwipeActions actions={[createAction()]}>
        <span>Row content</span>
      </SwipeActions>,
    )
    expect(screen.getByText('Row content')).toBeTruthy()
  })

  it('should have data-testid on outer container', () => {
    render(
      <SwipeActions actions={[createAction()]}>
        <span>Row</span>
      </SwipeActions>,
    )
    expect(screen.getByTestId('swipe-actions')).toBeTruthy()
  })

  it('should render action buttons with data-testid="swipe-action-{key}"', () => {
    const actions = [
      createAction({ key: 'edit', label: 'Edit' }),
      createAction({ key: 'delete', label: 'Delete', color: '#ef4444' }),
    ]
    render(
      <SwipeActions actions={actions}>
        <span>Row</span>
      </SwipeActions>,
    )
    expect(screen.getByTestId('swipe-action-edit')).toBeTruthy()
    expect(screen.getByTestId('swipe-action-delete')).toBeTruthy()
  })

  it('should render the correct number of action buttons', () => {
    const actions = [
      createAction({ key: 'a' }),
      createAction({ key: 'b' }),
      createAction({ key: 'c' }),
    ]
    render(
      <SwipeActions actions={actions}>
        <span>Row</span>
      </SwipeActions>,
    )
    expect(screen.getByTestId('swipe-action-a')).toBeTruthy()
    expect(screen.getByTestId('swipe-action-b')).toBeTruthy()
    expect(screen.getByTestId('swipe-action-c')).toBeTruthy()
  })

  it('should set aria-label on each action button', () => {
    const actions = [
      createAction({ key: 'edit', label: 'Edit item' }),
      createAction({ key: 'delete', label: 'Delete item' }),
    ]
    render(
      <SwipeActions actions={actions}>
        <span>Row</span>
      </SwipeActions>,
    )
    expect(
      screen.getByTestId('swipe-action-edit').getAttribute('aria-label'),
    ).toBe('Edit item')
    expect(
      screen.getByTestId('swipe-action-delete').getAttribute('aria-label'),
    ).toBe('Delete item')
  })

  it('should initially have foreground at translateX(0px)', () => {
    render(
      <SwipeActions actions={[createAction()]}>
        <span>Row content</span>
      </SwipeActions>,
    )
    const foreground = screen.getByText('Row content').parentElement!
    expect(foreground.style.transform).toBe('translateX(0px)')
  })

  it('should call onClick when an action button is clicked', () => {
    const onClick = vi.fn()
    const actions = [createAction({ key: 'edit', onClick })]
    render(
      <SwipeActions actions={actions}>
        <span>Row</span>
      </SwipeActions>,
    )
    fireEvent.click(screen.getByTestId('swipe-action-edit'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should reset offsetX to 0 after action button is clicked (closes actions)', () => {
    const onClick = vi.fn()
    const actions = [createAction({ key: 'edit', onClick })]
    render(
      <SwipeActions actions={actions}>
        <span>Row content</span>
      </SwipeActions>,
    )

    // Simulate opening via swipe: touchStart -> touchMove -> touchEnd past threshold
    const foreground = screen.getByText('Row content').parentElement!
    fireEvent.touchStart(foreground, {
      touches: [{ clientX: 300, clientY: 100 }],
    })
    // Establish horizontal direction
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 285, clientY: 100 }],
    })
    // Move past half of total action width (64/2 = 32)
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 230, clientY: 100 }],
    })
    fireEvent.touchEnd(foreground)

    // Now it should be snapped open
    expect(foreground.style.transform).toBe('translateX(-64px)')

    // Click the action
    fireEvent.click(screen.getByTestId('swipe-action-edit'))
    expect(onClick).toHaveBeenCalledTimes(1)

    // Should close (snap back)
    expect(foreground.style.transform).toBe('translateX(0px)')
  })

  it('should close when foreground content is clicked while actions are open', () => {
    const actions = [createAction({ key: 'edit' })]
    render(
      <SwipeActions actions={actions}>
        <span>Row content</span>
      </SwipeActions>,
    )

    const foreground = screen.getByText('Row content').parentElement!

    // Open via swipe
    fireEvent.touchStart(foreground, {
      touches: [{ clientX: 300, clientY: 100 }],
    })
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 285, clientY: 100 }],
    })
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 230, clientY: 100 }],
    })
    fireEvent.touchEnd(foreground)

    // Verify open
    expect(foreground.style.transform).toBe('translateX(-64px)')

    // Click foreground to close
    fireEvent.click(foreground)

    // Should snap back
    expect(foreground.style.transform).toBe('translateX(0px)')
  })

  it('should apply custom className to outer container', () => {
    render(
      <SwipeActions actions={[createAction()]} className="my-custom-class">
        <span>Row</span>
      </SwipeActions>,
    )
    expect(
      screen.getByTestId('swipe-actions').classList.contains('my-custom-class'),
    ).toBe(true)
  })

  it('should snap back when swipe distance is below half of total action width', () => {
    const actions = [createAction({ key: 'edit' })]
    render(
      <SwipeActions actions={actions} actionWidth={64}>
        <span>Row content</span>
      </SwipeActions>,
    )

    const foreground = screen.getByText('Row content').parentElement!
    fireEvent.touchStart(foreground, {
      touches: [{ clientX: 300, clientY: 100 }],
    })
    // Establish horizontal
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 285, clientY: 100 }],
    })
    // Move only 20px left — below half of 64 (32)
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 280, clientY: 100 }],
    })
    fireEvent.touchEnd(foreground)

    // Should snap back
    expect(foreground.style.transform).toBe('translateX(0px)')
  })

  it('should snap to fully open when swipe exceeds half of total action width', () => {
    const actions = [
      createAction({ key: 'edit' }),
      createAction({ key: 'delete', color: '#ef4444' }),
    ]
    render(
      <SwipeActions actions={actions} actionWidth={64}>
        <span>Row content</span>
      </SwipeActions>,
    )

    const foreground = screen.getByText('Row content').parentElement!
    // Total action width = 2 * 64 = 128. Half = 64.
    fireEvent.touchStart(foreground, {
      touches: [{ clientX: 300, clientY: 100 }],
    })
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 285, clientY: 100 }],
    })
    // Move 80px left — past half of 128 (64)
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 220, clientY: 100 }],
    })
    fireEvent.touchEnd(foreground)

    // Should snap to full open: -128px
    expect(foreground.style.transform).toBe('translateX(-128px)')
  })

  it('should not respond to vertical swipe', () => {
    const actions = [createAction({ key: 'edit' })]
    render(
      <SwipeActions actions={actions}>
        <span>Row content</span>
      </SwipeActions>,
    )

    const foreground = screen.getByText('Row content').parentElement!
    fireEvent.touchStart(foreground, {
      touches: [{ clientX: 300, clientY: 100 }],
    })
    // Vertical movement
    fireEvent.touchMove(foreground, {
      touches: [{ clientX: 300, clientY: 200 }],
    })
    fireEvent.touchEnd(foreground)

    expect(foreground.style.transform).toBe('translateX(0px)')
  })

  it('should render action icons inside action buttons', () => {
    const actions = [
      createAction({
        key: 'edit',
        icon: <span data-testid="edit-icon">E</span>,
      }),
    ]
    render(
      <SwipeActions actions={actions}>
        <span>Row</span>
      </SwipeActions>,
    )
    // The icon should be rendered inside the action button
    const actionBtn = screen.getByTestId('swipe-action-edit')
    expect(actionBtn.querySelector('[data-testid="edit-icon"]')).toBeTruthy()
  })
})
