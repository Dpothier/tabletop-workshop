# Ralph Wiggum - Quick Start Guide

Get Ralph running in 5 minutes.

## 1. Make Scripts Executable

```bash
chmod +x scripts/ralph/ralph.sh
chmod +x scripts/ralph/jira-sync.sh
chmod +x .ralph/config.sh
```

## 2. Create Your Stories

Copy example to prd.json:

```bash
cp .ralph/EXAMPLE.json prd.json
# Or create minimal:
cat > prd.json << 'EOF'
{
  "project": "tabletop-workshop",
  "branchName": "ralph/current",
  "userStories": [
    {
      "id": "STORY-001",
      "title": "Your first feature",
      "description": "What it should do",
      "type": "unit",
      "passes": false
    }
  ]
}
EOF
```

## 3. Run Ralph

```bash
# Local mode (up to 5 iterations)
bash scripts/ralph/ralph.sh

# Check progress
tail -20 progress.txt
```

## 4. Watch It Work

Ralph will:
1. Read prd.json
2. Find first incomplete story
3. Call Claude with `.ralph/PROMPT.md`
4. Run tests: `npm run test`
5. On success: commit and mark `passes: true`
6. Loop to next story

## Key Files

| File | Purpose |
|------|---------|
| `prd.json` | Your stories (add here) |
| `progress.txt` | Log of what happened |
| `.ralph/PROMPT.md` | Instructions for Claude |
| `.ralph/config.sh` | Settings (iterations, etc) |
| `scripts/ralph/ralph.sh` | Main loop |

## Story Template

```json
{
  "id": "STORY-001",
  "title": "Brief description",
  "description": "Detailed requirements and acceptance criteria",
  "type": "unit",
  "passes": false
}
```

Types: `unit` (unit/integration tests) or `e2e` (end-to-end tests)

## Common Commands

```bash
# Check if prd.json is valid
jq . prd.json

# Count stories
jq '.userStories | length' prd.json

# See completed count
jq '[.userStories[] | select(.passes == true)] | length' prd.json

# View last 10 iterations
tail -30 progress.txt

# Test one story manually
npm run test:unit -- --grep "your test name"

# Format code before running Ralph
npm run format && npm run lint:fix
```

## Troubleshooting

### Ralph stops after first iteration
Check `progress.txt` for error. Usually:
- Tests failing
- Lint/format issues
- Missing dependencies

Run: `npm run check && npm run test`

### All stories marked complete but Ralph exits
Ralph detects completion automatically - this is good!
Remove `passes: true` from prd.json to continue with more stories.

### JIRA sync errors
Skip JIRA for now. Start simple with prd.json only.

## Configuration Quick Tips

Edit `.ralph/config.sh`:

```bash
# Change max iterations (default 50)
MAX_ITERATIONS=10

# Auto-fix linting on retry
AUTO_LINT_FIX_ON_FAILURE=true

# Auto-fix formatting on retry
AUTO_FORMAT_ON_FAILURE=true
```

## Next Steps

1. Read `.ralph/README.md` for full documentation
2. Check `.ralph/EXAMPLE.json` for story examples
3. Review `CLAUDE.md` to understand agent delegation
4. Run with a single test story to learn the flow

## Success Criteria

Ralph is working when:
- Stories move from `passes: false` to `passes: true`
- Git history shows commits with story IDs
- `progress.txt` shows completed iterations
- All tests pass: `npm run test`

## Need Help?

- `.ralph/README.md` - Full documentation
- `.ralph/PROMPT.md` - What Claude does
- `progress.txt` - What happened (check for errors)
- `npm run test` - Debug failing tests manually

Start small, add stories one at a time, watch progress in `progress.txt`.

Good luck!
