// ============================================================
// ProceduralWorld.js — Seeded procedural terrain generator
// Generates tile data, obstacles, buildings, roads per chunk
// ============================================================

import { SeededRandom } from './SeededRandom';
import {
    TILE, TILE_PROPS, OBSTACLE, OBSTACLE_PROPS,
    BUILDING_TYPE, BUILDING_PROPS,
    BIOME, BIOME_PROPS,
    WORLD_TILES, TILE_SIZE, CHUNK_TILES, WORLD_SIZE,
} from './WorldConfig';

export class ProceduralWorld {
    constructor(seed = 12345) {
        this.seed = seed;
        this.rng = new SeededRandom(seed);

        // Pre-generate biome map (low resolution: 1 per 16 tiles)
        this.biomeScale = 16;
        this.biomeMap = this._generateBiomeMap();

        // Pre-generate road network
        this.roads = this._generateRoadNetwork();

        // Pre-generate building placements
        this.buildings = this._generateBuildingPlacements();
    }

    // ═══════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════

    /** Get tile type at world tile coordinate */
    getTile(tileX, tileY) {
        if (tileX < 0 || tileX >= WORLD_TILES || tileY < 0 || tileY >= WORLD_TILES) {
            return TILE.WATER_DEEP; // Out of bounds = deep water
        }

        // Check if it's a road
        if (this._isRoad(tileX, tileY)) {
            return this._getRoadTile(tileX, tileY);
        }

        // Check if it's inside a building footprint
        if (this._isBuildingTile(tileX, tileY)) {
            return TILE.CONCRETE;
        }

        // Get biome and return base tile with variation
        const biome = this.getBiome(tileX, tileY);
        const biomeProps = BIOME_PROPS[biome];
        const rng = this.rng.fork(tileX * 1000 + tileY);

        // Add tile variation
        if (biomeProps.baseTile === TILE.GRASS && rng.chance(0.3)) {
            return TILE.GRASS_ALT;
        }
        if (biomeProps.baseTile === TILE.DIRT && rng.chance(0.3)) {
            return TILE.DIRT_ALT;
        }

        return biomeProps.baseTile;
    }

    /** Get biome at tile coordinate */
    getBiome(tileX, tileY) {
        const bx = Math.floor(tileX / this.biomeScale);
        const by = Math.floor(tileY / this.biomeScale);
        const key = `${bx},${by}`;
        return this.biomeMap.get(key) || BIOME.GRASSLAND;
    }

    /** Generate obstacles for a chunk */
    getChunkObstacles(chunkX, chunkY) {
        const obstacles = [];
        const chunkRng = this.rng.fork(chunkX * 9999 + chunkY * 7777);
        const startTileX = chunkX * CHUNK_TILES;
        const startTileY = chunkY * CHUNK_TILES;

        for (let ty = 0; ty < CHUNK_TILES; ty++) {
            for (let tx = 0; tx < CHUNK_TILES; tx++) {
                const worldTX = startTileX + tx;
                const worldTY = startTileY + ty;

                // Skip roads and buildings
                if (this._isRoad(worldTX, worldTY)) continue;
                if (this._isBuildingTile(worldTX, worldTY)) continue;

                const tile = this.getTile(worldTX, worldTY);
                const tileProp = TILE_PROPS[tile];
                if (!tileProp || !tileProp.walkable) continue;

                const biome = this.getBiome(worldTX, worldTY);
                const biomeProp = BIOME_PROPS[biome];
                const localRng = chunkRng.fork(tx * 100 + ty);

                // Trees - Organic density clustering
                // This replaces pure randomness with mathematical clustering logic (groves and clearings)
                const clusterNoise = this.rng.smoothNoise2D(worldTX, worldTY, 4);
                const densityThreshold = 1.0 - (biomeProp.treeDensity * 5); // Base threshold drops if biome has high density

                if (clusterNoise > densityThreshold && localRng.chance(0.6)) {
                    const type = biome === BIOME.FOREST
                        ? localRng.pick([OBSTACLE.TREE, OBSTACLE.TREE_PINE, OBSTACLE.TREE_PINE])
                        : localRng.pick([OBSTACLE.TREE, OBSTACLE.BUSH]);
                    obstacles.push({
                        type,
                        x: worldTX * TILE_SIZE + localRng.nextFloat(4, TILE_SIZE - 4),
                        y: worldTY * TILE_SIZE + localRng.nextFloat(4, TILE_SIZE - 4),
                    });
                }

                // Rocks
                if (localRng.chance(biomeProp.rockDensity)) {
                    obstacles.push({
                        type: localRng.pick([OBSTACLE.ROCK_SMALL, OBSTACLE.ROCK_LARGE]),
                        x: worldTX * TILE_SIZE + localRng.nextFloat(4, TILE_SIZE - 4),
                        y: worldTY * TILE_SIZE + localRng.nextFloat(4, TILE_SIZE - 4),
                    });
                }

                // Urban clutter (crates, barrels near buildings)
                if (biome === BIOME.URBAN && localRng.chance(0.005)) {
                    obstacles.push({
                        type: localRng.pick([OBSTACLE.CRATE, OBSTACLE.BARREL, OBSTACLE.SANDBAG]),
                        x: worldTX * TILE_SIZE + TILE_SIZE / 2,
                        y: worldTY * TILE_SIZE + TILE_SIZE / 2,
                    });
                }
            }
        }

        return obstacles;
    }

    /** Get buildings that have their origin in this chunk */
    getChunkBuildings(chunkX, chunkY) {
        const startX = chunkX * CHUNK_TILES * TILE_SIZE;
        const startY = chunkY * CHUNK_TILES * TILE_SIZE;
        const endX = startX + CHUNK_TILES * TILE_SIZE;
        const endY = startY + CHUNK_TILES * TILE_SIZE;

        return this.buildings.filter(b =>
            b.x >= startX && b.x < endX && b.y >= startY && b.y < endY
        );
    }

    /** Returns geographical elevation from 0.0 (water) to 1.0 (peaks) */
    getElevation(x, y) {
        // Layered noise for organic elevation map
        // Base continent shapes
        const base = this.rng.smoothNoise2D(x, y, 0.5) * 0.6;
        // Detail hills
        const hills = this.rng.smoothNoise2D(x, y, 3) * 0.3;
        // Micro bumps
        const bumps = this.rng.smoothNoise2D(x, y, 10) * 0.1;

        return Math.min(1, Math.max(0, base + hills + bumps));
    }

    // ═══════════════════════════════════════════════════════
    // PRIVATE: BIOME GENERATION
    // ═══════════════════════════════════════════════════════

    _generateBiomeMap() {
        const map = new Map();
        const biomeTypes = Object.values(BIOME);
        const gridSize = Math.ceil(WORLD_TILES / this.biomeScale);

        for (let by = 0; by < gridSize; by++) {
            for (let bx = 0; bx < gridSize; bx++) {
                const noise = this.rng.smoothNoise2D(bx, by, 4);

                // Distance from center (for lake in middle)
                const cx = gridSize / 2;
                const cy = gridSize / 2;
                const dist = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2) / (gridSize / 2);

                let biome;
                // Lake in center-ish area
                if (dist < 0.15 && noise < 0.5) {
                    biome = BIOME.LAKESIDE;
                }
                // Village near center (Safe Hub)
                else if (dist < 0.3 && noise > 0.4 && noise < 0.55) {
                    biome = BIOME.VILLAGE;
                }
                // Ruins / Ancient Temples (High risk, high rewards)
                else if (dist > 0.6 && noise > 0.8) {
                    biome = BIOME.RUINS;
                }
                // Military Base (Elite Danger Zone)
                else if (dist > 0.85 && noise > 0.75) {
                    biome = BIOME.MILITARY_BASE;
                }
                // Urban clusters (Tactical city blocks)
                else if (noise > 0.65 && dist > 0.2 && dist < 0.75) {
                    biome = BIOME.URBAN;
                }
                // Forest belts (Ambush woods)
                else if (noise < 0.3 && dist > 0.15) {
                    biome = BIOME.FOREST;
                }
                // Wasteland on edges (Dead lands)
                else if (dist > 0.8) {
                    biome = BIOME.WASTELAND;
                }
                // Default grassland (Safe starting traversals)
                else {
                    biome = BIOME.GRASSLAND;
                }

                map.set(`${bx},${by}`, biome);
            }
        }

        return map;
    }

    // ═══════════════════════════════════════════════════════
    // PRIVATE: ROAD NETWORK
    // ═══════════════════════════════════════════════════════

    _generateRoadNetwork() {
        const roads = new Set();
        const roadRng = this.rng.fork(777);

        // Main highways (horizontal)
        const numHRoads = 4 + roadRng.nextInt(0, 2);
        for (let i = 0; i < numHRoads; i++) {
            const baseY = Math.floor((WORLD_TILES / (numHRoads + 1)) * (i + 1)) + roadRng.nextInt(-10, 10);
            for (let x = 0; x < WORLD_TILES; x++) {
                // Determine y curve naturally pulling road slightly off-grid
                const curveOffset = Math.floor(this.rng.smoothNoise2D(x, baseY, 2) * 12);
                const cy = baseY + curveOffset;
                roads.add(`${x},${cy}`);
                roads.add(`${x},${cy + 1}`); // 2-tile wide road
            }
        }

        // Main highways (vertical)
        const numVRoads = 4 + roadRng.nextInt(0, 2);
        for (let i = 0; i < numVRoads; i++) {
            const baseX = Math.floor((WORLD_TILES / (numVRoads + 1)) * (i + 1)) + roadRng.nextInt(-10, 10);
            for (let y = 0; y < WORLD_TILES; y++) {
                // Determine x curve naturally pulling road slightly off-grid
                const curveOffset = Math.floor(this.rng.smoothNoise2D(baseX, y, 2) * 12);
                const cx = baseX + curveOffset;
                roads.add(`${cx},${y}`);
                roads.add(`${cx + 1},${y}`); // 2-tile wide road
            }
        }

        // Secondary roads (connecting random points)
        for (let i = 0; i < 12; i++) {
            const sx = roadRng.nextInt(30, WORLD_TILES - 30);
            const sy = roadRng.nextInt(30, WORLD_TILES - 30);
            const dir = roadRng.chance(0.5) ? 'h' : 'v';
            const len = roadRng.nextInt(40, 120);

            for (let d = 0; d < len; d++) {
                const tx = dir === 'h' ? sx + d : sx;
                const ty = dir === 'v' ? sy + d : sy;
                if (tx >= 0 && tx < WORLD_TILES && ty >= 0 && ty < WORLD_TILES) {
                    roads.add(`${tx},${ty}`);
                }
            }
        }

        return roads;
    }

    _isRoad(tileX, tileY) {
        return this.roads.has(`${tileX},${tileY}`);
    }

    _getRoadTile(tileX, tileY) {
        const hasH = this.roads.has(`${tileX - 1},${tileY}`) || this.roads.has(`${tileX + 1},${tileY}`);
        const hasV = this.roads.has(`${tileX},${tileY - 1}`) || this.roads.has(`${tileX},${tileY + 1}`);
        if (hasH && hasV) return TILE.ROAD_CROSS;
        if (hasV) return TILE.ROAD_V;
        return TILE.ROAD_H;
    }

    // ═══════════════════════════════════════════════════════
    // PRIVATE: BUILDING PLACEMENT
    // ═══════════════════════════════════════════════════════

    _generateBuildingPlacements() {
        const buildings = [];
        const buildRng = this.rng.fork(888);
        const buildingTypes = Object.values(BUILDING_TYPE);

        // Grid-based placement with buffer for large structures
        const gridStep = 35;
        for (let ty = 15; ty < WORLD_TILES - 15; ty += gridStep) {
            for (let tx = 15; tx < WORLD_TILES - 15; tx += gridStep) {
                const biome = this.getBiome(tx, ty);
                const density = BIOME_PROPS[biome].buildingDensity;
                const localRng = buildRng.fork(tx * 500 + ty);

                // Chance based on density
                if (!localRng.chance(density * gridStep * gridStep)) continue;

                // Biome-specific building types
                let filteredTypes = [BUILDING_TYPE.HOUSE_SMALL];
                if (biome === BIOME.URBAN) {
                    filteredTypes = [BUILDING_TYPE.HOUSE_LARGE, BUILDING_TYPE.WAREHOUSE, BUILDING_TYPE.GARAGE, BUILDING_TYPE.HOUSE_5ROOM];
                } else if (biome === BIOME.RUINS) {
                    filteredTypes = [BUILDING_TYPE.TEMPLE, BUILDING_TYPE.HOUSE_5ROOM, BUILDING_TYPE.GUARD_TOWER];
                } else if (biome === BIOME.GRASSLAND) {
                    filteredTypes = [BUILDING_TYPE.HOUSE_SMALL, BUILDING_TYPE.GARAGE];
                } else if (biome === BIOME.FOREST) {
                    filteredTypes = [BUILDING_TYPE.HOUSE_SMALL, BUILDING_TYPE.GUARD_TOWER];
                }

                const type = localRng.pick(filteredTypes);
                const props = BUILDING_PROPS[type];

                // Random offset within the grid cell
                const offsetX = localRng.nextInt(0, gridStep - props.tilesW);
                const offsetY = localRng.nextInt(0, gridStep - props.tilesH);

                const tileX = tx + offsetX;
                const tileY = ty + offsetY;
                const wx = tileX * TILE_SIZE;
                const wy = tileY * TILE_SIZE;

                // CRITICAL SHIFT: Ensure spawn point is clear
                const spawnX = WORLD_SIZE / 2;
                const spawnY = WORLD_SIZE / 2;
                if (Math.abs(wx - spawnX) < 256 && Math.abs(wy - spawnY) < 256) continue;

                // CRITICAL: Ensure no overlap with roads
                let onRoad = false;
                for (let ry = 0; ry < props.tilesH; ry++) {
                    for (let rx = 0; rx < props.tilesW; rx++) {
                        if (this._isRoad(tileX + rx, tileY + ry)) {
                            onRoad = true;
                            break;
                        }
                    }
                    if (onRoad) break;
                }
                if (onRoad) continue;

                buildings.push({
                    type,
                    tileX,
                    tileY,
                    x: tileX * TILE_SIZE,
                    y: tileY * TILE_SIZE,
                    w: props.tilesW * TILE_SIZE,
                    h: props.tilesH * TILE_SIZE,
                    ...props,
                    id: `bld_${buildings.length}`,
                });
            }
        }

        return buildings;
    }

    _isBuildingTile(tileX, tileY) {
        for (const b of this.buildings) {
            if (
                tileX >= b.tileX && tileX < b.tileX + b.tilesW &&
                tileY >= b.tileY && tileY < b.tileY + b.tilesH
            ) {
                return true;
            }
        }
        return false;
    }
}
