# Ralph Wiggum Autonomous TDD Loop - Setup Complete

Ralph has been successfully initialized for the tabletop-workshop project!

## What Was Created

### Directory Structure

```
.ralph/                          # Ralph configuration directory
├── 00-START-HERE.md            # Entry point (read this first!)
├── QUICKSTART.md               # 5-minute guide
├── SETUP.md                    # Detailed initialization
├── README.md                   # Full documentation
├── INDEX.md                    # Navigation and reference
├── CI-CD.md                    # CI/CD integration examples
├── PROMPT.md                   # System prompt for Claude
├── config.sh                   # Configuration (executable)
└── EXAMPLE.json                # Example stories

scripts/ralph/                   # Executables
├── ralph.sh                    # Main loop (executable)
└── jira-sync.sh                # JIRA integration (executable)

(Project Root)
├── prd.json                    # Product requirements (empty)
└── progress.txt                # Progress log (auto-updated)
```

## Files Created

### Total: 13 New Files

#### Ralph Configuration (.ralph/)
1. **00-START-HERE.md** - Quick entry point
2. **QUICKSTART.md** - 5-minute setup
3. **SETUP.md** - Complete initialization guide
4. **README.md** - Full documentation (40KB)
5. **INDEX.md** - File navigation and reference
6. **CI-CD.md** - CI/CD integration examples
7. **PROMPT.md** - Claude system instructions
8. **config.sh** - Configuration file (executable)
9. **EXAMPLE.json** - Example stories

#### Scripts (scripts/ralph/)
10. **ralph.sh** - Main loop (executable)
11. **jira-sync.sh** - JIRA integration (executable)

#### Project Root
12. **prd.json** - Story database
13. **progress.txt** - Iteration log

## Important: Make Scripts Executable

The following scripts MUST be executable before running Ralph:

```bash
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/scripts/ralph/ralph.sh
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/scripts/ralph/jira-sync.sh
chmod +x /home/dominique/git/tabletop-workshop/workshop-1/.ralph/config.sh
```

Or from project root:

```bash
chmod +x scripts/ralph/*.sh .ralph/config.sh
```

Verify execution:

```bash
ls -la scripts/ralph/
# Both files should show: -rwx------
```

## Quick Start (3 Steps)

### Step 1: Make Scripts Executable

```bash
cd /home/dominique/git/tabletop-workshop/workshop-1
chmod +x scripts/ralph/*.sh .ralph/config.sh
```

### Step 2: Add Stories

```bash
# Copy example stories:
cp .ralph/EXAMPLE.json prd.json

# Or create your own prd.json with stories
```

### Step 3: Run Ralph

```bash
bash scripts/ralph/ralph.sh
```

## Documentation Files

Read these in order:

1. **.ralph/00-START-HERE.md** (2 min)
   - Quick overview
   - How to get started

2. **.ralph/QUICKSTART.md** (5 min)
   - Commands
   - Basic workflow

3. **.ralph/README.md** (20 min)
   - Full documentation
   - All features explained
   - Best practices

4. **.ralph/SETUP.md** (10 min)
   - Detailed initialization
   - Troubleshooting

5. **.ralph/INDEX.md** (reference)
   - Navigation guide
   - File purposes
   - Quick reference

6. **.ralph/CI-CD.md** (if needed)
   - GitHub Actions
   - GitLab CI
   - Jenkins
   - Kubernetes

## File Descriptions

### Core Configuration

**`.ralph/config.sh`** (executable)
- Configuration variables
- Max iterations (default: 50)
- Auto-fix behavior
- Path definitions
- Color output functions

**`.ralph/PROMPT.md`**
- System instructions for Claude
- TDD algorithm definition
- Phase descriptions (RED, GREEN, REFACTOR, VERIFY, COMMIT)
- Story schema
- Exit codes

### Scripts

**`scripts/ralph/ralph.sh`** (executable)
- Main orchestration loop
- Reads prd.json
- Invokes Claude with PROMPT.md
- Manages iterations
- Handles completion detection

**`scripts/ralph/jira-sync.sh`** (executable)
- Template for JIRA integration (optional)
- Pull: JIRA → prd.json
- Push: prd.json → JIRA
- Environment variable configuration

### Data Files

**`prd.json`**
- Your product requirements
- Story database
- Schema: id, title, description, type, passes
- Start empty, add stories here
- Ralph updates `passes: true` when complete

**`progress.txt`**
- Auto-updated iteration log
- Track learnings and issues
- Read after each run
- Do NOT edit manually

### Examples

**`.ralph/EXAMPLE.json`**
- 5 example stories
- Shows proper format
- Copy to prd.json to start

## Configuration

Default settings in `.ralph/config.sh`:

```bash
MAX_ITERATIONS=50             # Max per run (override with --max)
REQUIRE_COMMIT_APPROVAL=false  # Don't ask before commits
REQUIRE_PHASE_APPROVAL=false   # Don't ask before phases
AUTO_FORMAT_ON_FAILURE=true    # Auto-fix formatting on retry
AUTO_LINT_FIX_ON_FAILURE=true  # Auto-fix linting on retry
```

Edit to customize Ralph's behavior.

## Story Format

Add stories to `prd.json`:

```json
{
  "project": "tabletop-workshop",
  "branchName": "ralph/current",
  "userStories": [
    {
      "id": "STORY-001",
      "title": "Feature description",
      "description": "Acceptance criteria and test requirements",
      "type": "unit",
      "passes": false
    }
  ]
}
```

Required fields:
- `id`: Unique identifier
- `title`: One-line summary
- `description`: Detailed requirements (important!)
- `type`: "unit" or "e2e"
- `passes`: false (Ralph sets to true when done)

## Running Ralph

### Development Mode (Local)

```bash
# Single iteration with feedback
bash scripts/ralph/ralph.sh

# Check progress
tail progress.txt
```

### Automated Mode (CI/CD, Container)

Auto-detected in containers. Runs up to 50 iterations automatically.

### Test Mode (Dry Run)

```bash
# Won't commit or update prd.json
DRY_RUN=true bash scripts/ralph/ralph.sh
```

## TDD Cycle

For each story, Ralph:

1. **RED** (unit-test-writer)
   - Write failing tests
   - Create feature files in `features/unit/` or `features/e2e/`
   - Verify tests FAIL

2. **GREEN** (code-writer)
   - Write minimal code in `src/`
   - Make tests PASS
   - Run: `npm run test`

3. **REFACTOR** (architecture-reviewer, optional)
   - Improve code quality
   - Apply approved changes

4. **VERIFY**
   - Run: `npm run check` (typecheck, lint, format)
   - Run: `npm run test` (all tests)
   - Verify success

5. **COMMIT**
   - `git commit -m "feat: [STORY-ID] title"`
   - Update `prd.json`: `passes: true`
   - Append to `progress.txt`

6. **LOOP**
   - Start next story or exit if complete

## Verification Checklist

Before running Ralph:

- [ ] Scripts are executable: `ls -la scripts/ralph/`
- [ ] prd.json exists: `jq . prd.json`
- [ ] At least 1 story with `passes: false`
- [ ] npm dependencies: `npm ci`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Tests run: `npm run test:unit`
- [ ] Git configured: `git config --list`

## Getting Help

| Need | Read |
|------|------|
| Quick start | `.ralph/00-START-HERE.md` |
| 5-minute setup | `.ralph/QUICKSTART.md` |
| Full docs | `.ralph/README.md` |
| Setup help | `.ralph/SETUP.md` |
| File navigation | `.ralph/INDEX.md` |
| CI/CD setup | `.ralph/CI-CD.md` |
| Troubleshooting | `.ralph/SETUP.md` - Issues |
| Customize behavior | `.ralph/config.sh` |
| JIRA integration | `.ralph/README.md` - JIRA section |

## Next Steps

1. **Right now** (1 minute):
   ```bash
   chmod +x scripts/ralph/*.sh .ralph/config.sh
   ```

2. **Then** (2 minutes):
   ```bash
   cp .ralph/EXAMPLE.json prd.json
   jq . prd.json  # Verify valid
   ```

3. **Then run** (immediate):
   ```bash
   bash scripts/ralph/ralph.sh
   ```

4. **Check results** (immediate):
   ```bash
   tail progress.txt
   jq '.userStories[] | {id, passes}' prd.json
   ```

## Environment Detection

Ralph automatically detects:

- **Local Development**: default mode (50 max iterations)
- **Container/CI**: default mode (50 max iterations)
- **Git Status**: Verifies repo is ready
- **Dependencies**: Checks npm, typescript

## Integration Points

Ralph integrates with:

- **Claude API**: For test/code generation (via PROMPT.md)
- **npm scripts**: `npm run check && npm run test`
- **Git**: Automatic commits
- **JIRA** (optional): Story sync
- **CI/CD** (optional): GitHub Actions, GitLab, Jenkins, etc

## Key Concepts

- **prd.json**: Source of truth for stories
- **progress.txt**: Audit trail of iterations
- **PROMPT.md**: Claude's instructions
- **config.sh**: Ralph's behavior settings
- **ralph.sh**: The orchestration engine

## Architecture

```
User adds stories to prd.json
              ↓
        ralph.sh (main loop)
              ↓
      ┌─────────────────┐
      │  reads PROMPT.md │
      │  reads prd.json  │
      └────────┬────────┘
               ↓
           Claude (delegated)
               ↓
      ┌─────────────────────────────┐
      │ Delegates to agents:        │
      │ - unit-test-writer          │
      │ - code-writer               │
      │ - architecture-reviewer     │
      └────────┬────────────────────┘
               ↓
      Creates test files & code
               ↓
        npm run test (verify)
               ↓
        git commit (if passing)
               ↓
      Updates prd.json (passes: true)
               ↓
      Appends to progress.txt
               ↓
      Loop to next story or exit
```

## Maintenance

Ralph requires minimal maintenance:

- **Before each run**: Ensure prd.json has stories
- **After each iteration**: Check progress.txt for issues
- **Periodically**: Review progress.txt for patterns
- **When customizing**: Edit .ralph/config.sh
- **Optional JIRA**: Configure environment variables

## Support

For issues:
1. Check `progress.txt` for error details
2. Read `.ralph/SETUP.md` - Common Issues section
3. Validate: `npm run check && npm run test`
4. Check: `jq . prd.json` (valid JSON?)

## Summary

Ralph Wiggum is now ready to:

✓ Read stories from prd.json
✓ Write failing tests automatically
✓ Write minimal production code
✓ Run full test suite
✓ Commit changes to git
✓ Mark stories complete
✓ Track progress in progress.txt
✓ Loop until all stories done

All while respecting TDD principles and your project's patterns!

---

## Quick Reference

```bash
# Make executable (ONE TIME)
chmod +x scripts/ralph/*.sh .ralph/config.sh

# Add stories
cp .ralph/EXAMPLE.json prd.json

# Run Ralph
bash scripts/ralph/ralph.sh

# Check progress
tail progress.txt

# View story status
jq '.userStories[] | {id, passes}' prd.json
```

## File Locations (Absolute Paths)

All files are in `/home/dominique/git/tabletop-workshop/workshop-1/`

- Main loop: `scripts/ralph/ralph.sh`
- Configuration: `.ralph/config.sh`
- Stories: `prd.json`
- Progress: `progress.txt`
- Documentation: `.ralph/*.md`

---

**Ready to begin?** Read `.ralph/00-START-HERE.md` or run:

```bash
chmod +x scripts/ralph/*.sh .ralph/config.sh && cp .ralph/EXAMPLE.json prd.json && bash scripts/ralph/ralph.sh
```

Good luck with Ralph!
