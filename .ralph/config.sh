#!/bin/bash

# Ralph Wiggum - Autonomous TDD Loop Configuration

# Max iterations per run (override with --max flag)
MAX_ITERATIONS="${MAX_ITERATIONS:-50}"

# Swarm orchestrator settings
SWARM_MAX_PARALLEL_AGENTS=3   # Max concurrent Ralph agents
SWARM_POLL_INTERVAL=10        # Seconds between agent status polls
SWARM_MAX_CONFLICT_RETRIES=2  # Max resolver attempts per conflict
SWARM_ENABLE_CHAINING=true    # Group linear chains for one agent
SWARM_CLEANUP_WORKTREES=true  # Remove agent worktrees after merge
SWARM_STATE_DIR="${PROJECT_ROOT}/.ralph/swarm-state"

# Behavior flags
AUTO_FORMAT_ON_FAILURE=true    # true: run npm run format between iterations
AUTO_LINT_FIX_ON_FAILURE=true  # true: run npm run lint:fix between iterations

# Paths (auto-detected from git root, respect existing values from parent process)
PROJECT_ROOT="${PROJECT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
PRD_FILE="${PRD_FILE:-${PROJECT_ROOT}/prd.json}"
PROGRESS_FILE="${PROGRESS_FILE:-${PROJECT_ROOT}/progress.txt}"
RALPH_DIR="${RALPH_DIR:-${PROJECT_ROOT}/.ralph}"

# Container detection (for logging only)
IN_CONTAINER=false
[ -f "/.dockerenv" ] && IN_CONTAINER=true

# Context monitoring (% of 200k window)
CONTEXT_WARN_PCT="${CONTEXT_WARN_PCT:-70}"
CONTEXT_CRITICAL_PCT="${CONTEXT_CRITICAL_PCT:-85}"
CONTEXT_WINDOW_SIZE="${CONTEXT_WINDOW_SIZE:-200000}"

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
export MAX_ITERATIONS IN_CONTAINER
export AUTO_FORMAT_ON_FAILURE AUTO_LINT_FIX_ON_FAILURE
export SWARM_MAX_PARALLEL_AGENTS SWARM_POLL_INTERVAL SWARM_MAX_CONFLICT_RETRIES SWARM_ENABLE_CHAINING SWARM_CLEANUP_WORKTREES SWARM_STATE_DIR
export CONTEXT_WARN_PCT CONTEXT_CRITICAL_PCT CONTEXT_WINDOW_SIZE
