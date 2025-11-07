/**
 * Webview entry point
 * This script runs in the webview context and handles mesh visualization
 */

import { VTKRenderer, RenderMode } from './vtkRenderer';
import { loadMeshFile, MeshInfo } from './meshLoader';
import { MaterialColorScheme } from './materialColors';

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
let renderModeSelect: HTMLSelectElement | null;
let resetCameraButton: HTMLButtonElement | null;
let backgroundColorInput: HTMLInputElement | null;
let showAxesCheckbox: HTMLInputElement | null;
let showMaterialsCheckbox: HTMLInputElement | null;
let materialPanel: HTMLElement | null;
let materialList: HTMLElement | null;
let colorSchemeSelect: HTMLSelectElement | null;
let closeMaterialPanelButton: HTMLElement | null;
let showAllMaterialsButton: HTMLButtonElement | null;
let hideAllMaterialsButton: HTMLButtonElement | null;

// VTK.js renderer
let vtkRenderer: VTKRenderer | null = null;

// Current mesh info
let currentMeshInfo: MeshInfo | null = null;

/**
 * Initialize the webview
 */
function initialize() {
    console.log('Initializing mesh viewer webview...');

    // Get DOM elements
    loadingElement = document.getElementById('loading');
    errorElement = document.getElementById('error');
    viewerContainer = document.getElementById('viewer-container');
    renderModeSelect = document.getElementById('renderMode') as HTMLSelectElement;
    resetCameraButton = document.getElementById('resetCamera') as HTMLButtonElement;
    backgroundColorInput = document.getElementById('backgroundColor') as HTMLInputElement;
    showAxesCheckbox = document.getElementById('showAxes') as HTMLInputElement;
    showMaterialsCheckbox = document.getElementById('showMaterials') as HTMLInputElement;
    materialPanel = document.getElementById('material-panel');
    materialList = document.getElementById('materialList');
    colorSchemeSelect = document.getElementById('colorScheme') as HTMLSelectElement;
    closeMaterialPanelButton = document.getElementById('closeMaterialPanel');
    showAllMaterialsButton = document.getElementById('showAllMaterials') as HTMLButtonElement;
    hideAllMaterialsButton = document.getElementById('hideAllMaterials') as HTMLButtonElement;

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

    // Set up UI controls
    setupUIControls();

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
 * Set up UI control event handlers
 */
function setupUIControls() {
    // Render mode selector
    if (renderModeSelect) {
        renderModeSelect.addEventListener('change', () => {
            if (vtkRenderer && renderModeSelect) {
                const mode = renderModeSelect.value as RenderMode;
                vtkRenderer.setRenderMode(mode);
                console.log(`Render mode changed to: ${mode}`);
            }
        });
    }

    // Reset camera button
    if (resetCameraButton) {
        resetCameraButton.addEventListener('click', () => {
            if (vtkRenderer) {
                vtkRenderer.resetCamera();
                console.log('Camera reset');
            }
        });
    }

    // Background color picker
    if (backgroundColorInput) {
        backgroundColorInput.addEventListener('input', () => {
            if (vtkRenderer && backgroundColorInput) {
                const color = hexToRgb(backgroundColorInput.value);
                if (color) {
                    vtkRenderer.setBackground(color.r / 255, color.g / 255, color.b / 255);
                    console.log(`Background color changed to: ${backgroundColorInput.value}`);
                }
            }
        });
    }

    // Show axes checkbox
    if (showAxesCheckbox) {
        showAxesCheckbox.addEventListener('change', () => {
            if (vtkRenderer && showAxesCheckbox) {
                vtkRenderer.toggleOrientationWidget(showAxesCheckbox.checked);
                console.log(`Axes visibility: ${showAxesCheckbox.checked}`);
            }
        });
    }

    // Show materials checkbox
    if (showMaterialsCheckbox) {
        showMaterialsCheckbox.addEventListener('change', () => {
            if (vtkRenderer && showMaterialsCheckbox) {
                vtkRenderer.toggleMaterialVisualization(showMaterialsCheckbox.checked);

                // Show/hide material panel
                if (showMaterialsCheckbox.checked && currentMeshInfo?.hasMaterialData) {
                    showMaterialPanel();
                } else {
                    hideMaterialPanel();
                }
            }
        });
    }

    // Color scheme selector
    if (colorSchemeSelect) {
        colorSchemeSelect.addEventListener('change', () => {
            if (vtkRenderer && colorSchemeSelect) {
                const scheme = colorSchemeSelect.value as MaterialColorScheme;
                vtkRenderer.setMaterialColorScheme(scheme);

                // Update material list colors
                updateMaterialPanel(currentMeshInfo);
            }
        });
    }

    // Close material panel
    if (closeMaterialPanelButton) {
        closeMaterialPanelButton.addEventListener('click', () => {
            hideMaterialPanel();
            if (showMaterialsCheckbox) {
                showMaterialsCheckbox.checked = false;
                vtkRenderer?.toggleMaterialVisualization(false);
            }
        });
    }

    // Show all materials
    if (showAllMaterialsButton) {
        showAllMaterialsButton.addEventListener('click', () => {
            if (vtkRenderer) {
                vtkRenderer.showAllMaterials();

                // Update checkboxes
                const checkboxes = document.querySelectorAll('.material-checkbox');
                checkboxes.forEach((cb) => {
                    (cb as HTMLInputElement).checked = true;
                });
            }
        });
    }

    // Hide all materials
    if (hideAllMaterialsButton) {
        hideAllMaterialsButton.addEventListener('click', () => {
            if (vtkRenderer && currentMeshInfo?.materials) {
                // Hide all materials
                currentMeshInfo.materials.forEach(mat => {
                    if (vtkRenderer) {
                        vtkRenderer.setMaterialVisibility(mat.materialId, false);
                    }
                });

                // Update checkboxes
                const checkboxes = document.querySelectorAll('.material-checkbox');
                checkboxes.forEach((cb) => {
                    (cb as HTMLInputElement).checked = false;
                });
            }
        });
    }
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
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

        // Store current mesh info
        currentMeshInfo = loadResult.info || null;

        // Display the loaded mesh
        vtkRenderer.displayMesh(loadResult.polyData, loadResult.info);

        // Check if mesh has material data
        if (loadResult.info?.hasMaterialData) {
            // Enable materials checkbox
            if (showMaterialsCheckbox) {
                showMaterialsCheckbox.disabled = false;
                showMaterialsCheckbox.checked = true;
            }

            // Update material panel
            updateMaterialPanel(loadResult.info);

            // Show material panel
            showMaterialPanel();
        } else {
            // Disable materials checkbox
            if (showMaterialsCheckbox) {
                showMaterialsCheckbox.disabled = true;
                showMaterialsCheckbox.checked = false;
            }
        }

        // Show file information
        let infoMessage = `Mesh loaded: ${data.fileName}`;
        if (loadResult.info) {
            infoMessage += `\n  Points: ${loadResult.info.numberOfPoints.toLocaleString()}`;
            infoMessage += `\n  Cells: ${loadResult.info.numberOfCells.toLocaleString()}`;
            if (loadResult.info.scalarArrayNames.length > 0) {
                infoMessage += `\n  Data arrays: ${loadResult.info.scalarArrayNames.join(', ')}`;
            }
            if (loadResult.info.hasMaterialData && loadResult.info.materials) {
                infoMessage += `\n  Materials: ${loadResult.info.materials.length} found`;
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

/**
 * Show material panel
 */
function showMaterialPanel() {
    if (materialPanel) {
        materialPanel.classList.add('visible');
    }
}

/**
 * Hide material panel
 */
function hideMaterialPanel() {
    if (materialPanel) {
        materialPanel.classList.remove('visible');
    }
}

/**
 * Update material panel with material data
 */
function updateMaterialPanel(meshInfo: MeshInfo | null) {
    if (!meshInfo || !meshInfo.hasMaterialData || !meshInfo.materials) {
        return;
    }

    if (!materialList) {
        console.warn('Material list element not found');
        return;
    }

    // Clear existing material items
    materialList.innerHTML = '';

    // Get current mesh info from renderer to get updated colors
    const rendererMeshInfo = vtkRenderer?.getMeshInfo();
    const materials = rendererMeshInfo?.materials || meshInfo.materials;

    // Save reference to materialList for use in closure
    const listElement = materialList;

    // Create material items
    materials.forEach((mat) => {
        const materialItem = document.createElement('div');
        materialItem.className = 'material-item';

        // Color box
        const colorBox = document.createElement('div');
        colorBox.className = 'material-color-box';
        if (mat.color) {
            const r = Math.round(mat.color[0] * 255);
            const g = Math.round(mat.color[1] * 255);
            const b = Math.round(mat.color[2] * 255);
            colorBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        }
        materialItem.appendChild(colorBox);

        // Material info
        const info = document.createElement('div');
        info.className = 'material-info';
        const idSpan = document.createElement('div');
        idSpan.className = 'material-id';
        idSpan.textContent = mat.name || `Material ${mat.materialId}`;
        const statsSpan = document.createElement('div');
        statsSpan.className = 'material-stats';
        statsSpan.textContent = `${mat.cellCount.toLocaleString()} cells (${mat.percentage.toFixed(1)}%)`;
        info.appendChild(idSpan);
        info.appendChild(statsSpan);
        materialItem.appendChild(info);

        // Visibility checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'material-checkbox';
        checkbox.checked = !vtkRenderer?.getHiddenMaterials().has(mat.materialId);
        checkbox.addEventListener('change', () => {
            if (vtkRenderer) {
                vtkRenderer.setMaterialVisibility(mat.materialId, checkbox.checked);
            }
        });
        materialItem.appendChild(checkbox);

        // Click to highlight/select material
        materialItem.addEventListener('click', (e) => {
            // Don't trigger if clicking checkbox
            if (e.target === checkbox) {
                return;
            }

            // Toggle checkbox
            checkbox.checked = !checkbox.checked;
            if (vtkRenderer) {
                vtkRenderer.setMaterialVisibility(mat.materialId, checkbox.checked);
            }
        });

        listElement.appendChild(materialItem);
    });

    console.log(`Material panel updated with ${materials.length} materials`);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
