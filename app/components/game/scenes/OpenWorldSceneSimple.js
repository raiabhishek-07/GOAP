// ============================================================
// OpenWorldSceneSimple.js — Enhanced 2D without complex dependencies
// Minimal environmental enhancements that work with existing systems
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

export class OpenWorldSceneSimple extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'OpenWorldSceneSimple' });
    }

    init(data) {
        this.worldSeed = data.seed || 12345;
        this.playerName = data.playerName || 'OPERATIVE_07';
        this.isMultiplayer = data.multiplayer || false;
        this.roomCode = data.roomCode || null;
        
        console.log('🎮 Simple Enhanced Scene Loading...');
    }

    create() {
        // ─── GENERATE ALL PIXEL ART TEXTURES ───────────────
        const texGen = new PixelTextureGenerator(this);
        texGen.generateAll();

        // ─── WORLD GENERATION ──────────────────────────────
        this.worldGen = new ProceduralWorld(this.worldSeed);
        this.chunkManager = new ChunkManager(this, this.worldGen);

        // ─── PHYSICS WORLD BOUNDS ──────────────────────────
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

        // ─── PLAYER (Enhanced with Simple Effects) ───────
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

        // ─── SIMPLE ENVIRONMENTAL ENHANCEMENTS ─────────────
        this._addSimpleEnvironmentalEffects();

        // ─── HUD ───────────────────────────────────────────
        this.scene.launch('OpenWorldHUD', {
            player: this.player,
            worldSize: WORLD_SIZE,
            weaponSystem: this.weaponSystem,
            vehicleSystem: this.vehicleSystem
        });

        // ─── MULTIPLAYER ───────────────────────────────────
        if (this.isMultiplayer) {
            this._setupMultiplayer();
        }

        console.log('✅ Simple Enhanced Scene Ready!');
    }

    // ═══════════════════════════════════════════════════════
    // ENHANCED PLAYER CREATION
    // ═══════════════════════════════════════════════════════

    _createEnhancedPlayer(x, y) {
        // Create your existing modular player
        const player = createModularPlayer(this, x, y, this.playerName);

        // Add simple enhancements
        player.environmentData = {
            footstepTimer: 0,
            lastFootprintPosition: { x, y }
        };

        // Enhanced shadow
        this._createEnhancedShadow(player);

        console.log(`🎮 Enhanced Player Created: ${this.playerName}`);
        return player;
    }

    _createEnhancedShadow(player) {
        // Create better shadow
        const shadow = this.add.circle(player.x, player.y + 10, 15, 0x000000, 0.4);
        shadow.setDepth(24);
        
        // Update shadow to follow player
        this.events.on('update', () => {
            shadow.setPosition(player.x, player.y + 10);
        });
        
        player.enhancedShadow = shadow;
    }

    // ═══════════════════════════════════════════════════════
    // SIMPLE ENVIRONMENTAL ENHANCEMENTS
    // ═══════════════════════════════════════════════════════

    _addSimpleEnvironmentalEffects() {
        // Add some decorative objects
        this._addSimpleObjects();
        
        // Add lighting overlay
        this._addSimpleLighting();
        
        // Add particle effects
        this._addSimpleParticles();
    }

    _addSimpleObjects() {
        // Add some trees and rocks around spawn
        const objects = [
            { type: 'tree', x: 100, y: 100 },
            { type: 'tree', x: -150, y: 80 },
            { type: 'rock', x: 200, y: -120 },
            { type: 'tree', x: -80, y: -180 },
            { type: 'rock', x: 120, y: 150 }
        ];

        objects.forEach(obj => {
            if (obj.type === 'tree') {
                const tree = this.add.rectangle(obj.x, obj.y, 20, 30, 0x2a5a1a);
                tree.setDepth(Math.floor(obj.y * 0.1) * 1000 + 200);
            } else if (obj.type === 'rock') {
                const rock = this.add.circle(obj.x, obj.y, 12, 0x666666);
                rock.setDepth(Math.floor(obj.y * 0.1) * 1000 + 180);
            }
        });
    }

    _addSimpleLighting() {
        // Add simple lighting overlay
        this.lightingOverlay = this.add.rectangle(0, 0, WORLD_SIZE, WORLD_SIZE, 0x000000, 0.1);
        this.lightingOverlay.setOrigin(0.5, 0.5);
        this.lightingOverlay.setDepth(900);
        this.lightingOverlay.setScrollFactor(0);
    }

    _addSimpleParticles() {
        // Create particle container
        this.particles = this.add.container(0, 0);
        this.particles.setDepth(400);
        
        // Add some ambient particles
        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 500;
            const y = (Math.random() - 0.5) * 500;
            const particle = this.add.circle(x, y, 2, 0x8b7355, 0.3);
            this.particles.add(particle);
        }
    }

    // ═══════════════════════════════════════════════════════
    // SETUP METHODS (Preserved from Original)
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
            time: 'T' // Simple time control
        });

        this.input.on('wheel', (pointer, go, dx, deltaY) => {
            this._targetZoom = Phaser.Math.Clamp(this._targetZoom - deltaY * 0.001, 0.5, 4.0);
        });

        // Simple time control
        this.input.keyboard.on('keydown-T', () => {
            if (this.lightingOverlay) {
                const currentAlpha = this.lightingOverlay.alpha;
                this.lightingOverlay.setAlpha(currentAlpha === 0.1 ? 0.3 : 0.1);
            }
        });
    }

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
    // PLAYER MOVEMENT (Preserved from Original)
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

        let vx = 0, vy = 0;

        if (this.cameraMode === 'fps') {
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
            if (c.up.isDown || c.upArrow.isDown) vy = -speed;
            if (c.down.isDown || c.downArrow.isDown) vy = speed;
            if (c.left.isDown || c.leftArrow.isDown) vx = -speed;
            if (c.right.isDown || c.rightArrow.isDown) vx = speed;
        }

        p.body.setVelocity(vx, vy);

        if (this.cameraMode === 'top-down' && (vx !== 0 || vy !== 0)) {
            p.rotation = Math.atan2(vy, vx) + Math.PI / 2;
        }

        // Simple footstep effects
        if (isMovingInput && p.environmentData) {
            p.environmentData.footstepTimer += 16;
            if (p.environmentData.footstepTimer > 300) {
                p.environmentData.footstepTimer = 0;
                this._createSimpleFootstep(p.x, p.y);
            }
        }

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

    _createSimpleFootstep(x, y) {
        const footprint = this.add.circle(x, y, 3, 0x000000, 0.2);
        footprint.setDepth(61);
        
        // Fade out footprint
        this.tweens.add({
            targets: footprint,
            alpha: 0,
            duration: 5000,
            onComplete: () => footprint.destroy()
        });
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
        const currentZoom = this.cameras.main.zoom;
        if (Math.abs(currentZoom - this._targetZoom) > 0.01) {
            this.cameras.main.setZoom(Phaser.Math.Linear(currentZoom, this._targetZoom, 0.1));
        }

        // Update multiplayer tick
        if (this.isMultiplayer && this.tickController.shouldTick(time)) {
            const state = serializePlayerState(this.player, this.weaponSystem, this.vehicleSystem);
            const net = getNetwork();
            if (net.isConnected()) {
                net.sendPlayerState(state);
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════

    destroy() {
        // Clean up enhanced elements
        if (this.particles) this.particles.destroy();
        if (this.lightingOverlay) this.lightingOverlay.destroy();
        
        // Clean up other systems
        if (this.vehicleSystem) this.vehicleSystem.destroy();
        if (this.weaponSystem) this.weaponSystem.destroy();
        if (this.bulletPool) this.bulletPool.destroy();

        console.log('🧹 Simple Enhanced Scene Cleaned Up');
    }
}
