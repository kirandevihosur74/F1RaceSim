#!/bin/bash

# F1 Race Simulator Test Runner
# This script provides easy commands to run different types of tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}🏎️  $1${NC}"
}

# Check if dependencies are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    print_status "All dependencies are satisfied"
}

# Install dependencies if needed
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Frontend dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Backend dependencies
    if [ ! -d "backend/venv" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        cd ..
    fi
}

# Run frontend tests
run_frontend_tests() {
    print_header "Running Frontend Tests"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_warning "Frontend dependencies not found. Installing..."
        npm install
    fi
    
    # Run tests
    npm test
}

# Run frontend tests with coverage
run_frontend_coverage() {
    print_header "Running Frontend Tests with Coverage"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    npm run test:coverage
}

# Run backend tests
run_backend_tests() {
    print_header "Running Backend Tests"
    
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_warning "Backend virtual environment not found. Creating..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi
    
    # Run tests
    pytest -v
    
    cd ..
}

# Run backend tests with coverage
run_backend_coverage() {
    print_header "Running Backend Tests with Coverage"
    
    cd backend
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi
    
    pytest --cov=api --cov-report=html --cov-report=term -v
    
    cd ..
}

# Run end-to-end tests
run_e2e_tests() {
    print_header "Running End-to-End Tests"
    
    # Check if Playwright is installed
    if ! npx playwright --version &> /dev/null; then
        print_warning "Playwright not found. Installing..."
        npx playwright install
    fi
    
    # Run E2E tests
    npm run test:e2e
}

# Run all tests
run_all_tests() {
    print_header "Running All Tests"
    
    check_dependencies
    install_dependencies
    
    # Frontend tests
    run_frontend_tests
    
    # Backend tests
    run_backend_tests
    
    # E2E tests (optional)
    read -p "Do you want to run end-to-end tests? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_e2e_tests
    fi
    
    print_status "All tests completed!"
}

# Run specific test file
run_specific_test() {
    local test_file=$1
    
    if [[ $test_file == *".tsx" || $test_file == *".ts" ]]; then
        print_header "Running Frontend Test: $test_file"
        npm test -- $test_file
    elif [[ $test_file == *".py" ]]; then
        print_header "Running Backend Test: $test_file"
        cd backend
        source venv/bin/activate
        pytest -v $test_file
        cd ..
    else
        print_error "Unknown test file type: $test_file"
        exit 1
    fi
}

# Watch mode for frontend tests
run_watch_tests() {
    print_header "Running Frontend Tests in Watch Mode"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    npm run test:watch
}

# Clean up test artifacts
cleanup_tests() {
    print_status "Cleaning up test artifacts..."
    
    # Remove coverage reports
    rm -rf coverage/
    rm -rf backend/htmlcov/
    rm -rf backend/.coverage
    
    # Remove test cache
    rm -rf .jest/
    rm -rf backend/.pytest_cache/
    
    # Remove Playwright reports
    rm -rf test-results/
    rm -rf playwright-report/
    
    print_status "Cleanup completed!"
}

# Show test coverage report
show_coverage() {
    print_header "Opening Coverage Reports"
    
    # Frontend coverage
    if [ -d "coverage/lcov-report" ]; then
        print_status "Opening frontend coverage report..."
        open coverage/lcov-report/index.html 2>/dev/null || \
        xdg-open coverage/lcov-report/index.html 2>/dev/null || \
        echo "Frontend coverage report: coverage/lcov-report/index.html"
    fi
    
    # Backend coverage
    if [ -d "backend/htmlcov" ]; then
        print_status "Opening backend coverage report..."
        open backend/htmlcov/index.html 2>/dev/null || \
        xdg-open backend/htmlcov/index.html 2>/dev/null || \
        echo "Backend coverage report: backend/htmlcov/index.html"
    fi
}

# Show help
show_help() {
    echo "F1 Race Simulator Test Runner"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  all              Run all tests (frontend, backend, optional e2e)"
    echo "  frontend         Run frontend tests only"
    echo "  backend          Run backend tests only"
    echo "  e2e              Run end-to-end tests only"
    echo "  coverage         Run tests with coverage reports"
    echo "  watch            Run frontend tests in watch mode"
    echo "  specific <file>  Run specific test file"
    echo "  cleanup          Clean up test artifacts"
    echo "  show-coverage    Open coverage reports in browser"
    echo "  install          Install dependencies"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all                    # Run all tests"
    echo "  $0 frontend               # Run frontend tests"
    echo "  $0 specific RaceStrategyForm.test.tsx"
    echo "  $0 specific test_simulation.py"
}

# Main script logic
case "${1:-help}" in
    "all")
        run_all_tests
        ;;
    "frontend")
        check_dependencies
        run_frontend_tests
        ;;
    "backend")
        check_dependencies
        run_backend_tests
        ;;
    "e2e")
        check_dependencies
        run_e2e_tests
        ;;
    "coverage")
        check_dependencies
        install_dependencies
        run_frontend_coverage
        run_backend_coverage
        show_coverage
        ;;
    "watch")
        check_dependencies
        run_watch_tests
        ;;
    "specific")
        if [ -z "$2" ]; then
            print_error "Please specify a test file"
            echo "Usage: $0 specific <test-file>"
            exit 1
        fi
        check_dependencies
        install_dependencies
        run_specific_test "$2"
        ;;
    "cleanup")
        cleanup_tests
        ;;
    "show-coverage")
        show_coverage
        ;;
    "install")
        check_dependencies
        install_dependencies
        ;;
    "help"|*)
        show_help
        ;;
esac 