import { getStageConfig, MIND_ARENA_LEVELS, AGENT_META } from "../../../lib/game/LevelConfig";
import { TASK_META } from "../../../lib/game/TaskSystem";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

/**
 * BriefingScene — Pre-mission briefing with map preview, task list, enemy info
 */
export class BriefingScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'BriefingScene' });
    }

    init(data) {
        this.level = data.level || 1;
        this.stage = data.stage || 1;
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const config = getStageConfig(this.level, this.stage);
        const level = MIND_ARENA_LEVELS[this.level];

        if (!config) {
            this.scene.start('LevelSelectScene');
            return;
        }

        this.cameras.main.fadeIn(400, 0, 0, 0);

        // ─── BACKGROUND ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0f0a, 0x0a0f0a, 0x121a12, 0x121a12, 1);
        bg.fillRect(0, 0, width, height);

        // Scanline effect
        const scanlines = this.add.graphics();
        for (let i = 0; i < height; i += 3) {
            scanlines.fillStyle(0x000000, 0.06);
            scanlines.fillRect(0, i, width, 1);
        }

        // ─── TOP: MISSION HEADER ───────────────────────
        const topBar = this.add.graphics();
        topBar.fillStyle(0x000000, 0.7);
        topBar.fillRect(0, 0, width, 70);
        topBar.lineStyle(1.5, 0xf59e0b, 0.5);
        topBar.lineBetween(0, 70, width, 70);

        this.add.text(cx, 12, 'MISSION BRIEFING', {
            fontSize: '12px',
            fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#f59e0b', fontStyle: 'bold', letterSpacing: 6,
        }).setOrigin(0.5);

        this.add.text(cx, 32, `${config.name.toUpperCase()} — ${config.subtitle}`, {
            fontSize: '20px',
            fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#ffffff', fontStyle: 'bold', letterSpacing: 3,
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);

        this.add.text(cx, 55, `Level ${this.level}: ${level.name} | Stage ${this.stage} | Difficulty: ${'●'.repeat(config.difficulty)}${'○'.repeat(10 - config.difficulty)}`, {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#6a8a6a', letterSpacing: 1,
        }).setOrigin(0.5);

        // ─── LEFT: MINIMAP PREVIEW ─────────────────────
        this.createMapPreview(30, 90, 280, 200, config);

        // ─── RIGHT: INTEL PANEL ────────────────────────
        this.createIntelPanel(340, 90, width - 370, config);

        // ─── BOTTOM: OBJECTIVES + TIPS ─────────────────
        this.createObjectivePanel(30, 310, width - 60, height - 380, config);

        // ─── DEPLOY BUTTON ─────────────────────────────
        this.createDeployButton(cx, height - 42, config, level);

        // Back link
        const back = this.add.text(70, height - 42, '← BACK', {
            fontSize: '10px', fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#4a6a4a', fontStyle: 'bold', letterSpacing: 1,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        back.on('pointerover', () => back.setColor('#f59e0b'));
        back.on('pointerout', () => back.setColor('#4a6a4a'));
        back.on('pointerup', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('LevelSelectScene');
            });
        });
    }

    // ─── MINIMAP PREVIEW ────────────────────────────────

    createMapPreview(x, y, w, h, config) {
        const panel = this.add.graphics();
        panel.fillStyle(0x111811, 0.9);
        panel.fillRoundedRect(x, y, w, h, 8);
        panel.lineStyle(1, 0x2a5a2a, 0.4);
        panel.strokeRoundedRect(x, y, w, h, 8);

        this.add.text(x + 10, y + 8, 'TACTICAL MAP', {
            fontSize: '8px', fontFamily: 'monospace',
            color: '#4a6a4a', letterSpacing: 2,
        });

        // Draw map area
        const mapX = x + 15, mapY = y + 28;
        const mapW = w - 30, mapH = h - 40;

        const mapBg = this.add.graphics();
        mapBg.fillStyle(0x1a2a1a, 1);
        mapBg.fillRect(mapX, mapY, mapW, mapH);
        mapBg.lineStyle(1, 0x2a4a2a, 0.5);
        mapBg.strokeRect(mapX, mapY, mapW, mapH);

        // Grid lines on map
        const mapGrid = this.add.graphics();
        mapGrid.lineStyle(0.3, 0x2a4a2a, 0.3);
        for (let gx = 0; gx < mapW; gx += 25) {
            mapGrid.lineBetween(mapX + gx, mapY, mapX + gx, mapY + mapH);
        }
        for (let gy = 0; gy < mapH; gy += 25) {
            mapGrid.lineBetween(mapX, mapY + gy, mapX + mapW, mapY + gy);
        }

        // Scale world coords to map coords
        const scaleX = (wx) => mapX + (wx / 2400) * mapW;
        const scaleY = (wy) => mapY + (wy / 1600) * mapH;

        // Draw player spawn
        if (config.playerSpawn) {
            const px = scaleX(config.playerSpawn.x);
            const py = scaleY(config.playerSpawn.y);
            this.add.circle(px, py, 5, 0x22c55e, 1);
            this.add.text(px + 8, py - 4, 'YOU', {
                fontSize: '6px', fontFamily: 'monospace', color: '#22c55e',
            });
        }

        // Draw agent spawns
        (config.agents || []).forEach((agent, i) => {
            const ax = scaleX(agent.spawn.x);
            const ay = scaleY(agent.spawn.y);
            const meta = AGENT_META[agent.type];
            const color = meta?.color || 0xff4444;
            this.add.circle(ax, ay, 4, color, 0.8);
        });

        // Draw task locations
        (config.tasks || []).forEach(task => {
            const tx = scaleX(task.position.x);
            const ty = scaleY(task.position.y);
            const meta = TASK_META[task.type];
            const color = Phaser.Display.Color.HexStringToColor(meta?.color || '#26c6da').color;
            this.add.rectangle(tx, ty, 6, 6, color, 0.8);
        });

        // Draw extraction
        if (config.extraction) {
            const ex = scaleX(config.extraction.x);
            const ey = scaleY(config.extraction.y);
            this.add.triangle(ex, ey, 0, 8, 4, 0, 8, 8, 0x00e676, 0.8);
            this.add.text(ex + 8, ey - 4, 'EXIT', {
                fontSize: '6px', fontFamily: 'monospace', color: '#00e676',
            });
        }

        // Legend
        const ly = y + h - 12;
        const legend = [
            { color: '#22c55e', label: 'Player' },
            { color: '#ef5350', label: 'Enemy' },
            { color: '#26c6da', label: 'Task' },
            { color: '#00e676', label: 'Extract' },
        ];
        legend.forEach((l, i) => {
            this.add.circle(x + 20 + i * 65, ly, 3, Phaser.Display.Color.HexStringToColor(l.color).color, 0.8);
            this.add.text(x + 26 + i * 65, ly, l.label, {
                fontSize: '6px', fontFamily: 'monospace', color: '#6a8a6a',
            }).setOrigin(0, 0.5);
        });
    }

    // ─── INTEL PANEL ────────────────────────────────────

    createIntelPanel(x, y, w, config) {
        const panel = this.add.graphics();
        panel.fillStyle(0x111811, 0.9);
        panel.fillRoundedRect(x, y, w, 200, 8);
        panel.lineStyle(1, 0x2a5a2a, 0.4);
        panel.strokeRoundedRect(x, y, w, 200, 8);

        // Enemy intel
        this.add.text(x + 12, y + 10, 'ENEMY INTEL', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#ef5350', fontStyle: 'bold', letterSpacing: 2,
        });

        (config.agents || []).forEach((agent, i) => {
            const meta = AGENT_META[agent.type];
            const ay = y + 30 + i * 24;
            const color = '#' + (meta?.color || 0xffffff).toString(16).padStart(6, '0');

            this.add.circle(x + 18, ay + 4, 4, meta?.color || 0xff4444, 0.8);
            this.add.text(x + 28, ay, meta?.label || 'Unknown', {
                fontSize: '9px', fontFamily: '"Inter","Segoe UI",sans-serif',
                color: color, fontStyle: 'bold',
            });
            this.add.text(x + 28, ay + 12, `SPD:${meta?.speed} | RNG:${meta?.chaseRange} | ATK:${meta?.attackRange}`, {
                fontSize: '7px', fontFamily: 'monospace', color: '#5a6a5a',
            });
        });

        // Time limit
        const timeY = y + 30 + (config.agents?.length || 0) * 24 + 10;
        this.add.text(x + 12, timeY, `⏱ TIME LIMIT: ${config.timeLimit}s`, {
            fontSize: '10px', fontFamily: 'monospace',
            color: '#f59e0b', fontStyle: 'bold',
        });

        this.add.text(x + 12, timeY + 18, `📋 TASKS: ${config.tasks?.length || 0} objectives`, {
            fontSize: '10px', fontFamily: 'monospace',
            color: '#26c6da', fontStyle: 'bold',
        });
    }

    // ─── OBJECTIVE PANEL ────────────────────────────────

    createObjectivePanel(x, y, w, h, config) {
        const panel = this.add.graphics();
        panel.fillStyle(0x111811, 0.9);
        panel.fillRoundedRect(x, y, w, h, 8);
        panel.lineStyle(1, 0x2a5a2a, 0.4);
        panel.strokeRoundedRect(x, y, w, h, 8);

        this.add.text(x + 12, y + 10, 'OBJECTIVES', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#f59e0b', fontStyle: 'bold', letterSpacing: 2,
        });

        // Task list (left side)
        (config.tasks || []).slice(0, 6).forEach((task, i) => {
            const ty = y + 30 + i * 20;
            const meta = TASK_META[task.type];

            this.add.text(x + 15, ty, meta?.icon || '📋', { fontSize: '10px' });
            this.add.text(x + 32, ty, task.name, {
                fontSize: '9px', fontFamily: '"Inter","Segoe UI",sans-serif',
                color: '#b0c0b0',
            });
            this.add.text(x + 160, ty, `${task.basePoints}pts`, {
                fontSize: '8px', fontFamily: 'monospace',
                color: '#f59e0b',
            });
            this.add.text(x + 210, ty, `P${task.priority}`, {
                fontSize: '8px', fontFamily: 'monospace',
                color: task.priority >= 4 ? '#ef5350' : '#6a8a6a',
            });
        });

        // Tips (right side)
        const tipX = x + w / 2 + 20;
        this.add.text(tipX, y + 10, 'TACTICAL TIPS', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#22c55e', fontStyle: 'bold', letterSpacing: 2,
        });

        (config.tips || []).forEach((tip, i) => {
            this.add.text(tipX, y + 30 + i * 22, `▸ ${tip}`, {
                fontSize: '8px', fontFamily: '"Inter","Segoe UI",sans-serif',
                color: '#6a8a6a', wordWrap: { width: w / 2 - 40 }, lineSpacing: 2,
            });
        });
    }

    // ─── DEPLOY BUTTON ──────────────────────────────────

    createDeployButton(cx, y, config, level) {
        const container = this.add.container(cx, y);
        const bw = 240, bh = 45;

        // Glow
        const glow = this.add.graphics();
        glow.fillStyle(0xf59e0b, 0.08);
        glow.fillRoundedRect(-bw / 2 - 8, -bh / 2 - 8, bw + 16, bh + 16, 16);
        container.add(glow);

        // Button
        const btnBg = this.add.graphics();
        btnBg.fillGradientStyle(0x2a5a2a, 0x2a5a2a, 0x1a3a1a, 0x1a3a1a, 1);
        btnBg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 10);
        btnBg.lineStyle(1.5, 0xf59e0b, 0.6);
        btnBg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 10);
        container.add(btnBg);

        const text = this.add.text(0, -2, '▶  DEPLOY NOW', {
            fontSize: '16px',
            fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#ffffff', fontStyle: 'bold',
            letterSpacing: 4,
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);
        container.add(text);

        const sub = this.add.text(0, 14, 'Start the mission', {
            fontSize: '7px', fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#8a9a8a', letterSpacing: 1,
        }).setOrigin(0.5);
        container.add(sub);

        container.setSize(bw, bh);
        container.setInteractive({ useHandCursor: true });

        // Pulse animation
        this.tweens.add({
            targets: glow, alpha: 0.3, yoyo: true, repeat: -1,
            duration: 1500, ease: 'Sine.easeInOut',
        });

        container.on('pointerover', () => {
            this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 150 });
            text.setColor('#f59e0b');
        });
        container.on('pointerout', () => {
            this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
            text.setColor('#ffffff');
        });
        container.on('pointerup', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', { level: this.level, stage: this.stage });
            });
        });
    }
}
