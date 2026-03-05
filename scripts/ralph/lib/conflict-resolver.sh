#!/bin/bash
# Ralph Wiggum - Conflict Resolver Library
# Launches Claude agent to resolve merge conflicts with retry/fallback

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Source config for logging functions
if [ ! -f "${PROJECT_ROOT}/.ralph/config.sh" ]; then
    echo "ERROR: config.sh not found at ${PROJECT_ROOT}/.ralph/config.sh"
    exit 1
fi
source "${PROJECT_ROOT}/.ralph/config.sh"

# ============================================================================
# Ensure state directories exist
# ============================================================================

_resolver_ensure_dirs() {
    local state_dir="${PROJECT_ROOT}/.ralph/swarm-state"
    mkdir -p "$state_dir/logs"
}

# ============================================================================
# Check for clean merge (no conflict markers)
# ============================================================================

resolver_check_clean() {
    local worktree_dir="$1"

    if [ ! -d "$worktree_dir" ]; then
        log_error "Worktree directory not found: $worktree_dir"
        return 1
    fi

    # Look for conflict markers in tracked file types
    if grep -r '<<<<<<<' \
        --include='*.ts' \
        --include='*.js' \
        --include='*.json' \
        "$worktree_dir" >/dev/null 2>&1; then
        return 1  # Conflicts found
    fi

    return 0  # Clean
}

# ============================================================================
# Gather conflict context
# ============================================================================

_resolver_gather_context() {
    local integration_worktree="$1"
    local agent_branch="$2"

    # List of conflicted files
    local conflicted_files
    conflicted_files=$(cd "$integration_worktree" && git diff --name-only --diff-filter=U 2>/dev/null || echo "")

    if [ -z "$conflicted_files" ]; then
        echo ""
        return 0
    fi

    local conflict_details=""

    # For each conflicted file, show conflict markers
    while IFS= read -r file; do
        conflict_details+="### File: $file
"
        conflict_details+=$(cd "$integration_worktree" && git diff "$file" 2>/dev/null || echo "(could not read diff)")
        conflict_details+="

"
    done <<< "$conflicted_files"

    # Incoming changes from agent_branch
    local incoming_log
    incoming_log=$(cd "$integration_worktree" && git log --oneline "integration..$agent_branch" 2>/dev/null || echo "(no commits)")

    cat <<EOF
$conflict_details

## Incoming Changes (from $agent_branch)

$incoming_log
EOF
}

# ============================================================================
# Launch Claude to resolve conflicts (single attempt)
# ============================================================================

resolver_attempt() {
    local integration_worktree="$1"
    local agent_branch="$2"
    local attempt_number="${3:-1}"

    if [ ! -d "$integration_worktree" ]; then
        log_error "Integration worktree not found: $integration_worktree"
        return 1
    fi

    _resolver_ensure_dirs

    local log_file="${PROJECT_ROOT}/.ralph/swarm-state/logs/resolver-${agent_branch}-${attempt_number}.log"
    local context
    context=$(_resolver_gather_context "$integration_worktree" "$agent_branch")

    local prompt
    prompt=$(cat <<'PROMPT_EOF'
You are resolving merge conflicts in a git repository.

## Conflicted Files

PROMPT_EOF
)

    prompt+="$context

## Instructions

1. Read each conflicted file
2. Resolve conflicts by keeping BOTH changes where possible
3. If changes are incompatible, prefer the incoming branch changes but preserve existing functionality
4. Stage resolved files with: git add <file>
5. Run: npm run check && npm run test
6. If tests pass, commit with message: merge: resolve conflicts from ${agent_branch}
7. If tests fail, fix the issues and try again
8. Once complete, type: exit

"

    log_info "Resolver attempt $attempt_number for $agent_branch"
    log_info "Launching Claude in pipe mode..."

    local claude_exit=0
    (
        cd "$integration_worktree"
        export RALPH_MODE=true
        echo "$prompt" | claude -p --verbose --dangerously-skip-permissions 2>&1 || claude_exit=$?
    ) > "$log_file" 2>&1

    # Capture exit code from subshell
    claude_exit=$?

    log_info "Claude exited with code: $claude_exit"

    # Check if merge is clean (no conflict markers remain)
    if resolver_check_clean "$integration_worktree"; then
        log_success "Conflicts resolved successfully"
        return 0
    else
        log_warning "Conflict markers still present after Claude attempt"
        return 1
    fi
}

# ============================================================================
# Orchestrate full conflict resolution with retries
# ============================================================================

resolver_resolve() {
    local integration_worktree="$1"
    local agent_branch="$2"
    local max_retries="${3:-${SWARM_MAX_CONFLICT_RETRIES:-2}}"

    if [ ! -d "$integration_worktree" ]; then
        log_error "Integration worktree not found: $integration_worktree"
        return 1
    fi

    log_info "Starting conflict resolution for $agent_branch (max retries: $max_retries)"

    local attempt=0
    while [ $attempt -lt "$max_retries" ]; do
        attempt=$((attempt + 1))

        log_info "Attempt $attempt / $max_retries"

        if resolver_attempt "$integration_worktree" "$agent_branch" "$attempt"; then
            log_success "Conflict resolved on attempt $attempt"
            return 0
        fi

        # If not the last attempt, abort and re-merge to get clean conflict state
        if [ $attempt -lt "$max_retries" ]; then
            log_warning "Resolution failed, aborting merge for retry..."
            (
                cd "$integration_worktree"
                git merge --abort 2>/dev/null || true
            )

            # Re-initiate merge to get fresh conflict state
            log_info "Re-initiating merge..."
            (
                cd "$integration_worktree"
                git merge "$agent_branch" >/dev/null 2>&1 || true
            )

            sleep 1
        fi
    done

    log_error "Failed to resolve conflicts after $max_retries attempts"
    return 1
}

# ============================================================================
# Self-test block (for debugging)
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Conflict Resolver Library - Self Test"
    echo "======================================"

    echo "Functions available:"
    declare -F | grep '^declare -f resolver' | awk '{print "  - " $3}'

    echo ""
    echo "Usage: source conflict-resolver.sh"
    echo ""
    echo "Example:"
    echo "  resolver_resolve /path/to/worktree ralph-swarm/agent-1 2"
fi
