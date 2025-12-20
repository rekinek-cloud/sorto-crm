import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner Component', () => {
  it('renders loading spinner', () => {
    render(<LoadingSpinner />)
    
    const spinner = document.querySelector('svg')
    expect(spinner).toBeInTheDocument()
  })

  it('applies correct CSS classes for animation', () => {
    render(<LoadingSpinner />)
    
    const svg = document.querySelector('svg')
    expect(svg).toHaveClass('animate-spin')
  })

  it('renders with custom size when provided', () => {
    render(<LoadingSpinner size="lg" />)
    
    const svg = document.querySelector('svg')
    expect(svg).toHaveClass('h-8', 'w-8') // lg size
  })

  it('renders with default size when no size provided', () => {
    render(<LoadingSpinner />)
    
    const svg = document.querySelector('svg')
    expect(svg).toHaveClass('h-6', 'w-6') // default size
  })

  it('applies custom className when provided', () => {
    render(<LoadingSpinner className="custom-spinner" />)
    
    const svg = document.querySelector('svg')
    expect(svg).toHaveClass('custom-spinner')
  })

  it('renders text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />)
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('centers content correctly', () => {
    const { container } = render(<LoadingSpinner />)
    
    const spinnerContainer = container.firstChild as HTMLElement
    expect(spinnerContainer).toHaveClass('flex')
    expect(spinnerContainer).toHaveClass('items-center')
    expect(spinnerContainer).toHaveClass('justify-center')
    expect(spinnerContainer).toHaveClass('space-x-2')
  })
})