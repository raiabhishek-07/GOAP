// ============================================================
// OpenWorldHUD.js — Professional Game HUD
// Bottom-anchored layout: Health | Weapons | Minimap
// Premium glassmorphism, micro-animations, damage indicators
// ============================================================

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class OpenWorldHUD extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'OpenWorldHUD' });
    }

    init(data) {
        this.playerRef = data.player;
        this.worldSize = data.worldSize || 16000;
        this.weaponSystem = data.weaponSystem || null;
        this.vehicleSystem = data.vehicleSystem || null;
        this.killFeedItems = [];
        this.damageIndicators = [];
        this._prevHealth = 100;
    }

    create() {
        const { width: W, height: H } = this.scale;

        // Panel style constants
        this.PANEL_BG = 0x080f1c;
        this.PANEL_ALPHA = 0.75;
        this.PANEL_BORDER = 0x3b82f6;
        this.ACCENT = 0x60a5fa;

        // ─── BOTTOM-LEFT: Health Panel ───────────────────
        this._createHealthPanel(W, H);

        // ─── BOTTOM-CENTER: Weapon Bar ───────────────────
        this._createWeaponBar(W, H);

        // ─── BOTTOM-RIGHT: Minimap ───────────────────────
        this._createMinimap(W, H);

        // ─── TOP-CENTER: Compass ─────────────────────────
        this._createCompass(W);

        // ─── TOP-RIGHT: Kill Counter + Ping ──────────────
        this._createKillCounter(W);

        // ─── TOP-LEFT: Kill Feed ─────────────────────────
        this._createKillFeed();

        // ─── BOTTOM-CENTER: Vehicle Panel (hidden) ───────
        this._createVehiclePanel(W, H);

        // ─── Damage Direction Container ──────────────────
        this._createDamageDirectionSystem(W, H);

        // ─── Low Health Vignette ─────────────────────────
        this._createLowHealthVignette(W, H);
    }

    update() {
        if (!this.playerRef || !this.playerRef.active) return;
        if (!this.sys?.isActive) return;

        const d = this.playerRef.playerData;

        this._updateHealthPanel(d);
        this._updateWeaponBar();
        this._updateMinimap();
        this._updateCompass();
        this._updateKillCounter();
        this._updateVehiclePanel();
        this._updateLowHealthVignette(d);
        this._updateDamageIndicators();

        // Detect damage for direction indicator
        if (d.health < this._prevHealth) {
            this._showDamageDirection();
        }
        this._prevHealth = d.health;
    }

    // ═══════════════════════════════════════════════════════
    // 1. HEALTH PANEL — Bottom Left
    // ═══════════════════════════════════════════════════════

    _createHealthPanel(W, H) {
        const x = 20, y = H - 85;
        const pw = 200, ph = 65;

        // Premium Dark Glass Panel
        const bg = this.add.graphics();
        bg.fillStyle(0x0f172a, 0.85); // Slate 900
        bg.fillRoundedRect(x, y, pw, ph, 8);
        bg.lineStyle(2, 0x334155, 0.8); // Slate 700 border
        bg.strokeRoundedRect(x, y, pw, ph, 8);

        // Player name string with strong tactical aesthetic
        this.add.text(x + 12, y + 8, this.playerRef?.playerData?.name || 'OPERATIVE_07', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#94a3b8', letterSpacing: 2,
        });

        // ── HEALTH ──
        this.add.text(x + 12, y + 23, 'HP', { fontSize: '9px', fontFamily: 'monospace', color: '#cbd5e1', fontStyle: 'bold' });
        this.add.rectangle(x + 30, y + 25, 125, 10, 0x1e293b).setOrigin(0, 0); // Bg
        this.healthFill = this.add.rectangle(x + 30, y + 25, 125, 10, 0x22c55e).setOrigin(0, 0); // Fill

        // Health segmented overlay (cool tactical detail)
        const segs = this.add.graphics();
        segs.lineStyle(1, 0x0f172a, 0.5);
        for (let i = 1; i < 5; i++) segs.lineBetween(x + 30 + (i * 25), y + 25, x + 30 + (i * 25), y + 35);

        this.healthText = this.add.text(x + 160, y + 23, '100', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#22c55e',
        }).setOrigin(0, 0);

        this.healthFlash = this.add.rectangle(x + 30, y + 25, 125, 10, 0xff4444, 0)
            .setOrigin(0, 0).setBlendMode(Phaser.BlendModes.ADD);

        // ── STAMINA ──
        this.add.text(x + 12, y + 38, 'ST', { fontSize: '9px', fontFamily: 'monospace', color: '#cbd5e1', fontStyle: 'bold' });
        this.add.rectangle(x + 30, y + 39, 125, 6, 0x1e293b).setOrigin(0, 0);
        this.staminaFill = this.add.rectangle(x + 30, y + 39, 125, 6, 0x3b82f6).setOrigin(0, 0);

        // ── STEALTH / NOISE ──
        this.add.text(x + 12, y + 50, 'NS', { fontSize: '9px', fontFamily: 'monospace', color: '#cbd5e1', fontStyle: 'bold' });
        this.add.rectangle(x + 30, y + 52, 125, 3, 0x1e293b).setOrigin(0, 0);
        this.noiseFill = this.add.rectangle(x + 30, y + 52, 0, 3, 0xf59e0b).setOrigin(0, 0);

        // ── Inventory / Weight Readout ──
        // Positioned neatly outside the main panel or tucked in top right
        this.invText = this.add.text(x + pw + 10, y + 25, 'INV: 0/8', {
            fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold', color: '#cbd5e1'
        }).setOrigin(0, 0.5);

        this.weightText = this.add.text(x + pw + 10, y + 40, '0.0 kg', {
            fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#f8fafc'
        }).setOrigin(0, 0.5);
    }

    _updateHealthPanel(d) {
        const healthPct = Math.max(0, d.health / d.maxHealth);
        const targetWidth = 120 * healthPct;

        // Smooth lerp health bar
        const current = this.healthFill.width;
        this.healthFill.width = current + (targetWidth - current) * 0.12;

        this.healthText.setText(`${Math.ceil(d.health)}`);

        // Color based on health
        if (healthPct > 0.6) {
            this.healthFill.fillColor = 0x22c55e;
            this.healthText.setColor('#22c55e');
        } else if (healthPct > 0.3) {
            this.healthFill.fillColor = 0xf59e0b;
            this.healthText.setColor('#f59e0b');
        } else {
            this.healthFill.fillColor = 0xef4444;
            this.healthText.setColor('#ef4444');
        }

        // Damage flash
        if (d.health < this._prevHealth) {
            this.healthFlash.setAlpha(0.8);
            this.tweens.add({
                targets: this.healthFlash,
                alpha: 0, duration: 300,
            });
        }

        // Stamina
        const staminaPct = d.stamina / d.maxStamina;
        this.staminaFill.width = 120 * staminaPct;

        // Noise & Weight
        const mainScene = this.scene.get('OpenWorldScene');
        if (mainScene) {
            this.noiseFill.width = 120 * (mainScene.noiseLevel || 0);
            this.noiseFill.fillColor = mainScene.noiseLevel > 0.7 ? 0xef4444 : 0xf59e0b;

            // Update Weight/Inv
            const w = mainScene.totalWeight || 0;
            const slotsUsed = mainScene.inventory?.length || 0;
            const slotsTotal = mainScene.inventorySlots || 8;
            this.weightText.setText(`${w.toFixed(1)} kg`);
            this.invText.setText(`INV ${slotsUsed}/${slotsTotal}`);

            this.weightText.setColor(w > 80 ? '#ef4444' : w > 40 ? '#f59e0b' : '#cbd5e1');
        }
    }

    // ═══════════════════════════════════════════════════════
    // 2. WEAPON BAR — Bottom Center
    // ═══════════════════════════════════════════════════════

    _createWeaponBar(W, H) {
        const cx = W / 2;
        const y = H - 85;
        const pw = 300, ph = 65;

        this.weaponBarContainer = this.add.container(cx, y);

        // Main Panel bg
        const bg = this.add.graphics();
        bg.fillStyle(0x0f172a, 0.85); // Slate 900
        bg.fillRoundedRect(-pw / 2, 0, pw, ph, 8);
        bg.lineStyle(2, 0x334155, 0.8);
        bg.strokeRoundedRect(-pw / 2, 0, pw, ph, 8);
        this.weaponBarContainer.add(bg);

        // Weapon slots
        this.weaponSlots = [];
        for (let i = 0; i < 3; i++) {
            const sx = -pw / 2 + 15 + i * 65;

            // Slot Background
            const slotBg = this.add.graphics();
            slotBg.fillStyle(0x1e293b, 0.9);
            slotBg.fillRoundedRect(sx, 8, 58, 28, 4);
            this.weaponBarContainer.add(slotBg);

            // Slot Border (will glow when active)
            const slotBorder = this.add.graphics();
            slotBorder.lineStyle(2, 0x475569, 0.5);
            slotBorder.strokeRoundedRect(sx, 8, 58, 28, 4);
            this.weaponBarContainer.add(slotBorder);

            // Slot Keybind Number
            const numText = this.add.text(sx + 6, 10, `${i + 1}`, {
                fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#64748b',
            });
            this.weaponBarContainer.add(numText);

            // Weapon Name 
            const nameText = this.add.text(sx + 28, 22, '---', {
                fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
                color: '#94a3b8',
            }).setOrigin(0.5, 0.5);
            this.weaponBarContainer.add(nameText);

            this.weaponSlots.push({ bg: slotBg, border: slotBorder, numText, nameText });
        }

        // ── AMMO DISPLAY ──
        const amX = pw / 2 - 20;

        // Large Mag Ammo text (Right aligned)
        this.ammoMainText = this.add.text(amX - 35, 12, '--', {
            fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#f8fafc',
        }).setOrigin(1, 0);
        this.weaponBarContainer.add(this.ammoMainText);

        // Divider
        const sep = this.add.text(amX - 30, 20, '/', {
            fontSize: '16px', fontFamily: 'monospace', color: '#64748b',
        }).setOrigin(0.5, 0);
        this.weaponBarContainer.add(sep);

        // Reserve Ammo
        this.ammoReserveText = this.add.text(amX - 22, 24, '--', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#cbd5e1',
        }).setOrigin(0, 0);
        this.weaponBarContainer.add(this.ammoReserveText);

        // Equipped Weapon Name Label (below slots)
        this.weaponNameLabel = this.add.text(0, 42, 'UNARMED', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#fbbf24', letterSpacing: 2,
        }).setOrigin(0.5, 0);
        this.weaponBarContainer.add(this.weaponNameLabel);

        // Reload Bar
        this.reloadBarBg = this.add.rectangle(-pw / 2 + 15, 55, pw - 30, 4, 0x1e293b)
            .setOrigin(0, 0).setVisible(false);
        this.weaponBarContainer.add(this.reloadBarBg);

        this.reloadBarFill = this.add.rectangle(-pw / 2 + 15, 55, 0, 4, 0xf59e0b)
            .setOrigin(0, 0).setVisible(false);
        this.weaponBarContainer.add(this.reloadBarFill);

        this.reloadLabel = this.add.text(0, 52, 'RELOADING', {
            fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#f59e0b', letterSpacing: 3,
        }).setOrigin(0.5, 0).setVisible(false);
        this.weaponBarContainer.add(this.reloadLabel);
    }

    _updateWeaponBar() {
        if (!this.weaponSystem) return;

        const data = this.weaponSystem.getHUDData();
        const isDriving = this.vehicleSystem?.isDriving();

        // Hide weapon bar when driving
        this.weaponBarContainer.setVisible(!isDriving);

        if (isDriving) return;

        // Update weapon name
        this.weaponNameLabel.setText(data.weaponName);

        // Ammo
        if (data.weaponName === 'UNARMED') {
            this.ammoMainText.setText('--');
            this.ammoReserveText.setText('--');
            this.ammoMainText.setColor('#475569');
        } else {
            this.ammoMainText.setText(`${data.magAmmo}`);
            this.ammoReserveText.setText(`${data.reserveAmmo}`);
            // Low ammo warning
            this.ammoMainText.setColor(data.magAmmo > 5 ? '#f8fafc' : '#ef4444');
        }

        // Weapon slots
        data.slots.forEach((slot, i) => {
            if (!this.weaponSlots[i]) return;
            const ws = this.weaponSlots[i];
            const display = slot.id ? slot.name.replace(' ', '\n') : '---'; // Break name into two lines for better visual fit
            ws.nameText.setText(display);

            // Active slot highlight (Premium Glow)
            const sx = -150 + 15 + i * 65; // Corrected to match _createWeaponBar offset
            if (slot.active) {
                ws.nameText.setColor('#f8fafc');
                ws.numText.setColor('#38bdf8'); // Bright Sky blue

                // Active slot glow box
                ws.border.clear();
                ws.border.lineStyle(2, 0x38bdf8, 1);
                ws.border.strokeRoundedRect(sx, 8, 58, 28, 4);

                // Add fill underneath
                ws.bg.clear();
                ws.bg.fillStyle(0x0284c7, 0.2); // Light blue tint
                ws.bg.fillRoundedRect(sx, 8, 58, 28, 4);
            } else {
                ws.nameText.setColor(slot.id ? '#94a3b8' : '#334155');
                ws.numText.setColor('#64748b');

                // Inactive slot geometry
                ws.border.clear();
                ws.border.lineStyle(2, 0x475569, 0.5);
                ws.border.strokeRoundedRect(sx, 8, 58, 28, 4);

                // Default dark fill
                ws.bg.clear();
                ws.bg.fillStyle(0x1e293b, 0.9);
                ws.bg.fillRoundedRect(sx, 8, 58, 28, 4);
            }
        });

        // Reload indicator
        const isReloading = data.isReloading;
        this.reloadBarBg.setVisible(isReloading);
        this.reloadBarFill.setVisible(isReloading);
        this.reloadLabel.setVisible(isReloading);
    }

    // ═══════════════════════════════════════════════════════
    // 3. MINIMAP — Bottom Right (Circular)
    // ═══════════════════════════════════════════════════════

    _createMinimap(W, H) {
        const size = 140; // Slightly larger
        const x = W - size - 25;
        const y = H - size - 25; // Adjusted spacing
        this.mmSize = size;
        this.mmX = x;
        this.mmY = y;

        this.mmContainer = this.add.container(0, 0);

        // Circular Tactical Mask background
        const mmBg = this.add.graphics();
        mmBg.fillStyle(0x0f172a, 0.95); // Deep Slate
        mmBg.fillCircle(x + size / 2, y + size / 2, size / 2);
        mmBg.lineStyle(3, 0x334155, 0.9); // Sturdy border
        mmBg.strokeCircle(x + size / 2, y + size / 2, size / 2);

        // Interactive hit area to open Full Map
        const hitArea = new Phaser.Geom.Circle(x + size / 2, y + size / 2, size / 2);
        mmBg.setInteractive(hitArea, Phaser.Geom.Circle.Contains, { useHandCursor: true });
        mmBg.on('pointerdown', () => {
            this._toggleFullMap(W, H);
        });

        this.mmContainer.add(mmBg);

        // Inner Grid lines
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x10b981, 0.15); // Emerald tech green
        const cx = x + size / 2, cy = y + size / 2, r = size / 2;
        for (let d = r / 4; d <= r; d += r / 4) {
            grid.strokeCircle(cx, cy, d);
        }
        grid.lineBetween(cx - r, cy, cx + r, cy);
        grid.lineBetween(cx, cy - r, cx, cy + r);
        this.mmContainer.add(grid);

        // Compass labels around edge
        const compassLabels = ['N', 'E', 'S', 'W'];
        const compassAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
        this.mmCompassLabels = [];
        for (let i = 0; i < 4; i++) {
            const lx = cx + Math.cos(compassAngles[i]) * (r + 14);
            const ly = cy + Math.sin(compassAngles[i]) * (r + 14);
            const label = this.add.text(lx, ly, compassLabels[i], {
                fontSize: compassLabels[i] === 'N' ? '12px' : '9px',
                fontFamily: 'monospace', fontStyle: 'bold',
                color: compassLabels[i] === 'N' ? '#ef4444' : '#64748b',
            }).setOrigin(0.5);
            this.mmContainer.add(label);
            this.mmCompassLabels.push(label);
        }

        // Player arrow (Bright Emerald)
        this.mmPlayerArrow = this.add.graphics();
        this.mmPlayerArrow.fillStyle(0x10b981, 1);
        this.mmPlayerArrow.fillTriangle(0, -6, -4, 5, 4, 5); // Slightly sharper
        this.mmPlayerArrow.setPosition(cx, cy);
        this.mmContainer.add(this.mmPlayerArrow);

        // Dots layer
        this.mmDots = this.add.graphics();
        this.mmContainer.add(this.mmDots);

        // Bottom Label Badge
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x0f172a, 0.9);
        badgeBg.fillRoundedRect(x + size / 2 - 40, y + size + 6, 80, 16, 4);
        badgeBg.lineStyle(1, 0x334155, 0.8);
        badgeBg.strokeRoundedRect(x + size / 2 - 40, y + size + 6, 80, 16, 4);
        this.mmContainer.add(badgeBg);

        this.add.text(x + size / 2, y + size + 14, 'RADAR', {
            fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#94a3b8', letterSpacing: 2,
        }).setOrigin(0.5);

        // Top Right Time Indicator
        const timeBg = this.add.graphics();
        timeBg.fillStyle(0x0f172a, 0.85);
        timeBg.fillRoundedRect(x + size - 15, y - 5, 40, 18, 4);
        timeBg.lineStyle(1, 0x334155, 0.8);
        timeBg.strokeRoundedRect(x + size - 15, y - 5, 40, 18, 4);
        this.mmContainer.add(timeBg);

        this.timeText = this.add.text(x + size + 5, y + 4, '12:00', {
            fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#fbbf24',
        }).setOrigin(0.5, 0.5);
    }

    _updateMinimap() {
        if (!this.mmContainer) return;

        const worldSize = this.worldSize;
        const size = this.mmSize;
        const cx = this.mmX + size / 2;
        const cy = this.mmY + size / 2;
        const scale = size / worldSize;
        const r = size / 2;

        // Player position on minimap
        const isDriving = this.vehicleSystem?.isDriving();
        const px = isDriving ? this.vehicleSystem.activeVehicle?.x || 0 : this.playerRef.x;
        const py = isDriving ? this.vehicleSystem.activeVehicle?.y || 0 : this.playerRef.y;

        // Player arrow rotation
        this.mmPlayerArrow.setRotation(this.playerRef.rotation || 0);

        // Draw dots
        this.mmDots.clear();

        // Enemy dots (pulsing)
        const pulse = 0.5 + Math.sin(this.time.now / 500) * 0.3;
        const mainScene = this.scene.get('OpenWorldScene');
        if (mainScene?.aiAgents) {
            for (const agent of mainScene.aiAgents) {
                if (!agent.active) continue;
                const dist = Math.sqrt((agent.x - px) ** 2 + (agent.y - py) ** 2);
                if (dist > 3000) continue;
                const dotX = cx + (agent.x - px) * scale;
                const dotY = cy + (agent.y - py) * scale;
                // Clip to circle
                const dFromCenter = Math.sqrt((dotX - cx) ** 2 + (dotY - cy) ** 2);
                if (dFromCenter < r - 3) {
                    this.mmDots.fillStyle(0xef4444, pulse + 0.3);
                    this.mmDots.fillCircle(dotX, dotY, 2.5);
                }
            }
        }

        // Vehicle dots (blue squares)
        if (mainScene?.vehicleSystem) {
            for (const v of mainScene.vehicleSystem.vehicles) {
                if (!v.active || v.vehicleData.occupied) continue;
                const dist = Math.sqrt((v.x - px) ** 2 + (v.y - py) ** 2);
                if (dist > 3000) continue;
                const dotX = cx + (v.x - px) * scale;
                const dotY = cy + (v.y - py) * scale;
                const dFromCenter = Math.sqrt((dotX - cx) ** 2 + (dotY - cy) ** 2);
                if (dFromCenter < r - 3) {
                    this.mmDots.fillStyle(0x3b82f6, 0.7);
                    this.mmDots.fillRect(dotX - 2, dotY - 2, 4, 4);
                }
            }
        }

        // Loot dots (small yellow)
        if (mainScene?.lootItems) {
            for (const loot of mainScene.lootItems) {
                if (!loot.active) continue;
                const dist = Math.sqrt((loot.sprite.x - px) ** 2 + (loot.sprite.y - py) ** 2);
                if (dist > 1500) continue;
                const dotX = cx + (loot.sprite.x - px) * scale;
                const dotY = cy + (loot.sprite.y - py) * scale;
                const dFromCenter = Math.sqrt((dotX - cx) ** 2 + (dotY - cy) ** 2);
                if (dFromCenter < r - 3) {
                    this.mmDots.fillStyle(0xfbbf24, 0.4);
                    this.mmDots.fillCircle(dotX, dotY, 1.5);
                }
            }
        }

        // Update Time String
        if (mainScene && mainScene.gameTime !== undefined) {
            const totalMs = mainScene.gameTime;
            const mins = Math.floor(totalMs / 60000) % 24;
            const secs = Math.floor((totalMs % 60000) / 1000);
            this.timeText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
            const isNight = mainScene.timeOverlay && mainScene.timeOverlay.fillAlpha > 0.1;
            this.timeText.setColor(isNight ? '#94a3b8' : '#fbbf24');
        }

        if (this.fullMapContainer && this.fullMapContainer.visible) {
            this._updateFullMap(px, py);
        }
    }

    _toggleFullMap(W, H) {
        if (this.fullMapContainer) {
            const isVisible = !this.fullMapContainer.visible;
            this.fullMapContainer.setVisible(isVisible);
            this.mmContainer.setVisible(!isVisible);

            if (isVisible) {
                const px = this.playerRef?.x || 0;
                const py = this.playerRef?.y || 0;
                this._updateFullMap(px, py);
            }
            return;
        }

        this.mmContainer.setVisible(false);

        // Create Full Map overlay and force it to the absolute top depth
        this.fullMapContainer = this.add.container(0, 0).setDepth(9999);

        // Dark overlay background (interactive to close)
        const overlay = this.add.graphics();
        overlay.fillStyle(0x020617, 0.6); // Softer dark backdrop
        overlay.fillRect(0, 0, W, H);

        // Ensure the entire screen area catches the pointerdown event exactly
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
        overlay.on('pointerdown', (pointer) => {
            // Stop propagation so it doesn't trigger the game scene behind it
            pointer.event.stopPropagation();
            this.fullMapContainer.setVisible(false);
            this.mmContainer.setVisible(true);
        });

        this.fullMapContainer.add(overlay);

        const mapSize = Math.min(W, H) * 0.9;
        const cx = W / 2;
        const cy = H / 2;

        this.fmSize = mapSize;
        this.fmX = cx - mapSize / 2;
        this.fmY = cy - mapSize / 2;

        // ─── MAP BACKGROUND (PARCHMENT) ───
        const mapBg = this.add.graphics();
        mapBg.fillStyle(0xede6d8, 1); // Light parchment beige
        mapBg.fillRect(this.fmX, this.fmY, mapSize, mapSize);
        this.fullMapContainer.add(mapBg);

        const mapContent = this.add.container(0, 0);
        this.fullMapContainer.add(mapContent);

        const maskShape = this.add.graphics();
        maskShape.fillStyle(0xffffff, 1);
        maskShape.fillRect(this.fmX, this.fmY, mapSize, mapSize);
        maskShape.setVisible(false);
        mapContent.setMask(maskShape.createGeometryMask());

        // ─── GENERATE WORLD TERRAIN ───
        const mainScene = this.scene.get('OpenWorldScene');
        if (mainScene && mainScene.worldGen) {
            const terrain = this.add.graphics();
            mapContent.add(terrain);

            const wg = mainScene.worldGen;
            const totalTiles = 500; // Expected WORLD_TILES
            const gridSize = 32;    // Map grid chunks (~500/16)
            const cellSize = mapSize / gridSize;

            if (wg.biomeMap) {
                // PASS 1: WATER (Deep blue outer edge with blocky rounded corners)
                terrain.fillStyle(0x6aa2b8, 1);
                for (let by = 0; by < gridSize; by++) {
                    for (let bx = 0; bx < gridSize; bx++) {
                        if (wg.biomeMap.get(`${bx},${by}`) !== 'wasteland') {
                            const dx = this.fmX + bx * cellSize;
                            const dy = this.fmY + by * cellSize;
                            // Oversized to merge into a single water mass
                            terrain.fillRoundedRect(dx - 16, dy - 16, cellSize + 32, cellSize + 32, 10);
                        }
                    }
                }

                // PASS 2: SAND/BEACH (Warm tan color)
                terrain.fillStyle(0xe7d59f, 1);
                for (let by = 0; by < gridSize; by++) {
                    for (let bx = 0; bx < gridSize; bx++) {
                        if (wg.biomeMap.get(`${bx},${by}`) !== 'wasteland') {
                            const dx = this.fmX + bx * cellSize;
                            const dy = this.fmY + by * cellSize;
                            terrain.fillRoundedRect(dx - 6, dy - 6, cellSize + 12, cellSize + 12, 8);
                        }
                    }
                }

                // PASS 3: INLAND GRASS & FORESTS
                for (let by = 0; by < gridSize; by++) {
                    for (let bx = 0; bx < gridSize; bx++) {
                        const biome = wg.biomeMap.get(`${bx},${by}`);
                        if (biome && biome !== 'wasteland') {
                            let color = 0xb3c16c; // Grassland (Light olive)
                            if (biome === 'forest') color = 0x8a9e4b; // Darker olive
                            else if (biome === 'ruins') color = 0x9e8c78; // Mountains/Rocks
                            else if (biome === 'village') color = 0xded19b; // Very light sand/town
                            else if (biome === 'urban' || biome === 'military_base') color = 0xc2aa74; // Dirt
                            else if (biome === 'lakeside') color = 0x6aa2b8; // Inner water

                            terrain.fillStyle(color, 1);
                            const dx = this.fmX + bx * cellSize;
                            const dy = this.fmY + by * cellSize;
                            terrain.fillRoundedRect(dx, dy, cellSize + 2, cellSize + 2, 6);
                        }
                    }
                }
            }

            // PASS 4: ROADS (Smooth thick paths)
            if (wg.roads) {
                terrain.fillStyle(0xdcc88f, 1); // Sand color for roads
                const pathScale = mapSize / totalTiles;
                for (const roadStr of wg.roads) {
                    const [rx, ry] = roadStr.split(',').map(Number);
                    const rxPos = this.fmX + rx * pathScale;
                    const ryPos = this.fmY + ry * pathScale;
                    terrain.fillCircle(rxPos, ryPos, 3); // Overlapping circles create thick paths
                }
            }

            // PASS 5: DECORATIONS (Vector Trees, Mountains & Details)
            const rng = mainScene.worldGen.rng.fork(999);
            if (wg.biomeMap) {
                for (let by = 0; by < gridSize; by++) {
                    for (let bx = 0; bx < gridSize; bx++) {
                        const biome = wg.biomeMap.get(`${bx},${by}`);
                        const dx = this.fmX + bx * cellSize + cellSize / 2;
                        const dy = this.fmY + by * cellSize + cellSize / 2;

                        if (biome === 'forest' && rng.chance(0.3)) {
                            // Lollipop tree
                            terrain.fillStyle(0xcca052, 1); // Trunk
                            terrain.fillRect(dx - 1, dy, 2, 6);
                            terrain.fillStyle(0xccd344, 1); // Yellow-green canopy
                            terrain.fillCircle(dx, dy - 2, rng.nextInt(4, 7));
                        }
                        else if (biome === 'ruins' && rng.chance(0.15)) {
                            // Mountain triangle
                            terrain.fillStyle(0x7a695c, 1);
                            terrain.fillTriangle(dx, dy - 12, dx - 12, dy + 6, dx + 12, dy + 6);
                            // Highlight slope
                            terrain.fillStyle(0x8a7769, 1);
                            terrain.fillTriangle(dx, dy - 12, dx - 4, dy + 6, dx + 12, dy + 6);
                            // Snow cap
                            terrain.fillStyle(0xddddcf, 1);
                            terrain.fillTriangle(dx, dy - 12, dx - 4, dy - 4, dx + 4, dy - 4);
                        }
                    }
                }
            }

            // Draw RED X at the center
            const centerMapX = this.fmX + mapSize / 2;
            const centerMapY = this.fmY + mapSize / 2 - 15;

            // Sparkles behind chest
            terrain.lineStyle(2, 0xffffff, 0.8);
            terrain.strokeTriangle(centerMapX - 10, centerMapY - 5, centerMapX - 12, centerMapY - 2, centerMapX - 7, centerMapY - 2);
            terrain.strokeTriangle(centerMapX + 15, centerMapY - 10, centerMapX + 12, centerMapY - 13, centerMapX + 18, centerMapY - 13);

            // Red X
            terrain.lineStyle(6, 0xe25d62, 1); // Soft Red X
            terrain.lineBetween(centerMapX - 12, centerMapY + 5, centerMapX + 12, centerMapY + 25);
            terrain.lineBetween(centerMapX - 12, centerMapY + 25, centerMapX + 12, centerMapY + 5);

            // Treasure Chest
            terrain.fillStyle(0xcb6f4e, 1); // Chest orange/brown
            terrain.fillRect(centerMapX - 10, centerMapY - 10, 20, 14);
            terrain.fillStyle(0xa15235, 1); // Chest shadow
            terrain.fillRect(centerMapX - 10, centerMapY - 2, 20, 6);
            terrain.fillStyle(0xe2be5d, 1); // Gold rim
            terrain.fillRect(centerMapX - 10, centerMapY - 4, 20, 2);
            terrain.fillRect(centerMapX - 2, centerMapY - 6, 4, 6); // Lock
        }

        this.fullMapDots = this.add.graphics();
        mapContent.add(this.fullMapDots);

        // Footer signature
        const footerText = this.add.text(cx, this.fmY + mapSize - 20, 'designed by freepik.com style', {
            fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold', color: '#8a8274'
        }).setOrigin(0.5);
        this.fullMapContainer.add(footerText);
    }

    _updateFullMap(px, py) {
        if (!this.fullMapContainer || !this.fullMapContainer.visible) return;
        if (!this.fullMapDots) return;

        this.fullMapDots.clear();

        const mainScene = this.scene.get('OpenWorldScene');
        if (!mainScene) return;

        // Tile to Map Coord Conversion
        const worldPixelSize = this.worldSize || 16000;
        const scale = this.fmSize / worldPixelSize;
        const cx = this.fmX;
        const cy = this.fmY;

        const pMapX = cx + px * scale;
        const pMapY = cy + py * scale;

        const centerX = cx + this.fmSize / 2;
        const centerY = cy + this.fmSize / 2 - 15; // Target is the chest

        // Dotted red trail line to the Treasure!
        this.fullMapDots.fillStyle(0xe25d62, 0.8);
        const distToCenter = Phaser.Math.Distance.Between(pMapX, pMapY, centerX, centerY);
        const steps = Math.floor(distToCenter / 12) || 1;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const dotX = Phaser.Math.Interpolation.Linear([pMapX, centerX], t);
            const dotY = Phaser.Math.Interpolation.Linear([pMapY, centerY], t);
            this.fullMapDots.fillCircle(dotX, dotY, 2.5);
        }

        // Minimalist Enemy representation (Optional, stylized dark tiny dots)
        if (mainScene.aiAgents) {
            this.fullMapDots.fillStyle(0x6e6358, 0.6); // Greyish brown
            for (const agent of mainScene.aiAgents) {
                if (!agent.active) continue;
                this.fullMapDots.fillCircle(cx + agent.x * scale, cy + agent.y * scale, 3);
            }
        }

        // Player Indicator (Stylized Bomb/Canonball icon like the reference image)
        this.fullMapDots.fillStyle(0x35404d, 1); // Dark blue-grey iron
        this.fullMapDots.fillCircle(pMapX, pMapY, 6);
        // Highlight curve
        this.fullMapDots.lineStyle(1.5, 0x5a6a7c, 1);
        this.fullMapDots.beginPath();
        this.fullMapDots.arc(pMapX, pMapY, 4, Math.PI, Math.PI * 1.5);
        this.fullMapDots.strokePath();

        // Bomb fuse spark
        const pulse = Math.abs(Math.sin(this.time.now / 200));
        this.fullMapDots.fillStyle(pulse > 0.5 ? 0xfef08a : 0xf97316, 1); // Yellow/Orange spark
        this.fullMapDots.fillCircle(pMapX + 4, pMapY - 4, pulse > 0.5 ? 3 : 2);
    }

    // ═══════════════════════════════════════════════════════
    // 4. COMPASS — Top Center
    // ═══════════════════════════════════════════════════════

    _createCompass(W) {
        const cx = W / 2;
        const y = 20;
        const cw = 440; // Wide!

        // Premium Compass bg
        const bg = this.add.graphics();
        bg.fillStyle(0x0f172a, 0.75); // Dark Slate
        bg.fillRoundedRect(cx - cw / 2, y, cw, 34, 6);
        bg.lineStyle(2, 0x334155, 0.9);
        bg.strokeRoundedRect(cx - cw / 2, y, cw, 34, 6);

        // Center Marker (Glowing Bright Yellow Triangle pointing down)
        const marker = this.add.graphics();
        marker.fillStyle(0xfacc15, 1);
        marker.fillTriangle(cx - 7, y - 2, cx + 7, y - 2, cx, y + 8);
        marker.lineStyle(1, 0x000000, 0.8);
        marker.strokeTriangle(cx - 7, y - 2, cx + 7, y - 2, cx, y + 8);

        this.compassDirs = [];
        for (let i = 0; i < 360; i += 15) {
            let label = '';
            let isMajor = false;
            let isMinor = false;
            if (i === 0) { label = 'N'; isMajor = true; }
            else if (i === 45) { label = 'NE'; isMinor = true; }
            else if (i === 90) { label = 'E'; isMajor = true; }
            else if (i === 135) { label = 'SE'; isMinor = true; }
            else if (i === 180) { label = 'S'; isMajor = true; }
            else if (i === 225) { label = 'SW'; isMinor = true; }
            else if (i === 270) { label = 'W'; isMajor = true; }
            else if (i === 315) { label = 'NW'; isMinor = true; }
            else { label = i.toString(); }

            let fSize = '11px';
            let fColor = '#94a3b8'; // subtle slate for numbers
            let yOffset = y + 20; // base Y position

            if (label === 'N') { fSize = '20px'; fColor = '#ef4444'; yOffset = y + 17; } // Red N
            else if (isMajor) { fSize = '20px'; fColor = '#f8fafc'; yOffset = y + 17; } // White E, S, W
            else if (isMinor) { fSize = '16px'; fColor = '#cbd5e1'; yOffset = y + 17; } // Light grey NE, SE, ...

            const t = this.add.text(0, 0, label, {
                fontSize: fSize,
                fontFamily: 'monospace',
                fontStyle: 'bold',
                color: fColor,
                stroke: '#000000',
                strokeThickness: isMajor ? 4 : (isMinor ? 3 : 2)
            }).setOrigin(0.5).setVisible(false);

            this.compassDirs.push({ text: t, angle: (i / 180) * Math.PI, baseY: yOffset });
        }

        this.compassCenter = cx;
        this.compassWidth = cw;
    }

    _updateCompass() {
        if (!this.playerRef || !this.playerRef.active) return;

        let playerAngle = this.playerRef.rotation - Math.PI / 2;
        const cx = this.compassCenter;
        const hw = this.compassWidth / 2;
        const fovRad = Math.PI / 1.5; // 120 degree FOV mapped to the compass width

        this.compassDirs.forEach(cd => {
            let diff = cd.angle + playerAngle;
            // Normalize angular difference
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            // X position calculation
            const screenX = cx + (diff / (fovRad / 2)) * hw;
            const edgeDist = Math.abs(screenX - cx);
            const insideBox = edgeDist < hw - 10;

            cd.text.setVisible(insideBox);
            if (insideBox) {
                cd.text.setPosition(screenX, cd.baseY);
                // Fade out at edges
                const alpha = Math.max(0, 1 - Math.pow(edgeDist / (hw - 10), 2));
                cd.text.setAlpha(alpha);
                // Scale effect mimicking 3D FOV distortion
                const scale = 1.0 - (edgeDist / hw) * 0.15;
                cd.text.setScale(scale);
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // 5. KILL COUNTER — Top Right
    // ═══════════════════════════════════════════════════════

    _createKillCounter(W) {
        const x = W - 20;
        const y = 12;

        // Enhanced BG with gradient effect
        const bg = this.add.graphics();
        // Main panel background
        bg.fillStyle(0x0f172a, 0.85);
        bg.fillRoundedRect(x - 110, y - 6, 110, 32, 6);
        // Border glow effect
        bg.lineStyle(2, 0x3b82f6, 0.6);
        bg.strokeRoundedRect(x - 110, y - 6, 110, 32, 6);
        // Inner border
        bg.lineStyle(1, 0x60a5fa, 0.3);
        bg.strokeRoundedRect(x - 108, y - 4, 106, 28, 5);

        // Enhanced skull icon with glow
        const skullIcon = this.add.text(x - 100, y + 2, '💀', { 
            fontSize: '16px', 
            fontStyle: 'bold'
        });
        // Add glow effect to skull
        skullIcon.setShadow(0, 0, '#ef4444', 8);
        skullIcon.setTint(0xff6b6b);

        // Enhanced kill count with better styling
        this.killText = this.add.text(x - 75, y + 3, '0', {
            fontSize: '18px', 
            fontFamily: 'monospace', 
            fontStyle: 'bold',
            color: '#fbbf24',
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#f59e0b',
                blur: 6,
                stroke: true,
                fill: true
            }
        });

        // Add KILLS label
        this.add.text(x - 75, y + 18, 'KILLS', {
            fontSize: '8px', 
            fontFamily: 'monospace', 
            fontStyle: 'bold',
            color: '#94a3b8',
            letterSpacing: 2
        });

        // Enhanced ping display
        this.pingText = this.add.text(x - 8, y + 8, '', {
            fontSize: '9px', 
            fontFamily: 'monospace',
            color: '#10b981',
            fontStyle: 'bold'
        }).setOrigin(1, 0);

        // Add connection indicator
        this.connectionIndicator = this.add.graphics();
        this.connectionIndicator.fillStyle(0x10b981, 0.8);
        this.connectionIndicator.fillCircle(x - 15, y + 8, 3);

        this._lastKillCount = 0;
    }

    _updateKillCounter() {
        const mainScene = this.scene.get('OpenWorldScene');
        const kills = mainScene?.killCount || 0;
        this.killText.setText(`${kills}`);

        // Enhanced flash on new kill with particle effect
        if (kills > this._lastKillCount) {
            this._lastKillCount = kills;
            
            // Scale animation
            this.killText.setScale(1.8);
            this.tweens.add({
                targets: this.killText,
                scaleX: 1, 
                scaleY: 1,
                duration: 400, 
                ease: 'Back.easeOut',
            });

            // Color flash
            this.killText.setColor('#ffffff');
            this.time.delayedCall(200, () => {
                this.killText.setColor('#fbbf24');
            });

            // Create burst particles
            this._createKillBurst(this.killText.x, this.killText.y);
        }

        // Update connection indicator based on ping
        if (this.pingText.text) {
            const ping = parseInt(this.pingText.text);
            if (ping < 50) {
                this.connectionIndicator.fillStyle(0x10b981, 0.8); // Green
            } else if (ping < 100) {
                this.connectionIndicator.fillStyle(0xf59e0b, 0.8); // Yellow
            } else {
                this.connectionIndicator.fillStyle(0xef4444, 0.8); // Red
            }
            this.connectionIndicator.clear();
            this.connectionIndicator.fillCircle(this.pingText.x - 10, this.pingText.y + 2, 3);
        }
    }

    _createKillBurst(x, y) {
        // Create particle burst effect for kills
        for (let i = 0; i < 8; i++) {
            const particle = this.add.graphics();
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 20 + Math.random() * 10;
            
            particle.fillStyle(0xfbbf24, 1);
            particle.fillCircle(0, 0, 2);
            particle.setPosition(x, y);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 600,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    // ═══════════════════════════════════════════════════════
    // 6. KILL FEED — Top Left
    // ═══════════════════════════════════════════════════════

    _createKillFeed() {
        this.killFeedY = 40;
    }

    /** Call this from scene to add a kill feed entry */
    addKillFeedEntry(killer, victim) {
        const text = this.add.text(16, this.killFeedY + this.killFeedItems.length * 18,
            `${killer}  ▸  ${victim}`, {
            fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#f59e0b', stroke: '#000', strokeThickness: 2,
        }).setAlpha(0);

        this.tweens.add({
            targets: text,
            alpha: 1, x: 20, duration: 300, ease: 'Sine.out',
        });

        // Fade out after 5 seconds
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: text,
                alpha: 0, duration: 500,
                onComplete: () => text.destroy(),
            });
        });

        this.killFeedItems.push(text);
        if (this.killFeedItems.length > 4) {
            const old = this.killFeedItems.shift();
            old?.destroy();
        }
    }

    // ═══════════════════════════════════════════════════════
    // 7. VEHICLE PANEL — Bottom Center (replaces weapon bar)
    // ═══════════════════════════════════════════════════════

    _createVehiclePanel(W, H) {
        const cx = W / 2;
        const y = H - 70;
        const pw = 240, ph = 58;

        this.vehiclePanel = this.add.container(cx, y).setVisible(false);

        // BG
        const bg = this.add.graphics();
        bg.fillStyle(this.PANEL_BG, this.PANEL_ALPHA);
        bg.fillRoundedRect(-pw / 2, 0, pw, ph, 6);
        bg.lineStyle(1, 0x3b82f6, 0.3);
        bg.strokeRoundedRect(-pw / 2, 0, pw, ph, 6);
        this.vehiclePanel.add(bg);

        // Vehicle name
        this.vehName = this.add.text(-pw / 2 + 12, 6, 'VEHICLE', {
            fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#3b82f6', letterSpacing: 2,
        });
        this.vehiclePanel.add(this.vehName);

        // Speed number (big)
        this.vehSpeed = this.add.text(pw / 2 - 14, 6, '0', {
            fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#e2e8f0',
        }).setOrigin(1, 0);
        this.vehiclePanel.add(this.vehSpeed);

        // km/h label
        this.add.text(pw / 2 - 12, 16, 'km/h', {
            fontSize: '7px', fontFamily: 'monospace',
            color: '#475569',
        }).setOrigin(0, 0);
        this.vehiclePanel.add(this.children.list[this.children.list.length - 1]);

        // Speed bar bg
        this.add.rectangle(-pw / 2 + 12, 32, pw - 24, 6, 0x1e293b).setOrigin(0, 0);
        this.vehiclePanel.add(this.children.list[this.children.list.length - 1]);

        // Speed bar fill
        this.vehSpeedBar = this.add.rectangle(-pw / 2 + 12, 32, 0, 6, 0x22c55e).setOrigin(0, 0);
        this.vehiclePanel.add(this.vehSpeedBar);

        // Fuel label
        this.vehFuel = this.add.text(-pw / 2 + 12, 43, '⛽ 100', {
            fontSize: '8px', fontFamily: 'monospace',
            color: '#f59e0b',
        });
        this.vehiclePanel.add(this.vehFuel);

        // Exit hint
        const exit = this.add.text(pw / 2 - 12, 44, '[E] EXIT', {
            fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#475569',
        }).setOrigin(1, 0);
        this.vehiclePanel.add(exit);
    }

    _updateVehiclePanel() {
        if (!this.vehicleSystem) return;
        const vData = this.vehicleSystem.getHUDData();
        if (!vData) {
            this.vehiclePanel.setVisible(false);
            return;
        }
        this.vehiclePanel.setVisible(true);
        this.vehName.setText(vData.name);
        this.vehSpeed.setText(`${vData.speed}`);
        this.vehFuel.setText(`⛽ ${vData.fuel}`);

        const speedPct = vData.speed / vData.maxSpeed;
        this.vehSpeedBar.width = (240 - 24) * Math.max(0.01, speedPct);
        this.vehSpeedBar.fillColor = speedPct < 0.5 ? 0x22c55e : speedPct < 0.8 ? 0xf59e0b : 0xef4444;
    }

    // ═══════════════════════════════════════════════════════
    // 8. DAMAGE DIRECTION INDICATORS
    // ═══════════════════════════════════════════════════════

    _createDamageDirectionSystem(W, H) {
        this.dmgDirW = W;
        this.dmgDirH = H;
    }

    _showDamageDirection() {
        // Show red arc on random edge (since we don't track exact source yet)
        const W = this.dmgDirW;
        const H = this.dmgDirH;
        const sides = ['top', 'bottom', 'left', 'right'];
        const side = sides[Math.floor(Math.random() * sides.length)];

        const indicator = this.add.graphics();
        indicator.fillStyle(0xff0000, 0.4);

        switch (side) {
            case 'top':
                indicator.fillRect(W * 0.3, 0, W * 0.4, 6);
                break;
            case 'bottom':
                indicator.fillRect(W * 0.3, H - 6, W * 0.4, 6);
                break;
            case 'left':
                indicator.fillRect(0, H * 0.3, 6, H * 0.4);
                break;
            case 'right':
                indicator.fillRect(W - 6, H * 0.3, 6, H * 0.4);
                break;
        }

        this.tweens.add({
            targets: indicator,
            alpha: 0,
            duration: 1200,
            onComplete: () => indicator.destroy(),
        });
    }

    _updateDamageIndicators() {
        // Handled reactively via _showDamageDirection
    }

    // ═══════════════════════════════════════════════════════
    // 9. LOW HEALTH VIGNETTE
    // ═══════════════════════════════════════════════════════

    _createLowHealthVignette(W, H) {
        this.vignette = this.add.graphics();
        this.vignette.setDepth(999);

        // Red border vignette
        const thickness = 40;
        this.vignette.fillStyle(0xff0000, 0.15);
        // Top
        this.vignette.fillRect(0, 0, W, thickness);
        // Bottom
        this.vignette.fillRect(0, H - thickness, W, thickness);
        // Left
        this.vignette.fillRect(0, 0, thickness, H);
        // Right
        this.vignette.fillRect(W - thickness, 0, thickness, H);

        this.vignette.setAlpha(0);
    }

    _updateLowHealthVignette(d) {
        const healthPct = d.health / d.maxHealth;
        if (healthPct < 0.3) {
            const intensity = (0.3 - healthPct) / 0.3; // 0 to 1
            const pulse = 0.3 + Math.sin(this.time.now / 400) * 0.2;
            this.vignette.setAlpha(intensity * pulse);
        } else {
            this.vignette.setAlpha(0);
        }
    }

    /** Display premium center-screen banners (e.g. for Mode Changes) */
    showSystemMessage(title, subtitle) {
        const { width: W, height: H } = this.scale;
        const cx = W / 2;
        const cy = H * 0.35;

        const mainText = this.add.text(cx, cy, title, {
            fontSize: '32px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#f59e0b', stroke: '#000000', strokeThickness: 6,
            letterSpacing: 8,
        }).setOrigin(0.5).setDepth(2000).setAlpha(0);

        const subText = this.add.text(cx, cy + 45, subtitle, {
            fontSize: '12px', fontFamily: 'monospace',
            color: '#94a3b8', stroke: '#000000', strokeThickness: 3,
            letterSpacing: 3,
        }).setOrigin(0.5).setDepth(2000).setAlpha(0);

        // Animation sequence
        this.tweens.add({
            targets: [mainText, subText],
            alpha: 1,
            y: '-=10',
            duration: 500,
            ease: 'Power2.easeOut'
        });

        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: [mainText, subText],
                alpha: 0,
                y: '-=10',
                duration: 500,
                onComplete: () => {
                    mainText.destroy();
                    subText.destroy();
                }
            });
        });
    }
}
