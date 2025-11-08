/**
 * Webview entry point
 * This script runs in the webview context and handles mesh visualization
 */

import { VTKRenderer, RenderMode } from './vtkRenderer';
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
let renderModeSelect: HTMLSelectElement | null;
let resetCameraButton: HTMLButtonElement | null;
let backgroundColorInput: HTMLInputElement | null;
let showAxesCheckbox: HTMLInputElement | null;
let materialSection: HTMLElement | null;
let showMaterialsCheckbox: HTMLInputElement | null;
let materialPanel: HTMLElement | null;
let closeMaterialPanelButton: HTMLButtonElement | null;
let materialList: HTMLElement | null;
let contactSection: HTMLElement | null;
let showContactsCheckbox: HTMLInputElement | null;
let contactPanel: HTMLElement | null;
let closeContactPanelButton: HTMLButtonElement | null;
let contactList: HTMLElement | null;

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
    renderModeSelect = document.getElementById('renderMode') as HTMLSelectElement;
    resetCameraButton = document.getElementById('resetCamera') as HTMLButtonElement;
    backgroundColorInput = document.getElementById('backgroundColor') as HTMLInputElement;
    showAxesCheckbox = document.getElementById('showAxes') as HTMLInputElement;
    materialSection = document.getElementById('materialSection');
    showMaterialsCheckbox = document.getElementById('showMaterials') as HTMLInputElement;
    materialPanel = document.getElementById('materialPanel');
    closeMaterialPanelButton = document.getElementById('closeMaterialPanel') as HTMLButtonElement;
    materialList = document.getElementById('materialList');
    contactSection = document.getElementById('contactSection');
    showContactsCheckbox = document.getElementById('showContacts') as HTMLInputElement;
    contactPanel = document.getElementById('contactPanel');
    closeContactPanelButton = document.getElementById('closeContactPanel') as HTMLButtonElement;
    contactList = document.getElementById('contactList');

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

    // Material coloring checkbox
    if (showMaterialsCheckbox) {
        showMaterialsCheckbox.addEventListener('change', () => {
            if (vtkRenderer && showMaterialsCheckbox) {
                vtkRenderer.setMaterialColoringEnabled(showMaterialsCheckbox.checked);
                console.log(`Material coloring: ${showMaterialsCheckbox.checked}`);
            }
        });
    }

    // Close material panel button
    if (closeMaterialPanelButton) {
        closeMaterialPanelButton.addEventListener('click', () => {
            if (materialPanel) {
                materialPanel.style.display = 'none';
                console.log('Material panel closed');
            }
        });
    }

    // Contact surface coloring checkbox
    if (showContactsCheckbox) {
        showContactsCheckbox.addEventListener('change', () => {
            if (vtkRenderer && showContactsCheckbox) {
                vtkRenderer.setContactSurfaceColoringEnabled(showContactsCheckbox.checked);
                console.log(`Contact surface coloring: ${showContactsCheckbox.checked}`);
            }
        });
    }

    // Close contact panel button
    if (closeContactPanelButton) {
        closeContactPanelButton.addEventListener('click', () => {
            if (contactPanel) {
                contactPanel.style.display = 'none';
                console.log('Contact panel closed');
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
 * RGB to hex color conversion
 */
function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Populate the material legend
 */
function populateMaterialLegend(): void {
    if (!vtkRenderer || !materialList) {
        return;
    }

    const meshInfo = vtkRenderer.getMeshInfo();
    if (!meshInfo || !meshInfo.hasMaterials || meshInfo.materials.length === 0) {
        // Hide material UI if no materials
        if (materialSection) {
            materialSection.style.display = 'none';
        }
        if (materialPanel) {
            materialPanel.style.display = 'none';
        }
        return;
    }

    console.log(`Populating material legend with ${meshInfo.materials.length} materials`);

    // Show material UI
    if (materialSection) {
        materialSection.style.display = 'block';
    }
    if (materialPanel) {
        materialPanel.style.display = 'block';
    }

    // Clear existing content
    materialList.innerHTML = '';

    // Get material colors from the renderer (using the same color generation logic)
    const materials = meshInfo.materials;

    // Generate the same colors as in vtkRenderer
    const categoricalColors = [
        [0.89, 0.10, 0.11],  // Red
        [0.22, 0.49, 0.72],  // Blue
        [0.30, 0.69, 0.29],  // Green
        [0.60, 0.31, 0.64],  // Purple
        [1.00, 0.50, 0.00],  // Orange
        [1.00, 1.00, 0.20],  // Yellow
        [0.65, 0.34, 0.16],  // Brown
        [0.97, 0.51, 0.75],  // Pink
        [0.50, 0.50, 0.50],  // Gray
        [0.60, 0.96, 0.60],  // Light Green
        [0.75, 0.73, 0.85],  // Lavender
        [1.00, 0.84, 0.00],  // Gold
    ];

    // Create material items
    materials.forEach((material, index) => {
        const materialItem = document.createElement('div');
        materialItem.className = 'material-item';
        materialItem.dataset.materialId = material.id.toString();

        // Get color for this material
        const color = index < categoricalColors.length ?
            categoricalColors[index] :
            [0.5, 0.5, 0.5];  // Fallback gray

        // Create color box
        const colorBox = document.createElement('div');
        colorBox.className = 'material-color-box';
        colorBox.style.backgroundColor = rgbToHex(color[0], color[1], color[2]);

        // Create info container
        const infoContainer = document.createElement('div');
        infoContainer.className = 'material-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'material-name';
        nameDiv.textContent = material.name;

        const statsDiv = document.createElement('div');
        statsDiv.className = 'material-stats';
        statsDiv.textContent = `${material.cellCount.toLocaleString()} cells (${material.percentage.toFixed(1)}%)`;

        infoContainer.appendChild(nameDiv);
        infoContainer.appendChild(statsDiv);

        materialItem.appendChild(colorBox);
        materialItem.appendChild(infoContainer);

        if (materialList) {
            materialList.appendChild(materialItem);
        }
    });

    console.log('Material legend populated');
}

/**
 * Populate the contact surface legend
 */
function populateContactSurfaceLegend(): void {
    if (!vtkRenderer || !contactList) {
        return;
    }

    const meshInfo = vtkRenderer.getMeshInfo();
    if (!meshInfo || !meshInfo.hasContactSurfaces || meshInfo.contactPairs.length === 0) {
        // Hide contact UI if no contact surfaces
        if (contactSection) {
            contactSection.style.display = 'none';
        }
        if (contactPanel) {
            contactPanel.style.display = 'none';
        }
        return;
    }

    console.log(`Populating contact surface legend with ${meshInfo.contactPairs.length} pairs`);

    // Show contact UI
    if (contactSection) {
        contactSection.style.display = 'block';
    }
    if (contactPanel) {
        contactPanel.style.display = 'block';
    }

    // Clear existing content
    contactList.innerHTML = '';

    // Get the same colors as in vtkRenderer
    const categoricalColors = [
        [1.00, 0.27, 0.00],  // Orange Red
        [0.00, 0.75, 1.00],  // Deep Sky Blue
        [1.00, 0.84, 0.00],  // Gold
        [0.50, 0.00, 0.50],  // Purple
        [0.00, 1.00, 0.50],  // Spring Green
        [1.00, 0.41, 0.71],  // Hot Pink
        [0.82, 0.41, 0.12],  // Chocolate
        [0.00, 1.00, 1.00],  // Cyan
        [1.00, 0.65, 0.00],  // Orange
        [0.54, 0.17, 0.89],  // Blue Violet
        [0.13, 0.70, 0.67],  // Light Sea Green
        [0.93, 0.51, 0.93],  // Violet
    ];

    // Create contact pair items
    meshInfo.contactPairs.forEach((pair) => {
        const pairDiv = document.createElement('div');
        pairDiv.className = 'contact-pair';

        // Pair header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'contact-pair-header';
        headerDiv.textContent = pair.name;
        pairDiv.appendChild(headerDiv);

        // Add master surface if present
        if (pair.master) {
            const masterDiv = createContactSurfaceElement(pair.master, categoricalColors, meshInfo.contactSurfaces);
            pairDiv.appendChild(masterDiv);
        }

        // Add slave surface if present
        if (pair.slave) {
            const slaveDiv = createContactSurfaceElement(pair.slave, categoricalColors, meshInfo.contactSurfaces);
            pairDiv.appendChild(slaveDiv);
        }

        if (contactList) {
            contactList.appendChild(pairDiv);
        }
    });

    console.log('Contact surface legend populated');
}

/**
 * Create a contact surface element for the legend
 */
function createContactSurfaceElement(surface: any, categoricalColors: number[][], allSurfaces: any[]): HTMLElement {
    const surfaceDiv = document.createElement('div');
    surfaceDiv.className = 'contact-surface';
    surfaceDiv.dataset.surfaceId = surface.id.toString();

    // Get color for this surface
    const surfaceIndex = allSurfaces.findIndex(s => s.id === surface.id);
    const color = surfaceIndex < categoricalColors.length ?
        categoricalColors[surfaceIndex] :
        [0.5, 0.5, 0.5];  // Fallback gray

    // Create color box
    const colorBox = document.createElement('div');
    colorBox.className = 'contact-color-box';
    colorBox.style.backgroundColor = rgbToHex(color[0], color[1], color[2]);

    // Create info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'contact-info';

    const typeDiv = document.createElement('div');
    typeDiv.className = 'contact-type';
    typeDiv.textContent = surface.type || 'surface';

    const nameDiv = document.createElement('div');
    nameDiv.textContent = `ID ${surface.id}`;

    const statsDiv = document.createElement('div');
    statsDiv.className = 'contact-stats';
    statsDiv.textContent = `${surface.cellCount.toLocaleString()} cells (${surface.percentage.toFixed(1)}%)`;

    infoContainer.appendChild(typeDiv);
    infoContainer.appendChild(nameDiv);
    infoContainer.appendChild(statsDiv);

    surfaceDiv.appendChild(colorBox);
    surfaceDiv.appendChild(infoContainer);

    return surfaceDiv;
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
        console.log('handleLoadMesh: About to hide loading...');
        hideLoading();
        console.log('handleLoadMesh: Loading hidden');

        // Display the loaded mesh
        console.log('handleLoadMesh: About to display mesh...');
        console.log('handleLoadMesh: polyData:', loadResult.polyData);
        console.log('handleLoadMesh: meshInfo:', loadResult.info);
        vtkRenderer.displayMesh(loadResult.polyData, loadResult.info);
        console.log('handleLoadMesh: Mesh displayed');

        // Populate material legend if materials are present
        console.log('handleLoadMesh: Populating material legend...');
        populateMaterialLegend();
        console.log('handleLoadMesh: Material legend populated');

        // Populate contact surface legend if contact surfaces are present
        console.log('handleLoadMesh: Populating contact surface legend...');
        populateContactSurfaceLegend();
        console.log('handleLoadMesh: Contact surface legend populated');

        // Show file information
        let infoMessage = `Mesh loaded: ${data.fileName}`;
        if (loadResult.info) {
            infoMessage += `\n  Points: ${loadResult.info.numberOfPoints.toLocaleString()}`;
            infoMessage += `\n  Cells: ${loadResult.info.numberOfCells.toLocaleString()}`;
            if (loadResult.info.scalarArrayNames.length > 0) {
                infoMessage += `\n  Data arrays: ${loadResult.info.scalarArrayNames.join(', ')}`;
            }
            if (loadResult.info.hasMaterials) {
                infoMessage += `\n  Materials: ${loadResult.info.materials.length} unique (${loadResult.info.materialArrayName})`;
            }
            if (loadResult.info.hasContactSurfaces) {
                infoMessage += `\n  Contact surfaces: ${loadResult.info.contactSurfaces.length} in ${loadResult.info.contactPairs.length} pairs (${loadResult.info.contactSurfaceArrayName})`;
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
