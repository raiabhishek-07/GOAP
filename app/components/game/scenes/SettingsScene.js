// ============================================================
// SettingsScene.js — Professional Game Settings UI
// Premium glassmorphism design with sidebar navigation
// ============================================================

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class SettingsScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'SettingsScene' });
        this.activeCategory = 'AUDIO';
    }

    create() {
        const { width, height } = this.scale;
        
        // ─── BACKGROUND ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0f1e, 0x0a0f1e, 0x020617, 0x020617, 1);
        bg.fillRect(0, 0, width, height);

        // Animated ambient particles
        this.createParticles(width, height);

        // ─── MAIN CONTAINER (Glassmorphism) ─────────────
        const margin = 50;
        const panelW = width - margin * 2;
        const panelH = height - margin * 2;
        const panelX = margin;
        const panelY = margin;

        const panel = this.add.graphics();
        panel.fillStyle(0x0f172a, 0.7);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
        panel.lineStyle(1, 0x3b82f6, 0.3);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

        // Sidebar Divider
        const sidebarW = 200;
        panel.lineBetween(panelX + sidebarW, panelY + 20, panelX + sidebarW, panelY + panelH - 20);

        // ─── HEADER ────────────────────────────────────
        this.add.text(panelX + 30, panelY + 30, 'SYSTEM_CONFIG', {
            fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#3b82f6', letterSpacing: 4
        });

        // ─── SIDEBAR NAVIGATION ─────────────────────────
        const categories = ['AUDIO', 'CONTROLS', 'GRAPHICS', 'GAMEPLAY'];
        this.sidebarItems = [];

        categories.forEach((cat, i) => {
            const item = this.createSidebarItem(panelX + 30, panelY + 100 + i * 50, cat);
            this.sidebarItems.push(item);
        });

        // ─── CONTENT AREA ──────────────────────────────
        this.contentContainer = this.add.container(panelX + sidebarW + 40, panelY + 100);
        this.renderActiveCategory();

        // ─── BACK BUTTON ───────────────────────────────
        const backBtn = this.add.text(width - 100, height - 75, '<< BACK', {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#94a3b8', backgroundColor: 'rgba(59, 130, 246, 0.1)',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setColor('#ffffff').setBackgroundColor('rgba(59, 130, 246, 0.3)'));
        backBtn.on('pointerout', () => backBtn.setColor('#94a3b8').setBackgroundColor('rgba(59, 130, 246, 0.1)'));
        backBtn.on('pointerup', () => this.scene.start('MainMenuScene'));

        // ESC to go back
        this.input.keyboard.once('keydown-ESC', () => this.scene.start('MainMenuScene'));
    }

    createSidebarItem(x, y, label) {
        const text = this.add.text(x, y, label, {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: label === this.activeCategory ? '#f59e0b' : '#64748b',
            letterSpacing: 2
        }).setInteractive({ useHandCursor: true });

        text.on('pointerover', () => { if (label !== this.activeCategory) text.setColor('#cbd5e1'); });
        text.on('pointerout', () => { if (label !== this.activeCategory) text.setColor('#64748b'); });
        text.on('pointerup', () => {
            this.activeCategory = label;
            this.updateSidebarStyles();
            this.renderActiveCategory();
        });

        return { label, text };
    }

    updateSidebarStyles() {
        this.sidebarItems.forEach(item => {
            item.text.setColor(item.label === this.activeCategory ? '#f59e0b' : '#64748b');
        });
    }

    renderActiveCategory() {
        this.contentContainer.removeAll(true);
        
        const title = this.add.text(0, -40, `CATEGORY: ${this.activeCategory}`, {
            fontSize: '11px', fontFamily: 'monospace', color: '#475569', letterSpacing: 2
        });
        this.contentContainer.add(title);

        switch (this.activeCategory) {
            case 'AUDIO': this.renderAudioSettings(); break;
            case 'CONTROLS': this.renderControlSettings(); break;
            case 'GRAPHICS': this.renderGraphicsSettings(); break;
            case 'GAMEPLAY': this.renderGameplaySettings(); break;
        }
    }

    // ─── SETTINGS RENDERERS ────────────────────────────

    renderAudioSettings() {
        this.createSlider(0, 20, 'MASTER VOLUME', 80);
        this.createSlider(0, 80, 'MUSIC VOLUME', 60);
        this.createSlider(0, 140, 'SFX VOLUME', 90);
    }

    renderControlSettings() {
        const controls = [
            { key: 'WASD', action: 'MOVEMENT / DRIVING' },
            { key: 'MOUSE', action: 'AIM & SHOOT' },
            { key: 'SHIFT', action: 'SPRINT / ACCEL' },
            { key: 'E', action: 'INTERACT / ENTER' },
            { key: 'R', action: 'RELOAD' },
            { key: 'V', action: 'TOGGLE CAMERA VIEW' },
            { key: '1/2/3', action: 'SWITCH WEAPONS' },
        ];

        controls.forEach((c, i) => {
            const h = this.add.text(0, 20 + i * 35, c.key.padEnd(8), { fontSize: '14px', color: '#f59e0b', fontFamily: 'monospace' });
            const d = this.add.text(100, 20 + i * 35, `:: ${c.action}`, { fontSize: '14px', color: '#94a3b8', fontFamily: 'monospace' });
            this.contentContainer.add([h, d]);
        });
    }

    renderGraphicsSettings() {
        this.createToggle(0, 20, 'VSYNC', true);
        this.createToggle(0, 70, 'BLOOM EFFECTS', true);
        this.createToggle(0, 120, 'DYNAMIC SHADOWS', true);
        this.createSlider(0, 170, 'FIELD OF VIEW', 70, 60, 110);
    }

    renderGameplaySettings() {
        this.createToggle(0, 20, 'CAMERA SHAKE', true);
        this.createToggle(0, 70, 'DAMAGE POPUPS', true);
        this.createToggle(0, 120, 'SHOW KILL FEED', true);
        this.createSlider(0, 170, 'HUD OPACITY', 100);
    }

    // ─── UI HELPERS ────────────────────────────────────

    createSlider(x, y, label, value, min = 0, max = 100) {
        const text = this.add.text(x, y, label, { fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1' });
        
        const trackW = 300;
        const track = this.add.rectangle(x, y + 25, trackW, 4, 0x1e293b).setOrigin(0, 0.5);
        const fill = this.add.rectangle(x, y + 25, (value / max) * trackW, 4, 0x3b82f6).setOrigin(0, 0.5);
        
        const handle = this.add.circle(x + (value / max) * trackW, y + 25, 6, 0xffffff);
        handle.setInteractive({ useHandCursor: true });
        this.input.setDraggable(handle);

        const valText = this.add.text(x + trackW + 20, y + 25, `${value}%`, { fontSize: '10px', color: '#3b82f6' }).setOrigin(0, 0.5);

        this.input.on('drag', (pointer, obj, dragX) => {
            if (obj === handle) {
                const nx = Phaser.Math.Clamp(dragX, x, x + trackW);
                obj.x = nx;
                const pct = (nx - x) / trackW;
                fill.width = nx - x;
                valText.setText(`${Math.round(pct * max)}%`);
            }
        });

        this.contentContainer.add([text, track, fill, handle, valText]);
    }

    createToggle(x, y, label, active) {
        const text = this.add.text(x, y, label, { fontSize: '12px', fontFamily: 'monospace', color: '#cbd5e1' });
        
        const toggleW = 40, toggleH = 20;
        const bg = this.add.rectangle(x, y + 25, toggleW, toggleH, active ? 0x22c55e : 0x475569).setOrigin(0, 0.5);
        const knob = this.add.circle(x + (active ? 30 : 10), y + 25, 8, 0xffffff);
        
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerup', () => {
            active = !active;
            bg.setFillStyle(active ? 0x22c55e : 0x475569);
            this.tweens.add({ targets: knob, x: x + (active ? 30 : 10), duration: 150, ease: 'Power2' });
        });

        this.contentContainer.add([text, bg, knob]);
    }

    createParticles(w, h) {
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const p = this.add.circle(x, y, 1 + Math.random(), 0x3b82f6, 0.1 + Math.random() * 0.2);
            this.tweens.add({
                targets: p,
                alpha: 0,
                duration: 2000 + Math.random() * 2000,
                repeat: -1,
                yoyo: true
            });
        }
    }
}
