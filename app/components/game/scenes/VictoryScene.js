import { SaveSystem } from "../../../lib/game/SaveSystem";
import { isStageUnlocked } from "../../../lib/game/LevelConfig";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class VictoryScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.results = data.results || {};
        this.level = data.level ?? 1;
        this.stage = data.stage ?? 1;
        this.endReason = data.endReason || 'victory';
        this.matchStats = data.matchStats || {};
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ─── SAVE PROGRESS ──────────────────────────────
        const prevBest = SaveSystem.getStageBestScore(this.level, this.stage);
        const prevAbilities = { ...SaveSystem.getAbilities() };

        const savedData = SaveSystem.recordMatch(
            this.level, this.stage, true, this.results, this.matchStats
        );

        this.isNewBest = this.results && (this.results.totalScore || 0) > prevBest;

        // ─── BACKGROUND ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x020617, 0x020617, 0x0a1a0a, 0x0a1a0a, 1);
        bg.fillRect(0, 0, width, height);

        // Grid overlay
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x10b981, 0.05);
        for (let i = 0; i < width; i += 40) grid.lineBetween(i, 0, i, height);
        for (let j = 0; j < height; j += 40) grid.lineBetween(0, j, width, j);

        // ─── HEADER ────────────────────────────────────
        const headerY = 40;
        this.drawTacticalBox(bg, cx - 200, headerY - 20, 400, 60, 0x10b981);

        this.add.text(cx, headerY, 'MISSION_SUCCESS', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#10b981', fontStyle: 'bold',
            letterSpacing: 8,
        }).setOrigin(0.5);

        this.add.text(cx, headerY + 25, `SECTOR_${this.level}.${this.stage}_CLEARANCE_GRANTED`, {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#64748b', letterSpacing: 2,
        }).setOrigin(0.5);

        if (!this.results) {
            this.add.text(cx, height / 2, 'DATA_LINK_ERROR: NO SCORE RESULTS', {
                fontSize: '14px', fontFamily: 'monospace', color: '#666666',
            }).setOrigin(0.5);
            this.createButtons(cx, height - 80);
            return;
        }

        // ─── RANK DISPLAY ──────────────────────────────
        this.createRankDisplay(cx, 110);

        // ─── SCORE BREAKDOWN ───────────────────────────
        this.createScoreBreakdown(40, 200, 360, height - 320);

        // ─── COGNITIVE ANALYSIS ────────────────────────
        this.createCognitiveRadar(width - 240, 200, 200, 200);

        // ─── TOTAL SCORE ───────────────────────────────
        this.createTotalScore(cx, height - 100);

        // ─── BUTTONS ───────────────────────────────────
        this.createButtons(cx, height - 50);
    }

    drawTacticalBox(g, x, y, w, h, color = 0x10b981, alpha = 0.4) {
        g.lineStyle(1, color, alpha);
        g.strokeRect(x, y, w, h);
        g.fillStyle(0x000000, 0.6);
        g.fillRect(x, y, w, h);

        // Brackets
        const len = 10;
        g.lineStyle(2, color, 1);
        // Top Left
        g.lineBetween(x, y, x + len, y);
        g.lineBetween(x, y, x, y + len);
        // Top Right
        g.lineBetween(x + w, y, x + w - len, y);
        g.lineBetween(x + w, y, x + w, y + len);
        // Bottom Left
        g.lineBetween(x, y + h, x + len, y + h);
        g.lineBetween(x, y + h, x, y + h - len);
        // Bottom Right
        g.lineBetween(x + w, y + h, x + w - len, y + h);
        g.lineBetween(x + w, y + h, x + w, y + h - len);
    }

    // ─── RANK DISPLAY ───────────────────────────────────

    createRankDisplay(cx, y) {
        const rank = this.results.rank;
        const rankColor = Phaser.Display.Color.HexStringToColor(rank.color).color;

        const g = this.add.graphics();
        this.drawTacticalBox(g, cx - 60, y - 10, 120, 80, rankColor, 0.3);

        const rankText = this.add.text(cx, y + 20, rank.label, {
            fontSize: '42px', fontFamily: 'monospace',
            color: rank.color, fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(cx, y + 55, rank.title.toUpperCase(), {
            fontSize: '9px', fontFamily: 'monospace',
            color: rank.color, fontStyle: 'bold', letterSpacing: 4,
        }).setOrigin(0.5);

        // Pulse animation
        this.tweens.add({
            targets: rankText,
            alpha: 0.7,
            duration: 500, yoyo: true, repeat: -1,
        });
    }

    // ─── SCORE BREAKDOWN ────────────────────────────────

    createScoreBreakdown(x, y, w, h) {
        const g = this.add.graphics();
        this.drawTacticalBox(g, x, y, w, h, 0x10b981, 0.2);

        this.add.text(x + 15, y + 12, 'ANALYSIS_BREAKDOWN', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#10b981', fontStyle: 'bold', letterSpacing: 3,
        });

        const categories = this.results.categories;
        const catKeys = Object.keys(categories);
        const barW = w - 100;

        catKeys.forEach((key, i) => {
            const cat = categories[key];
            const cy = y + 45 + i * 45;

            this.add.text(x + 15, cy, cat.label.toUpperCase(), {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#94a3b8', fontStyle: 'bold', letterSpacing: 1
            });

            // Segmented Bar background
            const barBg = this.add.graphics();
            barBg.fillStyle(0x1e293b, 0.5);
            barBg.fillRect(x + 15, cy + 18, barW, 6);

            // Animated Fill
            const barFill = this.add.graphics();
            const barColor = Phaser.Display.Color.HexStringToColor(cat.color).color;
            const targetRatio = cat.score / 100;

            this.tweens.addCounter({
                from: 0, to: targetRatio,
                duration: 1000, delay: 200 + i * 100,
                onUpdate: (tween) => {
                    barFill.clear();
                    const val = tween.getValue();
                    const segments = 20;
                    const segW = barW / segments;
                    for (let s = 0; s < segments; s++) {
                        if (s / segments < val) {
                            barFill.fillStyle(barColor, 0.8);
                            barFill.fillRect(x + 15 + s * segW + 1, cy + 18, segW - 2, 6);
                        }
                    }
                }
            });

            this.add.text(x + barW + 25, cy + 15, `${cat.score}`, {
                fontSize: '12px', fontFamily: 'monospace',
                color: cat.color, fontStyle: 'bold',
            });
        });
    }

    // ─── COGNITIVE RADAR ────────────────────────────────

    createCognitiveRadar(x, y, w, h) {
        const g = this.add.graphics();
        this.drawTacticalBox(g, x, y, w, h, 0x26c6da, 0.2);

        this.add.text(x + 15, y + 12, 'NEURAL_METRICS', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#26c6da', fontStyle: 'bold', letterSpacing: 3,
        });

        const radar = this.results.cognitiveAnalysis;
        const labels = ['PLAN', 'PRIO', 'ADPT', 'EFFI', 'COMB', 'AWAR'];
        const values = [
            radar.planning, radar.prioritization, radar.adaptability,
            radar.efficiency, radar.combat, radar.awareness,
        ];

        const centerX = x + w / 2;
        const centerY = y + h / 2 + 10;
        const radius = 60;
        const angleStep = (Math.PI * 2) / labels.length;

        // Draw web
        g.lineStyle(1, 0x26c6da, 0.1);
        [0.25, 0.5, 0.75, 1].forEach(scale => {
            g.beginPath();
            for (let i = 0; i <= labels.length; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const px = centerX + Math.cos(angle) * radius * scale;
                const py = centerY + Math.sin(angle) * radius * scale;
                if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
            }
            g.strokePath();
        });

        // Data Polygon
        const dataG = this.add.graphics();
        dataG.fillStyle(0x26c6da, 0.1);
        dataG.lineStyle(2, 0x26c6da, 0.8);
        dataG.beginPath();
        values.forEach((val, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const scale = val / 100;
            const px = centerX + Math.cos(angle) * radius * scale;
            const py = centerY + Math.sin(angle) * radius * scale;
            if (i === 0) dataG.moveTo(px, py); else dataG.lineTo(px, py);
        });
        dataG.closePath();
        dataG.fillPath();
        dataG.strokePath();

        // Labels
        labels.forEach((label, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const lx = centerX + Math.cos(angle) * (radius + 20);
            const ly = centerY + Math.sin(angle) * (radius + 20);
            this.add.text(lx, ly, label, {
                fontSize: '8px', fontFamily: 'monospace', color: '#475569'
            }).setOrigin(0.5);
        });
    }

    // ─── TOTAL SCORE ────────────────────────────────────

    createTotalScore(cx, y) {
        const bg = this.add.graphics();
        this.drawTacticalBox(bg, cx - 120, y - 20, 240, 40, 0xf59e0b, 0.2);

        this.add.text(cx, y, `NET_SCORE: ${this.results.totalScore}`, {
            fontSize: '16px', fontFamily: 'monospace',
            color: '#ffd740', fontStyle: 'bold', letterSpacing: 4,
        }).setOrigin(0.5);
    }

    // ─── BUTTONS ────────────────────────────────────────

    createButtons(cx, y) {
        const btns = [
            { label: '>> NEXT_OPS', x: cx - 140, color: '#10b981', cb: () => this.nextMission() },
            { label: '>> RERUN', x: cx, color: '#f59e0b', cb: () => this.retry() },
            { label: '>> ABORT', x: cx + 140, color: '#64748b', cb: () => this.toMenu() },
        ];

        btns.forEach(btn => {
            const g = this.add.graphics();
            this.drawTacticalBox(g, btn.x - 60, y - 15, 120, 30, Phaser.Display.Color.HexStringToColor(btn.color).color, 0.3);

            const text = this.add.text(btn.x, y, btn.label, {
                fontSize: '10px', fontFamily: 'monospace',
                color: btn.color, fontStyle: 'bold', letterSpacing: 2,
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            text.on('pointerover', () => {
                text.setColor('#ffffff');
                g.clear();
                this.drawTacticalBox(g, btn.x - 60, y - 15, 120, 30, 0xffffff, 0.6);
            });
            text.on('pointerout', () => {
                text.setColor(btn.color);
                g.clear();
                this.drawTacticalBox(g, btn.x - 60, y - 15, 120, 30, Phaser.Display.Color.HexStringToColor(btn.color).color, 0.3);
            });
            text.on('pointerup', btn.cb);
        });
    }

    nextMission() {
        const next = SaveSystem.getNextStage(this.level, this.stage);
        if (!next) { this.toMenu(); return; }

        const progress = SaveSystem.getProgress();
        const unlocked = isStageUnlocked(next.level, next.stage, progress);
        if (!unlocked) { this.toMenu(); return; }

        this.cameras.main.fadeOut(400);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Navigate via React Router — BriefingScene may not be registered in direct launch
            window.location.href = `/game/briefing/${next.level}/${next.stage}`;
        });
    }

    retry() {
        this.cameras.main.fadeOut(400);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { level: this.level, stage: this.stage });
        });
    }

    toMenu() {
        this.cameras.main.fadeOut(400);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Navigate via React Router — MainMenuScene not available in direct launch
            window.location.href = '/game/select';
        });
    }
}
