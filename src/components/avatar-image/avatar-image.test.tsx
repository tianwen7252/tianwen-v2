import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvatarImage } from './avatar-image'

describe('AvatarImage', () => {
  it('should render fallback icon when no avatar provided', () => {
    const { container } = render(<AvatarImage />)
    // Should render the User icon fallback (svg)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('should render fallback icon for empty avatar', () => {
    const { container } = render(<AvatarImage avatar="" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('should render image for http URL avatar', () => {
    render(<AvatarImage avatar="https://example.com/avatar.png" />)
    const img = screen.getByAltText('avatar')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.png')
  })

  it('should render image for legacy full local path avatar (backward compat)', () => {
    render(<AvatarImage avatar="images/aminals/1049013.png" />)
    const img = screen.getByAltText('avatar')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('/images/aminals/1049013.png')
  })

  it('should render image for filename-only avatar (new format)', () => {
    render(<AvatarImage avatar="1049013.png" />)
    const img = screen.getByAltText('avatar')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe('/images/aminals/1049013.png')
  })

  it('should render image for filename-only avatar without path prefix confusion', () => {
    render(<AvatarImage avatar="780258.png" />)
    const img = screen.getByAltText('avatar')
    expect(img.getAttribute('src')).toBe('/images/aminals/780258.png')
  })

  it('should apply custom size', () => {
    const { container } = render(<AvatarImage size={120} />)
    const div = container.firstElementChild as HTMLElement
    expect(div.style.width).toBe('120px')
    expect(div.style.height).toBe('120px')
  })

  it('should apply custom className', () => {
    const { container } = render(<AvatarImage className="border-2" />)
    const div = container.firstElementChild as HTMLElement
    expect(div.className).toContain('border-2')
  })
})
