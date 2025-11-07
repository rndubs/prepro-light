# Test Suite for Prepro Light Extension

This directory contains integration tests for the Prepro Light VS Code extension, implementing Phase 4b of the development plan.

## Test Infrastructure

### Framework
- **Test Runner**: `@vscode/test-electron` - Official VS Code extension test framework
- **Test Framework**: Mocha (TDD interface)
- **Assertions**: Node.js built-in `assert` module
- **Environment**: Headless Electron (Xvfb on Linux)

### Test Structure

```
test/
├── runTest.ts              # Test runner entry point
├── suite/
│   ├── index.ts           # Mocha test suite configuration
│   ├── helpers.ts         # Test utility functions
│   ├── extension.test.ts  # Extension activation tests (Phase 4b.2)
│   ├── fileLoading.test.ts # File loading tests (Phase 4b.3)
│   ├── webview.test.ts    # Webview integration tests (Phase 4b.4)
│   └── rendering.test.ts  # Rendering tests (Phase 4b.5)
├── fixtures/              # Test fixture files
└── README.md             # This file
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
- Verify VS Code can be downloaded (required by @vscode/test-electron)

### Tests Timeout
- Increase timeout in individual test: `this.timeout(15000)`
- Check if VS Code download is slow (first run only)
- Ensure system has enough resources

### Extension Not Found
- Verify extension ID in `helpers.ts` matches package.json
- Ensure extension is built before running tests
- Check that extension main file exists in dist/

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

## References

- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [@vscode/test-electron Documentation](https://github.com/microsoft/vscode-test)
- [Mocha Documentation](https://mochajs.org/)
