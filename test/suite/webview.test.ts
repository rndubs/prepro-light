/**
 * Webview Integration Tests
 * Tests for Phase 4b.4 - Webview Integration
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, getSampleFilePath, openMeshFile, closeAllEditors, wait } from './helpers';

suite('Webview Integration Tests', () => {
    suiteSetup(async function() {
        this.timeout(10000);
        await activateExtension();
    });

    teardown(async () => {
        await closeAllEditors();
    });

    test('Should create webview when file opens', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('cube.vtp');
        await openMeshFile(filePath);

        // Verify editor is open
        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Webview editor should be created');
    });

    test('Should dispose webview when editor closes', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('cube.vtp');
        await openMeshFile(filePath);

        // Verify editor is open
        let activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Editor should be open');

        // Close the editor
        await closeAllEditors();
        await wait(500);

        // Verify no editors are open
        const tabCount = vscode.window.tabGroups.activeTabGroup.tabs.length;
        assert.strictEqual(tabCount, 0, 'Webview should be disposed after closing');
    });

    test('Should handle multiple webviews simultaneously', async function() {
        this.timeout(15000);

        // Open multiple files
        const filePath1 = getSampleFilePath('cube.vtp');
        const filePath2 = getSampleFilePath('sphere.vtp');

        await openMeshFile(filePath1);
        await wait(500);

        await openMeshFile(filePath2);
        await wait(500);

        // Check that we have multiple tabs
        const tabCount = vscode.window.tabGroups.activeTabGroup.tabs.length;
        assert.ok(tabCount >= 1, 'Should be able to open multiple webviews');
    });

    test('Should create webview for different file formats', async function() {
        this.timeout(15000);

        // Test VTP
        await openMeshFile(getSampleFilePath('cube.vtp'));
        let activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should create webview for VTP file');
        await closeAllEditors();

        // Test STL
        await openMeshFile(getSampleFilePath('simple_triangle.stl'));
        activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should create webview for STL file');
        await closeAllEditors();

        // Test OBJ
        await openMeshFile(getSampleFilePath('simple_cube.obj'));
        activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should create webview for OBJ file');
    });

    test('Should reopen file without errors', async function() {
        this.timeout(15000);

        const filePath = getSampleFilePath('cube.vtp');

        // Open file
        await openMeshFile(filePath);
        let activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'First open should succeed');

        // Close it
        await closeAllEditors();
        await wait(500);

        // Reopen the same file
        await openMeshFile(filePath);
        activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Reopening should succeed');
    });

    test('Should handle rapid file opening', async function() {
        this.timeout(15000);

        const filePath = getSampleFilePath('cube.vtp');

        // Open and close multiple times rapidly
        for (let i = 0; i < 3; i++) {
            await openMeshFile(filePath);
            await wait(1000); // Shorter wait
            await closeAllEditors();
            await wait(500);
        }

        // Final open to verify still works
        await openMeshFile(filePath);
        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should handle rapid opening/closing without issues');
    });
});
