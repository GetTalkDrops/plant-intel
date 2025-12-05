# Plant Intel Backend - Makefile
# Convenient commands for development and testing

.PHONY: help test test-unit test-integration test-coverage test-fast clean lint format

help:
	@echo "Plant Intel Backend - Available Commands:"
	@echo ""
	@echo "  make test              - Run all tests"
	@echo "  make test-unit         - Run unit tests only (fast)"
	@echo "  make test-integration  - Run integration tests"
	@echo "  make test-coverage     - Run tests with coverage report"
	@echo "  make test-fast         - Run tests without coverage (faster)"
	@echo "  make lint              - Run flake8 linter"
	@echo "  make format            - Format code with black"
	@echo "  make clean             - Remove test artifacts"
	@echo ""

# Run all tests with coverage
test:
	pytest

# Run only unit tests (fast, no external dependencies)
test-unit:
	pytest -m unit -v

# Run only integration tests
test-integration:
	pytest -m integration -v

# Run tests with detailed coverage report
test-coverage:
	pytest --cov=app --cov-report=html --cov-report=term-missing

# Run tests without coverage (faster for development)
test-fast:
	pytest --no-cov -v

# Run specific test file
test-file:
	pytest $(FILE) -v

# Lint code
lint:
	flake8 app tests

# Format code
format:
	black app tests

# Clean test artifacts
clean:
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	rm -rf **/__pycache__
	rm -rf **/*.pyc
	find . -type d -name __pycache__ -exec rm -rf {} +
