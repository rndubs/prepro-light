/**
 * Test helper utilities
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get the extension instance
 */
export function getExtension(): vscode.Extension<any> | undefined {
    return vscode.extensions.getExtension('prepro-light.prepro-light');
}

/**
 * Activate the extension if not already activated
 */
export async function activateExtension(): Promise<void> {
    const ext = getExtension();
    if (!ext) {
        throw new Error('Extension not found');
    }
    if (!ext.isActive) {
        await ext.activate();
    }
}

/**
 * Get path to a sample file
 */
export function getSampleFilePath(filename: string): string {
    return path.join(__dirname, '../../../samples', filename);
}

/**
 * Get path to a test fixture file
 */
export function getFixturePath(filename: string): string {
    return path.join(__dirname, '../../fixtures', filename);
}

/**
 * Open a mesh file with the custom editor
 */
export async function openMeshFile(filePath: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('vscode.openWith', uri, 'prepro-light.meshEditor');
    // Wait for webview to initialize
    await wait(2000);
}

/**
 * Close all editors
 */
export async function closeAllEditors(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await wait(500);
}

/**
 * Get the output channel content (if available)
 */
export function getOutputChannelContent(): string {
    // Note: VS Code doesn't provide direct API to read output channel content
    // This is a placeholder for future implementation
    // In practice, we might need to test logs differently
    return '';
}

/**
 * Check if a command is registered
 */
export async function isCommandRegistered(commandId: string): Promise<boolean> {
    const commands = await vscode.commands.getCommands(true);
    return commands.includes(commandId);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeoutMs: number = 5000,
    checkIntervalMs: number = 100
): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        const result = condition();
        const boolResult = typeof result === 'boolean' ? result : await result;
        if (boolResult) {
            return;
        }
        await wait(checkIntervalMs);
    }
    throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}

/**
 * Check if WebGL is available in the current environment
 * This is important for performance tests that need real rendering
 */
export async function isWebGLAvailable(): Promise<boolean> {
    try {
        // Create a test webview panel to check WebGL availability
        const panel = vscode.window.createWebviewPanel(
            'webglTest',
            'WebGL Test',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        // Test HTML that checks for WebGL support
        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <body>
                <script>
                    const vscode = acquireVsCodeApi();
                    const canvas = document.createElement('canvas');
                    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                    vscode.postMessage({ webglAvailable: !!gl });
                </script>
            </body>
            </html>
        `;

        // Wait for the webview to report back
        const webglAvailable = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, 3000);

            const disposable = panel.webview.onDidReceiveMessage((message) => {
                clearTimeout(timeout);
                disposable.dispose();
                resolve(message.webglAvailable === true);
            });
        });

        // Clean up
        panel.dispose();
        await wait(100);

        return webglAvailable;
    } catch (error) {
        console.error('Error checking WebGL availability:', error);
        return false;
    }
}
