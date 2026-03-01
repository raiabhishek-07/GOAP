// ============================================================
// TerrainSystem.js — Multi-Layer Terrain with Blending
// Creates realistic, layered terrain with smooth biome transitions
// ============================================================

export class TerrainSystem {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 64; // Size of each terrain chunk
        this.tileSize = 32; // Size of individual tiles
        this.layers = {
            base: scene.add.container(0, 0),        // Base terrain layer
            detail: scene.add.container(0, 0),      // Detail layer (small variations)
            overlay: scene.add.container(0, 0),    // Overlay layer (decals, effects)
            transition: scene.add.container(0, 0)   // Biome transition layer
        };
        
        // Set layer depths
        this.layers.base.setDepth(0);
        this.layers.detail.setDepth(50);
        this.layers.overlay.setDepth(75);
        this.layers.transition.setDepth(25);
        
        // Terrain cache for performance
        this.chunkCache = new Map();
        this.textureCache = new Map();
        
        // Biome color definitions
        this.biomeColors = this._initializeBiomeColors();
        
        // Noise generators for terrain variation
        this.noiseGenerators = {
            elevation: this._createNoiseGenerator(12345),
            moisture: this._createNoiseGenerator(54321),
            detail: this._createNoiseGenerator(98765)
        };
        
        // Transition settings
        this.transitionWidth = 3; // Tiles for biome blending
        this.detailScale = 0.1; // Scale for detail noise
    }

    // ═══════════════════════════════════════════════════════
    // TERRAIN GENERATION
    // ═══════════════════════════════════════════════════════

    /**
     * Generate terrain chunk at specified world coordinates
     */
    generateChunk(chunkX, chunkY, worldData) {
        const chunkKey = `${chunkX},${chunkY}`;
        
        // Check cache first
        if (this.chunkCache.has(chunkKey)) {
            return this.chunkCache.get(chunkKey);
        }
        
        const chunk = this.scene.add.container(
            chunkX * this.chunkSize * this.tileSize,
            chunkY * this.chunkSize * this.tileSize
        );
        
        // Generate base terrain layer
        this._generateBaseTerrain(chunk, chunkX, chunkY, worldData);
        
        // Generate detail layer
        this._generateDetailTerrain(chunk, chunkX, chunkY, worldData);
        
        // Generate overlay layer
        this._generateOverlayTerrain(chunk, chunkX, chunkY, worldData);
        
        // Generate biome transitions
        this._generateTransitions(chunk, chunkX, chunkY, worldData);
        
        // Cache the chunk
        this.chunkCache.set(chunkKey, chunk);
        
        return chunk;
    }

    /**
     * Generate base terrain with biome colors and elevation
     */
    _generateBaseTerrain(chunk, chunkX, chunkY, worldData) {
        const baseLayer = this.scene.add.container(0, 0);
        
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;
                
                // Get biome at this position
                const biome = this._getBiomeAt(worldX, worldY, worldData);
                
                // Get elevation and moisture
                const elevation = this._getElevation(worldX, worldY);
                const moisture = this._getMoisture(worldX, worldY);
                
                // Generate base tile color
                const baseColor = this._getBaseBiomeColor(biome, elevation, moisture);
                
                // Create tile
                const tile = this.scene.add.rectangle(
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize,
                    baseColor.color
                );
                
                // Apply elevation-based tinting
                if (elevation > 0.7) {
                    tile.setTint(0xcccccc); // Mountain tint
                } else if (elevation < 0.2) {
                    tile.setTint(0x8b7355); // Lowland tint
                }
                
                baseLayer.add(tile);
            }
        }
        
        this.layers.base.add(baseLayer);
        chunk.add(baseLayer);
    }

    /**
     * Generate detail terrain with noise-based variations
     */
    _generateDetailTerrain(chunk, chunkX, chunkY, worldData) {
        const detailLayer = this.scene.add.container(0, 0);
        
        for (let y = 0; y < this.chunkSize; y += 2) { // Less frequent details
            for (let x = 0; x < this.chunkSize; x += 2) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;
                
                const biome = this._getBiomeAt(worldX, worldY, worldData);
                const detailNoise = this._getDetailNoise(worldX, worldY);
                
                // Only add details if noise threshold is met
                if (detailNoise > 0.6) {
                    const detailType = this._getDetailType(biome, detailNoise);
                    const detail = this._createDetailTile(
                        x * this.tileSize + this.tileSize / 2,
                        y * this.tileSize + this.tileSize / 2,
                        detailType
                    );
                    
                    if (detail) {
                        detailLayer.add(detail);
                    }
                }
            }
        }
        
        this.layers.detail.add(detailLayer);
        chunk.add(detailLayer);
    }

    /**
     * Generate overlay terrain with decals and effects
     */
    _generateOverlayTerrain(chunk, chunkX, chunkY, worldData) {
        const overlayLayer = this.scene.add.container(0, 0);
        
        // Generate random overlay features
        const overlayCount = Math.floor(Math.random() * 5) + 2;
        
        for (let i = 0; i < overlayCount; i++) {
            const x = Math.random() * this.chunkSize * this.tileSize;
            const y = Math.random() * this.chunkSize * this.tileSize;
            const worldX = chunkX * this.chunkSize + x / this.tileSize;
            const worldY = chunkY * this.chunkSize + y / this.tileSize;
            
            const biome = this._getBiomeAt(worldX, worldY, worldData);
            const overlay = this._createOverlayFeature(x, y, biome);
            
            if (overlay) {
                overlayLayer.add(overlay);
            }
        }
        
        this.layers.overlay.add(overlayLayer);
        chunk.add(overlayLayer);
    }

    /**
     * Generate smooth biome transitions
     */
    _generateTransitions(chunk, chunkX, chunkY, worldData) {
        const transitionLayer = this.scene.add.container(0, 0);
        
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;
                
                // Check if we're near a biome boundary
                const nearbyBiomes = this._getNearbyBiomes(worldX, worldY, worldData);
                
                if (nearbyBiomes.length > 1) {
                    // Create transition tile
                    const transitionTile = this._createTransitionTile(
                        x * this.tileSize,
                        y * this.tileSize,
                        nearbyBiomes
                    );
                    
                    if (transitionTile) {
                        transitionLayer.add(transitionTile);
                    }
                }
            }
        }
        
        this.layers.transition.add(transitionLayer);
        chunk.add(transitionLayer);
    }

    // ═══════════════════════════════════════════════════════
    // BIOME SYSTEM
    // ═══════════════════════════════════════════════════════

    _initializeBiomeColors() {
        return {
            forest: {
                base: 0x2a5a1a,
                light: 0x3a6a2a,
                dark: 0x1a4a0a,
                detail: 0x4a7a3a
            },
            grassland: {
                base: 0x4a7a2a,
                light: 0x5a8a3a,
                dark: 0x3a6a1a,
                detail: 0x6a9a4a
            },
            desert: {
                base: 0xc2aa74,
                light: 0xd2ba84,
                dark: 0xb29a64,
                detail: 0xe2ca94
            },
            urban: {
                base: 0x666666,
                light: 0x777777,
                dark: 0x555555,
                detail: 0x888888
            },
            military: {
                base: 0x4a4a4a,
                light: 0x5a5a5a,
                dark: 0x3a3a3a,
                detail: 0x6a6a6a
            },
            water: {
                base: 0x2a5a8a,
                light: 0x3a6a9a,
                dark: 0x1a4a7a,
                detail: 0x4a7aaa
            },
            sand: {
                base: 0xe7d59f,
                light: 0xf7e5af,
                dark: 0xd7c58f,
                detail: 0xffeda0
            },
            rock: {
                base: 0x7a695c,
                light: 0x8a796c,
                dark: 0x6a594c,
                detail: 0x9a897c
            }
        };
    }

    _getBiomeAt(x, y, worldData) {
        // In a real implementation, this would query the world's biome map
        // For now, use a simple pattern based on noise
        const noise = this._getElevation(x, y);
        
        if (noise < 0.2) return 'water';
        if (noise < 0.3) return 'sand';
        if (noise < 0.5) return 'grassland';
        if (noise < 0.7) return 'forest';
        if (noise < 0.8) return 'rock';
        return 'rock';
    }

    _getNearbyBiomes(x, y, worldData, radius = 1) {
        const biomes = new Map();
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const biome = this._getBiomeAt(x + dx, y + dy, worldData);
                biomes.set(biome, (biomes.get(biome) || 0) + 1);
            }
        }
        
        return Array.from(biomes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([biome]) => biome);
    }

    // ═══════════════════════════════════════════════════════
    // TILE CREATION
    // ═══════════════════════════════════════════════════════

    _getBaseBiomeColor(biome, elevation, moisture) {
        const colors = this.biomeColors[biome] || this.biomeColors.grassland;
        
        // Modify color based on elevation and moisture
        let color = colors.base;
        
        if (moisture > 0.7) {
            color = colors.dark; // Wetter = darker
        } else if (moisture < 0.3) {
            color = colors.light; // Drier = lighter
        }
        
        return { color, biome };
    }

    _createDetailTile(x, y, type) {
        switch (type) {
            case 'grass_patch':
                return this.scene.add.circle(x, y, 4, 0x3a6a2a, 0.6);
                
            case 'rock_pebble':
                return this.scene.add.circle(x, y, 2, 0x666666, 0.8);
                
            case 'flower':
                const flower = this.scene.add.circle(x, y, 3, 0xff6b6b, 0.8);
                this._addFlowerAnimation(flower);
                return flower;
                
            case 'mud_patch':
                return this.scene.add.rectangle(x, y, 8, 8, 0x8b7355, 0.4);
                
            default:
                return null;
        }
    }

    _createOverlayFeature(x, y, biome) {
        switch (biome) {
            case 'forest':
                if (Math.random() < 0.3) {
                    return this.scene.add.circle(x, y, 6, 0x1a4a0a, 0.3); // Dark patch
                }
                break;
                
            case 'desert':
                if (Math.random() < 0.4) {
                    return this.scene.add.rectangle(x, y, 12, 8, 0xb29a64, 0.2); // Sand dune
                }
                break;
                
            case 'urban':
                if (Math.random() < 0.2) {
                    return this.scene.add.rectangle(x, y, 6, 6, 0x444444, 0.3); // Concrete patch
                }
                break;
                
            case 'water':
                if (Math.random() < 0.5) {
                    return this.scene.add.circle(x, y, 8, 0x3a6a9a, 0.2); // Ripple
                }
                break;
        }
        
        return null;
    }

    _createTransitionTile(x, y, biomes) {
        if (biomes.length < 2) return null;
        
        // Create gradient effect for biome transition
        const graphics = this.scene.add.graphics();
        
        // Get colors for each biome
        const colors = biomes.map(biome => this.biomeColors[biome]?.base || 0x4a7a2a);
        
        // Create simple gradient (in a real implementation, use more sophisticated blending)
        const gradient = graphics.createLinearGradient(x, y, x + this.tileSize, y + this.tileSize);
        colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
        });
        
        graphics.fillStyle(gradient);
        graphics.fillRect(x, y, this.tileSize, this.tileSize);
        
        return graphics;
    }

    // ═══════════════════════════════════════════════════════
    // NOISE GENERATION
    // ═══════════════════════════════════════════════════════

    _createNoiseGenerator(seed) {
        return {
            seed: seed,
            noise: function(x, y) {
                // Simple pseudo-random noise function
                const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed * 43758.5453);
                return (n - Math.floor(n)) * 2 - 1;
            }
        };
    }

    _getElevation(x, y) {
        const noise = this.noiseGenerators.elevation.noise(x * 0.05, y * 0.05);
        return (noise + 1) / 2; // Normalize to 0-1
    }

    _getMoisture(x, y) {
        const noise = this.noiseGenerators.moisture.noise(x * 0.03, y * 0.03);
        return (noise + 1) / 2; // Normalize to 0-1
    }

    _getDetailNoise(x, y) {
        const noise = this.noiseGenerators.detail.noise(x * 0.2, y * 0.2);
        return (noise + 1) / 2; // Normalize to 0-1
    }

    _getDetailType(biome, noise) {
        const types = {
            forest: ['grass_patch', 'rock_pebble', 'flower'],
            grassland: ['grass_patch', 'flower', 'rock_pebble'],
            desert: ['rock_pebble', 'mud_patch'],
            urban: ['rock_pebble', 'mud_patch'],
            water: ['rock_pebble']
        };
        
        const biomeTypes = types[biome] || types.grassland;
        return biomeTypes[Math.floor(noise * biomeTypes.length)];
    }

    // ═══════════════════════════════════════════════════════
    // ANIMATIONS & EFFECTS
    // ═══════════════════════════════════════════════════════

    _addFlowerAnimation(flower) {
        // Subtle swaying animation
        this.scene.tweens.add({
            targets: flower,
            angle: 5,
            duration: 2000 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    // ═══════════════════════════════════════════════════════
    // TERRAIN UPDATES
    // ═══════════════════════════════════════════════════════

    /**
     * Update terrain based on time of day
     */
    updateLighting(timeOfDay) {
        const config = this.getLightingConfig(timeOfDay);
        
        // Apply lighting to all terrain layers
        Object.values(this.layers).forEach(layer => {
            layer.setTint(config.tint);
            layer.setAlpha(config.intensity);
        });
    }

    getLightingConfig(timeOfDay) {
        const hour = timeOfDay % 24;
        
        if (hour >= 6 && hour < 8) {
            // Dawn
            return { tint: 0xffddaa, intensity: 0.8 };
        } else if (hour >= 8 && hour < 17) {
            // Day
            return { tint: 0xffffff, intensity: 1.0 };
        } else if (hour >= 17 && hour < 19) {
            // Dusk
            return { tint: 0xffaa88, intensity: 0.7 };
        } else {
            // Night
            return { tint: 0x4466aa, intensity: 0.4 };
        }
    }

    /**
     * Add terrain deformation (footprints, explosions, etc.)
     */
    addTerrainDeformation(x, y, type, radius = 10) {
        const deformation = this.scene.add.circle(x, y, radius, 0x000000, 0.3);
        this.layers.overlay.add(deformation);
        
        // Fade out over time
        this.scene.tweens.add({
            targets: deformation,
            alpha: 0,
            duration: 5000,
            onComplete: () => deformation.destroy()
        });
    }

    // ═══════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════

    /**
     * Clean up terrain system
     */
    destroy() {
        // Destroy all layers
        Object.values(this.layers).forEach(layer => {
            layer.destroy();
        });
        
        // Clear caches
        this.chunkCache.clear();
        this.textureCache.clear();
    }
}
