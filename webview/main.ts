/**
 * Webview entry point
 * This script runs in the webview context and handles mesh visualization
 */

import { VTKRenderer } from './vtkRenderer';
import { loadMeshFile } from './meshLoader';

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

// VTK.js renderer
let vtkRenderer: VTKRenderer | null = null;

/**
 * Initialize the webview
 */
function initialize() {
    console.log('Initializing mesh viewer webview...');

    // Get DOM elements
    loadingElement = document.getElementById('loading');
    errorElement = document.getElementById('error');
    viewerContainer = document.getElementById('viewer-container');

    // Initialize VTK.js renderer
    if (viewerContainer) {
        try {
            vtkRenderer = new VTKRenderer(viewerContainer);
            console.log('VTK.js renderer created successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to create VTK.js renderer:', errorMessage);
            showError(`Failed to initialize 3D viewer: ${errorMessage}`);
            sendMessage('error', { message: errorMessage });
            return;
        }
    }

    // Set up message listener
    window.addEventListener('message', handleMessage);

    // Handle window resize
    window.addEventListener('resize', () => {
        if (vtkRenderer) {
            vtkRenderer.resize();
        }
    });

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
async function handleLoadMesh(data: any) {
    try {
        console.log('Loading mesh file:', data.fileName);
        console.log('File type:', data.fileType);
        console.log('File size:', data.fileSize, 'bytes');

        // Show loading message
        if (loadingElement) {
            loadingElement.textContent = `Loading ${data.fileName}...`;
            loadingElement.style.display = 'block';
        }

        sendMessage('info', { message: `Loading mesh: ${data.fileName} (${data.fileType})` });

        if (!vtkRenderer) {
            showError('VTK.js renderer not initialized');
            sendMessage('error', { message: 'VTK.js renderer not initialized' });
            return;
        }

        // Convert content array back to Uint8Array
        const fileContent = new Uint8Array(data.content);

        // Parse the mesh file using the appropriate reader
        const loadResult = await loadMeshFile(data.fileExtension, fileContent);

        if (!loadResult.success) {
            showError(loadResult.error || 'Failed to load mesh file');
            sendMessage('error', { message: loadResult.error || 'Failed to load mesh file' });
            return;
        }

        // Hide loading indicator
        hideLoading();

        // Display the loaded mesh
        vtkRenderer.displayMesh(loadResult.polyData, loadResult.info);

        // Show file information
        let infoMessage = `Mesh loaded: ${data.fileName}`;
        if (loadResult.info) {
            infoMessage += `\n  Points: ${loadResult.info.numberOfPoints.toLocaleString()}`;
            infoMessage += `\n  Cells: ${loadResult.info.numberOfCells.toLocaleString()}`;
            if (loadResult.info.scalarArrayNames.length > 0) {
                infoMessage += `\n  Data arrays: ${loadResult.info.scalarArrayNames.join(', ')}`;
            }
        }

        console.log(infoMessage);
        sendMessage('info', { message: infoMessage });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error loading mesh:', errorMessage);
        showError(`Failed to load mesh: ${errorMessage}`);
        sendMessage('error', { message: errorMessage });
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
