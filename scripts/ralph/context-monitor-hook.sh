#!/bin/bash

# Ralph Wiggum - Context Monitor Hook (PreToolUse)
# Reads session transcript JSONL, calculates context window usage %,
# warns when approaching capacity so Claude saves progress and wraps up.

# Only activate in Ralph sessions
if [ "${RALPH_MODE:-}" != "true" ]; then
    exit 0
fi

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

CONFIG_FILE="${PROJECT_ROOT}/.ralph/config.sh"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

WARN_PCT="${CONTEXT_WARN_PCT:-70}"
CRITICAL_PCT="${CONTEXT_CRITICAL_PCT:-85}"
WINDOW_SIZE="${CONTEXT_WINDOW_SIZE:-200000}"
CACHE_FILE="${PROJECT_ROOT}/.ralph/.context_pct"

# ============================================================================
# Parse JSON input from stdin
# ============================================================================

json_input=$(cat) || json_input=""
if [ -z "$json_input" ]; then
    exit 0
fi

# Extract transcript path
TRANSCRIPT_PATH=$(echo "$json_input" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
    exit 0
fi

# ============================================================================
# Cache check - skip if last check was <5 seconds ago
# ============================================================================

if [ -f "$CACHE_FILE" ]; then
    CACHE_MTIME=$(stat -c %Y "$CACHE_FILE" 2>/dev/null || echo "0")
    NOW=$(date +%s)
    ELAPSED=$(( NOW - CACHE_MTIME ))
    if [ "$ELAPSED" -lt 5 ]; then
        # Use cached value
        CACHED_PCT=$(cat "$CACHE_FILE" 2>/dev/null || echo "0")
        PCT="$CACHED_PCT"
    else
        PCT=""
    fi
else
    PCT=""
fi

# ============================================================================
# Calculate context usage from transcript JSONL
# ============================================================================

if [ -z "$PCT" ]; then
    # Find the last assistant message and extract usage tokens
    # Use tac to read from end, grep for assistant type, take first match
    USAGE_LINE=$(tac "$TRANSCRIPT_PATH" 2>/dev/null \
        | grep -m 1 '"type":"assistant"' \
        || tac "$TRANSCRIPT_PATH" 2>/dev/null \
        | grep -m 1 '"type": "assistant"' \
        || echo "")

    if [ -z "$USAGE_LINE" ]; then
        exit 0
    fi

    # Extract token counts from usage object
    TOTAL_TOKENS=$(echo "$USAGE_LINE" | jq '
        .message.usage // .usage // {} |
        (.input_tokens // 0) + (.cache_creation_input_tokens // 0) + (.cache_read_input_tokens // 0)
    ' 2>/dev/null || echo "0")

    if [ "$TOTAL_TOKENS" = "0" ] || [ "$TOTAL_TOKENS" = "null" ]; then
        exit 0
    fi

    PCT=$(( TOTAL_TOKENS * 100 / WINDOW_SIZE ))

    # Cache the result
    mkdir -p "$(dirname "$CACHE_FILE")"
    echo "$PCT" > "$CACHE_FILE"
fi

# ============================================================================
# Emit warnings based on thresholds
# ============================================================================

if [ "$PCT" -ge "$CRITICAL_PCT" ]; then
    echo "{\"decision\":\"approve\",\"reason\":\"🚨 Context at ${PCT}%! Save progress to progress.txt NOW. Commit work and stop.\"}"
elif [ "$PCT" -ge "$WARN_PCT" ]; then
    echo "{\"decision\":\"approve\",\"reason\":\"⚠️ Context at ${PCT}%. Start wrapping up: save progress to progress.txt, commit completed work.\"}"
fi

exit 0
