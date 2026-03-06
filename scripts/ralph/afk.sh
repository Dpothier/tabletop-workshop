#!/bin/bash

# AFK Mode - Ralph autonomous TDD loop in Docker
# Runs the Ralph loop non-interactively with permissions bypassed.
# Progress is tracked in prd.json and progress.txt.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.ralph.yml"

# Export host identity for Docker (snap Docker resolves ~ to snap home, not real home)
export HOST_UID=$(id -u)
export HOST_GID=$(id -g)
export REAL_HOME=$(eval echo "~$(whoami)")

# Parse our flags (before passing rest to ralph.sh)
FORCE_BUILD=false
NO_BUILD=false
RALPH_ARGS=()
for arg in "$@"; do
    case "$arg" in
        --build) FORCE_BUILD=true ;;
        --no-build) NO_BUILD=true ;;
        *) RALPH_ARGS+=("$arg") ;;
    esac
done

# Auto-detect if image is stale by comparing git SHA
export GIT_SHA=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")

needs_build() {
    if [ "$FORCE_BUILD" = "true" ]; then return 0; fi
    if [ "$NO_BUILD" = "true" ]; then return 1; fi

    # No image exists
    local image_id
    image_id=$(docker compose -f "$COMPOSE_FILE" images ralph --quiet 2>/dev/null | head -1)
    if [ -z "$image_id" ]; then return 0; fi

    # Compare git SHA in image label vs current HEAD
    local image_sha
    image_sha=$(docker inspect --format '{{ index .Config.Labels "ralph.git_sha" }}' "$image_id" 2>/dev/null || echo "")
    if [ "$image_sha" != "$GIT_SHA" ]; then return 0; fi

    return 1
}

if needs_build; then
    echo "[INFO] Building Docker image (${GIT_SHA})..."
    docker compose -f "$COMPOSE_FILE" build --quiet
else
    echo "[INFO] Image up to date (${GIT_SHA})"
fi

echo "[INFO] Starting Ralph in AFK mode (autonomous TDD loop)"
echo "[INFO] Container is isolated — all file changes stay in the mounted workspace"
echo "[INFO] Use 'docker compose -f docker-compose.ralph.yml logs -f' to follow progress"
echo ""

# --no-worktree: Docker provides isolation; host worktrees have broken .git paths inside containers
docker compose -f "$COMPOSE_FILE" run --rm ralph --no-worktree ${RALPH_ARGS[@]+"${RALPH_ARGS[@]}"}
