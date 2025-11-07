# Implementation Plan: Mesh Preprocessing VS Code Extension

## Project Overview

**Goal:** Build a lightweight VS Code extension using VTK.js to visualize finite element meshes, contact surface pairs, and material assignments.

**Tech Stack:**
- Language: TypeScript
- Visualization: VTK.js (@kitware/vtk.js)
- Framework: VS Code Extension API
- Build Tool: Webpack/esbuild
- Testing: VS Code Extension Test Runner

---

## Development Phases

### Phase 1: Project Setup & Foundation ✅ COMPLETE

**Objective:** Set up the development environment and basic extension structure.

#### Tasks:

- [x] 1.1 Initialize VS Code Extension Project
  - [x] Create extension scaffold using Yeoman generator or manual setup
  - [x] Configure `package.json` with extension metadata
  - [x] Set up TypeScript configuration (`tsconfig.json`)
  - [x] Configure build system (webpack or esbuild)

- [x] 1.2 Install Core Dependencies
  - [x] Install VS Code extension types: `@types/vscode`
  - [x] Install VTK.js: `@kitware/vtk.js`
  - [x] Install build dependencies (webpack, ts-loader, etc.)
  - [x] Install development dependencies (eslint, prettier)

- [x] 1.3 Configure Extension Manifest
  - [x] Define extension activation events (file patterns)
  - [x] Register custom editor provider for mesh files
  - [x] Define supported file extensions (.vtp, .vtu, .vti, .stl, .obj)
  - [x] Set up extension contribution points

- [x] 1.4 Create Basic Extension Structure
  - [x] Create `src/extension.ts` entry point
  - [x] Implement extension activation function
  - [x] Set up basic logging/output channel
  - [x] Create folder structure (src/, webview/, types/, utils/)

- [x] 1.5 Development Environment
  - [x] Configure VS Code launch configuration for debugging
  - [x] Set up hot reload for development
  - [x] Create basic README for development setup
  - [x] Initialize git repository (if not already done)

**Deliverable:** Working extension skeleton that activates in VS Code ✅

---

### Phase 2: Basic Webview Integration ✅ COMPLETE

**Objective:** Create a webview panel that can display basic 3D content.

#### Tasks:

- [x] 2.1 Create Webview Provider
  - [x] Implement custom editor provider class
  - [x] Handle webview lifecycle (create, dispose, visibility)
  - [x] Set up webview HTML template
  - [x] Configure Content Security Policy for webview

- [x] 2.2 Webview-Extension Communication
  - [x] Set up message passing between extension and webview
  - [x] Create message protocol types/interfaces
  - [x] Implement message handlers on both sides
  - [x] Add error handling for communication failures

- [x] 2.3 Bundle Webview Assets
  - [x] Configure webpack for webview scripts
  - [x] Set up separate bundle for webview code
  - [x] Handle static asset loading (CSS, icons)
  - [x] Configure proper URI handling for resources

- [x] 2.4 Basic VTK.js Integration
  - [x] Create webview script that initializes VTK.js
  - [x] Set up render window and renderer
  - [x] Create basic camera and interactor
  - [x] Test with a simple geometric primitive (cube/sphere)

- [x] 2.5 Testing & Debugging
  - [x] Test webview creation and disposal
  - [x] Verify message passing works
  - [x] Check for memory leaks on webview close
  - [x] Test webview with different VS Code themes

**Deliverable:** Extension that opens a webview and displays a simple 3D scene ✅

---

### Phase 3: File Loading & Parsing ✅ COMPLETE

**Objective:** Load and parse VTK and other mesh file formats.

#### Tasks:

- [x] 3.1 File Reading Infrastructure
  - [x] Implement file system reading utilities
  - [x] Handle different text encodings
  - [x] Support binary file formats
  - [x] Add file size validation and warnings

- [x] 3.2 VTK Format Parsers
  - [x] Integrate VTK.js VTP reader (vtkXMLPolyDataReader)
  - [~] Integrate VTK.js VTU reader (not available in VTK.js browser version)
  - [x] Integrate VTK.js VTI reader (vtkXMLImageDataReader)
  - [x] Handle legacy VTK format (.vtk files)

- [x] 3.3 Additional Format Support
  - [x] Integrate STL reader (vtkSTLReader)
  - [x] Integrate OBJ reader (vtkOBJReader)
  - [x] Test each format with sample files
  - [x] Create fallback for unsupported formats

- [x] 3.4 Error Handling
  - [x] Validate file format before parsing
  - [x] Handle corrupted/invalid files gracefully
  - [x] Provide user-friendly error messages
  - [x] Log detailed errors for debugging

- [x] 3.5 Progress Indication
  - [x] Show loading indicator in webview
  - [x] Report progress for large files
  - [x] Allow cancellation of long operations
  - [x] Display file information after loading

**Deliverable:** Extension that can open and parse VTK, STL, and OBJ files ✅

**Note:** VTU (Unstructured Grid) format is not supported due to VTK.js browser limitations. Users can convert VTU to VTP format.

---

### Phase 4: Basic Mesh Visualization ✅ COMPLETE

**Objective:** Display loaded meshes with proper rendering.

#### Tasks:

- [x] 4.1 Mesh Rendering Pipeline
  - [x] Create VTK.js actor for mesh display
  - [x] Set up mapper with proper configuration
  - [x] Configure material properties (lighting, shading)
  - [x] Implement automatic camera reset to fit mesh

- [x] 4.2 Visualization Modes
  - [x] Surface rendering mode
  - [x] Wireframe mode
  - [x] Surface with edges mode
  - [x] Points mode (for point clouds)

- [x] 4.3 Camera Controls
  - [x] Implement orbit/rotate controls (via VTK.js interactor)
  - [x] Add pan functionality (via VTK.js interactor)
  - [x] Add zoom/dolly (via VTK.js interactor)
  - [x] Add "reset camera" command

- [x] 4.4 Basic UI Controls
  - [x] Add rendering mode selector
  - [x] Add background color picker
  - [x] Add wireframe toggle (via render mode selector)
  - [x] Add axis/orientation widget

- [x] 4.5 Performance Optimization
  - [x] Implement basic optimizations for large meshes
  - [x] Add render throttling during interaction
  - [x] Optimize for meshes with high vertex counts
  - [x] Test with various mesh sizes

**Deliverable:** Extension that visualizes meshes with interactive camera controls ✅

---

### Phase 5: Material Assignment Visualization

**Objective:** Display and highlight material assignments in the mesh.

#### Tasks:

- [ ] 5.1 Material Data Parsing
  - [ ] Read cell data arrays from VTK files
  - [ ] Identify material ID fields
  - [ ] Parse material property metadata
  - [ ] Handle missing or invalid material data

- [ ] 5.2 Material Coloring
  - [ ] Create color map for material IDs
  - [ ] Apply colors to mesh based on material assignments
  - [ ] Support custom color schemes
  - [ ] Handle large numbers of unique materials

- [ ] 5.3 Material Legend/UI
  - [ ] Display material legend in UI
  - [ ] Show material statistics (count, coverage)
  - [ ] Allow material selection/highlighting
  - [ ] Support material name labels (if available)

- [ ] 5.4 Material Filtering
  - [ ] Filter/hide specific materials
  - [ ] Show only selected materials
  - [ ] Isolate material groups
  - [ ] Toggle material visibility

- [ ] 5.5 Material Inspection
  - [ ] Click on mesh to identify material
  - [ ] Display material properties in side panel
  - [ ] Highlight all cells with same material
  - [ ] Export material statistics

**Deliverable:** Extension that visualizes and explores material assignments

---

### Phase 6: Contact Surface Visualization

**Objective:** Identify and visualize contact surface pairs.

#### Tasks:

- [ ] 6.1 Contact Surface Data Structure
  - [ ] Define contact pair data model
  - [ ] Read contact definitions from file metadata
  - [ ] Support common contact surface formats
  - [ ] Parse master/slave surface relationships

- [ ] 6.2 Surface Extraction
  - [ ] Extract surface cells from volume mesh
  - [ ] Identify boundary faces
  - [ ] Group faces into contact surfaces
  - [ ] Handle multi-body contact scenarios

- [ ] 6.3 Contact Pair Visualization
  - [ ] Highlight contact surface pairs with distinct colors
  - [ ] Show master vs slave surfaces differently
  - [ ] Display gap distance visualization
  - [ ] Add transparency controls for clarity

- [ ] 6.4 Contact Surface UI
  - [ ] List all contact pairs in side panel
  - [ ] Allow selection of specific pairs
  - [ ] Show/hide individual contact surfaces
  - [ ] Display contact statistics (area, nodes, etc.)

- [ ] 6.5 Contact Analysis Tools
  - [ ] Measure gap distances
  - [ ] Identify overlapping regions
  - [ ] Detect potential contact issues
  - [ ] Export contact surface geometry

**Deliverable:** Extension that visualizes contact surface pairs with analysis tools

---

### Phase 7: User Interface Enhancements

**Objective:** Create an intuitive, professional user interface.

#### Tasks:

- [ ] 7.1 Main Toolbar
  - [ ] File operations (open, reload, close)
  - [ ] View controls (reset camera, fit to screen)
  - [ ] Screenshot/export functionality
  - [ ] Help/documentation links

- [ ] 7.2 Side Panel Design
  - [ ] Collapsible sections for different features
  - [ ] Material properties panel
  - [ ] Contact surfaces panel
  - [ ] Mesh information panel

- [ ] 7.3 Visual Settings
  - [ ] Lighting controls
  - [ ] Edge/wireframe thickness
  - [ ] Transparency sliders
  - [ ] Color scheme selection

- [ ] 7.4 Theme Integration
  - [ ] Support VS Code light theme
  - [ ] Support VS Code dark theme
  - [ ] Support high-contrast themes
  - [ ] Match VS Code's UI patterns

- [ ] 7.5 Responsive Design
  - [ ] Handle panel resizing
  - [ ] Responsive layout for different screen sizes
  - [ ] Maintain aspect ratio for 3D viewport
  - [ ] Touch-friendly controls for tablets

**Deliverable:** Polished, professional user interface

---

### Phase 8: Advanced Features

**Objective:** Add value-added preprocessing capabilities.

#### Tasks:

- [ ] 8.1 Measurement Tools
  - [ ] Distance measurement between points
  - [ ] Angle measurement
  - [ ] Area calculation for selected faces
  - [ ] Bounding box dimensions

- [ ] 8.2 Selection Tools
  - [ ] Click to select cells/points
  - [ ] Box selection
  - [ ] Polygon selection (lasso)
  - [ ] Select by material/property

- [ ] 8.3 Clipping/Sectioning
  - [ ] Plane clipping widget
  - [ ] Box clipping
  - [ ] Show interior of mesh
  - [ ] Multiple clip planes

- [ ] 8.4 Data Probing
  - [ ] Display cell/point properties on hover
  - [ ] Show scalar field values
  - [ ] Vector field visualization (if present)
  - [ ] Export probe data

- [ ] 8.5 Export Capabilities
  - [ ] Export screenshots (PNG)
  - [ ] Export 3D view state
  - [ ] Export filtered geometry
  - [ ] Export material/contact reports (CSV/JSON)

**Deliverable:** Feature-rich preprocessing tool

---

### Phase 9: Testing & Quality Assurance

**Objective:** Ensure reliability, performance, and user experience quality.

#### Tasks:

- [ ] 9.1 Unit Testing
  - [ ] Test file parsers with various formats
  - [ ] Test data extraction utilities
  - [ ] Test material assignment logic
  - [ ] Test contact surface identification

- [ ] 9.2 Integration Testing
  - [ ] Test webview communication
  - [ ] Test file loading workflow
  - [ ] Test UI interactions
  - [ ] Test memory management

- [ ] 9.3 Performance Testing
  - [ ] Benchmark with small meshes (< 10k cells)
  - [ ] Test with medium meshes (10k-100k cells)
  - [ ] Test with large meshes (> 100k cells)
  - [ ] Identify and fix performance bottlenecks

- [ ] 9.4 Cross-Platform Testing
  - [ ] Test on Windows
  - [ ] Test on macOS
  - [ ] Test on Linux
  - [ ] Verify file path handling across platforms

- [ ] 9.5 User Acceptance Testing
  - [ ] Create sample mesh files for testing
  - [ ] Test with real FEA meshes
  - [ ] Gather feedback from target users
  - [ ] Address usability issues

**Deliverable:** Well-tested, reliable extension

---

### Phase 10: Documentation & Distribution

**Objective:** Prepare for internal distribution and user onboarding.

#### Tasks:

- [ ] 10.1 User Documentation
  - [ ] Create comprehensive README
  - [ ] Write user guide with screenshots
  - [ ] Document supported file formats
  - [ ] Create tutorial/getting started guide

- [ ] 10.2 Developer Documentation
  - [ ] Document code architecture
  - [ ] Add inline code comments
  - [ ] Create API documentation
  - [ ] Document build and deployment process

- [ ] 10.3 Sample Files
  - [ ] Create sample VTK files
  - [ ] Include example contact surfaces
  - [ ] Provide material assignment examples
  - [ ] Bundle samples with extension

- [ ] 10.4 Packaging
  - [ ] Create VSIX package for distribution
  - [ ] Test installation from VSIX
  - [ ] Create installation instructions
  - [ ] Set up versioning scheme

- [ ] 10.5 Internal Distribution
  - [ ] Set up internal distribution channel
  - [ ] Create update mechanism
  - [ ] Establish feedback collection process
  - [ ] Plan for maintenance and updates

**Deliverable:** Production-ready extension with complete documentation

---

## File Structure Plan

```
prepro-light/
├── .vscode/
│   ├── launch.json          # Debug configuration
│   └── tasks.json           # Build tasks
├── src/
│   ├── extension.ts         # Main extension entry point
│   ├── meshEditorProvider.ts  # Custom editor provider
│   ├── parsers/
│   │   ├── vtkParser.ts     # VTK format parsers
│   │   ├── stlParser.ts     # STL parser
│   │   └── objParser.ts     # OBJ parser
│   ├── utils/
│   │   ├── fileUtils.ts     # File reading utilities
│   │   ├── logger.ts        # Logging utilities
│   │   └── meshUtils.ts     # Mesh processing utilities
│   └── types/
│       ├── meshData.ts      # Mesh data interfaces
│       ├── messages.ts      # Message protocol types
│       └── vtk.d.ts         # VTK.js type extensions
├── webview/
│   ├── index.html           # Webview HTML template
│   ├── main.ts              # Webview entry point
│   ├── vtkRenderer.ts       # VTK.js rendering logic
│   ├── ui/
│   │   ├── toolbar.ts       # Toolbar component
│   │   ├── sidePanel.ts     # Side panel component
│   │   ├── materialPanel.ts # Material panel
│   │   └── contactPanel.ts  # Contact surface panel
│   ├── styles/
│   │   └── main.css         # Webview styles
│   └── utils/
│       └── messageHandler.ts # Message handling
├── media/
│   ├── icon.png             # Extension icon
│   └── screenshots/         # Documentation screenshots
├── samples/
│   ├── cube.vtp             # Sample mesh files
│   ├── beam_with_materials.vtu
│   └── contact_example.vtu
├── test/
│   └── suite/
│       ├── extension.test.ts
│       └── parsers.test.ts
├── .eslintrc.json
├── .gitignore
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript config
├── webpack.config.js        # Webpack config
├── README.md                # User documentation
├── RESEARCH.md              # Research findings
├── PLAN.md                  # This file
└── CHANGELOG.md             # Version history
```

---

## Development Workflow

### Iteration Cycle

For each phase:
1. **Review tasks** - Understand requirements
2. **Implement** - Write code following best practices
3. **Test** - Verify functionality works
4. **Document** - Update docs and comments
5. **Commit** - Save progress with clear commit messages
6. **Demo** - Show working features

### Git Workflow

```bash
# Work on feature branch
git checkout -b feature/phase-X-description

# Make changes and commit incrementally
git add .
git commit -m "Implement specific feature"

# Push to remote
git push origin feature/phase-X-description

# When phase complete, merge to main branch
```

### Testing Strategy

- Write tests alongside implementation
- Test each feature in isolation
- Test integration between components
- Perform manual testing in VS Code
- Test with real mesh files regularly

---

## Success Criteria

### Minimum Viable Product (MVP)
- ✅ Opens VTK files (.vtp, .vtu, .vti)
- ✅ Displays mesh in 3D view
- ✅ Shows material assignments with colors
- ✅ Basic camera controls (rotate, pan, zoom)
- ✅ Material legend/list
- ✅ Responsive UI

### Full Release v1.0
- ✅ All MVP features
- ✅ Contact surface pair visualization
- ✅ Multiple rendering modes
- ✅ Selection and measurement tools
- ✅ Export capabilities
- ✅ Complete documentation
- ✅ Tested on all platforms

---

## Risk Management

### Potential Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| VTK.js TypeScript compatibility issues | Medium | Use type assertions, create custom type definitions |
| Performance with large meshes | High | Implement LOD, progressive loading, optimize render loop |
| VTK format parsing complexity | Medium | Use VTK.js built-in readers, test with diverse files |
| Webview memory leaks | High | Proper cleanup on dispose, test thoroughly |
| Cross-platform file path issues | Low | Use VS Code's URI APIs consistently |
| User learning curve | Medium | Good documentation, intuitive UI, tooltips |

---

## Timeline Estimate

| Phase | Estimated Duration | Complexity |
|-------|-------------------|------------|
| Phase 1: Project Setup | 1-2 days | Low |
| Phase 2: Webview Integration | 2-3 days | Medium |
| Phase 3: File Loading | 2-3 days | Medium |
| Phase 4: Basic Visualization | 3-4 days | Medium |
| Phase 5: Material Visualization | 3-4 days | Medium-High |
| Phase 6: Contact Surfaces | 4-5 days | High |
| Phase 7: UI Enhancements | 2-3 days | Medium |
| Phase 8: Advanced Features | 3-5 days | Medium |
| Phase 9: Testing & QA | 3-4 days | Medium |
| Phase 10: Documentation | 2-3 days | Low |

**Total Estimated Time:** 25-36 working days (5-7 weeks)

*Note: Timeline assumes full-time development. Adjust for part-time work or interruptions.*

---

## Next Steps

1. ✅ Review this plan
2. ✅ Confirm approach and priorities
3. ✅ Start Phase 1: Project Setup
4. ✅ Set up development environment
5. ✅ Create basic extension structure
6. ✅ Begin Phase 2: Basic Webview Integration
7. ✅ Integrate VTK.js for 3D mesh rendering
8. ✅ Begin Phase 3: File Loading & Parsing
9. ✅ Implement VTK file format parsers
10. ✅ Begin Phase 4: Basic Mesh Visualization
11. ✅ Implement rendering modes and camera controls
12. ⏳ Begin Phase 5: Material Assignment Visualization

---

## Resources & References

### Official Documentation
- [VS Code Extension API](https://code.visualstudio.com/api)
- [VTK.js Documentation](https://kitware.github.io/vtk-js/)
- [VTK.js Examples](https://kitware.github.io/vtk-js/examples/)
- [VTK File Formats](https://docs.vtk.org/en/latest/design_documents/VTKFileFormats.html)

### Code Examples
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [VTK.js Geometry Viewer](https://kitware.github.io/vtk-js/examples/GeometryViewer.html)
- [vscode-mesh-viewer](https://github.com/ashawkey/vscode-mesh-viewer)

### Community
- [VS Code Extension Development Community](https://github.com/microsoft/vscode-discussions)
- [VTK Discourse Forum](https://discourse.vtk.org/)

---

## Notes

- This plan is a living document - update as requirements evolve
- Some phases can be done in parallel by multiple developers
- Prioritize MVP features first, then add enhancements
- Regular user feedback will help guide feature priorities
- Keep commits small and focused for easier review/rollback

---

**Last Updated:** 2025-11-07
**Version:** 1.4
**Status:** Phase 4 Complete - Ready for Phase 5
