---
description: Run architecture review, tests, and checks before commit
---

Run these 3 agents in parallel using the Task tool:

1. **Architecture Review Agent**: Review changed files (use `git diff --name-only`) against `rules/` guidelines. Flag any violations.

2. **Test Agent**: Run `npm run test`. Report pass/fail.

3. **Check Agent**: Run `npm run check`. Report pass/fail.

Wait for all agents. Report: PASS/FAIL for each. If all pass, say "Ready to commit."
