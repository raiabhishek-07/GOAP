import { GamePlayer } from "../entities/GamePlayer";
import { MindOrb } from "../entities/MindOrb";
import { WorldGenerator } from "../../../lib/game/WorldGenerator";
import { MIND_ARENA_LEVELS, WORLD_W, WORLD_H } from "../../../lib/game/LevelConfig";
import { UIFactory } from "../../../lib/game/UIFactory";
import { MatchManager, MATCH_PHASE, END_REASON } from "../../../lib/game/MatchManager";
import { SaveSystem } from "../../../lib/game/SaveSystem";
import { TaskWorldRenderer } from "../../../lib/game/TaskWorldRenderer";
import { createAgentsForStage } from "../../../lib/game/AgentFactory";
import { TASK_TYPE, TASK_STATE } from "../../../lib/game/TaskSystem";
import {
    ZoneCaptureRenderer,
    DefenseHoldRenderer,
    IntelGatherRenderer,
    FogOfWar,
} from "../../../lib/game/TaskMechanics";
import { SoundManager } from "../../../lib/game/SoundManager";
import { TutorialSystem } from "../../../lib/game/TutorialSystem";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

/**
 * GameScene — The main gameplay scene.
 * Phase 1+2: Full task-based gameplay with specialized mechanics.
 */
export class GameScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.levelNum = data?.level ?? 1;
        this.stageNum = data?.stage ?? 1;
        this.levelConfig = MIND_ARENA_LEVELS[this.levelNum]?.stages?.[this.stageNum]
            || MIND_ARENA_LEVELS[1].stages[1];
        this.enemies = [];
        this.orbs = [];
        this.killCount = 0;
        this.isPaused = false;
        this.gameTime = 0;

        // Weapon config
        this.playerGuns = [];
        this.activeGunIndex = 0;
        this.universalAmmo = 60; // Start with 2 reserve clips of SMG roughly

        // Task interaction state
        this.nearestTask = null;     // Currently nearest interactable task
        this.isChanneling = false;   // Whether player is channeling a task
        this.channelingTaskId = null; // ID of the task being channeled

        // Plan phase state
        this.planPhaseActive = false;
        this.inputFrozen = false;

        // MatchManager — orchestrates the match lifecycle
        this.matchManager = new MatchManager();
        this.matchManager.init(this.levelNum, this.stageNum);

        // Tutorial
        this.tutorial = new TutorialSystem(this);
    }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);

        // ─── AMBIENT MUSIC ─────────────────────────────
        SoundManager.startAmbientMusic();
        SoundManager.matchStart();

        // ─── 1. WORLD BOUNDS ───
        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

        // ─── 2. BACKGROUND ───
        this.createBackground();

        // ─── 2b. DAY/NIGHT CYCLE OVERLAY ───
        this.createDayNightCycle();

        // ─── 3. ENVIRONMENT ───
        WorldGenerator.generate(this, WORLD_W, WORLD_H, this.levelConfig);

        // ─── 4. STATIONS ───
        this.createStations();

        // ─── 5. ORB COLLECTIBLES (fewer now — orbs = bonus, tasks = main) ───
        this.spawnOrbs(4);

        // ─── SPAWN GUNS & AMMO ───
        this.spawnGuns(12);
        this.spawnAmmoBoxes(15);
        this.spawnHealthKits();

        // ─── 6. PLAYER ───
        const spawn = this.levelConfig.playerSpawn || this.levelConfig.locations.playerSpawn;
        this.player = new GamePlayer(this, spawn.x, spawn.y, "YOU");
        this.player.setDepth(50);

        // ─── 7. TASK OBJECTS IN WORLD ───
        this.taskRenderer = new TaskWorldRenderer(this, this.matchManager.taskSystem);
        this.taskRenderer.createAll();

        // ─── 7b. SPECIALIZED TASK MECHANICS ───
        this.initTaskMechanics();

        // ─── 7c. FOG OF WAR (Level 3 stages only) ───
        if (this.levelConfig.fogOfWar) {
            this.fogOfWar = new FogOfWar(this, WORLD_W, WORLD_H);
        }

        // ─── 8. EXTRACTION POINT ───
        this.createExtractionPoint();

        // ─── 9. ENEMIES (from AgentFactory) ───
        this.spawnAgents();

        // ─── 10. CAMERA FOLLOW ───
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setZoom(1.0);

        // ─── 11. COLLISIONS ───
        this.setupCollisions();

        // ─── 12. HUD (parallel scene) ───
        this.scene.launch('GameHUD', {
            player: this.player,
            scene: this,
            levelConfig: this.levelConfig,
            level: this.levelNum,
            stage: this.stageNum,
        });
        this.hudScene = this.scene.get('GameHUD');

        // ─── 13. INPUT ───
        this.setupInput();

        // ─── 13. TUTORIAL ───
        this.tutorial.init();

        // ─── 14. EVENTS ───
        this.events.on('PLAYER_DIED', () => {
            SoundManager.playerDeath();
            this.matchManager.endMatch('eliminated', {
                health: 0,
                stamina: this.player.stamina || 0,
                position: { x: this.player.x, y: this.player.y },
            });

            const matchStats = this._buildMatchStats(1); // 1 death
            SaveSystem.recordMatch(
                this.levelNum, this.stageNum, false,
                this.matchManager.results, matchStats
            );

            this.scene.stop('GameHUD');
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                SoundManager.stopAmbientMusic();
                SoundManager.gameOver();
                this.scene.start('GameOverScene', {
                    level: this.levelNum,
                    stage: this.stageNum,
                    endReason: this.matchManager.endReason,
                    results: this.matchManager.results,
                });
            });
        });

        // ─── 15. MATCH MANAGER EVENTS ───
        this.matchManager.onMatchEnd.push((reason, results) => {
            const matchStats = this._buildMatchStats(0);

            if (reason === 'victory') {
                this.scene.stop('GameHUD');
                this.cameras.main.fadeOut(1000, 255, 255, 255);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    SoundManager.stopAmbientMusic();
                    SoundManager.victory();
                    this.scene.start('VictoryScene', {
                        level: this.levelNum,
                        stage: this.stageNum,
                        endReason: reason,
                        results: results,
                        matchStats: matchStats,
                    });
                });
            } else if (reason === 'time_up' || reason === 'outplanned') {
                SaveSystem.recordMatch(
                    this.levelNum, this.stageNum, false, results, matchStats
                );

                this.scene.stop('GameHUD');
                this.cameras.main.fadeOut(800, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    SoundManager.stopAmbientMusic();
                    SoundManager.gameOver();
                    this.scene.start('GameOverScene', {
                        level: this.levelNum,
                        stage: this.stageNum,
                        endReason: reason,
                        results: results,
                    });
                });
            }
        });

        this.matchManager.onTimerWarning.push((seconds) => {
            if (this.hudScene?.showTimerWarning) {
                this.hudScene.showTimerWarning(seconds);
            }
        });

        this.matchManager.onTaskComplete.push((task, who) => {
            // Play completion effect on map
            if (this.taskRenderer) {
                this.taskRenderer.playCompletionEffect(task.id);
                this.taskRenderer.updateAll();
            }

            if (who === 'player') {
                if (this.hudScene?.showTaskComplete) {
                    this.hudScene.showTaskComplete(task.name);
                }
                if (this.hudScene?.addLog) {
                    this.hudScene.addLog(`TASK CAPTURED: ${task.name}`, '#22c55e');
                }
                SoundManager.taskComplete();
                UIFactory.createPopup(this, this.player.x, this.player.y - 50,
                    `✓ ${task.name} +${task.basePoints}`, '#22c55e', '14px');
                this.isChanneling = false;
                this.channelingTaskId = null;

                // Check if all tasks done — activate extraction
                this._checkExtractionReady();
            } else {
                // AI completed a task — warn player
                if (this.hudScene?.addLog) {
                    this.hudScene.addLog(`AI CAPTURED: ${task.name}`, '#ef4444');
                }
                UIFactory.createPopup(this, task.position.x, task.position.y - 40,
                    `✗ AI STOLE: ${task.name}`, '#ef4444', '12px');
                this.showBanner('⚠ TASK STOLEN', `${task.name} CAPTURED BY AI`);
            }
        });

        // ─── 16. PLAN PHASE ───
        this.startPlanPhase();
    }

    // ═══════════════════════════════════════════════════════
    // PLAN PHASE — 5s camera overview before battle
    // ═══════════════════════════════════════════════════════

    startPlanPhase() {
        this.planPhaseActive = true;
        this.inputFrozen = true;
        this.matchManager.startPlanPhase();
        this.tutorial.showHint('plan_phase');

        // Zoom out to show the map — calculate zoom to fit world without black borders
        const { width: vw, height: vh } = this.cameras.main;
        const fitZoom = Math.max(vw / WORLD_W, vh / WORLD_H, 0.55);
        this.cameras.main.stopFollow();
        this.cameras.main.pan(WORLD_W / 2, WORLD_H / 2, 500, 'Sine.easeOut');
        this.cameras.main.zoomTo(fitZoom, 500, 'Sine.easeOut');

        // Plan phase overlay text
        this.planOverlay = this.add.container(WORLD_W / 2, WORLD_H / 2).setDepth(500);

        const planBg = this.add.graphics();
        planBg.fillStyle(0x000000, 0.5);
        planBg.fillRect(-WORLD_W, -WORLD_H, WORLD_W * 2, WORLD_H * 2);

        // Stage label at top
        const stageLabel = this.add.text(0, -100, `STAGE ${this.levelNum}.${this.stageNum}`, {
            fontSize: '16px',
            fontFamily: '"Courier New", monospace',
            color: '#22c55e',
            fontStyle: 'bold',
            letterSpacing: 6,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        const stageName = this.add.text(0, -78, this.levelConfig.name.toUpperCase(), {
            fontSize: '11px',
            fontFamily: '"Courier New", monospace',
            color: '#94a3b8',
            letterSpacing: 3,
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);

        this.planTitle = this.add.text(0, -40, 'PLAN YOUR APPROACH', {
            fontSize: '32px',
            fontFamily: '"Courier New", monospace',
            color: '#f59e0b',
            fontStyle: 'bold',
            letterSpacing: 4,
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.planTimer = this.add.text(0, 20, '5', {
            fontSize: '64px',
            fontFamily: '"Courier New", monospace',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5);

        this.planSubtext = this.add.text(0, 70, 'Study the map • Identify targets • Form a strategy', {
            fontSize: '14px',
            fontFamily: '"Courier New", monospace',
            color: '#94a3b8',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5);

        this.planOverlay.add([planBg, stageLabel, stageName, this.planTitle, this.planTimer, this.planSubtext]);
    }

    endPlanPhase() {
        if (!this.planPhaseActive) return;
        this.planPhaseActive = false;
        this.inputFrozen = false;

        // Destroy overlay
        if (this.planOverlay) {
            this.tweens.add({
                targets: this.planOverlay,
                alpha: 0,
                duration: 400,
                onComplete: () => { this.planOverlay?.destroy(); this.planOverlay = null; }
            });
        }

        // Zoom back to player
        this.cameras.main.pan(this.player.x, this.player.y, 600, 'Sine.easeOut');
        this.cameras.main.zoomTo(1.0, 600, 'Sine.easeOut');
        this.time.delayedCall(700, () => {
            this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        });

        this.showBanner('⚔ BATTLE PHASE', `STAGE ${this.levelNum}.${this.stageNum} — COMPLETE ALL OBJECTIVES`);
    }

    // ═══════════════════════════════════════════════════════
    // BACKGROUND
    // ═══════════════════════════════════════════════════════

    createBackground() {
        const bg = this.add.graphics();

        // Sky gradient (top portion of world)
        bg.fillGradientStyle(0x87a5c0, 0x87a5c0, 0xb8c8d8, 0xb8c8d8, 1);
        bg.fillRect(0, 0, WORLD_W, WORLD_H * 0.3);

        // Mountain silhouettes
        bg.fillStyle(0x6a8a6a, 0.5);
        for (let mx = 0; mx < WORLD_W; mx += 300 + Math.random() * 200) {
            const mH = 120 + Math.random() * 180;
            bg.fillTriangle(mx - 150, WORLD_H * 0.3, mx, WORLD_H * 0.3 - mH, mx + 150, WORLD_H * 0.3);
        }

        // Ground: olive/brown terrain
        bg.fillGradientStyle(0x4a6a3a, 0x4a6a3a, 0x3a5a2a, 0x3a5a2a, 1);
        bg.fillRect(0, WORLD_H * 0.3, WORLD_W, WORLD_H * 0.7);

        // Terrain texture variation
        const terrain = this.add.graphics();
        terrain.setDepth(-8);
        for (let i = 0; i < 100; i++) {
            const tx = Math.random() * WORLD_W;
            const ty = WORLD_H * 0.32 + Math.random() * WORLD_H * 0.66;
            const shade = [0x3d5c3d, 0x4a6a3a, 0x556b2f, 0x3a5a2a][Math.floor(Math.random() * 4)];
            terrain.fillStyle(shade, 0.15 + Math.random() * 0.1);
            terrain.fillCircle(tx, ty, 30 + Math.random() * 50);
        }

        // Subtle grid
        const grid = this.add.grid(
            WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H,
            80, 80, 0xffffff, 0.02
        );
        grid.setDepth(-10);

        // Tree line (distant silhouettes)
        const trees = this.add.graphics();
        trees.fillStyle(0x2a4a2a, 0.4);
        trees.setDepth(-6);
        for (let tx = 0; tx < WORLD_W; tx += 40 + Math.random() * 30) {
            const tH = 30 + Math.random() * 50;
            const tBase = WORLD_H * 0.3;
            trees.fillTriangle(tx - 12, tBase, tx, tBase - tH, tx + 12, tBase);
        }
    }

    // ═══════════════════════════════════════════════════════
    // STATIONS (Food & Rest — for AI GOAP behaviors)
    // ═══════════════════════════════════════════════════════

    createStations() {
        const locs = this.levelConfig.locations;
        if (locs.foodShack) this.createStation(locs.foodShack, 'station_food', 'FOOD STATION', '🍖', 0xf59e0b);
        if (locs.restArea) this.createStation(locs.restArea, 'station_rest', 'REST CABIN', '🛏️', 0x8b5cf6);
    }

    createStation(pos, textureKey, label, icon, color) {
        const container = this.add.container(pos.x, pos.y);

        // Station glow
        const glow = this.add.graphics();
        glow.fillStyle(color, 0.12);
        glow.fillCircle(0, 0, 70);
        this.tweens.add({ targets: glow, alpha: 0.04, duration: 2000, yoyo: true, repeat: -1 });

        // Station body
        const body = this.add.image(0, 0, textureKey).setDisplaySize(64, 64);

        // Icon
        const iconText = this.add.text(0, -48, icon, { fontSize: '28px' }).setOrigin(0.5);

        // Label
        const labelText = this.add.text(0, 48, label, {
            fontSize: '11px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 10, y: 5 },
            letterSpacing: 1
        }).setOrigin(0.5);

        container.add([glow, body, iconText, labelText]);
        container.setDepth(5);
    }

    // ═══════════════════════════════════════════════════════
    // ORB COLLECTIBLES (bonus — still in game but not critical)
    // ═══════════════════════════════════════════════════════

    spawnGuns(count) {
        this.worldGuns = [];
        const gunTypes = [
            { level: 1, name: 'PISTOL', rarity: 'COMMON', mag: 12, damage: 15, color: 0x9ca3af },
            { level: 2, name: 'SMG', rarity: 'UNCOMMON', mag: 30, damage: 20, color: 0x22c55e },
            { level: 3, name: 'ASSAULT', rarity: 'RARE', mag: 25, damage: 35, color: 0x3b82f6 },
            { level: 4, name: 'SNIPER', rarity: 'EPIC', mag: 5, damage: 80, color: 0xa855f7 }
        ];

        for (let i = 0; i < count; i++) {
            let x, y, tries = 0;
            do {
                x = 100 + Math.random() * (WORLD_W - 200);
                y = 100 + Math.random() * (WORLD_H - 200);
                tries++;
            } while (tries < 50 && this.isNearSpawn(x, y));

            const type = Phaser.Math.RND.pick(gunTypes);
            this.spawnSingleGun(x, y, {
                id: Phaser.Math.RND.uuid(),
                name: `LVL${type.level} ${type.name}`,
                baseName: type.name,
                rarity: type.rarity,
                magSize: type.mag,
                ammo: type.mag,
                damage: type.damage,
                color: type.color
            });
        }
    }

    spawnSingleGun(x, y, data) {
        if (!this.worldGuns) this.worldGuns = [];

        const gunContainer = this.add.container(x, y);
        const shadow = this.add.ellipse(0, 5, 20, 10, 0x000000, 0.4);

        // Stylized gun shape (Pixel art style)
        const g = this.add.graphics();

        switch (data.baseName) {
            case 'PISTOL':
                g.fillStyle(0x334155, 1);
                g.fillRect(-6, -2, 12, 4); // Barrel
                g.fillStyle(0x1e293b, 1);
                g.fillRect(-4, 2, 4, 6); // Grip
                g.fillStyle(data.color || 0xef4444, 1);
                g.fillRect(3, -3, 3, 2); // Sight
                break;
            case 'SMG':
                g.fillStyle(0x334155, 1);
                g.fillRect(-8, -4, 16, 6); // Body/Barrel
                g.fillStyle(0x1e293b, 1);
                g.fillRect(-8, 2, 4, 8); // Grip
                g.fillRect(0, 2, 4, 10); // Mag
                g.fillStyle(data.color || 0xef4444, 1);
                g.fillRect(-8, -6, 16, 2); // Top sight rail
                break;
            case 'ASSAULT':
                g.fillStyle(0x334155, 1);
                g.fillRect(-12, -4, 24, 6); // Barrel
                g.fillStyle(0x1e293b, 1);
                g.fillRect(-4, 2, 5, 8); // Grip
                g.fillRect(2, 2, 5, 10); // Mag
                g.fillRect(-14, 0, 6, 6); // Stock
                g.fillStyle(data.color || 0xef4444, 1);
                g.fillRect(4, -6, 4, 3); // Sight/dot
                break;
            case 'SNIPER':
                g.fillStyle(0x334155, 1);
                g.fillRect(-12, -3, 34, 4); // Long Barrel
                g.fillStyle(0x1e293b, 1);
                g.fillRect(-4, 1, 4, 6); // Grip
                g.fillRect(-16, -1, 8, 5); // Stock
                g.fillStyle(0x111827, 1);
                g.fillRect(0, -7, 14, 4); // Scope
                g.fillStyle(data.color || 0xef4444, 1);
                g.fillRect(10, -5, 4, 2); // Scope lens
                break;
            default:
                g.fillStyle(0x334155, 1);
                g.fillRect(-10, -4, 20, 6); // Barrel
                g.fillStyle(0x1e293b, 1);
                g.fillRect(-10, 2, 6, 8); // Grip
                g.fillStyle(data.color || 0xef4444, 1);
                g.fillRect(1, -5, 4, 3); // Sight/dot
                break;
        }

        // Floating labels (rarity and name like user reference)
        const rarityText = this.add.text(0, -26, data.rarity, {
            fontSize: '8px', fontFamily: 'monospace', color: '#ffffff', backgroundColor: '#000000', padding: { x: 2, y: 1 }
        }).setOrigin(0.5);
        rarityText.setStroke('#000000', 3);

        const nameText = this.add.text(0, -16, data.baseName, {
            fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);
        nameText.setStroke('#000000', 3);

        const promptText = this.add.text(0, 16, '[E] EQUIP', {
            fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fbbf24', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 2, y: 1 }
        }).setOrigin(0.5).setAlpha(0);

        gunContainer.add([shadow, g, rarityText, nameText, promptText]);
        gunContainer.setDepth(20);

        // Hop animation
        this.tweens.add({
            targets: g,
            y: -5,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        this.worldGuns.push({
            container: gunContainer,
            promptText: promptText,
            active: true,
            x: x, y: y,
            ...data
        });
    }

    spawnAmmoBoxes(count) {
        this.worldAmmo = [];
        for (let i = 0; i < count; i++) {
            let x, y, tries = 0;
            do {
                x = 100 + Math.random() * (WORLD_W - 200);
                y = 100 + Math.random() * (WORLD_H - 200);
                tries++;
            } while (tries < 50 && this.isNearSpawn(x, y));

            const ammoContainer = this.add.container(x, y);
            const shadow = this.add.ellipse(0, 5, 16, 8, 0x000000, 0.4);

            // Box shape
            const g = this.add.graphics();
            g.fillStyle(0x64748b, 1); // Dark metal box
            g.fillRect(-8, -6, 16, 12);
            g.fillStyle(0x3b82f6, 1); // Blue stripe
            g.fillRect(-8, -2, 16, 4);

            const text = this.add.text(0, -14, 'AMMO', {
                fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold', color: '#64748b'
            }).setOrigin(0.5);

            ammoContainer.add([shadow, g, text]);
            ammoContainer.setDepth(19);

            this.worldAmmo.push({
                container: ammoContainer,
                active: true,
                x: x, y: y
            });
        }
    }

    spawnOrbs(count) {
        for (let i = 0; i < count; i++) {
            let x, y, tries = 0;
            do {
                x = 100 + Math.random() * (WORLD_W - 200);
                y = 100 + Math.random() * (WORLD_H - 200);
                tries++;
            } while (tries < 50 && this.isNearSpawn(x, y));

            const orb = new MindOrb(this, x, y);
            orb.setDepth(20);
            this.orbs.push(orb);
        }
    }

    isNearSpawn(x, y) {
        const locs = this.levelConfig.locations;
        const pts = [locs.playerSpawn, locs.agentSpawn, locs.foodShack, locs.restArea].filter(Boolean);
        return pts.some(p => Phaser.Math.Distance.Between(x, y, p.x, p.y) < 120);
    }

    // ═══════════════════════════════════════════════════════
    // HEALTH KITS
    // ═══════════════════════════════════════════════════════
    spawnHealthKits() {
        this.worldHealthKits = [];
        const locs = this.levelConfig?.locations?.healthKits;
        if (!locs) return;

        for (const loc of locs) {
            const hk = this.add.container(loc.x, loc.y);
            const bg = this.add.ellipse(0, 5, 20, 8, 0x000000, 0.4);
            const box = this.add.rectangle(0, 0, 16, 12, 0xffffff);
            const cross1 = this.add.rectangle(0, 0, 4, 8, 0xff0000);
            const cross2 = this.add.rectangle(0, 0, 8, 4, 0xff0000);
            const prompt = this.add.text(0, -20, '[E] PICKUP', { fontSize: '10px', color: '#fff' }).setOrigin(0.5).setAlpha(0);
            hk.add([bg, box, cross1, cross2, prompt]);
            hk.setDepth(15);
            this.worldHealthKits.push({
                active: true,
                x: loc.x,
                y: loc.y,
                container: hk,
                promptText: prompt
            });
        }
    }

    // ═══════════════════════════════════════════════════════
    // EXTRACTION POINT (replaces old portal)
    // ═══════════════════════════════════════════════════════

    createExtractionPoint() {
        const ext = this.levelConfig.extraction;
        if (!ext) return;

        this.extractionPoint = this.add.container(ext.x, ext.y);

        // Base circle
        const baseGfx = this.add.graphics();
        baseGfx.lineStyle(3, 0x00e676, 0.3);
        baseGfx.strokeCircle(0, 0, 50);
        baseGfx.lineStyle(1, 0x00e676, 0.15);
        baseGfx.strokeCircle(0, 0, 40);

        // Arrow icon
        const icon = this.add.text(0, -5, '✈️', { fontSize: '30px' }).setOrigin(0.5).setAlpha(0.3);

        // Label
        this.extractionLabel = this.add.text(0, 40, 'EXTRACTION [LOCKED]', {
            fontSize: '10px',
            fontFamily: '"Courier New", monospace',
            color: '#475569',
            fontStyle: 'bold',
            letterSpacing: 2,
        }).setOrigin(0.5);

        this.extractionPoint.add([baseGfx, icon, this.extractionLabel]);
        this.extractionPoint.setDepth(5);
        this.extractionActive = false;
        this.extractionIcon = icon;
        this.extractionBase = baseGfx;

        // Slow rotation
        this.tweens.add({
            targets: icon,
            angle: 360,
            duration: 10000,
            repeat: -1,
            ease: 'Linear',
        });
    }

    _checkExtractionReady() {
        if (this.extractionActive) return;

        const completionPct = this.matchManager.taskSystem.getCompletionPercent();
        if (completionPct >= 1.0) {
            this._activateExtraction();
        }
    }

    _activateExtraction() {
        if (this.extractionActive) return;
        this.extractionActive = true;
        this.tutorial.showHint('extraction');

        // Brighten visuals
        this.extractionIcon?.setAlpha(1);
        this.extractionLabel?.setText('EXTRACTION [ACTIVE]');
        this.extractionLabel?.setColor('#00e676');

        // Redraw base with glow
        if (this.extractionBase) {
            this.extractionBase.clear();
            this.extractionBase.lineStyle(3, 0x00e676, 0.9);
            this.extractionBase.strokeCircle(0, 0, 50);
            this.extractionBase.fillStyle(0x00e676, 0.08);
            this.extractionBase.fillCircle(0, 0, 50);
            this.extractionBase.lineStyle(1, 0x00e676, 0.5);
            this.extractionBase.strokeCircle(0, 0, 40);
        }

        // Pulse
        this.tweens.add({
            targets: this.extractionIcon,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 800,
            yoyo: true,
            repeat: -1,
        });

        this.showBanner('✈ EXTRACTION OPEN', 'ALL TASKS DONE — REACH THE EXIT!');
    }

    // ═══════════════════════════════════════════════════════
    // ENEMIES (from AgentFactory — type-specific spawning)
    // ═══════════════════════════════════════════════════════

    spawnAgents() {
        try {
            this.enemies = createAgentsForStage(
                this,
                this.levelConfig,
                this.matchManager,
                this.player.logic, // PlayerEntity for chase targeting
            );
        } catch (err) {
            console.error('AgentFactory error:', err);
            this.enemies = [];
        }
    }

    // ═══════════════════════════════════════════════════════
    // SPECIALIZED TASK MECHANICS (Phase 2)
    // ═══════════════════════════════════════════════════════

    initTaskMechanics() {
        this.zoneCapture = new ZoneCaptureRenderer(this);
        this.defenseHold = new DefenseHoldRenderer(this);
        this.intelGather = new IntelGatherRenderer(this);
        this.defenseEnemies = []; // Extra enemies from defense waves

        const tasks = this.matchManager.taskSystem.getAllTasks();

        for (const task of tasks) {
            switch (task.type) {
                case TASK_TYPE.ZONE_CAPTURE:
                    this.zoneCapture.createZone(task);
                    break;
                case TASK_TYPE.DEFENSE_HOLD:
                    this.defenseHold.createHold(task);
                    break;
                case TASK_TYPE.INTEL_GATHER:
                    this.intelGather.createIntel(task);
                    break;
            }
        }
    }

    updateTaskMechanics(dt, playerPos) {
        const tasks = this.matchManager.taskSystem.tasks;

        // ── ZONE CAPTURE ──
        // Auto-channel zone tasks when player stands inside
        if (this.zoneCapture) {
            this.zoneCapture.update(tasks, playerPos, this.enemies);

            const activeZone = this.zoneCapture.getActiveZone(playerPos, tasks);
            if (activeZone && !this.isChanneling) {
                // Auto-start zone capture when player enters
                if (activeZone.state === TASK_STATE.AVAILABLE || activeZone.state === TASK_STATE.IN_PROGRESS) {
                    this.isChanneling = true;
                    this.channelingTaskId = activeZone.id;
                }
            }
            // Stop zone channeling when player leaves
            if (this.channelingTaskId) {
                const chanTask = tasks.get(this.channelingTaskId);
                if (chanTask?.type === TASK_TYPE.ZONE_CAPTURE) {
                    const inZone = this.zoneCapture.getActiveZone(playerPos, tasks);
                    if (!inZone || inZone.id !== this.channelingTaskId) {
                        chanTask.interruptChannel();
                        this.isChanneling = false;
                        this.channelingTaskId = null;
                    }
                }
            }
        }

        // ── DEFENSE HOLD ──
        if (this.defenseHold) {
            this.defenseHold.update(tasks, playerPos);

            // Spawn waves when defense task is in progress
            for (const [taskId, hold] of this.defenseHold.holds) {
                const task = tasks.get(taskId);
                if (!task || task.state !== TASK_STATE.IN_PROGRESS) continue;

                const wave = this.defenseHold.activeWaves.get(taskId);
                const pct = task.getChannelPercent();

                // Spawn waves at 0%, 33%, 66%
                const waveThresholds = [0, 0.33, 0.66];
                const currentWaveIdx = wave ? wave.waveIndex : -1;

                for (let i = 0; i < waveThresholds.length; i++) {
                    if (pct >= waveThresholds[i] && currentWaveIdx < i) {
                        const newEnemies = this.defenseHold.spawnWave(taskId, i);
                        this.defenseEnemies.push(...newEnemies);
                        this.showBanner(`⚠ WAVE ${i + 1}`, 'HOSTILES INCOMING');
                        break;
                    }
                }
            }

            // Update defense enemies
            this.defenseEnemies = this.defenseEnemies.filter(e => {
                if (!e.active) return false;
                e.update(dt);
                // Check if near player → damage
                const dist = Phaser.Math.Distance.Between(e.x, e.y, playerPos.x, playerPos.y);
                if (dist < 25) {
                    this.player.takeDamage(5);
                    this.matchManager.recordDamage(5);
                }
                return true;
            });
        }

        // ── INTEL GATHER ──
        if (this.intelGather) {
            this.intelGather.update(tasks, playerPos);

            // Auto-collect nearby fragments
            const result = this.intelGather.collectNearFragments(playerPos);
            if (result.completedTaskId) {
                // Complete the intel task via MatchManager
                const intelResult = this.matchManager.playerInteract(result.completedTaskId, 0);
                if (intelResult?.reward > 0) {
                    // Task completion is handled by onTaskComplete callback
                }
            }
        }

        // ── FOG OF WAR ──
        if (this.fogOfWar) {
            this.fogOfWar.update(playerPos);
        }
    }

    // ═══════════════════════════════════════════════════════
    // COLLISIONS & INTERACTIONS
    // ═══════════════════════════════════════════════════════

    setupCollisions() {
        // Collectibles Loop
        this.time.addEvent({
            delay: 100,
            callback: () => {
                // Ammo collection
                if (this.worldAmmo) {
                    this.worldAmmo = this.worldAmmo.filter(ammo => {
                        if (!ammo.active) return false;
                        const dist = Phaser.Math.Distance.Between(ammo.x, ammo.y, this.player.x, this.player.y);
                        if (dist < 30) {
                            this.universalAmmo += 30;
                            UIFactory.createPopup(this, ammo.x, ammo.y - 20, '+30 AMMO', '#3b82f6');
                            SoundManager.taskComplete(); // Use a distinct UI sound 
                            ammo.container.destroy();
                            return false;
                        }
                        return true;
                    });
                }

                // Orb collection
                this.orbs = this.orbs.filter(orb => {
                    if (!orb.active) return false;
                    const dist = Phaser.Math.Distance.Between(orb.x, orb.y, this.player.x, this.player.y);
                    if (dist < 30) {
                        this.player.collectPower(20);
                        this.matchManager.recordPower(20);
                        UIFactory.createPopup(this, orb.x, orb.y - 20, '+20 POWER', '#00f2ff');
                        orb.destroy();
                        return false;
                    }
                    return true;
                });
            },
            loop: true
        });

        // Enemy damage to player (Melee + Ranged)
        this.time.addEvent({
            delay: 500,
            callback: () => {
                this.enemies.forEach(e => {
                    if (!e.active) return;
                    const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
                    const attackRange = e.attackRange || e.meta?.attackRange || 35;

                    if (dist <= attackRange && e.playerTarget) {
                        // Ranged trace
                        if (dist > 50) {
                            const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
                            const endX = e.x + Math.cos(angle) * dist;
                            const endY = e.y + Math.sin(angle) * dist;

                            const tracer = this.add.graphics();
                            tracer.lineStyle(2, 0xff0000, 0.8);
                            tracer.beginPath();
                            tracer.moveTo(e.x, e.y);
                            tracer.lineTo(endX, endY);
                            tracer.strokePath();
                            this.tweens.add({ targets: tracer, alpha: 0, duration: 150, onComplete: () => tracer.destroy() });
                            if (SoundManager.shoot) SoundManager.shoot();
                        }

                        this.player.takeDamage(10);
                        this.matchManager.recordDamage(10);

                        // Interrupt channeling if hit
                        if (this.isChanneling && this.channelingTaskId) {
                            if (this.channelingTaskId === 'heal') {
                                this.isChanneling = false;
                                this.channelingTaskId = null;
                                UIFactory.createPopup(this, this.player.x, this.player.y - 40, 'HEAL INTERRUPTED!', '#ef4444', '12px');
                            } else {
                                const task = this.matchManager.taskSystem.getTask(this.channelingTaskId);
                                if (task?.getMeta()?.interruptible) {
                                    task.interruptChannel();
                                    this.isChanneling = false;
                                    this.channelingTaskId = null;
                                    UIFactory.createPopup(this, this.player.x, this.player.y - 40, 'INTERRUPTED!', '#ef4444', '12px');
                                }
                            }
                        }
                    }
                });
            },
            loop: true
        });

        // Extraction check
        this.time.addEvent({
            delay: 200,
            callback: () => {
                if (!this.extractionActive || !this.extractionPoint) return;
                const dist = Phaser.Math.Distance.Between(
                    this.extractionPoint.x, this.extractionPoint.y,
                    this.player.x, this.player.y
                );
                if (dist < 50) {
                    this.levelComplete();
                }
            },
            loop: true
        });
    }

    // ═══════════════════════════════════════════════════════
    // TASK INTERACTION (E key — channeling system)
    // ═══════════════════════════════════════════════════════

    tryHeal() {
        if (this.player.health >= 100 || this.isChanneling) return;
        if (!this.player.healthKits || this.player.healthKits <= 0) {
            UIFactory.createPopup(this, this.player.x, this.player.y - 30, 'NO HEALTH KITS!', '#ef4444', '10px');
            return;
        }

        // Start healing channel
        SoundManager.heal();
        this.isChanneling = true;
        this.channelingTaskId = 'heal';
        this.healProgress = 0;
        if (this.hudScene?.addLog) {
            this.hudScene.addLog('HEAL CHANNELING [5s]', '#4ade80');
        }
    }

    tryInteractWithTask() {
        if (this.inputFrozen) return;
        const playerPos = { x: this.player.x, y: this.player.y };

        // 0. Try to Ride/Exit Car
        if (this.player.isDriving) {
            this.player.exitCar();
            return;
        } else if (this.worldCars) {
            for (const car of this.worldCars) {
                if (!car.isDriven && Phaser.Math.Distance.Between(car.x, car.y, playerPos.x, playerPos.y) < 60) {
                    this.player.enterCar(car);
                    return;
                }
            }
        }

        // 0.5. Pick up health kit
        if (this.worldHealthKits) {
            let hkIdx = null;
            let closestDist = 50;

            this.worldHealthKits.forEach((hk, idx) => {
                if (!hk.active) return;
                const dist = Phaser.Math.Distance.Between(hk.x, hk.y, playerPos.x, playerPos.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    hkIdx = idx;
                }
            });

            if (hkIdx !== null) {
                const hk = this.worldHealthKits[hkIdx];
                this.player.healthKits = (this.player.healthKits || 0) + 1;
                UIFactory.createPopup(this, hk.x, hk.y - 20, '+1 HEALTH KIT', '#4ade80');
                if (this.hudScene?.addLog) this.hudScene.addLog('HEALTH KIT SECURED', '#4ade80');
                hk.container.destroy();
                this.worldHealthKits.splice(hkIdx, 1);
                return;
            }
        }

        // 1. Try to pick up a gun first
        if (this.worldGuns) {
            let pickedGun = false;
            let gunIdx = null;

            // Find closest gun
            let closestDist = 50;
            this.worldGuns.forEach((gun, idx) => {
                if (!gun.active) return;
                const dist = Phaser.Math.Distance.Between(gun.x, gun.y, playerPos.x, playerPos.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    gunIdx = idx;
                }
            });

            if (gunIdx !== null) {
                const gun = this.worldGuns[gunIdx];
                if (this.playerGuns.length < 2) {
                    this.playerGuns.push({
                        id: gun.id,
                        name: gun.name,
                        baseName: gun.baseName,
                        rarity: gun.rarity,
                        ammo: gun.ammo,
                        magSize: gun.magSize,
                        damage: gun.damage,
                        color: gun.color
                    });
                    UIFactory.createPopup(this, gun.x, gun.y - 20, `+ ${gun.name}`, '#38bdf8');
                    if (this.hudScene?.addLog) {
                        this.hudScene.addLog(`${gun.name} SECURED`, '#38bdf8');
                    }
                    gun.container.destroy();
                    this.worldGuns.splice(gunIdx, 1);
                    return; // Successfully picked up gun, stop standard interaction
                } else {
                    if (!this.player.lastInvFullMsg || this.time.now - this.player.lastInvFullMsg > 2000) {
                        UIFactory.createPopup(this, this.player.x, this.player.y - 30, 'INVENTORY FULL (G to Drop)', '#ef4444');
                        this.player.lastInvFullMsg = this.time.now;
                    }
                    return; // Block task interaction if they were aiming for a gun
                }
            }
        }

        // 2. Standard task interaction
        const nearest = this.taskRenderer.findNearestInteractable(playerPos);

        if (!nearest) {
            // Show "nothing nearby" feedback
            UIFactory.createPopup(this, this.player.x, this.player.y - 30,
                'NO TASK IN RANGE', '#94a3b8', '10px');
            return;
        }

        const task = nearest.task;

        // Check if task requires a key we don't have
        if (task.requiredTasks && task.requiredTasks.length > 0) {
            const completedIds = this.matchManager.taskSystem.getCompletedTasks().map(t => t.id);
            const hasAllDeps = task.requiredTasks.every(id => completedIds.includes(id));
            if (!hasAllDeps) {
                UIFactory.createPopup(this, this.player.x, this.player.y - 30,
                    '🔒 REQUIRES: ' + task.requiredTasks.join(', '), '#ef4444', '10px');
                return;
            }
        }

        // Start or continue channeling
        this.isChanneling = true;
        this.channelingTaskId = task.id;
    }

    updateTaskInteraction(dt) {
        if (this.inputFrozen || !this.matchManager.isInBattle()) return;

        const playerPos = { x: this.player.x, y: this.player.y };

        // Find nearest task and show/hide prompts
        const nearest = this.taskRenderer.findNearestInteractable(playerPos);
        this.taskRenderer.hideAllPrompts();

        if (nearest && !this.isChanneling) {
            this.taskRenderer.showInteractPrompt(nearest.task.id);
            this.nearestTask = nearest.task;
        } else if (!nearest) {
            this.nearestTask = null;
        }

        // Handle Health Kit proximity prompts
        if (this.worldHealthKits) {
            this.worldHealthKits.forEach((hk) => {
                if (!hk.active || !hk.promptText) return;
                const dist = Phaser.Math.Distance.Between(hk.x, hk.y, playerPos.x, playerPos.y);
                if (dist < 45) {
                    hk.promptText.setAlpha(1);
                } else {
                    hk.promptText.setAlpha(0);
                }
            });
        }

        // Handle active channeling
        if (this.isChanneling && this.channelingTaskId) {
            if (this.channelingTaskId === 'heal') {
                this.healProgress += dt;
                if (this.healProgress >= 5.0) {
                    this.isChanneling = false;
                    this.channelingTaskId = null;
                    this.player.health = 100;
                    this.player.healthKits--;
                    UIFactory.createPopup(this, this.player.x, this.player.y - 30, 'HEALED FULLY', '#4ade80');
                    if (this.hudScene?.addLog) this.hudScene.addLog('HEALED COMPLETELY', '#4ade80');
                    if (SoundManager.taskComplete) SoundManager.taskComplete();
                }
                return;
            }

            const task = this.matchManager.taskSystem.getTask(this.channelingTaskId);

            if (!task) {
                this.isChanneling = false;
                this.channelingTaskId = null;
                return;
            }

            // Check if player moved away from task
            const distToTask = Phaser.Math.Distance.Between(
                playerPos.x, playerPos.y,
                task.position.x, task.position.y
            );

            if (distToTask > this.taskRenderer.interactionRadius + 10) {
                // Player moved too far — cancel channel
                task.interruptChannel();
                this.isChanneling = false;
                this.channelingTaskId = null;
                UIFactory.createPopup(this, this.player.x, this.player.y - 30,
                    'CANCELLED — OUT OF RANGE', '#f59e0b', '10px');
                return;
            }

            // Continue channeling via MatchManager
            const result = this.matchManager.playerInteract(this.channelingTaskId, dt);

            if (result?.reward > 0) {
                // Task completed! (handled by onTaskComplete callback)
                this.isChanneling = false;
                this.channelingTaskId = null;
            }
        }

        // Handle Weapons proximity prompts
        if (this.worldGuns) {
            this.worldGuns.forEach((gun) => {
                if (!gun.active || !gun.promptText) return;
                const dist = Phaser.Math.Distance.Between(gun.x, gun.y, playerPos.x, playerPos.y);
                if (dist < 45) {
                    gun.promptText.setAlpha(1);
                } else {
                    gun.promptText.setAlpha(0);
                }
            });
        }

        // Handle Car proximity prompts
        if (this.worldCars && !this.player.isDriving) {
            this.worldCars.forEach((car) => {
                if (car.isDriven || !car.promptText) {
                    car.promptText.setAlpha(0);
                    return;
                }
                const dist = Phaser.Math.Distance.Between(car.x, car.y, playerPos.x, playerPos.y);
                if (dist < 60) {
                    car.promptText.setAlpha(1);
                } else {
                    car.promptText.setAlpha(0);
                }
            });
        }

        // Update task visual states
        this.taskRenderer.updateAll();
    }

    // ═══════════════════════════════════════════════════════
    // PLAYER ATTACK
    // ═══════════════════════════════════════════════════════

    playerAttack() {
        const self = this;
        if (this.player.attackCooldown > 0 || this.inputFrozen || this.player.isDriving) return;
        this.player.attackCooldown = 0.4;

        // Cancel channeling on attack
        if (this.isChanneling) {
            this.isChanneling = false;
            this.channelingTaskId = null;
        }

        const activeWep = this.playerGuns[this.activeGunIndex];

        if (activeWep) {
            if (activeWep.ammo > 0) {
                // Gun Attack!
                activeWep.ammo -= 1;
                SoundManager.shoot();

                // Visual gunshot line
                const pointer = this.input.activePointer;
                let aimX = pointer.worldX;
                let aimY = pointer.worldY;

                // If pointer wasn't moved, fallback to player facing
                if (aimX === 0 && aimY === 0) {
                    aimX = this.player.x + (this.player.facingX || 1) * 100;
                    aimY = this.player.y;
                }

                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, aimX, aimY);
                const dist = 400;
                const endX = this.player.x + Math.cos(angle) * dist;
                const endY = this.player.y + Math.sin(angle) * dist;

                const bulletLine = this.add.graphics();
                bulletLine.lineStyle(2, 0xfef08a, 1);
                bulletLine.beginPath();
                bulletLine.moveTo(this.player.x, this.player.y);
                bulletLine.lineTo(endX, endY);
                bulletLine.strokePath();

                this.tweens.add({
                    targets: bulletLine,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => bulletLine.destroy()
                });

                this.cameras.main.shake(50, 0.003);

                // Hit detection with a line intersection
                const line = new Phaser.Geom.Line(this.player.x, this.player.y, endX, endY);
                const wDmg = activeWep.damage || 35;

                this.enemies.forEach((enemy, idx) => {
                    if (!enemy.active) return;
                    const eCircle = new Phaser.Geom.Circle(enemy.x, enemy.y, 25);
                    if (Phaser.Geom.Intersects.LineToCircle(line, eCircle)) {
                        enemy.takeDamage(wDmg);
                        UIFactory.createPopup(self, enemy.x, enemy.y - 30, `-${wDmg}`, '#ef4444');

                        // Knockback
                        enemy.x += Math.cos(angle) * 15;
                        enemy.y += Math.sin(angle) * 15;
                        if (enemy.position) {
                            enemy.position.x = enemy.x;
                            enemy.position.y = enemy.y;
                        }

                        if (enemy.health <= 0) self.killEnemy(enemy, idx);
                    }
                });

                // --- CAR HIT DETECTION ---
                if (this.worldCars) {
                    this.worldCars.forEach(car => {
                        if (!car.active || car.isExploded) return;

                        const carRect = new Phaser.Geom.Rectangle(car.x - car.w / 2, car.y - car.h / 2, car.w, car.h);
                        if (Phaser.Geom.Intersects.LineToRectangle(line, carRect)) {
                            car.health -= wDmg;
                            UIFactory.createPopup(self, car.x, car.y - 20, `-${wDmg}`, '#fde047');

                            // Visual hit effect on car (brief tint)
                            self.tweens.addCounter({
                                from: 0, to: 1, duration: 100,
                                onUpdate: (tween) => {
                                    if (car.container) car.container.setAlpha(0.6 + (1 - tween.getValue()) * 0.4);
                                }
                            });

                            if (car.health <= 0) {
                                self.explodeCar(car);
                            }
                        }
                    });
                }
            } else {
                // Out of ammo! Auto-reload instead of attacking
                this.reloadWeapon();
            }
        } else {
            // Melee Slash (EXISTING)
            const slash = this.add.image(
                this.player.x + (this.player.facingX || 1) * 20,
                this.player.y, 'slash_arc'
            ).setDisplaySize(50, 50).setAlpha(0.8).setDepth(100);

            this.tweens.add({
                targets: slash,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 200,
                onComplete: () => slash.destroy()
            });

            this.cameras.main.shake(80, 0.002);

            this.enemies.forEach((enemy, idx) => {
                if (!enemy.active) return;
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (dist < 60) {
                    // Damage the TacticalAgent
                    enemy.takeDamage(25);
                    UIFactory.createPopup(this, enemy.x, enemy.y - 30, '-25', '#ef4444');

                    // Knockback
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                    enemy.x += Math.cos(angle) * 30;
                    enemy.y += Math.sin(angle) * 30;
                    if (enemy.position) {
                        enemy.position.x = enemy.x;
                        enemy.position.y = enemy.y;
                    }

                    if (enemy.health <= 0) {
                        this.killEnemy(enemy, idx);
                    }
                }
            });
        }
    }

    explodeCar(car) {
        if (car.isExploded) return;
        car.isExploded = true;
        car.health = 0;

        // Visual Explosion: Burst of orange lines
        const explosionLines = 12;
        for (let i = 0; i < explosionLines; i++) {
            const angle = (i / explosionLines) * Math.PI * 2;
            const line = this.add.graphics();
            line.lineStyle(4, 0xf97316, 1);
            line.lineBetween(car.x, car.y, car.x + Math.cos(angle) * 80, car.y + Math.sin(angle) * 80);
            this.tweens.add({
                targets: line,
                alpha: 0,
                scale: 1.5,
                duration: 600,
                onComplete: () => line.destroy()
            });
        }

        // Flash effect
        const flash = this.add.circle(car.x, car.y, 60, 0xfef08a, 0.8);
        this.tweens.add({
            targets: flash,
            scale: 2.2,
            alpha: 0,
            duration: 400,
            onComplete: () => flash.destroy()
        });

        this.cameras.main.shake(400, 0.02);
        SoundManager.damageTaken();

        // Eject player if driving
        if (car.isDriven) {
            this.player.takeDamage(40); // Explosions hurt!
            this.player.exitCar();
            UIFactory.createPopup(this, this.player.x, this.player.y - 50, 'ENGINE EXPLODED!', '#f97316', '14px bold');
        }

        // Turning the car into a wreck
        if (car.container) {
            // Darken it completely
            car.container.list.forEach(child => {
                if (child.setTint) child.setTint(0x1c1917);
            });

            // Add some "smoke" particles
            this.time.addEvent({
                delay: 400,
                callback: () => {
                    if (!car.container || !car.container.scene) return;
                    const sx = car.x + (Math.random() - 0.5) * 30;
                    const sy = car.y + (Math.random() - 0.5) * 30;
                    const smoke = this.add.circle(sx, sy, 8, 0x44403c, 0.4);
                    this.tweens.add({
                        targets: smoke,
                        y: smoke.y - 50,
                        alpha: 0,
                        scale: 1.5,
                        duration: 2000,
                        onComplete: () => smoke.destroy()
                    });
                },
                repeat: 30
            });
        }

        // Damage nearby enemies
        this.enemies.forEach(e => {
            if (!e.active) return;
            const dist = Phaser.Math.Distance.Between(e.x, e.y, car.x, car.y);
            if (dist < 120) {
                e.takeDamage(150);
                UIFactory.createPopup(this, e.x, e.y - 20, 'CAR BLAST!', '#ef4444');
            }
        });

        // Cleanup interaction
        if (car.promptText) car.promptText.destroy();
    }

    reloadWeapon() {
        const wep = this.playerGuns[this.activeGunIndex];
        if (!wep || wep.ammo === wep.magSize || this.universalAmmo <= 0 || this.inputFrozen) return;

        const needed = wep.magSize - wep.ammo;
        const amount = Math.min(needed, this.universalAmmo);

        wep.ammo += amount;
        this.universalAmmo -= amount;
        SoundManager.reload();

        UIFactory.createPopup(this, this.player.x, this.player.y - 40, 'RELOADED', '#f8fafc');
        if (this.hudScene?.addLog) {
            this.hudScene.addLog(`${wep.baseName} RELOADED`, '#f8fafc');
        }

        // Cooldown
        this.player.attackCooldown = 0.8;
    }

    dropWeapon() {
        if (this.playerGuns.length === 0 || this.inputFrozen) return;

        const wep = this.playerGuns[this.activeGunIndex];

        // Create a gun entity at the player's position
        this.spawnSingleGun(this.player.x, this.player.y + 15, wep);

        // Remove from inventory
        this.playerGuns.splice(this.activeGunIndex, 1);
        this.activeGunIndex = 0; // Fallback to slot 1

        UIFactory.createPopup(this, this.player.x, this.player.y - 20, 'WEAPON DROPPED', '#94a3b8');
    }

    killEnemy(enemy, idx) {
        this.killCount++;
        this.matchManager.recordKill();
        this.player.collectPower(5);

        if (this.hudScene?.addLog) {
            this.hudScene.addLog(`HOSTILE ELIMINATED`, '#f59e0b');
        }
        SoundManager.enemyDeath();
        UIFactory.createPopup(this, enemy.x, enemy.y - 40, '+25 SCORE', '#f59e0b', '16px');

        const spawnPos = { x: enemy.spawnX || enemy.x, y: enemy.spawnY || enemy.y };
        const agentConfig = enemy.config;
        const isDummy = enemy.agentType === 'training_dummy';

        // Death particles
        for (let i = 0; i < 8; i++) {
            const p = this.add.circle(enemy.x, enemy.y, 3, 0xef4444).setDepth(100);
            const angle = (i / 8) * Math.PI * 2;
            this.tweens.add({
                targets: p,
                x: enemy.x + Math.cos(angle) * 60,
                y: enemy.y + Math.sin(angle) * 60,
                alpha: 0,
                duration: 400,
                onComplete: () => p.destroy()
            });
        }

        enemy.destroy();
        this.enemies.splice(idx, 1);

        // Respawn for Training Ground
        if (this.levelNum === 0) {
            this.time.delayedCall(5000, () => {
                const { TacticalAgent } = require('../../../lib/game/AgentFactory');
                const newEnemy = new TacticalAgent(this, spawnPos.x, spawnPos.y, agentConfig);
                newEnemy.setPlayerTarget(this.player);
                newEnemy.setMatchManager(this.matchManager);
                newEnemy.initGOAP(this.levelConfig.locations || {});
                newEnemy.setDepth(40);
                this.enemies.push(newEnemy);

                // Visual respawn effect
                const rFlash = this.add.circle(spawnPos.x, spawnPos.y, 10, 0xf97316, 0).setDepth(100);
                this.tweens.add({
                    targets: rFlash,
                    alpha: 0.8,
                    scale: 3,
                    duration: 300,
                    yoyo: true,
                    onComplete: () => rFlash.destroy()
                });
            });
        }

        // Brief time slow (hit feeling)
        this.time.timeScale = 0.3;
        this.time.delayedCall(80, () => { this.time.timeScale = 1; });
    }

    // ═══════════════════════════════════════════════════════
    // INPUT
    // ═══════════════════════════════════════════════════════

    setupInput() {
        // Attack (SPACE) - Optional fallback
        this.input.keyboard.on('keydown-SPACE', () => this.playerAttack());

        // Attack (Mouse Left Click)
        this.input.on('pointerdown', (pointer) => {
            // Check to ensure they didn't click HUD or map (rough boundary)
            if (pointer.button === 0) {
                this.playerAttack();
            }
        });

        // Interact (E key)
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.input.keyboard.on('keydown-E', () => this.tryInteractWithTask());

        // Heal (Q key)
        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.input.keyboard.on('keydown-Q', () => this.tryHeal());

        // Reload (R key)
        this.input.keyboard.on('keydown-R', () => this.reloadWeapon());

        // Drop Weapon (G key)
        this.input.keyboard.on('keydown-G', () => this.dropWeapon());

        // Pause (ESC)
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause();
            this.scene.launch('PauseScene', {
                returnScene: 'GameScene',
                level: this.levelNum,
                stage: this.stageNum,
            });
        });

        // Dash (SHIFT)
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Weapon swaps
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.playerGuns && this.playerGuns.length > 0) {
                this.activeGunIndex = 0;
            }
        });
        this.input.keyboard.on('keydown-TWO', () => {
            if (this.playerGuns && this.playerGuns.length > 1) {
                this.activeGunIndex = 1;
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // LEVEL COMPLETE
    // ═══════════════════════════════════════════════════════

    levelComplete() {
        this.matchManager.endMatch(END_REASON.VICTORY, {
            health: this.player.health,
            stamina: this.player.stamina || 100,
            position: { x: this.player.x, y: this.player.y },
        });
    }

    /**
     * Build match stats object for save system
     */
    _buildMatchStats(deaths = 0) {
        return {
            duration: this.gameTime || 0,
            kills: this.killCount || 0,
            deaths: deaths,
            tasksCompleted: this.matchManager?.taskSystem?.getPlayerCompletedCount?.() || 0,
        };
    }

    // ═══════════════════════════════════════════════════════
    // BANNER
    // ═══════════════════════════════════════════════════════

    showBanner(title, sub) {
        const { width, height } = this.scale;

        const container = this.add.container(width / 2, height / 2).setDepth(200);
        container.setScrollFactor(0);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a1a, 0.92);
        bg.fillRect(-width, -45, width * 2, 90);
        bg.lineStyle(2, 0xf59e0b, 0.7);
        bg.lineBetween(-width, -45, width, -45);
        bg.lineBetween(-width, 45, width, 45);

        const t = this.add.text(0, -10, title, {
            fontSize: '28px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 4,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        const s = this.add.text(0, 20, sub, {
            fontSize: '12px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#f59e0b',
            fontStyle: 'bold',
            letterSpacing: 3,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        container.add([bg, t, s]);
        container.setAlpha(0);

        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 500,
            yoyo: true,
            hold: 2500,
            onComplete: () => container.destroy()
        });
    }

    // ═══════════════════════════════════════════════════════
    // UPDATE LOOP
    // ═══════════════════════════════════════════════════════

    update(time, delta) {
        const dt = delta / 1000;
        this.gameTime += dt;
        this.updateDayNightCycle(dt);
        this.tutorial.update();

        // Update MatchManager (handles timers, phase transitions)
        this.matchManager.update(dt, {
            position: { x: this.player.x, y: this.player.y },
            health: this.player.health,
            stamina: this.player.stamina || 100,
        });

        // ── PLAN PHASE HANDLING ──
        if (this.planPhaseActive) {
            const remaining = this.matchManager.getPlanPhaseRemaining();
            if (this.planTimer && this.planTimer.active !== false) {
                this.planTimer.setText(Math.ceil(remaining).toString());
            }
            // Check if plan phase ended
            if (this.matchManager.isInBattle() && this.planPhaseActive) {
                this.endPlanPhase();
            }
            return; // Don't process gameplay during plan phase
        }

        // ── PLAYER ──
        if (!this.inputFrozen) {
            this.player.update(dt);
            if (this.player.attackCooldown > 0) this.player.attackCooldown -= dt;

            // Clamp player
            this.player.x = Phaser.Math.Clamp(this.player.x, 20, WORLD_W - 20);
            this.player.y = Phaser.Math.Clamp(this.player.y, 20, WORLD_H - 20);
            this.player.logic.position = { x: this.player.x, y: this.player.y };

            // Dash input
            if (this.shiftKey?.isDown && this.player.dashCooldown <= 0) {
                this.player.dash();
            }
        }

        // ── CURSOR UPDATER ──
        if (this.playerGuns && this.playerGuns.length > 0) {
            // Give a tactical crosshair if a gun is equipped
            this.input.setDefaultCursor('crosshair');
        } else {
            this.input.setDefaultCursor('default');
        }

        // ── TASK INTERACTION ──
        this.updateTaskInteraction(dt);

        // ── SPECIALIZED TASK MECHANICS (zones, defense, intel, fog) ──
        const playerPos = { x: this.player.x, y: this.player.y };
        this.updateTaskMechanics(dt, playerPos);

        // ── TASK RENDERER VISUAL UPDATES ──
        if (this.taskRenderer) {
            this.taskRenderer.updateAll();
        }

        // ── ENEMIES ──
        this.enemies.forEach(e => {
            if (e.active) {
                e.update(dt);
                // Clamp enemies to world
                if (e.position) {
                    e.position.x = Phaser.Math.Clamp(e.position.x, 20, WORLD_W - 20);
                    e.position.y = Phaser.Math.Clamp(e.position.y, 20, WORLD_H - 20);
                }
                e.x = Phaser.Math.Clamp(e.x, 20, WORLD_W - 20);
                e.y = Phaser.Math.Clamp(e.y, 20, WORLD_H - 20);
            }
        });

        // ── TRACK STATS ──
        this.matchManager.killCount = this.killCount;

        // ── UPDATE HUD ──
        if (this.hudScene?.updateHUD) {
            const hudData = this.matchManager.getHUDData();
            hudData.health = this.player.health;
            hudData.stamina = this.player.stamina || 100;
            hudData.power = this.player.power || 0;
            hudData.score = this.matchManager.scoringEngine?.totalScore || 0;
            hudData.playerPos = { x: this.player.x, y: this.player.y };
            hudData.agentPositions = this.enemies.filter(e => e.active).map(e => ({
                x: e.x, y: e.y,
                type: e.agentType || 'unknown',
                health: e.health || 0,
            }));

            // Calc Aim Angle for Compass
            let aimX = this.input.activePointer.worldX;
            let aimY = this.input.activePointer.worldY;
            if (aimX === 0 && aimY === 0) {
                aimX = this.player.x + (this.player.facingX || 1) * 100;
                aimY = this.player.y;
            }
            hudData.aimAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, aimX, aimY) * Phaser.Math.RAD_TO_DEG;

            // Task positions for minimap
            if (this.taskRenderer) {
                hudData.taskPositions = this.taskRenderer.getTaskPositions();
            }

            // Extraction point
            if (this.extractionPoint) {
                hudData.extractionPos = {
                    x: this.extractionPoint.x,
                    y: this.extractionPoint.y,
                    active: this.extractionActive,
                };
            }

            // Weapon sync (pass universal ammo to reserve for HUD)
            hudData.weapons = this.playerGuns.map(gun => ({
                ...gun,
                name: gun.name,
                reserve: this.universalAmmo
            }));
            hudData.activeWeaponIndex = this.activeGunIndex;

            // Channeling state
            hudData.isChanneling = this.isChanneling;
            hudData.channelingTaskId = this.channelingTaskId;
            if (this.channelingTaskId) {
                const task = this.matchManager.taskSystem.getTask(this.channelingTaskId);
                hudData.channelPercent = task?.getChannelPercent() || 0;
                hudData.channelingTaskName = task?.name || '';
            }

            if (this.hudScene?.updateHUD && this.hudScene.sys?.isActive) {
                this.hudScene.updateHUD(hudData);
            }
        }

        // Legacy registry (for any other consumers)
        this.registry.set('playerHealth', this.player.health);
        this.registry.set('playerPower', this.player.power);
        this.registry.set('playerStamina', this.player.stamina || 100);
        this.registry.set('killCount', this.killCount);
        this.registry.set('gameTime', this.gameTime);
    }

    // ═══════════════════════════════════════════════════════
    // DAY/NIGHT CYCLE
    // ═══════════════════════════════════════════════════════

    createDayNightCycle() {
        const { width, height } = this.scale;

        // Dark blue navy overlay for night
        this.dayNightOverlay = this.add.graphics().setDepth(150).setScrollFactor(0);
        this.dayNightOverlay.fillStyle(0x0f172a, 1);
        this.dayNightOverlay.fillRect(0, 0, width, height);
        this.dayNightOverlay.alpha = 0; // Start at day

        // Ambient Tinting for entities could be done here too, but simple overlay is robust
    }

    updateDayNightCycle(dt) {
        if (!this.dayNightOverlay) return;

        // In training, we might be using manual toggle
        if (this.manualTimeToggle && this.levelNum === 0) return;

        const cycleLength = 240; // 4 minutes total (120s day, 120s night-ish)
        const timeInCycle = this.gameTime % cycleLength;
        const halfCycle = cycleLength / 2;

        let targetAlpha = 0;

        // Peak Day: 0 - 80s
        if (timeInCycle < 80) {
            targetAlpha = 0;
        }
        // Sunset: 80s - 120s
        else if (timeInCycle < 120) {
            const progress = (timeInCycle - 80) / 40;
            targetAlpha = progress * 0.65; // Transition to deep night
        }
        // Peak Night: 120s - 200s
        else if (timeInCycle < 200) {
            targetAlpha = 0.65;
        }
        // Sunrise: 200s - 240s
        else {
            const progress = (timeInCycle - 200) / 40;
            targetAlpha = 0.65 * (1 - progress);
        }

        // Smoothly transition the actual alpha
        this.dayNightOverlay.setAlpha(Phaser.Math.Interpolation.Linear([this.dayNightOverlay.alpha, targetAlpha], 0.05));

        // If it's night, show a small hint in the log just once per transition
        if (Math.floor(timeInCycle) === 81 && this.hudScene?.addLog) {
            this.hudScene.addLog("SUNSET APPROACHING", "#f97316");
        }
        if (Math.floor(timeInCycle) === 121 && this.hudScene?.addLog) {
            this.hudScene.addLog("NIGHT FALLS", "#6366f1");
        }
        if (Math.floor(timeInCycle) === 201 && this.hudScene?.addLog) {
            this.hudScene.addLog("DAWN BREAKS", "#fde047");
        }
    }

    // ─── SIMULATION CONTROLS (Level 0) ──────────────────

    resetVehicles() {
        if (!this.worldCars) return;
        this.worldCars.forEach(car => {
            if (car.isDriven) this.player.exitCar();

            // Re-spawn or repair
            car.health = car.maxHealth;
            car.isExploded = false;
            car.container.setAlpha(1);
            car.container.x = car.spawnX || car.x;
            car.container.y = car.spawnY || car.y;
            car.container.angle = car.spawnAngle || car.angle;

            // Reset fire/smoke if any
            if (car.smokeEffect) car.smokeEffect.stop();
        });
        if (this.hudScene?.addLog) this.hudScene.addLog("VEHICLES RESET", "#38bdf8");
    }

    toggleSimulationTime() {
        this.manualTimeToggle = true;
        const current = this.dayNightOverlay.alpha;
        const target = current > 0.3 ? 0 : 0.65;

        this.tweens.add({
            targets: this.dayNightOverlay,
            alpha: target,
            duration: 2000,
            ease: 'Sine.easeInOut'
        });

        if (this.hudScene?.addLog) {
            this.hudScene.addLog(target > 0 ? "NIGHT MODE ACTIVE" : "DAY MODE ACTIVE", "#6366f1");
        }
    }

    resetAllAgents() {
        // Find missing agents
        const currentIds = new Set(this.enemies.map(e => e.id));
        const allConfigs = this.levelConfig.agents || [];

        allConfigs.forEach(config => {
            if (!currentIds.has(config.id)) {
                const { TacticalAgent } = require('../../../lib/game/AgentFactory');
                const enemy = new TacticalAgent(this, config.spawn.x, config.spawn.y, config);
                enemy.setPlayerTarget(this.player);
                enemy.setMatchManager(this.matchManager);
                enemy.initGOAP(this.levelConfig.locations || {});
                enemy.setDepth(40);
                this.enemies.push(enemy);
            }
        });

        // Repair/reset existing ones
        this.enemies.forEach(e => {
            e.health = e.maxHealth || 100;
        });

        if (this.hudScene?.addLog) this.hudScene.addLog("AGENTS RESPAWNED", "#facc15");
    }
}
