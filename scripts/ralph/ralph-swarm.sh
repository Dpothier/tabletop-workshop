#!/bin/bash
# Ralph Wiggum - Swarm Orchestrator
# Coordinates multiple parallel Ralph agents for epic-level TDD automation
#
# Usage:
#   ralph-swarm.sh --epic MFG-7                    # Run full swarm
#   ralph-swarm.sh --epic MFG-7 --dry-run          # Validate graph only
#   ralph-swarm.sh --epic MFG-7 --max-agents 1     # Sequential mode
#   ralph-swarm.sh --epic MFG-7 --resume            # Resume from saved state

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ============================================================================
# Source configuration and libraries
# ============================================================================

if [ ! -f "${PROJECT_ROOT}/.ralph/config.sh" ]; then
    echo "ERROR: config.sh not found at ${PROJECT_ROOT}/.ralph/config.sh"
    exit 1
fi
source "${PROJECT_ROOT}/.ralph/config.sh"

# Load environment if available
if [ -f "${PROJECT_ROOT}/.env.ralph" ]; then
    set +u
    source "${PROJECT_ROOT}/.env.ralph"
    set -u
fi

# Source libraries
source "${SCRIPT_DIR}/lib/dependency-graph.sh"
source "${SCRIPT_DIR}/lib/agent-manager.sh"
source "${SCRIPT_DIR}/lib/integration-branch.sh"
source "${SCRIPT_DIR}/lib/conflict-resolver.sh"

# ============================================================================
# State and signal handling
# ============================================================================

STATE_FILE="${SWARM_STATE_DIR}/swarm.state"
GRAPH_FILE="${SWARM_STATE_DIR}/graph.json"

# Trap to save state on exit
trap 'save_state_on_exit' EXIT
trap 'handle_interrupt' INT TERM

save_state_on_exit() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_warning "Swarm interrupted or failed, state saved for recovery"
    fi
}

handle_interrupt() {
    log_warning "Received interrupt signal, saving state..."
    exit 130
}

# ============================================================================
# Argument parsing
# ============================================================================

EPIC_KEY=""
MAX_AGENTS="${SWARM_MAX_PARALLEL_AGENTS}"
DRY_RUN=false
RESUME=false
NO_JIRA=false
SKIP_PR=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --epic|-e)
            EPIC_KEY="$2"
            shift 2
            ;;
        --max-agents)
            MAX_AGENTS="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --resume)
            RESUME=true
            shift
            ;;
        --no-jira)
            NO_JIRA=true
            shift
            ;;
        --skip-pr)
            SKIP_PR=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Usage: $0 --epic <EPIC_KEY> [--max-agents N] [--dry-run] [--resume] [--no-jira] [--skip-pr] [--skip-tests]"
            exit 1
            ;;
    esac
done

if [ -z "$EPIC_KEY" ]; then
    log_error "Epic key required: --epic <EPIC_KEY>"
    exit 1
fi

log_info "======================================"
log_info "Ralph Wiggum - Swarm Orchestrator"
log_info "======================================"
log_info "Epic: $EPIC_KEY"
log_info "Max parallel agents: $MAX_AGENTS"
log_info "Dry run: $DRY_RUN"
log_info "Resume mode: $RESUME"
log_info "Skip JIRA: $NO_JIRA"

# ============================================================================
# Initialization
# ============================================================================

mkdir -p "$SWARM_STATE_DIR/logs"

# ============================================================================
# Graph Construction (unless --resume)
# ============================================================================

if [ "$RESUME" != "true" ]; then
    log_info "Building dependency graph..."

    # Pull JIRA data if not skipping
    if [ "$NO_JIRA" != "true" ]; then
        if [ -z "${JIRA_BASE_URL:-}" ]; then
            log_error "No JIRA configured and --no-jira not set"
            exit 1
        fi

        log_info "Pulling graph from JIRA..."
        if ! "${SCRIPT_DIR}/jira-sync.sh" pull-graph "$EPIC_KEY"; then
            log_error "Failed to pull graph from JIRA"
            exit 1
        fi

        log_info "Pulling prd.json from JIRA..."
        if ! "${SCRIPT_DIR}/jira-sync.sh" pull "$EPIC_KEY"; then
            log_error "Failed to pull prd.json from JIRA"
            exit 1
        fi
    else
        log_info "Building graph from existing prd.json..."
        if [ ! -f "${PRD_FILE}" ]; then
            log_error "No prd.json found and --no-jira specified"
            exit 1
        fi

        # Create temporary JIRA-like JSON for graph building
        temp_jira="/tmp/swarm_jira_$$.json"
        jq '
        {
            issues: .userStories | map({
                key: .id,
                fields: {
                    summary: .title,
                    status: { name: "To Do" },
                    issuelinks: []
                }
            })
        }
        ' "${PRD_FILE}" > "$temp_jira"

        if ! build_graph "$temp_jira" "$GRAPH_FILE"; then
            log_error "Failed to build graph from prd.json"
            rm -f "$temp_jira"
            exit 1
        fi
        rm -f "$temp_jira"
    fi

    # Load graph
    if [ ! -f "$GRAPH_FILE" ]; then
        log_error "Graph file not created: $GRAPH_FILE"
        exit 1
    fi

    # Detect cycles
    if ! detect_cycles "$GRAPH_FILE"; then
        log_error "Dependency graph contains cycles, aborting"
        exit 1
    fi

    # Log graph stats
    node_count=$(jq '.nodes | length' "$GRAPH_FILE")
    chain_count=$(jq '.chains | length' "$GRAPH_FILE")
    ready_count=$(get_ready_tasks "$GRAPH_FILE" | jq 'length')

    log_success "Graph loaded: $node_count nodes, $chain_count chains, $ready_count ready"
fi

# If dry-run, print summary and exit
if [ "$DRY_RUN" = "true" ]; then
    log_info "DRY RUN MODE - Graph Summary"
    jq '.' "$GRAPH_FILE" | head -50
    log_success "Dry run complete, exiting"
    exit 0
fi

# ============================================================================
# Resume mode: check for stale agents
# ============================================================================

if [ "$RESUME" = "true" ]; then
    log_info "Resume mode: checking for stale agents..."

    if [ -f "${SWARM_STATE_DIR}/agents.json" ]; then
        state=$(agents_load_state)

        running_agents=$(echo "$state" | jq -r '.[] | select(.status == "running") | .id' 2>/dev/null || echo "")

        if [ -n "$running_agents" ]; then
            log_warning "Marking stale running agents as failed..."
            while IFS= read -r agent_id; do
                log_warning "  Marking $agent_id as failed (was running)"
                state=$(echo "$state" | jq --arg id "$agent_id" '.[$id].status = "failed"')
            done <<< "$running_agents"

            agents_save_state "$state" || true
        fi
    fi
fi

# ============================================================================
# Integration Branch Setup
# ============================================================================

log_info "Creating integration branch for $EPIC_KEY..."
integration_worktree=$(integration_create "$EPIC_KEY")
log_success "Integration worktree: $integration_worktree"

# Symlink node_modules in integration worktree
if [ -d "${PROJECT_ROOT}/node_modules" ]; then
    ln -sf "${PROJECT_ROOT}/node_modules" "${integration_worktree}/node_modules" 2>/dev/null || true
fi

# ============================================================================
# Main Scheduling Loop
# ============================================================================

schedule_and_run() {
    local completed_count=0
    local failed_count=0
    local total_count
    total_count=$(jq '.nodes | length' "$GRAPH_FILE")

    while true; do
        # Check if all done
        local pending
        pending=$(jq '[.nodes | to_entries[] | select(.value.state == "pending" or .value.state == "in_progress")] | length' "$GRAPH_FILE")

        if [ "$pending" -eq 0 ]; then
            break
        fi

        # Get ready tasks
        local ready_tasks
        ready_tasks=$(get_ready_tasks "$GRAPH_FILE")
        local ready_count
        ready_count=$(echo "$ready_tasks" | jq 'length')

        # Count running agents
        local running_agents
        running_agents=$(agent_list_running)
        local running_count
        running_count=$(echo "$running_agents" | wc -w)
        if [ "$running_count" -eq 0 ] && [ -z "$running_agents" ]; then
            running_count=0
        fi

        # Launch new agents for ready tasks
        local slots=$((MAX_AGENTS - running_count))
        if [ "$slots" -gt 0 ] && [ "$ready_count" -gt 0 ]; then
            local launched=0
            for task_key in $(echo "$ready_tasks" | jq -r '.[]' | head -n "$slots"); do
                local chain='["'$task_key'"]'
                if [ "$SWARM_ENABLE_CHAINING" = "true" ]; then
                    chain=$(get_chain_for_task "$GRAPH_FILE" "$task_key")
                fi

                local agent_id
                agent_id=$(echo "$task_key" | tr '[:upper:]' '[:lower:]' | tr '-' '_')

                # Mark all chain tasks as in_progress
                for key in $(echo "$chain" | jq -r '.[]'); do
                    update_task_state "$GRAPH_FILE" "$key" "in_progress" || true

                    # JIRA transition to In Progress (best effort)
                    if [ "$NO_JIRA" != "true" ] && [ -n "${JIRA_BASE_URL:-}" ]; then
                        "${SCRIPT_DIR}/jira-sync.sh" start "$key" 2>/dev/null || true
                    fi
                done

                # Setup agent
                local worktree
                worktree=$(agent_setup_worktree "$agent_id" "integration/${EPIC_KEY}")
                agent_write_prd "$agent_id" "$worktree" "$chain" || {
                    log_error "Failed to setup agent $agent_id"
                    continue
                }

                # Launch with epic_key as JSON string
                agent_launch "$agent_id" "$worktree" "\"$EPIC_KEY\"" || {
                    log_error "Failed to launch agent $agent_id"
                    continue
                }

                log_info "Launched agent $agent_id for chain: $(echo "$chain" | jq -c '.')"
                launched=$((launched + 1))
            done
        fi

        # Check for deadlock
        if [ "$running_count" -eq 0 ] && [ "$ready_count" -eq 0 ] && [ "$pending" -gt 0 ]; then
            log_error "DEADLOCK: tasks pending but none ready and none running"
            log_error "Pending tasks:"
            jq -r '.nodes | to_entries[] | select(.value.state == "pending") | .key' "$GRAPH_FILE" | while read -r task; do
                log_error "  - $task"
            done
            break
        fi

        # Wait for any agent to complete
        if [ "$running_count" -gt 0 ]; then
            log_info "Waiting for agent completion... ($running_count running, $completed_count completed, $failed_count failed)"
            local finished_agent
            finished_agent=$(agent_wait_any) || {
                # No agent finished (shouldn't happen if running_count > 0)
                sleep "$SWARM_POLL_INTERVAL"
                continue
            }

            if [ -n "$finished_agent" ]; then
                log_info "Agent $finished_agent completed"

                # Collect results
                agent_collect_results "$finished_agent" || true

                # Get agent state to find worktree and branch
                local agent_state
                agent_state=$(agents_load_state)
                local agent_branch
                agent_branch=$(echo "$agent_state" | jq -r --arg id "$finished_agent" '.[$id].branch // empty' 2>/dev/null || echo "")
                local agent_worktree
                agent_worktree=$(echo "$agent_state" | jq -r --arg id "$finished_agent" '.[$id].worktree // empty' 2>/dev/null || echo "")

                if [ -z "$agent_branch" ] || [ -z "$agent_worktree" ]; then
                    log_warning "Agent $finished_agent: could not find branch or worktree"
                    agent_cleanup "$finished_agent" 2>/dev/null || true
                    continue
                fi

                # Merge agent branch into integration
                log_info "Merging $agent_branch into integration branch..."
                if integration_merge_agent "$integration_worktree" "$agent_branch"; then
                    log_success "Merged $agent_branch successfully"

                    # Run integration tests if not skipped
                    if [ "${SKIP_TESTS}" != "true" ]; then
                        if ! integration_run_tests "$integration_worktree"; then
                            log_warning "Integration tests failed after merging $agent_branch"
                        fi
                    fi

                    # Mark tasks completed in graph
                    if [ -f "${agent_worktree}/prd.json" ]; then
                        for key in $(jq -r '.userStories[] | select(.passes == true) | .id' "${agent_worktree}/prd.json" 2>/dev/null || echo ""); do
                            update_task_state "$GRAPH_FILE" "$key" "completed" || true
                            completed_count=$((completed_count + 1))

                            # JIRA transition
                            if [ "$NO_JIRA" != "true" ] && [ -n "${JIRA_BASE_URL:-}" ]; then
                                "${SCRIPT_DIR}/jira-sync.sh" complete "$key" 2>/dev/null || true
                            fi
                        done
                        for key in $(jq -r '.userStories[] | select(.passes == false) | .id' "${agent_worktree}/prd.json" 2>/dev/null || echo ""); do
                            update_task_state "$GRAPH_FILE" "$key" "failed" || true
                            failed_count=$((failed_count + 1))
                        done
                    fi
                else
                    # Merge conflict - attempt resolution
                    log_warning "Merge conflict for $agent_branch, attempting resolution..."
                    if resolver_resolve "$integration_worktree" "$agent_branch" "$SWARM_MAX_CONFLICT_RETRIES"; then
                        log_success "Conflict resolved for $agent_branch"

                        # Mark completed
                        if [ -f "${agent_worktree}/prd.json" ]; then
                            for key in $(jq -r '.userStories[] | select(.passes == true) | .id' "${agent_worktree}/prd.json" 2>/dev/null || echo ""); do
                                update_task_state "$GRAPH_FILE" "$key" "completed" || true
                                completed_count=$((completed_count + 1))
                            done
                        fi
                    else
                        log_error "Failed to resolve conflicts for $agent_branch"
                        integration_abort_merge "$integration_worktree" || true

                        # Mark tasks as conflict-blocked
                        if [ -f "${agent_worktree}/prd.json" ]; then
                            for key in $(jq -r '.userStories[].id' "${agent_worktree}/prd.json" 2>/dev/null || echo ""); do
                                update_task_state "$GRAPH_FILE" "$key" "conflict-blocked" || true
                                failed_count=$((failed_count + 1))
                            done
                        fi
                    fi
                fi

                # Cleanup agent worktree
                if [ "$SWARM_CLEANUP_WORKTREES" = "true" ]; then
                    agent_cleanup "$finished_agent" 2>/dev/null || true
                fi
            fi
        else
            # No agents running, just wait
            sleep "$SWARM_POLL_INTERVAL"
        fi
    done

    echo ""
    log_info "========================================="
    log_info "  Swarm Complete"
    log_info "  Completed: $completed_count / $total_count"
    log_info "  Failed: $failed_count"
    log_info "========================================="
}

schedule_and_run

# ============================================================================
# Post-run: Final tests and PR creation
# ============================================================================

log_info "Running final integration tests..."
if [ "${SKIP_TESTS}" != "true" ]; then
    if ! integration_run_tests "$integration_worktree"; then
        log_warning "Final integration tests failed"
    fi
fi

# Create PR if not skipped
if [ "${SKIP_PR}" != "true" ]; then
    log_info "Creating pull request..."
    pr_summary="Completed stories from swarm run"

    if integration_create_pr "$EPIC_KEY" "integration/${EPIC_KEY}" "$pr_summary"; then
        log_success "Pull request created successfully"
    else
        log_warning "Failed to create pull request, but code is in integration branch"
    fi
else
    log_info "Cleaning up integration worktree..."
    integration_cleanup "$EPIC_KEY" || true
fi

log_success "Ralph Swarm orchestration complete"
