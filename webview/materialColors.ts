/**
 * Material Color Utilities
 * Provides color mapping for material visualization
 */

// @ts-ignore
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
// @ts-ignore
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';

/**
 * Color scheme for materials
 */
export enum MaterialColorScheme {
    Default = 'default',
    Rainbow = 'rainbow',
    Pastel = 'pastel',
    Distinct = 'distinct'
}

/**
 * Generate distinct colors for materials using various schemes
 */
export function generateMaterialColors(numMaterials: number, scheme: MaterialColorScheme = MaterialColorScheme.Default): number[][] {
    switch (scheme) {
        case MaterialColorScheme.Rainbow:
            return generateRainbowColors(numMaterials);
        case MaterialColorScheme.Pastel:
            return generatePastelColors(numMaterials);
        case MaterialColorScheme.Distinct:
            return generateDistinctColors(numMaterials);
        default:
            return generateDefaultColors(numMaterials);
    }
}

/**
 * Generate default color scheme (distinct, saturated colors)
 */
function generateDefaultColors(numMaterials: number): number[][] {
    // Predefined distinct colors for common cases
    const predefinedColors = [
        [0.122, 0.467, 0.706], // Blue
        [1.000, 0.498, 0.055], // Orange
        [0.173, 0.627, 0.173], // Green
        [0.839, 0.153, 0.157], // Red
        [0.580, 0.404, 0.741], // Purple
        [0.549, 0.337, 0.294], // Brown
        [0.890, 0.467, 0.761], // Pink
        [0.498, 0.498, 0.498], // Gray
        [0.737, 0.741, 0.133], // Yellow-green
        [0.090, 0.745, 0.812]  // Cyan
    ];

    const colors: number[][] = [];

    for (let i = 0; i < numMaterials; i++) {
        if (i < predefinedColors.length) {
            colors.push(predefinedColors[i]);
        } else {
            // Generate additional colors using golden ratio
            const hue = (i * 0.618033988749895) % 1.0;
            colors.push(hsvToRgb(hue, 0.7, 0.95));
        }
    }

    return colors;
}

/**
 * Generate rainbow color scheme
 */
function generateRainbowColors(numMaterials: number): number[][] {
    const colors: number[][] = [];

    for (let i = 0; i < numMaterials; i++) {
        const hue = i / Math.max(numMaterials - 1, 1);
        colors.push(hsvToRgb(hue, 0.8, 0.9));
    }

    return colors;
}

/**
 * Generate pastel color scheme
 */
function generatePastelColors(numMaterials: number): number[][] {
    const colors: number[][] = [];

    for (let i = 0; i < numMaterials; i++) {
        const hue = (i * 0.618033988749895) % 1.0; // Golden ratio
        colors.push(hsvToRgb(hue, 0.3, 0.95));
    }

    return colors;
}

/**
 * Generate highly distinct colors (good for small number of materials)
 */
function generateDistinctColors(numMaterials: number): number[][] {
    const colors: number[][] = [];

    // Use maximum saturation and value for maximum distinction
    for (let i = 0; i < numMaterials; i++) {
        const hue = (i * 0.618033988749895) % 1.0;
        colors.push(hsvToRgb(hue, 1.0, 1.0));
    }

    return colors;
}

/**
 * Convert HSV to RGB
 * H: [0, 1], S: [0, 1], V: [0, 1]
 * Returns: [R, G, B] in [0, 1] range
 */
function hsvToRgb(h: number, s: number, v: number): number[] {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r: number, g: number, b: number;

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0;
    }

    return [r, g, b];
}

/**
 * Create a VTK lookup table for material coloring
 */
export function createMaterialLookupTable(
    materialIds: number[],
    colors: number[][],
    hiddenMaterials: Set<number> = new Set()
): any {
    // Use ColorTransferFunction which has better API support for discrete colors
    const ctf = vtkColorTransferFunction.newInstance();

    // Add color points for each material
    materialIds.forEach((materialId, index) => {
        const colorIndex = index % colors.length;
        const color = colors[colorIndex];

        // If material is hidden, set color to transparent (black with 0 alpha)
        // Note: ColorTransferFunction doesn't support alpha, so we'll use black for hidden
        if (hiddenMaterials.has(materialId)) {
            ctf.addRGBPoint(materialId, 0, 0, 0);
        } else {
            ctf.addRGBPoint(materialId, color[0], color[1], color[2]);
        }
    });

    // Build the function
    ctf.build();

    return ctf;
}

/**
 * Get color for a specific material ID
 */
export function getMaterialColor(materialId: number, materialIds: number[], colors: number[][]): number[] {
    const index = materialIds.indexOf(materialId);
    if (index === -1) {
        return [0.5, 0.5, 0.5]; // Gray for unknown materials
    }
    return colors[index % colors.length];
}
