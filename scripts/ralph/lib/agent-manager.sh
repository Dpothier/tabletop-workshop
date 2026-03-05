#!/bin/bash
# Ralph Wiggum - Agent Manager Library
# Manages lifecycle of parallel Ralph agents (launch, monitor, collect)

# Library file - meant to be sourced, no set -euo pipefail at top level

# ============================================================================
# Ensure base directories exist
# ============================================================================

_agent_ensure_dirs() {
    local state_dir="${PROJECT_ROOT}/.ralph/swarm-state"
    mkdir -p "$state_dir/logs"
}

# ============================================================================
# State file management
# ============================================================================

agents_load_state() {
    local state_file="${PROJECT_ROOT}/.ralph/swarm-state/agents.json"

    if [ ! -f "$state_file" ]; then
        echo "{}"
        return 0
    fi

    cat "$state_file"
}

agents_save_state() {
    local state_json="$1"
    local state_file="${PROJECT_ROOT}/.ralph/swarm-state/agents.json"

    _agent_ensure_dirs
    echo "$state_json" | jq . > "$state_file" 2>/dev/null || {
        log_error "Failed to save agents state"
        return 1
    }
}

# ============================================================================
# Worktree setup
# ============================================================================

agent_setup_worktree() {
    local agent_id="$1"
    local base_branch="$2"

    local worktree_dir="${PROJECT_ROOT}/.claude/worktrees/ralph-${agent_id}"
    local branch_name="ralph-swarm/${agent_id}"

    # If worktree already exists, reuse it
    if [ -d "$worktree_dir" ]; then
        log_info "Agent $agent_id: Reusing existing worktree at ${worktree_dir}"
        echo "$worktree_dir"
        return 0
    fi

    log_info "Agent $agent_id: Creating worktree at ${worktree_dir}"
    mkdir -p "$(dirname "$worktree_dir")"

    # Check if branch already exists locally
    if git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
        log_info "Agent $agent_id: Branch $branch_name exists, resuming"
        git worktree add "$worktree_dir" "$branch_name" || {
            log_error "Agent $agent_id: Failed to create worktree from existing branch"
            return 1
        }
    elif git rev-parse --verify "origin/${branch_name}" >/dev/null 2>&1; then
        log_info "Agent $agent_id: Branch $branch_name exists on remote"
        git worktree add "$worktree_dir" -b "$branch_name" "origin/${branch_name}" || {
            log_error "Agent $agent_id: Failed to create worktree from remote branch"
            return 1
        }
    else
        log_info "Agent $agent_id: Creating new branch $branch_name from $base_branch"
        git worktree add "$worktree_dir" -b "$branch_name" "$base_branch" || {
            log_error "Agent $agent_id: Failed to create worktree"
            return 1
        }
    fi

    # Symlink node_modules from PROJECT_ROOT
    if [ -d "${PROJECT_ROOT}/node_modules" ]; then
        ln -sf "${PROJECT_ROOT}/node_modules" "${worktree_dir}/node_modules" || {
            log_warning "Agent $agent_id: Failed to symlink node_modules"
        }
    fi

    log_success "Agent $agent_id: Worktree created at ${worktree_dir}"
    echo "$worktree_dir"
}

# ============================================================================
# PRD filtering
# ============================================================================

agent_write_prd() {
    local agent_id="$1"
    local worktree_dir="$2"
    local issue_keys_json="$3"

    local target_prd="${worktree_dir}/prd.json"

    log_info "Agent $agent_id: Writing filtered prd.json"

    # Create a filtered prd.json with only the assigned issues
    jq --argjson issues "$issue_keys_json" '
        .userStories |= map(
            select(.id as $id | $issues | index($id) != null)
        ) |
        .
    ' "$PRD_FILE" > "$target_prd" 2>/dev/null || {
        log_error "Agent $agent_id: Failed to write filtered prd.json"
        return 1
    }

    local story_count
    story_count=$(jq '.userStories | length' "$target_prd" 2>/dev/null || echo "0")
    log_success "Agent $agent_id: Wrote prd.json with $story_count stories"
}

# ============================================================================
# Agent launch and monitoring
# ============================================================================

agent_launch() {
    local agent_id="$1"
    local worktree_dir="$2"
    local epic_key="$3"

    local log_file="${PROJECT_ROOT}/.ralph/swarm-state/logs/${agent_id}.log"
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

    _agent_ensure_dirs

    log_info "Agent $agent_id: Launching in ${worktree_dir}"

    # Launch ralph.sh in background
    (
        cd "$worktree_dir"
        "$script_dir/ralph.sh" --no-worktree --agent-id "$agent_id" 2>&1
    ) > "$log_file" 2>&1 &

    local pid=$!
    log_info "Agent $agent_id: Started with PID $pid"

    # Update state file
    local state
    state=$(agents_load_state)

    local started_at
    started_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    state=$(echo "$state" | jq \
        --arg id "$agent_id" \
        --arg epic_key "$epic_key" \
        --arg worktree "$worktree_dir" \
        --arg branch "ralph-swarm/${agent_id}" \
        --argjson pid "$pid" \
        --arg started_at "$started_at" \
        '.[$id] = {
            id: $id,
            issues: [],
            worktree: $worktree,
            branch: $branch,
            pid: $pid,
            status: "running",
            started_at: $started_at,
            completed_at: null
        }' 2>/dev/null)

    agents_save_state "$state" || return 1

    echo "$pid"
}

# ============================================================================
# Agent status checking
# ============================================================================

agent_is_running() {
    local agent_id="$1"

    local state
    state=$(agents_load_state)

    local pid
    pid=$(echo "$state" | jq -r --arg id "$agent_id" '.[$id].pid // empty' 2>/dev/null)

    if [ -z "$pid" ]; then
        return 1
    fi

    # Check if process is still alive
    kill -0 "$pid" 2>/dev/null
}

agent_list_running() {
    local state
    state=$(agents_load_state)

    echo "$state" | jq -r '
        to_entries[] |
        select(.value.status == "running") |
        .key
    ' 2>/dev/null || echo ""
}

agent_wait_any() {
    local poll_interval="${SWARM_POLL_INTERVAL:-10}"

    while true; do
        local running_agents
        running_agents=$(agent_list_running | tr '\n' ' ')

        if [ -z "$running_agents" ]; then
            return 1
        fi

        for agent_id in $running_agents; do
            if ! agent_is_running "$agent_id"; then
                echo "$agent_id"
                return 0
            fi
        done

        sleep "$poll_interval"
    done
}

# ============================================================================
# Results collection
# ============================================================================

agent_collect_results() {
    local agent_id="$1"

    local worktree_dir="${PROJECT_ROOT}/.claude/worktrees/ralph-${agent_id}"
    local agent_prd="${worktree_dir}/prd.json"

    log_info "Agent $agent_id: Collecting results"

    if [ ! -f "$agent_prd" ]; then
        log_warning "Agent $agent_id: No prd.json found, skipping results"
        echo "{}"
        return 0
    fi

    # Extract completed story IDs
    local completed_stories
    completed_stories=$(jq -r '
        .userStories[] |
        select(.passes == true) |
        .id
    ' "$agent_prd" 2>/dev/null | jq -R . | jq -s .)

    # Update state
    local state
    state=$(agents_load_state)

    local completed_at
    completed_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    state=$(echo "$state" | jq \
        --arg id "$agent_id" \
        --argjson completed "$completed_stories" \
        --arg completed_at "$completed_at" \
        '.[$id].status = "completed" |
         .[$id].completed_at = $completed_at |
         .[$id].issues = $completed
        ' 2>/dev/null)

    agents_save_state "$state" || return 1

    # Return results JSON
    jq -n \
        --arg agent_id "$agent_id" \
        --argjson completed_stories "$completed_stories" \
        '{agent_id: $agent_id, completed_stories: $completed_stories}'
}

# ============================================================================
# Cleanup
# ============================================================================

agent_cleanup() {
    local agent_id="$1"

    local worktree_dir="${PROJECT_ROOT}/.claude/worktrees/ralph-${agent_id}"
    local branch_name="ralph-swarm/${agent_id}"

    log_info "Agent $agent_id: Cleaning up"

    # Remove worktree if it exists
    if [ -d "$worktree_dir" ]; then
        git worktree remove "$worktree_dir" 2>/dev/null || {
            log_warning "Agent $agent_id: Could not remove worktree, cleaning up manually"
            rm -rf "$worktree_dir"
        }
    fi

    # Optionally delete branch (controlled by config)
    if [ "${AGENT_DELETE_BRANCHES:-false}" = "true" ]; then
        git branch -D "$branch_name" 2>/dev/null || true
    fi

    log_success "Agent $agent_id: Cleanup complete"
}

# ============================================================================
# Self-test block (for debugging)
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Agent Manager Library - Self Test"
    echo "===================================="

    # This won't run directly, but ensures syntax is valid
    echo "Functions available:"
    declare -F | grep '^declare -f agent' | awk '{print "  - " $3}'
    declare -F | grep '^declare -f agents' | awk '{print "  - " $3}'

    echo ""
    echo "Usage: source agent-manager.sh"
fi
