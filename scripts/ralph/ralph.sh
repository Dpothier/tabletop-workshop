#!/bin/bash

# Ralph Wiggum - Autonomous TDD Loop Main Script
# Outer bash loop that invokes Claude CLI for each story iteration.
# The Stop hook (scripts/ralph/stop-hook.sh) handles re-injection within sessions.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source configuration
if [ ! -f "${PROJECT_ROOT}/.ralph/config.sh" ]; then
    echo "ERROR: config.sh not found at ${PROJECT_ROOT}/.ralph/config.sh"
    exit 2
fi
source "${PROJECT_ROOT}/.ralph/config.sh"

# Source JIRA credentials if available
if [ -f "${PROJECT_ROOT}/.env.ralph" ]; then
    set -a
    source "${PROJECT_ROOT}/.env.ralph"
    set +a
fi

# ============================================================================
# Worktree management
# ============================================================================

WORKTREE_DIR=""
WORKTREE_BRANCH=""

setup_worktree() {
    local epic_key="${1:-ralph}"
    WORKTREE_BRANCH="ralph/${epic_key}"
    WORKTREE_DIR="${PROJECT_ROOT}/.claude/worktrees/ralph"

    # Worktree already exists from previous run
    if [ -d "$WORKTREE_DIR" ]; then
        log_info "Resuming existing worktree at ${WORKTREE_DIR}"
        log_info "Branch: $(git -C "$WORKTREE_DIR" branch --show-current)"
        log_info "Pulling latest changes..."
        git -C "$WORKTREE_DIR" pull --ff-only 2>/dev/null && \
            log_success "Worktree up to date" || \
            log_warning "Pull failed (no remote tracking or conflicts)"
        return 0
    fi

    log_info "Creating worktree: ${WORKTREE_DIR} (branch: ${WORKTREE_BRANCH})"
    mkdir -p "$(dirname "$WORKTREE_DIR")"

    # Check if branch already exists (from a previous run that was cleaned up)
    if git rev-parse --verify "$WORKTREE_BRANCH" >/dev/null 2>&1; then
        log_info "Branch ${WORKTREE_BRANCH} exists, resuming from previous run"
        git worktree add "$WORKTREE_DIR" "$WORKTREE_BRANCH" || {
            log_error "Failed to create worktree from existing branch"
            return 1
        }
    elif git rev-parse --verify "origin/${WORKTREE_BRANCH}" >/dev/null 2>&1; then
        log_info "Branch ${WORKTREE_BRANCH} exists on remote, checking out"
        git worktree add "$WORKTREE_DIR" -b "$WORKTREE_BRANCH" "origin/${WORKTREE_BRANCH}" || {
            log_error "Failed to create worktree from remote branch"
            return 1
        }
    else
        log_info "Fresh start: creating new branch ${WORKTREE_BRANCH}"
        git worktree add "$WORKTREE_DIR" -b "$WORKTREE_BRANCH" || {
            log_error "Failed to create worktree"
            return 1
        }
    fi

    log_success "Worktree created at ${WORKTREE_DIR}"
}

finalize_worktree() {
    if [ -z "$WORKTREE_DIR" ] || [ ! -d "$WORKTREE_DIR" ]; then
        return 0
    fi

    # Copy prd.json back to main repo
    if [ -f "${WORKTREE_DIR}/prd.json" ]; then
        cp "${WORKTREE_DIR}/prd.json" "${PROJECT_ROOT}/prd.json"
    fi

    # Push branch to remote
    log_info "Pushing branch ${WORKTREE_BRANCH} to remote..."
    git -C "$WORKTREE_DIR" push -u origin "$WORKTREE_BRANCH" 2>/dev/null && \
        log_success "Pushed to origin/${WORKTREE_BRANCH}" || \
        log_warning "Push failed (check remote access)"

    # Check for uncommitted changes
    local has_changes
    has_changes=$(git -C "$WORKTREE_DIR" status --porcelain 2>/dev/null | head -1)

    if [ -n "$has_changes" ]; then
        log_warning "Worktree has uncommitted changes, keeping it"
        log_info "To clean up: git worktree remove ${WORKTREE_DIR}"
    else
        log_info "Removing worktree..."
        git worktree remove "$WORKTREE_DIR" 2>/dev/null && \
            log_success "Worktree removed" || \
            log_warning "Could not remove worktree: git worktree remove ${WORKTREE_DIR}"
    fi

    echo ""
    log_info "To review: git log origin/${WORKTREE_BRANCH} --oneline"
    log_info "To create PR: gh pr create --base main --head ${WORKTREE_BRANCH}"
}

# ============================================================================
# Prerequisites check
# ============================================================================

check_prerequisites() {
    local failed=0

    if [ ! -f "$PRD_FILE" ]; then
        log_error "prd.json not found at $PRD_FILE"
        log_info "Create it: cp .ralph/EXAMPLE.json prd.json"
        failed=1
    elif ! jq . "$PRD_FILE" > /dev/null 2>&1; then
        log_error "prd.json is not valid JSON"
        failed=1
    fi

    if ! command -v claude &> /dev/null; then
        log_error "claude CLI not found in PATH"
        log_info "Install: npm install -g @anthropic-ai/claude-code"
        failed=1
    fi

    if ! command -v jq &> /dev/null; then
        log_error "jq not found in PATH"
        failed=1
    fi

    if [ ! -f "${RALPH_DIR}/PROMPT.md" ]; then
        log_error "PROMPT.md not found at ${RALPH_DIR}/PROMPT.md"
        failed=1
    fi

    return $failed
}

# ============================================================================
# Story helpers
# ============================================================================

count_total_stories() {
    jq '.userStories | length' "$PRD_FILE" 2>/dev/null || echo "0"
}

count_completed_stories() {
    jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "0"
}

get_next_story_id() {
    jq -r '[.userStories[] | select(.passes == false)] | first | .id // empty' "$PRD_FILE" 2>/dev/null || echo ""
}

all_stories_complete() {
    local incomplete
    incomplete=$(jq '[.userStories[] | select(.passes == false)] | length' "$PRD_FILE" 2>/dev/null || echo "1")
    [ "$incomplete" -eq 0 ]
}

# ============================================================================
# Build context for Claude invocation
# ============================================================================

build_context() {
    local story_id="$1"

    # Get story details
    local story_json
    story_json=$(jq --arg id "$story_id" '.userStories[] | select(.id == $id)' "$PRD_FILE")

    local story_title
    story_title=$(echo "$story_json" | jq -r '.title // ""')
    local story_description
    story_description=$(echo "$story_json" | jq -r '.description // ""')
    local story_type
    story_type=$(echo "$story_json" | jq -r '.type // "unit"')

    # Build context message
    cat <<EOF
$(cat "${RALPH_DIR}/PROMPT.md")

---

## Current Story

Story ID: ${story_id}
Title: ${story_title}
Type: ${story_type}

### Description / Acceptance Criteria

${story_description}

---

## Recent Progress

$(tail -n 30 "$PROGRESS_FILE" 2>/dev/null || echo "(no progress yet)")

---

## Instructions

Execute the full TDD cycle for story ${story_id}:
1. [RED] Write a failing ${story_type} test
2. [GREEN] Write minimal production code to make it pass
3. [REFACTOR] Improve quality if needed
4. [VERIFY] Run: npm run check && npm run test
5. [ACCEPT] Validate implementation covers ALL acceptance criteria from story description
6. [COMMIT] Commit changes, update prd.json (set passes: true), update progress.txt

When all stories are complete, output: <promise>COMPLETE</promise>
EOF
}

# ============================================================================
# Main loop
# ============================================================================

main() {
    # Parse arguments
    local epic_key=""
    local max_override=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --epic|-e)
                epic_key="$2"
                shift 2
                ;;
            --max|-m)
                max_override="$2"
                shift 2
                ;;
            --no-worktree)
                NO_WORKTREE=true
                shift
                ;;
            --agent-id)
                AGENT_ID="$2"
                shift 2
                ;;
            *)
                # Legacy: first positional arg = max iterations
                if [[ "$1" =~ ^[0-9]+$ ]]; then
                    max_override="$1"
                fi
                shift
                ;;
        esac
    done

    if [ -n "$max_override" ]; then
        MAX_ITERATIONS="$max_override"
    fi

    # --agent-id implies --no-worktree (orchestrator manages worktrees)
    if [ -n "${AGENT_ID:-}" ]; then
        NO_WORKTREE=true
    fi

    log_info "============================================"
    log_info "  Ralph Wiggum Autonomous TDD Loop"
    log_info "  Max iterations: $MAX_ITERATIONS${AGENT_ID:+ | Agent: $AGENT_ID}${IN_CONTAINER:+ | Container: yes}"
    log_info "============================================"

    # Check prerequisites
    if ! check_prerequisites; then
        log_error "Prerequisites check failed. Fix the above issues and retry."
        exit 2
    fi

    # Setup worktree unless --no-worktree
    local work_dir="$PROJECT_ROOT"
    if [ "${NO_WORKTREE:-}" != "true" ]; then
        local wt_name="${epic_key:-$(jq -r '.epicKey // "current"' "$PRD_FILE" 2>/dev/null || echo "current")}"
        if setup_worktree "$wt_name"; then
            work_dir="$WORKTREE_DIR"
            log_info "Working in worktree: ${work_dir}"

            # Copy prd.json and progress.txt to worktree if not already there
            [ ! -f "${work_dir}/prd.json" ] && cp "$PRD_FILE" "${work_dir}/prd.json"
            [ ! -f "${work_dir}/progress.txt" ] && cp "$PROGRESS_FILE" "${work_dir}/progress.txt" 2>/dev/null || true

            # Update paths for worktree
            PRD_FILE="${work_dir}/prd.json"
            PROGRESS_FILE="${work_dir}/progress.txt"
            RALPH_DIR="${work_dir}/.ralph"
        else
            log_warning "Worktree setup failed, working in main repo"
        fi
        trap finalize_worktree EXIT
    fi

    # JIRA sync: pull stories if epic key provided and JIRA configured
    if [ -n "$epic_key" ] && [ -n "${JIRA_BASE_URL:-}" ] && [ -z "${AGENT_ID:-}" ]; then
        log_info "Syncing stories from JIRA epic ${epic_key}..."
        "${SCRIPT_DIR}/jira-sync.sh" pull "$epic_key" || log_warning "JIRA pull failed, using existing prd.json"
    fi

    local total
    total=$(count_total_stories)
    local completed
    completed=$(count_completed_stories)
    log_info "Stories: $completed/$total complete"

    # Check if already done
    if all_stories_complete; then
        log_success "All $total stories are already complete!"
        exit 0
    fi

    # Reset iteration counter for this session
    echo "0" > "${RALPH_DIR}/.iteration_count"
    log_info "Iteration counter reset"

    # Main loop
    local iteration=0
    while [ $iteration -lt $MAX_ITERATIONS ]; do
        iteration=$((iteration + 1))
        echo ""
        log_info "========== ITERATION $iteration / $MAX_ITERATIONS =========="

        # Refresh counts
        completed=$(count_completed_stories)
        total=$(count_total_stories)
        log_info "Progress: $completed/$total stories complete"

        # Check completion
        if all_stories_complete; then
            log_success "All stories complete after $iteration iterations!"
            # JIRA sync: push completed stories
            if [ -n "${JIRA_BASE_URL:-}" ] && [ -z "${AGENT_ID:-}" ]; then
                log_info "Syncing completed stories back to JIRA..."
                "${SCRIPT_DIR}/jira-sync.sh" push || log_warning "JIRA push failed"
            fi
            exit 0  # trap finalize_worktree handles push + cleanup
        fi

        # Get next story
        local next_story
        next_story=$(get_next_story_id)
        if [ -z "$next_story" ]; then
            log_success "No more incomplete stories found"
            exit 0
        fi

        log_info "Working on story: $next_story"

        # Build context
        local context
        context=$(build_context "$next_story")

        # Update iteration counter for the stop hook
        echo "$iteration" > "${RALPH_DIR}/.iteration_count"

        # Invoke Claude with RALPH_MODE so the stop hook activates
        export RALPH_MODE=true

        # Log file for this iteration (tail -f to monitor)
        local log_dir="${work_dir}/.ralph/logs"
        mkdir -p "$log_dir"
        local log_file="${log_dir}/iteration-${iteration}-${next_story}.log"
        log_info "Invoking Claude CLI... (log: ${log_file})"

        local claude_exit=0
        pushd "$work_dir" > /dev/null
        # Export context as env var to avoid quoting issues with script -c
        export RALPH_CONTEXT="$context"
        # script -qf creates a pseudo-TTY so Claude streams output in real-time
        # Output goes to both terminal and log file simultaneously
        script -qfc 'claude -p --verbose --dangerously-skip-permissions "$RALPH_CONTEXT"' "$log_file" || claude_exit=$?
        unset RALPH_CONTEXT
        popd > /dev/null

        log_info "Claude exited with code: $claude_exit"

        # Check what happened
        case $claude_exit in
            0)
                log_success "Claude session completed normally"
                ;;
            2)
                log_info "Claude indicated completion (exit code 2)"
                ;;
            *)
                log_warning "Claude exited with unexpected code: $claude_exit"
                # Append error to progress
                {
                    echo ""
                    echo "[ITERATION $iteration] Story: $next_story"
                    echo "- Result: FAILURE"
                    echo "- Error: Claude exited with code $claude_exit"
                    echo "- Action: Will retry on next iteration"
                    echo ""
                } >> "$PROGRESS_FILE"
                ;;
        esac

        # Auto-fix formatting/linting if configured
        if [ "$AUTO_FORMAT_ON_FAILURE" = "true" ]; then
            cd "$work_dir"
            npm run format 2>/dev/null || true
        fi
        if [ "$AUTO_LINT_FIX_ON_FAILURE" = "true" ]; then
            cd "$work_dir"
            npm run lint:fix 2>/dev/null || true
        fi

        # Brief pause between iterations
        sleep 2
    done

    # JIRA sync: push completed stories
    if [ -n "${JIRA_BASE_URL:-}" ] && [ -z "${AGENT_ID:-}" ]; then
        log_info "Syncing completed stories back to JIRA..."
        "${SCRIPT_DIR}/jira-sync.sh" push || log_warning "JIRA push failed"
    fi

    log_warning "Reached maximum iterations ($MAX_ITERATIONS)"
    log_info "Final progress: $(count_completed_stories)/$(count_total_stories) stories complete"
    exit 1
}

# Run
main "$@"
