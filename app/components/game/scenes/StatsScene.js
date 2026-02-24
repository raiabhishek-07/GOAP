import { SaveSystem } from "../../../lib/game/SaveSystem";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

/**
 * StatsScene — Player Profile & Career Stats
 * Shows overall progression, cognitive averages, best ranks, and unlocked abilities
 */
export class StatsScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'StatsScene' });
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.cameras.main.fadeIn(500, 0, 0, 0);

        const summary = SaveSystem.getProgressionSummary();

        // ─── BACKGROUND ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0f1a, 0x0a0f1a, 0x1a2a3a, 0x1a2a4a, 1);
        bg.fillRect(0, 0, width, height);

        // Grid lines
        const grid = this.add.graphics();
        grid.lineStyle(0.5, 0xffffff, 0.02);
        for (let i = -height; i < width + height; i += 40) {
            grid.lineBetween(i, 0, i + height, height);
        }

        // ─── TOP BAR ───────────────────────────────────
        const topBar = this.add.graphics();
        topBar.fillStyle(0x000000, 0.6);
        topBar.fillRect(0, 0, width, 50);
        topBar.lineStyle(1.5, 0x42a5f5, 0.5);
        topBar.lineBetween(0, 50, width, 50);

        this.add.text(cx, 16, 'PLAYER PROFILE', {
            fontSize: '20px', fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#ffffff', fontStyle: 'bold', letterSpacing: 8,
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);

        this.add.text(cx, 36, 'Career Statistics & Cognitive Analysis', {
            fontSize: '8px', fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#5a7a9a', letterSpacing: 2,
        }).setOrigin(0.5);

        // ─── LEFT PANEL: STATS ─────────────────────────
        this.createStatsPanel(30, 65, 200, 310, summary);

        // ─── CENTER: COGNITIVE RADAR ───────────────────
        this.createCognitiveSection(cx, 65, 200, 175, summary);

        // ─── RIGHT PANEL: MISSION PROGRESS ─────────────
        this.createMissionProgress(width - 230, 65, 200, 175, summary);

        // ─── BOTTOM: ABILITIES ─────────────────────────
        this.createAbilitiesPanel(30, 255, width - 60, 125, summary);

        // ─── BACK BUTTON ───────────────────────────────
        this.createBackButton(cx, height - 22);

        // ─── RESET BUTTON ──────────────────────────────
        this.createResetButton(width - 50, height - 22);
    }

    // ─── STATS PANEL ───────────────────────────────────────

    createStatsPanel(x, y, w, h, summary) {
        const panel = this.add.graphics();
        panel.fillStyle(0x0d1a2d, 0.9);
        panel.fillRoundedRect(x, y, w, h, 8);
        panel.lineStyle(1, 0x1a3a5a, 0.5);
        panel.strokeRoundedRect(x, y, w, h, 8);

        const px = x + 15;
        let py = y + 15;

        this.add.text(px, py, '📊 CAREER STATS', {
            fontSize: '10px', fontFamily: 'monospace',
            color: '#42a5f5', fontStyle: 'bold', letterSpacing: 2,
        });
        py += 22;

        const s = summary.stats;
        const stats = [
            { label: 'Games Played', value: s.gamesPlayed },
            { label: 'Missions Won', value: s.totalMissionsCompleted },
            { label: 'Missions Failed', value: s.totalMissionsFailed },
            { label: 'Win Rate', value: s.gamesPlayed > 0 ? `${Math.round((s.totalMissionsCompleted / s.gamesPlayed) * 100)}%` : '—' },
            { label: '', value: '' }, // spacer
            { label: 'Total Kills', value: s.totalKills },
            { label: 'Total Deaths', value: s.totalDeaths },
            { label: 'K/D Ratio', value: s.totalDeaths > 0 ? (s.totalKills / s.totalDeaths).toFixed(1) : s.totalKills > 0 ? '∞' : '—' },
            { label: '', value: '' }, // spacer
            { label: 'Tasks Done', value: s.totalTasksCompleted },
            { label: 'Avg Score', value: s.averageScore },
            { label: 'Highest Rank', value: s.highestRank || '—' },
            { label: 'Playtime', value: SaveSystem.formatPlaytime(s.totalPlaytime) },
        ];

        stats.forEach(stat => {
            if (!stat.label) { py += 6; return; }

            this.add.text(px, py, stat.label, {
                fontSize: '8px', fontFamily: '"Inter","Segoe UI",sans-serif',
                color: '#6a8a9a',
            });
            this.add.text(x + w - 15, py, `${stat.value}`, {
                fontSize: '9px', fontFamily: 'monospace',
                color: '#ffffff', fontStyle: 'bold',
            }).setOrigin(1, 0);
            py += 18;
        });
    }

    // ─── COGNITIVE RADAR ───────────────────────────────────

    createCognitiveSection(cx, y, w, h, summary) {
        const panel = this.add.graphics();
        panel.fillStyle(0x0d1a2d, 0.9);
        panel.fillRoundedRect(cx - w / 2, y, w, h, 8);
        panel.lineStyle(1, 0x1a3a5a, 0.5);
        panel.strokeRoundedRect(cx - w / 2, y, w, h, 8);

        this.add.text(cx, y + 12, '🧠 COGNITIVE PROFILE', {
            fontSize: '10px', fontFamily: 'monospace',
            color: '#ffd740', fontStyle: 'bold', letterSpacing: 2,
        }).setOrigin(0.5);

        const cog = summary.cognitiveAverages;
        const radarCx = cx;
        const radarCy = y + 95;
        const radarR = 55;

        const axes = [
            { key: 'planning', label: 'Plan', angle: -Math.PI / 2 },
            { key: 'prioritization', label: 'Priority', angle: -Math.PI / 2 + Math.PI / 3 },
            { key: 'adaptability', label: 'Adapt', angle: -Math.PI / 2 + 2 * Math.PI / 3 },
            { key: 'efficiency', label: 'Efficiency', angle: Math.PI / 2 },
            { key: 'combat', label: 'Combat', angle: Math.PI / 2 + Math.PI / 3 },
            { key: 'awareness', label: 'Awareness', angle: Math.PI / 2 + 2 * Math.PI / 3 },
        ];

        // Draw radar grid
        const radar = this.add.graphics();
        [0.25, 0.5, 0.75, 1.0].forEach(scale => {
            radar.lineStyle(0.5, 0xffffff, 0.08);
            radar.beginPath();
            axes.forEach((axis, i) => {
                const px = radarCx + Math.cos(axis.angle) * radarR * scale;
                const py = radarCy + Math.sin(axis.angle) * radarR * scale;
                if (i === 0) radar.moveTo(px, py);
                else radar.lineTo(px, py);
            });
            radar.closePath();
            radar.strokePath();
        });

        // Draw axis lines
        axes.forEach(axis => {
            radar.lineStyle(0.5, 0xffffff, 0.05);
            radar.lineBetween(radarCx, radarCy, radarCx + Math.cos(axis.angle) * radarR, radarCy + Math.sin(axis.angle) * radarR);
        });

        // Draw data polygon
        const hasData = Object.values(cog).some(v => v > 0);
        if (hasData) {
            radar.lineStyle(2, 0x42a5f5, 0.8);
            radar.fillStyle(0x42a5f5, 0.15);
            radar.beginPath();
            axes.forEach((axis, i) => {
                const val = (cog[axis.key] || 0) / 100;
                const px = radarCx + Math.cos(axis.angle) * radarR * val;
                const py = radarCy + Math.sin(axis.angle) * radarR * val;
                if (i === 0) radar.moveTo(px, py);
                else radar.lineTo(px, py);
            });
            radar.closePath();
            radar.fillPath();
            radar.strokePath();
        }

        // Labels
        axes.forEach(axis => {
            const lx = radarCx + Math.cos(axis.angle) * (radarR + 16);
            const ly = radarCy + Math.sin(axis.angle) * (radarR + 16);
            const val = cog[axis.key] || 0;
            this.add.text(lx, ly, `${axis.label}\n${val}`, {
                fontSize: '6px', fontFamily: 'monospace',
                color: '#8aaaba', align: 'center', lineSpacing: 2,
            }).setOrigin(0.5);
        });
    }

    // ─── MISSION PROGRESS ──────────────────────────────────

    createMissionProgress(x, y, w, h, summary) {
        const panel = this.add.graphics();
        panel.fillStyle(0x0d1a2d, 0.9);
        panel.fillRoundedRect(x, y, w, h, 8);
        panel.lineStyle(1, 0x1a3a5a, 0.5);
        panel.strokeRoundedRect(x, y, w, h, 8);

        this.add.text(x + w / 2, y + 12, '🎯 MISSIONS', {
            fontSize: '10px', fontFamily: 'monospace',
            color: '#22c55e', fontStyle: 'bold', letterSpacing: 2,
        }).setOrigin(0.5);

        // Overall progress bar
        const barX = x + 15;
        const barY = y + 30;
        const barW = w - 30;
        const barH = 14;

        panel.fillStyle(0x111111, 0.8);
        panel.fillRoundedRect(barX, barY, barW, barH, 4);

        const fillW = barW * (summary.completionPercent / 100);
        if (fillW > 0) {
            panel.fillStyle(0x22c55e, 0.8);
            panel.fillRoundedRect(barX, barY, fillW, barH, 4);
        }

        this.add.text(x + w / 2, barY + barH / 2, `${summary.stagesCompleted} / ${summary.totalStages} STAGES`, {
            fontSize: '8px', fontFamily: 'monospace',
            color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);

        // Individual stage dots
        const dotStartY = barY + 30;
        const levels = [
            { num: 1, color: '#22c55e', name: 'L1' },
            { num: 2, color: '#f59e0b', name: 'L2' },
            { num: 3, color: '#ef4444', name: 'L3' },
        ];

        levels.forEach((lev, li) => {
            const ly = dotStartY + li * 35;
            this.add.text(x + 15, ly, lev.name, {
                fontSize: '9px', fontFamily: 'monospace',
                color: lev.color, fontStyle: 'bold',
            });

            [1, 2, 3].forEach((stageNum, si) => {
                const dx = x + 50 + si * 50;
                const progress = SaveSystem.load().progress;
                const sd = progress[lev.num]?.[stageNum];
                const completed = sd?.completed;
                const rank = sd?.bestRank;

                const dot = this.add.graphics();
                const dotSize = 10;
                dot.fillStyle(completed ? Phaser.Display.Color.HexStringToColor(lev.color).color : 0x333333, completed ? 0.9 : 0.4);
                dot.fillCircle(dx, ly + 6, dotSize);

                if (completed) {
                    dot.lineStyle(1.5, 0xffffff, 0.2);
                    dot.strokeCircle(dx, ly + 6, dotSize);
                }

                this.add.text(dx, ly + 6, completed ? (rank || '✓') : `${lev.num}.${stageNum}`, {
                    fontSize: completed ? '8px' : '6px',
                    fontFamily: 'monospace',
                    color: completed ? '#ffffff' : '#555555',
                    fontStyle: 'bold',
                }).setOrigin(0.5);
            });
        });
    }

    // ─── ABILITIES PANEL ───────────────────────────────────

    createAbilitiesPanel(x, y, w, h, summary) {
        const panel = this.add.graphics();
        panel.fillStyle(0x0d1a2d, 0.9);
        panel.fillRoundedRect(x, y, w, h, 8);
        panel.lineStyle(1, 0x1a3a5a, 0.5);
        panel.strokeRoundedRect(x, y, w, h, 8);

        this.add.text(x + w / 2, y + 12, '⚡ UNLOCKED ABILITIES', {
            fontSize: '10px', fontFamily: 'monospace',
            color: '#ab47bc', fontStyle: 'bold', letterSpacing: 2,
        }).setOrigin(0.5);

        const abilities = [
            { key: 'scanner', name: 'Scanner', desc: 'Reveal nearest task through fog', icon: '📡', req: 'Complete all L1 stages' },
            { key: 'quickHack', name: 'Quick Hack', desc: '20% faster terminal hacking', icon: '💻', req: 'S-rank any L1 stage' },
            { key: 'ironWill', name: 'Iron Will', desc: 'Survive one lethal hit / match', icon: '🛡️', req: 'Complete all L2 stages' },
            { key: 'pathfinder', name: 'Pathfinder', desc: 'Show optimal path on minimap', icon: '🗺️', req: 'S-rank any L2 stage' },
            { key: 'ghostStep', name: 'Ghost Step', desc: 'Invisible for 3s after dash', icon: '👻', req: 'Complete all L3 stages' },
            { key: 'masterPlan', name: 'Master Plan', desc: 'See enemy moves in plan phase', icon: '🎯', req: 'S-rank any L3 stage' },
        ];

        const colW = (w - 40) / 3;
        abilities.forEach((ab, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const ax = x + 20 + col * colW + colW / 2;
            const ay = y + 35 + row * 45;
            const unlocked = summary.abilities[ab.key];

            // Icon
            this.add.text(ax - colW / 2 + 10, ay, ab.icon, {
                fontSize: '16px',
            }).setOrigin(0.5).setAlpha(unlocked ? 1 : 0.3);

            // Name
            this.add.text(ax - colW / 2 + 30, ay - 6, ab.name.toUpperCase(), {
                fontSize: '8px', fontFamily: '"Inter","Segoe UI",sans-serif',
                color: unlocked ? '#ffffff' : '#444444',
                fontStyle: 'bold', letterSpacing: 1,
            });

            // Description / requirement
            this.add.text(ax - colW / 2 + 30, ay + 6, unlocked ? ab.desc : `🔒 ${ab.req}`, {
                fontSize: '7px', fontFamily: '"Inter","Segoe UI",sans-serif',
                color: unlocked ? '#8a9aaa' : '#333333',
            });
        });
    }

    // ─── BACK BUTTON ───────────────────────────────────────

    createBackButton(cx, y) {
        const text = this.add.text(cx, y, '← BACK  TO  MENU', {
            fontSize: '11px', fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#4a6a8a', fontStyle: 'bold', letterSpacing: 2,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        text.on('pointerover', () => text.setColor('#42a5f5'));
        text.on('pointerout', () => text.setColor('#4a6a8a'));
        text.on('pointerup', () => {
            this.cameras.main.fadeOut(300);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenuScene');
            });
        });
    }

    // ─── RESET BUTTON ──────────────────────────────────────

    createResetButton(x, y) {
        const text = this.add.text(x, y, '🗑️ RESET', {
            fontSize: '8px', fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#5a3a3a', fontStyle: 'bold', letterSpacing: 1,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        text.on('pointerover', () => text.setColor('#ef4444'));
        text.on('pointerout', () => text.setColor('#5a3a3a'));
        text.on('pointerup', () => {
            // Show confirmation
            if (this._confirmReset) {
                SaveSystem.reset();
                this.scene.restart();
            } else {
                this._confirmReset = true;
                text.setText('⚠️  CLICK AGAIN TO CONFIRM');
                text.setColor('#ef4444');
                this.time.delayedCall(3000, () => {
                    this._confirmReset = false;
                    text.setText('🗑️ RESET');
                    text.setColor('#5a3a3a');
                });
            }
        });
    }
}
