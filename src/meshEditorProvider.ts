import * as vscode from 'vscode';
import * as path from 'path';
import { log } from './extension';
import { validateMeshFile, formatFileSize, getFileTypeDescription } from './utils/fileUtils';

/**
 * Provider for mesh file custom editor
 */
export class MeshEditorProvider implements vscode.CustomReadonlyEditorProvider {
    public static readonly viewType = 'prepro-light.meshEditor';

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly outputChannel: vscode.OutputChannel
    ) {}

    /**
     * Open a custom document
     */
    async openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        log(`Opening custom document: ${uri.fsPath}`);

        return {
            uri,
            dispose: () => {
                log(`Disposing custom document: ${uri.fsPath}`);
            }
        };
    }

    /**
     * Resolve the webview editor
     */
    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        log(`Resolving custom editor for: ${document.uri.fsPath}`);

        // Configure webview
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'),
                vscode.Uri.joinPath(this.context.extensionUri, 'media')
            ]
        };

        // Set webview HTML content
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document.uri);

        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(
            message => this.handleMessage(message, webviewPanel, document),
            undefined,
            this.context.subscriptions
        );

        // Load mesh file data
        await this.loadMeshFile(document.uri, webviewPanel);
    }

    /**
     * Load mesh file and send to webview
     */
    private async loadMeshFile(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel): Promise<void> {
        try {
            log(`Loading mesh file: ${uri.fsPath}`);

            // Read file content
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const fileName = path.basename(uri.fsPath);
            const fileExtension = path.extname(uri.fsPath).toLowerCase();

            // Validate file
            const validation = validateMeshFile(fileName, fileContent.byteLength);

            if (!validation.valid) {
                log(`File validation failed: ${validation.error}`);
                vscode.window.showErrorMessage(`Cannot load mesh file: ${validation.error}`);
                webviewPanel.webview.postMessage({
                    type: 'error',
                    data: {
                        message: validation.error
                    }
                });
                return;
            }

            // Show warning for large files
            if (validation.warning) {
                log(`Warning: ${validation.warning}`);
                vscode.window.showWarningMessage(validation.warning);
            }

            // Log file information
            const fileInfo = `${fileName} (${getFileTypeDescription(fileExtension)}, ${formatFileSize(validation.fileSize)})`;
            log(`Loading ${fileInfo}`);
            this.outputChannel.appendLine(`Loading mesh file: ${fileInfo}`);

            // Send file data to webview
            webviewPanel.webview.postMessage({
                type: 'loadMesh',
                data: {
                    fileName,
                    fileExtension,
                    fileSize: validation.fileSize,
                    fileType: getFileTypeDescription(fileExtension),
                    content: Array.from(fileContent)
                }
            });

            log(`Mesh file loaded successfully: ${fileName}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            log(`Error loading mesh file: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to load mesh file: ${errorMessage}`);
            webviewPanel.webview.postMessage({
                type: 'error',
                data: {
                    message: errorMessage
                }
            });
        }
    }

    /**
     * Handle messages from the webview
     */
    private handleMessage(message: any, _webviewPanel: vscode.WebviewPanel, _document: vscode.CustomDocument): void {
        switch (message.type) {
            case 'ready':
                log('Webview is ready');
                break;

            case 'error':
                log(`Webview error: ${message.message}`);
                vscode.window.showErrorMessage(message.message);
                break;

            case 'info':
                log(`Webview info: ${message.message}`);
                this.outputChannel.appendLine(message.message);
                break;

            default:
                log(`Unknown message type: ${message.type}`);
        }
    }

    /**
     * Generate HTML for the webview
     */
    private getHtmlForWebview(webview: vscode.Webview, _documentUri: vscode.Uri): string {
        // Get URIs for webview resources
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'webview.js')
        );

        // Use a nonce to allow only specific scripts to run
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';
        style-src ${webview.cspSource} 'unsafe-inline';
        script-src 'nonce-${nonce}';
        img-src ${webview.cspSource} data:;
        connect-src ${webview.cspSource};">
    <title>Mesh Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        #viewer-container {
            width: 100%;
            height: 100%;
            position: relative;
        }
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            font-family: var(--vscode-font-family);
        }
        #error {
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            font-family: var(--vscode-font-family);
            color: var(--vscode-errorForeground);
        }
    </style>
</head>
<body>
    <div id="viewer-container">
        <div id="loading">Loading mesh file...</div>
        <div id="error"></div>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

/**
 * Generate a random nonce for Content Security Policy
 */
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
