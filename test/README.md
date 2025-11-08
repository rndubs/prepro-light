# Test Suite for Prepro Light Extension

This directory contains integration tests for the Prepro Light VS Code extension, implementing Phase 4b of the development plan.

## Test Infrastructure

### Framework
- **Test Runner**: `@vscode/test-cli` - Modern VS Code extension test CLI (fixes macOS Electron issues)
- **Legacy Runner**: `@vscode/test-electron` - Available via `npm run test:legacy`
- **Test Framework**: Mocha (TDD interface)
- **Assertions**: Node.js built-in `assert` module
- **Environment**: Configurable via `.vscode-test.mjs` (headless by default)

### Test Structure

```
test/
├── runTest.ts              # Test runner entry point (headless mode)
├── runPerformanceTest.ts   # Performance test runner (headful mode with GPU)
├── suite/
│   ├── index.ts            # Mocha test suite configuration
│   ├── helpers.ts          # Test utility functions
│   ├── extension.test.ts   # Extension activation tests (Phase 4b.2)
│   ├── fileLoading.test.ts # File loading tests (Phase 4b.3)
│   ├── webview.test.ts     # Webview integration tests (Phase 4b.4)
│   ├── rendering.test.ts   # Rendering tests (Phase 4b.5)
│   └── performance.test.ts # Performance benchmarking tests
├── fixtures/               # Test fixture files
└── README.md              # This file
```

## Running Tests

### Local Development

```bash
# Build the extension and tests
npm run compile

# Run all tests
npm test

# Watch mode (rebuild on changes)
npm run watch
```

### Headless Mode (CI/CD)

The tests are designed to run in headless mode automatically. On Linux, Xvfb is used to provide a virtual display.

```bash
# The test runner automatically handles headless mode
npm test
```

### Individual Test Suites

To run specific test files during development, you can modify `test/suite/index.ts` to filter test files.

### Performance Tests

**File**: `performance.test.ts`

Performance tests measure real-world file loading and rendering performance. Unlike other integration tests, these **require WebGL** to run and should be executed in **headful mode** for accurate benchmarking.

```bash
# Build the extension first
npm run compile

# Run performance tests (configured for headful mode with GPU)
npm run test:performance
```

**Important**: Performance tests will automatically detect if WebGL is unavailable (e.g., in headless/CI environments) and skip gracefully. To get real performance data:
- Run on a machine with GPU access
- Use `npm run test:performance` (configured for headful mode via `.vscode-test.mjs`)
- Generate test meshes first: `python3 generate_test_meshes.py`

**macOS Note**: The new `@vscode/test-cli` runner resolves Electron command-line flag restrictions that prevented tests from running on macOS 14+ with hardened Electron security.

The performance test suite:
- ✅ Dynamically tests all meshes in `test_meshes/` directory
- ✅ Measures actual file loading and rendering time
- ✅ Tests different mesh sizes (20k, 100k, 500k, 1M nodes)
- ✅ Tests different formats (STL, OBJ, VTP)
- ✅ Skips files larger than 100MB
- ✅ Provides detailed performance analysis and statistics

## Test Coverage

### Phase 4b.2: Extension Activation Tests
**File**: `extension.test.ts`

Tests cover:
- ✅ Extension presence and activation
- ✅ Custom editor provider registration
- ✅ Command registration
- ✅ Package metadata validation
- ✅ File format support verification

### Phase 4b.3: File Loading Integration Tests
**File**: `fileLoading.test.ts`

Tests cover:
- ✅ Loading VTP files
- ✅ Loading STL files
- ✅ Loading OBJ files
- ✅ Loading VTI files (sphere sample)
- ✅ Multiple file handling
- ✅ Command availability

### Phase 4b.4: Webview Integration Tests
**File**: `webview.test.ts`

Tests cover:
- ✅ Webview creation on file open
- ✅ Webview disposal on close
- ✅ Multiple simultaneous webviews
- ✅ Different file format support
- ✅ File reopening
- ✅ Rapid opening/closing

### Phase 4b.5: Rendering Integration Tests
**File**: `rendering.test.ts`

Tests cover:
- ✅ Mesh rendering after load
- ✅ Different mesh sizes
- ✅ Sequential rendering
- ✅ Memory leak prevention
- ✅ Format-specific rendering (VTP, STL, OBJ)
- ✅ Rapid scene switching

## Test Utilities

### Helper Functions (`helpers.ts`)

- `wait(ms)` - Async delay
- `getExtension()` - Get extension instance
- `activateExtension()` - Ensure extension is activated
- `getSampleFilePath(filename)` - Get path to sample file
- `getFixturePath(filename)` - Get path to test fixture
- `openMeshFile(filePath)` - Open mesh file with custom editor
- `closeAllEditors()` - Clean up all open editors
- `isCommandRegistered(commandId)` - Check command registration
- `waitFor(condition, timeout)` - Wait for condition to be true
- `isWebGLAvailable()` - Check if WebGL is available for rendering tests

## Sample Files Used

Tests use sample files from the `samples/` directory:
- `cube.vtp` - VTP format cube mesh
- `sphere.vtp` - VTP format sphere mesh
- `simple_triangle.stl` - STL format triangle
- `simple_cube.obj` - OBJ format cube

## Test Fixtures

The `fixtures/` directory is reserved for additional test files:
- Corrupted mesh files for error testing
- Large mesh files for performance testing
- Mesh files with material data (for Phase 5)

## Limitations

### What We Can Test
- Extension activation and registration
- File opening workflows
- Editor/webview lifecycle
- Command availability
- Basic error handling

### What We Cannot Directly Test
- Visual rendering output (requires manual verification)
- Webview DOM content (webview is isolated)
- VTK.js internals (tested indirectly)
- User interactions (camera controls, UI clicks)

These limitations are inherent to VS Code's webview architecture and headless testing environment.

## Success Criteria

Tests pass if:
- ✅ All core file formats load without errors
- ✅ Extension activates and registers correctly
- ✅ Webviews create and dispose properly
- ✅ No crashes or unhandled errors
- ✅ Tests complete in < 30 seconds
- ✅ No memory leaks detected

## Troubleshooting

### Tests Fail to Start
- Ensure `npm run compile` has been run
- Check that all dependencies are installed (`npm install`)
- Verify VS Code can be downloaded (required on first run)
- **macOS**: If you see "bad option" errors, ensure you're using `npm test` (not the legacy runner)

### Tests Timeout
- Increase timeout in individual test: `this.timeout(15000)`
- Check if VS Code download is slow (first run only)
- Ensure system has enough resources

### Extension Not Found
- Verify extension ID in `helpers.ts` matches package.json
- Ensure extension is built before running tests
- Check that extension main file exists in dist/

### macOS "bad option" Errors (Legacy Runner)
If using the legacy `@vscode/test-electron` runner directly:
- Switch to the new CLI: `npm test` instead of `npm run test:legacy`
- The `@vscode/test-cli` runner is configured in `.vscode-test.mjs` and avoids hardcoded Electron flags
- This resolves issues with macOS 14+ Electron hardened runtime restrictions

## Future Enhancements (Phase 9)

The comprehensive testing phase (Phase 9) will add:
- Performance benchmarks
- Cross-platform testing (Windows, macOS, Linux)
- User acceptance tests
- Test coverage measurement
- CI/CD integration
- Additional unit tests for utilities

## Contributing

When adding new features:
1. Add corresponding tests in appropriate suite file
2. Update this README if new test patterns are introduced
3. Ensure tests run in headless mode
4. Keep tests fast (< 10s per test max)
5. Use helper functions for common operations

## Configuration

### `.vscode-test.mjs`
The test configuration file defines two test profiles:
- **integration**: All tests in headless mode (default)
- **performance**: Performance tests in headful mode with GPU access

Customize test behavior by modifying this file (e.g., VS Code version, launch args, Mocha options).

## References

- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [@vscode/test-cli Documentation](https://github.com/microsoft/vscode-test/tree/main/lib/cli)
- [@vscode/test-electron Documentation](https://github.com/microsoft/vscode-test)
- [Mocha Documentation](https://mochajs.org/)
