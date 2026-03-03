# Ralph Wiggum - Autonomous TDD Loop

Ralph is an autonomous test-driven development agent designed to execute continuous TDD iterations on the tabletop-workshop project. Named after everyone's favorite Simpsons character for his innocent, persistent, and sometimes chaotic approach to problem-solving.

## Overview

Ralph implements the TDD cycle automatically:
1. **RED**: Write failing tests
2. **GREEN**: Write minimal production code
3. **REFACTOR**: Improve code quality (optional)
4. **COMMIT**: Version control and progress tracking

## Structure

```
.ralph/
├── PROMPT.md       # Main instructions for each iteration (sent to Claude)
├── config.sh       # Configuration and environment setup
└── README.md       # This file

scripts/ralph/
├── ralph.sh        # Main loop script (orchestrates iterations)
└── jira-sync.sh    # JIRA integration template (optional)

prd.json           # Product requirements and story status
progress.txt       # Progress log from each iteration
```

## Quick Start

### 1. Initialize Your Stories

Add user stories to `prd.json`:

```json
{
  "project": "tabletop-workshop",
  "branchName": "ralph/current",
  "userStories": [
    {
      "id": "STORY-001",
      "title": "Implement action resolution system",
      "description": "As a player, I want actions to be resolved based on combat rules",
      "type": "unit",
      "passes": false
    },
    {
      "id": "STORY-002",
      "title": "Add E2E battle flow test",
      "description": "Verify complete battle sequence from start to end",
      "type": "e2e",
      "passes": false
    }
  ]
}
```

### 2. Make Scripts Executable

```bash
chmod +x scripts/ralph/ralph.sh
chmod +x scripts/ralph/jira-sync.sh
chmod +x .ralph/config.sh
```

### 3. Run Ralph

```bash
# Manual human-in-the-loop mode (max 5 iterations)
bash scripts/ralph/ralph.sh

# In Docker/container (AFK mode, max 50 iterations)
# Just run the script - it will auto-detect container environment
```

## Configuration

Edit `.ralph/config.sh` to customize:

```bash
# Max iterations
HITL_MAX_ITERATIONS=5          # Human-in-the-loop mode
AFK_MAX_ITERATIONS=50          # Away-from-keyboard (container) mode

# Behavior flags
REQUIRE_COMMIT_APPROVAL=false  # Ask user before git commits
REQUIRE_PHASE_APPROVAL=false   # Ask user before RED/GREEN phases
AUTO_FORMAT_ON_FAILURE=true    # Auto-fix formatting on test failures
AUTO_LINT_FIX_ON_FAILURE=true  # Auto-fix linting on test failures
```

## Story Format

Each story in `prd.json` should follow this schema:

```json
{
  "id": "STORY-001",           // Unique identifier
  "title": "Feature title",     // One-line summary
  "description": "Details...",  // Acceptance criteria and context
  "type": "unit|e2e",           // unit test or E2E test
  "passes": false               // true when complete
}
```

## Iteration Flow

1. Ralph reads `prd.json` and finds first story with `passes: false`
2. Invokes Claude with `.ralph/PROMPT.md` as system instructions
3. Claude delegates to specialized agents:
   - **unit-test-writer**: Create unit/integration tests
   - **code-writer**: Write production code
   - **architecture-reviewer**: Code quality review (optional)
   - **e2e-test-writer**: Create E2E tests
4. Tests are executed: `npm run test` (all tests must pass)
5. On success:
   - Code is validated: `npm run check`
   - Story committed: `git commit -m "feat: [STORY-ID] title"`
   - `prd.json` is updated: `passes: true`
   - Learnings appended to `progress.txt`
6. Loop continues to next story or exits if all complete

## Exit Codes

- `0`: All stories complete, output contains `<promise>COMPLETE</promise>`
- `1`: Reached max iterations without completion
- `2`: Configuration error (missing prd.json or files)

## Progress Tracking

### progress.txt

After each iteration, Ralph appends:

```
[ITERATION N] Story: STORY-ID
- Result: SUCCESS|FAILURE
- Duration: X minutes
- Notes: Key learnings, obstacles, or context

```

Review this file to understand what worked and what failed.

## JIRA Integration (Optional)

Configure JIRA sync for automatic story synchronization:

```bash
export JIRA_BASE_URL="https://your-instance.atlassian.net"
export JIRA_EMAIL="your-email@example.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT_KEY="TW"

# Pull stories from JIRA
bash scripts/ralph/jira-sync.sh pull

# After running Ralph and completing stories, push status back
bash scripts/ralph/jira-sync.sh push

# Check configuration
bash scripts/ralph/jira-sync.sh status
```

## Modes

### HITL (Human-In-The-Loop)
- Default when running locally
- Max 5 iterations per session
- Useful for interactive development and debugging
- User can pause and provide feedback between iterations

### AFK (Away-From-Keyboard)
- Auto-detected in Docker containers (/.dockerenv exists)
- Max 50 iterations per session
- Runs until all stories complete or max iterations reached
- Useful for CI/CD pipelines and overnight runs

## Troubleshooting

### Ralph stops in the middle
Check `progress.txt` for the error log. Common issues:
- Test written but not properly formatted
- Code doesn't compile (TypeScript errors)
- Missing dependencies
- Linting or formatting issues

Ralph will attempt to auto-fix formatting/linting on next iteration if configured.

### Stories not marked complete
Ensure:
1. `prd.json` has valid JSON syntax (use `jq` to validate)
2. All tests pass: `npm run test`
3. Code checks pass: `npm run check`
4. Git commit succeeds

### JIRA sync not working
Verify:
1. Environment variables are set
2. API token is valid (tokens expire after 12 months)
3. Project key matches JIRA exactly
4. User has permission to view/update stories

## Tips

1. **Start small**: Test with 1-2 stories before adding many
2. **Clear requirements**: More detailed story descriptions = better test results
3. **Monitor progress**: Check `progress.txt` and git log between runs
4. **Container testing**: Test locally first before running in AFK mode
5. **Error recovery**: Ralph will retry failed stories on next iteration

## See Also

- `CLAUDE.md` - Project guidelines and agent specifications
- `npm run check` - Type check, lint, and format validation
- `npm run test` - Run all tests (unit + E2E)
- `npm run test:unit` - Run unit tests only
- `npm run test:e2e` - Run E2E tests only

## Notes

Ralph is named after Ralph Wiggum from The Simpsons for his characteristic blend of:
- Relentless persistence ("I'm in danger!")
- Innocent optimism despite setbacks
- Tendency to repeat tasks until success
- Unpredictable but ultimately functional outcomes

May your TDD journey be as eventful as Ralph's adventures.
