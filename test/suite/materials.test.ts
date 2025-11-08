/**
 * Material Visualization Integration Tests
 * Tests for Phase 5 - Material Assignment Visualization
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, getSampleFilePath, openMeshFile, closeAllEditors, wait } from './helpers';

suite('Material Visualization Tests', () => {
    suiteSetup(async function() {
        this.timeout(10000);
        await activateExtension();
    });

    teardown(async () => {
        await closeAllEditors();
    });

    test('Should load mesh with material data (test_materials.vtp)', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('test_materials.vtp');
        await openMeshFile(filePath);
        await wait(2000);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Editor should be open with mesh containing materials');
    });

    test('Should load mesh with multiple materials (multi_material_cubes.vtp)', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('multi_material_cubes.vtp');
        await openMeshFile(filePath);
        await wait(2000);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Editor should be open with multi-material mesh');
    });

    test('Should load mesh with complex materials (complex_materials.vtp)', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('complex_materials.vtp');
        await openMeshFile(filePath);
        await wait(2000);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Editor should be open with complex material mesh');
    });

    test('Should handle meshes without material data', async function() {
        this.timeout(10000);

        const filePath = getSampleFilePath('cube.vtp');
        await openMeshFile(filePath);
        await wait(2000);

        const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Editor should be open even without materials');
    });

    test('Should sequentially load material meshes without errors', async function() {
        this.timeout(20000);

        const materialFiles = [
            'test_materials.vtp',
            'multi_material_cubes.vtp',
            'complex_materials.vtp'
        ];

        for (const file of materialFiles) {
            await openMeshFile(getSampleFilePath(file));
            await wait(1500);

            const activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
            assert.ok(activeEditor, `Should load ${file}`);

            await closeAllEditors();
            await wait(500);
        }
    });

    test('Should handle switching between material and non-material meshes', async function() {
        this.timeout(15000);

        // Load mesh with materials
        await openMeshFile(getSampleFilePath('test_materials.vtp'));
        await wait(1500);
        let activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should load material mesh');

        await closeAllEditors();
        await wait(500);

        // Load mesh without materials
        await openMeshFile(getSampleFilePath('cube.vtp'));
        await wait(1500);
        activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should load non-material mesh');

        await closeAllEditors();
        await wait(500);

        // Load material mesh again
        await openMeshFile(getSampleFilePath('multi_material_cubes.vtp'));
        await wait(1500);
        activeEditor = vscode.window.tabGroups.activeTabGroup.activeTab;
        assert.ok(activeEditor, 'Should load material mesh again');
    });
});
