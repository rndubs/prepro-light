# Lightweight mesh preprocessing application

The PLAN.md file includes a list of objectives I wish to implement.
Each task should be performed on a separate branch.
Before creating a new branch, ensure that all changes on `main` have been pulled.

After implementing changes as outlined in the PLAN.md file, always review the PLAN.md contents and check off items that have been completed.

The RESEACH.md file includes additional context about the app motivation and design decisions.
If needed, please reference the RESEARCH.md file to build more context about a specific task in the PLAN.md file.

## Testing Requirements

**IMPORTANT:** Before making any commit, ALL tests must be run and passing to ensure we aren't regressing.

### Running Tests

```bash
# Build the extension and tests
npm run compile

# Run all integration tests
npm test
```

**Note:** First-time test execution will download a VS Code instance (via @vscode/test-electron). This requires network access to `update.code.visualstudio.com`. In restricted environments, tests may not run but will still compile successfully.

### Test Suite Overview

As of Phase 4b, we have comprehensive integration tests covering:
- Extension activation and registration (8 tests)
- File loading for all supported formats (7 tests)
- Webview lifecycle management (6 tests)
- Rendering functionality (8 tests)

**Total:** 29 integration tests across 4 test suites

### Test Requirements for Commits

1. **Build must succeed** - `npm run compile` must complete without errors
2. **All tests must pass** - `npm test` must show 0 failures
3. **No new warnings** - Check compiler output for new TypeScript warnings
4. **Update PLAN.md** - Mark completed tasks with [x]

### Test Documentation

For detailed testing information, see:
- `test/README.md` - Comprehensive test documentation
- `PLAN.md` Phase 4b - Testing infrastructure details

### Adding New Tests

When adding new features:
1. Add corresponding tests in the appropriate test suite
2. Follow existing test patterns (see `test/suite/*.test.ts`)
3. Use helper functions from `test/suite/helpers.ts`
4. Keep tests fast (< 10 seconds per test)
5. Ensure tests run in headless mode (no user interaction required)

