/**
 * Extension Activation Tests
 * Tests for Phase 4b.2 - Extension Activation
 */

import * as assert from 'assert';
import { getExtension, activateExtension, isCommandRegistered } from './helpers';

suite('Extension Activation Tests', () => {
    test('Extension should be present', () => {
        const ext = getExtension();
        assert.ok(ext, 'Extension should be found');
    });

    test('Extension should activate', async function() {
        this.timeout(10000); // Give more time for activation

        await activateExtension();
        const ext = getExtension();

        assert.ok(ext, 'Extension should be found');
        assert.strictEqual(ext.isActive, true, 'Extension should be active');
    });

    test('Extension should register custom editor provider', async () => {
        await activateExtension();

        // Unfortunately, VS Code doesn't provide a direct API to check if a custom editor is registered
        // We'll test this indirectly by checking if the extension activated successfully
        const ext = getExtension();
        assert.ok(ext?.isActive, 'Extension should be active (which means provider is registered)');
    });

    test('Extension should register prepro-light.openMesh command', async () => {
        await activateExtension();

        const commandExists = await isCommandRegistered('prepro-light.openMesh');
        assert.strictEqual(commandExists, true, 'Command prepro-light.openMesh should be registered');
    });

    test('Extension should have correct ID', () => {
        const ext = getExtension();
        assert.ok(ext, 'Extension should be found');

        // The extension ID format is publisher.name
        assert.strictEqual(
            ext.id.includes('prepro-light'),
            true,
            'Extension ID should contain prepro-light'
        );
    });

    test('Extension package should have correct metadata', () => {
        const ext = getExtension();
        assert.ok(ext, 'Extension should be found');

        const packageJSON = ext.packageJSON;
        assert.strictEqual(packageJSON.name, 'prepro-light', 'Package name should be prepro-light');
        assert.strictEqual(
            packageJSON.displayName,
            'Prepro Light - Mesh Preprocessing',
            'Display name should match'
        );
        assert.ok(packageJSON.version, 'Version should be defined');
    });

    test('Extension should define custom editor contribution', () => {
        const ext = getExtension();
        assert.ok(ext, 'Extension should be found');

        const packageJSON = ext.packageJSON;
        assert.ok(packageJSON.contributes, 'Should have contributions');
        assert.ok(packageJSON.contributes.customEditors, 'Should have custom editors');

        const customEditors = packageJSON.contributes.customEditors;
        assert.strictEqual(customEditors.length, 1, 'Should have one custom editor');
        assert.strictEqual(
            customEditors[0].viewType,
            'prepro-light.meshEditor',
            'Custom editor viewType should be prepro-light.meshEditor'
        );
    });

    test('Extension should support VTK file formats', () => {
        const ext = getExtension();
        assert.ok(ext, 'Extension should be found');

        const packageJSON = ext.packageJSON;
        const customEditor = packageJSON.contributes.customEditors[0];
        const selectors = customEditor.selector;

        // Check that all expected file formats are supported
        const patterns = selectors.map((s: any) => s.filenamePattern);
        assert.ok(patterns.includes('*.vtp'), 'Should support .vtp files');
        assert.ok(patterns.includes('*.vtu'), 'Should support .vtu files');
        assert.ok(patterns.includes('*.vti'), 'Should support .vti files');
        assert.ok(patterns.includes('*.stl'), 'Should support .stl files');
        assert.ok(patterns.includes('*.obj'), 'Should support .obj files');
    });
});
