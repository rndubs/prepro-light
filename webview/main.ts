/**
 * Webview entry point
 * This script runs in the webview context and handles mesh visualization
 */

// VS Code API (available in webview context)
declare const acquireVsCodeApi: () => {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
};

const vscode = acquireVsCodeApi();

// DOM elements
let loadingElement: HTMLElement | null;
let errorElement: HTMLElement | null;
let viewerContainer: HTMLElement | null;

/**
 * Initialize the webview
 */
function initialize() {
    console.log('Initializing mesh viewer webview...');

    // Get DOM elements
    loadingElement = document.getElementById('loading');
    errorElement = document.getElementById('error');
    viewerContainer = document.getElementById('viewer-container');

    // Set up message listener
    window.addEventListener('message', handleMessage);

    // Notify extension that webview is ready
    sendMessage('ready', {});

    console.log('Mesh viewer webview initialized');
}

/**
 * Handle messages from the extension
 */
function handleMessage(event: MessageEvent) {
    const message = event.data;

    switch (message.type) {
        case 'loadMesh':
            handleLoadMesh(message.data);
            break;

        default:
            console.warn('Unknown message type:', message.type);
    }
}

/**
 * Handle loading a mesh file
 */
function handleLoadMesh(data: any) {
    try {
        console.log('Loading mesh file:', data.fileName);
        sendMessage('info', { message: `Loading mesh: ${data.fileName}` });

        // Hide loading, show placeholder content
        hideLoading();

        // For now, just show file info (VTK.js integration will come in Phase 2)
        showMeshInfo(data);

        sendMessage('info', { message: `Mesh loaded: ${data.fileName} (${data.fileExtension})` });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error loading mesh:', errorMessage);
        showError(`Failed to load mesh: ${errorMessage}`);
        sendMessage('error', { message: errorMessage });
    }
}

/**
 * Show mesh information (placeholder for Phase 2 VTK.js integration)
 */
function showMeshInfo(data: any) {
    if (!viewerContainer) {
        return;
    }

    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        font-family: var(--vscode-font-family);
        font-size: 14px;
        padding: 20px;
        background-color: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;

    const contentSize = data.content ? data.content.length : 0;
    const sizeKB = (contentSize / 1024).toFixed(2);

    infoDiv.innerHTML = `
        <h2 style="margin-top: 0; color: var(--vscode-foreground);">Mesh File Loaded</h2>
        <p style="color: var(--vscode-descriptionForeground);">
            <strong>File:</strong> ${data.fileName}<br>
            <strong>Type:</strong> ${data.fileExtension}<br>
            <strong>Size:</strong> ${sizeKB} KB
        </p>
        <p style="color: var(--vscode-descriptionForeground); font-style: italic; margin-top: 20px;">
            3D visualization will be available in Phase 2<br>
            (VTK.js integration coming soon)
        </p>
    `;

    viewerContainer.appendChild(infoDiv);
}

/**
 * Show loading indicator
 */
function showLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Show error message
 */
function showError(message: string) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    hideLoading();
}

/**
 * Send message to extension
 */
function sendMessage(type: string, data: any) {
    vscode.postMessage({
        type,
        ...data
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
