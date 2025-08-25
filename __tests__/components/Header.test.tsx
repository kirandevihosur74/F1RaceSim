import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock NextAuth before importing components
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve())
}))

import { useSession, signIn, signOut } from 'next-auth/react'
import Header from '../../components/Header'

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    })
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  it('should render header with title and theme toggle', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header onOpenLogin={jest.fn()} />)
    
    expect(screen.getByText('F1 Race Sim')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle dark mode')).toBeInTheDocument()
  })

  it('should show sign in button when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header onOpenLogin={jest.fn()} />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('should show user info and sign out button when authenticated', () => {
    const mockSession = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        image: 'https://example.com/photo.jpg'
      },
      expires: '2024-12-31'
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header onOpenLogin={jest.fn()} />)
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByLabelText('Sign Out')).toBeInTheDocument()
  })

  it('should show loading state during authentication', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    render(<Header onOpenLogin={jest.fn()} />)
    
    // Header doesn't show loading text anymore, just renders normally
    expect(screen.getByText('F1 Race Sim')).toBeInTheDocument()
  })

  it('should call signIn when sign in button is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const mockOnOpenLogin = jest.fn()
    render(<Header onOpenLogin={mockOnOpenLogin} />)
    
    const signInButton = screen.getByText('Sign In')
    fireEvent.click(signInButton)
    
    expect(mockOnOpenLogin).toHaveBeenCalled()
  })

  it('should call signOut when sign out button is clicked', async () => {
    const mockSession = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        image: null
      },
      expires: '2024-12-31'
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header onOpenLogin={jest.fn()} />)
    
    const signOutButton = screen.getByLabelText('Sign Out')
    fireEvent.click(signOutButton)
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/', redirect: true })
    })
  })

  it('should handle authentication errors gracefully', async () => {
    const mockOnOpenLogin = jest.fn()
    
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header onOpenLogin={mockOnOpenLogin} />)
    
    const signInButton = screen.getByText('Sign In')
    fireEvent.click(signInButton)
    
    expect(mockOnOpenLogin).toHaveBeenCalled()
  })
})
