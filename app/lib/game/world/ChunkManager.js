// ============================================================
// ChunkManager.js — Renders world using pixel art textures
// V3: Sprite-based rendering with PixelTextureGenerator
// ============================================================

import {
    TILE_SIZE, CHUNK_TILES, CHUNK_SIZE, CHUNKS_ACROSS,
    CHUNK_RENDER_RADIUS, TILE, OBSTACLE, OBSTACLE_PROPS,
    BIOME,
} from './WorldConfig';
import { SeededRandom } from './SeededRandom';

// Map tile types to texture keys
const TILE_TEX = {
    [TILE.GRASS]: i => `grass_${i % 4}`,
    [TILE.GRASS_ALT]: i => `grass_${(i + 2) % 4}`,
    [TILE.DIRT]: i => `dirt_${i % 2}`,
    [TILE.DIRT_ALT]: i => `dirt_${(i + 1) % 2}`,
    [TILE.ROAD_H]: () => 'road_h',
    [TILE.ROAD_V]: () => 'road_v',
    [TILE.ROAD_CROSS]: () => 'road_cross',
    [TILE.WATER]: () => 'water',
    [TILE.WATER_DEEP]: () => 'water_deep',
    [TILE.SAND]: () => 'sand',
    [TILE.CONCRETE]: () => 'concrete',
    [TILE.FOREST]: () => 'forest_floor',
};

const OBSTACLE_TEX = {
    [OBSTACLE.TREE]: 'tree',
    [OBSTACLE.TREE_PINE]: 'tree_pine',
    [OBSTACLE.ROCK_SMALL]: 'rock_small',
    [OBSTACLE.ROCK_LARGE]: 'rock_large',
    [OBSTACLE.BUSH]: 'bush',
    [OBSTACLE.CRATE]: 'crate',
    [OBSTACLE.BARREL]: 'barrel',
    [OBSTACLE.SANDBAG]: 'sandbag',
    [OBSTACLE.BARREL_EXPLOSIVE]: 'barrel_red',
    [OBSTACLE.WELL]: 'well',
    [OBSTACLE.STATUE]: 'statue',
    [OBSTACLE.SPIKE_TRAP]: 'trap_spikes',
    [OBSTACLE.MOVING_BLADE]: 'trap_blade',
    [OBSTACLE.PRESSURE_PLATE]: 'pressure_plate',
    [OBSTACLE.CHEST_LOCKED]: 'chest_locked',
    [OBSTACLE.TREASURE_CHEST]: 'chest',
};

export class ChunkManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.activeChunks = new Map();
        this.allBuildings = []; // Track buildings for dynamic alpha

        this.obstacleGroup = scene.physics.add.staticGroup();
        this.buildingGroup = scene.physics.add.staticGroup();
        this.lastChunkX = -999;
        this.lastChunkY = -999;
    }

    update(worldX, worldY) {
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkY = Math.floor(worldY / CHUNK_SIZE);

        if (chunkX !== this.lastChunkX || chunkY !== this.lastChunkY) {
            this.lastChunkX = chunkX;
            this.lastChunkY = chunkY;
            this._rebuildChunks(chunkX, chunkY);
        }

        // ── Dynamic Roof Transparency ──
        this.allBuildings.forEach(b => {
            if (!b.roofTiles || b.roofTiles.length === 0) return;
            const isInside = (worldX >= b.x && worldX <= b.x + b.w && worldY >= b.y && worldY <= b.y + b.h);
            const targetAlpha = isInside ? 0.12 : 0.65;

            b.roofTiles.forEach(tile => {
                if (tile.active) {
                    tile.alpha = Phaser.Math.Linear(tile.alpha, targetAlpha, 0.1);
                }
            });
        });

        // Cleanup stale building references
        if (this.scene.time.now % 1000 < 20) {
            this.allBuildings = this.allBuildings.filter(b => b.roofTiles[0]?.active);
        }
    }

    getObstacleGroup() { return this.obstacleGroup; }
    getBuildingGroup() { return this.buildingGroup; }

    destroy() {
        this.activeChunks.forEach(chunk => this._unloadChunk(chunk));
        this.activeChunks.clear();
    }

    // ═══════════════════════════════════════════════════════
    // CHUNK LIFECYCLE
    // ═══════════════════════════════════════════════════════

    _rebuildChunks(cx, cy) {
        const r = CHUNK_RENDER_RADIUS;
        const needed = new Set();

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                const nx = cx + dx, ny = cy + dy;
                if (nx < 0 || ny < 0 || nx >= CHUNKS_ACROSS || ny >= CHUNKS_ACROSS) continue;
                needed.add(`${nx},${ny}`);
            }
        }

        for (const [key, chunk] of this.activeChunks) {
            if (!needed.has(key)) {
                this._unloadChunk(chunk);
                this.activeChunks.delete(key);
            }
        }

        for (const key of needed) {
            if (!this.activeChunks.has(key)) {
                const [x, y] = key.split(',').map(Number);
                this.activeChunks.set(key, this._loadChunk(x, y));
            }
        }
    }

    _loadChunk(chunkX, chunkY) {
        const chunk = { chunkX, chunkY, objects: [] };
        this._renderGround(chunk);
        this._spawnObstacles(chunk);
        this._spawnBuildings(chunk);
        return chunk;
    }

    _unloadChunk(chunk) {
        chunk.objects.forEach(obj => {
            if (obj._isObstacle) this.obstacleGroup.remove(obj, true, true);
            else if (obj._isWall) this.buildingGroup.remove(obj, true, true);
            else obj.destroy();
        });
        chunk.objects = [];
    }

    _track(chunk, obj) { chunk.objects.push(obj); return obj; }

    // ═══════════════════════════════════════════════════════
    // GROUND — Texture-based tiles with micro-clutter
    // ═══════════════════════════════════════════════════════

    _renderGround(chunk) {
        const stx = chunk.chunkX * CHUNK_TILES;
        const sty = chunk.chunkY * CHUNK_TILES;
        const biome = this.world.getBiome(stx, sty);
        const rng = new SeededRandom(chunk.chunkX * 123 + chunk.chunkY * 456);

        for (let ty = 0; ty < CHUNK_TILES; ty++) {
            for (let tx = 0; tx < CHUNK_TILES; tx++) {
                const wtx = stx + tx;
                const wty = sty + ty;
                const tileType = this.world.getTile(wtx, wty);
                const texFn = TILE_TEX[tileType];
                if (!texFn) continue;

                const texKey = texFn(wtx + wty * 7);
                if (!this.scene.textures.exists(texKey)) continue;

                const wx = wtx * TILE_SIZE + TILE_SIZE / 2;
                const wy = wty * TILE_SIZE + TILE_SIZE / 2;

                const tileImg = this.scene.add.image(wx, wy, texKey).setDepth(0);
                this._track(chunk, tileImg);

                // ── FAKE ELEVATION LIGHTING ──
                // Sample biological elevation rather than just biome
                const elevation = this.world.getElevation ? this.world.getElevation(wtx * 0.1, wty * 0.1) : 0.5;
                if (tileType !== TILE.ROAD_H && tileType !== TILE.ROAD_V && tileType !== TILE.ROAD_CROSS) {
                    if (elevation < 0.3) {
                        tileImg.setTint(0xcccccc); // Lowlands darker
                    } else if (elevation > 0.7) {
                        // Lighten the peaks using WebGL post-process or additive graphic
                        // Since tint can't easily go above white, we slightly darken baseline and leave peaks pure white
                    } else {
                        // Natural blend
                        const val = Math.floor(200 + (elevation * 55));
                        tileImg.setTint((val << 16) + (val << 8) + val);
                    }
                }

                // ── Add Ground Clutter (Cracks/Grass Tufts) ──
                if (rng.next() > 0.96) {
                    const isHard = (tileType === TILE.ROAD_H || tileType === TILE.ROAD_V || tileType === TILE.CONCRETE);
                    const clutterKey = isHard ? 'clutter_crack' : 'clutter_grass';
                    if (this.scene.textures.exists(clutterKey)) {
                        this._track(chunk,
                            this.scene.add.image(wx + (rng.next() - 0.5) * 10, wy + (rng.next() - 0.5) * 10, clutterKey)
                                .setDepth(0.5).setAlpha(isHard ? 0.3 : 0.6).setRotation(rng.next() * Math.PI)
                        );
                    }
                }
            }
        }

        // Spawn street lamps along roads in urban chunks
        // ── Interactive Objects (Chests, Wells, Barrels, Traps) ──
        if (biome === BIOME.URBAN || biome === BIOME.RUINS) {
            for (let i = 0; i < 4; i++) {
                if (rng.chance(0.15)) {
                    const ox = stx + 64 + rng.next() * (CHUNK_SIZE - 128);
                    const oy = sty + 64 + rng.next() * (CHUNK_SIZE - 128);
                    const oType = rng.pick([
                        OBSTACLE.TREASURE_CHEST, OBSTACLE.CHEST_LOCKED,
                        OBSTACLE.BARREL_EXPLOSIVE,
                        OBSTACLE.WELL, OBSTACLE.SPIKE_TRAP,
                        OBSTACLE.MOVING_BLADE, OBSTACLE.PRESSURE_PLATE
                    ]);
                    this._spawnProp(chunk, ox, oy, oType);
                }
            }
        }

        // ── Ambient Details (Visual Depth) ──
        for (let i = 0; i < 5; i++) {
            if (rng.chance(0.3)) {
                const dx = stx + rng.next() * CHUNK_SIZE;
                const dy = sty + rng.next() * CHUNK_SIZE;
                const tex = rng.pick(['road_crack', 'dirt_patch']);
                this._track(chunk, this.scene.add.image(dx, dy, tex).setDepth(1.1).setAlpha(0.2));
            }
        }

        this._spawnStreetLamps(chunk, stx, sty);
    }

    _spawnProp(chunk, x, y, type) {
        const props = OBSTACLE_PROPS[type] ?? { width: 24, height: 24, solid: true, destructible: false };

        // Dynamic Depth Sorting
        const spriteDepth = y / 10;

        // Soft Shadow (Visual Upgrade)
        this._track(chunk, this.scene.add.image(x + 2, y + 2, 'shadow_circle')
            .setDepth(spriteDepth - 0.1).setAlpha(0.2).setScale(props.width / 32, props.height / 48));

        const sprite = this._track(chunk, this.scene.add.image(x, y, type).setDepth(spriteDepth));
        this.scene.physics.add.existing(sprite, true);
        sprite.body.setSize(props.width, props.height);
        sprite._isObstacle = true;
        this.obstacleGroup.add(sprite);
        return sprite;
    }

    _spawnStreetLamps(chunk, stx, sty) {
        const urban = this.world.getBiome(stx + 16, sty + 16) === 'urban';
        if (!urban) return;

        for (let ty = 0; ty < CHUNK_TILES; ty += 8) {
            for (let tx = 0; tx < CHUNK_TILES; tx += 8) {
                const wtx = stx + tx;
                const wty = sty + ty;
                const tile = this.world.getTile(wtx, wty);

                if (tile === TILE.ROAD_V || tile === TILE.ROAD_H) {
                    const lx = wtx * TILE_SIZE + (tile === TILE.ROAD_V ? -20 : 0);
                    const ly = wty * TILE_SIZE + (tile === TILE.ROAD_H ? -20 : 0);

                    // Lamp Sprite
                    this._track(chunk, this.scene.add.image(lx, ly, 'street_lamp').setDepth(4.5));

                    // Lamp Glow
                    if (this.scene.textures.exists('light_glow')) {
                        this._track(chunk,
                            this.scene.add.image(lx, ly - 5, 'light_glow')
                                .setDepth(2).setScale(1.5).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD)
                        );
                    }

                    // Physics
                    const lampBody = this._track(chunk, this.scene.add.circle(lx, ly, 4, 0x000, 0));
                    this.scene.physics.add.existing(lampBody, true);
                    this.obstacleGroup.add(lampBody);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // OBSTACLES — Texture-based sprites with shadows
    // ═══════════════════════════════════════════════════════

    _spawnObstacles(chunk) {
        const obstacleData = this.world.getChunkObstacles(chunk.chunkX, chunk.chunkY);

        for (const data of obstacleData) {
            const texKey = OBSTACLE_TEX[data.type];
            const props = OBSTACLE_PROPS[data.type];
            if (!texKey || !props) continue;
            if (!this.scene.textures.exists(texKey)) continue;

            // Dynamic Y-Depth sorting based on screen position
            const spriteDepth = data.y / 10;

            // Shadow
            if (this.scene.textures.exists('shadow_circle')) {
                const shadow = this._track(chunk,
                    this.scene.add.image(data.x + 3, data.y + 12, 'shadow_circle')
                        .setDepth(spriteDepth - 0.1)
                        .setAlpha(0.4)
                );
                // Scale shadow for larger objects
                if (data.type === OBSTACLE.TREE || data.type === OBSTACLE.TREE_PINE) {
                    shadow.setScale(1.4, 0.8);
                }
            }

            // Sprite
            const sprite = this._track(chunk,
                this.scene.add.image(data.x, data.y, texKey)
                    .setDepth(spriteDepth)
            );

            // Physics body for solid obstacles
            if (props.solid) {
                this.scene.physics.add.existing(sprite, true);
                sprite.body.setSize(props.width, props.height);
                // Center the body on the sprite
                const tex = this.scene.textures.get(texKey);
                const frame = tex.get();
                const offX = (frame.width - props.width) / 2;
                const offY = (frame.height - props.height) / 2;
                sprite.body.setOffset(offX, offY);

                sprite._isObstacle = true;
                this.obstacleGroup.add(sprite);
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // BUILDINGS — Texture-based with wall physics
    // ═══════════════════════════════════════════════════════

    _spawnBuildings(chunk) {
        const buildingData = this.world.getChunkBuildings(chunk.chunkX, chunk.chunkY);
        const rng = new SeededRandom(chunk.chunkX * 4321 + chunk.chunkY * 8765);

        for (const data of buildingData) {
            // Register building for dynamic updates
            this.allBuildings.push(data);
            data.roofTiles = [];

            // ── Fencing (Residential Only) ──
            const isHome = data.label.toLowerCase().includes('house') || data.label.toLowerCase().includes('home');
            if (isHome) this._spawnFencing(chunk, data);

            // ── Shadow ──
            const shadowG = this._track(chunk, this.scene.add.graphics());
            shadowG.setDepth(2);
            shadowG.fillStyle(0x000000, 0.25);
            shadowG.fillRect(data.x + 8, data.y + 8, data.w, data.h);

            // ── Foundation ──
            const foundG = this._track(chunk, this.scene.add.graphics());
            foundG.setDepth(3);
            foundG.fillStyle(0x222222, 0.9);
            foundG.fillRect(data.x - 2, data.y - 2, data.w + 4, data.h + 4);

            // ── Interior Rooms Definition ──
            data.rooms = [];
            if (data.label.toLowerCase().includes('manor')) {
                const midX = Math.floor(data.w / (2 * TILE_SIZE)) * TILE_SIZE;
                const midY = Math.floor(data.h / (2 * TILE_SIZE)) * TILE_SIZE;
                data.rooms = [
                    { name: 'Living Room', x: 0, y: 0, w: midX, h: midY },
                    { name: 'Bedroom 1', x: midX, y: 0, w: data.w - midX, h: midY },
                    { name: 'Kitchen', x: 0, y: midY, w: midX / 2, h: data.h - midY },
                    { name: 'Hallway', x: midX / 2, y: midY, w: midX / 2, h: data.h - midY },
                    { name: 'Storage', x: midX, y: midY, w: data.w - midX, h: data.h - midY }
                ];
            }

            // ── Interior Floor ──
            if (this.scene.textures.exists('floor')) {
                for (let fy = 0; fy < data.h; fy += TILE_SIZE) {
                    for (let fx = 0; fx < data.w; fx += TILE_SIZE) {
                        this._track(chunk,
                            this.scene.add.image(data.x + fx + TILE_SIZE / 2, data.y + fy + TILE_SIZE / 2, 'floor')
                                .setDepth(3.1)
                        );
                    }
                }
            }

            // ── Furniture (Type-Aware) ──
            this._spawnInteriorFurniture(chunk, data, rng);

            // ── Walls (Architectural Styles) ──
            const isTemple = data.label.toLowerCase().includes('temple');
            const isManor = data.label.toLowerCase().includes('manor');
            const wallTexture = isTemple ? 'wall_temple' : 'wall';

            if (this.scene.textures.exists(wallTexture)) {
                for (let wy = 0; wy < data.h; wy += TILE_SIZE) {
                    for (let wx = 0; wx < data.w; wx += TILE_SIZE) {
                        const isEdge = (wx === 0 || wy === 0 || wx >= data.w - TILE_SIZE || wy >= data.h - TILE_SIZE);
                        const doorArea = (wy >= data.h - TILE_SIZE && wx >= data.w / 2 - TILE_SIZE && wx <= data.w / 2);

                        // Internal Walls for 5-room layout
                        let isInternal = false;
                        if (isManor) {
                            const midX = Math.floor(data.w / (2 * TILE_SIZE)) * TILE_SIZE;
                            const midY = Math.floor(data.h / (2 * TILE_SIZE)) * TILE_SIZE;
                            // Cross partition
                            if ((wx === midX || wy === midY) && !doorArea) {
                                // Add door gaps in internal walls
                                const inDoorX = (wx === midX && Math.abs(wy - midY / 2) < TILE_SIZE);
                                const inDoorY = (wy === midY && Math.abs(wx - midX / 2) < TILE_SIZE);
                                if (!inDoorX && !inDoorY) isInternal = true;
                            }
                        }

                        if ((isEdge || isInternal) && !doorArea) {
                            this._track(chunk, this.scene.add.image(data.x + wx + TILE_SIZE / 2, data.y + wy + TILE_SIZE / 2, wallTexture).setDepth(4));
                        }
                    }
                }
            }

            // ── Special Decorations (Temples) ──
            if (isTemple) {
                // Pillars at corners
                const corners = [[0, 0], [data.w, 0], [0, data.h], [data.w, data.h]];
                corners.forEach(c => {
                    this._track(chunk, this.scene.add.image(data.x + c[0], data.y + c[1], 'pillar').setDepth(9));
                });
            }

            // ── Roof (Correctly Centered Alignment) ──
            if (this.scene.textures.exists('roof')) {
                const overhang = 8;
                const rsX = data.x - overhang;
                const rsY = data.y - overhang;
                const reX = data.x + data.w + overhang;
                const reY = data.y + data.h + overhang;

                for (let ry = rsY; ry < reY; ry += TILE_SIZE) {
                    for (let rx = rsX; rx < reX; rx += TILE_SIZE) {
                        const tile = this.scene.add.image(rx + TILE_SIZE / 2, ry + TILE_SIZE / 2, 'roof')
                            .setDepth(8).setAlpha(0.65);
                        this._track(chunk, tile);
                        data.roofTiles.push(tile);
                    }
                }
            }

            // ── Windows ──
            if (this.scene.textures.exists('window')) {
                const winSpacing = 24;
                for (let wx = data.x + 16; wx < data.x + data.w - 16; wx += winSpacing) {
                    const litKey = rng.chance(0.3) ? 'window_lit' : 'window';
                    this._track(chunk, this.scene.add.image(wx, data.y, litKey).setDepth(9));
                }
            }

            // ── Door ──
            if (this.scene.textures.exists('door')) {
                this._track(chunk, this.scene.add.image(data.x + data.w / 2, data.y + data.h, 'door').setDepth(9).setScale(0.8));
            }

            // ── Label ──
            this._track(chunk, this.scene.add.text(
                data.x + data.w / 2, data.y - 15, data.label.toUpperCase(),
                { fontSize: '11px', fontFamily: 'monospace', color: '#fbbf24', stroke: '#000', strokeThickness: 4 }
            ).setOrigin(0.5).setDepth(10));

            // ── Physics ──
            const wt = 8;
            this._addWall(chunk, data.x, data.y, data.w, wt); // Top
            this._addWall(chunk, data.x, data.y, wt, data.h); // Left
            this._addWall(chunk, data.x + data.w - wt, data.y, wt, data.h); // Right
            const gap = 32;
            this._addWall(chunk, data.x, data.y + data.h - wt, data.w / 2 - gap / 2, wt);
            this._addWall(chunk, data.x + data.w / 2 + gap / 2, data.y + data.h - wt, data.w / 2 - gap / 2, wt);
        }
    }

    _spawnInteriorFurniture(chunk, data, rng) {
        const type = data.label.toLowerCase();
        const basePool = (type.includes('house') || type.includes('home'))
            ? ['table', 'chair', 'bed']
            : ['crate', 'barrel'];

        const count = 7 + Math.floor(rng.next() * 8);
        const placed = [];

        for (let i = 0; i < count; i++) {
            const fxOffset = 24 + rng.next() * (data.w - 64);
            const fyOffset = 24 + rng.next() * (data.h - 64);
            const fx = data.x + fxOffset;
            const fy = data.y + fyOffset;

            // Determine specific room pool if rooms exist
            let pool = basePool;
            if (data.rooms && data.rooms.length > 0) {
                const room = data.rooms.find(r =>
                    fxOffset >= r.x && fxOffset < r.x + r.w &&
                    fyOffset >= r.y && fyOffset < r.y + r.h
                );
                if (room) {
                    if (room.name === 'Kitchen') pool = ['table', 'fridge'];
                    else if (room.name === 'Storage') pool = ['crate', 'barrel'];
                    else if (room.name.includes('Bedroom')) pool = ['bed', 'drawer'];
                    else if (room.name === 'Living Room') pool = ['couch', 'tv', 'chair'];
                }
            }

            const itemType = pool[Math.floor(rng.next() * pool.length)];

            // Spacing check
            let overlap = false;
            for (const p of placed) {
                if (Phaser.Math.Distance.Between(fx, fy, p.x, p.y) < 28) { overlap = true; break; }
            }
            if (overlap) continue;

            const item = this._track(chunk,
                this.scene.add.image(fx, fy, itemType).setDepth(5).setOrigin(0.5).setScale(0.9)
            );
            placed.push({ x: fx, y: fy });

            this.scene.physics.add.existing(item, true);
            item._isObstacle = true;
            this.obstacleGroup.add(item);
        }
    }

    _spawnFencing(chunk, data) {
        const margin = 40;
        const fy = data.y + data.h + 20;
        const fx = data.x - margin;
        const fw = data.w + margin * 2;

        // Draw horizontal fence at bottom of yard
        for (let x = 0; x < fw; x += 32) {
            this._track(chunk, this.scene.add.image(fx + x + 16, fy, 'fence_h').setDepth(4));
        }

        // Draw side fences
        for (let y = 0; y < data.h + 40; y += 32) {
            this._track(chunk, this.scene.add.image(data.x - margin, data.y + y - 20, 'fence_v').setDepth(4));
            this._track(chunk, this.scene.add.image(data.x + data.w + margin, data.y + y - 20, 'fence_v').setDepth(4));
        }
    }

    _addWall(chunk, x, y, w, h) {
        if (w <= 0 || h <= 0) return;
        const wall = this._track(chunk, this.scene.add.rectangle(x + w / 2, y + h / 2, w, h));
        wall.setVisible(false);
        this.scene.physics.add.existing(wall, true);
        wall._isWall = true;
        this.buildingGroup.add(wall);
    }
}
