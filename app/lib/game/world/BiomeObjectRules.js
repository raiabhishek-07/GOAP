// ============================================================
// BiomeObjectRules.js — Intelligent Object Placement System
// Defines rules for spawning objects based on biome, density, and clustering
// ============================================================

export class BiomeObjectRules {
    constructor() {
        this.biomeRules = this._initializeBiomeRules();
        this.densityMaps = new Map();
        this.clusterRules = this._initializeClusterRules();
        this.rareObjectRules = this._initializeRareRules();
    }

    // ═══════════════════════════════════════════════════════
    // BIOME RULES DEFINITION
    // ═══════════════════════════════════════════════════════

    _initializeBiomeRules() {
        return {
            // FOREST BIOME
            forest: {
                baseDensity: 0.8,
                objects: {
                    treeCluster: {
                        weight: 10,
                        minDistance: 60,
                        maxDistance: 120,
                        clusterSize: { min: 3, max: 7 },
                        spread: { min: 30, max: 60 },
                        size: { min: 0.8, max: 1.2 },
                        types: ['oak', 'pine', 'birch']
                    },
                    bush: {
                        weight: 8,
                        minDistance: 20,
                        maxDistance: 40,
                        density: { min: 2, max: 4 },
                        size: { min: 0.7, max: 1.1 }
                    },
                    rockFormation: {
                        weight: 3,
                        minDistance: 80,
                        maxDistance: 150,
                        count: { min: 2, max: 4 },
                        size: { min: 0.5, max: 0.8 }
                    },
                    tallGrass: {
                        weight: 6,
                        minDistance: 15,
                        maxDistance: 30,
                        density: { min: 5, max: 12 },
                        avoid: ['treeCluster', 'rockFormation']
                    },
                    fallenLog: {
                        weight: 2,
                        minDistance: 100,
                        maxDistance: 200,
                        length: { min: 30, max: 60 },
                        rotation: { min: 0, max: Math.PI * 2 }
                    }
                },
                constraints: {
                    maxObjectsPerChunk: 25,
                    avoidWater: true,
                    avoidRoads: false,
                    minElevation: 0.2,
                    maxElevation: 0.8
                }
            },

            // GRASSLAND BIOME
            grassland: {
                baseDensity: 0.6,
                objects: {
                    treeCluster: {
                        weight: 3,
                        minDistance: 100,
                        maxDistance: 200,
                        clusterSize: { min: 2, max: 4 },
                        spread: { min: 40, max: 80 },
                        size: { min: 0.6, max: 0.9 },
                        types: ['oak']
                    },
                    bush: {
                        weight: 7,
                        minDistance: 25,
                        maxDistance: 50,
                        density: { min: 1, max: 3 },
                        size: { min: 0.8, max: 1.2 }
                    },
                    tallGrass: {
                        weight: 10,
                        minDistance: 10,
                        maxDistance: 25,
                        density: { min: 8, max: 20 },
                        avoid: ['treeCluster']
                    },
                    rockFormation: {
                        weight: 4,
                        minDistance: 60,
                        maxDistance: 120,
                        count: { min: 1, max: 3 },
                        size: { min: 0.4, max: 0.7 }
                    }
                },
                constraints: {
                    maxObjectsPerChunk: 20,
                    avoidWater: false,
                    avoidRoads: false,
                    minElevation: 0.1,
                    maxElevation: 0.7
                }
            },

            // DESERT BIOME
            desert: {
                baseDensity: 0.4,
                objects: {
                    rockFormation: {
                        weight: 8,
                        minDistance: 50,
                        maxDistance: 100,
                        count: { min: 2, max: 5 },
                        size: { min: 0.6, max: 1.0 }
                    },
                    bush: {
                        weight: 5,
                        minDistance: 30,
                        maxDistance: 60,
                        density: { min: 1, max: 2 },
                        size: { min: 0.5, max: 0.8 },
                        type: 'desert'
                    },
                    tallGrass: {
                        weight: 2,
                        minDistance: 20,
                        maxDistance: 40,
                        density: { min: 3, max: 6 },
                        type: 'dry'
                    },
                    cactus: {
                        weight: 6,
                        minDistance: 40,
                        maxDistance: 80,
                        height: { min: 15, max: 30 },
                        avoid: ['rockFormation']
                    }
                },
                constraints: {
                    maxObjectsPerChunk: 15,
                    avoidWater: false,
                    avoidRoads: false,
                    minElevation: 0.0,
                    maxElevation: 0.5
                }
            },

            // URBAN BIOME
            urban: {
                baseDensity: 0.7,
                objects: {
                    streetLamp: {
                        weight: 8,
                        minDistance: 80,
                        maxDistance: 120,
                        alongRoads: true,
                        spacing: 60
                    },
                    fence: {
                        weight: 6,
                        minDistance: 40,
                        maxDistance: 80,
                        length: { min: 30, max: 80 },
                        type: ['wood', 'chain', 'metal']
                    },
                    roadSign: {
                        weight: 5,
                        minDistance: 100,
                        maxDistance: 150,
                        nearRoads: true,
                        texts: ['STOP', 'YIELD', 'SPEED LIMIT', 'CROSSING']
                    },
                    supplyCrate: {
                        weight: 4,
                        minDistance: 30,
                        maxDistance: 60,
                        size: { min: 0.8, max: 1.2 },
                        nearBuildings: true
                    },
                    trashBin: {
                        weight: 7,
                        minDistance: 20,
                        maxDistance: 40,
                        nearBuildings: true
                    },
                    bench: {
                        weight: 3,
                        minDistance: 50,
                        maxDistance: 100,
                        nearPaths: true
                    }
                },
                constraints: {
                    maxObjectsPerChunk: 30,
                    avoidWater: true,
                    avoidRoads: false,
                    minElevation: 0.0,
                    maxElevation: 0.3
                }
            },

            // MILITARY BASE BIOME
            military: {
                baseDensity: 0.5,
                objects: {
                    sandbagBarrier: {
                        weight: 9,
                        minDistance: 40,
                        maxDistance: 80,
                        length: { min: 40, max: 100 },
                        perimeter: true
                    },
                    watchtower: {
                        weight: 4,
                        minDistance: 120,
                        maxDistance: 200,
                        height: { min: 40, max: 60 },
                        strategic: true
                    },
                    supplyCrate: {
                        weight: 8,
                        minDistance: 20,
                        maxDistance: 40,
                        size: { min: 1.0, max: 1.5 },
                        clustered: true
                    },
                    fence: {
                        weight: 7,
                        minDistance: 30,
                        maxDistance: 60,
                        length: { min: 50, max: 120 },
                        type: 'chain',
                        perimeter: true
                    },
                    checkpoint: {
                        weight: 3,
                        minDistance: 150,
                        maxDistance: 250,
                        nearEntrances: true
                    },
                    barricade: {
                        weight: 6,
                        minDistance: 60,
                        maxDistance: 100,
                        type: ['concrete', 'metal'],
                        defensive: true
                    }
                },
                constraints: {
                    maxObjectsPerChunk: 20,
                    avoidWater: true,
                    avoidRoads: false,
                    minElevation: 0.0,
                    maxElevation: 0.4
                }
            },

            // WATER BIOME (edges and shores)
            water: {
                baseDensity: 0.3,
                objects: {
                    waterEdge: {
                        weight: 10,
                        minDistance: 20,
                        maxDistance: 40,
                        alongWater: true,
                        length: { min: 30, max: 80 }
                    },
                    rockFormation: {
                        weight: 6,
                        minDistance: 30,
                        maxDistance: 60,
                        count: { min: 1, max: 2 },
                        size: { min: 0.4, max: 0.7 },
                        nearWater: true
                    },
                    bush: {
                        weight: 4,
                        minDistance: 25,
                        maxDistance: 50,
                        density: { min: 1, max: 2 },
                        size: { min: 0.6, max: 0.9 },
                        nearWater: true
                    }
                },
                constraints: {
                    maxObjectsPerChunk: 12,
                    avoidWater: false,
                    avoidRoads: true,
                    minElevation: 0.0,
                    maxElevation: 0.2
                }
            }
        };
    }

    _initializeClusterRules() {
        return {
            treeCluster: {
                coreObjects: ['treeCluster'],
                satelliteObjects: ['bush', 'tallGrass', 'rockFormation'],
                satelliteRadius: 40,
                satelliteDensity: 0.6
            },
            rockFormation: {
                coreObjects: ['rockFormation'],
                satelliteObjects: ['bush', 'tallGrass'],
                satelliteRadius: 25,
                satelliteDensity: 0.4
            },
            militaryOutpost: {
                coreObjects: ['watchtower', 'checkpoint'],
                satelliteObjects: ['sandbagBarrier', 'fence', 'supplyCrate', 'barricade'],
                satelliteRadius: 80,
                satelliteDensity: 0.8
            }
        };
    }

    _initializeRareRules() {
        return {
            // Rare objects that spawn with low probability
            rareTree: {
                chance: 0.05,
                biomes: ['forest', 'grassland'],
                object: 'treeCluster',
                config: { size: 1.5, types: ['ancient'], count: 1 }
            },
            abandonedVehicle: {
                chance: 0.03,
                biomes: ['urban', 'military'],
                object: 'brokenVehicle',
                config: { condition: 'rusty', parts: ['wheel', 'door'] }
            },
            treasureCrate: {
                chance: 0.02,
                biomes: ['forest', 'desert', 'military'],
                object: 'supplyCrate',
                config: { rare: true, locked: true, contents: 'valuable' }
            },
            ancientStatue: {
                chance: 0.01,
                biomes: ['forest', 'ruins'],
                object: 'statue',
                config: { material: 'stone', condition: 'weathered' }
            }
        };
    }

    // ═══════════════════════════════════════════════════════
    // OBJECT PLACEMENT LOGIC
    // ═══════════════════════════════════════════════════════

    /**
     * Get object placement rules for a specific biome
     */
    getBiomeRules(biome) {
        return this.biomeRules[biome] || this.biomeRules.grassland;
    }

    /**
     * Determine if an object can be placed at a specific location
     */
    canPlaceObject(objectType, x, y, biome, existingObjects = []) {
        const rules = this.getBiomeRules(biome);
        const objectRules = rules.objects[objectType];
        
        if (!objectRules) return false;

        // Check distance constraints
        for (const existing of existingObjects) {
            const distance = this._calculateDistance(x, y, existing.x, existing.y);
            
            // Check minimum distance
            if (distance < objectRules.minDistance) return false;
            
            // Check maximum distance for required proximity
            if (objectRules.maxDistance && distance > objectRules.maxDistance) return false;
            
            // Check avoidance rules
            if (objectRules.avoid && objectRules.avoid.includes(existing.type)) {
                if (distance < 50) return false; // Avoid specific object types
            }
        }

        // Check biome constraints
        return this._checkBiomeConstraints(x, y, biome, rules.constraints);
    }

    /**
     * Generate object configuration based on rules
     */
    generateObjectConfig(objectType, biome, rng) {
        const rules = this.getBiomeRules(biome);
        const objectRules = rules.objects[objectType];
        
        if (!objectRules) return {};

        const config = { ...objectRules };

        // Apply random variations within defined ranges
        if (config.clusterSize) {
            config.count = rng.nextInt(config.clusterSize.min, config.clusterSize.max);
        }
        if (config.spread) {
            config.spread = rng.realInRange(config.spread.min, config.spread.max);
        }
        if (config.size) {
            config.size = rng.realInRange(config.size.min, config.size.max);
        }
        if (config.density) {
            config.density = rng.nextInt(config.density.min, config.density.max);
        }
        if (config.length) {
            config.length = rng.realInRange(config.length.min, config.length.max);
        }
        if (config.height) {
            config.height = rng.realInRange(config.height.min, config.height.max);
        }

        // Select random type if multiple options
        if (config.types && Array.isArray(config.types)) {
            config.type = rng.pick(config.types);
        }

        // Select random text if multiple options
        if (config.texts && Array.isArray(config.texts)) {
            config.text = rng.pick(config.texts);
        }

        return config;
    }

    /**
     * Generate cluster of related objects
     */
    generateCluster(coreType, x, y, biome, rng) {
        const clusterRules = this.clusterRules[coreType];
        if (!clusterRules) return [];

        const cluster = [];
        
        // Add core object
        const coreConfig = this.generateObjectConfig(coreType, biome, rng);
        cluster.push({
            type: coreType,
            x: x,
            y: y,
            config: coreConfig,
            isCore: true
        });

        // Add satellite objects
        const satelliteCount = Math.floor(clusterRules.satelliteDensity * 5);
        for (let i = 0; i < satelliteCount; i++) {
            const angle = (Math.PI * 2 * i) / satelliteCount + rng.realInRange(-0.5, 0.5);
            const distance = rng.realInRange(20, clusterRules.satelliteRadius);
            
            const satX = x + Math.cos(angle) * distance;
            const satY = y + Math.sin(angle) * distance;
            
            const satType = rng.pick(clusterRules.satelliteObjects);
            const satConfig = this.generateObjectConfig(satType, biome, rng);
            
            cluster.push({
                type: satType,
                x: satX,
                y: satY,
                config: satConfig,
                isSatellite: true
            });
        }

        return cluster;
    }

    /**
     * Check for rare object spawning
     */
    checkRareSpawn(x, y, biome, rng) {
        for (const [rareName, rareRule] of Object.entries(this.rareObjectRules)) {
            if (!rareRule.biomes.includes(biome)) continue;
            
            if (rng.frac() < rareRule.chance) {
                return {
                    type: rareRule.object,
                    x: x,
                    y: y,
                    config: rareRule.config,
                    isRare: true,
                    rareName: rareName
                };
            }
        }
        return null;
    }

    /**
     * Generate density map for a biome
     */
    generateDensityMap(biome, chunkSize, rng) {
        const rules = this.getBiomeRules(biome);
        const densityMap = [];
        
        for (let y = 0; y < chunkSize; y += 10) {
            for (let x = 0; x < chunkSize; x += 10) {
                // Use Perlin noise or similar for natural density variation
                const noise = this._generateNoise(x, y, rng);
                const density = rules.baseDensity * (0.5 + noise * 0.5);
                
                densityMap.push({
                    x: x,
                    y: y,
                    density: density,
                    radius: 15
                });
            }
        }
        
        return densityMap;
    }

    // ═══════════════════════════════════════════════════════
    // UTILITY METHODS
    // ═══════════════════════════════════════════════════════

    _calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    _checkBiomeConstraints(x, y, biome, constraints) {
        // In a real implementation, this would check:
        // - Elevation data at this position
        // - Proximity to water
        // - Proximity to roads
        // - Other terrain features
        
        // For now, return true (constraints would be checked against terrain data)
        return true;
    }

    _generateNoise(x, y, rng) {
        // Simple pseudo-random noise function
        // In a real implementation, use Perlin noise or Simplex noise
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    /**
     * Get weighted random object type for a biome
     */
    getWeightedObjectType(biome, rng) {
        const rules = this.getBiomeRules(biome);
        const objects = Object.entries(rules.objects);
        
        // Calculate total weight
        const totalWeight = objects.reduce((sum, [_, obj]) => sum + obj.weight, 0);
        
        // Get random weighted object
        let random = rng.frac() * totalWeight;
        
        for (const [type, obj] of objects) {
            random -= obj.weight;
            if (random <= 0) {
                return type;
            }
        }
        
        return objects[0][0]; // Fallback
    }

    /**
     * Validate object placement against all rules
     */
    validatePlacement(proposedObject, existingObjects, biome, chunkBounds) {
        const { x, y, type, config } = proposedObject;
        
        // Check if within chunk bounds
        if (x < chunkBounds.minX || x > chunkBounds.maxX || 
            y < chunkBounds.minY || y > chunkBounds.maxY) {
            return { valid: false, reason: 'Out of bounds' };
        }
        
        // Check biome compatibility
        const biomeRules = this.getBiomeRules(biome);
        if (!biomeRules.objects[type]) {
            return { valid: false, reason: 'Object not allowed in biome' };
        }
        
        // Check distance constraints
        if (!this.canPlaceObject(type, x, y, biome, existingObjects)) {
            return { valid: false, reason: 'Distance constraint violated' };
        }
        
        // Check object count limits
        const objectCount = existingObjects.filter(obj => obj.type === type).length;
        if (objectCount >= biomeRules.constraints.maxObjectsPerChunk) {
            return { valid: false, reason: 'Object count limit reached' };
        }
        
        return { valid: true };
    }
}
