# 🧪 Testing Guide - F1 Race Simulator

This guide covers all aspects of testing the F1 Race Simulator application, including frontend, backend, and end-to-end tests.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [End-to-End Testing](#end-to-end-testing)
- [API Testing](#api-testing)
- [Performance Testing](#performance-testing)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)

## 🚀 Quick Start

### Prerequisites

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Run All Tests

```bash
# Frontend tests
npm test

# Backend tests
cd backend
pytest

# End-to-end tests
npm run test:e2e
```

## 🎨 Frontend Testing

### Unit Tests (Jest + React Testing Library)

The frontend uses Jest with React Testing Library for component and utility testing.

#### Running Frontend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- RaceStrategyForm.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should render"
```

#### Test Structure

```
__tests__/
├── components/
│   ├── RaceStrategyForm.test.tsx
│   ├── SimulationResultsChart.test.tsx
│   ├── StrategyRecommendations.test.tsx
│   └── Header.test.tsx
├── store/
│   └── simulationStore.test.ts
├── utils/
│   └── helpers.test.ts
└── __mocks__/
    ├── axios.ts
    └── recharts.ts
```

#### Writing Frontend Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RaceStrategyForm from '@/components/RaceStrategyForm'

describe('RaceStrategyForm', () => {
  it('should render form elements', () => {
    render(<RaceStrategyForm />)
    
    expect(screen.getByText('Race Strategy Configuration')).toBeInTheDocument()
    expect(screen.getByLabelText(/Weather Conditions/)).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    const user = userEvent.setup()
    render(<RaceStrategyForm />)
    
    const submitButton = screen.getByRole('button', { name: /Run Simulation/ })
    await user.click(submitButton)
    
    // Add assertions for expected behavior
  })
})
```

#### Testing Best Practices

1. **Test user behavior, not implementation details**
2. **Use semantic queries** (getByRole, getByLabelText)
3. **Test accessibility** features
4. **Mock external dependencies** (API calls, charts)
5. **Test error states** and edge cases

### Component Testing Examples

#### Testing Form Components

```typescript
it('should update strategy when inputs change', async () => {
  const user = userEvent.setup()
  render(<RaceStrategyForm />)
  
  const driverSelect = screen.getByLabelText(/Driver Style/)
  await user.selectOptions(driverSelect, 'aggressive')
  
  expect(mockStore.setStrategyInput).toHaveBeenCalledWith({
    driver_style: 'aggressive'
  })
})
```

#### Testing Store Integration

```typescript
it('should call API and update state', async () => {
  mockedAxios.post.mockResolvedValueOnce(mockResponse)
  
  const { result } = renderHook(() => useSimulationStore())
  
  await act(async () => {
    await result.current.runSimulation('dry')
  })
  
  expect(result.current.simulationResults).toEqual(mockResponse.data)
})
```

## 🐍 Backend Testing

### Unit Tests (Pytest)

The backend uses Pytest for comprehensive testing of the simulation engine and API endpoints.

#### Running Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run tests with coverage
pytest --cov=api --cov-report=html

# Run specific test file
pytest tests/test_simulation.py

# Run tests matching a pattern
pytest -k "test_calculate_lap_time"

# Run tests with verbose output
pytest -v

# Run tests in parallel
pytest -n auto
```

#### Test Structure

```
backend/
├── tests/
│   ├── test_simulation.py
│   ├── test_strategy.py
│   ├── test_api.py
│   └── conftest.py
├── api/
│   ├── simulation.py
│   └── strategy.py
└── main.py
```

#### Writing Backend Tests

```python
import pytest
from api.simulation import simulate_race, RaceSimulator

class TestRaceSimulator:
    def setup_method(self):
        self.simulator = RaceSimulator()
    
    def test_calculate_lap_time_basic(self):
        lap_time = self.simulator.calculate_lap_time(
            lap=1, tire_wear=0.0, current_tire="Medium",
            driver_style="balanced", weather="dry", fuel_load=0.0
        )
        
        assert 80.0 <= lap_time <= 90.0
    
    def test_simulate_race_basic(self):
        strategy = {
            "pit_stops": [15, 35],
            "tires": ["Medium", "Hard", "Soft"],
            "driver_style": "balanced"
        }
        
        results = simulate_race(strategy, "dry")
        
        assert len(results) == 58
        assert all("lap" in result for result in results)
```

#### Testing Async Functions

```python
@pytest.mark.asyncio
async def test_get_strategy_recommendation(self):
    with patch('api.strategy.openai.ChatCompletion.acreate') as mock_openai:
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "Test recommendation"
        mock_openai.return_value = mock_response
        
        recommendation = await get_strategy_recommendation("Test scenario")
        
        assert recommendation == "Test recommendation"
```

### API Testing

#### Testing FastAPI Endpoints

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_simulate_race_endpoint():
    response = client.post("/simulate-race", json={
        "strategy": {
            "pit_stops": [15, 35],
            "tires": ["Medium", "Hard", "Soft"],
            "driver_style": "balanced"
        },
        "weather": "dry"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert len(data["simulation"]) == 58
```

## 🌐 End-to-End Testing

### Playwright Tests

End-to-end tests use Playwright to test the complete user workflow.

#### Running E2E Tests

```bash
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests in headed mode
npx playwright test --headed

# Run specific test file
npx playwright test simulation.spec.ts

# Run tests in debug mode
npx playwright test --debug
```

#### Writing E2E Tests

```typescript
// tests/simulation.spec.ts
import { test, expect } from '@playwright/test'

test('complete simulation workflow', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3000')
  
  // Configure strategy
  await page.selectOption('select[name="driver-style"]', 'aggressive')
  await page.fill('input[placeholder="Lap number"]', '20')
  
  // Run simulation
  await page.click('button:has-text("Run Simulation")')
  
  // Wait for results
  await page.waitForSelector('[data-testid="line-chart"]')
  
  // Verify results are displayed
  await expect(page.locator('text=Simulation Results')).toBeVisible()
  await expect(page.locator('[data-testid="line-chart"]')).toBeVisible()
})
```

#### E2E Test Structure

```
tests/
├── e2e/
│   ├── simulation.spec.ts
│   ├── strategy.spec.ts
│   └── navigation.spec.ts
├── fixtures/
│   └── test-data.json
└── playwright.config.ts
```

## 🔧 API Testing

### Manual API Testing

Test the API endpoints manually using tools like curl, Postman, or HTTPie.

#### Test Simulation Endpoint

```bash
curl -X POST http://localhost:8000/simulate-race \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": {
      "pit_stops": [15, 35],
      "tires": ["Medium", "Hard", "Soft"],
      "driver_style": "balanced"
    },
    "weather": "dry"
  }'
```

#### Test Strategy Recommendation Endpoint

```bash
curl -X POST http://localhost:8000/strategy-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "Pit stops at laps 15, 35, using Medium → Hard → Soft"
  }'
```

### Automated API Testing

```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestSimulationAPI:
    def test_simulate_race_success(self):
        response = client.post("/simulate-race", json={
            "strategy": {
                "pit_stops": [15, 35],
                "tires": ["Medium", "Hard", "Soft"],
                "driver_style": "balanced"
            },
            "weather": "dry"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "simulation" in data
        assert len(data["simulation"]) == 58
    
    def test_simulate_race_invalid_strategy(self):
        response = client.post("/simulate-race", json={
            "strategy": {
                "pit_stops": "invalid",
                "tires": ["Medium"],
                "driver_style": "balanced"
            },
            "weather": "dry"
        })
        
        assert response.status_code == 422  # Validation error
```

## ⚡ Performance Testing

### Load Testing

Test the API performance under load using tools like Artillery or Locust.

#### Artillery Configuration

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:8000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"

scenarios:
  - name: "Simulation API"
    requests:
      - post:
          url: "/simulate-race"
          json:
            strategy:
              pit_stops: [15, 35]
              tires: ["Medium", "Hard", "Soft"]
              driver_style: "balanced"
            weather: "dry"
```

#### Run Load Tests

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run artillery-config.yml

# Generate report
artillery run --output report.json artillery-config.yml
artillery report report.json
```

### Memory and CPU Testing

```python
# tests/test_performance.py
import time
import psutil
import pytest
from api.simulation import simulate_race

def test_simulation_performance():
    start_time = time.time()
    start_memory = psutil.Process().memory_info().rss
    
    strategy = {
        "pit_stops": [15, 35],
        "tires": ["Medium", "Hard", "Soft"],
        "driver_style": "balanced"
    }
    
    results = simulate_race(strategy, "dry")
    
    end_time = time.time()
    end_memory = psutil.Process().memory_info().rss
    
    execution_time = end_time - start_time
    memory_used = end_memory - start_memory
    
    # Performance assertions
    assert execution_time < 1.0  # Should complete within 1 second
    assert memory_used < 50 * 1024 * 1024  # Less than 50MB
    assert len(results) == 58
```

## 📊 Test Coverage

### Frontend Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Backend Coverage

```bash
cd backend

# Run tests with coverage
pytest --cov=api --cov-report=html --cov-report=term

# View coverage in browser
open htmlcov/index.html
```

### Coverage Configuration

```yaml
# .coveragerc
[run]
source = api
omit = 
    */tests/*
    */__pycache__/*
    */venv/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
```

## 🔄 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest --cov=api

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## 🐛 Debugging Tests

### Frontend Debugging

```bash
# Run tests in debug mode
npm test -- --debug

# Run specific test with console output
npm test -- --verbose --testNamePattern="should handle form submission"
```

### Backend Debugging

```bash
# Run tests with detailed output
pytest -v -s tests/test_simulation.py

# Run single test
pytest tests/test_simulation.py::TestRaceSimulator::test_calculate_lap_time_basic -v

# Debug with pdb
pytest --pdb tests/test_simulation.py
```

### E2E Debugging

```bash
# Run tests in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Show browser
npx playwright test --headed --project=chromium
```

## 📝 Test Data

### Mock Data

```typescript
// __tests__/__mocks__/mockData.ts
export const mockSimulationResponse = {
  status: 'success',
  simulation: [
    { lap: 1, lap_time: 85.4, tire_wear: 2.0 },
    { lap: 2, lap_time: 85.6, tire_wear: 4.1 }
  ],
  total_time: 171.0
}

export const mockStrategyInput = {
  pit_stops: [15, 35],
  tires: ['Medium', 'Hard', 'Soft'],
  driver_style: 'balanced'
}
```

### Test Fixtures

```python
# backend/tests/conftest.py
import pytest

@pytest.fixture
def sample_strategy():
    return {
        "pit_stops": [15, 35],
        "tires": ["Medium", "Hard", "Soft"],
        "driver_style": "balanced"
    }

@pytest.fixture
def sample_simulation_response():
    return {
        "status": "success",
        "simulation": [
            {"lap": 1, "lap_time": 85.4, "tire_wear": 2.0},
            {"lap": 2, "lap_time": 85.6, "tire_wear": 4.1}
        ],
        "total_time": 171.0
    }
```

## 🎯 Best Practices

### General Testing Principles

1. **Test behavior, not implementation**
2. **Write tests that are easy to understand**
3. **Use descriptive test names**
4. **Test edge cases and error conditions**
5. **Keep tests independent and isolated**
6. **Use appropriate assertions**
7. **Mock external dependencies**

### Frontend Testing

1. **Test user interactions, not component internals**
2. **Use semantic queries for better accessibility**
3. **Test loading and error states**
4. **Mock API calls and external services**
5. **Test responsive behavior**

### Backend Testing

1. **Test business logic thoroughly**
2. **Mock external API calls**
3. **Test input validation**
4. **Test error handling**
5. **Use fixtures for common test data**

### Performance Testing

1. **Set realistic performance baselines**
2. **Test under various load conditions**
3. **Monitor memory usage**
4. **Test with realistic data volumes**
5. **Automate performance regression testing**

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## 🆘 Troubleshooting

### Common Issues

1. **Tests failing due to missing dependencies**
   ```bash
   npm install
   cd backend && pip install -r requirements.txt
   ```

2. **Mock not working properly**
   - Check import paths
   - Ensure mocks are set up before tests run
   - Use `jest.clearAllMocks()` in beforeEach

3. **Async test failures**
   - Use `await` with async functions
   - Use `act()` for React state updates
   - Check for unhandled promise rejections

4. **Coverage not generating**
   - Check Jest configuration
   - Ensure test files are in correct directories
   - Verify coverage thresholds

### Getting Help

- Check the test output for specific error messages
- Review the test configuration files
- Consult the documentation for testing libraries
- Create minimal reproduction cases for complex issues 