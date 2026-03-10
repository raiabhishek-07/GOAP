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
        this.level = data?.level ?? 1;
        this.stage = data?.stage ?? 1;
    }

    create() {
        const { width, height } = this.scale;

        // ─── TOP LEFT: Player Status ───────────────────
        this.createPlayerStatus(20, 20);

        // ─── TOP CENTER: Match Info ────────────────────
        this.createMatchInfo(width / 2, 20);

        // ─── COMPASS ───────────────────────────────────
        this.createCompass(width / 2, 60);

        // ─── TOP RIGHT: Timer & Score ──────────────────
        this.createTimerPanel(width - 20, 20);

        // ─── LEFT: Task Tracker ────────────────────────
        this.createTaskTracker(20, 90);

        // ─── BOTTOM LEFT: Minimap ──────────────────────
        this.createMinimap(20, height - 140);

        // ─── BOTTOM RIGHT: Action HUD ──────────────────
        this.createActionButtons(width - 20, height - 20);

        // ─── BOTTOM CENTER: Weapon Bar ─────────────────
        this.createWeaponBar(width / 2, height - 35);

        // ─── NOTIFICATION SYSTEM ───────────────────────
        this.createEventLog(width - 20, height - 160);

        // ─── PROGRESS BARS ─────────────────────────────
        this.createChannelBar(width);

        // Scanline overlay (subtle)
        const scan = this.add.graphics();
        scan.fillStyle(0x000000, 0.1);
        for (let i = 0; i < height; i += 4) scan.fillRect(0, i, width, 1);
        scan.setScrollFactor(0).setDepth(1000).setAlpha(0.2);

        // ─── MAP CONTROLS ─────────────────────────────────
        this.setupMapControls();

        // ─── TRAINING OVERLAY ─────────────────────────────
        if (this.level === 0) {
            this.createTrainingTips(width / 2, height - 100);
            this.createSimulationControls(width - 20, 100);
        }
    }

    createSimulationControls(rightX, y) {
        const w = 150, h = 140;
        const x = rightX - w;
        const g = this.add.graphics();
        this.drawTacticalBox(g, x, y, w, h, 0x38bdf8, 0.4);

        this.add.text(x + w / 2, y + 10, 'SIM_CONTROLS', {
            fontSize: '9px', fontFamily: 'monospace', color: '#38bdf8', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);

        const buttons = [
            { label: '[T] TOGGLE TIME', action: () => this.gameScene.toggleSimulationTime() },
            { label: '[R] RESET CARS', action: () => this.gameScene.resetVehicles() },
            { label: '[F] REFILL TARGETS', action: () => this.gameScene.resetAllAgents() },
            {
                label: '[X] EXIT SIM', action: () => {
                    this.cameras.main.fadeOut(500, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.stop('GameScene');
                        this.scene.start('LevelSelectScene'); // Or Dashboard
                    });
                }
            }
        ];

        buttons.forEach((btn, i) => {
            const by = y + 35 + i * 25;
            const b = this.add.text(x + 12, by, btn.label, {
                fontSize: '8px', fontFamily: 'monospace', color: '#ffffff',
                backgroundColor: '#1e293b', padding: { x: 8, y: 4 }
            }).setInteractive({ useHandCursor: true });

            b.on('pointerdown', btn.action);
            b.on('pointerover', () => b.setColor('#38bdf8'));
            b.on('pointerout', () => b.setColor('#ffffff'));
        });

        // Setup world keys for these too
        this.input.keyboard.on('keydown-T', () => this.gameScene.toggleSimulationTime());
        this.input.keyboard.on('keydown-R', () => this.gameScene.resetVehicles());
        this.input.keyboard.on('keydown-F', () => this.gameScene.resetAllDummies());
    }

    createTrainingTips(cx, y) {
        const text = 'ACTIVE_TUTORIAL: [1-4] SWITCH WEAPONS | [SHIFT] DASH | [SPACE] ATTACK | [E] INTERACT';
        this.trainingTips = this.add.text(cx, y, text, {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#f59e0b',
            backgroundColor: '#000000aa',
            padding: { x: 15, y: 8 },
            letterSpacing: 2
        }).setOrigin(0.5).setAlpha(0.8);

        this.tweens.add({
            targets: this.trainingTips,
            alpha: 0.4,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    // ─── MAP CONTROLS ─────────────────────────────────────

    setupMapControls() {
        // Keyboard shortcut for map
        this.input.keyboard.on('keydown-M', () => {
            this.openMap();
        });

        // Keyboard shortcut for instructions
        this.input.keyboard.on('keydown-I', () => {
            this.toggleInstructions();
        });

        // Click on minimap to open full map
        if (this.minimapContainer) {
            this.minimapContainer.setInteractive();
            this.minimapContainer.on('pointerdown', () => {
                this.openMap();
            });
        }
    }

    openMap() {
        // Pause game scene
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.scene.pause();
        }

        // Get player data for map with extra safety
        let playerData = { x: 0, y: 0, health: 100 };

        if (gameScene && gameScene.player) {
            playerData = {
                x: gameScene.player.x || 0,
                y: gameScene.player.y || 0,
                health: 100 // Default health
            };

            // Try to get health from different possible locations
            if (gameScene.player.playerData && typeof gameScene.player.playerData.health === 'number') {
                playerData.health = gameScene.player.playerData.health;
            } else if (gameScene.player.health && typeof gameScene.player.health === 'number') {
                playerData.health = gameScene.player.health;
            } else if (gameScene.player.data && gameScene.player.data.health) {
                playerData.health = gameScene.player.data.health;
            }
        }

        // Open map scene
        this.scene.launch('GameMap', {
            playerData: playerData,
            worldSize: 2000,
            level: this.level,
            stage: this.stage
        });
    }

    // ─── INSTRUCTION PROTOCOLS (I KEY) ──────────────────

    toggleInstructions() {
        if (!this.instructionsPanel) {
            this.createInstructionsPanel();
        }

        if (this.instructionsPanel.alpha > 0) {
            this.tweens.add({ targets: this.instructionsPanel, alpha: 0, scale: 0.95, duration: 200, ease: 'Power2' });
            if (this.gameScene) this.gameScene.inputFrozen = false;
        } else {
            this.instructionsPanel.setAlpha(0);
            this.instructionsPanel.setScale(0.95);
            this.tweens.add({ targets: this.instructionsPanel, alpha: 1, scale: 1, duration: 200, ease: 'Back.out' });
            if (this.gameScene) this.gameScene.inputFrozen = true;
        }
    }

    createInstructionsPanel() {
        const { width, height } = this.scale;
        this.instructionsPanel = this.add.container(width / 2, height / 2).setDepth(2000);
        this.instructionsPanel.setAlpha(0);

        const w = 460, h = 320;
        const x = -w / 2, y = -h / 2;

        const g = this.add.graphics();
        g.fillStyle(0x0f172a, 0.95);
        g.fillRect(x, y, w, h);
        this.drawTacticalBox(g, x, y, w, h, 0x38bdf8, 1);

        const title = this.add.text(0, y + 30, 'TACTICAL PROTOCOLS / CONTROLS', {
            fontSize: '18px', fontFamily: 'monospace', color: '#38bdf8', fontStyle: 'bold', letterSpacing: 2
        }).setOrigin(0.5);

        const l1 = this.add.graphics();
        l1.lineStyle(1, 0x38bdf8, 0.4);
        l1.lineBetween(-200, y + 50, 200, y + 50);

        const contentLeft = `MOVEMENT & COMBAT
-----------------
[ WASD / ARROWS ]
  Move Operative
[ SHIFT ] 
  Tactical Dash
[ MOUSE L-CLICK ] 
  Fire Weapon
[ R / G ]
  Reload / Drop Weapon
[ 1 - 4 ]
  Select Weapon`;

        const contentRight = `INTERACTION & SYSTEMS
---------------------
[ E ]
  Interact / Loot Object
[ Q ]
  Channel Heal (5s)
[ M ]
  Secure Map View
[ T / R / F ]
  Simulation Time/Reset
[ I ]
  Toggle Protocols
[ ESC ]
  Pause Mission`;

        const tLeft = this.add.text(-200, y + 70, contentLeft, {
            fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1', align: 'left', lineHeight: 1.8
        });

        const tRight = this.add.text(20, y + 70, contentRight, {
            fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1', align: 'left', lineHeight: 1.8
        });

        this.instructionsPanel.add([g, title, l1, tLeft, tRight]);
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

        const label = this.level === 0 ? 'SIM_OPERATIVE' : 'OPERATIVE_07';
        this.add.text(x + 12, y + 8, label, {
            fontSize: '10px', fontFamily: 'monospace', color: this.level === 0 ? '#f59e0b' : '#ffffff', fontStyle: 'bold', letterSpacing: 2
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

    // ─── COMPASS ────────────────────────────────────────

    createCompass(cx, y) {
        const w = 400, h = 30;
        this.compassContainer = this.add.container(cx, y);

        const bg = this.add.graphics();
        // Dark slightly rounded/bordered rect for compass background
        bg.fillStyle(0x1e293b, 0.9);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
        bg.lineStyle(2, 0x334155, 1);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

        // Center Triangle pointer (orange/yellow)
        const pointer = this.add.triangle(0, -h / 2 + 2, 0, 0, -6, -8, 6, -8, 0xf59e0b).setOrigin(0);

        // A clipping mask for the text so it doesn't bleed out of the box
        const maskShape = this.add.graphics();
        maskShape.fillStyle(0xffffff, 1);
        maskShape.fillRect(cx - w / 2 + 5, y - h / 2, w - 10, h);
        const mask = maskShape.createGeometryMask();
        maskShape.setVisible(false); // Hide the actual geometry used for mapping

        this.compassTextContainer = this.add.container(0, 0);
        this.compassTextContainer.setMask(mask);

        this.compassContainer.add([bg, this.compassTextContainer, pointer]);

        // Create the ticks and numbers
        this.compassPixelsPerDegree = 4; // 4 pixels per degree to give wide pacing

        for (let b = -360; b <= 720; b += 15) {
            let bearing = (b % 360 + 360) % 360;
            let textStr = bearing.toString();
            let isCardinal = false;
            let isSub = false;

            if (bearing === 0) { textStr = 'N'; isCardinal = true; }
            else if (bearing === 90) { textStr = 'E'; isCardinal = true; }
            else if (bearing === 180) { textStr = 'S'; isCardinal = true; }
            else if (bearing === 270) { textStr = 'W'; isCardinal = true; }
            else if (bearing === 45) { textStr = 'NE'; isSub = true; }
            else if (bearing === 135) { textStr = 'SE'; isSub = true; }
            else if (bearing === 225) { textStr = 'SW'; isSub = true; }
            else if (bearing === 315) { textStr = 'NW'; isSub = true; }

            const xPos = b * this.compassPixelsPerDegree;

            const labelText = this.add.text(xPos, 0, textStr, {
                fontSize: isCardinal ? '18px' : (isSub ? '12px' : '9px'),
                fontFamily: 'monospace',
                color: isCardinal ? '#ffffff' : (isSub ? '#f8fafc' : '#64748b'),
                fontStyle: isCardinal ? 'bold' : 'normal'
            }).setOrigin(0.5);

            if (isCardinal) {
                labelText.setStroke('#000000', 4);
                labelText.setShadow(2, 2, '#000000', 2, true, false);
            }

            this.compassTextContainer.add(labelText);
        }
    }

    updateCompass(aimAngle) {
        if (!this.compassTextContainer) return;
        // Convert Phaser aimAngle (-180 to 180) to Bearing (0 to 360, where 0 is UP)
        let bearing = (aimAngle + 90) % 360;
        if (bearing < 0) bearing += 360;

        // Shift text container left so the current bearing is directly under the pointer (x=0)
        this.compassTextContainer.x = -bearing * this.compassPixelsPerDegree;
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
            { key: 'M', label: 'MAP', color: 0x22c55e },
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

    // ─── WEAPON BAR ─────────────────────────────────────

    createWeaponBar(cx, y) {
        const pw = 200, ph = 50;

        this.weaponBarContainer = this.add.container(cx, y);

        // Main Panel bg
        const bg = this.add.graphics();
        bg.fillStyle(0x0f172a, 0.85); // Slate 900
        bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 6);
        bg.lineStyle(2, 0x334155, 0.8);
        bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 6);
        this.weaponBarContainer.add(bg);

        // Weapon slots - 2 slots only
        this.weaponSlots = [];
        for (let i = 0; i < 2; i++) {
            const sx = -pw / 2 + 10 + i * 55;

            // Slot Background
            const slotBg = this.add.graphics();
            slotBg.fillStyle(0x1e293b, 0.9);
            slotBg.fillRoundedRect(sx, -ph / 2 + 8, 50, 24, 4);
            this.weaponBarContainer.add(slotBg);

            // Slot Border (will glow when active)
            const slotBorder = this.add.graphics();
            slotBorder.lineStyle(1, 0x475569, 0.5);
            slotBorder.strokeRoundedRect(sx, -ph / 2 + 8, 50, 24, 4);
            this.weaponBarContainer.add(slotBorder);

            // Slot Keybind Number
            const numText = this.add.text(sx + 4, -ph / 2 + 10, `${i + 1}`, {
                fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#64748b',
            });
            this.weaponBarContainer.add(numText);

            // Weapon Name 
            const nameText = this.add.text(sx + 25, -ph / 2 + 20, '...', {
                fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#94a3b8',
            }).setOrigin(0.5, 0.5);
            this.weaponBarContainer.add(nameText);

            this.weaponSlots.push({ bg: slotBg, border: slotBorder, numText, nameText });
        }

        // ── AMMO DISPLAY ──
        const amX = pw / 2 - 30;

        // Large Mag Ammo text (Right aligned)
        this.ammoMainText = this.add.text(amX - 10, -ph / 2 + 12, '--', {
            fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#f8fafc',
        }).setOrigin(1, 0);
        this.weaponBarContainer.add(this.ammoMainText);

        // Divider
        const sep = this.add.text(amX - 5, -ph / 2 + 16, '/', {
            fontSize: '14px', fontFamily: 'monospace', color: '#64748b',
        }).setOrigin(0.5, 0);
        this.weaponBarContainer.add(sep);

        // Reserve Ammo
        this.ammoReserveText = this.add.text(amX + 2, -ph / 2 + 18, '--', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#cbd5e1',
        }).setOrigin(0, 0);
        this.weaponBarContainer.add(this.ammoReserveText);

        // Equipped Weapon Name Label (below slots)
        this.weaponNameLabel = this.add.text(0, -ph / 2 + 36, 'UNARMED', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#fbbf24', letterSpacing: 2,
        }).setOrigin(0.5, 0);
        this.weaponBarContainer.add(this.weaponNameLabel);
    }

    updateWeaponBar(weapons, activeIndex) {
        if (!this.weaponBarContainer) return;

        weapons = weapons || [];

        if (weapons.length === 0) {
            this.weaponNameLabel.setText('UNARMED');
            this.ammoMainText.setText('--');
            this.ammoReserveText.setText('--');
        } else {
            const activeWep = weapons[activeIndex];
            this.weaponNameLabel.setText(activeWep ? activeWep.name.toUpperCase() : 'UNARMED');
            if (activeWep) {
                this.ammoMainText.setText(`${activeWep.ammo || 30}`);
                this.ammoReserveText.setText(`${activeWep.reserve || '--'}`);
            }
        }

        // Weapon slots
        for (let i = 0; i < 2; i++) {
            const ws = this.weaponSlots[i];
            const wep = weapons[i];

            if (wep) {
                ws.nameText.setText(wep.name.substring(0, 6).toUpperCase());
                ws.nameText.setColor('#f8fafc');
            } else {
                ws.nameText.setText('...');
                ws.nameText.setColor('#334155');
            }

            // Active slot highlight (Premium Glow)
            const sx = -200 / 2 + 10 + i * 55;
            const ph = 50;
            if (i === activeIndex && weapons.length > 0) {
                ws.numText.setColor('#38bdf8'); // Bright Sky blue

                ws.border.clear();
                ws.border.lineStyle(2, 0x38bdf8, 1);
                ws.border.strokeRoundedRect(sx, -ph / 2 + 8, 50, 24, 4);

                ws.bg.clear();
                ws.bg.fillStyle(0x0284c7, 0.2); // Light blue tint
                ws.bg.fillRoundedRect(sx, -ph / 2 + 8, 50, 24, 4);
            } else {
                ws.numText.setColor('#64748b');

                ws.border.clear();
                ws.border.lineStyle(1, 0x475569, 0.5);
                ws.border.strokeRoundedRect(sx, -ph / 2 + 8, 50, 24, 4);

                ws.bg.clear();
                ws.bg.fillStyle(0x1e293b, 0.9);
                ws.bg.fillRoundedRect(sx, -ph / 2 + 8, 50, 24, 4);
            }
        }
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

        // Weapon Bar Update
        if (data.weapons !== undefined) {
            this.updateWeaponBar(data.weapons, data.activeWeaponIndex || 0);
        }

        // Compass 
        if (data.aimAngle !== undefined) this.updateCompass(data.aimAngle);
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
