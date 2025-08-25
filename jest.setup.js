import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children, ...props }) => <div data-testid="line-chart" {...props}>{children}</div>,
  Line: ({ ...props }) => <div data-testid="line" {...props} />,
  XAxis: ({ ...props }) => <div data-testid="x-axis" {...props} />,
  YAxis: ({ ...props }) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: ({ ...props }) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: ({ ...props }) => <div data-testid="tooltip" {...props} />,
  Legend: ({ ...props }) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children, ...props }) => <div data-testid="responsive-container" {...props}>{children}</div>,
  AreaChart: ({ children, ...props }) => <div data-testid="area-chart" {...props}>{children}</div>,
  Area: ({ ...props }) => <div data-testid="area" {...props} />,
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock fetch globally
global.fetch = jest.fn()

// Mock console.error to prevent noise in tests
global.console.error = jest.fn() 