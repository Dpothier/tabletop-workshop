#!/bin/bash

# Ralph Wiggum - Swarm AFK Launcher
# Convenience script to run the swarm orchestrator in Docker
#
# Usage:
#   swarm-afk.sh --epic MFG-7                    # Run in Docker
#   swarm-afk.sh --epic MFG-7 --max-agents 2     # Limit agents

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source config
source "${PROJECT_ROOT}/.ralph/config.sh"

# Parse args - pass through everything to ralph-swarm.sh
EPIC_KEY=""
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --epic|-e)
            EPIC_KEY="$2"
            EXTRA_ARGS+=("$1" "$2")
            shift 2
            ;;
        *)
            EXTRA_ARGS+=("$1")
            shift
            ;;
    esac
done

if [ -z "$EPIC_KEY" ]; then
    echo "Usage: $0 --epic <EPIC_KEY> [options]"
    echo "Options are passed through to ralph-swarm.sh"
    exit 1
fi

log_info "Starting Ralph Swarm in Docker for epic ${EPIC_KEY}"

# Check for docker compose
if ! command -v docker &>/dev/null; then
    log_error "Docker not found. Install Docker to use AFK mode."
    exit 1
fi

# Build and run via docker compose
cd "$PROJECT_ROOT"

# Set environment variables for compose
export EPIC_KEY
export SWARM_EXTRA_ARGS="${EXTRA_ARGS[*]}"

# Check for .env.ralph and source for Docker env
if [ -f "${PROJECT_ROOT}/.env.ralph" ]; then
    set -a
    source "${PROJECT_ROOT}/.env.ralph"
    set +a
fi

log_info "Launching docker compose..."
docker compose -f docker-compose.swarm.yml up --build --abort-on-container-exit

log_success "Swarm AFK session complete"
