---
description: Run architecture review, tests, and checks before commit (project)
---

Run these agents in parallel using the Task tool:

1. **Unit Test Verifier**: Use subagent_type='unit-test-verifier'. Report PASS/FAIL.

2. **E2E Test Verifier**: Use subagent_type='e2e-test-verifier'. Report PASS/FAIL.

3. **Check Agent**: Run `npm run check`. Report PASS/FAIL.

4. **Architecture Reviewer**: Use subagent_type='architecture-reviewer' on changed files (use `git diff --name-only`). Report issues found.

5. **Documentation Checker**: Use subagent_type='documentation-checker'. Report PASS/FAIL.

Wait for all agents. Report: PASS/FAIL for each.
- If all pass: "Ready to commit."
- If any fail: List failures and required fixes.
