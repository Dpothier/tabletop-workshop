#!/bin/bash

# Ralph Wiggum - Integration Branch Library
# Manages integration branch for merging parallel agent work

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Source config for logging functions
if [ ! -f "${PROJECT_ROOT}/.ralph/config.sh" ]; then
    echo "ERROR: config.sh not found at ${PROJECT_ROOT}/.ralph/config.sh"
    exit 1
fi
source "${PROJECT_ROOT}/.ralph/config.sh"

#
# integration_create(epic_key)
# Creates branch integration/${epic_key} from main
# Creates dedicated worktree for merge operations
# Returns worktree path
#
integration_create() {
    local epic_key="$1"

    if [ -z "$epic_key" ]; then
        log_error "Usage: integration_create <epic_key>"
        return 1
    fi

    local integration_branch="integration/${epic_key}"
    local integration_worktree="${PROJECT_ROOT}/.claude/worktrees/integration-${epic_key}"

    log_info "Creating integration branch: ${integration_branch}"

    # Check if branch exists
    if git rev-parse --verify "$integration_branch" >/dev/null 2>&1; then
        log_info "Branch ${integration_branch} already exists, reusing it"
    else
        log_info "Creating new branch from main"
        git branch "$integration_branch" main || {
            log_error "Failed to create integration branch"
            return 1
        }
        log_success "Created branch ${integration_branch}"
    fi

    # Create worktree if it doesn't exist
    if [ -d "$integration_worktree" ]; then
        log_info "Worktree already exists at ${integration_worktree}"
    else
        log_info "Creating worktree at ${integration_worktree}"
        mkdir -p "$(dirname "$integration_worktree")"
        git worktree add "$integration_worktree" "$integration_branch" || {
            log_error "Failed to create worktree"
            return 1
        }
        log_success "Worktree created at ${integration_worktree}"
    fi

    echo "$integration_worktree"
}

#
# integration_merge_agent(integration_worktree, agent_branch)
# Attempts git merge --no-ff of agent_branch into integration worktree
# Returns 0 on success, 1 on conflict
#
integration_merge_agent() {
    local integration_worktree="$1"
    local agent_branch="$2"

    if [ -z "$integration_worktree" ] || [ -z "$agent_branch" ]; then
        log_error "Usage: integration_merge_agent <worktree_path> <agent_branch>"
        return 1
    fi

    if [ ! -d "$integration_worktree" ]; then
        log_error "Worktree does not exist: ${integration_worktree}"
        return 1
    fi

    log_info "Merging ${agent_branch} into integration branch"

    local merge_output
    merge_output=$(git -C "$integration_worktree" merge --no-ff "$agent_branch" 2>&1)
    local merge_status=$?

    if [ $merge_status -eq 0 ]; then
        log_success "Successfully merged ${agent_branch}"
        return 0
    else
        # Check if it's a conflict
        if echo "$merge_output" | grep -q "CONFLICT"; then
            log_warning "Merge conflict detected for ${agent_branch}"
            # Store merge result for caller
            echo "$merge_output" > "/tmp/integration_merge_result_${agent_branch//\//_}.txt"
            return 1
        else
            log_error "Merge failed: ${merge_output}"
            return 1
        fi
    fi
}

#
# integration_abort_merge(integration_worktree)
# Aborts a conflicted merge
#
integration_abort_merge() {
    local integration_worktree="$1"

    if [ -z "$integration_worktree" ]; then
        log_error "Usage: integration_abort_merge <worktree_path>"
        return 1
    fi

    if [ ! -d "$integration_worktree" ]; then
        log_error "Worktree does not exist: ${integration_worktree}"
        return 1
    fi

    log_info "Aborting merge in ${integration_worktree}"
    git -C "$integration_worktree" merge --abort || {
        log_error "Failed to abort merge"
        return 1
    }
    log_success "Merge aborted"
}

#
# integration_run_tests(integration_worktree)
# Runs npm run check && npm run test in the integration worktree
# Returns 0 on success, 1 on failure
# Captures output to .ralph/swarm-state/logs/integration-tests.log
#
integration_run_tests() {
    local integration_worktree="$1"

    if [ -z "$integration_worktree" ]; then
        log_error "Usage: integration_run_tests <worktree_path>"
        return 1
    fi

    if [ ! -d "$integration_worktree" ]; then
        log_error "Worktree does not exist: ${integration_worktree}"
        return 1
    fi

    local log_dir="${PROJECT_ROOT}/.ralph/swarm-state/logs"
    mkdir -p "$log_dir"
    local log_file="${log_dir}/integration-tests.log"

    log_info "Running tests in ${integration_worktree}"
    log_info "Logging to ${log_file}"

    {
        echo "========================================="
        echo "Integration Tests - $(date)"
        echo "========================================="
        echo ""
        echo "Running: npm run check && npm run test"
        echo ""
    } > "$log_file"

    if cd "$integration_worktree" && npm run check >> "$log_file" 2>&1 && npm run test >> "$log_file" 2>&1; then
        log_success "Tests passed"
        return 0
    else
        log_error "Tests failed (see ${log_file})"
        return 1
    fi
}

#
# integration_get_conflicts(integration_worktree)
# Lists conflicted files when in conflicted merge state
# Returns JSON array of conflicted file paths
#
integration_get_conflicts() {
    local integration_worktree="$1"

    if [ -z "$integration_worktree" ]; then
        log_error "Usage: integration_get_conflicts <worktree_path>"
        return 1
    fi

    if [ ! -d "$integration_worktree" ]; then
        log_error "Worktree does not exist: ${integration_worktree}"
        return 1
    fi

    log_info "Gathering conflict information from ${integration_worktree}"

    # Get list of conflicted files
    local conflicted_files
    conflicted_files=$(git -C "$integration_worktree" diff --name-only --diff-filter=U 2>/dev/null | sort)

    if [ -z "$conflicted_files" ]; then
        log_warning "No conflicted files found"
        echo "[]"
        return 0
    fi

    # Build JSON array with conflict info
    local json_output="["
    local first=true

    while IFS= read -r file; do
        if [ ! "$first" = true ]; then
            json_output="${json_output},"
        fi
        first=false

        # Get diff output for both sides of conflict
        local diff_output
        diff_output=$(git -C "$integration_worktree" diff "$file" 2>/dev/null | jq -Rs '.')

        json_output="${json_output}{\"file\":$(echo "$file" | jq -Rs '.'),\"diff\":${diff_output}}"
    done <<< "$conflicted_files"

    json_output="${json_output}]"

    echo "$json_output" | jq '.'
}

#
# integration_create_pr(epic_key, integration_branch, summary)
# Pushes integration branch to remote
# Creates PR via gh pr create
# Returns PR URL
#
integration_create_pr() {
    local epic_key="$1"
    local integration_branch="$2"
    local summary="$3"

    if [ -z "$epic_key" ] || [ -z "$integration_branch" ] || [ -z "$summary" ]; then
        log_error "Usage: integration_create_pr <epic_key> <integration_branch> <summary>"
        return 1
    fi

    log_info "Pushing integration branch to remote"
    git push -u origin "$integration_branch" || {
        log_error "Failed to push integration branch"
        return 1
    }
    log_success "Pushed ${integration_branch} to origin"

    local pr_title="Ralph Swarm: ${epic_key} - ${summary}"
    local pr_body="Integration branch for epic ${epic_key}

## Status
- Created: $(date)

## Testing
See .ralph/swarm-state/logs/integration-tests.log for test results.
"

    log_info "Creating PR with title: ${pr_title}"

    local pr_url
    pr_url=$(gh pr create \
        --base main \
        --head "$integration_branch" \
        --title "$pr_title" \
        --body "$pr_body" 2>&1)

    if [ $? -ne 0 ]; then
        log_error "Failed to create PR"
        log_info "Response: ${pr_url}"
        return 1
    fi

    log_success "PR created: ${pr_url}"
    echo "$pr_url"
}

#
# integration_cleanup(epic_key)
# Removes the integration worktree
# Does NOT delete the branch (PR needs it)
#
integration_cleanup() {
    local epic_key="$1"

    if [ -z "$epic_key" ]; then
        log_error "Usage: integration_cleanup <epic_key>"
        return 1
    fi

    local integration_worktree="${PROJECT_ROOT}/.claude/worktrees/integration-${epic_key}"

    if [ ! -d "$integration_worktree" ]; then
        log_info "Worktree does not exist at ${integration_worktree}, nothing to clean"
        return 0
    fi

    log_info "Removing integration worktree: ${integration_worktree}"
    git worktree remove "$integration_worktree" || {
        log_error "Failed to remove worktree"
        return 1
    }
    log_success "Worktree removed"
}

#
# Self-test block (runs if script is executed directly, not sourced)
#
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    set -euo pipefail

    log_info "Running integration-branch.sh self-tests..."

    # Test setup: create a temporary test repo
    TEST_REPO="/tmp/test_integration_branch_$$"
    mkdir -p "$TEST_REPO"
    cd "$TEST_REPO"

    # Initialize test repo
    git init -q
    git config user.email "test@test.com"
    git config user.name "Test User"

    # Create main branch with initial commit
    echo "main content" > main.txt
    git add main.txt
    git commit -q -m "Initial commit on main"

    log_info "Test 1: integration_create"
    INTEGRATION_WT=$(integration_create "TEST-1" 2>&1 || true)
    if [ -d "$INTEGRATION_WT" ]; then
        log_success "  integration_create passed"
    else
        log_error "  integration_create failed"
        rm -rf "$TEST_REPO"
        exit 1
    fi

    log_info "Test 2: integration_abort_merge (setup: create agent branch with content)"
    git checkout -q -b agent/test-1
    echo "agent content" >> main.txt
    git add main.txt
    git commit -q -m "Agent changes"
    git checkout -q integration/TEST-1

    # Create a conflicting change in integration branch
    echo "integration conflict" > main.txt
    git add main.txt
    git commit -q -m "Integration changes"

    log_info "Test 2b: integration_merge_agent (should conflict)"
    if integration_merge_agent "$INTEGRATION_WT" "agent/test-1" >/dev/null 2>&1; then
        log_error "  Merge should have conflicted"
        rm -rf "$TEST_REPO"
        exit 1
    else
        log_info "  Merge conflict detected as expected"
    fi

    log_info "Test 2c: integration_abort_merge"
    if integration_abort_merge "$INTEGRATION_WT"; then
        log_success "  integration_abort_merge passed"
    else
        log_error "  integration_abort_merge failed"
        rm -rf "$TEST_REPO"
        exit 1
    fi

    log_info "Test 3: integration_get_conflicts (with no conflicts)"
    CONFLICTS=$(integration_get_conflicts "$INTEGRATION_WT" 2>&1)
    if [ "$CONFLICTS" = "[]" ]; then
        log_success "  integration_get_conflicts passed (empty array)"
    else
        log_error "  integration_get_conflicts returned: $CONFLICTS"
        rm -rf "$TEST_REPO"
        exit 1
    fi

    log_info "Test 4: integration_cleanup"
    if integration_cleanup "TEST-1"; then
        log_success "  integration_cleanup passed"
    else
        log_error "  integration_cleanup failed"
        rm -rf "$TEST_REPO"
        exit 1
    fi

    # Cleanup test repo
    cd /
    rm -rf "$TEST_REPO"

    log_success "All self-tests passed!"
fi
