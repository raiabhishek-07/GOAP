// ============================================================
// OpenWorldSceneEnhanced.js — Enhanced with Environmental System
// Integrates new environmental systems with existing modular character
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

// NEW ENVIRONMENTAL SYSTEMS
import { EnvironmentManager } from '../../../lib/game/world/EnvironmentManager';
import { TerrainSystem } from '../../../lib/game/world/TerrainSystem';
import { RoadSystem } from '../../../lib/game/world/RoadSystem';
import { LightingSystem } from '../../../lib/game/world/LightingSystem';
import { VisualEffectsSystem } from '../../../lib/game/world/VisualEffectsSystem';
import { BiomeObjectRules } from '../../../lib/game/world/BiomeObjectRules';

export class OpenWorldSceneEnhanced extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'OpenWorldSceneEnhanced' });
    }

    init(data) {
        this.worldSeed = data.seed || 12345;
        this.playerName = data.playerName || 'OPERATIVE_07';
        this.isMultiplayer = data.multiplayer || false;
        this.roomCode = data.roomCode || null;
    }

    create() {
        // ─── GENERATE ALL PIXEL ART TEXTURES ───────────────
        const texGen = new PixelTextureGenerator(this);
        texGen.generateAll();

        // ─── ENVIRONMENTAL SYSTEMS ─────────────────────────
        this._initializeEnvironmentalSystems();

        // ─── WORLD GENERATION ──────────────────────────────
        this.worldGen = new ProceduralWorld(this.worldSeed);
        this.chunkManager = new ChunkManager(this, this.worldGen);

        // ─── PHYSICS WORLD BOUNDS ──────────────────────────
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

        // ─── PLAYER (Enhanced with Environmental Integration) ───────
        const spawn = SPAWN_CONFIG.playerSpawn;
        this.player = this._createEnhancedPlayer(spawn.x, spawn.y);

        // ─── CAMERA ────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.0);

        // ─── CONTROLS ──────────────────────────────────────
        this._setupControls();

        // ─── WEAPON SYSTEM ─────────────────────────────────
        this._setupWeaponSystem();

        // ─── AI AGENTS ─────────────────────────────────────
        this._spawnAIAgents();

        // ─── LOOT ON GROUND ────────────────────────────────
        this._spawnLoot();

        // ─── VEHICLES ───────────────────────────────────────
        this.vehicleSystem = new VehicleSystem(this);
        this._spawnVehicles();

        // ─── CAMERA MODES ──────────────────────────────────
        this.cameraMode = 'top-down';
        this._targetZoom = 2.0;
        this._targetRotation = 0;

        // ─── COLLISIONS ────────────────────────────────────
        this._setupCollisions();

        // ─── ENVIRONMENTAL INTEGRATION ───────────────────────
        this._integrateEnvironmentWithPlayer();

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

        // ─── ENVIRONMENTAL UPDATES ───────────────────────────
        this._startEnvironmentalUpdates();
    }

    // ═══════════════════════════════════════════════════════
    // ENVIRONMENTAL SYSTEMS INITIALIZATION
    // ═══════════════════════════════════════════════════════

    _initializeEnvironmentalSystems() {
        // Initialize all environmental systems
        this.environmentManager = new EnvironmentManager(this);
        this.terrainSystem = new TerrainSystem(this);
        this.roadSystem = new RoadSystem(this);
        this.lightingSystem = new LightingSystem(this);
        this.visualEffects = new VisualEffectsSystem(this);
        this.biomeRules = new BiomeObjectRules();

        console.log('🌍 Environmental Systems Initialized');
    }

    // ═══════════════════════════════════════════════════════
    // ENHANCED PLAYER CREATION
    // ═══════════════════════════════════════════════════════

    _createEnhancedPlayer(x, y) {
        // Create the original modular player
        const player = createModularPlayer(this, x, y, this.playerName);

        // Add environmental integration
        player.environmentData = {
            currentBiome: 'grassland',
            footstepTimer: 0,
            lastFootprintPosition: { x, y },
            footprintSurface: 'dirt',
            isWet: false,
            lightingAffected: true
        };

        // Add flashlight for night exploration
        player.flashlight = this.lightingSystem.createFlashlight(player);

        // Add player to environmental systems
        this.environmentManager.dynamicObjects.add(player);

        console.log(`🎮 Enhanced Player Created: ${this.playerName}`);
        return player;
    }

    // ═══════════════════════════════════════════════════════
    // ENVIRONMENTAL INTEGRATION
    // ═══════════════════════════════════════════════════════

    _integrateEnvironmentWithPlayer() {
        // Generate initial environment around player
        this._generateEnvironmentAroundPlayer();

        // Setup player-environment interactions
        this._setupPlayerEnvironmentInteractions();
    }

    _generateEnvironmentAroundPlayer() {
        const playerX = this.player.x;
        const playerY = this.player.y;
        const chunkSize = 256;

        // Generate terrain chunks around player
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const chunkX = Math.floor((playerX + dx * chunkSize) / chunkSize);
                const chunkY = Math.floor((playerY + dy * chunkSize) / chunkSize);
                
                const chunk = this.terrainSystem.generateChunk(chunkX, chunkY, this.worldGen);
                this.add.existing(chunk);
            }
        }

        // Generate roads connecting key points
        this._generateRoadNetwork();

        // Spawn environmental objects
        this._spawnEnvironmentalObjects(playerX, playerY);
    }

    _generateRoadNetwork() {
        // Generate main roads through the world
        const keyPoints = [
            { x: WORLD_SIZE * 0.2, y: WORLD_SIZE * 0.5 },
            { x: WORLD_SIZE * 0.5, y: WORLD_SIZE * 0.5 },
            { x: WORLD_SIZE * 0.8, y: WORLD_SIZE * 0.5 },
            { x: WORLD_SIZE * 0.5, y: WORLD_SIZE * 0.2 },
            { x: WORLD_SIZE * 0.5, y: WORLD_SIZE * 0.8 }
        ];

        const roads = this.roadSystem.generateRoadNetwork(keyPoints, {
            type: 'main',
            material: 'asphalt'
        });

        roads.forEach(road => {
            this.add.existing(road.mesh);
        });
    }

    _spawnEnvironmentalObjects(centerX, centerY) {
        const spawnRadius = 200;
        const objectTypes = ['treeCluster', 'bush', 'rockFormation', 'tallGrass', 'streetLamp'];

        objectTypes.forEach(type => {
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * spawnRadius;
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
                    }
                }
            }
        });
    }

    _getBiomeAt(x, y) {
        // Simple biome determination based on position
        const noise = Math.sin(x * 0.001) * Math.cos(y * 0.001);
        
        if (noise < -0.3) return 'forest';
        if (noise < 0.1) return 'grassland';
        if (noise < 0.3) return 'urban';
        return 'military';
    }

    _setupPlayerEnvironmentInteractions() {
        // Footstep effects
        this.input.on('pointerdown', () => {
            if (this._isShooting) {
                this.visualEffects.createBulletImpact(
                    this.input.activePointer.x,
                    this.input.activePointer.y,
                    'concrete'
                );
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // SETUP METHODS
    // ═══════════════════════════════════════════════════════

    _setupControls() {
        this.cursors = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            upArrow: 'UP', downArrow: 'DOWN', leftArrow: 'LEFT', rightArrow: 'RIGHT',
            sprint: 'SHIFT',
            interact: 'E',
            reload: 'R',
            weapon1: 'ONE', weapon2: 'TWO', weapon3: 'THREE',
            tab: 'TAB',
            view: 'V',
            flashlight: 'F',
            time: 'T' // Time control for testing
        });

        this.input.on('wheel', (pointer, go, dx, deltaY) => {
            this._targetZoom = Phaser.Math.Clamp(this._targetZoom - deltaY * 0.001, 0.5, 4.0);
        });

        // Toggle view mode
        this.input.keyboard.on('keydown-V', () => {
            this.cameraMode = this.cameraMode === 'top-down' ? 'fps' : 'top-down';
            this._targetZoom = this.cameraMode === 'fps' ? 3.5 : 2.0;
            
            const hud = this.scene.get('OpenWorldHUD');
            if (hud && hud.showSystemMessage) {
                hud.showSystemMessage(
                    this.cameraMode === 'fps' ? 'ACTION VIEW' : 'TOP-DOWN VIEW',
                    this.cameraMode === 'fps' ? 'Dynamic Rotation + High Zoom' : 'Standard Strategic Mode'
                );
            }
        });

        // Toggle flashlight
        this.input.keyboard.on('keydown-F', () => {
            if (this.player.flashlight) {
                this.player.flashlight.setVisible(!this.player.flashlight.visible);
            }
        });

        // Time control for testing
        this.input.keyboard.on('keydown-T', () => {
            const currentTime = this.lightingSystem.getCurrentTime();
            this.lightingSystem.setTimeOfDay(currentTime + 2); // Advance 2 hours
        });
    }

    _setupWeaponSystem() {
        this.bulletPool = new BulletPool(this, 200);
        this.weaponSystem = new WeaponSystem(this, this.bulletPool);
        this.killCount = 0;

        // Mouse click = shoot
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

        // Create vehicle group
        this.vehicleGroup = this.physics.add.group();
        this.vehicleGroup.addMultiple(this.vehicleSystem.vehicles);

        // Heavy Vehicle Collisions
        this.physics.add.collider(this.vehicleGroup, this.vehicleGroup);
        this.physics.add.collider(this.vehicleGroup, this.chunkManager.getObstacleGroup());
        this.physics.add.collider(this.vehicleGroup, this.chunkManager.getBuildingGroup());

        // Entity interactions
        this.aiAgents.forEach(agent => {
            this.physics.add.collider(agent, this.chunkManager.getObstacleGroup());
            this.physics.add.collider(agent, this.chunkManager.getBuildingGroup());
            this.physics.add.collider(agent, this.vehicleGroup);
        });

        this.physics.add.collider(this.player, this.vehicleGroup);
    }

    _setupMultiplayer() {
        // Multiplayer setup code here
        this._setupMultiplayer();
    }

    // ═══════════════════════════════════════════════════════
    // ENVIRONMENTAL UPDATES
    // ═══════════════════════════════════════════════════════

    _startEnvironmentalUpdates() {
        // Update environmental systems every frame
        this.events.on('update', this._updateEnvironmentalSystems, this);
    }

    _updateEnvironmentalSystems(delta) {
        // Update all environmental systems
        this.environmentManager.update(delta);
        this.lightingSystem.updateTime(delta);
        this.visualEffects.update(delta);

        // Update player-environment interactions
        this._updatePlayerEnvironmentInteractions(delta);
    }

    _updatePlayerEnvironmentInteractions(delta) {
        const player = this.player;
        const envData = player.environmentData;

        // Update footstep timer
        envData.footstepTimer += delta;

        // Check if player is moving
        const isMoving = player.body && (player.body.velocity.x !== 0 || player.body.velocity.y !== 0);

        if (isMoving && envData.footstepTimer > 300) { // Footstep every 300ms
            envData.footstepTimer = 0;

            // Create footprint
            const surface = this._getSurfaceAt(player.x, player.y);
            this.visualEffects.createFootprint(player.x, player.y, player.rotation, surface);

            // Create dust particles
            if (surface === 'dirt' || surface === 'sand') {
                this.visualEffects.createParticleEffect('dust', player.x, player.y, {
                    count: 3,
                    speed: { min: 10, max: 30 },
                    lifespan: 1000
                });
            }

            // Update last footprint position
            envData.lastFootprintPosition = { x: player.x, y: player.y };
            envData.footprintSurface = surface;
        }

        // Update player's current biome
        const currentBiome = this._getBiomeAt(player.x, player.y);
        if (currentBiome !== envData.currentBiome) {
            envData.currentBiome = currentBiome;
            console.log(`🌍 Player entered ${currentBiome} biome`);
        }
    }

    _getSurfaceAt(x, y) {
        const biome = this._getBiomeAt(x, y);
        
        const surfaceMap = {
            forest: 'dirt',
            grassland: 'grass',
            desert: 'sand',
            urban: 'concrete',
            military: 'concrete',
            water: 'water'
        };
        
        return surfaceMap[biome] || 'dirt';
    }

    // ═══════════════════════════════════════════════════════
    // EXISTING METHODS (Preserved from Original)
    // ═══════════════════════════════════════════════════════

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

        let vx = 0, vy = 0;

        if (this.cameraMode === 'fps') {
            // Relative movement (FPS Style)
            const forward = this.player.rotation - Math.PI / 2;
            const right = forward + Math.PI / 2;

            let moveX = 0, moveY = 0;
            if (c.up.isDown || c.upArrow.isDown) { moveX += Math.cos(forward); moveY += Math.sin(forward); }
            if (c.down.isDown || c.downArrow.isDown) { moveX -= Math.cos(forward); moveY -= Math.sin(forward); }
            if (c.left.isDown || c.leftArrow.isDown) { moveX -= Math.cos(right); moveY -= Math.sin(right); }
            if (c.right.isDown || c.rightArrow.isDown) { moveX += Math.cos(right); moveY += Math.sin(right); }

            vx = moveX * speed;
            vy = moveY * speed;
        } else {
            // Absolute movement (Top-down)
            if (c.up.isDown || c.upArrow.isDown) vy = -speed;
            if (c.down.isDown || c.downArrow.isDown) vy = speed;
            if (c.left.isDown || c.leftArrow.isDown) vx = -speed;
            if (c.right.isDown || c.rightArrow.isDown) vx = speed;
        }

        // Apply velocity
        p.body.setVelocity(vx, vy);

        // Update rotation based on movement direction (top-down mode)
        if (this.cameraMode === 'top-down' && (vx !== 0 || vy !== 0)) {
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
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════

    update(time, delta) {
        // Handle player movement
        this._handlePlayerMovement();

        // Handle shooting
        if (this._isShooting && this.weaponSystem) {
            const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
            this.weaponSystem.update(this.player, worldPoint, time);
        }

        // Update camera
        this._updateCamera();

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

    _updateCamera() {
        // Smooth zoom
        const currentZoom = this.cameras.main.zoom;
        if (Math.abs(currentZoom - this._targetZoom) > 0.01) {
            this.cameras.main.setZoom(Phaser.Math.Linear(currentZoom, this._targetZoom, 0.1));
        }

        // FPS mode rotation
        if (this.cameraMode === 'fps') {
            const currentRotation = this.cameras.main.rotation;
            if (Math.abs(currentRotation - this._targetRotation) > 0.01) {
                this.cameras.main.rotation = Phaser.Math.Linear(currentRotation, this._targetRotation, 0.1);
            }
        }
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

        console.log('🧹 OpenWorldSceneEnhanced Cleaned Up');
    }
}
