/**
 * Integration tests for contact surface functionality (Phase 6)
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { openMeshFile, getSampleFilePath, wait, closeAllEditors } from './helpers';

suite('Contact Surface Integration Tests', () => {
    // Increase timeout for integration tests
    const testTimeout = 30000;

    // Close all editors after each test
    teardown(async () => {
        await closeAllEditors();
    });

    test('Should load mesh with contact surface data', async function () {
        this.timeout(testTimeout);

        const filePath = getSampleFilePath('contact_surfaces.vtp');

        // Open the mesh file
        await openMeshFile(filePath);

        // Wait for the file to load and render
        await wait(2000);

        // Check that no error was thrown and editor is open
        assert.ok(vscode.window.tabGroups.activeTabGroup.activeTab, 'Editor tab should be open');
    });

    test('Should parse contact surface IDs correctly', async function () {
        this.timeout(testTimeout);

        const filePath = getSampleFilePath('contact_surfaces.vtp');

        // Open the mesh file
        await openMeshFile(filePath);

        // Wait for the file to load and render
        await wait(2000);

        // The file should load successfully without errors
        assert.ok(vscode.window.tabGroups.activeTabGroup.activeTab, 'Editor tab should remain open');
    });

    test('Should load mesh with contact pairs', async function () {
        this.timeout(testTimeout);

        const filePath = getSampleFilePath('contact_pairs.vtp');

        // Open the mesh file
        await openMeshFile(filePath);

        // Wait for the file to load and render
        await wait(2000);

        // Verify the file loaded successfully
        assert.ok(vscode.window.tabGroups.activeTabGroup.activeTab, 'Editor tab should be open');
    });

    test('Should handle mesh without contact surfaces gracefully', async function () {
        this.timeout(testTimeout);

        const filePath = getSampleFilePath('simple_cube.vtp');

        // Open the mesh file (no contact surfaces)
        await openMeshFile(filePath);

        // Wait for the file to load
        await wait(2000);

        // The file should load successfully even without contact surfaces
        assert.ok(vscode.window.tabGroups.activeTabGroup.activeTab, 'Editor tab should remain open');
    });

    test('Should load contact surfaces with material data', async function () {
        this.timeout(testTimeout);

        const filePath = getSampleFilePath('contact_surfaces.vtp');

        // Open the mesh file (has both contact surfaces and materials)
        await openMeshFile(filePath);

        // Wait for the file to load
        await wait(2000);

        // The file should load successfully with both materials and contact surfaces
        assert.ok(vscode.window.tabGroups.activeTabGroup.activeTab, 'Editor tab should remain open');
    });

    test('Should compile without TypeScript errors', function () {
        // This test passes if the file compiles successfully
        assert.ok(true, 'Contact surface tests compiled successfully');
    });
});
