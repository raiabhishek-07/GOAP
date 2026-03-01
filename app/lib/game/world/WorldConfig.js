// ============================================================
// WorldConfig.js — World constants & biome definitions
// Multiplayer-ready: All config is serializable
// ============================================================

// ─── WORLD DIMENSIONS ──────────────────────────────────────
export const TILE_SIZE = 32;           // pixels per tile
export const WORLD_TILES = 500;        // 500×500 tiles
export const WORLD_SIZE = WORLD_TILES * TILE_SIZE; // 16,000×16,000px

// ─── CHUNK SYSTEM ──────────────────────────────────────────
export const CHUNK_TILES = 32;         // tiles per chunk (32×32)
export const CHUNK_SIZE = CHUNK_TILES * TILE_SIZE; // 1024px per chunk
export const CHUNKS_ACROSS = Math.ceil(WORLD_TILES / CHUNK_TILES); // ~16 chunks

// How many chunks to render around the player (radius)
// 3 = 7x7 grid = 49 chunks active (better for zoom-out visibility)
export const CHUNK_RENDER_RADIUS = 3;

// ─── TILE TYPES ────────────────────────────────────────────
export const TILE = {
    GRASS: 0,
    GRASS_ALT: 1,
    DIRT: 2,
    DIRT_ALT: 3,
    ROAD_H: 4,   // Horizontal road
    ROAD_V: 5,   // Vertical road
    ROAD_CROSS: 6,   // Road intersection
    WATER: 7,
    WATER_DEEP: 8,
    SAND: 9,   // Beach / lake shore
    CONCRETE: 10,  // Building floor / parking
    FOREST: 11,  // Dense tree ground
};

// Tile properties
export const TILE_PROPS = {
    [TILE.GRASS]: { walkable: true, driveable: true, color: 0x4a6a3a, label: 'Grass' },
    [TILE.GRASS_ALT]: { walkable: true, driveable: true, color: 0x3d5c2f, label: 'Grass' },
    [TILE.DIRT]: { walkable: true, driveable: true, color: 0x6b5c3e, label: 'Dirt' },
    [TILE.DIRT_ALT]: { walkable: true, driveable: true, color: 0x5e5035, label: 'Dirt' },
    [TILE.ROAD_H]: { walkable: true, driveable: true, color: 0x4a4a4a, label: 'Road' },
    [TILE.ROAD_V]: { walkable: true, driveable: true, color: 0x4a4a4a, label: 'Road' },
    [TILE.ROAD_CROSS]: { walkable: true, driveable: true, color: 0x555555, label: 'Intersection' },
    [TILE.WATER]: { walkable: false, driveable: false, color: 0x2a6090, label: 'Water' },
    [TILE.WATER_DEEP]: { walkable: false, driveable: false, color: 0x1a4070, label: 'Deep Water' },
    [TILE.SAND]: { walkable: true, driveable: true, color: 0xc2a868, label: 'Sand' },
    [TILE.CONCRETE]: { walkable: true, driveable: true, color: 0x7a7a7a, label: 'Concrete' },
    [TILE.FOREST]: { walkable: true, driveable: false, color: 0x2d4a22, label: 'Forest' },
};

// ─── OBSTACLE TYPES ────────────────────────────────────────
export const OBSTACLE = {
    TREE: 'tree',
    TREE_PINE: 'tree_pine',
    ROCK_SMALL: 'rock_small',
    ROCK_LARGE: 'rock_large',
    BUSH: 'bush',
    FENCE_H: 'fence_h',
    FENCE_V: 'fence_v',
    CRATE: 'crate',
    BARREL: 'barrel',
    SANDBAG: 'sandbag',
    WALL_H: 'wall_h',
    WALL_V: 'wall_v',
    STREET_LAMP: 'street_lamp',
    TREASURE_CHEST: 'chest',
    BARREL_EXPLOSIVE: 'barrel_red',
    WELL: 'well',
    STATUE: 'statue',
    SPIKE_TRAP: 'trap_spikes',
    MOVING_BLADE: 'trap_blade',
    PRESSURE_PLATE: 'pressure_plate',
    CHEST_LOCKED: 'chest_locked',
    MIMIC: 'mimic',
};

export const OBSTACLE_PROPS = {
    [OBSTACLE.TREE]: { width: 20, height: 20, solid: true, destructible: false, color: 0x2d6b1a, shape: 'circle' },
    [OBSTACLE.TREE_PINE]: { width: 16, height: 16, solid: true, destructible: false, color: 0x1a5a12, shape: 'triangle' },
    [OBSTACLE.ROCK_SMALL]: { width: 16, height: 16, solid: true, destructible: false, color: 0x888888, shape: 'circle' },
    [OBSTACLE.ROCK_LARGE]: { width: 32, height: 28, solid: true, destructible: false, color: 0x666666, shape: 'circle' },
    [OBSTACLE.BUSH]: { width: 18, height: 18, solid: false, destructible: true, color: 0x3a8a2a, shape: 'circle' },
    [OBSTACLE.FENCE_H]: { width: 48, height: 4, solid: true, destructible: true, color: 0x8a6a3a, shape: 'rect' },
    [OBSTACLE.FENCE_V]: { width: 4, height: 48, solid: true, destructible: true, color: 0x8a6a3a, shape: 'rect' },
    [OBSTACLE.CRATE]: { width: 20, height: 20, solid: true, destructible: true, color: 0x8a7040, shape: 'rect' },
    [OBSTACLE.BARREL]: { width: 14, height: 14, solid: true, destructible: true, color: 0x5a5a5a, shape: 'circle' },
    [OBSTACLE.SANDBAG]: { width: 28, height: 12, solid: true, destructible: false, color: 0x9a8a5a, shape: 'rect' },
    [OBSTACLE.WALL_H]: { width: 64, height: 8, solid: true, destructible: false, color: 0x6a6a6a, shape: 'rect' },
    [OBSTACLE.WALL_V]: { width: 8, height: 64, solid: true, destructible: false, color: 0x6a6a6a, shape: 'rect' },
    [OBSTACLE.STREET_LAMP]: { width: 8, height: 8, solid: true, destructible: false, color: 0x444444, shape: 'circle' },
    [OBSTACLE.TREASURE_CHEST]: { width: 24, height: 16, solid: true, destructible: false, color: 0xc2a868, shape: 'rect' },
    [OBSTACLE.BARREL_EXPLOSIVE]: { width: 14, height: 14, solid: true, destructible: true, color: 0xef4444, shape: 'circle' },
    [OBSTACLE.WELL]: { width: 32, height: 32, solid: true, destructible: false, color: 0x6a6a6a, shape: 'circle' },
    [OBSTACLE.STATUE]: { width: 24, height: 24, solid: true, destructible: false, color: 0x94a3b8, shape: 'rect' },
    [OBSTACLE.SPIKE_TRAP]: { width: 28, height: 28, solid: false, destructible: false, color: 0x64748b, shape: 'rect' },
    [OBSTACLE.MOVING_BLADE]: { width: 28, height: 28, solid: false, destructible: false, color: 0x64748b, shape: 'rect' },
    [OBSTACLE.PRESSURE_PLATE]: { width: 20, height: 20, solid: false, destructible: false, color: 0x475569, shape: 'rect' },
    [OBSTACLE.CHEST_LOCKED]: { width: 24, height: 16, solid: true, destructible: false, color: 0xeab308, shape: 'rect' },
    [OBSTACLE.MIMIC]: { width: 24, height: 16, solid: true, destructible: true, color: 0xef4444, shape: 'rect' },
};

// ─── BUILDING DEFINITIONS ──────────────────────────────────
export const BUILDING_TYPE = {
    HOUSE_SMALL: 'house_small',
    HOUSE_LARGE: 'house_large',
    WAREHOUSE: 'warehouse',
    GUARD_TOWER: 'guard_tower',
    GARAGE: 'garage',
    HOUSE_5ROOM: 'house_5room',
    TEMPLE: 'temple',
};

export const BUILDING_PROPS = {
    [BUILDING_TYPE.HOUSE_SMALL]: { tilesW: 7, tilesH: 5, color: 0x8a7a6a, roofColor: 0xa04040, label: 'Residency', lootTier: 1 },
    [BUILDING_TYPE.HOUSE_LARGE]: { tilesW: 12, tilesH: 9, color: 0x7a7a7a, roofColor: 0x4a6a8a, label: 'Apartment', lootTier: 2 },
    [BUILDING_TYPE.WAREHOUSE]: { tilesW: 18, tilesH: 12, color: 0x5a6a6a, roofColor: 0x6a6a6a, label: 'Warehouse', lootTier: 3 },
    [BUILDING_TYPE.GUARD_TOWER]: { tilesW: 5, tilesH: 5, color: 0x6a6a5a, roofColor: 0x5a5a2a, label: 'Watchtower', lootTier: 3 },
    [BUILDING_TYPE.GARAGE]: { tilesW: 9, tilesH: 7, color: 0x5a5a5a, roofColor: 0x4a4a4a, label: 'Garage Depot', lootTier: 2 },
    [BUILDING_TYPE.HOUSE_5ROOM]: { tilesW: 16, tilesH: 14, color: 0x7c2d12, roofColor: 0x450a0a, label: 'Grand Manor', lootTier: 4 },
    [BUILDING_TYPE.TEMPLE]: { tilesW: 15, tilesH: 15, color: 0x475569, roofColor: 0x1e293b, label: 'Ancient Temple', lootTier: 5 },
};

// ─── BIOME DEFINITIONS ─────────────────────────────────────
export const BIOME = {
    GRASSLAND: 'grassland',
    FOREST: 'forest',
    URBAN: 'urban',
    LAKESIDE: 'lakeside',
    WASTELAND: 'wasteland',
    RUINS: 'ruins',
    VILLAGE: 'village',
    MILITARY_BASE: 'military_base',
};

export const BIOME_PROPS = {
    [BIOME.VILLAGE]: {
        baseTile: TILE.GRASS,
        treeDensity: 0.01,
        rockDensity: 0.002,
        buildingDensity: 0.02, // High density of small houses
        color: 0x22c55e,
        isSafe: true,
    },
    [BIOME.MILITARY_BASE]: {
        baseTile: TILE.CONCRETE,
        treeDensity: 0.0,
        rockDensity: 0.0,
        buildingDensity: 0.05,
        color: 0x475569,
        dangerLevel: 10,
        noiseSensitivity: 2.5,
    },
    [BIOME.GRASSLAND]: {
        baseTile: TILE.GRASS,
        treeDensity: 0.02,
        rockDensity: 0.005,
        buildingDensity: 0.001,
        color: 0x4a6a3a,
    },
    [BIOME.FOREST]: {
        baseTile: TILE.FOREST,
        treeDensity: 0.12,
        rockDensity: 0.01,
        buildingDensity: 0.0005,
        color: 0x2d4a22,
    },
    [BIOME.URBAN]: {
        baseTile: TILE.CONCRETE,
        treeDensity: 0.005,
        rockDensity: 0.002,
        buildingDensity: 0.012,
        color: 0x6a6a6a,
    },
    [BIOME.LAKESIDE]: {
        baseTile: TILE.SAND,
        treeDensity: 0.01,
        rockDensity: 0.008,
        buildingDensity: 0.001,
        color: 0xc2a868,
    },
    [BIOME.WASTELAND]: {
        baseTile: TILE.DIRT,
        treeDensity: 0.005,
        rockDensity: 0.02,
        buildingDensity: 0.002,
        color: 0x6b5c3e,
    },
    [BIOME.RUINS]: {
        baseTile: TILE.CONCRETE,
        treeDensity: 0.04,
        rockDensity: 0.08,
        buildingDensity: 0.005,
        color: 0x334155,
        dangerLevel: 5,
        noiseSensitivity: 1.5, // Harder to sneak
    },
};

// ─── SPAWN CONFIG ──────────────────────────────────────────
export const SPAWN_CONFIG = {
    playerSpawn: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 },
    maxAIAgents: 35,
    maxVehicles: 25,
    maxLootItems: 120,
    initialInventorySlots: 8,
    dayNightCycle: {
        dayDuration: 180000, // 3 mins
        nightDuration: 120000, // 2 mins
        nightAlpha: 0.45,
        nightColor: 0x1a1a2e,
    }
};

export const ITEM_TYPE = {
    WEAPON: 'weapon',
    AMMO: 'ammo',
    HEALTH: 'health',
    ARMOR: 'armor',
    KEY: 'key',
};

export const ITEM_WEIGHT = {
    [ITEM_TYPE.AMMO]: 0.1, // per unit
    [ITEM_TYPE.HEALTH]: 0.5,
    [ITEM_TYPE.ARMOR]: 5.0,
    [ITEM_TYPE.KEY]: 0.1,
};
