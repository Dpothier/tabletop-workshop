#!/bin/bash

# Interactive Mode - Claude Code in Docker with yolo permissions
# Launches Claude Code interactively inside the Ralph Docker container.
# Reuses the existing Docker setup from docker-compose.ralph.yml and Dockerfile.ralph.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.ralph.yml"

# Export host identity for Docker (snap Docker resolves ~ to snap home, not real home)
export HOST_UID=$(id -u)
export HOST_GID=$(id -g)
export REAL_HOME=$(eval echo "~$(whoami)")

# Parse our flags (before passing rest to claude)
FORCE_BUILD=false
NO_BUILD=false
WORKSPACE="$PROJECT_ROOT"
CLAUDE_ARGS=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --build) FORCE_BUILD=true; shift ;;
        --no-build) NO_BUILD=true; shift ;;
        --workspace|-w) WORKSPACE="$(cd "$2" && pwd)"; shift 2 ;;
        *) CLAUDE_ARGS+=("$1"); shift ;;
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

echo "[INFO] Starting Claude Code in interactive mode (permissions bypassed)"
echo "[INFO] Workspace: ${WORKSPACE}"
echo ""

# Launch claude interactively with dangerously-skip-permissions
# Override workspace volume to allow mounting a different worktree
docker compose -f "$COMPOSE_FILE" run --rm -it \
    -v "${WORKSPACE}:/workspace:rw" \
    --entrypoint claude ralph \
    --dangerously-skip-permissions ${CLAUDE_ARGS[@]+"${CLAUDE_ARGS[@]}"}
