// ============================================================
// OpenWorldScene.js — PUBG-style 2D open world gameplay
// V3: Pixel art textures, sprite-based characters
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

export class OpenWorldScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'OpenWorldScene' });
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

        // ─── WORLD GENERATION ──────────────────────────────
        this.worldGen = new ProceduralWorld(this.worldSeed);
        this.chunkManager = new ChunkManager(this, this.worldGen);

        // ─── PHYSICS WORLD BOUNDS ──────────────────────────
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);

        // ─── PLAYER ────────────────────────────────────────
        const spawn = SPAWN_CONFIG.playerSpawn;
        this.player = this._createPlayer(spawn.x, spawn.y);

        // ─── CAMERA ────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(2.0);

        // ─── CONTROLS ──────────────────────────────────────
        this.cursors = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            upArrow: 'UP', downArrow: 'DOWN', leftArrow: 'LEFT', rightArrow: 'RIGHT',
            sprint: 'SHIFT',
            interact: 'E',
            reload: 'R',
            weapon1: 'ONE', weapon2: 'TWO', weapon3: 'THREE',
            tab: 'TAB',
            view: 'V',
        });

        this.input.on('wheel', (pointer, go, dx, deltaY) => {
            this._targetZoom = Phaser.Math.Clamp(this._targetZoom - deltaY * 0.001, 0.5, 4.0);
        });

        // Toggle view mode (V key) - moved to listener for reliability
        this.input.keyboard.on('keydown-V', () => {
            console.log('Camera Toggle Pressed! Mode:', this.cameraMode);
            this.cameraMode = this.cameraMode === 'top-down' ? 'fps' : 'top-down';

            const hud = this.scene.get('OpenWorldHUD');
            if (hud && hud.showSystemMessage) {
                hud.showSystemMessage(
                    this.cameraMode === 'fps' ? 'ACTION VIEW' : 'TOP-DOWN VIEW',
                    this.cameraMode === 'fps' ? 'Dynamic Rotation + High Zoom' : 'Standard Strategic Mode'
                );
            }
            this._targetZoom = this.cameraMode === 'fps' ? 3.5 : 2.0;
        });

        // ─── WEAPON SYSTEM ─────────────────────────────────
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

        // ─── AI AGENTS ─────────────────────────────────────
        this.aiAgents = [];
        this._spawnAIAgents();

        // ─── LOOT ON GROUND ────────────────────────────────
        this.lootItems = [];
        this._spawnLoot();

        this.vehicleSystem = new VehicleSystem(this);
        this._spawnVehicles();

        // ─── CAMERA MODES ──────────────────────────────────
        this.cameraMode = 'top-down'; // 'top-down' or 'fps'
        this._targetZoom = 2.0;
        this._targetRotation = 0;

        // ─── COLLISIONS ────────────────────────────────────
        this.physics.add.collider(this.player, this.chunkManager.getObstacleGroup());
        this.physics.add.collider(this.player, this.chunkManager.getBuildingGroup());

        // Create vehicle group and then populate it properly
        this.vehicleGroup = this.physics.add.group();
        this.vehicleGroup.addMultiple(this.vehicleSystem.vehicles);

        // Heavy Vehicle Collisions
        this.physics.add.collider(this.vehicleGroup, this.vehicleGroup);
        this.physics.add.collider(this.vehicleGroup, this.chunkManager.getObstacleGroup());
        this.physics.add.collider(this.vehicleGroup, this.chunkManager.getBuildingGroup());

        // Entity interactions (prevent player and AI from walking through cars)
        this.aiAgents.forEach(agent => {
            this.physics.add.collider(agent, this.chunkManager.getObstacleGroup());
            this.physics.add.collider(agent, this.chunkManager.getBuildingGroup());
            this.physics.add.collider(agent, this.vehicleGroup);
        });

        this.physics.add.collider(this.player, this.vehicleGroup);

        // ─── HUD ───────────────────────────────────────────
        this.scene.launch('OpenWorldHUD', {
            player: this.player,
            worldSize: WORLD_SIZE,
            weaponSystem: this.weaponSystem,
            vehicleSystem: this.vehicleSystem,
        });

        // ─── STRATEGIC STATE ───────────────────────────────
        this.gameTime = 0;
        this.noiseLevel = 0;
        this.inventorySlots = SPAWN_CONFIG.initialInventorySlots || 8;
        this.inventory = [];
        this.totalWeight = 0;

        this.timeOverlay = this.add.rectangle(0, 0, 4000, 4000, 0x1a1a2e, 0)
            .setScrollFactor(0).setDepth(2000).setOrigin(0.5);
        this.timeOverlay.x = this.cameras.main.centerX;
        this.timeOverlay.y = this.cameras.main.centerY;

        // ─── INITIAL CHUNK LOAD ────────────────────────────
        this.chunkManager.update(this.player.x, this.player.y);

        // ─── MINIMAP ───────────────────────────────────────
        this._createMinimap();

        // ─── MULTIPLAYER SETUP ───────────────────────────────
        this.remotePlayerManager = new RemotePlayerManager(this);
        this.tickController = new TickRateController(20);
        if (this.isMultiplayer) {
            this._setupMultiplayer();
        }

        // ─── BANNER ────────────────────────────────────────
        this._showBanner(
            this.isMultiplayer ? 'MULTIPLAYER' : 'OPEN WORLD',
            this.isMultiplayer ? `Room: ${this.roomCode}` : 'Explore • Loot • Survive'
        );

        this.activePrompts = [];

        // ─── WEATHER ────────────────────────────────────────
        this._createWeather();
    }

    _createWeather() {
        if (!this.textures.exists('fog')) return;

        // Use a standard screen-sized TileSprite that follows the camera mathematically, 
        // to prevent WebGL Framebuffer Incomplete Attachment errors associated with 10k x 10k dimensions.
        const w = this.scale.width;
        const h = this.scale.height;
        this.fogLayer = this.add.tileSprite(0, 0, w, h, 'fog')
            .setScrollFactor(0) // Stick to screen exactly via 0 scroll
            .setOrigin(0, 0)
            .setDepth(150)
            .setAlpha(0.2)
            .setBlendMode(Phaser.BlendModes.SCREEN);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        this._updateTimeCycle(delta);
        this._updateNoiseLevel(delta);

        // Vehicle or foot movement
        if (this.vehicleSystem.isDriving()) {
            this.vehicleSystem.updateDriving(this.cursors, delta);
            // Camera follows vehicle
            const v = this.vehicleSystem.activeVehicle;
            this.cameras.main.startFollow(v, true, 0.08, 0.08);
            this.chunkManager.update(v.x, v.y);
            // Vehicle enter/exit
            if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
                this.vehicleSystem.exitVehicle(this.player);
                this.player.playerData.inVehicle = false;
                this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
                // Show player shadow again
                if (this.playerShadow) this.playerShadow.setVisible(true);
            }
        } else {
            const interactPressed = Phaser.Input.Keyboard.JustDown(this.cursors.interact);

            this._handlePlayerMovement();
            this._checkSafeZone();
            this._handleShooting(time);
            this._handleWeaponKeys();
            this._handleLootPickup(interactPressed);
            this._handleVehicleInteraction(interactPressed);
            this._handlePropInteraction(interactPressed);
            this._handleTraps();
            this.chunkManager.update(this.player.x, this.player.y);
        }

        // Smooth camera transitions
        this.cameras.main.zoom = Phaser.Math.Linear(this.cameras.main.zoom, this._targetZoom, 0.1);

        if (this.cameraMode === 'fps') {
            const target = (this.player && this.player.playerData.inVehicle) ? this.vehicleSystem.activeVehicle : this.player;
            if (target) {
                const lookAngle = target.rotation - Math.PI / 2;
                this.cameras.main.setRotation(-lookAngle - Math.PI / 2);
            }
        } else {
            this.cameras.main.setRotation(Phaser.Math.Linear(this.cameras.main.rotation, 0, 0.1));
        }

        this.bulletPool.update();
        this._checkBulletHits();
        this._updateAIAgents(time, delta);
        this.vehicleSystem.updateVisuals();
        this._updateMinimap();

        // ─── MULTIPLAYER TICK ────────────────────────────────
        if (this.isMultiplayer && this.tickController.shouldTick(time)) {
            const state = serializePlayerState(this.player, this.weaponSystem, this.vehicleSystem);
            const net = getNetwork();
            if (net.isConnected()) {
                net.sendPlayerState(state);
            }
        }

        // Fog movement (Follows camera for full coverage)
        if (this.fogLayer) {
            // Tile position shifts infinitely creating illusion of endless moving fog
            this.fogLayer.tilePositionX += 0.5;
            this.fogLayer.tilePositionY += 0.3;

            // Align exact mathematical viewport center depending on zoom
            if (this.cameras.main.zoom !== 1) {
                const cam = this.cameras.main;
                // Calculate camera view bounds to stretch fog Layer dynamically without exceeding WebGL bounds
                const scale = 1 / cam.zoom;
                this.fogLayer.setScale(scale);

                // Recenter offset
                this.fogLayer.setPosition(cam.scrollX, cam.scrollY);
            }
        }
        this._updateWorldPrompts();
    }

    _updateWorldPrompts() {
        if (this.activePrompts) {
            this.activePrompts.forEach(p => p.destroy());
        }
        this.activePrompts = [];

        // Vehicle
        const nearbyVehicle = this.vehicleSystem.getNearbyVehicle(this.player.x, this.player.y, 100);
        if (nearbyVehicle && !this.player.playerData.inVehicle) {
            this._spawnPrompt(nearbyVehicle.x, nearbyVehicle.y - 50, 'E');
        }

        // Loot
        const nearbyLoot = this._getNearbyLoot(80);
        if (nearbyLoot) {
            this._spawnPrompt(nearbyLoot.x, nearbyLoot.y - 35, 'E');
        }
    }

    _spawnPrompt(x, y, keyChar) {
        const tex = `key_${keyChar}`;
        if (!this.textures.exists(tex)) return;
        const icon = this.add.image(x, y, tex).setDepth(100).setScale(0.7);
        this.tweens.add({
            targets: icon, scale: 0.8, y: '-=4',
            duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        this.activePrompts.push(icon);
    }

    _getNearbyLoot(range) {
        if (!this.lootItems) return null;
        let nearest = null;
        let minDist = range;
        for (const loot of this.lootItems) {
            if (!loot.active) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, loot.sprite.x, loot.sprite.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = loot.sprite; // Return the sprite for position
            }
        }
        return nearest;
    }

    // ═══════════════════════════════════════════════════════
    // PLAYER — Pixel art sprite
    // ═══════════════════════════════════════════════════════

    _createPlayer(x, y) {
        // Ground shadow — larger, softer, under feet (scene-level, follows player)
        this.playerShadow = this.add.image(x, y + 18, 'shadow_circle')
            .setDepth(19).setAlpha(0.55).setScale(1.2, 0.5);

        // Modular player: legs, body, arms, gun — procedural animation via updateAnimation()
        this.player = createModularPlayer(this, x, y, this.playerName);

        // Name tag — positioned above head (scene-level)
        this.player.nameLabel = this.add.text(x, y - 30, this.playerName, {
            fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#4ade80', stroke: '#000000', strokeThickness: 3,
            letterSpacing: 1,
        }).setOrigin(0.5).setDepth(26);

        this._dustTimer = 0;
        return this.player;
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

            if (moveX !== 0 || moveY !== 0) {
                const mag = Math.sqrt(moveX * moveX + moveY * moveY);
                vx = (moveX / mag) * speed;
                vy = (moveY / mag) * speed;
            }
        } else {
            // Absolute movement (Normal Mode)
            if (c.left.isDown || c.leftArrow.isDown) vx = -speed;
            if (c.right.isDown || c.rightArrow.isDown) vx = speed;
            if (c.up.isDown || c.upArrow.isDown) vy = -speed;
            if (c.down.isDown || c.downArrow.isDown) vy = speed;

            if (vx !== 0 && vy !== 0) {
                vx *= 0.7071; vy *= 0.7071;
            }
        }

        p.body.setVelocity(vx, vy);

        // Face mouse direction (container rotation; limbs are in local space)
        const pointer = this.input.activePointer;
        const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(p.x, p.y, wp.x, wp.y);
        p.setRotation(angle + Math.PI / 2);

        const isMoving = Math.abs(vx) > 5 || Math.abs(vy) > 5;
        const weaponDef = this.weaponSystem.getActiveWeapon();

        // Single call: legs, body breathing, arms, gun, recoil, weapon sway
        if (typeof p.updateAnimation === 'function') {
            p.updateAnimation({
                vx, vy,
                isMoving,
                isSprinting,
                isAiming: !!weaponDef,
                weaponDef: weaponDef || null,
                delta: this.time.delta,
            });
        }

        // Update shadow — stays directly under feet, stretches when moving
        if (this.playerShadow) {
            this.playerShadow.setPosition(p.x, p.y + 18);
            this.playerShadow.setScale(isMoving ? 1.3 : 1.2, isMoving ? 0.45 : 0.5);
            this.playerShadow.setDepth(p.y / 10 - 0.1);
        }

        // Dynamic depth sorting
        p.setDepth(p.y / 10);

        // Name label follows above head
        if (p.nameLabel) {
            p.nameLabel.setPosition(p.x, p.y - 30);
            p.nameLabel.setDepth(p.y / 10 + 0.1);
        }

        // Footstep dust particles when moving
        if (isMoving) {
            this._dustTimer = (this._dustTimer || 0) + 1;
            if (this._dustTimer % (isSprinting ? 6 : 10) === 0) {
                this._spawnDust(p.x + (Math.random() - 0.5) * 8, p.y + 16);
            }
        }
    }

    _spawnDust(x, y) {
        const dust = this.add.circle(x, y, 2 + Math.random() * 2, 0x8b7355, 0.3)
            .setDepth(18);
        this.tweens.add({
            targets: dust,
            alpha: 0,
            scaleX: 2, scaleY: 2,
            y: y - 4,
            duration: 400 + Math.random() * 200,
            onComplete: () => dust.destroy(),
        });
    }

    // ═══════════════════════════════════════════════════════
    // AI AGENTS — Pixel art sprites
    // ═══════════════════════════════════════════════════════

    _spawnAIAgents() {
        const rng = this.worldGen.rng.fork(555);
        const count = Math.min(SPAWN_CONFIG.maxAIAgents, 10);
        this.goapBrains = []; // GOAP brains for each agent

        for (let i = 0; i < count; i++) {
            const x = rng.nextFloat(1000, WORLD_SIZE - 1000);
            const y = rng.nextFloat(1000, WORLD_SIZE - 1000);
            const agent = this._createAIAgent(x, y, i);
            this.aiAgents.push(agent);

            // Create GOAP brain for this agent
            const brain = new OpenWorldGOAPAgent(agent, this, this.player);
            this.goapBrains.push(brain);
        }
    }

    _createAIAgent(x, y, index) {
        // Ground shadow — under feet
        const shadow = this.add.image(x, y + 18, 'shadow_circle')
            .setDepth(19).setAlpha(0.5).setScale(1.1, 0.45);

        // Enemy sprite — dark armored bandit
        const agent = this.add.image(x, y, 'enemy')
            .setDepth(22)
            .setScale(1.8);

        this.physics.add.existing(agent, false);
        agent.body.setSize(16, 18);
        agent.body.setOffset(4, 6);
        agent.body.setCollideWorldBounds(true);
        agent.body.setDrag(600, 600);

        agent.aiData = {
            id: `agent_${index}`,
            health: 80,
            speed: 60 + Math.random() * 40,
            detectionRange: 200 + Math.random() * 100,
        };

        agent.shadowGraphic = shadow;

        agent.nameLabel = this.add.text(x, y - 28, `HOSTILE_${String(index + 1).padStart(2, '0')}`, {
            fontSize: '7px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ef4444', stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(23);

        // State label (shows GOAP action)
        agent.stateLabel = this.add.text(x, y - 36, '', {
            fontSize: '5px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#f59e0b', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(23);

        // Idle breathing — scale-based (Y tweens block physics movement!)
        this.tweens.add({
            targets: agent,
            scaleY: 1.85,
            scaleX: 1.76,
            duration: 1000 + Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        return agent;
    }

    _updateAIAgents(time, delta) {
        for (let i = 0; i < this.aiAgents.length; i++) {
            const agent = this.aiAgents[i];
            if (!agent.active) continue;

            const hasLOS = this._checkLineOfSight(this.player, agent);
            agent.setVisible(hasLOS);
            if (agent.shadowGraphic) agent.shadowGraphic.setVisible(hasLOS);
            if (agent.nameLabel) agent.nameLabel.setVisible(hasLOS);
            if (agent.stateLabel) agent.stateLabel.setVisible(hasLOS);

            const brain = this.goapBrains[i];
            if (brain) {
                // Update GOAP brain
                brain.update(time, delta);

                // Update state label to show current GOAP action
                if (agent.stateLabel) {
                    agent.stateLabel.setText(brain.stateLabel);
                    agent.stateLabel.setPosition(agent.x, agent.y - 30);
                    // Color based on state
                    if (brain.stateLabel === 'ATTACKING') {
                        agent.stateLabel.setColor('#ef4444');
                    } else if (brain.stateLabel === 'CHASING' || brain.stateLabel === 'CHASEPLAYER') {
                        agent.stateLabel.setColor('#f59e0b');
                    } else if (brain.stateLabel === 'FLEE' || brain.stateLabel === 'TAKECOVER') {
                        agent.stateLabel.setColor('#3b82f6');
                    } else {
                        agent.stateLabel.setColor('#64748b');
                    }
                }
            }

            // Face movement direction
            if (agent.body.velocity.x !== 0 || agent.body.velocity.y !== 0) {
                const moveAngle = Math.atan2(agent.body.velocity.y, agent.body.velocity.x);
                agent.setRotation(moveAngle + Math.PI / 2);
            }

            // Dynamic depth
            const depthY = agent.y / 10;
            agent.setDepth(depthY);

            if (agent.nameLabel) {
                agent.nameLabel.setPosition(agent.x, agent.y - 28);
                agent.nameLabel.setDepth(depthY + 0.1);
            }
            if (agent.stateLabel) {
                agent.stateLabel.setDepth(depthY + 0.2);
            }
            if (agent.shadowGraphic) {
                agent.shadowGraphic.setPosition(agent.x, agent.y + 18);
                agent.shadowGraphic.setDepth(depthY - 0.1);
            }
        }

        // Check AI bullet hits on player
        this._checkAIBulletHitsOnPlayer();
    }

    _checkAIBulletHitsOnPlayer() {
        const activeBullets = this.bulletPool.getActive();
        for (const bullet of activeBullets) {
            if (!bullet.active) continue;
            if (bullet.bulletData.owner === 'player') continue; // Skip player's bullets

            // If player is in vehicle, check if bullet hits the vehicle instead
            if (this.player.playerData.inVehicle) {
                const vehicle = this.vehicleSystem.activeVehicle;
                if (vehicle) {
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, vehicle.x, vehicle.y);
                    const hitRadius = Math.max(vehicle.vehicleData.def.width, vehicle.vehicleData.def.height) * 0.8;

                    if (dist < hitRadius) {
                        // Hit vehicle instead of player
                        vehicle.vehicleData.health -= bullet.bulletData.damage;
                        this.bulletPool.recycle(bullet);

                        vehicle.setTint(0xffaa44);
                        this.time.delayedCall(100, () => vehicle.active && vehicle.clearTint());

                        const vDmgText = this.add.text(vehicle.x, vehicle.y - 20, `-${bullet.bulletData.damage}`, {
                            fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold', color: '#f59e0b', stroke: '#000', strokeThickness: 2,
                        }).setOrigin(0.5).setDepth(30);
                        this.tweens.add({ targets: vDmgText, y: vDmgText.y - 25, alpha: 0, duration: 600, onComplete: () => vDmgText.destroy() });

                        if (vehicle.vehicleData.health <= 0) this._destroyVehicle(vehicle);
                        continue;
                    }
                }
            }

            const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
            if (dist < 16) {
                // Player hit!
                const dmg = bullet.bulletData.damage;
                this.player.playerData.health -= dmg;
                this.bulletPool.recycle(bullet);

                // Damage flash
                this.player.setTint(0xff4444);
                this.time.delayedCall(100, () => {
                    if (this.player.active) this.player.clearTint();
                });

                // Damage popup
                const dmgText = this.add.text(this.player.x, this.player.y - 20, `-${dmg}`, {
                    fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
                    color: '#ff4444', stroke: '#000', strokeThickness: 2,
                }).setOrigin(0.5).setDepth(30);
                this.tweens.add({
                    targets: dmgText,
                    y: dmgText.y - 20, alpha: 0, duration: 600,
                    onComplete: () => dmgText.destroy(),
                });

                // Player death check
                if (this.player.playerData.health <= 0) {
                    this._playerDeath();
                }
                break;
            }
        }
    }

    _playerDeath() {
        this.player.setActive(false).setVisible(false);
        if (this.player.body) this.player.body.enable = false;

        // Death screen
        const cam = this.cameras.main;
        const deathOverlay = this.add.rectangle(
            cam.width / 2, cam.height / 2,
            cam.width, cam.height,
            0x000000, 0
        ).setScrollFactor(0).setDepth(2000);

        this.tweens.add({
            targets: deathOverlay, alpha: 0.7, duration: 1000,
        });

        const deathText = this.add.text(cam.width / 2, cam.height * 0.4, 'YOU DIED', {
            fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ef4444', stroke: '#000', strokeThickness: 6, letterSpacing: 8,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001).setAlpha(0);

        const killsText = this.add.text(cam.width / 2, cam.height * 0.55, `KILLS: ${this.killCount}`, {
            fontSize: '18px', fontFamily: 'monospace',
            color: '#94a3b8', stroke: '#000', strokeThickness: 3, letterSpacing: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001).setAlpha(0);

        const respawnText = this.add.text(cam.width / 2, cam.height * 0.7, 'PRESS R TO RESPAWN', {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#475569', letterSpacing: 2,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001).setAlpha(0);

        this.tweens.add({ targets: deathText, alpha: 1, duration: 800, delay: 500 });
        this.tweens.add({ targets: killsText, alpha: 1, duration: 600, delay: 1000 });
        this.tweens.add({ targets: respawnText, alpha: 1, duration: 600, delay: 1500 });

        // Respawn listener
        this.input.keyboard.once('keydown-R', () => {
            this.scene.restart({ seed: this.worldSeed, playerName: this.playerName });
        });
    }

    // ═══════════════════════════════════════════════════════
    // MINIMAP — Now handled by HUD scene
    // Old minimap replaced by circular HUD minimap
    // ═══════════════════════════════════════════════════════

    _createMinimap() {
        // Minimap is now rendered in OpenWorldHUD
        // This stub remains for compatibility
    }

    _updateMinimap() {
        // Handled by HUD scene
    }

    // ═══════════════════════════════════════════════════════
    // VEHICLES
    // ═══════════════════════════════════════════════════════

    _spawnVehicles() {
        const rng = this.worldGen.rng.fork(777);
        const spawn = SPAWN_CONFIG.playerSpawn;

        // Near spawn — guaranteed vehicles
        this.vehicleSystem.spawnVehicle(spawn.x + 100, spawn.y - 60, VEHICLE.CAR, 0);
        this.vehicleSystem.spawnVehicle(spawn.x - 120, spawn.y + 80, VEHICLE.TRUCK, Math.PI / 4);

        // Scatter vehicles across map
        for (let i = 0; i < 15; i++) {
            const x = rng.nextFloat(1000, WORLD_SIZE - 1000);
            const y = rng.nextFloat(1000, WORLD_SIZE - 1000);
            const vType = rng.pick(ALL_VEHICLES);
            const rot = rng.nextFloat(0, Math.PI * 2);
            this.vehicleSystem.spawnVehicle(x, y, vType, rot);
        }
    }

    _handleVehicleInteraction(interactPressed) {
        // Enter vehicle
        if (interactPressed) {
            const nearVehicle = this.vehicleSystem.getNearbyVehicle(this.player.x, this.player.y);
            if (nearVehicle) {
                const entered = this.vehicleSystem.tryEnterVehicle(this.player.x, this.player.y, this.player);
                if (entered) {
                    this.player.playerData.inVehicle = true;
                    // Hide player shadow
                    if (this.playerShadow) this.playerShadow.setVisible(false);
                    if (this.player.nameLabel) this.player.nameLabel.setVisible(false);
                }
            }
        }

        // Show prompt when near a vehicle
        const nearDef = this.vehicleSystem.getNearbyVehicle(this.player.x, this.player.y);
        if (nearDef && !this.vehiclePrompt) {
            this.vehiclePrompt = this.add.text(0, 0, `[E] ENTER ${nearDef.name}`, {
                fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#3b82f6', stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(30);
        }
        if (this.vehiclePrompt) {
            if (nearDef) {
                this.vehiclePrompt.setPosition(this.player.x, this.player.y + 30);
                this.vehiclePrompt.setText(`[E] ENTER ${nearDef.name}`);
                this.vehiclePrompt.setVisible(true);
            } else {
                this.vehiclePrompt.setVisible(false);
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    // SHOOTING & WEAPONS
    // ═══════════════════════════════════════════════════════

    _handleShooting(time) {
        if (this.isInSafeZone) return;
        if (!this._isShooting) return;
        const weapon = this.weaponSystem.getActiveWeapon();
        if (!weapon) return;

        // For semi-auto, only fire once per click
        if (!weapon.auto && this._firedThisClick) return;

        const pointer = this.input.activePointer;
        const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, wp.x, wp.y);

        const fired = this.weaponSystem.tryFire(this.player.x, this.player.y, angle, time);
        if (fired && !weapon.auto) this._firedThisClick = true;

        // Add visual recoil kickback to the player's weapon container
        if (fired) {
            this.player.animState.recoilOffset = Math.random() * 4 + 4; // Kicks weapon back
            // Screen shake
            this.cameras.main.shake(100, 0.002);
        }
    }

    _handleWeaponKeys() {
        const c = this.cursors;
        if (Phaser.Input.Keyboard.JustDown(c.weapon1)) this.weaponSystem.switchSlot(0);
        if (Phaser.Input.Keyboard.JustDown(c.weapon2)) this.weaponSystem.switchSlot(1);
        if (Phaser.Input.Keyboard.JustDown(c.weapon3)) this.weaponSystem.switchSlot(2);
        if (Phaser.Input.Keyboard.JustDown(c.tab)) this.weaponSystem.cycleWeapon();
        if (Phaser.Input.Keyboard.JustDown(c.reload)) this.weaponSystem.reload();

        // Reset semi-auto fire on release
        if (!this._isShooting) this._firedThisClick = false;
    }

    // ═══════════════════════════════════════════════════════
    // LOOT SPAWNING
    // ═══════════════════════════════════════════════════════

    _spawnLoot() {
        const rng = this.worldGen.rng.fork(999);

        // Spawn weapons near the player start and scattered across map
        const weaponSpots = [
            // Near spawn — guaranteed starter weapons (Common)
            { x: SPAWN_CONFIG.playerSpawn.x + 60, y: SPAWN_CONFIG.playerSpawn.y + 30, weapon: WEAPON.PISTOL, rarity: 'common' },
            { x: SPAWN_CONFIG.playerSpawn.x - 50, y: SPAWN_CONFIG.playerSpawn.y + 50, weapon: WEAPON.SMG, rarity: 'common' },
            // Near spawn — ammo
            { x: SPAWN_CONFIG.playerSpawn.x + 40, y: SPAWN_CONFIG.playerSpawn.y - 40, ammo: AMMO_TYPE.PISTOL, amount: 24, rarity: 'common' },
        ];

        // Scatter more weapons across the map (Biome-aware rarity)
        for (let i = 0; i < 40; i++) {
            const x = rng.nextFloat(500, WORLD_SIZE - 500);
            const y = rng.nextFloat(500, WORLD_SIZE - 500);
            const biome = this.worldGen.getBiome(Math.floor(x / TILE_SIZE), Math.floor(y / TILE_SIZE));

            let rarity = 'common';
            const chance = rng.next();
            if (biome === 'ruins') {
                rarity = chance > 0.8 ? 'legendary' : (chance > 0.5 ? 'epic' : 'rare');
            } else if (biome === 'urban') {
                rarity = chance > 0.9 ? 'legendary' : (chance > 0.7 ? 'epic' : (chance > 0.4 ? 'rare' : 'common'));
            } else {
                rarity = chance > 0.95 ? 'epic' : (chance > 0.8 ? 'rare' : 'common');
            }

            const weapon = rng.pick(ALL_WEAPONS);
            weaponSpots.push({ x, y, weapon, rarity });
        }

        // Scatter ammo boxes
        for (let i = 0; i < 40; i++) {
            const x = rng.nextFloat(500, WORLD_SIZE - 500);
            const y = rng.nextFloat(500, WORLD_SIZE - 500);
            const ammoTypes = Object.values(AMMO_TYPE);
            const rarity = rng.next() > 0.7 ? 'rare' : 'common';
            weaponSpots.push({ x, y, ammo: rng.pick(ammoTypes), amount: rng.nextInt(15, 45), rarity });
        }

        for (const spot of weaponSpots) {
            this._createLootItem(spot);
        }
    }

    _createLootItem(config) {
        const isAmmo = !!config.ammo;
        const rarity = config.rarity || 'common';
        const texKey = isAmmo ? 'loot_ammo' : `loot_${config.weapon.id}`;

        if (!this.textures.exists(texKey)) return;

        // Rarity Colors
        const rarityProps = {
            common: { color: 0x94a3b8, name: 'COMMON', text: '#cbd5e1' },
            rare: { color: 0x3b82f6, name: 'RARE', text: '#60a5fa' },
            epic: { color: 0xa855f7, name: 'EPIC', text: '#c084fc' },
            legendary: { color: 0xeab308, name: 'LEGENDARY', text: '#facc15' },
        };
        const prop = rarityProps[rarity];

        // Ground glow ring
        const glow = this.add.circle(config.x, config.y + 4, 16,
            prop.color, 0.25
        ).setDepth(11);

        // Pulsing glow
        this.tweens.add({
            targets: glow,
            scaleX: 1.6, scaleY: 1.6,
            alpha: 0.1,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        const sprite = this.add.image(config.x, config.y, texKey)
            .setDepth(12)
            .setScale(2.5);

        // Labels
        const tierLabel = this.add.text(config.x, config.y - 24,
            prop.name, {
            fontSize: '6px', fontFamily: 'monospace', fontStyle: 'bold',
            color: prop.text, stroke: '#000', strokeThickness: 2,
        }
        ).setOrigin(0.5).setDepth(12);

        const nameLabel = this.add.text(config.x, config.y - 15,
            isAmmo ? 'AMMO' : config.weapon.name,
            {
                fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#fff', stroke: '#000', strokeThickness: 3,
            }
        ).setOrigin(0.5).setDepth(12);

        const lootData = {
            sprite, nameLabel, tierLabel, glow,
            isAmmo, rarity,
            weapon: config.weapon || null,
            ammoType: config.ammo || null,
            ammoAmount: config.amount || 0,
            active: true,
        };

        this.lootItems.push(lootData);
    }

    _handleLootPickup(interactPressed) {
        const pickupRange = 50;
        let nearestLoot = null;
        let nearestDist = Infinity;

        // Find nearest loot for prompt
        for (const loot of this.lootItems) {
            if (!loot.active) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, loot.sprite.x, loot.sprite.y);
            if (dist < pickupRange && dist < nearestDist) {
                nearestDist = dist;
                nearestLoot = loot;
            }
        }

        // Pickup logic now uses world-space pulsing prompts
        if (this._pickupPrompt) {
            this._pickupPrompt.destroy();
            this._pickupPrompt = null;
        }

        // Actual pickup on E press
        if (!interactPressed) return;
        if (!nearestLoot) return;

        const loot = nearestLoot;

        // Inventory Slot Check for non-ammo
        if (!loot.isAmmo && this.inventory.length >= this.inventorySlots) {
            this._showMessage("INVENTORY FULL");
            return;
        }

        if (loot.isAmmo) {
            this.weaponSystem.pickupAmmo(loot.ammoType, loot.ammoAmount);
        } else {
            const dropped = this.weaponSystem.pickupWeapon(loot.weapon);
            if (dropped) {
                this._createLootItem({ x: this.player.x, y: this.player.y + 20, weapon: dropped });
            }
            // Add other items to inventory (keys, etc)
            if (loot.type !== ITEM_TYPE.WEAPON) {
                this.inventory.push(loot.type);
            }
        }

        this._updateTotalWeight();

        // Remove loot
        loot.active = false;
        loot.sprite.destroy();
        loot.nameLabel?.destroy();
        loot.tierLabel?.destroy();
        if (loot.glow) loot.glow.destroy();

        // Pickup feedback — floating text
        const feedback = this.add.text(this.player.x, this.player.y - 30,
            loot.isAmmo ? `+${loot.ammoAmount} AMMO` : `PICKED UP ${loot.weapon.name}`,
            { fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#4ade80', stroke: '#000', strokeThickness: 3 }
        ).setOrigin(0.5).setDepth(30);
        this.tweens.add({
            targets: feedback,
            y: feedback.y - 40, alpha: 0, duration: 1200,
            onComplete: () => feedback.destroy(),
        });

        // Hide prompt
        if (this._pickupPrompt) this._pickupPrompt.setVisible(false);
    }

    // ═══════════════════════════════════════════════════════
    // BULLET HIT DETECTION
    // ═══════════════════════════════════════════════════════

    _checkBulletHits() {
        const activeBullets = this.bulletPool.getActive();

        for (const bullet of activeBullets) {
            if (!bullet.active) continue;

            // Check hits on AI agents
            for (const agent of this.aiAgents) {
                if (!agent.active) continue;
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, agent.x, agent.y);
                if (dist < 16) {
                    agent.aiData.health -= bullet.bulletData.damage;
                    this.bulletPool.recycle(bullet);
                    agent.setTint(0xff0000);
                    this.time.delayedCall(100, () => agent.active && agent.clearTint());

                    const dmgText = this.add.text(agent.x, agent.y - 16, `-${bullet.bulletData.damage}`, {
                        fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ff4444', stroke: '#000', strokeThickness: 2,
                    }).setOrigin(0.5).setDepth(30);
                    this.tweens.add({ targets: dmgText, y: dmgText.y - 20, alpha: 0, duration: 600, onComplete: () => dmgText.destroy() });

                    if (agent.aiData.health <= 0) this._killAgent(agent);
                    break;
                }
            }

            // Check hits on Vehicles (NEW)
            for (const vehicle of this.vehicleSystem.vehicles) {
                if (!vehicle.active) continue;

                // Don't hit the vehicle the player is currently driving
                if (bullet.bulletData.owner === 'player' && vehicle === this.vehicleSystem.activeVehicle) continue;

                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, vehicle.x, vehicle.y);
                const hitRadius = vehicle.vehicleData.def.width > vehicle.vehicleData.def.height
                    ? vehicle.vehicleData.def.width * 0.8
                    : vehicle.vehicleData.def.height * 0.8;

                if (dist < hitRadius) {
                    vehicle.vehicleData.health -= bullet.bulletData.damage;
                    this.bulletPool.recycle(bullet);

                    // Flash vehicle red
                    vehicle.setTint(0xffaa44);
                    this.time.delayedCall(100, () => vehicle.active && vehicle.clearTint());

                    // Damage popup on vehicle
                    const vDmgText = this.add.text(vehicle.x, vehicle.y - 20, `-${bullet.bulletData.damage}`, {
                        fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#f59e0b', stroke: '#000', strokeThickness: 2,
                    }).setOrigin(0.5).setDepth(30);
                    this.tweens.add({ targets: vDmgText, y: vDmgText.y - 25, alpha: 0, duration: 600, onComplete: () => vDmgText.destroy() });

                    // Vehicle destruction
                    if (vehicle.vehicleData.health <= 0) {
                        this._destroyVehicle(vehicle);
                    }
                    break;
                }
            }

            // Bullets hit obstacles/walls
            for (const [, chunk] of this.chunkManager.activeChunks) {
                for (const obj of chunk.objects) {
                    if (!obj._isObstacle && !obj._isWall) continue;
                    if (!obj.body) continue;
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, obj.x, obj.y);
                    if (dist < 12) {
                        this.bulletPool.recycle(bullet);
                        if (obj.texture && obj.texture.key === OBSTACLE.BARREL_EXPLOSIVE) {
                            this._detonateBarrel(obj);
                        }
                        break;
                    }
                }
            }
        }
    }

    _destroyVehicle(vehicle) {
        if (!vehicle.active) return;

        const ex = vehicle.x;
        const ey = vehicle.y;

        // Big explosion effect
        for (let i = 0; i < 8; i++) {
            const circle = this.add.circle(
                ex + (Math.random() - 0.5) * 40,
                ey + (Math.random() - 0.5) * 40,
                10 + Math.random() * 20,
                0xff6600, 0.8
            ).setDepth(40);

            this.tweens.add({
                targets: circle,
                scaleX: 2.5, scaleY: 2.5,
                alpha: 0,
                duration: 600 + Math.random() * 400,
                ease: 'Cubic.easeOut',
                onComplete: () => circle.destroy()
            });
        }

        // Camera shake
        this.cameras.main.shake(300, 0.01);

        // Scorch mark on ground
        const mark = this.add.image(ex, ey, 'shadow_circle')
            .setDepth(10).setAlpha(0.6).setScale(2, 1).setTint(0x000000);

        // If player is in this vehicle, they take massive damage
        if (this.vehicleSystem.activeVehicle === vehicle) {
            this.player.playerData.health -= 60;
            this.vehicleSystem.exitVehicle(this.player);
            // Push player away from center
            const angle = Math.random() * Math.PI * 2;
            this.player.body.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        }

        // Cleanup vehicle elements
        if (vehicle.nameLabel) vehicle.nameLabel.destroy();
        if (vehicle.fuelBarBg) vehicle.fuelBarBg.destroy();
        if (vehicle.fuelBarFill) vehicle.fuelBarFill.destroy();
        if (vehicle.shadowRef) vehicle.shadowRef.destroy();

        // Push to kill feed
        const hudScene = this.scene.get('OpenWorldHUD');
        if (hudScene?.addKillFeedEntry) {
            hudScene.addKillFeedEntry('YOU', `VEHICLE (${vehicle.vehicleData.def.name})`);
        }

        // Remove from list
        const idx = this.vehicleSystem.vehicles.indexOf(vehicle);
        if (idx !== -1) {
            this.vehicleSystem.vehicles.splice(idx, 1);
        }

        vehicle.destroy();
    }

    _killAgent(agent) {
        this.killCount++;

        // Death effect
        const deathX = agent.x;
        const deathY = agent.y;

        // Kill feed popup
        const killText = this.add.text(deathX, deathY - 20, 'ELIMINATED', {
            fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ef4444', stroke: '#000', strokeThickness: 3, letterSpacing: 2,
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({
            targets: killText,
            y: killText.y - 30, alpha: 0, duration: 1500,
            onComplete: () => killText.destroy(),
        });

        // Drop loot
        const rng = this.worldGen.rng.fork(agent.aiData.id.charCodeAt(6) * 100);
        const dropWeapon = rng.pick(ALL_WEAPONS);
        this._createLootItem({ x: deathX + rng.nextFloat(-15, 15), y: deathY + 10, weapon: dropWeapon });

        // Remove agent
        agent.setActive(false).setVisible(false);
        if (agent.body) agent.body.enable = false;
        if (agent.nameLabel) agent.nameLabel.destroy();
        if (agent.shadowGraphic) agent.shadowGraphic.destroy();
        if (agent.stateLabel) agent.stateLabel.destroy();

        // Push to HUD kill feed
        const hudScene = this.scene.get('OpenWorldHUD');
        if (hudScene?.addKillFeedEntry) {
            hudScene.addKillFeedEntry('YOU', agent.aiData.id.replace('agent_', 'HOSTILE_'));
        }

        // Clean up GOAP brain
        const idx = this.aiAgents.indexOf(agent);
        if (idx !== -1 && this.goapBrains[idx]) {
            this.goapBrains[idx].destroy();
        }
    }

    // ═══════════════════════════════════════════════════════
    // BANNER
    // ═══════════════════════════════════════════════════════

    _handlePropInteraction(interactPressed) {
        if (!interactPressed) return;
        const range = 50;

        for (const [, chunk] of this.chunkManager.activeChunks) {
            for (const prop of chunk.objects) {
                if (!prop.active || !prop.texture) continue;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, prop.x, prop.y);
                if (dist < range) {
                    const key = prop.texture.key;
                    if (key === OBSTACLE.CHEST_LOCKED) {
                        const hasKey = this.inventory.includes(ITEM_TYPE.KEY);
                        if (!hasKey) {
                            this._showMessage("KEY REQUIRED");
                            return;
                        }
                        // Consume key and open
                        this.inventory.splice(this.inventory.indexOf(ITEM_TYPE.KEY), 1);
                        this._updateTotalWeight();
                        // Proceed to open
                    }

                    if (key === OBSTACLE.TREASURE_CHEST || key === OBSTACLE.CHEST_LOCKED) {
                        // Open Chest logic
                        const loot = this.worldGen.rng.pick(ALL_WEAPONS);
                        this._createLootItem({ x: prop.x, y: prop.y + 10, weapon: loot, rarity: 'epic' });
                        prop.destroy();
                        this._showMessage("CHEST OPENED");
                        return;
                    } else if (key === OBSTACLE.MIMIC) {
                        // Mimic trap: spawns enemies or deals immediate damage
                        this.cameras.main.shake(100, 0.01);
                        this.player.playerData.health -= 25;
                        this._showMessage("IT'S A MIMIC!");
                        prop.destroy();
                        return;
                    } else if (key === OBSTACLE.WELL) {
                        this.player.playerData.health = Math.min(100, this.player.playerData.health + 20);
                        this.player.playerData.stamina = 100;
                        this._showMessage("REFRESHED BY WELL");
                        return;
                    }
                }
            }
        }
    }

    _detonateBarrel(barrel) {
        if (!barrel.active) return;
        const bx = barrel.x; const by = barrel.y;

        // Visual Explosion
        const circle = this.add.circle(bx, by, 80, 0xff0000, 0.5).setDepth(40);
        this.tweens.add({ targets: circle, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 400, onComplete: () => circle.destroy() });
        this.cameras.main.shake(150, 0.02);

        // Damage calculation
        const damageRadius = 100;
        // Hit Player?
        const playerDist = Phaser.Math.Distance.Between(bx, by, this.player.x, this.player.y);
        if (playerDist < damageRadius) this.player.playerData.health -= 40;

        // Hit AI?
        this.aiAgents.forEach(agent => {
            if (!agent.active) return;
            const dist = Phaser.Math.Distance.Between(bx, by, agent.x, agent.y);
            if (dist < damageRadius) {
                agent.aiData.health -= 80;
                if (agent.aiData.health <= 0) this._killAgent(agent);
            }
        });

        barrel.destroy();
    }

    _showBanner(title, subtitle) {
        const cam = this.cameras.main;
        const cx = cam.width / 2;
        const cy = cam.height * 0.35;

        const t = this.add.text(cx, cy, title, {
            fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#f59e0b', stroke: '#000000', strokeThickness: 5,
            letterSpacing: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setAlpha(0);

        const s = this.add.text(cx, cy + 40, subtitle, {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#94a3b8', stroke: '#000000', strokeThickness: 3,
            letterSpacing: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setAlpha(0);

        this.tweens.add({
            targets: [t, s],
            alpha: 1, duration: 600, ease: 'Sine.easeOut',
            hold: 2000, yoyo: true,
            onComplete: () => { t.destroy(); s.destroy(); }
        });
    }

    // ═══════════════════════════════════════════════════════
    // MULTIPLAYER
    // ═══════════════════════════════════════════════════════

    _setupMultiplayer() {
        const net = getNetwork();

        // Handle other players' state updates
        net.on('player_state', (msg) => {
            if (msg.playerId === net.playerId) return; // skip self
            this.remotePlayerManager.updateRemotePlayer(
                msg.playerId,
                msg.playerName || 'UNKNOWN',
                msg
            );
        });

        // Handle game events from other players
        net.on('game_event', (msg) => {
            if (msg.playerId === net.playerId) return;

            switch (msg.ev) {
                case 'shoot':
                    // Visual: show bullet tracer from remote player position
                    if (this.bulletPool && msg.d) {
                        this.bulletPool.fire(
                            msg.d.x, msg.d.y, msg.d.angle,
                            { damage: 0, bulletSpeed: 500, bulletRange: 300, spread: 0, bulletsPerShot: 1 },
                            msg.playerId
                        );
                    }
                    break;

                case 'kill':
                    // Kill feed: show who killed who
                    const feedText = this.add.text(
                        this.cameras.main.width / 2,
                        60,
                        `${msg.d?.killer || 'PLAYER'} eliminated ${msg.d?.victim || 'HOSTILE'}`,
                        {
                            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
                            color: '#f59e0b', stroke: '#000', strokeThickness: 3
                        }
                    ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
                    this.tweens.add({
                        targets: feedText,
                        alpha: 0, duration: 3000, delay: 2000,
                        onComplete: () => feedText.destroy(),
                    });
                    break;
            }
        });

        // Handle player leaving
        net.on('player_left', (msg) => {
            this.remotePlayerManager.removeRemotePlayer(msg.playerId);
        });

        // Stale player cleanup every 10 seconds
        this.time.addEvent({
            delay: 10000,
            callback: () => this.remotePlayerManager.cleanupStale(),
            loop: true,
        });

        console.log('[MP] Multiplayer mode initialized');
    }

    _updateTimeCycle(delta) {
        this.gameTime += delta;
        const total = 300000; // 5 min cycle
        const progress = (this.gameTime % total) / total;
        const isNight = progress > 0.6; // 2 mins night
        const targetAlpha = isNight ? 0.45 : 0;
        this.timeOverlay.setFillStyle(0x1a1a2e, Phaser.Math.Linear(this.timeOverlay.fillAlpha, targetAlpha, 0.005));
    }

    _updateNoiseLevel(delta) {
        let n = 0;
        if (this.player.active && !this.player.playerData.inVehicle) {
            const vel = Math.abs(this.player.body.velocity.x) + Math.abs(this.player.body.velocity.y);
            if (vel > 200) n = 0.8; // Sprint
            else if (vel > 50) n = 0.4; // Walk
            else if (vel > 10) n = 0.1; // Slow
        }
        if (this._isShooting) n = 1.0;
        this.noiseLevel = Phaser.Math.Linear(this.noiseLevel, n, 0.1);
    }

    _handleTraps() {
        const p = this.player;
        const time = this.time.now / 1000;
        for (const [, chunk] of this.chunkManager.activeChunks) {
            for (const obj of chunk.objects) {
                if (!obj.active || !obj.texture) continue;
                const key = obj.texture.key;

                // Dynamic Oscillation for Moving Blades
                if (key === OBSTACLE.MOVING_BLADE) {
                    obj.x += Math.sin(time * 2 + (obj.y * 0.1)) * 4;
                    const d = Phaser.Math.Distance.Between(p.x, p.y, obj.x, obj.y);
                    if (d < 35) p.playerData.health -= 0.8; // Dangerous!
                }

                // Interaction Detection
                const d = Phaser.Math.Distance.Between(p.x, p.y, obj.x, obj.y);
                if (d < 24) {
                    if (key === OBSTACLE.SPIKE_TRAP) {
                        p.playerData.health -= 0.2; // Slow bleed
                        obj.setTint(0xff8888);
                    } else if (key === OBSTACLE.PRESSURE_PLATE) {
                        obj.setScale(0.8);
                    }
                } else if (key === OBSTACLE.PRESSURE_PLATE) {
                    obj.setScale(1.0);
                }
                if (key === OBSTACLE.SPIKE_TRAP && d >= 24) {
                    obj.clearTint();
                }
            }
        }
    }

    _checkLineOfSight(source, target) {
        const dist = Phaser.Math.Distance.Between(source.x, source.y, target.x, target.y);
        if (dist > 600) return false;

        const ray = new Phaser.Geom.Line(source.x, source.y, target.x, target.y);
        const obstacles = this.chunkManager.getObstacleGroup().getChildren();
        const buildings = this.chunkManager.getBuildingGroup().getChildren();

        for (const obj of [...obstacles, ...buildings]) {
            if (!obj.active) continue;
            if (Phaser.Geom.Intersects.LineToRectangle(ray, obj.getBounds())) {
                if (obj._isObstacle || obj._isWall) return false;
            }
        }
        return true;
    }

    _checkSafeZone() {
        const tx = Math.floor(this.player.x / TILE_SIZE);
        const ty = Math.floor(this.player.y / TILE_SIZE);
        const biome = this.worldGen.getBiome(tx, ty);
        const isSafe = BIOME_PROPS[biome]?.isSafe;

        if (isSafe && !this.isInSafeZone) {
            this._showMessage("SAFE ZONE - WEAPONS HOLSTERED");
        }
        this.isInSafeZone = isSafe;
    }

    _updateTotalWeight() {
        let w = 0;
        // Weapon weights
        this.weaponSystem.slots.forEach(s => {
            if (s && s.weight) w += s.weight;
        });
        // Ammo weights (total count * 0.1)
        Object.values(this.weaponSystem.reserveAmmo).forEach(v => {
            w += v * (ITEM_WEIGHT[ITEM_TYPE.AMMO] || 0.1);
        });
        // Inventory weights
        this.inventory.forEach(type => {
            w += (ITEM_WEIGHT[type] || 0.5);
        });

        this.totalWeight = w;
    }

    shutdown() {
        this.chunkManager?.destroy();
        this.bulletPool?.destroy();
        this.weaponSystem?.destroy();
        this.vehicleSystem?.destroy();
        this.remotePlayerManager?.destroy();
        if (this.isMultiplayer) {
            const net = getNetwork();
            net.disconnect();
        }
        this.scene.stop('OpenWorldHUD');
    }
}
