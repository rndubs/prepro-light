#!/usr/bin/env python3
"""
Generate VTK mesh files of varying sizes for performance testing.

This script creates test mesh files in multiple formats (STL, OBJ, VTP)
with different node counts to benchmark the prepro-light extension's
loading and rendering performance.

Usage:
    python3 generate_test_meshes.py

Output:
    Creates files in ./test_meshes/ directory:
    - mesh_10k_nodes.stl (10,000 nodes)
    - mesh_100k_nodes.stl (100,000 nodes)
    - mesh_1m_nodes.stl (1,000,000 nodes)
    Plus corresponding .obj files
"""

import os
import math
import struct
from pathlib import Path


def create_output_directory(dir_name="test_meshes"):
    """Create output directory for test meshes."""
    output_dir = Path(dir_name)
    output_dir.mkdir(exist_ok=True)
    return output_dir


def generate_sphere_mesh(num_nodes):
    """
    Generate a sphere mesh with approximately the specified number of nodes.

    Uses spherical coordinates to generate evenly distributed points.
    Returns vertices and triangular faces.

    Args:
        num_nodes: Target number of vertices (actual may vary slightly)

    Returns:
        tuple: (vertices, faces) where vertices is list of (x,y,z) tuples
               and faces is list of (v1,v2,v3) vertex index tuples
    """
    # Calculate grid resolution to approximate target node count
    # For a sphere: nodes ≈ lat_divisions * lon_divisions
    approx_divisions = int(math.sqrt(num_nodes))
    lat_divisions = approx_divisions
    lon_divisions = approx_divisions * 2  # More divisions in longitude

    vertices = []
    radius = 1.0

    # Generate vertices using spherical coordinates
    for i in range(lat_divisions + 1):
        theta = math.pi * i / lat_divisions  # latitude angle (0 to π)

        for j in range(lon_divisions):
            phi = 2 * math.pi * j / lon_divisions  # longitude angle (0 to 2π)

            # Convert spherical to Cartesian coordinates
            x = radius * math.sin(theta) * math.cos(phi)
            y = radius * math.sin(theta) * math.sin(phi)
            z = radius * math.cos(theta)

            vertices.append((x, y, z))

    # Generate triangular faces
    faces = []
    for i in range(lat_divisions):
        for j in range(lon_divisions):
            # Current vertex and its neighbors
            v1 = i * lon_divisions + j
            v2 = i * lon_divisions + (j + 1) % lon_divisions
            v3 = (i + 1) * lon_divisions + j
            v4 = (i + 1) * lon_divisions + (j + 1) % lon_divisions

            # Create two triangles for each quad
            if i > 0:  # Skip degenerate triangles at poles
                faces.append((v1, v2, v3))
            if i < lat_divisions - 1:
                faces.append((v2, v4, v3))

    return vertices, faces


def write_stl_binary(filename, vertices, faces):
    """
    Write mesh to binary STL format.

    Binary STL format:
    - 80 byte header
    - 4 byte unsigned int: number of triangles
    - For each triangle:
      - 12 bytes: normal vector (3 floats)
      - 36 bytes: 3 vertices, each 3 floats (x,y,z)
      - 2 bytes: attribute byte count (unused)
    """
    with open(filename, 'wb') as f:
        # Write 80-byte header
        header = f"Generated sphere mesh with {len(vertices)} nodes".ljust(80, '\0')
        f.write(header.encode('ascii')[:80])

        # Write number of triangles
        f.write(struct.pack('<I', len(faces)))

        # Write each triangle
        for face in faces:
            v1, v2, v3 = [vertices[i] for i in face]

            # Calculate normal vector using cross product
            edge1 = (v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2])
            edge2 = (v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2])

            normal = (
                edge1[1] * edge2[2] - edge1[2] * edge2[1],
                edge1[2] * edge2[0] - edge1[0] * edge2[2],
                edge1[0] * edge2[1] - edge1[1] * edge2[0]
            )

            # Normalize
            length = math.sqrt(sum(n**2 for n in normal))
            if length > 0:
                normal = tuple(n / length for n in normal)
            else:
                normal = (0, 0, 1)

            # Write normal
            f.write(struct.pack('<fff', *normal))

            # Write vertices
            f.write(struct.pack('<fff', *v1))
            f.write(struct.pack('<fff', *v2))
            f.write(struct.pack('<fff', *v3))

            # Write attribute byte count (unused)
            f.write(struct.pack('<H', 0))


def write_obj(filename, vertices, faces):
    """
    Write mesh to Wavefront OBJ format.

    OBJ format (ASCII):
    - Lines starting with 'v' define vertices: v x y z
    - Lines starting with 'f' define faces: f v1 v2 v3
    - Vertex indices in faces are 1-based
    """
    with open(filename, 'w') as f:
        # Write header comment
        f.write(f"# Generated sphere mesh with {len(vertices)} vertices and {len(faces)} faces\n")
        f.write(f"# Created by generate_test_meshes.py\n\n")

        # Write vertices
        for v in vertices:
            f.write(f"v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")

        f.write("\n")

        # Write faces (OBJ uses 1-based indexing)
        for face in faces:
            f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")


def write_vtp(filename, vertices, faces):
    """
    Write mesh to VTK PolyData XML format (.vtp).

    VTP is an XML-based format that stores polygonal data.
    This writes a simple ASCII XML format.
    """
    with open(filename, 'w') as f:
        f.write('<?xml version="1.0"?>\n')
        f.write('<VTKFile type="PolyData" version="1.0" byte_order="LittleEndian">\n')
        f.write('  <PolyData>\n')
        f.write(f'    <Piece NumberOfPoints="{len(vertices)}" NumberOfPolys="{len(faces)}">\n')

        # Write points
        f.write('      <Points>\n')
        f.write('        <DataArray type="Float32" NumberOfComponents="3" format="ascii">\n')
        for v in vertices:
            f.write(f'          {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n')
        f.write('        </DataArray>\n')
        f.write('      </Points>\n')

        # Write polygons
        f.write('      <Polys>\n')

        # Connectivity array (vertex indices)
        f.write('        <DataArray type="Int32" Name="connectivity" format="ascii">\n')
        for face in faces:
            f.write(f'          {face[0]} {face[1]} {face[2]}\n')
        f.write('        </DataArray>\n')

        # Offsets array (end index of each polygon)
        f.write('        <DataArray type="Int32" Name="offsets" format="ascii">\n')
        for i in range(1, len(faces) + 1):
            f.write(f'          {i * 3}\n')
        f.write('        </DataArray>\n')

        f.write('      </Polys>\n')
        f.write('    </Piece>\n')
        f.write('  </PolyData>\n')
        f.write('</VTKFile>\n')


def format_size(size_bytes):
    """Format file size in human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


def generate_test_mesh(num_nodes, output_dir, formats=['stl', 'obj', 'vtp']):
    """
    Generate a test mesh with specified number of nodes in multiple formats.

    Args:
        num_nodes: Target number of vertices
        output_dir: Directory to save files
        formats: List of formats to generate ('stl', 'obj', 'vtp')
    """
    print(f"\nGenerating mesh with ~{num_nodes:,} nodes...")

    # Generate mesh geometry
    vertices, faces = generate_sphere_mesh(num_nodes)
    actual_nodes = len(vertices)
    actual_faces = len(faces)

    print(f"  Generated: {actual_nodes:,} vertices, {actual_faces:,} faces")

    # Format suffix for filename
    if actual_nodes >= 1_000_000:
        suffix = f"{actual_nodes // 1_000_000}m"
    elif actual_nodes >= 1_000:
        suffix = f"{actual_nodes // 1_000}k"
    else:
        suffix = str(actual_nodes)

    # Write to requested formats
    files_created = []

    if 'stl' in formats:
        stl_file = output_dir / f"mesh_{suffix}_nodes.stl"
        write_stl_binary(stl_file, vertices, faces)
        size = os.path.getsize(stl_file)
        print(f"  Created: {stl_file.name} ({format_size(size)})")
        files_created.append(str(stl_file))

    if 'obj' in formats:
        obj_file = output_dir / f"mesh_{suffix}_nodes.obj"
        write_obj(obj_file, vertices, faces)
        size = os.path.getsize(obj_file)
        print(f"  Created: {obj_file.name} ({format_size(size)})")
        files_created.append(str(obj_file))

    if 'vtp' in formats:
        vtp_file = output_dir / f"mesh_{suffix}_nodes.vtp"
        write_vtp(vtp_file, vertices, faces)
        size = os.path.getsize(vtp_file)
        print(f"  Created: {vtp_file.name} ({format_size(size)})")
        files_created.append(str(vtp_file))

    return files_created


def main():
    """Generate test meshes with varying sizes."""
    print("=" * 70)
    print("VTK Mesh Performance Test File Generator")
    print("=" * 70)

    # Create output directory
    output_dir = create_output_directory()
    print(f"\nOutput directory: {output_dir.absolute()}")

    # Generate meshes with different sizes
    test_sizes = [
        10_000,    # 10K nodes
        100_000,   # 100K nodes
        250_000,   # 500K nodes
        500_000,   # 500K nodes
        1_000_000  # 1M nodes
    ]

    all_files = []
    for size in test_sizes:
        files = generate_test_mesh(size, output_dir, formats=['stl', 'obj', 'vtp'])
        all_files.extend(files)

    print("\n" + "=" * 70)
    print("Generation complete!")
    print("=" * 70)
    print(f"\nTotal files created: {len(all_files)}")
    print("\nTo test performance:")
    print("  1. Open VS Code")
    print("  2. Open any of the generated files in the test_meshes/ directory")
    print("  3. Observe loading and rendering time")
    print("\nFiles generated:")
    for f in all_files:
        print(f"  - {f}")
    print()


if __name__ == "__main__":
    main()
