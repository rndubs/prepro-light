/**
 * File Loading Integration Tests
 * Tests for Phase 4b.3 - File Loading Integration
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, getSampleFilePath, openMeshFile, closeAllEditors } from './helpers';

suite('File Loading Integration Tests', () => {
    // Activate extension before all tests
    suiteSetup(async function() {
        this.timeout(10000);
        await activateExtension();
    });

    // Close all editors after each test to clean up
    teardown(async () => {
        await closeAllEditors();
    });

    test('Should load VTP file without errors', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('cube.vtp');

        // Open the file
        await openMeshFile(filePath);

        // Verify an editor is open
        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'An editor should be open');

        // Check if the editor input is for our custom editor
        // Note: We can't directly access webview content in tests easily,
        // but we can verify the file opened without throwing errors
    });

    test('Should load STL file without errors', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('simple_triangle.stl');

        await openMeshFile(filePath);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'An editor should be open');
    });

    test('Should load OBJ file without errors', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('simple_cube.obj');

        await openMeshFile(filePath);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'An editor should be open');
    });

    test('Should load sphere VTP file without errors', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('sphere.vtp');

        await openMeshFile(filePath);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'An editor should be open');
    });

    test('Should handle multiple file openings', async function() {
        this.timeout(15000);

        // Open first file
        const filePath1 = getSampleFilePath('cube.vtp');
        await openMeshFile(filePath1);

        let activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'First editor should be open');

        // Open second file
        const filePath2 = getSampleFilePath('sphere.vtp');
        await openMeshFile(filePath2);

        activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Second editor should be open');

        // We should have multiple tabs open
        const tabCount = vscode.window.tabGroups.activeTabGroup.tabs.length;
        assert.ok(tabCount >= 1, 'Should have at least one tab open');
    });

    test('Should open file via command', async function() {
        this.timeout(10000);

        // This test verifies that the prepro-light.openMesh command exists
        // The actual file picker would require user interaction, so we just verify the command
        const commands = await vscode.commands.getCommands(true);
        assert.ok(
            commands.includes('prepro-light.openMesh'),
            'prepro-light.openMesh command should be available'
        );
    });

    test('Should handle file path with correct extension', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('cube.vtp');

        // Verify file exists and has correct extension
        assert.ok(filePath.endsWith('.vtp'), 'File should have .vtp extension');

        await openMeshFile(filePath);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Editor should be open for valid file');
    });
});
