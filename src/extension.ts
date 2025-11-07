import * as vscode from 'vscode';
import { MeshEditorProvider } from './meshEditorProvider';

let outputChannel: vscode.OutputChannel;

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext) {
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('Prepro Light');
    log('Extension "prepro-light" is now activating...');

    // Register the custom editor provider for mesh files
    const provider = new MeshEditorProvider(context, outputChannel);
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            MeshEditorProvider.viewType,
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
                supportsMultipleEditorsPerDocument: false,
            }
        )
    );

    // Register command to open mesh files
    context.subscriptions.push(
        vscode.commands.registerCommand('prepro-light.openMesh', async () => {
            const options: vscode.OpenDialogOptions = {
                canSelectMany: false,
                openLabel: 'Open Mesh File',
                filters: {
                    'Mesh Files': ['vtp', 'vtu', 'vti', 'stl', 'obj'],
                    'VTK Files': ['vtp', 'vtu', 'vti'],
                    'All Files': ['*']
                }
            };

            const fileUri = await vscode.window.showOpenDialog(options);
            if (fileUri && fileUri[0]) {
                await vscode.commands.executeCommand('vscode.openWith', fileUri[0], MeshEditorProvider.viewType);
            }
        })
    );

    log('Extension "prepro-light" is now active!');
}

/**
 * Deactivate the extension
 */
export function deactivate() {
    log('Extension "prepro-light" is now deactivated.');
    if (outputChannel) {
        outputChannel.dispose();
    }
}

/**
 * Log a message to the output channel
 */
export function log(message: string) {
    if (outputChannel) {
        const timestamp = new Date().toISOString();
        outputChannel.appendLine(`[${timestamp}] ${message}`);
    }
}
