# Ralph Wiggum Autonomous TDD Loop - START HERE

Welcome! Ralph Wiggum is your autonomous TDD agent. He will write tests, write code, and commit your stories—all automatically.

## What Just Happened?

Ralph's infrastructure has been created in your project:

```
✓ .ralph/          - Configuration and documentation
✓ scripts/ralph/   - Executable scripts
✓ prd.json        - Story database (empty, ready for stories)
✓ progress.txt    - Progress tracking (auto-updated)
```

## Before You Run Ralph

Make scripts executable (ONE TIME ONLY):

```bash
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/scripts/ralph/ralph.sh
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/scripts/ralph/jira-sync.sh
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/.ralph/config.sh
```

Or from project root:

```bash
chmod +x scripts/ralph/*.sh .ralph/config.sh
```

Verify:

```bash
ls -la scripts/ralph/ralph.sh  # Should show -rwx------
```

## How to Get Started (3 Steps)

### Step 1: Add Your Stories

Copy example stories:

```bash
cd /home/dominique/git/tabletop-workshop/workshop-1
cp .ralph/EXAMPLE.json prd.json
```

Or create your own:

```json
{
  "project": "tabletop-workshop",
  "branchName": "ralph/current",
  "userStories": [
    {
      "id": "STORY-001",
      "title": "My first feature",
      "description": "What it should do and how to test it",
      "type": "unit",
      "passes": false
    }
  ]
}
```

### Step 2: Run Ralph

```bash
bash scripts/ralph/ralph.sh
```

Ralph will:
1. Read your stories from `prd.json`
2. Find the first incomplete story
3. Call Claude with instructions to write tests and code
4. Run tests to verify everything works
5. Commit changes and mark story `passes: true`
6. Move to next story

### Step 3: Watch Progress

Check progress log:

```bash
tail -30 progress.txt
```

Or view story status:

```bash
jq '.userStories[] | {id, title, passes}' prd.json
```

## What Ralph Does

For each story:

1. **RED**: Writes failing unit tests or E2E tests
2. **GREEN**: Writes minimal production code to pass tests
3. **REFACTOR**: Improves code if needed
4. **VERIFY**: Runs all checks (`npm run check && npm run test`)
5. **ACCEPT**: Validates implementation matches all story acceptance criteria
6. **COMMIT**: Git commits the story implementation
7. **LOOP**: Repeats for next story

All with your TDD workflow intact!

## Key Files

| File | Purpose | Edit? |
|------|---------|-------|
| `prd.json` | Your stories | YES - add stories here |
| `progress.txt` | What happened | NO - read only |
| `.ralph/config.sh` | Settings | YES - customize behavior |
| `scripts/ralph/ralph.sh` | Main loop | NO - Ralph's engine |
| `.ralph/PROMPT.md` | Claude instructions | NO - core logic |

## Documentation (Read in Order)

1. **`.ralph/QUICKSTART.md`** (5 min)
   - Get running in 5 minutes
   - Common commands

2. **`.ralph/README.md`** (15-30 min)
   - Full documentation
   - All features explained
   - Best practices

3. **`.ralph/SETUP.md`** (10 min)
   - Detailed setup guide
   - Troubleshooting

4. **`.ralph/INDEX.md`** (reference)
   - File navigation
   - Decision trees
   - Quick reference

5. **`.ralph/CI-CD.md`** (if using CI/CD)
   - GitHub Actions
   - GitLab CI
   - Jenkins examples

## Examples

### Example 1: Single Story

```bash
# Add one story to prd.json
{
  "id": "STORY-001",
  "title": "Initialize state",
  "description": "Create a basic state class",
  "type": "unit",
  "passes": false
}

# Run Ralph
bash scripts/ralph/ralph.sh

# Ralph will write test → write code → commit → mark complete
```

### Example 2: Multiple Stories (Marathon)

```bash
# Copy example stories (5 stories)
cp .ralph/EXAMPLE.json prd.json

# Edit config for more iterations
# .ralph/config.sh: MAX_ITERATIONS=10

# Run Ralph - will keep going for all stories
bash scripts/ralph/ralph.sh

# Check progress
tail -50 progress.txt
```

### Example 3: Continuous Integration

```bash
# Setup (once)
export JIRA_BASE_URL="https://your-jira.com"
export JIRA_EMAIL="your@email.com"
export JIRA_API_TOKEN="token"
export JIRA_PROJECT_KEY="TW"

# Pull stories from JIRA
bash scripts/ralph/jira-sync.sh pull

# Run Ralph
bash scripts/ralph/ralph.sh

# Push results back
bash scripts/ralph/jira-sync.sh push
```

## Common Commands

```bash
# Make scripts executable (do this first!)
chmod +x scripts/ralph/*.sh .ralph/config.sh

# Copy example stories
cp .ralph/EXAMPLE.json prd.json

# Run Ralph (the main command)
bash scripts/ralph/ralph.sh

# Check progress
tail progress.txt

# View stories and their status
jq '.userStories[] | {id, title, passes}' prd.json

# Count completed stories
jq '[.userStories[] | select(.passes == true)] | length' prd.json

# Validate prd.json
jq . prd.json && echo "✓ Valid"

# Check Ralph configuration
bash .ralph/config.sh
```

## Modes

### Automated Mode
- Max 50 iterations by default
- Runs until all stories complete or timeout
- Use for CI/CD pipelines and overnight runs
- Configurable via `MAX_ITERATIONS`

## Story Requirements

Each story MUST have:

```json
{
  "id": "STORY-001",           // Unique ID
  "title": "Feature name",     // One line
  "description": "...",        // Acceptance criteria
  "type": "unit",              // "unit" or "e2e"
  "passes": false              // false until complete
}
```

The `description` is most important - it tells Claude what to test and code!

## Success Indicators

Ralph is working when:

- ✓ Stories move from `passes: false` to `passes: true`
- ✓ `progress.txt` shows completed iterations
- ✓ Git history has commits like "feat: [STORY-001] title"
- ✓ `npm run test` passes after each iteration
- ✓ New test files appear in `features/`
- ✓ New code appears in `src/`

## Troubleshooting

### Scripts won't run
```bash
chmod +x scripts/ralph/*.sh .ralph/config.sh
```

### "prd.json not found"
```bash
cp .ralph/EXAMPLE.json prd.json
```

### Tests failing
Check manually:
```bash
npm run test:unit
npm run test:e2e
```

### Ralph stops unexpectedly
Check error log:
```bash
tail -50 progress.txt
```

### More help?
Read `.ralph/SETUP.md` - Common Issues section

## Next Actions

1. **Right now** (2 minutes):
   ```bash
   chmod +x scripts/ralph/*.sh .ralph/config.sh
   cp .ralph/EXAMPLE.json prd.json
   ```

2. **Then** (1 minute):
   ```bash
   bash scripts/ralph/ralph.sh
   ```

3. **After it runs** (immediate):
   ```bash
   tail progress.txt
   jq '.userStories[] | {id, title, passes}' prd.json
   ```

4. **For more info**:
   - `.ralph/QUICKSTART.md` - Get going fast
   - `.ralph/README.md` - Full documentation
   - `.ralph/INDEX.md` - Navigation guide

## The Ralph Wiggum Story

Ralph Wiggum from The Simpsons is:
- Relentlessly persistent ("I'm in danger!")
- Optimistic despite setbacks
- Tends to repeat actions until success
- Unpredictable but ultimately functional

Named after him because autonomous TDD is similar:
- Keep writing tests and code
- Keep running them
- Keep committing progress
- Eventually, everything works!

## Ready?

```bash
chmod +x scripts/ralph/*.sh .ralph/config.sh
cp .ralph/EXAMPLE.json prd.json
bash scripts/ralph/ralph.sh
```

Check `progress.txt` when done. Good luck!

---

**Questions?** Read `.ralph/INDEX.md` for file navigation, or `.ralph/README.md` for full docs.

**Issues?** Check `.ralph/SETUP.md` for troubleshooting.

**Want customization?** Edit `.ralph/config.sh`.

**Using JIRA?** Read `.ralph/README.md` - JIRA Integration section.

**Setting up CI/CD?** Read `.ralph/CI-CD.md`.
