# Webclient

The webclient rendering system works as described below.

## Entities

### Scene

Upon request, the client generates a `Scene`, which is made up of a `Terrain` and a `World`, around a given position.

This will typically be driven by the server, when the player walks too far since their last scene generation.

In revision 435, this is represented by packet `166`, in 317 it is packet `73`.

### Terrain

The `Terrain` represents the ground tiles of a scene. They are loaded from the `m00_00` map files.

A `Terrain` contains a 3-dimensional array of `TerrainTile` which can either contain a `TilePaint` or a `TileModel`.

- `TilePaint` represents a tile with 4 corner vertices and 2 triangles
- `TileModel` represents a tile which contains more than the 4 corner vertices, to represent some more complex shape

The concepts of `TilePaint` and `TileModel` are often called `underlay` and `overlay` respectively.

### World

The `World` represents the non-ground items making up a game scene:

- map objects (walls, etc)
- interactible objects
- players
- npcs
- items
- projectiles ?

## Rendering

Currently, only the terrain is rendered.

The terrain is passed through `uploadTerrain` which iterates through the `TerrainTiles` and adds their vertices and color information to a set of arrays.

These arrays are then passed to ThreeJS to create the mesh.