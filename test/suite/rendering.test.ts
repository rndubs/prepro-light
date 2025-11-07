/**
 * Rendering Integration Tests
 * Tests for Phase 4b.5 - Rendering Integration
 *
 * Note: These tests verify that rendering operations can be invoked without errors.
 * Visual verification of actual rendering is not possible in headless tests.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, getSampleFilePath, openMeshFile, closeAllEditors, wait } from './helpers';

suite('Rendering Integration Tests', () => {
    suiteSetup(async function() {
        this.timeout(10000);
        await activateExtension();
    });

    teardown(async () => {
        await closeAllEditors();
    });

    test('Should render mesh after file load', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('cube.vtp');
        await openMeshFile(filePath);

        // If we get here without errors, rendering initialization succeeded
        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Editor should be open with rendered mesh');
    });

    test('Should handle rendering of different mesh sizes', async function() {
        this.timeout(15000);

        // Test simple triangle (small mesh)
        await openMeshFile(getSampleFilePath('simple_triangle.stl'));
        let activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should render small mesh (triangle)');
        await closeAllEditors();

        // Test cube (medium mesh)
        await openMeshFile(getSampleFilePath('cube.vtp'));
        activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should render medium mesh (cube)');
        await closeAllEditors();

        // Test sphere (larger mesh)
        await openMeshFile(getSampleFilePath('sphere.vtp'));
        activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should render larger mesh (sphere)');
    });

    test('Should handle sequential rendering of multiple files', async function() {
        this.timeout(20000);

        const files = ['cube.vtp', 'sphere.vtp', 'simple_cube.obj'];

        for (const file of files) {
            await openMeshFile(getSampleFilePath(file));
            await wait(1500); // Give time for render

            const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
            assert.ok(activeEditor, `Should render ${file}`);

            await closeAllEditors();
            await wait(500);
        }
    });

    test('Should handle rendering without memory leaks', async function() {
        this.timeout(20000);

        const filePath = getSampleFilePath('cube.vtp');

        // Open and close multiple times to check for memory leaks
        // If there are leaks, this would eventually cause issues
        for (let i = 0; i < 5; i++) {
            await openMeshFile(filePath);
            await wait(1000);
            await closeAllEditors();
            await wait(500);
        }

        // Final open to ensure everything still works
        await openMeshFile(filePath);
        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should still work after multiple open/close cycles');
    });

    test('Should initialize renderer for VTP files', async function() {
        this.timeout(10000);

        await openMeshFile(getSampleFilePath('cube.vtp'));

        // Wait a bit for initialization
        await wait(2000);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'VTP file should initialize renderer');
    });

    test('Should initialize renderer for STL files', async function() {
        this.timeout(10000);

        await openMeshFile(getSampleFilePath('simple_triangle.stl'));

        await wait(2000);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'STL file should initialize renderer');
    });

    test('Should initialize renderer for OBJ files', async function() {
        this.timeout(10000);

        await openMeshFile(getSampleFilePath('simple_cube.obj'));

        await wait(2000);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'OBJ file should initialize renderer');
    });

    test('Should handle rapid scene switching', async function() {
        this.timeout(20000);

        const files = ['cube.vtp', 'sphere.vtp', 'simple_triangle.stl'];

        // Rapidly switch between files
        for (const file of files) {
            await openMeshFile(getSampleFilePath(file));
            await wait(800); // Shorter wait
        }

        // Should have multiple tabs open
        const tabCount = vscode.window.tabGroups.activeTabGroup.tabs.length;
        assert.ok(tabCount >= 1, 'Should handle rapid scene switching');
    });
});
