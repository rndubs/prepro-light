/**
 * VTK.js Renderer Module
 * Handles 3D visualization using VTK.js
 */

// @ts-ignore
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
// @ts-ignore
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
// @ts-ignore
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
// @ts-ignore
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
// @ts-ignore
import vtkCubeSource from '@kitware/vtk.js/Filters/Sources/CubeSource';
// @ts-ignore
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
// @ts-ignore
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
// @ts-ignore
import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
// @ts-ignore
import vtkProperty from '@kitware/vtk.js/Rendering/Core/Property';
// @ts-ignore
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';
// @ts-ignore
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';

import { MeshInfo } from './meshLoader';

export enum RenderMode {
    Surface = 'surface',
    Wireframe = 'wireframe',
    SurfaceWithEdges = 'surfaceWithEdges',
    Points = 'points'
}

export class VTKRenderer {
    private fullScreenRenderer: any;
    private renderer: any;
    private renderWindow: any;
    private container: HTMLElement | null = null;
    private currentActor: any = null;
    private currentMapper: any = null;
    private orientationWidget: any = null;
    private renderMode: RenderMode = RenderMode.Surface;
    private currentPolyData: any = null;
    private currentMeshInfo: MeshInfo | null = null;
    private materialColoringEnabled: boolean = true;

    constructor(container: HTMLElement) {
        this.container = container;
        this.initialize();
    }

    /**
     * Initialize VTK.js rendering components
     */
    private initialize(): void {
        if (!this.container) {
            throw new Error('Container element not found');
        }

        console.log('Initializing VTK.js renderer...');

        // Create full screen render window
        this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
            container: this.container,
            containerStyle: {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%'
            }
        });

        // Get renderer and render window
        this.renderer = this.fullScreenRenderer.getRenderer();
        this.renderWindow = this.fullScreenRenderer.getRenderWindow();

        // Set default background color (dark theme)
        this.renderer.setBackground(0.1, 0.1, 0.1);

        // Enable two-sided lighting for better mesh visualization
        this.renderer.setTwoSidedLighting(true);

        // Set up orientation marker widget
        this.setupOrientationWidget();

        // Configure interactor for better performance
        this.configureInteractor();

        console.log('VTK.js renderer initialized');
    }

    /**
     * Configure interactor for better performance
     */
    private configureInteractor(): void {
        try {
            const interactor = this.renderWindow.getInteractor();

            // Enable rendering throttling during interaction
            // This reduces the frame rate during interaction to improve responsiveness
            interactor.setDesiredUpdateRate(30); // FPS during interaction
            interactor.setStillUpdateRate(1); // FPS when still

            console.log('Interactor configured for optimal performance');
        } catch (error) {
            console.warn('Failed to configure interactor:', error);
        }
    }

    /**
     * Set up orientation marker widget (axis indicator)
     */
    private setupOrientationWidget(): void {
        try {
            const axes = vtkAxesActor.newInstance();

            this.orientationWidget = vtkOrientationMarkerWidget.newInstance({
                actor: axes,
                interactor: this.renderWindow.getInteractor()
            });

            this.orientationWidget.setEnabled(true);
            this.orientationWidget.setViewportCorner(
                vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
            );
            this.orientationWidget.setViewportSize(0.15);
            this.orientationWidget.setMinPixelSize(100);
            this.orientationWidget.setMaxPixelSize(300);

            console.log('Orientation widget set up successfully');
        } catch (error) {
            console.warn('Failed to set up orientation widget:', error);
            // Non-critical error, continue without the widget
        }
    }

    /**
     * Display a test cube to verify VTK.js is working
     */
    public displayTestCube(): void {
        console.log('Displaying test cube...');

        // Create a cube source
        const cubeSource = vtkCubeSource.newInstance();

        // Create mapper
        const mapper = vtkMapper.newInstance();
        mapper.setInputConnection(cubeSource.getOutputPort());

        // Create actor
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);

        // Add actor to renderer
        this.renderer.addActor(actor);

        // Reset camera to fit the scene
        this.renderer.resetCamera();

        // Render the scene
        this.renderWindow.render();

        console.log('Test cube displayed');
    }

    /**
     * Display a test sphere to verify VTK.js is working
     */
    public displayTestSphere(): void {
        console.log('Displaying test sphere...');

        // Create a sphere source
        const sphereSource = vtkSphereSource.newInstance({
            radius: 1.0,
            thetaResolution: 30,
            phiResolution: 30
        });

        // Create mapper
        const mapper = vtkMapper.newInstance();
        mapper.setInputConnection(sphereSource.getOutputPort());

        // Create actor
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);

        // Add actor to renderer
        this.renderer.addActor(actor);

        // Reset camera to fit the scene
        this.renderer.resetCamera();

        // Render the scene
        this.renderWindow.render();

        console.log('Test sphere displayed');
    }

    /**
     * Clear all actors from the scene
     */
    public clearScene(): void {
        console.log('Clearing scene...');
        this.renderer.removeAllActors();

        // Clean up references
        if (this.currentActor) {
            this.currentActor.delete();
            this.currentActor = null;
        }
        if (this.currentMapper) {
            this.currentMapper.delete();
            this.currentMapper = null;
        }

        this.renderWindow.render();
    }

    /**
     * Reset camera to fit all objects in the scene
     */
    public resetCamera(): void {
        console.log('Resetting camera...');
        this.renderer.resetCamera();
        this.renderWindow.render();
    }

    /**
     * Set background color
     */
    public setBackground(r: number, g: number, b: number): void {
        this.renderer.setBackground(r, g, b);
        this.renderWindow.render();
    }

    /**
     * Toggle orientation widget visibility
     */
    public toggleOrientationWidget(enabled?: boolean): void {
        if (this.orientationWidget) {
            const isEnabled = enabled !== undefined ? enabled : !this.orientationWidget.getEnabled();
            this.orientationWidget.setEnabled(isEnabled);
            this.renderWindow.render();
            console.log(`Orientation widget ${isEnabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Resize the render window
     */
    public resize(): void {
        if (this.fullScreenRenderer) {
            this.fullScreenRenderer.resize();
        }
    }

    /**
     * Get the renderer instance
     */
    public getRenderer(): any {
        return this.renderer;
    }

    /**
     * Get the render window instance
     */
    public getRenderWindow(): any {
        return this.renderWindow;
    }

    /**
     * Generate distinct colors for materials
     * Uses a categorical color scheme for clear visual distinction
     */
    private generateMaterialColors(numMaterials: number): number[][] {
        const colors: number[][] = [];

        // Predefined color palette for common material counts (up to 12 materials)
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

        // Use categorical colors for small number of materials
        if (numMaterials <= categoricalColors.length) {
            return categoricalColors.slice(0, numMaterials);
        }

        // For larger number of materials, generate colors using HSV color space
        for (let i = 0; i < numMaterials; i++) {
            const hue = (i * 360 / numMaterials) % 360;
            const saturation = 0.7 + (i % 3) * 0.1;  // Vary saturation slightly
            const value = 0.8 + (i % 2) * 0.1;       // Vary brightness slightly

            // Convert HSV to RGB
            const rgb = this.hsvToRgb(hue, saturation, value);
            colors.push(rgb);
        }

        return colors;
    }

    /**
     * Convert HSV color to RGB
     */
    private hsvToRgb(h: number, s: number, v: number): number[] {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;

        let r = 0, g = 0, b = 0;

        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        return [r + m, g + m, b + m];
    }

    /**
     * Create a lookup table for material coloring
     */
    private createMaterialLookupTable(meshInfo: MeshInfo): any {
        if (!meshInfo.hasMaterials || !meshInfo.materialRange) {
            return null;
        }

        const [minId, maxId] = meshInfo.materialRange;
        const numMaterials = meshInfo.materials.length;

        console.log(`Creating lookup table for ${numMaterials} materials (IDs ${minId}-${maxId})`);

        // Generate colors for all materials
        const colors = this.generateMaterialColors(numMaterials);

        // Create lookup table
        const lut = vtkLookupTable.newInstance();
        lut.setRange(minId, maxId);

        // Map each material ID to its color index
        const materialIdToIndex = new Map<number, number>();
        meshInfo.materials.forEach((mat, index) => {
            materialIdToIndex.set(mat.id, index);
        });

        // Build color table as a flat array [R, G, B, A, R, G, B, A, ...]
        const numColors = maxId - minId + 1;
        const colorTable = new Float32Array(numColors * 4);

        for (let id = minId; id <= maxId; id++) {
            const idx = (id - minId) * 4;
            const colorIndex = materialIdToIndex.get(id);

            if (colorIndex !== undefined && colorIndex < colors.length) {
                const color = colors[colorIndex];
                colorTable[idx] = color[0];
                colorTable[idx + 1] = color[1];
                colorTable[idx + 2] = color[2];
                colorTable[idx + 3] = 1.0;
            } else {
                // Fallback gray color for unmapped IDs
                colorTable[idx] = 0.5;
                colorTable[idx + 1] = 0.5;
                colorTable[idx + 2] = 0.5;
                colorTable[idx + 3] = 1.0;
            }
        }

        // Set the color table
        lut.setTable(colorTable);
        lut.build();

        return lut;
    }

    /**
     * Apply material coloring to the current mapper
     */
    private applyMaterialColoring(meshInfo: MeshInfo): void {
        if (!meshInfo.hasMaterials || !meshInfo.materialArrayName) {
            return;
        }

        console.log(`Applying material coloring using field: ${meshInfo.materialArrayName}`);

        try {
            // Create lookup table
            const lut = this.createMaterialLookupTable(meshInfo);
            if (!lut) {
                console.warn('Failed to create lookup table');
                return;
            }

            // Set the mapper to use the material array for coloring
            this.currentMapper.setLookupTable(lut);
            this.currentMapper.setScalarModeToUseCellFieldData();
            this.currentMapper.setColorByArrayName(meshInfo.materialArrayName);
            this.currentMapper.setScalarVisibility(true);

            console.log('Material coloring applied successfully');
        } catch (error) {
            console.error('Error applying material coloring:', error);
        }
    }

    /**
     * Toggle material coloring on/off
     */
    public setMaterialColoringEnabled(enabled: boolean): void {
        this.materialColoringEnabled = enabled;

        if (!this.currentPolyData || !this.currentMeshInfo) {
            return;
        }

        // Reapply rendering
        if (enabled && this.currentMeshInfo.hasMaterials) {
            this.applyMaterialColoring(this.currentMeshInfo);
        } else if (this.currentMapper) {
            // Disable material coloring
            this.currentMapper.setScalarVisibility(false);
        }

        this.renderWindow.render();
        console.log(`Material coloring ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get whether material coloring is enabled
     */
    public isMaterialColoringEnabled(): boolean {
        return this.materialColoringEnabled;
    }

    /**
     * Get the current mesh info
     */
    public getMeshInfo(): MeshInfo | null {
        return this.currentMeshInfo;
    }

    /**
     * Display loaded mesh data
     */
    public displayMesh(polyData: any, meshInfo?: MeshInfo): void {
        console.log('Displaying loaded mesh...');

        // Store current mesh data
        this.currentPolyData = polyData;
        this.currentMeshInfo = meshInfo || null;

        // Check mesh size and warn about performance
        if (meshInfo) {
            const totalElements = meshInfo.numberOfPoints + meshInfo.numberOfCells;
            if (totalElements > 1000000) {
                console.warn(`Large mesh detected (${totalElements.toLocaleString()} elements). Performance may be affected.`);
            }
        }

        // Clear existing scene
        this.clearScene();

        // Create mapper
        this.currentMapper = vtkMapper.newInstance();
        this.currentMapper.setInputData(polyData);

        // Configure mapper for better performance with large meshes
        this.currentMapper.setResolveCoincidentTopologyToPolygonOffset();
        this.currentMapper.setResolveCoincidentTopologyPolygonOffsetParameters(1, 1);

        // For large meshes, enable static rendering optimization
        if (meshInfo && meshInfo.numberOfCells > 100000) {
            console.log('Applying optimizations for large mesh...');
            this.currentMapper.setStatic(true);
        }

        // Apply material coloring if available
        if (meshInfo && meshInfo.hasMaterials && this.materialColoringEnabled) {
            this.applyMaterialColoring(meshInfo);
        }

        // Create actor
        this.currentActor = vtkActor.newInstance();
        this.currentActor.setMapper(this.currentMapper);

        // Configure material properties
        const property = this.currentActor.getProperty();
        this.configureMaterialProperties(property);

        // Apply current render mode
        this.applyRenderMode(this.renderMode);

        // Add actor to renderer
        this.renderer.addActor(this.currentActor);

        // Reset camera to fit the scene
        this.renderer.resetCamera();

        // Render the scene
        this.renderWindow.render();

        if (meshInfo) {
            console.log('Mesh statistics:', {
                points: meshInfo.numberOfPoints,
                cells: meshInfo.numberOfCells,
                bounds: meshInfo.bounds,
                hasScalars: meshInfo.hasScalars,
                scalarArrays: meshInfo.scalarArrayNames
            });
        }

        console.log('Mesh displayed successfully');
    }

    /**
     * Configure material properties for better visualization
     */
    private configureMaterialProperties(property: any): void {
        // Set lighting properties
        property.setAmbient(0.3);
        property.setDiffuse(0.6);
        property.setSpecular(0.3);
        property.setSpecularPower(30);

        // Set color (light gray for default surface)
        property.setColor(0.8, 0.8, 0.8);

        // Enable edge visibility for better shape perception
        property.setEdgeVisibility(false);
        property.setEdgeColor(0.2, 0.2, 0.2);
        property.setLineWidth(1);

        // Set point size for point rendering mode
        property.setPointSize(3);
    }

    /**
     * Apply render mode to the current actor
     */
    private applyRenderMode(mode: RenderMode): void {
        if (!this.currentActor) {
            return;
        }

        const property = this.currentActor.getProperty();

        switch (mode) {
            case RenderMode.Surface:
                property.setRepresentation(2); // VTK_SURFACE
                property.setEdgeVisibility(false);
                break;

            case RenderMode.Wireframe:
                property.setRepresentation(1); // VTK_WIREFRAME
                property.setEdgeVisibility(false);
                break;

            case RenderMode.SurfaceWithEdges:
                property.setRepresentation(2); // VTK_SURFACE
                property.setEdgeVisibility(true);
                break;

            case RenderMode.Points:
                property.setRepresentation(0); // VTK_POINTS
                property.setEdgeVisibility(false);
                break;
        }

        this.renderMode = mode;
    }

    /**
     * Set the render mode
     */
    public setRenderMode(mode: RenderMode): void {
        console.log(`Setting render mode to: ${mode}`);
        this.applyRenderMode(mode);
        this.renderWindow.render();
    }

    /**
     * Get the current render mode
     */
    public getRenderMode(): RenderMode {
        return this.renderMode;
    }

    /**
     * Toggle wireframe mode on/off
     */
    public toggleWireframe(): void {
        if (this.renderMode === RenderMode.Surface) {
            this.setRenderMode(RenderMode.SurfaceWithEdges);
        } else if (this.renderMode === RenderMode.SurfaceWithEdges) {
            this.setRenderMode(RenderMode.Surface);
        } else if (this.renderMode === RenderMode.Wireframe) {
            this.setRenderMode(RenderMode.Surface);
        } else {
            this.setRenderMode(RenderMode.Wireframe);
        }
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        console.log('Disposing VTK.js renderer...');

        // Clean up current actor and mapper
        if (this.currentActor) {
            this.currentActor.delete();
            this.currentActor = null;
        }

        if (this.currentMapper) {
            this.currentMapper.delete();
            this.currentMapper = null;
        }

        // Clean up orientation widget
        if (this.orientationWidget) {
            this.orientationWidget.setEnabled(false);
            this.orientationWidget.delete();
            this.orientationWidget = null;
        }

        if (this.renderer) {
            this.renderer.removeAllActors();
        }

        if (this.fullScreenRenderer) {
            this.fullScreenRenderer.delete();
        }

        console.log('VTK.js renderer disposed');
    }
}
