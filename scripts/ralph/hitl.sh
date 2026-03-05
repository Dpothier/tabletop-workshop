#!/bin/bash

# HITL Mode - Interactive Claude in Docker (yolo mode)
# Runs Claude Code interactively with permissions bypassed inside a container.
# Supports parallel interactive sessions via git worktrees.
# The container provides isolation, so --dangerously-skip-permissions is safe.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.ralph.yml"
WORKTREES_BASE="${PROJECT_ROOT}/.claude/worktrees"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================================
# Usage / Help
# ============================================================================

show_help() {
    cat <<EOF
HITL Mode - Interactive Claude in Docker with git worktree support

USAGE:
    $(basename "$0") [COMMAND] [OPTIONS]

COMMANDS:
    --session <name>         Launch or resume a named interactive session
                             Creates/resumes worktree at .claude/worktrees/hitl-<name>/
                             Branch: hitl/<name>

    --list, -l               List all active HITL sessions
                             Shows: name, branch, last modified, status

    --cleanup <name>         Remove a session's worktree
                             Warns if uncommitted changes exist
                             Use --force to override warning

    --cleanup-all            Remove ALL HITL worktrees
                             Warns if uncommitted changes exist

    (no command)             Default: run in PROJECT_ROOT directly (backwards compatible)

EXAMPLES:
    # Launch new or resume existing session named "feature-x"
    $(basename "$0") --session feature-x

    # List active sessions
    $(basename "$0") --list

    # Clean up a session (with warning if changes exist)
    $(basename "$0") --cleanup feature-x

    # Force cleanup even with uncommitted changes
    $(basename "$0") --cleanup feature-x --force

    # Remove all sessions
    $(basename "$0") --cleanup-all

    # Run in main repo (legacy mode, no worktree)
    $(basename "$0")

NOTES:
    - Each session gets its own git worktree and isolated environment
    - Symlinks node_modules from PROJECT_ROOT if available
    - Docker container mounts the worktree at /workspace
    - Changes are persisted in the worktree branch
EOF
}

# ============================================================================
# Worktree management functions
# ============================================================================

setup_session_worktree() {
    local session_name="$1"
    local worktree_path="${WORKTREES_BASE}/hitl-${session_name}"
    local branch_name="hitl/${session_name}"

    mkdir -p "$WORKTREES_BASE"

    # Worktree already exists
    if [ -d "$worktree_path" ]; then
        log_info "Resuming existing session: $session_name"
        log_info "Worktree: $worktree_path"
        log_info "Branch: $(git -C "$worktree_path" branch --show-current)"
        return 0
    fi

    log_info "Creating session: $session_name"
    log_info "Worktree: $worktree_path"
    log_info "Branch: $branch_name"

    # Check if branch already exists (from a previous cleanup)
    if git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
        log_info "Branch $branch_name exists, resuming from previous session"
        git worktree add "$worktree_path" "$branch_name" || {
            log_error "Failed to create worktree from existing branch"
            return 1
        }
    elif git rev-parse --verify "origin/${branch_name}" >/dev/null 2>&1; then
        log_info "Branch $branch_name exists on remote, checking out"
        git worktree add "$worktree_path" -b "$branch_name" "origin/${branch_name}" || {
            log_error "Failed to create worktree from remote branch"
            return 1
        }
    else
        log_info "Fresh start: creating new branch $branch_name"
        git worktree add "$worktree_path" -b "$branch_name" || {
            log_error "Failed to create worktree"
            return 1
        }
    fi

    log_success "Worktree created: $worktree_path"

    # Symlink node_modules if PROJECT_ROOT has it and worktree doesn't
    if [ -d "${PROJECT_ROOT}/node_modules" ] && [ ! -d "${worktree_path}/node_modules" ] && [ ! -L "${worktree_path}/node_modules" ]; then
        log_info "Symlinking node_modules..."
        ln -s "${PROJECT_ROOT}/node_modules" "${worktree_path}/node_modules"
        log_success "node_modules symlinked"
    fi

    return 0
}

worktree_has_changes() {
    local worktree_path="$1"
    local has_changes
    has_changes=$(git -C "$worktree_path" status --porcelain 2>/dev/null | head -1)
    [ -n "$has_changes" ]
}

cleanup_session_worktree() {
    local session_name="$1"
    local force="${2:-false}"
    local worktree_path="${WORKTREES_BASE}/hitl-${session_name}"

    if [ ! -d "$worktree_path" ]; then
        log_warning "Worktree not found: $worktree_path"
        return 1
    fi

    # Check for uncommitted changes
    if worktree_has_changes "$worktree_path"; then
        if [ "$force" != "true" ]; then
            log_warning "Session '$session_name' has uncommitted changes"
            log_info "To force cleanup: $(basename "$0") --cleanup $session_name --force"
            return 1
        fi
        log_warning "Force cleaning up session with uncommitted changes"
    fi

    log_info "Removing worktree: $worktree_path"
    git worktree remove "$worktree_path" 2>/dev/null && {
        log_success "Session '$session_name' cleaned up"
        return 0
    } || {
        log_error "Failed to remove worktree: $worktree_path"
        log_info "Manual cleanup: git worktree remove $worktree_path"
        return 1
    }
}

list_sessions() {
    if [ ! -d "$WORKTREES_BASE" ]; then
        log_info "No sessions found"
        return 0
    fi

    local sessions_found=0
    log_info "Active HITL sessions:"
    echo ""

    for worktree_dir in "$WORKTREES_BASE"/hitl-*; do
        if [ -d "$worktree_dir" ]; then
            sessions_found=1
            local session_name
            session_name=$(basename "$worktree_dir" | sed 's/^hitl-//')
            local branch
            branch=$(git -C "$worktree_dir" branch --show-current 2>/dev/null || echo "unknown")
            local last_modified
            last_modified=$(stat -f %Sm -t "%Y-%m-%d %H:%M:%S" "$worktree_dir" 2>/dev/null || stat -c '%y' "$worktree_dir" 2>/dev/null | cut -d' ' -f1-2)
            local status="clean"

            if worktree_has_changes "$worktree_dir"; then
                status="dirty (has uncommitted changes)"
            fi

            printf "  %-20s  branch: %-20s  modified: %-19s  [%s]\n" \
                "$session_name" "$branch" "$last_modified" "$status"
        fi
    done

    if [ $sessions_found -eq 0 ]; then
        log_info "No active sessions"
        return 0
    fi

    echo ""
}

# ============================================================================
# Docker build and execution
# ============================================================================

ensure_image_built() {
    if ! docker compose -f "$COMPOSE_FILE" images ralph --quiet 2>/dev/null | grep -q .; then
        log_info "Building Docker image..."
        docker compose -f "$COMPOSE_FILE" build
    fi
}

run_in_session() {
    local session_name="$1"
    local worktree_path="${WORKTREES_BASE}/hitl-${session_name}"

    if [ ! -d "$worktree_path" ]; then
        log_error "Worktree not found: $worktree_path"
        return 1
    fi

    ensure_image_built

    log_info "Starting Claude Code in HITL mode (interactive + skip permissions)"
    log_info "Session: $session_name"
    log_info "Worktree: $worktree_path"
    log_info "Container is isolated — all file changes stay in the mounted workspace"
    echo ""

    # Run docker with worktree mounted as /workspace
    docker compose -f "$COMPOSE_FILE" run --rm -it \
        -v "${worktree_path}:/workspace:rw" \
        --workdir /workspace \
        --entrypoint claude \
        ralph --dangerously-skip-permissions "$@"
}

run_in_project_root() {
    ensure_image_built

    log_info "Starting Claude Code in HITL yolo mode (interactive + skip permissions)"
    log_info "Working directory: $PROJECT_ROOT"
    log_info "Container is isolated — all file changes stay in the mounted workspace"
    echo ""

    docker compose -f "$COMPOSE_FILE" run --rm -it --entrypoint claude ralph --dangerously-skip-permissions "$@"
}

# ============================================================================
# Main entry point
# ============================================================================

main() {
    local command=""
    local session_name=""
    local force=false
    local extra_args=()

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help|-h)
                show_help
                exit 0
                ;;
            --session)
                command="session"
                session_name="$2"
                shift 2
                # Remaining args are passed to Claude
                extra_args=("$@")
                break
                ;;
            --list|-l)
                command="list"
                shift
                ;;
            --cleanup)
                command="cleanup"
                session_name="$2"
                shift 2
                ;;
            --cleanup-all)
                command="cleanup-all"
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            *)
                # Unknown argument, pass to default mode
                extra_args+=("$1")
                shift
                ;;
        esac
    done

    case "$command" in
        session)
            if [ -z "$session_name" ]; then
                log_error "Session name required: --session <name>"
                exit 1
            fi
            if ! setup_session_worktree "$session_name"; then
                log_error "Failed to set up session"
                exit 1
            fi
            run_in_session "$session_name" ${extra_args[@]+"${extra_args[@]}"}
            ;;
        list)
            list_sessions
            ;;
        cleanup)
            if [ -z "$session_name" ]; then
                log_error "Session name required: --cleanup <name>"
                exit 1
            fi
            if cleanup_session_worktree "$session_name" "$force"; then
                exit 0
            else
                exit 1
            fi
            ;;
        cleanup-all)
            if [ ! -d "$WORKTREES_BASE" ]; then
                log_info "No sessions to clean up"
                exit 0
            fi

            local failed=0
            for worktree_dir in "$WORKTREES_BASE"/hitl-*; do
                if [ -d "$worktree_dir" ]; then
                    local session_name
                    session_name=$(basename "$worktree_dir" | sed 's/^hitl-//')

                    if ! cleanup_session_worktree "$session_name" "$force"; then
                        failed=$((failed + 1))
                    fi
                fi
            done

            if [ $failed -gt 0 ]; then
                log_error "Failed to clean up $failed session(s)"
                exit 1
            fi
            ;;
        *)
            # Default: run in PROJECT_ROOT
            run_in_project_root ${extra_args[@]+"${extra_args[@]}"}
            ;;
    esac
}

main "$@"
