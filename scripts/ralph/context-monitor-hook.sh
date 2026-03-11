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

# Extract transcript path and tool name
TRANSCRIPT_PATH=$(echo "$json_input" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")
TOOL_NAME=$(echo "$json_input" | jq -r '.tool_name // empty' 2>/dev/null || echo "")
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
    # At critical level, only allow tools needed to save progress and commit
    case "$TOOL_NAME" in
        Write|Edit)
            # Only allow writing to progress.txt
            TARGET_FILE=$(echo "$json_input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")
            if [[ "$TARGET_FILE" == *"progress.txt" ]]; then
                echo "{\"decision\":\"approve\",\"reason\":\"🚨 Context at ${PCT}%! Save progress then commit and output <promise>COMPLETE</promise>.\"}"
            else
                echo "{\"decision\":\"block\",\"reason\":\"🚨 Context at ${PCT}%! BLOCKED — only progress.txt writes allowed. Save progress, commit (git add + git commit via Bash), then output <promise>COMPLETE</promise>.\"}"
            fi
            ;;
        Bash)
            # Allow git commands only (commit, add, push, status, diff, log)
            BASH_CMD=$(echo "$json_input" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")
            if [[ "$BASH_CMD" == git\ * ]]; then
                echo "{\"decision\":\"approve\",\"reason\":\"🚨 Context at ${PCT}%! Commit then output <promise>COMPLETE</promise>.\"}"
            else
                echo "{\"decision\":\"block\",\"reason\":\"🚨 Context at ${PCT}%! BLOCKED — only git commands allowed. Commit your work, then output <promise>COMPLETE</promise>.\"}"
            fi
            ;;
        Read|Glob|Grep)
            # Allow read-only tools (low cost)
            echo "{\"decision\":\"approve\",\"reason\":\"🚨 Context at ${PCT}%! Wrap up NOW. Save progress, commit, output <promise>COMPLETE</promise>.\"}"
            ;;
        *)
            # Block everything else (Agent, WebSearch, etc.)
            echo "{\"decision\":\"block\",\"reason\":\"🚨 Context at ${PCT}%! BLOCKED. Save progress to progress.txt, commit with git, then output <promise>COMPLETE</promise>. The outer loop will start a fresh session.\"}"
            ;;
    esac
elif [ "$PCT" -ge "$WARN_PCT" ]; then
    echo "{\"decision\":\"approve\",\"reason\":\"⚠️ Context at ${PCT}%. Finish current story then stop. Save progress to progress.txt, commit completed work, and output <promise>COMPLETE</promise>.\"}"
fi

exit 0
