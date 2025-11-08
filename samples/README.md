# Sample Mesh Files

This directory contains sample mesh files for testing the Prepro Light extension.

## Files

### Basic Geometry
- **simple_cube.vtp** - A simple cube in VTK PolyData XML format
- **cube.vtp** - A cube mesh for testing
- **sphere.vtp** - A sphere mesh for testing
- **simple_triangle.stl** - A simple triangle mesh in STL ASCII format
- **simple_cube.obj** - A simple cube in Wavefront OBJ format

### Material Data (Phase 5)
- **test_materials.vtp** - Mesh with material assignment data
- **multi_material_cubes.vtp** - Multiple cubes with different materials
- **complex_materials.vtp** - Complex mesh with multiple materials

### Contact Surface Data (Phase 6)
- **contact_surfaces.vtp** - Mesh with contact surface IDs (3 contact surfaces)
- **contact_pairs.vtp** - Mesh with contact surface pairs (4 contact surfaces in 2 pairs)

## Supported Formats

The extension currently supports:

- **.vtp** - VTK PolyData (XML) - ✅ Fully supported
- **.vti** - VTK ImageData (XML) - ✅ Fully supported
- **.vtk** - VTK Legacy format - ✅ Supported
- **.stl** - STL mesh files - ✅ Fully supported
- **.obj** - Wavefront OBJ files - ✅ Fully supported
- **.vtu** - VTK Unstructured Grid (XML) - ⚠️ Not supported (VTK.js limitation)

## Testing

To test the extension:

1. Open VS Code in this project directory
2. Press F5 to launch the extension in debug mode
3. In the Extension Development Host window, open one of these sample files
4. The mesh should be displayed in the 3D viewer

## VTU Format Limitation

Note: VTU (Unstructured Grid) format is not fully supported in VTK.js browser version.
If you need to visualize unstructured grid data, please convert it to VTP format first.

You can convert VTU to VTP using Python with PyVista:

\`\`\`python
import pyvista as pv
mesh = pv.read('your_file.vtu')
mesh.save('your_file.vtp')
\`\`\`
