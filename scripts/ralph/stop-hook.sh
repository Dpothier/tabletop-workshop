#!/bin/bash

# Ralph Wiggum - Stop Hook
# Intercepts Claude Code session exit and re-injects prompt if work remains
# Receives JSON on stdin: {session_id, transcript_path, cwd, stop_hook_active, last_assistant_message}

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

# Set PROJECT_ROOT (two levels up from scripts/ralph/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source configuration
CONFIG_FILE="${PROJECT_ROOT}/.ralph/config.sh"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Config file not found at $CONFIG_FILE" >&2
    exit 0  # Allow stop if config missing
fi

source "$CONFIG_FILE"

# Ralph-specific state files
ITERATION_COUNT_FILE="${RALPH_DIR}/.iteration_count"
PROMPT_FILE="${RALPH_DIR}/PROMPT.md"

# ============================================================================
# Logging to stderr (doesn't affect Claude)
# ============================================================================

log_to_stderr() {
    echo "[STOP-HOOK] $1" >&2
}

# ============================================================================
# Parse JSON input from stdin
# ============================================================================

json_input=$(cat) || json_input=""
if [ -z "$json_input" ]; then
    log_to_stderr "No input received - allowing stop"
    exit 0
fi

# Only activate in Ralph sessions
if [ "${RALPH_MODE:-}" != "true" ]; then
    log_to_stderr "Not a Ralph session (RALPH_MODE not set) - allowing stop"
    exit 0
fi

log_to_stderr "Received input (${#json_input} bytes)"

# Extract fields using jq
SESSION_ID=$(echo "$json_input" | jq -r '.session_id // empty' 2>/dev/null || echo "")
TRANSCRIPT_PATH=$(echo "$json_input" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")
CWD=$(echo "$json_input" | jq -r '.cwd // empty' 2>/dev/null || echo "")
STOP_HOOK_ACTIVE=$(echo "$json_input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo "false")
LAST_ASSISTANT_MESSAGE=$(echo "$json_input" | jq -r '.last_assistant_message // empty' 2>/dev/null || echo "")

log_to_stderr "stop_hook_active=$STOP_HOOK_ACTIVE"
log_to_stderr "session_id=$SESSION_ID"

# ============================================================================
# Check for COMPLETE promise
# ============================================================================

if echo "$LAST_ASSISTANT_MESSAGE" | grep -q '<promise>COMPLETE</promise>'; then
    log_to_stderr "COMPLETE promise found in assistant message - allowing stop"
    exit 0
fi

# ============================================================================
# Check if already in a continuation (prevent infinite loops)
# ============================================================================

if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
    log_to_stderr "stop_hook_active is true - Claude already continued from previous stop hook"

    # Read current iteration count
    CURRENT_ITERATION=0
    if [ -f "$ITERATION_COUNT_FILE" ]; then
        CURRENT_ITERATION=$(cat "$ITERATION_COUNT_FILE" 2>/dev/null || echo "0")
    fi

    log_to_stderr "Current iteration count: $CURRENT_ITERATION"
    log_to_stderr "Max iterations: $MAX_ITERATIONS"

    # If we've already blocked once and Claude is trying to stop again, allow it
    if [ "$CURRENT_ITERATION" -gt 0 ]; then
        log_to_stderr "Already continued once (iteration=$CURRENT_ITERATION) - allowing stop to prevent infinite loop"
        exit 0
    fi
fi

# ============================================================================
# Read PRD and find first incomplete story
# ============================================================================

if [ ! -f "$PRD_FILE" ]; then
    log_to_stderr "PRD file not found at $PRD_FILE - allowing stop"
    exit 0
fi

# Extract first story with passes: false
INCOMPLETE_STORY=$(jq '[.userStories[] | select(.passes == false)] | first // empty' "$PRD_FILE" 2>/dev/null || echo "")

if [ -z "$INCOMPLETE_STORY" ]; then
    log_to_stderr "No incomplete stories found in PRD - allowing stop"
    exit 0
fi

log_to_stderr "Found incomplete story: $INCOMPLETE_STORY"

# Extract story details
STORY_ID=$(echo "$INCOMPLETE_STORY" | jq -r '.id // "UNKNOWN"' 2>/dev/null || echo "UNKNOWN")
STORY_TITLE=$(echo "$INCOMPLETE_STORY" | jq -r '.title // ""' 2>/dev/null || echo "")
STORY_DESCRIPTION=$(echo "$INCOMPLETE_STORY" | jq -r '.description // ""' 2>/dev/null || echo "")
STORY_TYPE=$(echo "$INCOMPLETE_STORY" | jq -r '.type // "unit"' 2>/dev/null || echo "unit")

log_to_stderr "Story ID: $STORY_ID, Type: $STORY_TYPE"

# ============================================================================
# Check iteration count and increment
# ============================================================================

CURRENT_ITERATION=0
if [ -f "$ITERATION_COUNT_FILE" ]; then
    CURRENT_ITERATION=$(cat "$ITERATION_COUNT_FILE" 2>/dev/null || echo "0")
fi

NEXT_ITERATION=$((CURRENT_ITERATION + 1))
echo "$NEXT_ITERATION" > "$ITERATION_COUNT_FILE"

log_to_stderr "Iteration count: $CURRENT_ITERATION -> $NEXT_ITERATION (max: $MAX_ITERATIONS)"

# If exceeded max iterations, allow stop
if [ "$NEXT_ITERATION" -gt "$MAX_ITERATIONS" ]; then
    log_to_stderr "Max iterations ($MAX_ITERATIONS) exceeded - allowing stop"
    exit 0
fi

# ============================================================================
# Build context message for re-injection
# ============================================================================

CONTEXT_MESSAGE=""

# Add PROMPT content
if [ -f "$PROMPT_FILE" ]; then
    CONTEXT_MESSAGE+="## Ralph Wiggum Prompt
"
    CONTEXT_MESSAGE+="$(cat "$PROMPT_FILE")"
    CONTEXT_MESSAGE+="

---

"
fi

# Add current story details
CONTEXT_MESSAGE+="## Current Story

Story ID: $STORY_ID
Title: $STORY_TITLE
Type: $STORY_TYPE
Description: $STORY_DESCRIPTION

---

"

# Add recent progress entries (last 20 lines)
if [ -f "$PROGRESS_FILE" ]; then
    PROGRESS_CONTENT=$(tail -n 20 "$PROGRESS_FILE" 2>/dev/null || echo "(no progress yet)")
    CONTEXT_MESSAGE+="## Recent Progress (Last 20 lines)

\`\`\`
${PROGRESS_CONTENT}
\`\`\`

---

"
fi

# Add test status hint
CONTEXT_MESSAGE+="## Next Steps

Continue executing the Ralph Wiggum autonomous TDD loop:
1. Write a failing test for story $STORY_ID ($STORY_TYPE test)
2. Write minimal production code to make it pass
3. Run all tests to verify
4. Commit and continue to next story

Current iteration: $NEXT_ITERATION/$MAX_ITERATIONS
"

log_to_stderr "Context message length: ${#CONTEXT_MESSAGE}"

# ============================================================================
# Output block decision with context
# ============================================================================

# Escape the context message for JSON
REASON_JSON=$(echo "$CONTEXT_MESSAGE" | jq -Rs .)

RESPONSE="{\"decision\": \"block\", \"reason\": $REASON_JSON}"

echo "$RESPONSE"
log_to_stderr "Blocking session stop - re-injecting prompt for $STORY_ID (iteration $NEXT_ITERATION/$MAX_ITERATIONS)"

exit 0
