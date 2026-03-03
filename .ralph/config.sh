#!/bin/bash

# Ralph Wiggum - Autonomous TDD Loop Configuration

# Max iterations per mode
HITL_MAX_ITERATIONS=5          # Human-in-the-loop mode
AFK_MAX_ITERATIONS=50          # Away-from-keyboard mode

# Behavior flags
AUTO_FORMAT_ON_FAILURE=true    # true: run npm run format between iterations
AUTO_LINT_FIX_ON_FAILURE=true  # true: run npm run lint:fix between iterations

# Paths (auto-detected from git root)
PROJECT_ROOT="${PROJECT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
PRD_FILE="${PROJECT_ROOT}/prd.json"
PROGRESS_FILE="${PROJECT_ROOT}/progress.txt"
RALPH_DIR="${PROJECT_ROOT}/.ralph"

# Mode detection: AFK if in container, HITL otherwise
if [ -f "/.dockerenv" ]; then
    MODE="AFK"
    MAX_ITERATIONS=$AFK_MAX_ITERATIONS
else
    MODE="HITL"
    MAX_ITERATIONS=$HITL_MAX_ITERATIONS
fi

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# Export for child processes
export PROJECT_ROOT PRD_FILE PROGRESS_FILE RALPH_DIR
export MODE MAX_ITERATIONS
export AUTO_FORMAT_ON_FAILURE AUTO_LINT_FIX_ON_FAILURE
