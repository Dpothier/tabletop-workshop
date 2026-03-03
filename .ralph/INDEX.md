# Ralph Wiggum - File Index & Navigation

Complete reference to all Ralph files and what they do.

## File Structure

```
.ralph/
├── PROMPT.md          ← System prompt for Claude (each iteration)
├── config.sh          ← Configuration (make scripts, edit this)
├── README.md          ← Full documentation (start here for deep dive)
├── QUICKSTART.md      ← 5-minute getting started
├── SETUP.md           ← Initialization & verification
├── EXAMPLE.json       ← Example stories (copy to prd.json)
├── CI-CD.md           ← CI/CD integration guide
└── INDEX.md           ← This file

scripts/ralph/
├── ralph.sh           ← Main loop (RUN THIS)
└── jira-sync.sh       ← JIRA sync (optional)

(Project root)
├── prd.json           ← Your stories (EDIT THIS)
├── progress.txt       ← Auto-updated progress log
└── CLAUDE.md          ← Project guidelines
```

## File Purposes & When to Use

### 1. QUICKSTART.md
**When**: You have 5 minutes and want to get started NOW
**What**: Minimal setup steps + common commands
**Read if**: First time using Ralph

### 2. SETUP.md
**When**: Doing initial setup or troubleshooting issues
**What**: Complete initialization guide + checklist
**Read if**: Scripts won't run, prd.json issues, git problems

### 3. README.md
**When**: You want full documentation and deep understanding
**What**: Complete feature documentation, all options, best practices
**Read if**: Customizing behavior, integrating JIRA, understanding flow

### 4. PROMPT.md
**When**: Understanding what Claude does each iteration
**What**: System instructions for Claude (the TDD algorithm)
**Read if**: Debugging why tests aren't being written correctly

### 5. CI-CD.md
**When**: Setting up in GitHub Actions, GitLab, Jenkins, etc
**What**: Complete CI/CD integration examples
**Read if**: Running Ralph in automated pipelines

### 6. EXAMPLE.json
**When**: Creating your first prd.json
**What**: 5 example stories showing proper format
**Copy to prd.json**: `cp .ralph/EXAMPLE.json prd.json`

### 7. config.sh
**When**: Customizing Ralph's behavior
**What**: Configuration variables (iterations, auto-fixes, etc)
**Edit if**: Want different max iterations, auto-fix behavior

### 8. ralph.sh
**When**: Running Ralph
**What**: Main loop orchestrator
**Run**: `bash scripts/ralph/ralph.sh`

### 9. jira-sync.sh
**When**: Syncing with JIRA (optional)
**What**: Pull stories from JIRA, push completion status back
**Use if**: Stories managed in JIRA

### 10. prd.json
**When**: Adding/editing stories
**What**: Your product requirements and story status
**Edit**: Add stories here, Ralph updates `passes: true` when done

### 11. progress.txt
**When**: Tracking what happened
**What**: Auto-updated iteration log
**Read**: Check for errors or learnings from failed iterations

## Decision Tree

### "I just want to get started"
1. Read: `QUICKSTART.md`
2. Do: `chmod +x scripts/ralph/ralph.sh`
3. Do: `cp .ralph/EXAMPLE.json prd.json`
4. Run: `bash scripts/ralph/ralph.sh`

### "I need to set this up properly"
1. Read: `SETUP.md`
2. Follow: Initialization steps (1-5)
3. Do: Verification checklist
4. Run: `bash scripts/ralph/ralph.sh`

### "I want to understand everything"
1. Read: `README.md` (full docs)
2. Skim: `SETUP.md` (setup details)
3. Review: `PROMPT.md` (what Claude does)
4. Explore: `EXAMPLE.json` (story format)

### "I'm setting up CI/CD"
1. Read: `CI-CD.md`
2. Choose: GitHub Actions / GitLab / Jenkins
3. Copy: Example configuration
4. Setup: Secrets (JIRA tokens, git credentials)

### "Something is broken"
1. Check: `progress.txt` (error log)
2. Read: `SETUP.md` - Common Issues section
3. Run: `npm run check && npm run test` (manual validation)
4. Edit: `prd.json` if story format is wrong

### "I want to use JIRA"
1. Read: `README.md` - JIRA Integration section
2. Setup: Environment variables
3. Run: `bash scripts/ralph/jira-sync.sh status`
4. Run: `bash scripts/ralph/jira-sync.sh pull`

### "I want to customize Ralph's behavior"
1. Edit: `.ralph/config.sh`
2. Change: `HITL_MAX_ITERATIONS`, `AUTO_FORMAT_ON_FAILURE`, etc
3. Verify: `bash .ralph/config.sh` (sources without error)
4. Run: `bash scripts/ralph/ralph.sh`

## File Relationships

```
┌─────────────────────────────────────┐
│  scripts/ralph/ralph.sh             │  MAIN LOOP
│  (orchestrator - runs iterations)   │
└──────────────┬──────────────────────┘
               │
               ├──→ reads: prd.json
               │    (finds next story)
               │
               ├──→ reads: .ralph/PROMPT.md
               │    (gets Claude instructions)
               │
               ├──→ reads: .ralph/config.sh
               │    (gets configuration)
               │
               └──→ writes: progress.txt
                    (logs iteration results)

              Claude (invoked with PROMPT.md)
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    v               v               v
 Writes test  Writes code   Updates prd.json
 features/    src/          (passes: true)
 unit/ or
 features/
 e2e/

  After success:
    ├──→ runs: npm run check
    │    (typescript, lint, format)
    │
    ├──→ runs: npm run test
    │    (all tests must pass)
    │
    └──→ runs: git commit
         (commits story implementation)
```

## Common Workflows

### Workflow 1: Single Story Development

1. Edit `prd.json` - add 1 story with `passes: false`
2. Run: `bash scripts/ralph/ralph.sh`
3. Watch `progress.txt` for result
4. If success: run again for next story
5. If failure: check error, fix, retry

### Workflow 2: Multiple Stories (Marathon Session)

1. Edit `prd.json` - add 5-10 stories
2. Edit `.ralph/config.sh` - set `HITL_MAX_ITERATIONS=10`
3. Run: `bash scripts/ralph/ralph.sh`
4. Check `progress.txt` after each iteration
5. Loop runs until all done or max iterations

### Workflow 3: Continuous Integration

1. Setup: Read `CI-CD.md`
2. Create: `.github/workflows/ralph.yml` (or equivalent)
3. Configure: JIRA integration (optional)
4. Deploy: Push to main branch
5. Ralph runs on schedule automatically

### Workflow 4: Debug Failed Story

1. Check: `progress.txt` - what failed?
2. Run: `npm run test` - manually verify
3. Edit: `prd.json` - fix story description if unclear
4. Edit: `.ralph/config.sh` - enable `AUTO_FORMAT_ON_FAILURE`
5. Run: `bash scripts/ralph/ralph.sh` - retry

### Workflow 5: JIRA Integration

1. Setup: `export JIRA_*` environment variables
2. Pull: `bash scripts/ralph/jira-sync.sh pull`
3. Run: `bash scripts/ralph/ralph.sh`
4. Push: `bash scripts/ralph/jira-sync.sh push`
5. Monitor: Check JIRA issues for updates

## Reading Recommendations by Role

### I'm a Developer (writing stories for Ralph)
- [ ] Read: `QUICKSTART.md` (5 min)
- [ ] Read: `README.md` - Story Format section
- [ ] Copy: `EXAMPLE.json` format
- [ ] Run: `bash scripts/ralph/ralph.sh`

### I'm a DevOps/SRE (setting up infrastructure)
- [ ] Read: `CI-CD.md` (10 min)
- [ ] Setup: GitHub Actions / GitLab / Jenkins
- [ ] Configure: Secrets and credentials
- [ ] Test: Dry run in CI pipeline

### I'm a Team Lead (managing stories)
- [ ] Read: `README.md` (15 min)
- [ ] Setup: JIRA integration
- [ ] Review: `progress.txt` regularly
- [ ] Monitor: Story completion rate

### I'm Debugging an Issue
1. First: Check `progress.txt` for error message
2. Then: Read relevant section in `SETUP.md` or `README.md`
3. Search: For your error in these files
4. Try: Commands in `QUICKSTART.md` - Common Commands

## Quick Reference Cards

### Commands to Remember

```bash
# Make scripts executable
chmod +x scripts/ralph/ralph.sh scripts/ralph/jira-sync.sh .ralph/config.sh

# Copy example stories
cp .ralph/EXAMPLE.json prd.json

# Run Ralph
bash scripts/ralph/ralph.sh

# Check progress
tail -20 progress.txt

# Validate prd.json
jq . prd.json

# Count stories
jq '.userStories | length' prd.json

# Count completed
jq '[.userStories[] | select(.passes == true)] | length' prd.json

# Check JIRA config
bash scripts/ralph/jira-sync.sh status
```

### Files to Edit

```
prd.json              ← Add/edit your stories here
.ralph/config.sh     ← Change Ralph's behavior
progress.txt         ← Read (don't edit) for status
```

### Files NOT to Edit

```
scripts/ralph/ralph.sh    ← Core loop (let Ralph run it)
.ralph/PROMPT.md         ← Claude instructions
.ralph/config.sh         ← edit this, but carefully
```

## Troubleshooting Index

| Problem | Solution | Read |
|---------|----------|------|
| "Permission denied" | `chmod +x scripts/ralph/ralph.sh` | SETUP.md |
| "prd.json not found" | `cp .ralph/EXAMPLE.json prd.json` | QUICKSTART.md |
| Tests fail | Check `npm run test` manually | SETUP.md |
| Ralph stops abruptly | Check `progress.txt` for error | README.md |
| Want to skip JIRA | Just use prd.json | QUICKSTART.md |
| CI/CD integration | Follow CI-CD.md examples | CI-CD.md |
| Can't commit changes | Check git config | SETUP.md |
| Want auto-format | Edit `.ralph/config.sh` | README.md |

## Navigation Shortcuts

From any file, you can:
1. Go to main loop: `scripts/ralph/ralph.sh`
2. Check configuration: `.ralph/config.sh`
3. View documentation: `.ralph/README.md`
4. Check progress: `progress.txt`
5. Edit stories: `prd.json`

## File Sizes & Reading Time

| File | Type | Size | Read Time |
|------|------|------|-----------|
| QUICKSTART.md | Guide | ~2KB | 5 min |
| SETUP.md | Guide | ~8KB | 15 min |
| README.md | Docs | ~15KB | 30 min |
| PROMPT.md | Specs | ~3KB | 5 min |
| CI-CD.md | Guide | ~10KB | 20 min |
| config.sh | Config | ~2KB | 3 min |
| ralph.sh | Code | ~4KB | 10 min |

## Summary

**Just getting started?** → QUICKSTART.md
**Need full setup?** → SETUP.md
**Want to understand everything?** → README.md
**Setting up CI/CD?** → CI-CD.md
**Something broken?** → SETUP.md or progress.txt
**Want to customize?** → config.sh and README.md

All files are in `/home/dominique/git/tabletop-workshop/workshop-1/.ralph/`
