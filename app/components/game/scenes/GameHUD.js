let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class GameHUD extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'GameHUD' });
        this.gameScene = null;
    }

    init(data) {
        this.gameScene = this.scene.get('GameScene');
        this.level = data?.level || 1;
        this.stage = data?.stage || 1;
    }

    create() {
        const { width, height } = this.scale;

        // ─── TOP LEFT: Player Status ───────────────────
        this.createPlayerStatus(20, 20);

        // ─── TOP CENTER: Match Info ────────────────────
        this.createMatchInfo(width / 2, 20);

        // ─── TOP RIGHT: Timer & Score ──────────────────
        this.createTimerPanel(width - 20, 20);

        // ─── LEFT: Task Tracker ────────────────────────
        this.createTaskTracker(20, 90);

        // ─── BOTTOM LEFT: Minimap ──────────────────────
        this.createMinimap(20, height - 140);

        // ─── BOTTOM RIGHT: Action HUD ──────────────────
        this.createActionButtons(width - 20, height - 20);

        // ─── NOTIFICATION SYSTEM ───────────────────────
        this.createEventLog(width - 20, height - 160);

        // ─── PROGRESS BARS ─────────────────────────────
        this.createChannelBar(width);

        // Scanline overlay (subtle)
        const scan = this.add.graphics();
        scan.fillStyle(0x000000, 0.1);
        for (let i = 0; i < height; i += 4) scan.fillRect(0, i, width, 1);
        scan.setScrollFactor(0).setDepth(1000).setAlpha(0.2);
    }

    // ─── HELPERS ────────────────────────────────────────

    drawTacticalBox(g, x, y, w, h, color = 0x22c55e, alpha = 0.4) {
        g.lineStyle(1, color, alpha);
        // Corner brackets
        const len = 10;
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

        g.fillStyle(0x000000, 0.4);
        g.fillRect(x, y, w, h);
    }

    // ─── PLAYER STATUS ──────────────────────────────────

    createPlayerStatus(x, y) {
        const g = this.add.graphics();
        this.drawTacticalBox(g, x, y, 220, 50);

        this.add.text(x + 12, y + 8, 'OPERATIVE_07', {
            fontSize: '10px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold', letterSpacing: 2
        });

        // HP
        this.add.text(x + 12, y + 24, 'VIT', { fontSize: '8px', fontFamily: 'monospace', color: '#6a8a6a' });
        this.healthBar = this.add.graphics();
        this.updateSegmentedBar(this.healthBar, x + 40, y + 24, 150, 6, 1, 0x22c55e);

        // STAMINA
        this.add.text(x + 12, y + 36, 'STM', { fontSize: '8px', fontFamily: 'monospace', color: '#6a8a6a' });
        this.staminaBar = this.add.graphics();
        this.updateSegmentedBar(this.staminaBar, x + 40, y + 36, 150, 6, 1, 0x3b82f6);
    }

    updateSegmentedBar(g, x, y, w, h, pct, color) {
        g.clear();
        const segments = 10;
        const segW = (w / segments) - 2;
        for (let i = 0; i < segments; i++) {
            const filled = (i / segments) < pct;
            g.fillStyle(color, filled ? 0.8 : 0.1);
            g.fillRect(x + i * (segW + 2), y, segW, h);
        }
    }

    // ─── MATCH INFO ─────────────────────────────────────

    createMatchInfo(cx, y) {
        const w = 240, h = 30;
        const g = this.add.graphics();
        this.drawTacticalBox(g, cx - w / 2, y, w, h, 0xf59e0b, 0.3);

        this.matchInfoText = this.add.text(cx, y + h / 2, 'INTEL: SCANNING AREA...', {
            fontSize: '10px', fontFamily: 'monospace', color: '#f59e0b', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);
    }

    // ─── TIMER PANEL ────────────────────────────────────

    createTimerPanel(rightX, y) {
        const w = 180, h = 50;
        const x = rightX - w;
        const g = this.add.graphics();
        this.drawTacticalBox(g, x, y, w, h);

        this.timerText = this.add.text(x + w - 12, y + 10, '02:00', {
            fontSize: '18px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(1, 0);

        this.scoreText = this.add.text(x + 12, y + 10, '0000', {
            fontSize: '14px', fontFamily: 'monospace', color: '#f59e0b', fontStyle: 'bold'
        });

        const iconStyle = { fontSize: '9px', color: '#4a6a4a' };
        this.add.text(x + 12, y + 32, '⚔', iconStyle);
        this.killText = this.add.text(x + 24, y + 32, '0', { fontSize: '10px', fontFamily: 'monospace', color: '#ffffff' });

        this.add.text(x + 60, y + 32, '📋', iconStyle);
        this.taskCountText = this.add.text(x + 75, y + 32, '0/0', { fontSize: '10px', fontFamily: 'monospace', color: '#ffffff' });

        // Timer warning — large centered number shown during final seconds
        const { width: screenW, height: screenH } = this.scale;
        this.timerWarning = this.add.text(screenW / 2, screenH / 2, '', {
            fontSize: '72px',
            fontFamily: '"Courier New", monospace',
            color: '#ef4444',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5).setAlpha(0).setDepth(200);
    }

    // ─── TASK TRACKER ───────────────────────────────────

    createTaskTracker(x, y) {
        const g = this.add.graphics();
        this.drawTacticalBox(g, x, y, 200, 24);
        this.add.text(x + 10, y + 6, 'CURRENT OBJECTIVES', {
            fontSize: '9px', fontFamily: 'monospace', color: '#22c55e', fontStyle: 'bold', letterSpacing: 1
        });

        this.taskItemContainer = this.add.container(x, y + 30);
    }

    // ─── MINIMAP ────────────────────────────────────────

    createMinimap(x, y) {
        const size = 110;
        const g = this.add.graphics();
        this.drawTacticalBox(g, x, y, size + 10, size + 10);

        // Radar circle
        g.lineStyle(0.5, 0x22c55e, 0.2);
        g.strokeCircle(x + 5 + size / 2, y + 5 + size / 2, size / 2);
        g.strokeCircle(x + 5 + size / 2, y + 5 + size / 2, size / 4);

        this.minimapX = x + 5;
        this.minimapY = y + 5;
        this.minimapSize = size;
        this.minimapDots = this.add.graphics();

        // Radar scan effect
        const scan = this.add.graphics();
        this.tweens.addCounter({
            from: 0, to: 360, duration: 4000, repeat: -1,
            onUpdate: (tween) => {
                const angle = tween.getValue();
                scan.clear();
                scan.lineStyle(2, 0x22c55e, 0.2);
                const rad = Phaser.Math.DegToRad(angle);
                scan.lineBetween(
                    x + 5 + size / 2, y + 5 + size / 2,
                    x + 5 + size / 2 + Math.cos(rad) * size / 2,
                    y + 5 + size / 2 + Math.sin(rad) * size / 2
                );
            }
        });
    }

    // ─── ACTION BUTTONS ─────────────────────────────────

    createActionButtons(rightX, bottomY) {
        const btnSize = 40;
        const spacing = 15;

        const actions = [
            { key: 'E', label: 'INTERACT', color: 0xf59e0b },
            { key: 'SHIFT', label: 'DASH', color: 0x3b82f6 },
            { key: 'SPACE', label: 'ATTACK', color: 0xef4444 }
        ];

        actions.forEach((act, i) => {
            const bx = rightX - (i + 1) * (btnSize + spacing);
            const by = bottomY - btnSize - 10;

            const g = this.add.graphics();
            this.drawTacticalBox(g, bx, by, btnSize, btnSize, act.color, 0.4);

            this.add.text(bx + btnSize / 2, by + 12, act.key, {
                fontSize: '12px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);

            this.add.text(bx + btnSize / 2, by + btnSize - 8, act.label, {
                fontSize: '6px', fontFamily: 'monospace', color: '#6a8a6a'
            }).setOrigin(0.5);
        });
    }

    // ─── OBJECTIVE HINT ─────────────────────────────────

    createObjectiveHint(cx, y) {
        this.objectiveHint = this.add.text(cx, y, '', {
            fontSize: '10px',
            fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#26c6da',
            fontStyle: 'bold',
            letterSpacing: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: { x: 12, y: 5 },
        }).setOrigin(0.5).setDepth(80);
    }

    // ─── PLAN PHASE OVERLAY ─────────────────────────────

    createPlanPhaseOverlay(w, h) {
        const container = this.add.container(0, 0).setDepth(100);

        const bg = this.add.graphics();
        bg.fillStyle(0x020617, 0.85);
        bg.fillRect(0, 0, w, h);

        // Holographic rings
        bg.lineStyle(1, 0x22c55e, 0.1);
        bg.strokeCircle(w / 2, h / 2, 200);
        bg.strokeCircle(w / 2, h / 2, 240);
        container.add(bg);

        const title = this.add.text(w / 2, h / 2 - 80, 'TACTICAL PLANNING PHASE', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#f59e0b', fontStyle: 'bold', letterSpacing: 8,
        }).setOrigin(0.5);
        container.add(title);

        this.planTimerText = this.add.text(w / 2, h / 2, '5', {
            fontSize: '80px',
            fontFamily: 'monospace',
            color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(this.planTimerText);

        const sub = this.add.text(w / 2, h / 2 + 70, '» ANALYZE MISSION PARAMETERS\n» ESTABLISH OPTIMAL TASK SEQUENCE', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#6a8a6a', letterSpacing: 2, align: 'center'
        }).setOrigin(0.5);
        container.add(sub);

        return container;
    }

    // ─── UPDATE (called from GameScene) ─────────────────

    updateHUD(data) {
        if (!data || !this.scene?.isActive() || !this.sys?.isActive) return;

        // Timer
        if (this.timerText && data.time) {
            this.timerText.setText(data.time);
            if (data.timeRemaining < 30) this.timerText.setColor('#ef4444');
            else if (data.timeRemaining < 60) this.timerText.setColor('#f59e0b');
            else this.timerText.setColor('#ffffff');
        }

        // Health - Segmented
        if (data.health !== undefined && this.healthBar) {
            const hp = Math.max(0, Math.min(100, data.health)) / 100;
            const hpColor = hp > 0.6 ? 0x22c55e : (hp > 0.3 ? 0xf59e0b : 0xef4444);
            this.updateSegmentedBar(this.healthBar, 60, 44, 150, 6, hp, hpColor);
        }

        // Stamina - Segmented
        if (data.stamina !== undefined && this.staminaBar) {
            const st = Math.max(0, Math.min(100, data.stamina)) / 100;
            this.updateSegmentedBar(this.staminaBar, 60, 56, 150, 6, st, 0x3b82f6);
        }

        // Kills & Score
        if (this.killText) this.killText.setText(data.kills || 0);
        if (this.scoreText) this.scoreText.setText((data.score || 0).toString().padStart(4, '0'));
        if (this.taskCountText && data.tasks) {
            this.taskCountText.setText(`${data.tasks.completed}/${data.tasks.total}`);
        }

        // Match info
        if (this.matchInfoText && data.stageName) {
            this.matchInfoText.setText(`${data.stageName.toUpperCase()}`);
        }

        // Task tracker
        if (data.tasks?.tasks) {
            this.updateTaskTracker(data.tasks.tasks);
        }

        // Minimap & Channel
        this.updateMinimap(data);
        this.updateChannelBar(data);
    }

    updateTaskTracker(tasks) {
        // Clear previous
        this.taskItemContainer.removeAll(true);

        const visible = tasks.slice(0, 5);
        visible.forEach((task, i) => {
            const ty = i * 18;
            const isComplete = task.state === 'completed';
            const isActive = task.state === 'in_progress';

            // Status icon
            const statusIcon = isComplete ? '✅' : (isActive ? '⏳' : (task.state === 'locked' ? '🔒' : '◻'));
            const sText = this.add.text(0, ty, statusIcon, { fontSize: '9px' });
            this.taskItemContainer.add(sText);

            // Task name
            const nameColor = isComplete ? '#3a5a3a' : (isActive ? '#26c6da' : '#8a9a8a');
            const nText = this.add.text(16, ty, task.name, {
                fontSize: '8px', fontFamily: '"Inter","Segoe UI",sans-serif',
                color: nameColor,
            });
            this.taskItemContainer.add(nText);

            // Points
            const pText = this.add.text(155, ty, `${task.state === 'completed' ? '✓' : task.priority + '★'}`, {
                fontSize: '7px', fontFamily: 'monospace',
                color: isComplete ? '#22c55e' : '#f59e0b',
            });
            this.taskItemContainer.add(pText);
        });
    }

    // ─── CHANNEL PROGRESS BAR ──────────────────────────────

    createChannelBar(width) {
        const barW = 240, barH = 10;
        const cx = width / 2;
        const cy = 120;

        this.channelContainer = this.add.container(cx, cy).setDepth(100).setVisible(false);

        const bg = this.add.graphics();
        this.drawTacticalBox(bg, -barW / 2 - 10, -25, barW + 20, 50, 0x22c55e, 0.2);

        this.channelTaskName = this.add.text(0, -12, 'INTERACTING...', {
            fontSize: '9px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);

        this.channelBarFill = this.add.graphics();
        this.channelContainer.add([bg, this.channelTaskName, this.channelBarFill]);

        this._channelBarW = barW;
        this._channelBarH = barH;
    }

    updateChannelBar(data) {
        if (!this.channelContainer) return;
        if (data.isChanneling && data.channelPercent !== undefined) {
            this.channelContainer.setVisible(true);
            const pct = Math.min(1, data.channelPercent);
            this.channelBarFill.clear();
            this.channelBarFill.fillStyle(0x22c55e, 0.6);
            this.channelBarFill.fillRect(-this._channelBarW / 2, 5, pct * this._channelBarW, this._channelBarH);
            if (data.channelingTaskName) this.channelTaskName.setText(data.channelingTaskName.toUpperCase());
        } else {
            this.channelContainer.setVisible(false);
        }
    }

    updateMinimap(data) {
        if (!this.minimapDots) return;
        this.minimapDots.clear();

        const mx = this.minimapX;
        const my = this.minimapY;
        const ms = this.minimapSize;

        const toMapX = (wx) => mx + (wx / 2400) * ms;
        const toMapY = (wy) => my + (wy / 1600) * ms;

        // Player dot
        if (data.playerPos) {
            const px = toMapX(data.playerPos.x);
            const py = toMapY(data.playerPos.y);
            this.minimapDots.fillStyle(0x22c55e, 1);
            this.minimapDots.fillCircle(px, py, 3);
        }

        // Agent dots
        if (data.agentPositions) {
            data.agentPositions.forEach(pos => {
                const ax = toMapX(pos.x);
                const ay = toMapY(pos.y);
                this.minimapDots.fillStyle(0xef5350, 0.8);
                this.minimapDots.fillCircle(ax, ay, 2);
            });
        }

        // Task dots
        if (data.tasks?.tasks) {
            data.tasks.tasks.forEach(task => {
                if (task.state === 'completed') return;
                const tx = toMapX(task.position.x);
                const ty = toMapY(task.position.y);
                const color = Phaser.Display.Color.HexStringToColor(task.color || '#26c6da').color;
                this.minimapDots.fillStyle(color, 0.7);
                this.minimapDots.fillRect(tx - 2, ty - 2, 4, 4);
            });
        }
    }

    // ─── TIMER WARNING ──────────────────────────────────

    showTimerWarning(seconds) {
        if (!this.timerWarning) return;
        this.timerWarning.setText(seconds);
        this.timerWarning.setAlpha(1);
        this.tweens.add({
            targets: this.timerWarning,
            alpha: 0, scaleX: 2, scaleY: 2,
            duration: 1000, ease: 'Power2',
            onComplete: () => {
                this.timerWarning.setScale(1);
            },
        });
    }

    // ─── TASK COMPLETE NOTIFICATION ─────────────────────

    showTaskComplete(taskName) {
        const { width } = this.scale;
        const note = this.add.text(width / 2, 50, `✅ ${taskName} COMPLETE`, {
            fontSize: '14px',
            fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#22c55e', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
            letterSpacing: 2,
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: note,
            alpha: 0, y: 35,
            duration: 1500, delay: 1000,
            onComplete: () => note.destroy(),
        });
    }

    // ─── CHANNEL PROGRESS BAR ───────────────────────────

    showChannelProgress(taskName, percent) {
        if (!this.channelBar) {
            const { width, height } = this.scale;
            const bw = 200;
            this.channelContainer = this.add.container(width / 2, height / 2 + 60).setDepth(95);

            const bg = this.add.graphics();
            bg.fillStyle(0x000000, 0.7);
            bg.fillRoundedRect(-bw / 2 - 10, -15, bw + 20, 40, 6);
            this.channelContainer.add(bg);

            this.channelLabel = this.add.text(0, -8, '', {
                fontSize: '9px', fontFamily: '"Inter","Segoe UI",sans-serif',
                color: '#f59e0b', fontStyle: 'bold', letterSpacing: 1,
            }).setOrigin(0.5);
            this.channelContainer.add(this.channelLabel);

            this.channelBarBg = this.add.graphics();
            this.channelBarBg.fillStyle(0x333333, 0.5);
            this.channelBarBg.fillRoundedRect(-bw / 2, 6, bw, 10, 3);
            this.channelContainer.add(this.channelBarBg);

            this.channelBar = this.add.graphics();
            this.channelContainer.add(this.channelBar);
        }

        this.channelContainer.setVisible(true);
        this.channelLabel.setText(`⏳ ${taskName}`);
        this.channelBar.clear();
        this.channelBar.fillStyle(0x26c6da, 1);
        this.channelBar.fillRoundedRect(-100, 6, percent * 200, 10, 3);

        if (percent >= 1) {
            this.time.delayedCall(300, () => {
                if (this.channelContainer) this.channelContainer.setVisible(false);
            });
        }
    }

    hideChannelProgress() {
        if (this.channelContainer) this.channelContainer.setVisible(false);
    }

    // ─── EVENT LOG (Kill Feed) ──────────────────────────

    createEventLog(rightX, bottomY) {
        this.logContainer = this.add.container(rightX, bottomY);
        this.logs = [];
        this.maxLogs = 5;
    }

    addLog(msg, color = '#ffffff') {
        const text = this.add.text(0, 0, `» ${msg.toUpperCase()}`, {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: color,
            fontStyle: 'bold',
            backgroundColor: '#00000088',
            padding: { x: 6, y: 3 }
        }).setOrigin(1, 1).setAlpha(0);

        this.logContainer.add(text);
        this.logs.unshift(text);

        this.logs.forEach((log, i) => {
            this.tweens.add({
                targets: log,
                y: -i * 20,
                alpha: 1 - (i / this.maxLogs),
                duration: 200
            });
        });

        if (this.logs.length > this.maxLogs) {
            const old = this.logs.pop();
            old.destroy();
        }

        this.time.delayedCall(4000, () => {
            if (text.active) {
                this.tweens.add({
                    targets: text,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        const idx = this.logs.indexOf(text);
                        if (idx !== -1) {
                            this.logs.splice(idx, 1);
                            text.destroy();
                        }
                    }
                });
            }
        });
    }
}
