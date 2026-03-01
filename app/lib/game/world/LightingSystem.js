// ============================================================
// LightingSystem.js — Advanced Day/Night Lighting
// Dynamic lighting with sun, moon, shadows, and atmospheric effects
// ============================================================

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Time system
        this.currentTime = 12; // Start at noon (24-hour format)
        this.timeScale = 0.001; // How fast time progresses
        this.isPaused = false;
        
        // Lighting layers
        this.layers = {
            ambient: scene.add.container(0, 0),      // Ambient lighting overlay
            shadows: scene.add.container(0, 0),       // Shadow layer
            effects: scene.add.container(0, 0),       // Lighting effects (god rays, etc.)
            ui: scene.add.container(0, 0)            // UI lighting elements
        };
        
        // Set layer depths
        this.layers.ambient.setDepth(900);
        this.layers.shadows.setDepth(50);
        this.layers.effects.setDepth(800);
        this.layers.ui.setDepth(1100);
        
        // Light sources
        this.sun = null;
        this.moon = null;
        this.stars = [];
        this.lights = new Map(); // Dynamic lights (street lamps, etc.)
        
        // Atmospheric effects
        this.fogOverlay = null;
        this.godRays = [];
        this.weatherEffects = null;
        
        // Initialize lighting
        this._initializeLighting();
    }

    // ═══════════════════════════════════════════════════════
    // LIGHTING INITIALIZATION
    // ═══════════════════════════════════════════════════════

    _initializeLighting() {
        // Create ambient lighting overlay
        this.ambientOverlay = this.scene.add.rectangle(0, 0, 10000, 10000, 0x000000, 0);
        this.ambientOverlay.setOrigin(0.5, 0.5);
        this.layers.ambient.add(this.ambientOverlay);
        
        // Create fog overlay
        this.fogOverlay = this.scene.add.rectangle(0, 0, 10000, 10000, 0x88ccff, 0);
        this.fogOverlay.setOrigin(0.5, 0.5);
        this.layers.effects.add(this.fogOverlay);
        
        // Create sun
        this.sun = this.scene.add.circle(0, 0, 30, 0xffff99, 0.8);
        this.layers.effects.add(this.sun);
        
        // Create moon
        this.moon = this.scene.add.circle(0, 0, 25, 0xffffff, 0.6);
        this.layers.effects.add(this.moon);
        
        // Create stars
        this._createStars();
        
        // Create weather effects container
        this.weatherEffects = this.scene.add.container(0, 0);
        this.layers.effects.add(this.weatherEffects);
        
        // Apply initial lighting
        this.updateLighting();
    }

    _createStars() {
        const starCount = 200;
        
        for (let i = 0; i < starCount; i++) {
            const x = (Math.random() - 0.5) * 8000;
            const y = (Math.random() - 0.5) * 8000;
            const size = Math.random() * 2 + 0.5;
            const brightness = Math.random() * 0.8 + 0.2;
            
            const star = this.scene.add.circle(x, y, size, 0xffffff, brightness);
            star.setVisible(false); // Hidden during day
            this.stars.push(star);
            this.layers.effects.add(star);
        }
    }

    // ═══════════════════════════════════════════════════════
    // TIME & LIGHTING CALCULATIONS
    // ═══════════════════════════════════════════════════════

    /**
     * Get current lighting configuration based on time
     */
    getLightingConfig() {
        const hour = this.currentTime % 24;
        
        // Define lighting periods
        if (hour >= 5 && hour < 7) {
            // Dawn
            return {
                period: 'dawn',
                ambient: { r: 255, g: 200, b: 150, intensity: 0.3 },
                sun: { visible: true, angle: this._calculateSunAngle(hour), intensity: 0.4 },
                moon: { visible: false },
                fog: { color: 0xff8866, density: 0.3 },
                shadows: { length: 0.8, darkness: 0.4 },
                sky: { top: 0xff8866, bottom: 0xffcc99 }
            };
        } else if (hour >= 7 && hour < 17) {
            // Day
            return {
                period: 'day',
                ambient: { r: 255, g: 255, b: 255, intensity: 0.8 },
                sun: { visible: true, angle: this._calculateSunAngle(hour), intensity: 1.0 },
                moon: { visible: false },
                fog: { color: 0x88ccff, density: 0.1 },
                shadows: { length: 0.6, darkness: 0.3 },
                sky: { top: 0x4488ff, bottom: 0x88ccff }
            };
        } else if (hour >= 17 && hour < 19) {
            // Dusk
            return {
                period: 'dusk',
                ambient: { r: 255, g: 150, b: 100, intensity: 0.4 },
                sun: { visible: true, angle: this._calculateSunAngle(hour), intensity: 0.3 },
                moon: { visible: false },
                fog: { color: 0xff6644, density: 0.4 },
                shadows: { length: 1.2, darkness: 0.6 },
                sky: { top: 0xff6644, bottom: 0xffaa88 }
            };
        } else {
            // Night
            return {
                period: 'night',
                ambient: { r: 50, g: 50, b: 100, intensity: 0.1 },
                sun: { visible: false },
                moon: { visible: true, angle: this._calculateMoonAngle(hour), intensity: 0.6 },
                fog: { color: 0x222244, density: 0.5 },
                shadows: { length: 0.3, darkness: 0.8 },
                sky: { top: 0x0a0a2a, bottom: 0x222244 }
            };
        }
    }

    _calculateSunAngle(hour) {
        // Sun rises at 6, sets at 18
        if (hour < 6 || hour > 18) return Math.PI; // Below horizon
        
        const dayProgress = (hour - 6) / 12; // 0 to 1
        return Math.PI * (1 - dayProgress); // PI to 0
    }

    _calculateMoonAngle(hour) {
        // Moon is visible during night (18 to 6)
        if (hour >= 6 && hour <= 18) return Math.PI; // Below horizon
        
        let nightProgress;
        if (hour > 18) {
            nightProgress = (hour - 18) / 12; // 0 to 1
        } else {
            nightProgress = (hour + 6) / 12; // 0 to 1
        }
        
        return Math.PI * (1 - nightProgress); // PI to 0
    }

    // ═══════════════════════════════════════════════════════
    // LIGHTING UPDATES
    // ═══════════════════════════════════════════════════════

    /**
     * Update all lighting based on current time
     */
    updateLighting() {
        const config = this.getLightingConfig();
        
        // Update ambient lighting
        this._updateAmbientLighting(config);
        
        // Update celestial bodies
        this._updateCelestialBodies(config);
        
        // Update fog
        this._updateFog(config);
        
        // Update shadows
        this._updateShadows(config);
        
        // Update sky gradient
        this._updateSkyGradient(config);
        
        // Update dynamic lights
        this._updateDynamicLights(config);
        
        // Update weather effects
        this._updateWeatherEffects(config);
    }

    _updateAmbientLighting(config) {
        const ambientColor = Phaser.Display.Color.GetColor(
            config.ambient.r,
            config.ambient.g,
            config.ambient.b
        );
        
        this.ambientOverlay.setFillStyle(ambientColor);
        this.ambientOverlay.setAlpha(1 - config.ambient.intensity);
    }

    _updateCelestialBodies(config) {
        const centerX = 0;
        const centerY = -2000;
        const radius = 3000;
        
        // Update sun
        if (config.sun.visible) {
            const sunX = centerX + Math.cos(config.sun.angle) * radius;
            const sunY = centerY + Math.sin(config.sun.angle) * radius;
            
            this.sun.setPosition(sunX, sunY);
            this.sun.setVisible(true);
            this.sun.setAlpha(config.sun.intensity);
            
            // Add sun glow
            this._updateSunGlow(sunX, sunY, config.sun.intensity);
        } else {
            this.sun.setVisible(false);
        }
        
        // Update moon
        if (config.moon.visible) {
            const moonX = centerX + Math.cos(config.moon.angle) * radius;
            const moonY = centerY + Math.sin(config.moon.angle) * radius;
            
            this.moon.setPosition(moonX, moonY);
            this.moon.setVisible(true);
            this.moon.setAlpha(config.moon.intensity);
            
            // Add moon glow
            this._updateMoonGlow(moonX, moonY, config.moon.intensity);
        } else {
            this.moon.setVisible(false);
        }
        
        // Update stars
        const starsVisible = config.moon.visible;
        this.stars.forEach(star => {
            star.setVisible(starsVisible);
            if (starsVisible) {
                star.setAlpha(config.ambient.intensity * 0.8);
            }
        });
    }

    _updateSunGlow(x, y, intensity) {
        // Create sun glow effect
        if (!this.sunGlow) {
            this.sunGlow = this.scene.add.circle(x, y, 100, 0xffff99, 0.2);
            this.layers.effects.add(this.sunGlow);
        }
        
        this.sunGlow.setPosition(x, y);
        this.sunGlow.setAlpha(intensity * 0.3);
    }

    _updateMoonGlow(x, y, intensity) {
        // Create moon glow effect
        if (!this.moonGlow) {
            this.moonGlow = this.scene.add.circle(x, y, 80, 0xffffff, 0.1);
            this.layers.effects.add(this.moonGlow);
        }
        
        this.moonGlow.setPosition(x, y);
        this.moonGlow.setAlpha(intensity * 0.2);
    }

    _updateFog(config) {
        this.fogOverlay.setFillStyle(config.fog.color);
        this.fogOverlay.setAlpha(config.fog.density);
    }

    _updateShadows(config) {
        // Update shadow direction and length based on light angle
        const lightAngle = config.sun.visible ? config.sun.angle : config.moon.angle;
        const shadowLength = config.shadows.length * 50;
        const shadowOffsetX = Math.cos(lightAngle) * shadowLength;
        const shadowOffsetY = Math.sin(lightAngle) * shadowLength;
        
        // Apply to all shadow objects
        this.scene.children.list.forEach(child => {
            if (child.shadow) {
                child.shadow.setPosition(shadowOffsetX, shadowOffsetY);
                child.shadow.setAlpha(config.shadows.darkness);
            }
        });
    }

    _updateSkyGradient(config) {
        // Create sky gradient overlay
        if (!this.skyGradient) {
            this.skyGradient = this.scene.add.graphics();
            this.layers.ambient.add(this.skyGradient);
        }
        
        this.skyGradient.clear();
        
        const height = 2000;
        const width = 4000;
        
        // Create gradient
        const gradient = this.skyGradient.createLinearGradient(0, -height/2, 0, height/2);
        gradient.addColorStop(0, config.sky.top);
        gradient.addColorStop(1, config.sky.bottom);
        
        this.skyGradient.fillStyle(gradient);
        this.skyGradient.fillRect(-width/2, -height/2, width, height);
        this.skyGradient.setAlpha(0.3);
    }

    _updateDynamicLights(config) {
        // Update street lamps and other dynamic lights
        this.lights.forEach((light, id) => {
            if (config.period === 'night' || config.period === 'dusk') {
                light.setVisible(true);
                light.setAlpha(config.period === 'night' ? 1.0 : 0.5);
            } else {
                light.setVisible(false);
            }
        });
    }

    _updateWeatherEffects(config) {
        // Weather effects would be updated here based on time and weather conditions
        // For now, just adjust visibility based on time
        if (this.weatherEffects) {
            this.weatherEffects.setAlpha(config.ambient.intensity);
        }
    }

    // ═══════════════════════════════════════════════════════
    // DYNAMIC LIGHT MANAGEMENT
    // ═══════════════════════════════════════════════════════

    /**
     * Add dynamic light source (street lamp, torch, etc.)
     */
    addDynamicLight(id, x, y, config = {}) {
        const light = this.scene.add.container(x, y);
        
        // Light cone
        const cone = this.scene.add.polygon(
            0, 0,
            0, 0,
            -config.radius || -30, config.height || 60,
            config.radius || 30, config.height || 60
        );
        cone.setFillStyle(config.color || 0xffff99, config.intensity || 0.3);
        light.add(cone);
        
        // Light glow
        const glow = this.scene.add.circle(0, 0, config.glowRadius || 15, config.color || 0xffff99, 0.2);
        light.add(glow);
        
        // Add to lights map
        this.lights.set(id, light);
        this.layers.effects.add(light);
        
        return light;
    }

    /**
     * Remove dynamic light
     */
    removeDynamicLight(id) {
        const light = this.lights.get(id);
        if (light) {
            light.destroy();
            this.lights.delete(id);
        }
    }

    /**
     * Create flashlight effect for player
     */
    createFlashlight(player) {
        const flashlight = this.scene.add.polygon(
            0, 0,
            0, 0,
            -20, 100,
            20, 100
        );
        flashlight.setFillStyle(0xffff99, 0.4);
        flashlight.setVisible(false);
        
        // Follow player rotation
        player.on('update', () => {
            flashlight.setPosition(player.x, player.y);
            flashlight.rotation = player.rotation;
        });
        
        this.layers.effects.add(flashlight);
        return flashlight;
    }

    /**
     * Create torch flicker effect
     */
    createTorch(x, y) {
        const torch = this.scene.add.container(x, y);
        
        // Flame
        const flame = this.scene.add.circle(0, -10, 8, 0xff6600, 0.8);
        torch.add(flame);
        
        // Light cone
        const cone = this.scene.add.polygon(
            0, -10,
            0, 0,
            -25, 40,
            25, 40
        );
        cone.setFillStyle(0xff6600, 0.3);
        torch.add(cone);
        
        // Flicker animation
        this.scene.tweens.add({
            targets: [flame, cone],
            alpha: 0.4,
            duration: 100 + Math.random() * 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        this.lights.set(`torch_${x}_${y}`, torch);
        this.layers.effects.add(torch);
        
        return torch;
    }

    // ═══════════════════════════════════════════════════════
    // TIME CONTROL
    // ═══════════════════════════════════════════════════════

    /**
     * Set time of day
     */
    setTimeOfDay(hour) {
        this.currentTime = hour % 24;
        this.updateLighting();
    }

    /**
     * Get current time
     */
    getCurrentTime() {
        return this.currentTime;
    }

    /**
     * Pause/unpause time progression
     */
    pauseTime() {
        this.isPaused = true;
    }

    resumeTime() {
        this.isPaused = false;
    }

    /**
     * Set time scale
     */
    setTimeScale(scale) {
        this.timeScale = Math.max(0, scale);
    }

    /**
     * Update time progression
     */
    updateTime(delta) {
        if (!this.isPaused) {
            this.currentTime += delta * this.timeScale;
            if (this.currentTime >= 24) {
                this.currentTime = 0;
            }
            this.updateLighting();
        }
    }

    // ═══════════════════════════════════════════════════════
    // SPECIAL EFFECTS
    // ═══════════════════════════════════════════════════════

    /**
     * Create god rays effect
     */
    createGodRays(x, y) {
        const godRay = this.scene.add.graphics();
        
        // Draw ray
        godRay.lineStyle(20, 0xffffff, 0.1);
        godRay.lineBetween(x, y, x + Math.random() * 200 - 100, y + 500);
        
        // Animate
        this.scene.tweens.add({
            targets: godRay,
            alpha: 0.3,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
        
        this.layers.effects.add(godRay);
        this.godRays.push(godRay);
        
        return godRay;
    }

    /**
     * Create lightning effect
     */
    createLightning(startX, startY, endX, endY) {
        const lightning = this.scene.add.graphics();
        
        // Generate lightning path
        const points = this._generateLightningPath(startX, startY, endX, endY);
        
        // Draw lightning
        lightning.lineStyle(3, 0xffffff, 1);
        lightning.strokePoints(points);
        
        // Add glow
        lightning.lineStyle(8, 0x88ccff, 0.3);
        lightning.strokePoints(points);
        
        // Flash effect
        this.scene.cameras.main.flash(200, 255, 255, 255, false);
        
        // Remove after animation
        this.scene.time.delayedCall(200, () => {
            lightning.destroy();
        });
        
        this.layers.effects.add(lightning);
        return lightning;
    }

    _generateLightningPath(startX, startY, endX, endY) {
        const points = [[startX, startY]];
        const segments = 8;
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 50;
            const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 30;
            points.push([x, y]);
        }
        
        points.push([endX, endY]);
        return points;
    }

    // ═══════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════

    /**
     * Clean up lighting system
     */
    destroy() {
        // Destroy all layers
        Object.values(this.layers).forEach(layer => {
            layer.destroy();
        });
        
        // Clear collections
        this.lights.clear();
        this.stars = [];
        this.godRays = [];
    }
}
