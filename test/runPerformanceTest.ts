/**
 * Performance test runner for VS Code extension tests
 * Runs in headful mode with GPU enabled for realistic performance benchmarking
 */

import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to test runner
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        console.log('Starting VS Code Extension Performance Tests...');
        console.log('Running in HEADFUL mode with GPU enabled for realistic benchmarking');
        console.log('Extension path:', extensionDevelopmentPath);
        console.log('Tests path:', extensionTestsPath);
        console.log();

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            // Use installed VS Code to avoid macOS Electron command-line flag restrictions
            // The downloaded test VS Code instances trigger macOS security restrictions
            reuseMachineInstall: true,
            // Empty launch args to avoid "bad option" errors on macOS
            launchArgs: []
        });

        console.log('\nAll performance tests completed!');
    } catch (err) {
        console.error('Failed to run performance tests:', err);
        process.exit(1);
    }
}

main();
