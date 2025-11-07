# Test Fixtures

This directory contains test fixture files used by the integration test suite.

## Planned Fixtures (Phase 4b.6)

The following test fixtures will be added:

### Large Mesh Files
- `large_mesh.vtp` - Mesh with ~100k vertices for performance testing
- `medium_mesh.vtp` - Mesh with ~10k vertices

### Error Testing
- `corrupted.vtp` - Intentionally corrupted VTP file
- `invalid_format.vtp` - Invalid XML structure
- `empty.vtp` - Empty file

### Material Data (for Phase 5)
- `cube_with_materials.vtp` - Cube mesh with material assignments
- `multi_material.vtp` - Mesh with multiple material regions

### Contact Surfaces (for Phase 6)
- `contact_pair_example.vtp` - Mesh with contact surface data

## Current Status

Currently, tests use sample files from the `samples/` directory. Custom test fixtures will be created as part of task 4b.6.

## Creating Test Fixtures

Test fixtures can be created using:
- ParaView (open source VTK visualization tool)
- Python with PyVista
- VTK.js programmatically
- Manual XML editing for VTP files

## Usage in Tests

```typescript
import { getFixturePath } from './helpers';

const filePath = getFixturePath('large_mesh.vtp');
await openMeshFile(filePath);
```

## Gitignore

Large test fixture files should be added to `.gitignore` to keep repository size manageable. Essential small fixtures should be committed.
