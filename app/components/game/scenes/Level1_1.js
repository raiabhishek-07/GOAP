import { GameAgent } from "../entities/GameAgent";
import { GamePlayer } from "../entities/GamePlayer";
import { ShadowStalker } from "../entities/ShadowStalker";
import { MindOrb } from "../entities/MindOrb";
import { WorldGenerator } from "../../../lib/game/WorldGenerator";
import { MIND_ARENA_LEVELS } from "../../../lib/game/LevelConfig";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export default class Level1_1 extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super("Level1_1");
    }

    init() {
        this.levelConfig = MIND_ARENA_LEVELS[1].stages[1];
        this.orbs = [];
        this.stalkers = [];
    }

    create() {
        const { width, height } = this.scale;

        // --- 1. ATMOSPHERIC TERRAIN ---
        this.add.graphics()
            .fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 1)
            .fillRect(0, 0, width, height);

        this.add.grid(width / 2, height / 2, width, height, 40, 40, 0xffffff, 0.02);

        // --- 2. VAST ENVIRONMENT GENERATION ---
        WorldGenerator.generateNature(this, width, height);

        // --- 3. SURVIVAL STATIONS ---
        this.setupEnvironment();

        // --- 4. PLAYER & AGENTS ---
        const locs = this.levelConfig.locations;
        this.player = new GamePlayer(this, locs.playerSpawn.x, locs.playerSpawn.y, "Survivor (YOU)");

        // Main Agent
        this.agent = new GameAgent(this, locs.agentSpawn.x, locs.agentSpawn.y, "Initiate Agent");
        this.agent.logic.locations = locs;
        this.agent.logic.setPlayerTarget(this.player.logic);

        // ADDING ZOMBIES (SHADOW STALKERS)
        for (let i = 0; i < 3; i++) {
            const sx = Math.random() * width;
            const sy = Math.random() * height;
            if (WorldGenerator.isNearObjective(sx, sy)) { i--; continue; }

            const stalker = new ShadowStalker(this, sx, sy, "Shadow Stalker");
            stalker.logic.locations = locs;
            stalker.logic.setPlayerTarget(this.player.logic);
            this.stalkers.push(stalker);
        }

        // --- 5. COLLECTIBLES (MIND ORBS) ---
        for (let i = 0; i < 8; i++) {
            const ox = Math.random() * width;
            const oy = Math.random() * height;
            if (WorldGenerator.isNearObjective(ox, oy)) { i--; continue; }
            this.orbs.push(new MindOrb(this, ox, oy));
        }

        // --- 6. OVERLAY & MESSAGING ---
        this.setupLevelHUD();
        this.setupCollisions();
        this.showLevelMessage(`LEVEL 1.1: ${this.levelConfig.name}`, "COLLECT 5 ORBS TO ASCEND");
    }

    setupEnvironment() {
        const locs = this.levelConfig.locations;
        this.createStation(locs.foodShack, 0xf59e0b, "FOOD STATION", "🍖");
        this.createStation(locs.restArea, 0x8b5cf6, "REST CABIN", "🏠");
    }

    createStation(loc, color, label, icon) {
        const container = this.add.container(loc.x, loc.y);
        const glow = this.add.graphics().fillStyle(color, 0.15).fillCircle(0, 0, 60);
        this.tweens.add({ targets: glow, alpha: 0.05, duration: 1500, yoyo: true, repeat: -1 });

        const body = this.add.graphics().fillStyle(color).fillRoundedRect(-30, -25, 60, 50, 10).strokeRoundedRect(-30, -25, 60, 50, 10);
        const textIcon = this.add.text(0, -40, icon, { fontSize: '28px' }).setOrigin(0.5);
        const textLabel = this.add.text(0, 40, label, {
            fontSize: '11px', fontWeight: '900', color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        container.add([glow, body, textIcon, textLabel]);
        this.physics.add.existing(container);
        container.body.setCircle(40);
        container.body.setImmovable(true);
    }

    setupCollisions() {
        // Orb Collection
        this.physics.add.overlap(this.player, this.orbs, (player, orb) => {
            orb.destroy();
            this.orbs = this.orbs.filter(o => o !== orb);
            player.collectPower(20);
            this.updatePowerHUD();

            if (player.power >= 100) {
                this.showLevelMessage("OBJECTIVE COMPLETE", "READY FOR LEVEL 2");
            }
        });

        // Stalker Damage
        this.time.addEvent({
            delay: 500,
            callback: () => {
                this.stalkers.forEach(s => {
                    const dist = Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y);
                    if (dist < 40) {
                        this.player.takeDamage(10);
                    }
                });
            },
            loop: true
        });
    }

    setupLevelHUD() {
        this.hud = this.add.container(30, 30);
        const bg = this.add.graphics().fillStyle(0x0f172a, 0.9).fillRoundedRect(0, 0, 240, 90, 16).strokeRoundedRect(0, 0, 240, 90, 16);

        this.powerText = this.add.text(20, 15, "COGNITIVE POWER: 0%", { fontSize: '11px', color: '#00f2ff', fontWeight: '900' });
        const objective = this.add.text(20, 40, "STAGE: SURVIVAL", { fontSize: '14px', color: '#fff', fontWeight: '800' });
        const help = this.add.text(20, 65, "USE ARROWS/WASD TO MOVE", { fontSize: '9px', color: '#94a3b8', fontWeight: '600' });

        this.hud.add([bg, this.powerText, objective, help]);
    }

    updatePowerHUD() {
        const percent = Math.min(100, this.player.power);
        this.powerText.setText(`COGNITIVE POWER: ${percent}%`);
        if (percent >= 100) this.powerText.setColor('#22c55e');
    }

    showLevelMessage(title, sub) {
        const msgContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
        const bg = this.add.graphics().fillStyle(0x000000, 0.95).fillRect(-this.scale.width, -80, this.scale.width * 2, 160);
        const t = this.add.text(0, -20, title, { fontSize: '42px', fontWeight: '900', color: '#fff' }).setOrigin(0.5);
        const s = this.add.text(0, 30, sub, { fontSize: '16px', fontWeight: '800', color: '#f59e0b' }).setOrigin(0.5);
        msgContainer.add([bg, t, s]);
        msgContainer.alpha = 0;
        this.tweens.add({ targets: msgContainer, alpha: 1, duration: 1000, yoyo: true, hold: 3000, onComplete: () => msgContainer.destroy() });
    }

    update(time, delta) {
        const dt = delta / 1000;
        this.player.update(dt);
        this.agent.update(dt);
        this.stalkers.forEach(s => s.update(dt));
    }
}
