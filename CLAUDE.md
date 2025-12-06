# Commands guidelines
Use `npm run` to execute project scripts.
ALWAYS run `npm run check` (typecheck + lint + format check) before committing.
Never edit files that are not related to the task at hand.
Never edit files using the command line, always use the proper tools.

# Commiting guidelines
Git commits will require the approval of the user. To limit the number of back and forths, make sure you:
- Mark progress in your PLAN.md file
- Run `npm run check` and fix any issues
- Make sure the tests pass using `npm run test`

# Further guidelines
Information about your workflow is available in the rules/ folder.
- Before planning, read rules/planification-guidelines.mdc
- Before writing tests, read rules/test-guidelines.mdc
- Before writing code, read rules/coding-guidelines.mdc
- Before writing documentation, read rules/documentation-guidelines.mdc
- Before reorganising the codebase, read rules/reorganising-guidelines.mdc

Before doing any task for which guideline exists, READ THE GUIDELINES.

If linting fails, use `npm run lint:fix` and `npm run format` to auto-fix issues.

# Code quality
- Use TypeScript strict mode
- Use type annotations on all function signatures

# Available tools and MCPs
Context7: This MCP contains documentation for the most popular libraries and frameworks. When using a library or framework, use Context7 before trying to do a web search.
