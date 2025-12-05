#!/bin/bash
# =============================================================================
# Plant Intel Backend - Development Server Startup Script
# =============================================================================

echo "🚀 Starting Plant Intel Backend..."
echo ""

# Activate virtual environment
source venv/bin/activate

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with required variables"
    echo "See .env.example for reference"
    exit 1
fi

# Display environment info
echo "✅ Environment variables loaded from .env"
echo "📍 Environment: ${ENVIRONMENT:-development}"
echo ""

# Start the FastAPI server with hot reload
echo "🔧 Starting FastAPI server on port ${PORT:-8000}..."
echo "📚 API docs will be available at: http://localhost:${PORT:-8000}/docs"
echo ""

# Run uvicorn with auto-reload
python3 -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port ${PORT:-8000} \
  --reload \
  --log-level info \
  --access-log

# Note: Ctrl+C to stop the server
