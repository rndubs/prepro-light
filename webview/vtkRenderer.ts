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

import { MeshInfo } from './meshLoader';
import { generateMaterialColors, createMaterialLookupTable, MaterialColorScheme } from './materialColors';

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

    // Material visualization
    private currentMeshInfo: MeshInfo | null = null;
    private materialColorScheme: MaterialColorScheme = MaterialColorScheme.Default;
    private hiddenMaterials: Set<number> = new Set();
    private materialColors: number[][] = [];
    private showingMaterials: boolean = false;

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
     * Display loaded mesh data
     */
    public displayMesh(polyData: any, meshInfo?: MeshInfo): void {
        console.log('Displaying loaded mesh...');

        // Store references for material visualization
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

        // Check for material data and apply coloring
        if (meshInfo && meshInfo.hasMaterialData && meshInfo.materials) {
            console.log('Applying material coloring...');
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
                scalarArrays: meshInfo.scalarArrayNames,
                hasMaterialData: meshInfo.hasMaterialData,
                materials: meshInfo.materials
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
     * Apply material coloring to the mesh
     */
    private applyMaterialColoring(meshInfo: MeshInfo): void {
        if (!meshInfo.hasMaterialData || !meshInfo.materials || !meshInfo.materialDataArray) {
            console.warn('No material data available for coloring');
            return;
        }

        try {
            // Generate colors for all materials
            const materialIds = meshInfo.materials.map(m => m.materialId);
            this.materialColors = generateMaterialColors(materialIds.length, this.materialColorScheme);

            // Store colors in material info
            meshInfo.materials.forEach((mat, index) => {
                mat.color = this.materialColors[index];
            });

            // Create lookup table
            const lut = createMaterialLookupTable(materialIds, this.materialColors, this.hiddenMaterials);

            // Set the scalar mode to use cell data
            this.currentMapper.setScalarModeToUseCellData();

            // Set the array to use for coloring
            this.currentMapper.setColorByArrayName(meshInfo.materialFieldName);

            // Apply the lookup table
            this.currentMapper.setLookupTable(lut);
            this.currentMapper.setScalarVisibility(true);

            this.showingMaterials = true;

            console.log(`Material coloring applied: ${materialIds.length} materials`);
        } catch (error) {
            console.error('Error applying material coloring:', error);
        }
    }

    /**
     * Toggle material visualization on/off
     */
    public toggleMaterialVisualization(enabled?: boolean): void {
        if (!this.currentMapper) {
            console.warn('No mapper available');
            return;
        }

        const shouldShow = enabled !== undefined ? enabled : !this.showingMaterials;

        if (shouldShow && this.currentMeshInfo?.hasMaterialData) {
            // Re-apply material coloring
            this.applyMaterialColoring(this.currentMeshInfo);
            this.showingMaterials = true;
        } else {
            // Disable scalar coloring (revert to default color)
            this.currentMapper.setScalarVisibility(false);
            this.showingMaterials = false;
        }

        this.renderWindow.render();
        console.log(`Material visualization ${shouldShow ? 'enabled' : 'disabled'}`);
    }

    /**
     * Set material color scheme
     */
    public setMaterialColorScheme(scheme: MaterialColorScheme): void {
        this.materialColorScheme = scheme;

        // Re-apply material coloring if currently showing materials
        if (this.showingMaterials && this.currentMeshInfo?.hasMaterialData) {
            this.applyMaterialColoring(this.currentMeshInfo);
            this.renderWindow.render();
        }

        console.log(`Material color scheme changed to: ${scheme}`);
    }

    /**
     * Hide/show specific material
     */
    public setMaterialVisibility(materialId: number, visible: boolean): void {
        if (visible) {
            this.hiddenMaterials.delete(materialId);
        } else {
            this.hiddenMaterials.add(materialId);
        }

        // Re-apply material coloring
        if (this.showingMaterials && this.currentMeshInfo?.hasMaterialData) {
            this.applyMaterialColoring(this.currentMeshInfo);
            this.renderWindow.render();
        }

        console.log(`Material ${materialId} ${visible ? 'shown' : 'hidden'}`);
    }

    /**
     * Show only selected materials
     */
    public showOnlyMaterials(materialIds: number[]): void {
        if (!this.currentMeshInfo?.materials) {
            return;
        }

        // Hide all materials except the selected ones
        this.currentMeshInfo.materials.forEach(mat => {
            if (!materialIds.includes(mat.materialId)) {
                this.hiddenMaterials.add(mat.materialId);
            } else {
                this.hiddenMaterials.delete(mat.materialId);
            }
        });

        // Re-apply material coloring
        if (this.showingMaterials && this.currentMeshInfo.hasMaterialData) {
            this.applyMaterialColoring(this.currentMeshInfo);
            this.renderWindow.render();
        }

        console.log(`Showing only materials: ${materialIds.join(', ')}`);
    }

    /**
     * Show all materials
     */
    public showAllMaterials(): void {
        this.hiddenMaterials.clear();

        // Re-apply material coloring
        if (this.showingMaterials && this.currentMeshInfo?.hasMaterialData) {
            this.applyMaterialColoring(this.currentMeshInfo);
            this.renderWindow.render();
        }

        console.log('All materials shown');
    }

    /**
     * Get current mesh info (including material data)
     */
    public getMeshInfo(): MeshInfo | null {
        return this.currentMeshInfo;
    }

    /**
     * Check if material visualization is enabled
     */
    public isMaterialVisualizationEnabled(): boolean {
        return this.showingMaterials;
    }

    /**
     * Get hidden materials set
     */
    public getHiddenMaterials(): Set<number> {
        return new Set(this.hiddenMaterials);
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
