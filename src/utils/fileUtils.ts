/**
 * File utilities for mesh file operations
 */

/**
 * Maximum file size for mesh files (100 MB)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Warn threshold for large files (10 MB)
 */
export const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;

/**
 * Supported file extensions
 */
export const SUPPORTED_EXTENSIONS = ['.vtp', '.vtu', '.vti', '.vtk', '.stl', '.obj'];

/**
 * File validation result
 */
export interface FileValidationResult {
    valid: boolean;
    error?: string;
    warning?: string;
    fileSize: number;
    extension: string;
}

/**
 * Validate a mesh file
 */
export function validateMeshFile(
    fileName: string,
    fileSize: number
): FileValidationResult {
    const extension = getFileExtension(fileName);

    // Check if extension is supported
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
        return {
            valid: false,
            error: `Unsupported file format: ${extension}. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
            fileSize,
            extension
        };
    }

    // Check file size
    if (fileSize === 0) {
        return {
            valid: false,
            error: 'File is empty',
            fileSize,
            extension
        };
    }

    if (fileSize > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File is too large (${formatFileSize(fileSize)}). Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`,
            fileSize,
            extension
        };
    }

    // Warn about large files
    let warning: string | undefined;
    if (fileSize > LARGE_FILE_THRESHOLD) {
        warning = `Large file detected (${formatFileSize(fileSize)}). Loading may take some time.`;
    }

    return {
        valid: true,
        warning,
        fileSize,
        extension
    };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^.]+$/);
    return match ? match[0].toLowerCase() : '';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Determine if file is binary based on extension
 */
export function isBinaryFormat(extension: string): boolean {
    // STL can be binary or ASCII, but we'll treat it as potentially binary
    return extension === '.stl';
}

/**
 * Get file type description
 */
export function getFileTypeDescription(extension: string): string {
    const descriptions: Record<string, string> = {
        '.vtp': 'VTK PolyData (XML)',
        '.vtu': 'VTK Unstructured Grid (XML)',
        '.vti': 'VTK Image Data (XML)',
        '.vtk': 'VTK Legacy Format',
        '.stl': 'STL Mesh',
        '.obj': 'Wavefront OBJ'
    };

    return descriptions[extension] || 'Unknown format';
}
