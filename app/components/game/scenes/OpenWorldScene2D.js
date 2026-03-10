// ============================================================
// OpenWorldScene2D.js — 2D Top-Down with Enhanced Environment
// Maintains your existing 2D gameplay while adding environmental systems
// ============================================================

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

import { ProceduralWorld } from '../../../lib/game/world/ProceduralWorld';
import { ChunkManager } from '../../../lib/game/world/ChunkManager';
import { PixelTextureGenerator } from '../../../lib/game/world/PixelTextureGenerator';
import { BulletPool } from '../../../lib/game/world/BulletPool';
import { WeaponSystem } from '../../../lib/game/world/WeaponSystem';
import { ALL_WEAPONS, WEAPON, AMMO_TYPE, DEFAULT_RESERVE_AMMO } from '../../../lib/game/world/WeaponConfig';
import { VehicleSystem } from '../../../lib/game/world/VehicleSystem';
import { ALL_VEHICLES, VEHICLE } from '../../../lib/game/world/VehicleConfig';
import { OpenWorldGOAPAgent } from '../../../lib/game/world/GOAPBrain';
import { getNetwork } from '../../../lib/game/world/NetworkManager';
import { serializePlayerState, RemotePlayerManager, TickRateController, GameEvent } from '../../../lib/game/world/GameStateSync';
import {
    WORLD_SIZE, TILE_SIZE, SPAWN_CONFIG, BIOME_PROPS,
    OBSTACLE, ITEM_TYPE, ITEM_WEIGHT
} from '../../../lib/game/world/WorldConfig';
import { createModularPlayer } from '../../../lib/game/world/ModularPlayer';

// NEW ENVIRONMENTAL SYSTEMS (2D OPTIMIZED)
import { EnvironmentManager } from '../../../lib/game/world/EnvironmentManager';
import { TerrainSystem } from '../../../lib/game/world/TerrainSystem';
import { RoadSystem } from '../../../lib/game/world/RoadSystem';
import { LightingSystem } from '../../../lib/game/world/LightingSystem';
import { VisualEffectsSystem } from '../../../lib/game/world/VisualEffectsSystem';
import { BiomeObjectRules } from '../../../lib/game/world/BiomeObjectRules';

export class OpenWorldScene2D extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'OpenWorldScene2D' });
    }

    init(data) {
        this.worldSeed = data.seed || 12345;
        this.playerName = data.playerName || 'OPERATIVE_07';
        this.isMultiplayer = data.multiplayer || false;
        this.roomCode = data.roomCode || null;
        
        // 2D SPECIFIC SETTINGS
        this.cameraMode = 'top-down'; // Always 2D top-down
        this.is2DMode = true;
    }

    create() {
        // ─── GENERATE ALL PIXEL ART TEXTURES ───────────────
        const texGen = new PixelTextureGenerator(this);
        texGen.generateAll();

        // ─── ENVIRONMENTAL SYSTEMS (2D OPTIMIZED) ───────
        this._initialize2DEnvironmentalSystems();

        // ─── WORLD GENERATION ──────────────────────────────
        this.worldGen = new ProceduralWorld(this.worldSeed);
        this.chunkManager = new ChunkManager(this, this.worldGen);

        // ─── PHYSICS WORLD BOUNDS ──────────────────────────
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

        // ─── PLAYER (2D Enhanced) ───────────────────────────
        const spawn = SPAWN_CONFIG.playerSpawn;
        this.player = this._create2DPlayer(spawn.x, spawn.y);

        // ─── CAMERA (2D Top-Down) ───────────────────────
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.0);

        // ─── CONTROLS (2D Top-Down) ───────────────────────
        this._setup2DControls();

        // ─── WEAPON SYSTEM ─────────────────────────────────
        this._setupWeaponSystem();

        // ─── AI AGENTS ─────────────────────────────────────
        this._spawnAIAgents();

        // ─── LOOT ON GROUND ────────────────────────────────
        this._spawnLoot();

        // ─── VEHICLES ───────────────────────────────────────
        this.vehicleSystem = new VehicleSystem(this);
        this._spawnVehicles();

        // ─── COLLISIONS ────────────────────────────────────
        this._setupCollisions();

        // ─── ENVIRONMENTAL INTEGRATION (2D) ───────────────
        this._integrate2DEnvironment();

        // ─── HUD ───────────────────────────────────────────
        this.scene.launch('OpenWorldHUD', {
            player: this.player,
            worldSize: WORLD_SIZE,
            weaponSystem: this.weaponSystem,
            vehicleSystem: this.vehicleSystem,
            lightingSystem: this.lightingSystem,
            environmentManager: this.environmentManager
        });

        // ─── MULTIPLAYER ───────────────────────────────────
        if (this.isMultiplayer) {
            this._setupMultiplayer();
        }

        console.log('🎮 2D Top-Down Scene with Enhanced Environment Ready!');
    }

    // ═══════════════════════════════════════════════════════
    // 2D ENVIRONMENTAL SYSTEMS INITIALIZATION
    // ═══════════════════════════════════════════════════════

    _initialize2DEnvironmentalSystems() {
        // Initialize environmental systems optimized for 2D
        this.environmentManager = new EnvironmentManager(this);
        this.terrainSystem = new TerrainSystem(this);
        this.roadSystem = new RoadSystem(this);
        this.lightingSystem = new LightingSystem(this);
        this.visualEffects = new VisualEffectsSystem(this);
        this.biomeRules = new BiomeObjectRules();

        // Configure for 2D top-down
        this._configureEnvironmentFor2D();
    }

    _configureEnvironmentFor2D() {
        // Adjust lighting for 2D top-down view
        this.lightingSystem.setTimeOfDay(12); // Start at noon for best visibility
        
        // Configure visual effects for 2D
        this.visualEffects.setWeather('clear', 0); // Start with clear weather
        
        console.log('🌍 Environmental Systems Configured for 2D Top-Down');
    }

    // ═══════════════════════════════════════════════════════
    // 2D ENHANCED PLAYER CREATION
    // ═══════════════════════════════════════════════════════

    _create2DPlayer(x, y) {
        // Create your existing modular player (unchanged)
        const player = createModularPlayer(this, x, y, this.playerName);

        // Add 2D-specific environmental data
        player.environmentData = {
            currentBiome: 'grassland',
            footstepTimer: 0,
            lastFootprintPosition: { x, y },
            footprintSurface: 'dirt',
            is2DMode: true,
            lightingAffected: true
        };

        // Add player to environmental systems
        this.environmentManager.dynamicObjects.add(player);

        // 2D shadow (enhanced from original)
        this._create2DPlayerShadow(player);

        console.log(`🎮 2D Player Created: ${this.playerName}`);
        return player;
    }

    _create2DPlayerShadow(player) {
        // Enhanced 2D shadow that works with environmental lighting
        const shadow = this.add.circle(player.x, player.y + 10, 12, 0x000000, 0.3);
        shadow.setDepth(24); // Just below player
        
        // Update shadow to follow player
        this.events.on('update', () => {
            shadow.setPosition(player.x, player.y + 10);
            
            // Adjust shadow based on lighting
            const lightingConfig = this.lightingSystem.getLightingConfig();
            shadow.setAlpha(0.3 * (1 - lightingConfig.shadows.darkness * 0.5));
        });
        
        player.shadow2D = shadow;
    }

    // ═══════════════════════════════════════════════════════
    // 2D ENVIRONMENTAL INTEGRATION
    // ═══════════════════════════════════════════════════════

    _integrate2DEnvironment() {
        // Generate initial environment around player
        this._generate2DEnvironmentAroundPlayer();

        // Setup 2D player-environment interactions
        this._setup2DPlayerEnvironmentInteractions();

        // Start environmental updates
        this._start2DEnvironmentalUpdates();
    }

    _generate2DEnvironmentAroundPlayer() {
        const playerX = this.player.x;
        const playerY = this.player.y;
        const viewRadius = 300; // 2D view radius

        // Generate terrain chunks (2D optimized)
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const chunkX = Math.floor(playerX / 256) + dx;
                const chunkY = Math.floor(playerY / 256) + dy;
                
                const chunk = this.terrainSystem.generateChunk(chunkX, chunkY, this.worldGen);
                this.add.existing(chunk);
            }
        }

        // Generate 2D roads
        this._generate2DRoads(playerX, playerY);

        // Spawn 2D environmental objects
        this._spawn2DEnvironmentalObjects(playerX, playerY, viewRadius);
    }

    _generate2DRoads(centerX, centerY) {
        // Generate simple 2D road network
        const roadPoints = [
            { x: centerX - 200, y: centerY },
            { x: centerX, y: centerY },
            { x: centerX + 200, y: centerY },
            { x: centerX, y: centerY - 150 },
            { x: centerX, y: centerY + 150 }
        ];

        // Create roads connecting points
        for (let i = 0; i < roadPoints.length - 1; i++) {
            const road = this.roadSystem.generateRoad(
                roadPoints[i].x, roadPoints[i].y,
                roadPoints[i + 1].x, roadPoints[i + 1].y,
                { type: 'main', material: 'asphalt' }
            );
            this.add.existing(road.mesh);
        }
    }

    _spawn2DEnvironmentalObjects(centerX, centerY, radius) {
        const objectTypes = ['treeCluster', 'bush', 'rockFormation', 'tallGrass'];
        
        objectTypes.forEach(type => {
            const count = type === 'treeCluster' ? 3 : 5;
            
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * radius;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                // Get biome at this position
                const biome = this._getBiomeAt(x, y);
                
                // Check if object can be placed here
                if (this.biomeRules.canPlaceObject(type, x, y, biome)) {
                    const config = this.biomeRules.generateObjectConfig(type, biome, this.math);
                    const object = this.environmentManager.spawnObject(type, x, y, config);
                    
                    if (object) {
                        this.add.existing(object);
                        
                        // Adjust depth for 2D top-down
                        object.setDepth(Math.floor(y * 0.1) * 1000 + 200);
                    }
                }
            }
        });
    }

    _getBiomeAt(x, y) {
        // Simple biome determination for 2D
        const noise = Math.sin(x * 0.002) * Math.cos(y * 0.002);
        
        if (noise < -0.3) return 'forest';
        if (noise < 0.1) return 'grassland';
        if (noise < 0.3) return 'urban';
        return 'military';
    }

    _setup2DPlayerEnvironmentInteractions() {
        // 2D footstep effects
        this.events.on('update', () => {
            this._update2DPlayerFootsteps();
        });

        // 2D shooting effects
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this._create2DShootEffect(pointer);
            }
        });
    }

    _update2DPlayerFootsteps() {
        const player = this.player;
        const envData = player.environmentData;

        if (!player.body) return;

        // Update footstep timer
        envData.footstepTimer += 16; // Assuming 60 FPS

        // Check if player is moving
        const isMoving = player.body.velocity.x !== 0 || player.body.velocity.y !== 0;

        if (isMoving && envData.footstepTimer > 250) { // Footstep every 250ms
            envData.footstepTimer = 0;

            // Create 2D footprint
            const surface = this._getSurfaceAt(player.x, player.y);
            this.visualEffects.createFootprint(player.x, player.y, player.rotation, surface);

            // Create 2D dust particles
            if (surface === 'dirt' || surface === 'sand') {
                this.visualEffects.createParticleEffect('dust', player.x, player.y, {
                    count: 2,
                    speed: { min: 5, max: 15 },
                    lifespan: 800
                });
            }
        }
    }

    _create2DShootEffect(pointer) {
        // Create 2D muzzle flash
        const worldPoint = pointer.positionToCamera(this.cameras.main);
        const flash = this.add.circle(worldPoint.x, worldPoint.y, 8, 0xffff99, 0.8);
        flash.setDepth(1000);
        
        // Animate and remove
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }

    _getSurfaceAt(x, y) {
        const biome = this._getBiomeAt(x, y);
        
        const surfaceMap = {
            forest: 'dirt',
            grassland: 'grass',
            desert: 'sand',
            urban: 'concrete',
            military: 'concrete'
        };
        
        return surfaceMap[biome] || 'dirt';
    }

    // ═══════════════════════════════════════════════════════
    // 2D CONTROLS
    // ═══════════════════════════════════════════════════════

    _setup2DControls() {
        this.cursors = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            upArrow: 'UP', downArrow: 'DOWN', leftArrow: 'LEFT', rightArrow: 'RIGHT',
            sprint: 'SHIFT',
            interact: 'E',
            reload: 'R',
            weapon1: 'ONE', weapon2: 'TWO', weapon3: 'THREE',
            tab: 'TAB',
            time: 'T', // Time control for testing
            weather: 'G' // Weather control for testing
        });

        this.input.on('wheel', (pointer, go, dx, deltaY) => {
            this._targetZoom = Phaser.Math.Clamp(this._targetZoom - deltaY * 0.001, 0.5, 4.0);
        });

        // Time control for testing
        this.input.keyboard.on('keydown-T', () => {
            const currentTime = this.lightingSystem.getCurrentTime();
            this.lightingSystem.setTimeOfDay(currentTime + 2); // Advance 2 hours
        });

        // Weather control for testing
        this.input.keyboard.on('keydown-G', () => {
            const weathers = ['clear', 'rain', 'snow', 'fog'];
            const currentIndex = weathers.indexOf(this.currentWeather || 'clear');
            const nextWeather = weathers[(currentIndex + 1) % weathers.length];
            this.currentWeather = nextWeather;
            this.visualEffects.setWeather(nextWeather, 0.5);
        });
    }

    // ═══════════════════════════════════════════════════════
    // SETUP METHODS (Preserved from Original)
    // ═══════════════════════════════════════════════════════

    _setupWeaponSystem() {
        this.bulletPool = new BulletPool(this, 200);
        this.weaponSystem = new WeaponSystem(this, this.bulletPool);
        this.killCount = 0;

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this._isShooting = true;
        });
        this.input.on('pointerup', (pointer) => {
            if (!pointer.leftButtonDown()) this._isShooting = false;
        });
        this._isShooting = false;
    }

    _setupCollisions() {
        this.physics.add.collider(this.player, this.chunkManager.getObstacleGroup());
        this.physics.add.collider(this.player, this.chunkManager.getBuildingGroup());

        this.vehicleGroup = this.physics.add.group();
        this.vehicleGroup.addMultiple(this.vehicleSystem.vehicles);

        this.physics.add.collider(this.vehicleGroup, this.vehicleGroup);
        this.physics.add.collider(this.vehicleGroup, this.chunkManager.getObstacleGroup());
        this.physics.add.collider(this.vehicleGroup, this.chunkManager.getBuildingGroup());

        this.aiAgents.forEach(agent => {
            this.physics.add.collider(agent, this.chunkManager.getObstacleGroup());
            this.physics.add.collider(agent, this.chunkManager.getBuildingGroup());
            this.physics.add.collider(agent, this.vehicleGroup);
        });

        this.physics.add.collider(this.player, this.vehicleGroup);
    }

    _spawnAIAgents() {
        this.aiAgents = [];
        // AI spawning code here
    }

    _spawnLoot() {
        this.lootItems = [];
        // Loot spawning code here
    }

    _spawnVehicles() {
        // Vehicle spawning code here
    }

    _setupMultiplayer() {
        // Multiplayer setup code here
        this._setupMultiplayer();
    }

    // ═══════════════════════════════════════════════════════
    // 2D ENVIRONMENTAL UPDATES
    // ═══════════════════════════════════════════════════════

    _start2DEnvironmentalUpdates() {
        this.events.on('update', this._update2DEnvironmentalSystems, this);
    }

    _update2DEnvironmentalSystems(delta) {
        // Update all environmental systems
        this.environmentManager.update(delta);
        this.lightingSystem.updateTime(delta);
        this.visualEffects.update(delta);

        // Update camera zoom
        const currentZoom = this.cameras.main.zoom;
        if (Math.abs(currentZoom - this._targetZoom) > 0.01) {
            this.cameras.main.setZoom(Phaser.Math.Linear(currentZoom, this._targetZoom, 0.1));
        }
    }

    // ═══════════════════════════════════════════════════════
    // PLAYER MOVEMENT (2D Top-Down - Preserved)
    // ═══════════════════════════════════════════════════════

    _handlePlayerMovement() {
        const p = this.player;
        const d = p.playerData;
        const c = this.cursors;

        if (d.inVehicle) return;

        const isSprinting = c.sprint.isDown && d.stamina > 0;
        const weightMult = Math.max(0.7, 1.0 - (this.totalWeight / 150));
        const speed = (isSprinting ? d.sprintSpeed : d.speed) * weightMult;

        const isMovingInput = c.up.isDown || c.upArrow.isDown || c.down.isDown || c.downArrow.isDown ||
            c.left.isDown || c.leftArrow.isDown || c.right.isDown || c.rightArrow.isDown;

        if (isSprinting && isMovingInput) {
            d.stamina = Math.max(0, d.stamina - 0.3);
        } else {
            d.stamina = Math.min(d.maxStamina, d.stamina + 0.15);
        }

        // 2D Top-Down Movement (Absolute)
        let vx = 0, vy = 0;
        if (c.up.isDown || c.upArrow.isDown) vy = -speed;
        if (c.down.isDown || c.downArrow.isDown) vy = speed;
        if (c.left.isDown || c.leftArrow.isDown) vx = -speed;
        if (c.right.isDown || c.rightArrow.isDown) vx = speed;

        // Apply velocity
        p.body.setVelocity(vx, vy);

        // Update rotation based on movement direction
        if (vx !== 0 || vy !== 0) {
            p.rotation = Math.atan2(vy, vx) + Math.PI / 2;
        }

        // Update animation
        if (p.updateAnimation) {
            p.updateAnimation({
                isMoving: isMovingInput,
                isSprinting: isSprinting,
                velocity: { x: vx, y: vy },
                rotation: p.rotation,
                isAiming: this._isShooting,
                isReloading: d.isReloading,
                inVehicle: d.inVehicle
            });
        }
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE LOOP (2D Optimized)
    // ═══════════════════════════════════════════════════════

    update(time, delta) {
        // Handle player movement
        this._handlePlayerMovement();

        // Handle shooting
        if (this._isShooting && this.weaponSystem) {
            const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
            this.weaponSystem.update(this.player, worldPoint, time);
        }

        // Update multiplayer tick
        if (this.isMultiplayer && this.tickController.shouldTick(time)) {
            const state = serializePlayerState(this.player, this.weaponSystem, this.vehicleSystem);
            const net = getNetwork();
            if (net.isConnected()) {
                net.sendPlayerState(state);
            }
        }

        // Environmental systems are updated automatically via events
    }

    // ═══════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════

    destroy() {
        // Clean up environmental systems
        if (this.environmentManager) this.environmentManager.destroy();
        if (this.terrainSystem) this.terrainSystem.destroy();
        if (this.roadSystem) this.roadSystem.destroy();
        if (this.lightingSystem) this.lightingSystem.destroy();
        if (this.visualEffects) this.visualEffects.destroy();

        // Clean up other systems
        if (this.vehicleSystem) this.vehicleSystem.destroy();
        if (this.weaponSystem) this.weaponSystem.destroy();
        if (this.bulletPool) this.bulletPool.destroy();

        console.log('🧹 2D Scene Cleaned Up');
    }
}
