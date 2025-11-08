/**
 * Performance Testing Suite
 * Measures file loading and rendering performance for different mesh sizes
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { activateExtension, closeAllEditors, wait, isWebGLAvailable } from './helpers';

interface PerformanceResult {
    fileName: string;
    fileSizeMB: number;
    nodeCount: string;
    format: string;
    loadTimeMs: number;
    success: boolean;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
}

suite('Performance Tests', () => {
    const results: PerformanceResult[] = [];
    const testMeshesDir = path.join(__dirname, '../../../test_meshes');
    let webglAvailable = false;

    // Activate extension before all tests
    suiteSetup(async function() {
        this.timeout(15000);
        await activateExtension();

        // Check if WebGL is available for performance testing
        webglAvailable = await isWebGLAvailable();

        if (!webglAvailable) {
            console.log('\n⚠️  WebGL is not available in this environment.');
            console.log('Performance tests require WebGL for realistic benchmarking.');
            console.log('Run with: npm run test:performance (headful mode with GPU enabled)');
            console.log('Tests will be skipped.\n');
        }
    });

    // Close all editors after each test
    teardown(async () => {
        await closeAllEditors();
    });

    // Print results after all tests
    suiteTeardown(async function() {
        printPerformanceResults(results);

        // Pause for 15 seconds to allow copying console output
        console.log('\n⏸️  Pausing for 15 seconds to allow copying console output...');
        console.log('    The test window will close automatically after the pause.\n');
        await wait(15000);
        console.log('✅ Pause complete. Test window will now close.');
    });

    /**
     * Helper to open a mesh file and measure load time
     *
     * Note: This test measures editor opening time, not actual mesh loading success.
     * Actual mesh loading errors will appear in the VS Code Developer Console.
     * To see real loading status, check the browser/Electron console output.
     */
    async function measureFileLoad(filePath: string): Promise<PerformanceResult> {
        const fileName = path.basename(filePath);
        const stats = fs.statSync(filePath);
        const fileSizeMB = stats.size / (1024 * 1024);

        // Extract metadata from filename (e.g., "mesh_20k_nodes.stl")
        const match = fileName.match(/mesh_(\d+[km])_nodes\.(\w+)/);
        const nodeCount = match ? match[1] : 'unknown';
        const format = match ? match[2].toUpperCase() : path.extname(filePath).slice(1).toUpperCase();

        // Check if file exceeds general size limit (100 MB)
        const MAX_FILE_SIZE_MB = 100;
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
            return {
                fileName,
                fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
                nodeCount,
                format,
                loadTimeMs: 0,
                success: false,
                skipped: true,
                skipReason: `File exceeds ${MAX_FILE_SIZE_MB} MB limit`
            };
        }

        // Check VTP-specific size limit (ASCII VTP files have lower limits due to parsing)
        const MAX_VTP_SIZE_MB = 30;
        if (format === 'VTP' && fileSizeMB > MAX_VTP_SIZE_MB) {
            return {
                fileName,
                fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
                nodeCount,
                format,
                loadTimeMs: 0,
                success: false,
                skipped: true,
                skipReason: `ASCII VTP file exceeds ${MAX_VTP_SIZE_MB} MB browser parsing limit`
            };
        }

        try {
            const uri = vscode.Uri.file(filePath);

            // Measure load time
            const startTime = Date.now();

            // Open the file with the custom editor
            await vscode.commands.executeCommand('vscode.openWith', uri, 'prepro-light.meshEditor');

            // Wait for webview to initialize and render
            // The actual rendering happens in the webview, so we wait a bit longer
            // to allow for both loading and initial render
            await wait(3000);

            const endTime = Date.now();
            const loadTimeMs = endTime - startTime;

            // Verify an editor opened
            const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
            const success = !!activeEditor;

            // NOTE: This only confirms the editor opened, not that the mesh loaded successfully.
            // Check the Developer Console for actual loading errors from the webview.
            console.log(`Opened ${fileName} - Check webview console for actual load status`);

            return {
                fileName,
                fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
                nodeCount,
                format,
                loadTimeMs,
                success
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                fileName,
                fileSizeMB: parseFloat(fileSizeMB.toFixed(2)),
                nodeCount,
                format,
                loadTimeMs: 0,
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Get all mesh files from test_meshes directory
     */
    function getTestMeshFiles(): string[] {
        if (!fs.existsSync(testMeshesDir)) {
            return [];
        }

        const files = fs.readdirSync(testMeshesDir)
            .filter(f => /\.(stl|obj|vtp)$/i.test(f))
            .map(f => path.join(testMeshesDir, f))
            .sort((a, b) => {
                // Sort by file size for consistent test order
                const sizeA = fs.statSync(a).size;
                const sizeB = fs.statSync(b).size;
                return sizeA - sizeB;
            });

        return files;
    }

    // Generate dynamic tests for each mesh file
    const testFiles = getTestMeshFiles();

    if (testFiles.length === 0) {
        test('No test mesh files found - run generate_test_meshes.py first', function() {
            // Skip if WebGL not available
            if (!webglAvailable) {
                this.skip();
            } else {
                assert.fail(
                    `No test files found in ${testMeshesDir}. ` +
                    'Run "python3 generate_test_meshes.py" to generate test meshes.'
                );
            }
        });
    } else {
        // Create a test for each mesh file
        testFiles.forEach((filePath) => {
            const fileName = path.basename(filePath);

            test(`Performance: Load ${fileName}`, async function() {
                // Skip if WebGL not available
                if (!webglAvailable) {
                    this.skip();
                    return;
                }

                // Increase timeout for larger files
                this.timeout(30000);

                console.log(`\n📂 Testing: ${fileName}...`);
                const result = await measureFileLoad(filePath);
                results.push(result);

                if (result.skipped) {
                    console.log(`⏭️  Skipped: ${fileName} - ${result.skipReason}`);
                    this.skip();
                    return;
                }

                // Log the result (success or failure)
                if (result.success) {
                    console.log(
                        `✅ ${fileName}: ${result.loadTimeMs}ms (${result.fileSizeMB} MB)`
                    );
                } else {
                    console.log(
                        `❌ ${fileName}: FAILED - ${result.error || 'Unknown error'}`
                    );
                }

                // Assert that the file loaded successfully
                if (!result.success) {
                    assert.fail(
                        `Failed to load ${fileName}: ${result.error || 'Unknown error'}`
                    );
                }
            });
        });
    }
});

/**
 * Print formatted performance results
 */
function printPerformanceResults(results: PerformanceResult[]): void {
    if (results.length === 0) {
        return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TEST RESULTS');
    console.log('='.repeat(80));
    console.log();

    // Group by format
    const formats = [...new Set(results.map(r => r.format))].sort();

    formats.forEach(format => {
        const formatResults = results
            .filter(r => r.format === format)
            .sort((a, b) => a.fileSizeMB - b.fileSizeMB);

        console.log(`${format} Files:`);
        console.log('-'.repeat(80));
        console.log(
            'Nodes'.padEnd(10) +
            'Size (MB)'.padEnd(12) +
            'Load Time (ms)'.padEnd(18) +
            'Status'
        );
        console.log('-'.repeat(80));

        formatResults.forEach(result => {
            const nodeCol = result.nodeCount.padEnd(10);
            const sizeCol = result.fileSizeMB.toFixed(2).padEnd(12);
            const timeCol = result.success
                ? result.loadTimeMs.toString().padEnd(18)
                : 'N/A'.padEnd(18);

            let status = '';
            if (result.skipped) {
                status = `SKIPPED (${result.skipReason})`;
            } else if (result.success) {
                status = '✓ SUCCESS';
            } else {
                status = `✗ FAILED (${result.error})`;
            }

            console.log(nodeCol + sizeCol + timeCol + status);
        });

        console.log();
    });

    // Print summary statistics
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
        console.log('Summary Statistics:');
        console.log('-'.repeat(80));

        const avgTime = successful.reduce((sum, r) => sum + r.loadTimeMs, 0) / successful.length;
        const minTime = Math.min(...successful.map(r => r.loadTimeMs));
        const maxTime = Math.max(...successful.map(r => r.loadTimeMs));

        console.log(`  Total files tested: ${results.length}`);
        console.log(`  Successful loads: ${successful.length}`);
        console.log(`  Failed loads: ${results.filter(r => !r.success && !r.skipped).length}`);
        console.log(`  Skipped (too large): ${results.filter(r => r.skipped).length}`);
        console.log(`  Average load time: ${avgTime.toFixed(0)} ms`);
        console.log(`  Fastest load: ${minTime} ms`);
        console.log(`  Slowest load: ${maxTime} ms`);
        console.log();

        // Performance analysis
        console.log('Performance Analysis:');
        console.log('-'.repeat(80));

        successful.forEach(result => {
            const loadSpeed = result.fileSizeMB / (result.loadTimeMs / 1000); // MB/s
            console.log(
                `  ${result.fileName.padEnd(30)} - ${loadSpeed.toFixed(2)} MB/s`
            );
        });
    }

    console.log('\n' + '='.repeat(80));
}
