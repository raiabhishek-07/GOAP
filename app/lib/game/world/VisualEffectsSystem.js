// ============================================================
// VisualEffectsSystem.js — Environmental Polish & Effects
// Wind, particles, footprints, bullet impacts, and ambient effects
// ============================================================

export class VisualEffectsSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Effect containers
        this.containers = {
            particles: scene.add.container(0, 0),     // Particle effects
            decals: scene.add.container(0, 0),        // Decals (footprints, bullet holes)
            weather: scene.add.container(0, 0),       // Weather effects
            ambient: scene.add.container(0, 0)        // Ambient animations
        };
        
        // Set container depths
        this.containers.particles.setDepth(400);
        this.containers.decals.setDepth(60);
        this.containers.weather.setDepth(350);
        this.containers.ambient.setDepth(300);
        
        // Effect systems
        this.particleSystems = new Map();
        this.windSystem = new WindSystem(scene);
        this.footprintSystem = new FootprintSystem(scene);
        this.bulletImpactSystem = new BulletImpactSystem(scene);
        this.weatherSystem = new WeatherSystem(scene);
        
        // Active effects tracking
        this.activeEffects = new Set();
        this.effectPool = new Map(); // Object pooling for performance
        
        // Initialize systems
        this._initializeEffects();
    }

    // ═══════════════════════════════════════════════════════
    // SYSTEM INITIALIZATION
    // ═══════════════════════════════════════════════════════

    _initializeEffects() {
        // Initialize wind system
        this.windSystem.initialize();
        
        // Initialize particle pools
        this._initializeParticlePools();
        
        // Create ambient effects
        this._createAmbientEffects();
        
        // Start update loop
        this.scene.events.on('update', this.update, this);
    }

    _initializeParticlePools() {
        // Create particle pools for different types
        const particleTypes = ['dust', 'leaf', 'rain', 'snow', 'smoke', 'spark'];
        
        particleTypes.forEach(type => {
            this.effectPool.set(type, []);
        });
    }

    _createAmbientEffects() {
        // Create floating particles
        this._createFloatingParticles();
        
        // Create wind effects
        this._createWindEffects();
    }

    // ═══════════════════════════════════════════════════════
    // PARTICLE EFFECTS
    // ═══════════════════════════════════════════════════════

    /**
     * Create particle effect
     */
    createParticleEffect(type, x, y, config = {}) {
        const particleConfig = {
            count: config.count || 10,
            speed: config.speed || { min: 20, max: 50 },
            lifespan: config.lifespan || 2000,
            gravity: config.gravity || 0,
            spread: config.spread || Math.PI * 2,
            color: config.color || 0xffffff,
            size: config.size || { min: 2, max: 4 },
            alpha: config.alpha || { start: 1, end: 0 },
            rotation: config.rotation || false
        };
        
        const particles = [];
        
        for (let i = 0; i < particleConfig.count; i++) {
            const particle = this._createParticle(type, x, y, particleConfig, i);
            particles.push(particle);
        }
        
        return particles;
    }

    _createParticle(type, x, y, config, index) {
        // Get particle from pool or create new
        let particle = this._getParticleFromPool(type);
        
        if (!particle) {
            particle = this._createNewParticle(type);
        }
        
        // Set initial properties
        particle.setPosition(x, y);
        particle.setVisible(true);
        particle.setActive(true);
        
        // Calculate velocity
        const angle = (index / config.count) * config.spread + this.windSystem.getWindAngle();
        const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
        
        particle.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        
        particle.lifespan = config.lifespan;
        particle.maxLifespan = config.lifespan;
        particle.gravity = config.gravity;
        particle.config = config;
        
        // Set appearance
        const size = config.size.min + Math.random() * (config.size.max - config.size.min);
        particle.setSize(size, size);
        particle.setTint(config.color);
        
        // Add to active effects
        this.activeEffects.add(particle);
        
        return particle;
    }

    _createNewParticle(type) {
        let particle;
        
        switch (type) {
            case 'dust':
                particle = this.scene.add.circle(0, 0, 3, 0x8b7355);
                break;
            case 'leaf':
                particle = this.scene.add.rectangle(0, 0, 6, 4, 0x2a5a1a);
                break;
            case 'rain':
                particle = this.scene.add.rectangle(0, 0, 1, 8, 0x4488ff);
                break;
            case 'snow':
                particle = this.scene.add.circle(0, 0, 2, 0xffffff);
                break;
            case 'smoke':
                particle = this.scene.add.circle(0, 0, 4, 0x888888);
                break;
            case 'spark':
                particle = this.scene.add.circle(0, 0, 1, 0xffff99);
                break;
            default:
                particle = this.scene.add.circle(0, 0, 2, 0xffffff);
        }
        
        this.containers.particles.add(particle);
        return particle;
    }

    _getParticleFromPool(type) {
        const pool = this.effectPool.get(type);
        if (pool && pool.length > 0) {
            return pool.pop();
        }
        return null;
    }

    _returnParticleToPool(type, particle) {
        const pool = this.effectPool.get(type);
        if (pool && pool.length < 50) { // Limit pool size
            particle.setVisible(false);
            particle.setActive(false);
            pool.push(particle);
        } else {
            particle.destroy();
        }
    }

    // ═══════════════════════════════════════════════════════
    // FOOTPRINT SYSTEM
    // ═══════════════════════════════════════════════════════

    /**
     * Create footprint at position
     */
    createFootprint(x, y, rotation, surface = 'dirt') {
        return this.footprintSystem.createFootprint(x, y, rotation, surface);
    }

    // ═══════════════════════════════════════════════════════
    // BULLET IMPACT SYSTEM
    // ═══════════════════════════════════════════════════════

    /**
     * Create bullet impact effect
     */
    createBulletImpact(x, y, surface = 'concrete') {
        return this.bulletImpactSystem.createImpact(x, y, surface);
    }

    // ═══════════════════════════════════════════════════════

    /**
     * Create explosion effect
     */
    createExplosion(x, y, size = 'medium') {
        const explosionConfig = {
            small: { count: 20, speed: { min: 50, max: 150 }, lifespan: 1000 },
            medium: { count: 40, speed: { min: 80, max: 200 }, lifespan: 1500 },
            large: { count: 60, speed: { min: 100, max: 300 }, lifespan: 2000 }
        };
        
        const config = explosionConfig[size] || explosionConfig.medium;
        
        // Create explosion particles
        this.createParticleEffect('spark', x, y, {
            ...config,
            color: 0xff6600,
            size: { min: 1, max: 3 },
            gravity: 200
        });
        
        this.createParticleEffect('smoke', x, y, {
            count: config.count / 2,
            speed: { min: 20, max: 60 },
            lifespan: config.lifespan * 2,
            color: 0x333333,
            size: { min: 4, max: 8 },
            gravity: -50
        });
        
        // Screen shake
        const shakeIntensity = size === 'large' ? 0.02 : size === 'medium' ? 0.01 : 0.005;
        this.scene.cameras.main.shake(300, shakeIntensity);
        
        // Flash effect
        this.scene.cameras.main.flash(100, 255, 200, 100, false);
    }

    // ═══════════════════════════════════════════════════════
    // AMBIENT EFFECTS
    // ═══════════════════════════════════════════════════════

    _createFloatingParticles() {
        // Create ambient floating particles
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            
            const particle = this._createParticle('dust', x, y, {
                count: 1,
                speed: { min: 5, max: 15 },
                lifespan: 10000,
                gravity: -10,
                spread: Math.PI * 2,
                color: 0x8b7355,
                size: { min: 1, max: 2 },
                alpha: { start: 0.3, end: 0 }
            }, 0);
            
            particle.isAmbient = true;
        }
    }

    _createWindEffects() {
        // Create wind particle streams
        this.scene.time.addEvent({
            delay: 2000,
            callback: this._createWindStream,
            callbackScope: this,
            loop: true
        });
    }

    _createWindStream() {
        const windStrength = this.windSystem.getWindStrength();
        
        if (windStrength > 0.3) {
            const x = -1000;
            const y = (Math.random() - 0.5) * 1000;
            
            this.createParticleEffect('leaf', x, y, {
                count: 5,
                speed: { min: 30 + windStrength * 50, max: 60 + windStrength * 100 },
                lifespan: 8000,
                gravity: -20,
                spread: Math.PI / 6,
                color: 0x2a5a1a,
                size: { min: 3, max: 6 },
                alpha: { start: 0.6, end: 0 },
                rotation: true
            });
        }
    }

    // ═══════════════════════════════════════════════════════
    // WEATHER EFFECTS
    // ═══════════════════════════════════════════════════════

    /**
     * Set weather type
     */
    setWeather(type, intensity = 0.5) {
        this.weatherSystem.setWeather(type, intensity);
    }

    /**
     * Stop weather effects
     */
    stopWeather() {
        this.weatherSystem.stopWeather();
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════

    update(delta) {
        // Update wind system
        this.windSystem.update(delta);
        
        // Update active particles
        this._updateParticles(delta);
        
        // Update weather
        this.weatherSystem.update(delta);
        
        // Update ambient effects
        this._updateAmbientEffects(delta);
    }

    _updateParticles(delta) {
        const dt = delta / 1000; // Convert to seconds
        
        this.activeEffects.forEach(particle => {
            if (!particle.active) return;
            
            // Update position
            particle.x += particle.velocity.x * dt;
            particle.y += particle.velocity.y * dt;
            
            // Apply gravity
            particle.velocity.y += particle.gravity * dt;
            
            // Apply wind
            const windForce = this.windSystem.getWindForce();
            particle.velocity.x += windForce.x * dt;
            particle.velocity.y += windForce.y * dt;
            
            // Update lifespan
            particle.lifespan -= delta;
            
            // Update alpha based on lifespan
            const lifeRatio = particle.lifespan / particle.maxLifespan;
            const alpha = particle.config.alpha.start + 
                        (particle.config.alpha.end - particle.config.alpha.start) * (1 - lifeRatio);
            particle.setAlpha(alpha);
            
            // Rotation for certain particle types
            if (particle.config.rotation) {
                particle.rotation += dt * 2;
            }
            
            // Remove dead particles
            if (particle.lifespan <= 0) {
                this._removeParticle(particle);
            }
        });
    }

    _updateAmbientEffects(delta) {
        // Update ambient particle regeneration
        this.activeEffects.forEach(particle => {
            if (particle.isAmbient && particle.lifespan <= 1000) {
                // Respawn ambient particle
                const x = (Math.random() - 0.5) * 2000;
                const y = (Math.random() - 0.5) * 2000;
                
                particle.setPosition(x, y);
                particle.lifespan = particle.maxLifespan;
                particle.velocity = {
                    x: (Math.random() - 0.5) * 20,
                    y: (Math.random() - 0.5) * 20
                };
            }
        });
    }

    _removeParticle(particle) {
        this.activeEffects.delete(particle);
        
        // Determine particle type from appearance
        let particleType = 'dust';
        if (particle.texture && particle.texture.key) {
            particleType = particle.texture.key;
        }
        
        this._returnParticleToPool(particleType, particle);
    }

    // ═══════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════

    /**
     * Clean up effects system
     */
    destroy() {
        // Destroy all containers
        Object.values(this.containers).forEach(container => {
            container.destroy();
        });
        
        // Clear active effects
        this.activeEffects.clear();
        this.effectPool.clear();
        
        // Destroy subsystems
        this.windSystem.destroy();
        this.footprintSystem.destroy();
        this.bulletImpactSystem.destroy();
        this.weatherSystem.destroy();
    }
}

// ═══════════════════════════════════════════════════════
// SUBSYSTEMS
// ═══════════════════════════════════════════════════════

class WindSystem {
    constructor(scene) {
        this.scene = scene;
        this.windAngle = 0;
        this.windStrength = 0.5;
        this.windVariation = 0;
    }

    initialize() {
        // Start wind variation
        this.scene.time.addEvent({
            delay: 3000,
            callback: this._updateWind,
            callbackScope: this,
            loop: true
        });
    }

    _updateWind() {
        this.windAngle += (Math.random() - 0.5) * Math.PI / 4;
        this.windStrength = 0.3 + Math.random() * 0.4;
        this.windVariation = Math.random() * 0.2;
    }

    getWindAngle() {
        return this.windAngle;
    }

    getWindStrength() {
        return this.windStrength;
    }

    getWindForce() {
        return {
            x: Math.cos(this.windAngle) * this.windStrength * 10,
            y: Math.sin(this.windAngle) * this.windStrength * 5
        };
    }

    update(delta) {
        // Add subtle wind variation
        this.windVariation = Math.sin(Date.now() * 0.001) * 0.1;
    }

    destroy() {
        // Cleanup
    }
}

class FootprintSystem {
    constructor(scene) {
        this.scene = scene;
        this.footprints = [];
        this.maxFootprints = 100;
    }

    createFootprint(x, y, rotation, surface) {
        const footprint = this.scene.add.ellipse(x, y, 8, 12, 0x000000, 0.3);
        footprint.setRotation(rotation);
        footprint.setDepth(61); // Just above ground
        
        // Surface-specific appearance
        const surfaceColors = {
            dirt: 0x8b7355,
            sand: 0xc2aa74,
            snow: 0xffffff,
            mud: 0x654321
        };
        
        footprint.setTint(surfaceColors[surface] || 0x000000);
        
        this.scene.children.list[0].add(footprint); // Add to decals container
        
        // Add to footprints array
        this.footprints.push(footprint);
        
        // Remove oldest footprints if too many
        if (this.footprints.length > this.maxFootprints) {
            const oldFootprint = this.footprints.shift();
            oldFootprint.destroy();
        }
        
        // Fade out over time
        this.scene.tweens.add({
            targets: footprint,
            alpha: 0,
            duration: 30000,
            onComplete: () => {
                const index = this.footprints.indexOf(footprint);
                if (index > -1) {
                    this.footprints.splice(index, 1);
                }
                footprint.destroy();
            }
        });
        
        return footprint;
    }

    destroy() {
        this.footprints.forEach(footprint => footprint.destroy());
        this.footprints = [];
    }
}

class BulletImpactSystem {
    constructor(scene) {
        this.scene = scene;
        this.impacts = [];
    }

    createImpact(x, y, surface) {
        const impact = this.scene.add.container(x, y);
        
        // Create impact mark
        const mark = this.scene.add.circle(0, 0, 3, 0x000000, 0.5);
        impact.add(mark);
        
        // Create sparks
        for (let i = 0; i < 5; i++) {
            const spark = this.scene.add.circle(0, 0, 1, 0xffff99);
            impact.add(spark);
            
            // Animate spark
            const angle = (Math.PI * 2 * i) / 5;
            const distance = 10 + Math.random() * 10;
            
            this.scene.tweens.add({
                targets: spark,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                alpha: 0,
                duration: 300,
                onComplete: () => spark.destroy()
            });
        }
        
        // Surface-specific effects
        if (surface === 'metal') {
            // Add ricochet effect
            const ricochet = this.scene.add.circle(0, 0, 5, 0xffffff, 0.8);
            impact.add(ricochet);
            
            this.scene.tweens.add({
                targets: ricochet,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 100,
                onComplete: () => ricochet.destroy()
            });
        }
        
        this.impacts.push(impact);
        
        // Fade out impact mark
        this.scene.tweens.add({
            targets: mark,
            alpha: 0.2,
            duration: 5000
        });
        
        return impact;
    }

    destroy() {
        this.impacts.forEach(impact => impact.destroy());
        this.impacts = [];
    }
}

class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentWeather = 'clear';
        this.weatherIntensity = 0;
        this.weatherParticles = [];
    }

    setWeather(type, intensity) {
        this.currentWeather = type;
        this.weatherIntensity = intensity;
        
        // Clear existing weather
        this.clearWeather();
        
        // Create weather effects
        switch (type) {
            case 'rain':
                this._createRain(intensity);
                break;
            case 'snow':
                this._createSnow(intensity);
                break;
            case 'fog':
                this._createFog(intensity);
                break;
        }
    }

    _createRain(intensity) {
        const particleCount = Math.floor(intensity * 100);
        
        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = -1000 + Math.random() * 2000;
            
            const raindrop = this.scene.add.rectangle(x, y, 1, 10, 0x4488ff, 0.6);
            raindrop.velocity = { x: 0, y: 300 };
            raindrop.isWeather = true;
            
            this.weatherParticles.push(raindrop);
        }
    }

    _createSnow(intensity) {
        const particleCount = Math.floor(intensity * 50);
        
        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = -1000 + Math.random() * 2000;
            
            const snowflake = this.scene.add.circle(x, y, 2, 0xffffff, 0.8);
            snowflake.velocity = { x: (Math.random() - 0.5) * 20, y: 50 };
            snowflake.isWeather = true;
            
            this.weatherParticles.push(snowflake);
        }
    }

    _createFog(intensity) {
        const fog = this.scene.add.rectangle(0, 0, 3000, 3000, 0xcccccc, intensity * 0.3);
        fog.isWeather = true;
        this.weatherParticles.push(fog);
    }

    clearWeather() {
        this.weatherParticles.forEach(particle => {
            if (particle.destroy) {
                particle.destroy();
            }
        });
        this.weatherParticles = [];
    }

    stopWeather() {
        this.setWeather('clear', 0);
    }

    update(delta) {
        const dt = delta / 1000;
        
        this.weatherParticles.forEach(particle => {
            if (particle.velocity && particle.isWeather) {
                particle.x += particle.velocity.x * dt;
                particle.y += particle.velocity.y * dt;
                
                // Wrap around screen
                if (particle.y > 1000) {
                    particle.y = -1000;
                    particle.x = (Math.random() - 0.5) * 2000;
                }
            }
        });
    }

    destroy() {
        this.clearWeather();
    }
}
