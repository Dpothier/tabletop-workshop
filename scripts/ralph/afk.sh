#!/bin/bash

# AFK Mode - Ralph autonomous TDD loop in Docker
# Runs the Ralph loop non-interactively with permissions bypassed.
# Progress is tracked in prd.json and progress.txt.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.ralph.yml"

# Export host UID/GID for Docker user mapping (credential file permissions)
export HOST_UID=$(id -u)
export HOST_GID=$(id -g)

# Build if needed
if ! docker compose -f "$COMPOSE_FILE" images ralph --quiet 2>/dev/null | grep -q .; then
    echo "[INFO] Building Docker image..."
    docker compose -f "$COMPOSE_FILE" build
fi

echo "[INFO] Starting Ralph in AFK mode (autonomous TDD loop)"
echo "[INFO] Container is isolated — all file changes stay in the mounted workspace"
echo "[INFO] Use 'docker compose -f docker-compose.ralph.yml logs -f' to follow progress"
echo ""

# --no-worktree: Docker provides isolation; host worktrees have broken .git paths inside containers
docker compose -f "$COMPOSE_FILE" run --rm ralph --no-worktree "$@"
