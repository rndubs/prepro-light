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
 * Mesh information
 */
export interface MeshInfo {
    numberOfPoints: number;
    numberOfCells: number;
    bounds: number[];
    hasScalars: boolean;
    hasVectors: boolean;
    scalarArrayNames: string[];
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

        // Extract mesh information
        const info = extractMeshInfo(polyData);

        console.log('Mesh loaded successfully:', info);

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
        scalarArrayNames: []
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
        }

    } catch (error) {
        console.error('Error extracting mesh info:', error);
    }

    return info;
}

/**
 * Check if a file format is supported
 */
export function isSupportedFormat(fileExtension: string): boolean {
    const supportedFormats = ['.vtp', '.vtu', '.vti', '.vtk', '.stl', '.obj'];
    return supportedFormats.includes(fileExtension.toLowerCase());
}
