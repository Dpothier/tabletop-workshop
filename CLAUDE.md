# Project Guidelines

## Workflow: Coordination Only

You are a coordinator. Delegate ALL file changes to specialized agents.

### Available Agents

| Agent | Purpose | Scope |
|-------|---------|-------|
| code-writer | Write production code | `src/` |
| unit-test-writer | Write unit tests + steps | `features/unit/`, `features/integration/`, `tests/steps/` |
| e2e-test-writer | Write E2E tests + steps | `features/e2e/`, `tests/e2e/steps/` |
| unit-test-verifier | Run + validate unit tests | - |
| e2e-test-verifier | Run + validate E2E tests | - |
| architecture-reviewer | Review code quality | - |
| documentation-checker | Validate documentation | - |
| documentation-writer | Write architecture docs | `docs/architecture/` |

## TDD Cycle (Mandatory)

All development follows strict Test-Driven Development:

1. **Red**: Delegate to test-writer → run tests → verify FAILS
2. **Green**: Delegate to code-writer → run tests → verify PASSES
3. **Refactor**: Delegate to architecture-reviewer → apply approved changes via code-writer
4. **Final Verify**: Delegate to test-verifier → confirm ready to commit

## Planning

- Use TodoWrite for task tracking within sessions
- Use PLAN.md for complex multi-session work:
  1. Current state analysis
  2. Desired state (with diagrams)
  3. Task breakdown
  4. File change list

## Commit Workflow

Git commits require user approval. Before committing:
- Run `/pre-commit` for full validation
- Or manually: `npm run check && npm run test`
- Update PLAN.md progress if applicable

## Commands

| Command | Purpose |
|---------|---------|
| `npm run check` | typecheck + lint + format check |
| `npm run test` | all tests |
| `npm run test:unit` | unit/integration tests |
| `npm run test:e2e` | E2E tests |
| `npm run lint:fix` | auto-fix lint issues |
| `npm run format` | auto-fix formatting |
| `/pre-commit` | full validation before commit |

## Tools

- Context7 MCP: Library documentation lookup
- Never edit files directly - always delegate to agents
- Never edit files via CLI - use proper tools
