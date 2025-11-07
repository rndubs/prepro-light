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

export class VTKRenderer {
    private fullScreenRenderer: any;
    private renderer: any;
    private renderWindow: any;
    private container: HTMLElement | null = null;

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

        console.log('VTK.js renderer initialized');
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
     * Clean up resources
     */
    public dispose(): void {
        console.log('Disposing VTK.js renderer...');

        if (this.renderer) {
            this.renderer.removeAllActors();
        }

        if (this.fullScreenRenderer) {
            this.fullScreenRenderer.delete();
        }

        console.log('VTK.js renderer disposed');
    }
}
