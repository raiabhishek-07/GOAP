let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class GameOverScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.level = data.level ?? 1;
        this.stage = data.stage ?? 1;
        this.endReason = data.endReason || 'eliminated';
        this.results = data.results || null;
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ─── BACKGROUND ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0f0505, 0x0f0505, 0x1a0a0a, 0x1a0a0a, 1);
        bg.fillRect(0, 0, width, height);

        // Grid overlay
        const grid = this.add.graphics();
        grid.lineStyle(1, 0xef4444, 0.05);
        for (let i = 0; i < width; i += 40) grid.lineBetween(i, 0, i, height);
        for (let j = 0; j < height; j += 40) grid.lineBetween(0, j, width, j);

        // ─── HEADER ────────────────────────────────────
        const reasonText = {
            eliminated: 'NEURAL_LINK_SEVERED',
            time_up: 'DEPLOYMENT_WINDOW_CLOSED',
            outplanned: 'COUNTER_INTEL_OVERWHELM',
        };

        const headerY = height * 0.2;
        this.drawTacticalBox(bg, cx - 180, headerY - 30, 360, 60, 0xef4444, 0.3);

        this.add.text(cx, headerY - 10, 'MISSION_FAILURE', {
            fontSize: '22px',
            fontFamily: 'monospace',
            color: '#ef4444', fontStyle: 'bold',
            letterSpacing: 8,
        }).setOrigin(0.5);

        this.add.text(cx, headerY + 15, reasonText[this.endReason] || 'OPERATIONAL_COLLAPSE', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#cc3333', fontStyle: 'bold', letterSpacing: 2,
        }).setOrigin(0.5);

        // ─── STATS PANEL ───────────────────────────────
        if (this.results) {
            this.createStatsPanel(cx, headerY + 80, 320, 160);
        }

        // ─── FAILURE ADVICE ────────────────────────────
        this.createAdvice(cx, height - 120);

        // ─── BUTTONS ───────────────────────────────────
        this.createButtons(cx, height - 60);

        // Shake camera briefly
        this.cameras.main.shake(400, 0.008);
    }

    drawTacticalBox(g, x, y, w, h, color = 0xef4444, alpha = 0.4) {
        g.lineStyle(1, color, alpha);
        g.strokeRect(x, y, w, h);
        g.fillStyle(0x000000, 0.7);
        g.fillRect(x, y, w, h);

        const len = 10;
        g.lineStyle(2, color, 1);
        g.lineBetween(x, y, x + len, y); g.lineBetween(x, y, x, y + len); // TL
        g.lineBetween(x + w, y, x + w - len, y); g.lineBetween(x + w, y, x + w, y + len); // TR
        g.lineBetween(x, y + h, x + len, y + h); g.lineBetween(x, y + h, x, y + h - len); // BL
        g.lineBetween(x + w, y + h, x + w - len, y + h); g.lineBetween(x + w, y + h, x + w, y + h - len); // BR
    }

    createStatsPanel(cx, y, w, h) {
        const g = this.add.graphics();
        this.drawTacticalBox(g, cx - w / 2, y, w, h, 0xef4444, 0.2);

        this.add.text(cx, y + 15, 'INCIDENT_REPORT', {
            fontSize: '9px', fontFamily: 'monospace',
            color: '#ef4444', fontStyle: 'bold', letterSpacing: 3,
        }).setOrigin(0.5);

        const stats = [];
        if (this.results.categories) {
            const cats = this.results.categories;
            stats.push({ label: 'TASKS COMPLETED', value: cats.taskCompletion?.detail || '0/0' });
            stats.push({ label: 'OBJECTIVE PRIORITY', value: `${cats.priorityScore?.score || 0}%` });
            stats.push({ label: 'NEURAL ENGAGEMENT', value: cats.combatScore?.detail || 'N/A' });
            stats.push({ label: 'FINAL METRIC', value: `${this.results.totalScore || 0}` });
        }

        stats.forEach((stat, i) => {
            const sy = y + 45 + i * 25;
            this.add.text(cx - w / 2 + 25, sy, stat.label, {
                fontSize: '9px', fontFamily: 'monospace',
                color: '#64748b',
            });
            this.add.text(cx + w / 2 - 25, sy, stat.value, {
                fontSize: '10px', fontFamily: 'monospace',
                color: '#ef4444', fontStyle: 'bold',
            }).setOrigin(1, 0);
        });
    }

    createAdvice(cx, y) {
        const advice = {
            eliminated: '>> STRATEGIC_ADVICE: PRIORITIZE SURVIVAL. EVADE HOSTILE PATHING UNTIL OPTIMAL WINDOW.',
            time_up: '>> STRATEGIC_ADVICE: FOCUS ON HIGH-PRIORITY NODES. DISREGARD SECONDARY OBJECTIVES.',
            outplanned: '>> STRATEGIC_ADVICE: AI EFFICIENCY EXCEEDS CURRENT THRESHOLD. RE-OPTIMIZE TASK SEQUENCE.',
        };

        this.add.text(cx, y, advice[this.endReason] || '>> STRATEGIC_ADVICE: RE-EVALUATE DEPLOYMENT PARAMETERS.', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#475569',
            wordWrap: { width: 450 },
            align: 'center',
            lineSpacing: 8,
        }).setOrigin(0.5);
    }

    createButtons(cx, y) {
        const btns = [
            {
                label: '>> REDEPLOY', x: cx - 100, color: '#f59e0b', cb: () => {
                    this.cameras.main.fadeOut(400);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.start('GameScene', { level: this.level, stage: this.stage });
                    });
                }
            },
            {
                label: '>> ABORT', x: cx + 100, color: '#64748b', cb: () => {
                    this.cameras.main.fadeOut(400);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        // Navigate via React Router — MainMenuScene not available in direct launch
                        window.location.href = '/game/select';
                    });
                }
            },
        ];

        btns.forEach(btn => {
            const g = this.add.graphics();
            this.drawTacticalBox(g, btn.x - 70, y - 15, 140, 30, Phaser.Display.Color.HexStringToColor(btn.color).color, 0.3);

            const text = this.add.text(btn.x, y, btn.label, {
                fontSize: '10px', fontFamily: 'monospace',
                color: btn.color, fontStyle: 'bold', letterSpacing: 2,
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            text.on('pointerover', () => {
                text.setColor('#ffffff');
                g.clear();
                this.drawTacticalBox(g, btn.x - 70, y - 15, 140, 30, 0xffffff, 0.6);
            });
            text.on('pointerout', () => {
                text.setColor(btn.color);
                g.clear();
                this.drawTacticalBox(g, btn.x - 70, y - 15, 140, 30, Phaser.Display.Color.HexStringToColor(btn.color).color, 0.3);
            });
            text.on('pointerup', btn.cb);
        });
    }
}
