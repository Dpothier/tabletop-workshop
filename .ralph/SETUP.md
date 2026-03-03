# Ralph Wiggum - Setup & Initialization

Complete setup guide for the autonomous TDD loop.

## What Was Created

The Ralph Wiggum autonomous loop structure has been initialized with the following files:

### Core Files

```
.ralph/
├── PROMPT.md           # Main instructions for Claude (each iteration)
├── config.sh           # Configuration (iterations, behavior flags)
├── README.md           # Full documentation
├── QUICKSTART.md       # 5-minute setup guide
├── SETUP.md            # This file
├── EXAMPLE.json        # Example stories to copy from
└── CI-CD.md            # Integration with CI/CD systems

scripts/ralph/
├── ralph.sh            # Main loop orchestrator
└── jira-sync.sh        # JIRA integration template

prd.json               # Product requirements (stories go here)
progress.txt           # Progress log (auto-updated)
```

## Initialization Steps

### Step 1: Make Scripts Executable

**IMPORTANT**: The following scripts need execute permissions:

```bash
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/scripts/ralph/ralph.sh
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/scripts/ralph/jira-sync.sh
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/.ralph/config.sh
```

Or from the project root:

```bash
chmod +x scripts/ralph/*.sh .ralph/config.sh
```

Verify:

```bash
ls -la scripts/ralph/
ls -la .ralph/config.sh
```

Both should show `rwx------` or `rwxr-xr-x` permissions.

### Step 2: Add Your First Stories

Option A: Use the example (recommended for first run):

```bash
cp .ralph/EXAMPLE.json prd.json
```

This provides 5 example stories to learn with.

Option B: Create minimal prd.json:

```json
{
  "project": "tabletop-workshop",
  "branchName": "ralph/current",
  "userStories": [
    {
      "id": "STORY-001",
      "title": "My first automated story",
      "description": "What the feature should do and how to test it",
      "type": "unit",
      "passes": false
    }
  ]
}
```

Option C: Bring stories from JIRA (requires setup):

```bash
export JIRA_BASE_URL="https://your-instance.atlassian.net"
export JIRA_EMAIL="your@email.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT_KEY="TW"

bash scripts/ralph/jira-sync.sh pull
```

### Step 3: Verify Setup

Check all prerequisites:

```bash
# 1. prd.json exists and is valid JSON
jq . prd.json && echo "prd.json OK"

# 2. progress.txt exists
[ -f progress.txt ] && echo "progress.txt OK"

# 3. Scripts are executable
[ -x scripts/ralph/ralph.sh ] && echo "ralph.sh OK"
[ -x .ralph/config.sh ] && echo "config.sh OK"

# 4. All npm dependencies installed
npm ls > /dev/null 2>&1 && echo "npm OK"

# 5. TypeScript compiles
npm run typecheck && echo "TypeScript OK"
```

Or run all at once:

```bash
bash .ralph/config.sh  # Sources the config to verify it works
```

### Step 4: Test Ralph Locally

Start with a dry run (doesn't commit, doesn't update prd.json):

```bash
DRY_RUN=true bash scripts/ralph/ralph.sh
```

Or run one iteration manually:

```bash
# HITL mode (Human-in-the-loop)
bash scripts/ralph/ralph.sh
```

This will:
1. Load prd.json
2. Find first incomplete story
3. Log iteration info
4. Ask for Claude invocation

### Step 5: Run the Full Loop

Once comfortable, run Ralph normally:

```bash
bash scripts/ralph/ralph.sh
```

Ralph will continue until:
- All stories complete, OR
- Max iterations reached (5 for HITL, 50 for AFK)

## Configuration Reference

### Main Configuration File: .ralph/config.sh

Key settings:

```bash
# Iterations
HITL_MAX_ITERATIONS=5          # Max per human-in-the-loop session
AFK_MAX_ITERATIONS=50          # Max per automated session

# Behavior
REQUIRE_COMMIT_APPROVAL=false  # Ask before git commits
REQUIRE_PHASE_APPROVAL=false   # Ask before each phase
AUTO_FORMAT_ON_FAILURE=true    # Auto-fix formatting
AUTO_LINT_FIX_ON_FAILURE=true  # Auto-fix linting

# Paths (auto-detected)
PROJECT_ROOT="/home/dominique/git/tabletop-workshop/workshop-1"
PRD_FILE="${PROJECT_ROOT}/prd.json"
PROGRESS_FILE="${PROJECT_ROOT}/progress.txt"
```

Edit to customize behavior.

## Story Schema

Each story in `prd.json` requires:

```json
{
  "id": "STORY-001",              // Required: unique identifier
  "title": "Feature name",         // Required: one-line summary
  "description": "Details",        // Required: acceptance criteria
  "type": "unit",                  // Required: "unit" or "e2e"
  "passes": false,                 // Required: false initially
  "estimatedPoints": 5,            // Optional: story points
  "assignee": "ralph",             // Optional: who's working on it
  "tags": ["feature", "ui"]        // Optional: categorization
}
```

Field Descriptions:
- `id`: Unique identifier (STORY-001, STORY-002, etc)
- `title`: Brief description (shown in logs)
- `description`: Detailed requirements for Claude
- `type`:
  - `"unit"`: Unit/integration tests in `features/unit/`
  - `"e2e"`: End-to-end tests in `features/e2e/`
- `passes`:
  - `false`: Not yet completed
  - `true`: Story is done (auto-set by Ralph)
- Additional fields are optional but helpful for tracking

## TDD Cycle Overview

What Ralph does for each story:

```
1. RED phase (unit-test-writer)
   → Create test file in features/unit/ or features/e2e/
   → Create step file in tests/steps/ or tests/e2e/steps/
   → Run tests: npm run test
   → Verify FAILS

2. GREEN phase (code-writer)
   → Write minimal code in src/
   → Run tests: npm run test
   → Verify PASSES

3. REFACTOR phase (architecture-reviewer, optional)
   → Review code quality
   → Apply approved improvements

4. VERIFY phase
   → Run: npm run check (typecheck, lint, format)
   → Run: npm run test (all tests)
   → Verify all pass

5. COMMIT phase
   → git commit -m "feat: [STORY-ID] title"
   → Update prd.json: passes: true
   → Append to progress.txt

6. Loop to next story
```

## Environment Variables

Ralph respects these environment variables:

```bash
# Debugging
DEBUG=true               # Enable verbose logging
DRY_RUN=true            # Don't commit, don't update prd.json
SKIP_COMMIT=true        # Skip git commit (still update prd.json)

# Git
GIT_AUTHOR_NAME="Ralph" # Commit author name
GIT_AUTHOR_EMAIL="ralph@bot.local"

# JIRA (optional)
JIRA_BASE_URL="https://..."
JIRA_EMAIL="user@example.com"
JIRA_API_TOKEN="token"
JIRA_PROJECT_KEY="TW"
```

## File Structure After Setup

```
workshop-1/
├── .ralph/                     # Ralph Wiggum configuration
│   ├── PROMPT.md               # System prompt for Claude
│   ├── config.sh               # Configuration
│   ├── README.md               # Full documentation
│   ├── QUICKSTART.md           # Quick start
│   ├── SETUP.md                # This file
│   ├── EXAMPLE.json            # Example stories
│   └── CI-CD.md                # CI/CD integration guide
│
├── scripts/ralph/              # Ralph executables
│   ├── ralph.sh                # Main loop
│   └── jira-sync.sh            # JIRA integration
│
├── prd.json                    # Your stories (IMPORTANT)
├── progress.txt                # Iteration log (auto-updated)
│
├── src/                        # Production code (Ralph creates tests/code here)
├── features/                   # Test features
│   ├── unit/                   # Unit test features
│   └── e2e/                    # E2E test features
├── tests/                      # Test implementations
│   ├── steps/                  # Unit test steps
│   └── e2e/steps/              # E2E test steps
│
└── ... (rest of project)
```

## Common Issues & Solutions

### Scripts not executable

```
Error: Permission denied
```

Solution:

```bash
chmod +x scripts/ralph/ralph.sh scripts/ralph/jira-sync.sh .ralph/config.sh
```

### prd.json is invalid JSON

```
Error: prd.json is not valid JSON
```

Solution: Validate and fix:

```bash
jq . prd.json           # Shows error location
# Edit prd.json, then:
jq . prd.json && echo "OK"
```

### Tests fail immediately

Check:
1. Dependencies installed: `npm ci`
2. TypeScript compiles: `npm run typecheck`
3. Tests can run manually: `npm run test:unit`

### Ralph stops after first iteration

Check `progress.txt` for the error. Likely causes:
- Test syntax error
- Missing test file
- Code doesn't compile
- Linting/formatting issues

### Can't commit changes

Verify git configuration:

```bash
git config --global user.email "your@email.com"
git config --global user.name "Your Name"
git status  # Check for uncommitted files
```

## Next Steps

1. Read `.ralph/QUICKSTART.md` for 5-minute overview
2. Check `.ralph/README.md` for complete documentation
3. Review `.ralph/EXAMPLE.json` for story examples
4. Run: `DRY_RUN=true bash scripts/ralph/ralph.sh` to test locally
5. Add your first story to `prd.json`
6. Run: `bash scripts/ralph/ralph.sh` to start the loop

## Verification Checklist

Before running Ralph for real:

- [ ] Scripts are executable (`chmod +x`)
- [ ] prd.json exists and is valid JSON
- [ ] progress.txt exists
- [ ] At least 1 story in prd.json with `passes: false`
- [ ] npm dependencies installed (`npm ci`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Tests run manually (`npm run test:unit`)
- [ ] Git configured (`git config --list`)
- [ ] In project root directory (pwd shows workshop-1)

## Running Ralph

### Development (HITL Mode)

```bash
# Single iteration with feedback
bash scripts/ralph/ralph.sh

# Multiple iterations (up to 5 by default)
bash scripts/ralph/ralph.sh
# then check progress.txt
# then run again if stories remain
```

### Automated (AFK Mode)

Auto-detected in containers:

```bash
# In Docker/CI pipeline
docker run ... bash scripts/ralph/ralph.sh
# Runs up to 50 iterations automatically
```

### Dry Run (Testing)

```bash
# Won't commit or update prd.json
DRY_RUN=true bash scripts/ralph/ralph.sh
```

## Support Resources

- **Quick questions**: Read `.ralph/QUICKSTART.md`
- **Full docs**: Read `.ralph/README.md`
- **CI/CD setup**: Read `.ralph/CI-CD.md`
- **Examples**: Check `.ralph/EXAMPLE.json`
- **Project guidelines**: Read `CLAUDE.md`
- **Progress tracking**: Check `progress.txt`
- **Troubleshooting**: See "Common Issues" above

## Summary

Ralph is now ready! You have:

✓ Core structure in place
✓ Scripts and configuration created
✓ Documentation and examples ready
✓ Integration templates prepared

Next: Add stories to `prd.json` and run `bash scripts/ralph/ralph.sh`

Good luck!
