# Prepro Light - Mesh Preprocessing Extension for VS Code

A lightweight VS Code extension for visualizing finite element meshes, contact surface pairs, and material assignments.

## Features

- **Mesh Visualization**: View VTK, STL, and OBJ mesh files directly in VS Code
- **Material Assignment Viewing**: Visualize material properties assigned to mesh elements
- **Contact Surface Pairs**: Identify and highlight contact surfaces in FEA meshes
- **Multiple Format Support**: `.vtp`, `.vtu`, `.vti`, `.stl`, `.obj` files

## Supported File Formats

- **VTK PolyData** (`.vtp`) - Surface meshes
- **VTK UnstructuredGrid** (`.vtu`) - Finite element meshes
- **VTK ImageData** (`.vti`) - Structured grids
- **STL** (`.stl`) - Stereolithography files
- **Wavefront OBJ** (`.obj`) - Object files

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- VS Code (v1.85.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd prepro-light
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

### Running the Extension

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. In the new VS Code window, open a mesh file (`.vtp`, `.vtu`, `.vti`, `.stl`, or `.obj`)
4. The mesh viewer will open automatically

### Development Workflow

- **Build**: `npm run compile` - Compile TypeScript to JavaScript
- **Watch**: `npm run watch` - Watch for changes and recompile automatically
- **Lint**: `npm run lint` - Run ESLint on source files
- **Package**: `npm run build` - Build for production

### Debugging

1. Set breakpoints in the source code
2. Press `F5` to start debugging
3. The debugger will attach to the Extension Development Host
4. Open a mesh file to trigger the extension

### Project Structure

```
prepro-light/
├── src/                    # Extension source code
│   ├── extension.ts        # Main extension entry point
│   ├── meshEditorProvider.ts  # Custom editor provider
│   ├── parsers/            # File format parsers
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── webview/                # Webview source code
│   ├── main.ts             # Webview entry point
│   ├── ui/                 # UI components
│   ├── styles/             # CSS styles
│   └── utils/              # Webview utilities
├── media/                  # Icons and media assets
├── samples/                # Sample mesh files for testing
├── test/                   # Test files
├── .vscode/                # VS Code configuration
├── dist/                   # Compiled output (generated)
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript configuration
└── webpack.config.js       # Webpack configuration
```

## Technology Stack

- **Language**: TypeScript
- **Visualization**: VTK.js (@kitware/vtk.js)
- **Framework**: VS Code Extension API
- **Build Tool**: Webpack
- **Testing**: VS Code Extension Test Runner

## Development Roadmap

See [PLAN.md](PLAN.md) for detailed implementation phases and task breakdown.

Current Status: **Phase 1 Complete** - Project setup and foundation

## Contributing

This is an internal development project. Please refer to the development plan for feature priorities and upcoming work.

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VTK.js Documentation](https://kitware.github.io/vtk-js/)
- [VTK File Formats](https://docs.vtk.org/en/latest/design_documents/VTKFileFormats.html)

## License

Private - Internal Use Only

## Version

Current Version: 0.1.0 (Phase 1 - Foundation)
