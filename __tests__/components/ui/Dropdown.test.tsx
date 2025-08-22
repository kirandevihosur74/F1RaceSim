import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dropdown from '../../../components/ui/Dropdown'

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' }
]

const defaultProps = {
  options: mockOptions,
  value: 'option1',
  onChange: jest.fn()
}

describe('Dropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with label when provided', () => {
    render(<Dropdown {...defaultProps} label="Test Label" />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('renders without label when not provided', () => {
    render(<Dropdown {...defaultProps} />)
    expect(screen.queryByText('Test Label')).not.toBeInTheDocument()
  })

  it('displays selected value', () => {
    render(<Dropdown {...defaultProps} value="option2" />)
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('displays placeholder when no value is selected', () => {
    render(<Dropdown {...defaultProps} value="" placeholder="Select option" />)
    expect(screen.getByText('Select option')).toBeInTheDocument()
  })

  it('opens dropdown when clicked', () => {
    render(<Dropdown {...defaultProps} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Check for dropdown options (these are the ones in the dropdown list, not the button)
    const dropdownOptions = screen.getAllByRole('option')
    expect(dropdownOptions).toHaveLength(3)
    expect(dropdownOptions[0]).toHaveTextContent('Option 1')
    expect(dropdownOptions[1]).toHaveTextContent('Option 2')
    expect(dropdownOptions[2]).toHaveTextContent('Option 3')
  })

  it('calls onChange when option is selected', () => {
    render(<Dropdown {...defaultProps} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const dropdownOptions = screen.getAllByRole('option')
    const option2 = dropdownOptions[1] // Option 2
    fireEvent.click(option2)
    
    expect(defaultProps.onChange).toHaveBeenCalledWith('option2')
  })

  it('closes dropdown after selection', async () => {
    render(<Dropdown {...defaultProps} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const dropdownOptions = screen.getAllByRole('option')
    const option2 = dropdownOptions[1]
    fireEvent.click(option2)
    
    await waitFor(() => {
      expect(screen.queryByRole('option')).not.toBeInTheDocument()
    })
  })

  it('closes dropdown when clicking outside', async () => {
    render(<Dropdown {...defaultProps} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Click outside the dropdown
    fireEvent.mouseDown(document.body)
    
    await waitFor(() => {
      expect(screen.queryByRole('option')).not.toBeInTheDocument()
    })
  })

  it('shows checkmark for selected option', () => {
    render(<Dropdown {...defaultProps} value="option2" />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Find the selected option by its aria-selected attribute
    const selectedOption = screen.getByRole('option', { selected: true })
    expect(selectedOption).toHaveAttribute('aria-selected', 'true')
    expect(selectedOption).toHaveTextContent('Option 2')
  })

  it('handles disabled state', () => {
    render(<Dropdown {...defaultProps} disabled={true} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('handles disabled options', () => {
    const optionsWithDisabled = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
      { value: 'option3', label: 'Option 3' }
    ]
    
    render(<Dropdown {...defaultProps} options={optionsWithDisabled} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const dropdownOptions = screen.getAllByRole('option')
    const disabledOption = dropdownOptions[1] // Option 2 (disabled)
    expect(disabledOption).toHaveClass('cursor-not-allowed')
  })

  it('displays error message when error prop is provided', () => {
    render(<Dropdown {...defaultProps} error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('applies error styling when error prop is provided', () => {
    render(<Dropdown {...defaultProps} error="This field is required" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-red-300')
  })
})
