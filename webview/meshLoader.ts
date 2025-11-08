/**
 * Mesh Loader Module
 * Handles parsing of various mesh file formats using VTK.js readers
 */

// @ts-ignore
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
// @ts-ignore
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
// @ts-ignore
import vtkPolyDataReader from '@kitware/vtk.js/IO/Legacy/PolyDataReader';
// @ts-ignore
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';
// @ts-ignore
import vtkOBJReader from '@kitware/vtk.js/IO/Misc/OBJReader';

/**
 * Result of mesh loading operation
 */
export interface MeshLoadResult {
    success: boolean;
    polyData?: any;
    error?: string;
    info?: MeshInfo;
}

/**
 * Material information for a unique material ID
 */
export interface MaterialInfo {
    id: number;
    name: string;
    cellCount: number;
    percentage: number;
}

/**
 * Contact surface information
 */
export interface ContactSurfaceInfo {
    id: number;
    name: string;
    cellCount: number;
    percentage: number;
    type?: 'master' | 'slave' | 'self';  // Contact surface type
}

/**
 * Contact pair information
 */
export interface ContactPairInfo {
    id: number;
    name: string;
    master?: ContactSurfaceInfo;
    slave?: ContactSurfaceInfo;
}

/**
 * Mesh information
 */
export interface MeshInfo {
    numberOfPoints: number;
    numberOfCells: number;
    bounds: number[];
    hasScalars: boolean;
    hasVectors: boolean;
    scalarArrayNames: string[];
    // Material data
    hasMaterials: boolean;
    materialArrayName?: string;
    materials: MaterialInfo[];
    materialRange?: [number, number];  // [min, max] material IDs
    // Contact surface data
    hasContactSurfaces: boolean;
    contactSurfaceArrayName?: string;
    contactSurfaces: ContactSurfaceInfo[];
    contactPairs: ContactPairInfo[];
    contactRange?: [number, number];  // [min, max] contact IDs
}

/**
 * Load a mesh file based on its extension
 */
export async function loadMeshFile(
    fileExtension: string,
    fileContent: Uint8Array
): Promise<MeshLoadResult> {
    try {
        console.log(`Loading mesh file with extension: ${fileExtension}`);

        let reader: any;
        let polyData: any;

        switch (fileExtension) {
            case '.vtp':
                reader = vtkXMLPolyDataReader.newInstance();
                console.log('Using vtkXMLPolyDataReader for VTP file');
                break;

            case '.vtu':
                // Note: VTK.js doesn't have full support for VTU (unstructured grid) in the browser version
                // For now, we'll try using the PolyData reader which may work for some VTU files
                console.warn('VTU format has limited support. Attempting to read as polydata...');
                return {
                    success: false,
                    error: 'VTU (Unstructured Grid) format is not fully supported in VTK.js browser version. Please convert to VTP format.'
                };

            case '.vti':
                reader = vtkXMLImageDataReader.newInstance();
                console.log('Using vtkXMLImageDataReader for VTI file');
                break;

            case '.vtk':
                reader = vtkPolyDataReader.newInstance();
                console.log('Using vtkPolyDataReader for legacy VTK file');
                break;

            case '.stl':
                reader = vtkSTLReader.newInstance();
                console.log('Using vtkSTLReader for STL file');
                break;

            case '.obj':
                reader = vtkOBJReader.newInstance();
                console.log('Using vtkOBJReader for OBJ file');
                break;

            default:
                return {
                    success: false,
                    error: `Unsupported file format: ${fileExtension}`
                };
        }

        // Parse the file content
        if (reader.parseAsArrayBuffer) {
            // Binary formats (STL, legacy VTK can be binary)
            console.log('Parsing as array buffer...');
            reader.parseAsArrayBuffer(fileContent.buffer);
        } else if (reader.parseAsText) {
            // Text formats (XML-based VTK, OBJ)
            console.log('Parsing as text...');
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(fileContent);
            reader.parseAsText(text);
        } else {
            return {
                success: false,
                error: 'Reader does not support parsing'
            };
        }

        // Get the output data
        polyData = reader.getOutputData(0);

        if (!polyData) {
            return {
                success: false,
                error: 'Failed to get output data from reader'
            };
        }

        // Debug: Log polyData structure
        console.log('PolyData loaded:', polyData);
        if (polyData.getCellData) {
            const cellData = polyData.getCellData();
            console.log('CellData:', cellData);
            if (cellData) {
                const numArrays = cellData.getNumberOfArrays();
                console.log(`Number of cell data arrays: ${numArrays}`);
                for (let i = 0; i < numArrays; i++) {
                    const array = cellData.getArrayByIndex(i);
                    if (array) {
                        console.log(`  Array ${i}: ${array.getName()}, components: ${array.getNumberOfComponents()}, values: ${array.getNumberOfTuples()}`);
                    }
                }
            }
        }

        // Extract mesh information
        const info = extractMeshInfo(polyData);

        console.log('Mesh loaded successfully:', info);
        console.log('Mesh bounds explicitly:', info.bounds);

        return {
            success: true,
            polyData,
            info
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error loading mesh file:', errorMessage);
        return {
            success: false,
            error: `Failed to parse mesh file: ${errorMessage}`
        };
    }
}

/**
 * Extract information from loaded mesh data
 */
function extractMeshInfo(polyData: any): MeshInfo {
    const info: MeshInfo = {
        numberOfPoints: 0,
        numberOfCells: 0,
        bounds: [0, 0, 0, 0, 0, 0],
        hasScalars: false,
        hasVectors: false,
        scalarArrayNames: [],
        hasMaterials: false,
        materials: [],
        hasContactSurfaces: false,
        contactSurfaces: [],
        contactPairs: []
    };

    try {
        // Get basic mesh statistics
        if (polyData.getNumberOfPoints) {
            info.numberOfPoints = polyData.getNumberOfPoints();
        }

        if (polyData.getNumberOfCells) {
            info.numberOfCells = polyData.getNumberOfCells();
        }

        if (polyData.getBounds) {
            info.bounds = polyData.getBounds();
            console.log('extractMeshInfo: polyData.getBounds() returned:', info.bounds);
        }

        // Check for point data
        const pointData = polyData.getPointData();
        if (pointData) {
            const numberOfArrays = pointData.getNumberOfArrays();

            for (let i = 0; i < numberOfArrays; i++) {
                const array = pointData.getArrayByIndex(i);
                if (array) {
                    const arrayName = array.getName();
                    info.scalarArrayNames.push(arrayName);

                    const numComponents = array.getNumberOfComponents();
                    if (numComponents === 1) {
                        info.hasScalars = true;
                    } else if (numComponents === 3) {
                        info.hasVectors = true;
                    }
                }
            }
        }

        // Check for cell data
        const cellData = polyData.getCellData();
        if (cellData) {
            const numberOfArrays = cellData.getNumberOfArrays();

            for (let i = 0; i < numberOfArrays; i++) {
                const array = cellData.getArrayByIndex(i);
                if (array) {
                    const arrayName = array.getName();
                    if (!info.scalarArrayNames.includes(arrayName)) {
                        info.scalarArrayNames.push(arrayName);
                    }

                    const numComponents = array.getNumberOfComponents();
                    if (numComponents === 1) {
                        info.hasScalars = true;
                    } else if (numComponents === 3) {
                        info.hasVectors = true;
                    }
                }
            }

            // Extract material data if present
            extractMaterialData(cellData, info);

            // Extract contact surface data if present
            extractContactSurfaceData(cellData, info);
        }

    } catch (error) {
        console.error('Error extracting mesh info:', error);
    }

    return info;
}

/**
 * Common material field names to look for in VTK files
 */
const MATERIAL_FIELD_NAMES = [
    'MaterialIds',
    'Material',
    'material',
    'MatId',
    'mat',
    'Region',
    'RegionId',
    'region',
    'ElementBlock',
    'ObjectId'
];

/**
 * Extract material data from cell data
 */
function extractMaterialData(cellData: any, info: MeshInfo): void {
    try {
        console.log('extractMaterialData: Starting material data extraction');
        console.log('extractMaterialData: CellData object:', cellData);

        // Search for material data array
        let materialArray: any = null;
        let materialArrayName: string = '';

        // Check each common material field name
        console.log('extractMaterialData: Checking for material field names:', MATERIAL_FIELD_NAMES);
        for (const fieldName of MATERIAL_FIELD_NAMES) {
            console.log(`extractMaterialData: Checking field '${fieldName}'`);
            const array = cellData.getArrayByName(fieldName);
            console.log(`extractMaterialData: Array for '${fieldName}':`, array);
            if (array) {
                const numComponents = array.getNumberOfComponents();
                console.log(`extractMaterialData: '${fieldName}' has ${numComponents} components`);
                if (numComponents === 1) {
                    materialArray = array;
                    materialArrayName = fieldName;
                    console.log(`Found material data in field: ${fieldName}`);
                    break;
                }
            }
        }

        // If no material array found, return
        if (!materialArray) {
            console.log('No material data found in mesh (no matching field names)');
            return;
        }

        info.hasMaterials = true;
        info.materialArrayName = materialArrayName;

        // Get the raw data array
        const dataArray = materialArray.getData();
        const numCells = info.numberOfCells;

        // Count occurrences of each material ID
        const materialCounts = new Map<number, number>();
        let minId = Infinity;
        let maxId = -Infinity;

        for (let i = 0; i < numCells; i++) {
            const materialId = Math.floor(dataArray[i]);  // Ensure integer
            materialCounts.set(materialId, (materialCounts.get(materialId) || 0) + 1);

            if (materialId < minId) minId = materialId;
            if (materialId > maxId) maxId = materialId;
        }

        info.materialRange = [minId, maxId];

        // Create MaterialInfo objects
        const materials: MaterialInfo[] = [];
        for (const [id, count] of materialCounts.entries()) {
            materials.push({
                id,
                name: `Material ${id}`,
                cellCount: count,
                percentage: (count / numCells) * 100
            });
        }

        // Sort by material ID
        materials.sort((a, b) => a.id - b.id);
        info.materials = materials;

        console.log(`Found ${materials.length} unique materials (IDs ${minId}-${maxId})`);

    } catch (error) {
        console.error('Error extracting material data:', error);
        info.hasMaterials = false;
    }
}

/**
 * Common contact surface field names to look for in VTK files
 */
const CONTACT_FIELD_NAMES = [
    'ContactId',
    'ContactIds',
    'Contact',
    'contact',
    'ContactSurface',
    'ContactSurfaceId',
    'SurfaceId',
    'surface',
    'SideSet',
    'SideSetId',
    'NodeSet',
    'NodeSetId'
];

/**
 * Extract contact surface data from cell data
 */
function extractContactSurfaceData(cellData: any, info: MeshInfo): void {
    try {
        // Search for contact surface data array
        let contactArray: any = null;
        let contactArrayName: string = '';

        // Check each common contact field name
        for (const fieldName of CONTACT_FIELD_NAMES) {
            const array = cellData.getArrayByName(fieldName);
            if (array && array.getNumberOfComponents() === 1) {
                contactArray = array;
                contactArrayName = fieldName;
                console.log(`Found contact surface data in field: ${fieldName}`);
                break;
            }
        }

        // If no contact array found, return
        if (!contactArray) {
            console.log('No contact surface data found in mesh');
            return;
        }

        info.hasContactSurfaces = true;
        info.contactSurfaceArrayName = contactArrayName;

        // Get the raw data array
        const dataArray = contactArray.getData();
        const numCells = info.numberOfCells;

        // Count occurrences of each contact surface ID
        const contactCounts = new Map<number, number>();
        let minId = Infinity;
        let maxId = -Infinity;

        for (let i = 0; i < numCells; i++) {
            const contactId = Math.floor(dataArray[i]);  // Ensure integer

            // Skip ID 0 as it typically means "no contact surface"
            if (contactId === 0) {
                continue;
            }

            contactCounts.set(contactId, (contactCounts.get(contactId) || 0) + 1);

            if (contactId < minId) minId = contactId;
            if (contactId > maxId) maxId = contactId;
        }

        // If no contact surfaces found (all zeros), return
        if (contactCounts.size === 0) {
            console.log('All contact IDs are 0 (no contact surfaces defined)');
            info.hasContactSurfaces = false;
            return;
        }

        info.contactRange = [minId, maxId];

        // Create ContactSurfaceInfo objects
        const contactSurfaces: ContactSurfaceInfo[] = [];
        for (const [id, count] of contactCounts.entries()) {
            // Determine contact type based on naming conventions
            // Odd IDs are often masters, even IDs slaves (common convention)
            let type: 'master' | 'slave' | 'self' = 'self';
            if (id % 2 === 1) {
                type = 'master';
            } else {
                type = 'slave';
            }

            contactSurfaces.push({
                id,
                name: `Contact ${id} (${type})`,
                cellCount: count,
                percentage: (count / numCells) * 100,
                type
            });
        }

        // Sort by contact ID
        contactSurfaces.sort((a, b) => a.id - b.id);
        info.contactSurfaces = contactSurfaces;

        // Create contact pairs (match adjacent IDs as pairs)
        const contactPairs: ContactPairInfo[] = [];
        const pairedIds = new Set<number>();

        for (let i = 0; i < contactSurfaces.length; i++) {
            const surface = contactSurfaces[i];

            if (pairedIds.has(surface.id)) {
                continue;
            }

            // Try to find a pair (next ID)
            const pairId = surface.id + 1;
            const pairSurface = contactSurfaces.find(s => s.id === pairId);

            if (pairSurface) {
                // Found a pair
                contactPairs.push({
                    id: Math.floor(surface.id / 2) + 1,
                    name: `Pair ${Math.floor(surface.id / 2) + 1}`,
                    master: surface.type === 'master' ? surface : pairSurface,
                    slave: surface.type === 'slave' ? surface : pairSurface
                });
                pairedIds.add(surface.id);
                pairedIds.add(pairSurface.id);
            } else {
                // Unpaired surface (self-contact or single surface)
                contactPairs.push({
                    id: surface.id,
                    name: `Surface ${surface.id}`,
                    master: surface.type === 'master' ? surface : undefined,
                    slave: surface.type === 'slave' ? surface : undefined
                });
                pairedIds.add(surface.id);
            }
        }

        info.contactPairs = contactPairs;

        console.log(`Found ${contactSurfaces.length} contact surfaces in ${contactPairs.length} pairs (IDs ${minId}-${maxId})`);

    } catch (error) {
        console.error('Error extracting contact surface data:', error);
        info.hasContactSurfaces = false;
    }
}

/**
 * Check if a file format is supported
 */
export function isSupportedFormat(fileExtension: string): boolean {
    const supportedFormats = ['.vtp', '.vtu', '.vti', '.vtk', '.stl', '.obj'];
    return supportedFormats.includes(fileExtension.toLowerCase());
}
