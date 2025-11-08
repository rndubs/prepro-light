/**
 * VS Code test configuration
 * @see https://github.com/microsoft/vscode-test-cli
 */

import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
    {
        label: 'integration',
        files: 'dist/test/suite/**/*.test.js',
        version: 'stable',
        mocha: {
            ui: 'tdd',
            timeout: 10000,
            color: true
        },
        launchArgs: [
            // Minimal args to avoid macOS Electron restrictions
        ],
        // Run in headless mode for regular integration tests
        // GPU will be unavailable, which is expected
        env: {
            // Force headless mode
            DISPLAY: process.env.DISPLAY || ''
        }
    },
    {
        label: 'performance',
        files: 'dist/test/suite/performance.test.js',
        version: 'stable',
        mocha: {
            ui: 'tdd',
            timeout: 60000,  // Longer timeout for performance tests
            color: true
        },
        launchArgs: [
            // Minimal args to avoid macOS Electron restrictions
            // Running in headful mode to get GPU access
        ],
        // Headful mode for performance tests (allows GPU)
        // No DISPLAY override
    }
]);
