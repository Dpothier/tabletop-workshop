#!/bin/bash

# Ralph Wiggum - JIRA Integration Script
# Syncs stories between JIRA and prd.json
#
# Usage:
#   jira-sync.sh pull <EPIC_KEY>      # JIRA -> prd.json
#   jira-sync.sh push                 # prd.json -> JIRA
#   jira-sync.sh start <ISSUE_KEY>    # Transition to In Progress
#   jira-sync.sh complete <ISSUE_KEY> # Transition to In Review
#   jira-sync.sh transitions <ISSUE_KEY> # List available transitions
#
# Environment Variables (required for JIRA operations):
#   JIRA_BASE_URL       (e.g., https://your-instance.atlassian.net)
#   JIRA_EMAIL          (your email address)
#   JIRA_API_TOKEN      (API token from https://id.atlassian.com/manage-profile/security/api-tokens)
#   JIRA_PROJECT_KEY    (e.g., PROJ, TW, etc.)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source config for paths
if [ ! -f "${PROJECT_ROOT}/.ralph/config.sh" ]; then
    echo "ERROR: config.sh not found"
    exit 1
fi
source "${PROJECT_ROOT}/.ralph/config.sh"

# Validate environment
validate_env() {
    local missing=0
    for var in JIRA_BASE_URL JIRA_EMAIL JIRA_API_TOKEN JIRA_PROJECT_KEY; do
        if [ -z "${!var:-}" ]; then
            log_error "Missing environment variable: $var"
            missing=1
        fi
    done
    if [ $missing -eq 1 ]; then
        return 1
    fi
    return 0
}

# Get base64 encoded auth
get_auth_header() {
    echo -n "${JIRA_EMAIL}:${JIRA_API_TOKEN}" | base64 -w0
}

# Make JIRA API call
jira_api_call() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"

    local url="${JIRA_BASE_URL}${endpoint}"
    local auth_header="$(get_auth_header)"

    local curl_opts=(
        -s
        -X "$method"
        -H "Authorization: Basic ${auth_header}"
        -H "Content-Type: application/json"
    )

    if [ -n "$data" ]; then
        curl_opts+=(-d "$data")
    fi

    curl "${curl_opts[@]}" "$url"
}

# Get available transitions for an issue
get_transitions() {
    local issue_key="$1"
    jira_api_call "GET" "/rest/api/3/issue/${issue_key}/transitions"
}

# Transition an issue
transition_issue() {
    local issue_key="$1"
    local transition_id="$2"

    local data="{\"transition\": {\"id\": \"${transition_id}\"}}"
    jira_api_call "POST" "/rest/api/3/issue/${issue_key}/transitions" "$data"
}

# Add label to issue
add_label() {
    local issue_key="$1"
    local label="$2"

    local data="{\"update\": {\"labels\": [{\"add\": \"${label}\"}]}}"
    jira_api_call "PUT" "/rest/api/3/issue/${issue_key}" "$data"
}

# Add comment to issue
add_comment() {
    local issue_key="$1"
    local comment="$2"

    local data="{\"body\": {\"version\": 1, \"type\": \"doc\", \"content\": [{\"type\": \"paragraph\", \"content\": [{\"type\": \"text\", \"text\": \"${comment}\"}]}]}}"
    jira_api_call "POST" "/rest/api/3/issue/${issue_key}/comment" "$data"
}

# Get transition ID by name
get_transition_id() {
    local issue_key="$1"
    local transition_name="$2"

    local transitions=$(get_transitions "$issue_key")
    echo "$transitions" | jq -r ".transitions[] | select(.name == \"${transition_name}\") | .id" | head -1
}

# Fetch issue details
get_issue() {
    local issue_key="$1"
    jira_api_call "GET" "/rest/api/3/issue/${issue_key}"
}

# Search JIRA for issues linked to epic
search_epic_issues() {
    local epic_key="$1"

    local jql="parent = ${epic_key} AND status = \"To Do\" ORDER BY priority DESC"
    local data="{\"jql\": $(echo "$jql" | jq -Rs .), \"maxResults\": 50, \"fields\": [\"summary\", \"status\", \"description\", \"issuetype\", \"priority\"]}"
    jira_api_call "POST" "/rest/api/3/search/jql" "$data"
}

# Extract acceptance criteria from description
extract_acceptance_criteria() {
    local description="$1"

    # Look for acceptance criteria section
    echo "$description" | grep -A 100 -i "acceptance criteria" | grep "^-" | sed 's/^- //' || echo ""
}

# Load existing prd.json to preserve pass status
load_existing_passes() {
    local issue_id="$1"

    if [ -f "$PRD_FILE" ]; then
        jq -r ".userStories[] | select(.id == \"${issue_id}\") | .passes // false" "$PRD_FILE" 2>/dev/null || echo "false"
    else
        echo "false"
    fi
}

# Pull stories from JIRA into prd.json
pull_from_jira() {
    local epic_key="$1"

    if [ -z "$epic_key" ]; then
        log_error "Epic key required: jira-sync.sh pull <EPIC_KEY>"
        return 1
    fi

    log_info "Pulling stories from JIRA epic ${epic_key}..."

    if ! validate_env; then
        log_error "Cannot pull from JIRA: missing environment variables"
        return 1
    fi

    # Fetch issues linked to epic
    local search_result
    search_result=$(search_epic_issues "$epic_key")

    # Check for errors
    if echo "$search_result" | jq -e '.errorMessages' >/dev/null 2>&1; then
        log_error "JIRA API error: $(echo "$search_result" | jq -r '.errorMessages[]')"
        return 1
    fi

    # Transform to prd.json format
    local branch_name="ralph/${epic_key}"

    local prd_json=$(jq \
        --arg epic_key "$epic_key" \
        --arg branch_name "$branch_name" \
        --arg project "$JIRA_PROJECT_KEY" \
        '{
            project: $project,
            epicKey: $epic_key,
            branchName: $branch_name,
            userStories: [
                .issues[] | {
                    id: .key,
                    title: .fields.summary,
                    description: (.fields.description.content[0].content[0].text // ""),
                    acceptanceCriteria: [],
                    priority: (if .fields.priority.name == "Highest" then 1 elif .fields.priority.name == "High" then 2 elif .fields.priority.name == "Medium" then 3 elif .fields.priority.name == "Low" then 4 else 5 end),
                    passes: false
                }
            ]
        }' \
        <<< "$search_result")

    # Merge with existing prd.json to preserve pass status
    if [ -f "$PRD_FILE" ]; then
        local old_passes
        old_passes=$(jq '.userStories | map({(.id): .passes}) | add // {}' "$PRD_FILE" 2>/dev/null || echo '{}')

        prd_json=$(echo "$prd_json" | jq \
            --argjson old_passes "$old_passes" \
            '.userStories |= map(. + {passes: ($old_passes[.id] // false)})' \
        )
    fi

    # Write prd.json
    echo "$prd_json" | jq '.' > "$PRD_FILE"
    log_success "Pulled $(echo "$prd_json" | jq '.userStories | length') stories from epic ${epic_key}"
    log_info "Updated: ${PRD_FILE}"
}

# Start a story (transition to In Progress and add Ralph label)
start_story() {
    local issue_key="$1"

    if [ -z "$issue_key" ]; then
        log_error "Issue key required: jira-sync.sh start <ISSUE_KEY>"
        return 1
    fi

    log_info "Starting story ${issue_key}..."

    if ! validate_env; then
        log_error "Cannot update JIRA: missing environment variables"
        return 1
    fi

    # Get transition ID for "In Progress"
    local transition_id
    transition_id=$(get_transition_id "$issue_key" "In Progress")

    if [ -z "$transition_id" ]; then
        log_error "Could not find 'In Progress' transition for ${issue_key}"
        log_info "Available transitions:"
        get_transitions "$issue_key" | jq '.transitions[] | "\(.id): \(.name)"'
        return 1
    fi

    # Transition issue
    transition_issue "$issue_key" "$transition_id" >/dev/null

    # Add Ralph label
    add_label "$issue_key" "Ralph" >/dev/null

    log_success "Started ${issue_key} (transitioned to In Progress, added Ralph label)"
}

# Complete a story (transition to In Review and add comment)
complete_story() {
    local issue_key="$1"

    if [ -z "$issue_key" ]; then
        log_error "Issue key required: jira-sync.sh complete <ISSUE_KEY>"
        return 1
    fi

    log_info "Completing story ${issue_key}..."

    if ! validate_env; then
        log_error "Cannot update JIRA: missing environment variables"
        return 1
    fi

    # Get transition ID for "In Review"
    local transition_id
    transition_id=$(get_transition_id "$issue_key" "In Review")

    if [ -z "$transition_id" ]; then
        log_error "Could not find 'In Review' transition for ${issue_key}"
        log_info "Available transitions:"
        get_transitions "$issue_key" | jq '.transitions[] | "\(.id): \(.name)"'
        return 1
    fi

    # Transition issue
    transition_issue "$issue_key" "$transition_id" >/dev/null

    # Add comment
    local comment="Completed by Ralph (automated TDD automation)"
    add_comment "$issue_key" "$comment" >/dev/null

    log_success "Completed ${issue_key} (transitioned to In Review, added comment)"
}

# Push story status back to JIRA
push_to_jira() {
    log_info "Pushing story status to JIRA..."

    if [ ! -f "$PRD_FILE" ]; then
        log_error "No prd.json found: ${PRD_FILE}"
        return 1
    fi

    if ! validate_env; then
        log_error "Cannot push to JIRA: missing environment variables"
        return 1
    fi

    local completed_count=0
    local total_count=0

    # Iterate through stories with passes: true
    while IFS= read -r story; do
        local issue_id
        local passes

        issue_id=$(echo "$story" | jq -r '.id')
        passes=$(echo "$story" | jq -r '.passes')

        total_count=$((total_count + 1))

        if [ "$passes" == "true" ]; then
            log_info "Completing story ${issue_id}..."
            if complete_story "$issue_id"; then
                completed_count=$((completed_count + 1))
            fi
        fi
    done < <(jq -c '.userStories[]' "$PRD_FILE")

    log_success "Pushed ${completed_count}/${total_count} completed stories to JIRA"
}

# Show available transitions for an issue (debugging)
show_transitions() {
    local issue_key="$1"

    if [ -z "$issue_key" ]; then
        log_error "Issue key required: jira-sync.sh transitions <ISSUE_KEY>"
        return 1
    fi

    if ! validate_env; then
        log_error "Cannot query JIRA: missing environment variables"
        return 1
    fi

    log_info "Available transitions for ${issue_key}:"
    get_transitions "$issue_key" | jq '.transitions[] | {id: .id, name: .name}'
}

# Main
main() {
    case "${1:-}" in
        pull)
            pull_from_jira "${2:-}"
            ;;
        push)
            push_to_jira
            ;;
        start)
            start_story "${2:-}"
            ;;
        complete)
            complete_story "${2:-}"
            ;;
        transitions)
            show_transitions "${2:-}"
            ;;
        status)
            log_info "JIRA Integration Status:"
            log_info "  Base URL: ${JIRA_BASE_URL:-not set}"
            log_info "  Project Key: ${JIRA_PROJECT_KEY:-not set}"
            log_info "  Email: ${JIRA_EMAIL:-not set}"
            [ -n "${JIRA_API_TOKEN:-}" ] && log_info "  API Token: *** (configured)" || log_info "  API Token: not set"
            ;;
        *)
            echo "Usage: $0 {pull|push|start|complete|transitions|status}"
            echo ""
            echo "Commands:"
            echo "  pull <EPIC_KEY>      - Sync stories from JIRA to prd.json"
            echo "  push                 - Sync story completion status to JIRA"
            echo "  start <ISSUE_KEY>    - Transition issue to In Progress + add Ralph label"
            echo "  complete <ISSUE_KEY> - Transition issue to In Review + add comment"
            echo "  transitions <ISSUE_KEY> - List available transitions (debugging)"
            echo "  status               - Show JIRA configuration status"
            echo ""
            echo "Environment Variables:"
            echo "  JIRA_BASE_URL       - JIRA instance URL"
            echo "  JIRA_EMAIL          - JIRA user email"
            echo "  JIRA_API_TOKEN      - JIRA API token"
            echo "  JIRA_PROJECT_KEY    - JIRA project key"
            exit 1
            ;;
    esac
}

main "$@"
