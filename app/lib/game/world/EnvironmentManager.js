// ============================================================
// EnvironmentManager.js — Advanced Environmental System
// Handles depth sorting, layering, shadows, and environmental effects
// ============================================================

export class EnvironmentManager {
    constructor(scene) {
        this.scene = scene;
        this.objectFactory = new ObjectFactory(scene);
        
        // Layer containers for proper depth sorting
        this.layers = {
            ground: scene.add.container(0, 0),      // Base terrain
            groundDetail: scene.add.container(0, 0), // Ground details (small rocks, grass)
            objects: scene.add.container(0, 0),      // Main objects (trees, buildings)
            canopy: scene.add.container(0, 0),      // Tree canopies, roofs
            effects: scene.add.container(0, 0),      // Particles, weather effects
            ui: scene.add.container(0, 0)           // UI elements
        };
        
        // Set layer depths
        this.layers.ground.setDepth(0);
        this.layers.groundDetail.setDepth(100);
        this.layers.objects.setDepth(200);
        this.layers.canopy.setDepth(300);
        this.layers.effects.setDepth(400);
        this.layers.ui.setDepth(1000);
        
        // Environmental state
        this.timeOfDay = 12; // 24-hour format (12 = noon)
        this.windStrength = 0.5;
        this.particleSystems = new Map();
        this.dynamicObjects = new Set();
        
        // Depth sorting cache
        this.depthSortCache = new Map();
        this.lastSortY = 0;
    }

    // ═══════════════════════════════════════════════════════
    // OBJECT SPAWNING & MANAGEMENT
    // ═══════════════════════════════════════════════════════

    /**
     * Spawn object with automatic layer assignment and depth sorting
     */
    spawnObject(type, x, y, config = {}) {
        let object;
        
        switch (type) {
            case 'treeCluster':
                object = this.objectFactory.createTreeCluster(x, y, config);
                this.layers.objects.add(object);
                this.layers.canopy.add(object.list.filter(child => child.isCircle)); // Canopy parts
                break;
                
            case 'bush':
                object = this.objectFactory.createBush(x, y, config);
                this.layers.groundDetail.add(object);
                break;
                
            case 'rockFormation':
                object = this.objectFactory.createRockFormation(x, y, config);
                this.layers.groundDetail.add(object);
                break;
                
            case 'tallGrass':
                object = this.objectFactory.createTallGrass(x, y, config);
                this.layers.groundDetail.add(object);
                break;
                
            case 'waterEdge':
                object = this.objectFactory.createWaterEdge(x, y, config);
                this.layers.groundDetail.add(object);
                break;
                
            case 'streetLamp':
                object = this.objectFactory.createStreetLamp(x, y, config);
                this.layers.objects.add(object);
                this.dynamicObjects.add(object);
                break;
                
            case 'fence':
                object = this.objectFactory.createFence(x, y, config);
                this.layers.objects.add(object);
                break;
                
            case 'roadSign':
                object = this.objectFactory.createRoadSign(x, y, config);
                this.layers.objects.add(object);
                break;
                
            case 'sandbagBarrier':
                object = this.objectFactory.createSandbagBarrier(x, y, config);
                this.layers.objects.add(object);
                break;
                
            case 'supplyCrate':
                object = this.objectFactory.createSupplyCrate(x, y, config);
                this.layers.objects.add(object);
                break;
                
            default:
                console.warn(`Unknown object type: ${type}`);
                return null;
        }
        
        // Add to dynamic objects for updates
        if (object) {
            this.dynamicObjects.add(object);
            this._registerForDepthSorting(object);
        }
        
        return object;
    }

    /**
     * Remove object and clean up resources
     */
    despawnObject(object) {
        this.dynamicObjects.delete(object);
        this._unregisterFromDepthSorting(object);
        
        // Remove shadow
        if (object.shadow) {
            object.shadow.destroy();
        }
        
        // Remove from all layers
        Object.values(this.layers).forEach(layer => {
            if (layer.contains(object)) {
                layer.remove(object);
            }
        });
        
        object.destroy();
    }

    // ═══════════════════════════════════════════════════════
    // DEPTH SORTING SYSTEM
    // ═══════════════════════════════════════════════════════

    /**
     * Register object for depth sorting
     */
    _registerForDepthSorting(object) {
        this.depthSortCache.set(object, {
            lastY: object.y,
            lastDepth: this._calculateDepth(object.y)
        });
    }

    _unregisterFromDepthSorting(object) {
        this.depthSortCache.delete(object);
    }

    /**
     * Calculate depth based on Y position
     */
    _calculateDepth(y) {
        // Higher Y values = deeper in screen (further away)
        return Math.floor(y * 0.1) * 1000 + 200;
    }

    /**
     * Update depth sorting for all objects
     */
    updateDepthSorting() {
        this.depthSortCache.forEach((cache, object) => {
            if (!object.active) return;
            
            const currentY = object.y;
            const currentDepth = this._calculateDepth(currentY);
            
            // Only update if Y position changed significantly
            if (Math.abs(currentY - cache.lastY) > 5) {
                object.setDepth(currentDepth);
                cache.lastY = currentY;
                cache.lastDepth = currentDepth;
                
                // Update shadow depth
                if (object.shadow) {
                    object.shadow.setDepth(currentDepth - 1);
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // LIGHTING SYSTEM
    // ═══════════════════════════════════════════════════════

    /**
     * Set time of day (0-24 hours)
     */
    setTimeOfDay(hour) {
        this.timeOfDay = hour % 24;
        this._updateLighting();
    }

    /**
     * Get current lighting configuration
     */
    getLightingConfig() {
        const hour = this.timeOfDay;
        
        // Define lighting periods
        if (hour >= 6 && hour < 8) {
            // Dawn
            return {
                ambient: { r: 255, g: 200, b: 150, intensity: 0.3 },
                sun: { angle: Math.PI * 0.25, intensity: 0.4 },
                fog: { color: 0xff8866, density: 0.2 }
            };
        } else if (hour >= 8 && hour < 17) {
            // Day
            return {
                ambient: { r: 255, g: 255, b: 255, intensity: 0.8 },
                sun: { angle: Math.PI * 0.5, intensity: 1.0 },
                fog: { color: 0x88ccff, density: 0.1 }
            };
        } else if (hour >= 17 && hour < 19) {
            // Dusk
            return {
                ambient: { r: 255, g: 150, b: 100, intensity: 0.4 },
                sun: { angle: Math.PI * 0.75, intensity: 0.3 },
                fog: { color: 0xff6644, density: 0.3 }
            };
        } else {
            // Night
            return {
                ambient: { r: 50, g: 50, b: 100, intensity: 0.1 },
                sun: { angle: Math.PI, intensity: 0 },
                fog: { color: 0x222244, density: 0.4 }
            };
        }
    }

    /**
     * Update lighting based on time of day
     */
    _updateLighting() {
        const config = this.getLightingConfig();
        const isNight = this.timeOfDay < 6 || this.timeOfDay >= 19;
        
        // Update object factory lighting
        this.objectFactory.updateLighting(isNight);
        this.objectFactory.updateShadows(config.sun.angle);
        
        // Update scene tint
        this._applySceneTint(config.ambient);
        
        // Update particle systems
        this._updateParticleLighting(config);
    }

    /**
     * Apply ambient lighting tint to scene
     */
    _applySceneTint(ambient) {
        const tint = Phaser.Display.Color.GetColor(
            ambient.r,
            ambient.g,
            ambient.b
        );
        
        // Apply tint to all layers except UI
        Object.values(this.layers).forEach((layer, index) => {
            if (index < 5) { // All layers except UI
                layer.setTint(tint);
                layer.setAlpha(ambient.intensity);
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // PARTICLE SYSTEMS
    // ═══════════════════════════════════════════════════════

    /**
     * Create particle system
     */
    createParticleSystem(type, x, y, config = {}) {
        const system = this.scene.add.particles(x, y, type, {
            scale: { start: config.startScale || 1, end: config.endScale || 0 },
            speed: config.speed || { min: 20, max: 50 },
            lifespan: config.lifespan || 2000,
            quantity: config.quantity || 1,
            frequency: config.frequency || 100,
            alpha: config.alpha || { start: 1, end: 0 },
            tint: config.tint || 0xffffff
        });
        
        this.layers.effects.add(system);
        this.particleSystems.set(type, system);
        
        return system;
    }

    /**
     * Create wind particle effect
     */
    createWindEffect(x, y, area) {
        const windParticles = this.createParticleSystem('wind', x, y, {
            speed: { min: 50, max: 100 },
            lifespan: 3000,
            quantity: 2,
            frequency: 200,
            alpha: { start: 0.3, end: 0 },
            startScale: 0.5,
            endScale: 0.2
        });
        
        return windParticles;
    }

    /**
     * Create dust particles when player walks
     */
    createFootprintDust(x, y, surface = 'dirt') {
        const dustConfig = {
            speed: { min: 10, max: 30 },
            lifespan: 1000,
            quantity: 3,
            frequency: 50,
            alpha: { start: 0.4, end: 0 },
            startScale: 0.3,
            endScale: 0.1
        };
        
        if (surface === 'dirt') {
            dustConfig.tint = 0x8b7355;
        } else if (surface === 'sand') {
            dustConfig.tint = 0xc2aa74;
        }
        
        return this.createParticleSystem('dust', x, y, dustConfig);
    }

    /**
     * Update particle systems based on environmental conditions
     */
    _updateParticleLighting(config) {
        this.particleSystems.forEach(system => {
            if (system) {
                system.setTint(config.fog.color);
                system.setAlpha(1 - config.fog.density);
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // ENVIRONMENTAL UPDATES
    // ═══════════════════════════════════════════════════════

    /**
     * Main update loop
     */
    update(delta) {
        // Update depth sorting
        this.updateDepthSorting();
        
        // Update wind
        this.objectFactory.updateWind(delta);
        
        // Update time of day (slow progression)
        this.timeOfDay += delta * 0.00001; // Very slow time progression
        if (this.timeOfDay >= 24) this.timeOfDay = 0;
        
        // Update lighting
        this._updateLighting();
        
        // Update dynamic objects
        this.dynamicObjects.forEach(object => {
            if (object.update && typeof object.update === 'function') {
                object.update(delta);
            }
        });
    }

    /**
     * Handle player interaction with environment
     */
    handlePlayerInteraction(player, action) {
        switch (action) {
            case 'footstep':
                this._createFootstepEffect(player.x, player.y);
                break;
                
            case 'shoot':
                this._createShootEffect(player.x, player.y, player.rotation);
                break;
                
            case 'explosion':
                this._createExplosionEffect(player.x, player.y);
                break;
        }
    }

    _createFootstepEffect(x, y) {
        // Create small dust puff
        const dust = this.createFootprintDust(x, y, 'dirt');
        setTimeout(() => {
            if (dust) dust.destroy();
        }, 1000);
    }

    _createShootEffect(x, y, angle) {
        // Create muzzle flash
        const flash = this.scene.add.circle(x, y, 5, 0xffff99);
        flash.setDepth(1000);
        this.layers.effects.add(flash);
        
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }

    _createExplosionEffect(x, y) {
        // Create explosion particles
        const explosion = this.createParticleSystem('explosion', x, y, {
            speed: { min: 50, max: 200 },
            lifespan: 1500,
            quantity: 20,
            frequency: 50,
            alpha: { start: 1, end: 0 },
            startScale: 0.5,
            endScale: 1.5,
            tint: 0xff6600
        });
        
        // Screen shake
        this.scene.cameras.main.shake(200, 0.01);
    }

    // ═══════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════

    /**
     * Clean up all environmental objects
     */
    destroy() {
        // Destroy all layers
        Object.values(this.layers).forEach(layer => {
            layer.destroy();
        });
        
        // Clear caches
        this.depthSortCache.clear();
        this.dynamicObjects.clear();
        this.particleSystems.clear();
        
        // Destroy object factory
        this.objectFactory = null;
    }
}
