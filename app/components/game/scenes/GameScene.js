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
        this.levelNum = data?.level || 1;
        this.stageNum = data?.stage || 1;
        this.levelConfig = MIND_ARENA_LEVELS[this.levelNum]?.stages?.[this.stageNum]
            || MIND_ARENA_LEVELS[1].stages[1];
        this.enemies = [];
        this.orbs = [];
        this.killCount = 0;
        this.isPaused = false;
        this.gameTime = 0;

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

        // ─── 3. ENVIRONMENT ───
        WorldGenerator.generate(this, WORLD_W, WORLD_H, this.levelConfig);

        // ─── 4. STATIONS ───
        this.createStations();

        // ─── 5. ORB COLLECTIBLES (fewer now — orbs = bonus, tasks = main) ───
        this.spawnOrbs(4);

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

        // Zoom out to show the map
        this.cameras.main.stopFollow();
        this.cameras.main.pan(WORLD_W / 2, WORLD_H / 2, 500, 'Sine.easeOut');
        this.cameras.main.zoomTo(0.45, 500, 'Sine.easeOut');

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
        // Orb collection
        this.time.addEvent({
            delay: 100,
            callback: () => {
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

        // Enemy damage to player
        this.time.addEvent({
            delay: 500,
            callback: () => {
                this.enemies.forEach(e => {
                    if (!e.active) return;
                    const dist = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
                    if (dist < 35) {
                        this.player.takeDamage(8);
                        this.matchManager.recordDamage(8);

                        // Interrupt channeling if hit
                        if (this.isChanneling && this.channelingTaskId) {
                            const task = this.matchManager.taskSystem.getTask(this.channelingTaskId);
                            if (task?.getMeta()?.interruptible) {
                                task.interruptChannel();
                                this.isChanneling = false;
                                this.channelingTaskId = null;
                                UIFactory.createPopup(this, this.player.x, this.player.y - 40,
                                    'INTERRUPTED!', '#ef4444', '12px');
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

    tryInteractWithTask() {
        if (this.inputFrozen) return;

        const playerPos = { x: this.player.x, y: this.player.y };
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

        // Handle active channeling
        if (this.isChanneling && this.channelingTaskId) {
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

        // Update task visual states
        this.taskRenderer.updateAll();
    }

    // ═══════════════════════════════════════════════════════
    // PLAYER ATTACK
    // ═══════════════════════════════════════════════════════

    playerAttack() {
        if (this.player.attackCooldown > 0 || this.inputFrozen) return;
        this.player.attackCooldown = 0.4;

        // Cancel channeling on attack
        if (this.isChanneling) {
            this.isChanneling = false;
            this.channelingTaskId = null;
        }

        // Visual slash arc
        const slash = this.add.image(
            this.player.x + this.player.facingX * 20,
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

        // Camera micro-shake
        this.cameras.main.shake(80, 0.002);

        // Hit detection against all enemies
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

    killEnemy(enemy, idx) {
        this.killCount++;
        this.matchManager.recordKill();
        this.player.collectPower(5);

        if (this.hudScene?.addLog) {
            this.hudScene.addLog(`HOSTILE ELIMINATED`, '#f59e0b');
        }
        SoundManager.enemyDeath();
        UIFactory.createPopup(this, enemy.x, enemy.y - 40, '+25 SCORE', '#f59e0b', '16px');

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

        // Brief time slow (hit feeling)
        this.time.timeScale = 0.3;
        this.time.delayedCall(80, () => { this.time.timeScale = 1; });
    }

    // ═══════════════════════════════════════════════════════
    // INPUT
    // ═══════════════════════════════════════════════════════

    setupInput() {
        // Attack (SPACE)
        this.input.keyboard.on('keydown-SPACE', () => this.playerAttack());

        // Interact (E key)
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.input.keyboard.on('keydown-E', () => this.tryInteractWithTask());

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
}
