import { SoundManager } from "../../../lib/game/SoundManager";
import { MIND_ARENA_LEVELS } from "../../../lib/game/LevelConfig";

let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

/**
 * MainMenuScene — Premium game menu with mode selection
 * Inspired by PUBG/Mini Militia mobile game UIs
 */
export class MainMenuScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        this.cameras.main.fadeIn(600, 0, 0, 0);

        // ─── AUDIO ────────────────────────────────────
        SoundManager.init();
        SoundManager.startAmbientMusic();

        // ─── BACKGROUND ────────────────────────────────
        this.createBackground(width, height);

        // ─── ANIMATED PARTICLES (subtle atmosphere) ────
        this.createParticles(width, height);

        // ─── TOP BAR ───────────────────────────────────
        this.createTopBar(width, cx);

        // ─── CENTER: LOGO + TITLE ──────────────────────
        this.createTitleSection(cx, height);

        // ─── MODE BUTTONS ──────────────────────────────
        this.createModeButtons(cx, height);

        // ─── BOTTOM BAR ────────────────────────────────
        this.createBottomBar(width, height, cx);
    }

    // ─── BACKGROUND ─────────────────────────────────────

    createBackground(w, h) {
        const bg = this.add.graphics();
        // Deep dark gradient
        bg.fillGradientStyle(0x0a0f0a, 0x0a0f0a, 0x121a12, 0x1a2a1a, 1);
        bg.fillRect(0, 0, w, h);

        // Subtle diagonal grid pattern
        const grid = this.add.graphics();
        grid.lineStyle(0.5, 0xffffff, 0.03);
        for (let i = -h; i < w + h; i += 40) {
            grid.lineBetween(i, 0, i + h, h);
            grid.lineBetween(i, h, i + h, 0);
        }

        // Ambient glow center
        const glow = this.add.graphics();
        glow.fillStyle(0x2a5a2a, 0.08);
        glow.fillCircle(w / 2, h / 2 - 50, 400);
        glow.fillStyle(0xf59e0b, 0.03);
        glow.fillCircle(w / 2, h / 2 + 100, 300);
    }

    // ─── ANIMATED PARTICLES ─────────────────────────────

    createParticles(w, h) {
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const size = 1 + Math.random() * 2;
            const alpha = 0.05 + Math.random() * 0.15;
            const particle = this.add.circle(x, y, size, 0x4a8a3a, alpha);

            this.tweens.add({
                targets: particle,
                y: y - 100 - Math.random() * 200,
                alpha: 0,
                duration: 4000 + Math.random() * 6000,
                repeat: -1,
                delay: Math.random() * 3000,
                onRepeat: () => {
                    particle.x = Math.random() * w;
                    particle.y = h + 20;
                    particle.alpha = alpha;
                },
            });
        }
    }

    // ─── TOP BAR ────────────────────────────────────────

    createTopBar(w, cx) {
        const bar = this.add.graphics();
        bar.fillStyle(0x000000, 0.5);
        bar.fillRect(0, 0, w, 3);

        // Gold accent line
        bar.fillStyle(0xf59e0b, 0.4);
        bar.fillRect(0, 0, w, 2);
    }

    // ─── TITLE SECTION ──────────────────────────────────

    createTitleSection(cx, height) {
        const titleY = height * 0.18;

        // Logo emblem (military badge)
        const badge = this.add.graphics();
        badge.lineStyle(2.5, 0xf59e0b, 0.8);
        badge.strokeCircle(cx, titleY - 30, 30);
        badge.fillStyle(0x1a2a1a, 1);
        badge.fillCircle(cx, titleY - 30, 27);

        // Inner star
        const star = this.add.text(cx, titleY - 32, '★', {
            fontSize: '28px', color: '#f59e0b',
            stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: star, angle: 360,
            duration: 20000, repeat: -1, ease: 'Linear',
        });

        // Title
        const title = this.add.text(cx, titleY + 15, 'MINDARENA', {
            fontSize: '42px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 10,
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        // Subtitle line
        this.add.text(cx, titleY + 52, 'BATTLE  OF  INTELLIGENCE', {
            fontSize: '11px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#f59e0b',
            fontStyle: 'bold',
            letterSpacing: 6,
        }).setOrigin(0.5);

        // Decorative lines
        const lineW = 120;
        const lineG = this.add.graphics();
        lineG.lineStyle(1, 0xf59e0b, 0.4);
        lineG.lineBetween(cx - lineW - 90, titleY + 52, cx - 90, titleY + 52);
        lineG.lineBetween(cx + 90, titleY + 52, cx + lineW + 90, titleY + 52);
    }

    // ─── MODE BUTTONS ───────────────────────────────────

    createModeButtons(cx, height) {
        const btnY = height * 0.44;
        const btnGap = 65;

        // SOLO CAMPAIGN (primary)
        this.createPrimaryButton(cx, btnY, '⚔️  SOLO  CAMPAIGN', 'Battle against AI agents', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('LevelSelectScene');
            });
        });

        // MULTIPLAYER (secondary)
        this.createSecondaryButton(cx, btnY + btnGap, '🌐  MULTIPLAYER', 'Create room or join a friend', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('LobbyScene');
            });
        });

        // QUICK PLAY (tertiary)
        this.createSecondaryButton(cx, btnY + btnGap * 2, '⚡  QUICK  PLAY', 'Jump into a random match', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', { level: 1, stage: 1 });
            });
        });

        // PLAYER STATS
        this.createSecondaryButton(cx, btnY + btnGap * 3, '📊  PLAYER  STATS', 'View career stats & abilities', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('StatsScene');
            });
        });
    }

    createPrimaryButton(x, y, label, subtitle, onClick) {
        const container = this.add.container(x, y).setDepth(10);
        const w = 340, h = 56;

        // Glow behind
        const glow = this.add.graphics();
        glow.fillStyle(0xf59e0b, 0.08);
        glow.fillRoundedRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 18);
        container.add(glow);

        // Main button
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x2a5a2a, 0x2a5a2a, 0x1a3a1a, 0x1a3a1a, 1);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.lineStyle(1.5, 0xf59e0b, 0.6);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        container.add(bg);

        // Label
        const text = this.add.text(0, -5, label, {
            fontSize: '16px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
            letterSpacing: 3,
        }).setOrigin(0.5);
        container.add(text);

        // Subtitle
        const sub = this.add.text(0, 14, subtitle, {
            fontSize: '9px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#8a9a8a',
            letterSpacing: 1,
        }).setOrigin(0.5);
        container.add(sub);

        // Interactive
        container.setSize(w, h);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 150, ease: 'Back.easeOut' });
            text.setColor('#f59e0b');
            glow.clear(); glow.fillStyle(0xf59e0b, 0.15);
            glow.fillRoundedRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 18);
            SoundManager.uiHover();
        });
        container.on('pointerout', () => {
            this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
            text.setColor('#ffffff');
            glow.clear(); glow.fillStyle(0xf59e0b, 0.08);
            glow.fillRoundedRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 18);
        });
        container.on('pointerdown', () => {
            this.tweens.add({ targets: container, scaleX: 0.97, scaleY: 0.97, duration: 80 });
        });
        container.on('pointerup', () => {
            this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
            SoundManager.uiClick();
            if (onClick) onClick();
        });

        return container;
    }

    createSecondaryButton(x, y, label, subtitle, onClick) {
        const container = this.add.container(x, y).setDepth(10);
        const w = 300, h = 48;

        const bg = this.add.graphics();
        bg.fillStyle(0x1a2a1a, 0.8);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
        bg.lineStyle(1, 0x4a6a4a, 0.4);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
        container.add(bg);

        const text = this.add.text(0, -5, label, {
            fontSize: '13px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#b0c0b0',
            fontStyle: 'bold',
            letterSpacing: 2,
        }).setOrigin(0.5);
        container.add(text);

        const sub = this.add.text(0, 12, subtitle, {
            fontSize: '8px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#5a6a5a',
            letterSpacing: 1,
        }).setOrigin(0.5);
        container.add(sub);

        container.setSize(w, h);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 150 });
            text.setColor('#ffffff');
            SoundManager.uiHover();
        });
        container.on('pointerout', () => {
            this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
            text.setColor('#b0c0b0');
        });
        container.on('pointerup', () => {
            SoundManager.uiClick();
            if (onClick) onClick();
        });

        return container;
    }

    // ─── BOTTOM BAR ─────────────────────────────────────

    createBottomBar(w, h, cx) {
        const barY = h - 45;

        // Bottom gradient
        const grad = this.add.graphics();
        grad.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.5, 0.5);
        grad.fillRect(0, h - 80, w, 80);

        // Small nav buttons
        const navBtns = [
            { label: '⚙ SETTINGS', x: cx - 150 },
            { label: '📊 STATS', x: cx },
            { label: 'ℹ ABOUT', x: cx + 150 },
        ];

        navBtns.forEach(btn => {
            const t = this.add.text(btn.x, barY, btn.label, {
                fontSize: '10px',
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                color: '#4a6a4a',
                fontStyle: 'bold',
                letterSpacing: 1,
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            t.on('pointerover', () => t.setColor('#f59e0b'));
            t.on('pointerout', () => t.setColor('#4a6a4a'));
        });

        // Version
        this.add.text(cx, h - 15, 'v1.0  |  GOAP Engine  |  Phaser 3', {
            fontSize: '8px',
            fontFamily: 'monospace',
            color: '#2a3a2a',
        }).setOrigin(0.5);
    }

    // ─── NOTIFICATION ───────────────────────────────────

    showNotification(msg) {
        const { width } = this.scale;
        const note = this.add.text(width / 2, 80, msg, {
            fontSize: '12px',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            color: '#f59e0b',
            fontStyle: 'bold',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: note,
            alpha: 0, y: 60,
            duration: 1500, delay: 1500,
            onComplete: () => note.destroy(),
        });
    }
}
