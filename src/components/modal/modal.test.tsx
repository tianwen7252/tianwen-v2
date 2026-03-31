import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal, Modal, ModalCard } from './modal'

describe('ModalCard', () => {
  it('should render children', () => {
    render(<ModalCard>Card content</ModalCard>)
    expect(screen.getByText('Card content')).toBeTruthy()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <ModalCard className="custom-class">Content</ModalCard>,
    )
    expect(container.firstElementChild?.className).toContain('custom-class')
  })
})

describe('Modal', () => {
  it('should render title and children when open', () => {
    render(
      <Modal open title="Test Modal" onClose={() => {}}>
        <div>Modal content</div>
      </Modal>,
    )
    // Title appears twice: sr-only h2 (accessibility) + visual title div
    expect(screen.getAllByText('Test Modal')).toHaveLength(2)
    expect(screen.getByText('Modal content')).toBeTruthy()
  })

  it('should not render visual title when title prop is omitted', () => {
    render(
      <Modal open header="Header Only" onClose={() => {}}>
        Content
      </Modal>,
    )
    // sr-only h2 falls back to header text; header div also renders "Header Only" — total 2
    expect(screen.getAllByText('Header Only')).toHaveLength(2)
  })

  it('should render header when provided', () => {
    render(
      <Modal open title="Test" header="System" onClose={() => {}}>
        Content
      </Modal>,
    )
    expect(screen.getByText('System')).toBeTruthy()
  })

  it('should render footer when provided', () => {
    render(
      <Modal
        open
        title="Test"
        footer={<button>Footer button</button>}
        onClose={() => {}}
      >
        Content
      </Modal>,
    )
    expect(screen.getByText('Footer button')).toBeTruthy()
  })

  it('should not render when closed', () => {
    render(
      <Modal open={false} title="Hidden" onClose={() => {}}>
        Content
      </Modal>,
    )
    expect(screen.queryByText('Hidden')).toBeNull()
  })

  it('should not render shine border by default (shineColor defaults to false)', () => {
    render(
      <Modal open title="No Shine Default" onClose={() => {}}>
        Content
      </Modal>,
    )
    const glassContainer = screen.getByTestId('modal-glass-container')
    expect(glassContainer.style.border).toContain('rgba(255, 255, 255, 0.3)')
  })

  it('should render shine border when shineColor is true', () => {
    render(
      <Modal open title="Shine True" shineColor onClose={() => {}}>
        Content
      </Modal>,
    )
    const glassContainer = screen.getByTestId('modal-glass-container')
    expect(glassContainer.style.border).toContain('none')
  })

  it('should not render shine border when shineColor is false', () => {
    render(
      <Modal open title="No Shine" shineColor={false} onClose={() => {}}>
        Content
      </Modal>,
    )
    const glassContainer = screen.getByTestId('modal-glass-container')
    expect(glassContainer.style.border).toContain('rgba(255, 255, 255, 0.3)')
  })

  it('should not render shine border when animated is true', () => {
    render(
      <Modal open title="Animated" animated onClose={() => {}}>
        Content
      </Modal>,
    )
    const glassContainer = screen.getByTestId('modal-glass-container')
    // animated=true overrides shineColor to undefined, so border shows
    expect(glassContainer.style.border).toContain('rgba(255, 255, 255, 0.3)')
  })

  it('should show loading overlay when loading', () => {
    render(
      <Modal open title="Loading" loading onClose={() => {}}>
        Content
      </Modal>,
    )
    expect(screen.getByTestId('modal-loading-overlay')).toBeTruthy()
  })

  // --- transition prop tests ---

  it('should NOT add transition style to glassmorphism container when transition is not enabled', () => {
    render(
      <Modal open title="No Transition" width={500} onClose={() => {}}>
        Content
      </Modal>,
    )
    const container = screen.getByTestId('modal-glass-container')
    expect(container.style.transition).toBe('')
  })

  it('should add width/height transition style when transition prop is true', () => {
    render(
      <Modal
        open
        title="With Transition"
        transition
        width={500}
        height={400}
        onClose={() => {}}
      >
        Content
      </Modal>,
    )
    const container = screen.getByTestId('modal-glass-container')
    expect(container.style.transition).toContain('width')
    expect(container.style.transition).toContain('height')
    expect(container.style.transition).toContain('0.4s')
    expect(container.style.transition).toContain('cubic-bezier')
  })

  it('should resolve vw/vh values to px when transition is true', () => {
    // In happy-dom, window.innerWidth/innerHeight are available
    render(
      <Modal
        open
        title="VW Modal"
        transition
        width="95vw"
        height="90vh"
        onClose={() => {}}
      >
        Content
      </Modal>,
    )
    const container = screen.getByTestId('modal-glass-container')
    // Width/height should be numeric px values (not '95vw' / '90vh')
    const widthVal = container.style.width
    const heightVal = container.style.height
    expect(widthVal).toMatch(/^\d+px$/)
    expect(heightVal).toMatch(/^\d+px$/)
  })

  it('should pass width/height through as-is when transition is false', () => {
    render(
      <Modal
        open
        title="No Transition Passthrough"
        width="95vw"
        height="90vh"
        onClose={() => {}}
      >
        Content
      </Modal>,
    )
    const container = screen.getByTestId('modal-glass-container')
    // When transition is not enabled, the original string values are passed through
    expect(container.style.width).toBe('95vw')
    expect(container.style.height).toBe('90vh')
  })

  it('should resolve px string to numeric px when transition is true', () => {
    render(
      <Modal open title="PX Modal" transition width="600px" onClose={() => {}}>
        Content
      </Modal>,
    )
    const container = screen.getByTestId('modal-glass-container')
    expect(container.style.width).toBe('600px')
  })

  it('should use numeric width directly when transition is true', () => {
    render(
      <Modal
        open
        title="Numeric Modal"
        transition
        width={700}
        onClose={() => {}}
      >
        Content
      </Modal>,
    )
    const container = screen.getByTestId('modal-glass-container')
    expect(container.style.width).toBe('700px')
  })
})

describe('ConfirmModal', () => {
  const defaultProps = {
    open: true,
    title: '確認打卡？',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('should render title and default header', () => {
    render(<ConfirmModal {...defaultProps} />)
    // Title appears twice: sr-only + visual
    expect(screen.getAllByText('確認打卡？')).toHaveLength(2)
    expect(screen.getByText('系統確認')).toBeTruthy()
  })

  it('should render children', () => {
    render(
      <ConfirmModal {...defaultProps}>
        <div>Custom content</div>
      </ConfirmModal>,
    )
    expect(screen.getByText('Custom content')).toBeTruthy()
  })

  it('should render custom button text', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="確認打卡"
        cancelText="返回"
      />,
    )
    expect(screen.getByText('確認打卡')).toBeTruthy()
    expect(screen.getByText('返回')).toBeTruthy()
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)
    await user.click(screen.getByText('確認'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)
    await user.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('should disable buttons when loading', () => {
    render(<ConfirmModal {...defaultProps} loading />)
    const confirmBtn = screen.getByText('確認').closest('button')
    const cancelBtn = screen.getByText('取消').closest('button')
    expect(confirmBtn?.disabled).toBe(true)
    expect(cancelBtn?.disabled).toBe(true)
  })
})
