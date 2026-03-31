import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from './label'

describe('Label', () => {
  it('should render with text content', () => {
    render(<Label>Username</Label>)
    expect(screen.getByText('Username')).toBeTruthy()
  })

  it('should render as a label element', () => {
    render(<Label>Username</Label>)
    const label = screen.getByText('Username')
    expect(label.tagName).toBe('LABEL')
  })

  it('should include data-slot="label" attribute', () => {
    render(<Label>Username</Label>)
    const label = screen.getByText('Username')
    expect(label.getAttribute('data-slot')).toBe('label')
  })

  it('should forward className prop', () => {
    render(<Label className="custom-class">Username</Label>)
    const label = screen.getByText('Username')
    expect(label.className).toContain('custom-class')
  })

  it('should forward htmlFor prop', () => {
    render(<Label htmlFor="username-input">Username</Label>)
    const label = screen.getByText('Username')
    expect(label.getAttribute('for')).toBe('username-input')
  })

  it('should forward additional HTML attributes', () => {
    render(
      <Label data-testid="my-label" id="test-label">
        Username
      </Label>,
    )
    const label = screen.getByTestId('my-label')
    expect(label.id).toBe('test-label')
  })

  it('should render children elements', () => {
    render(
      <Label>
        <span data-testid="icon">*</span>
        Username
      </Label>,
    )
    expect(screen.getByTestId('icon')).toBeTruthy()
    expect(screen.getByText('Username')).toBeTruthy()
  })

  it('should apply default styling classes', () => {
    render(<Label>Username</Label>)
    const label = screen.getByText('Username')
    expect(label.className).toContain('text-sm')
    expect(label.className).toContain('font-medium')
    expect(label.className).toContain('select-none')
  })
})
