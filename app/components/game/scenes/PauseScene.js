let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class PauseScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'PauseScene' });
    }

    init(data) {
        this.level = data?.level || 1;
        this.stage = data?.stage || 1;
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        // ─── DIMMED BACKGROUND ─────────────────────────
        const dim = this.add.graphics();
        dim.fillStyle(0x020617, 0.85);
        dim.fillRect(0, 0, width, height);

        // ─── PANEL ─────────────────────────────────────
        const panelW = 320, panelH = 300;
        const panelX = cx - panelW / 2;
        const panelY = cy - panelH / 2;

        const bg = this.add.graphics();
        this.drawTacticalBox(bg, panelX, panelY, panelW, panelH, 0xf59e0b, 0.3);

        // ─── TITLE ─────────────────────────────────────
        this.add.text(cx, panelY + 35, 'TACTICAL_STANDBY', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#f59e0b', fontStyle: 'bold',
            letterSpacing: 6,
        }).setOrigin(0.5);

        this.add.text(cx, panelY + 55, `ACTIVE_SECTOR: ${this.level}.${this.stage}`, {
            fontSize: '8px', fontFamily: 'monospace',
            color: '#64748b', letterSpacing: 2,
        }).setOrigin(0.5);

        // ─── BUTTONS ───────────────────────────────────
        const btnData = [
            { label: '>> RESUME_OPS', color: '#10b981', action: () => this.resumeGame() },
            { label: '>> RESTART_OPS', color: '#f59e0b', action: () => this.restartGame() },
            { label: '>> ABORT_OPS', color: '#64748b', action: () => this.returnToMenu() },
        ];

        btnData.forEach((btn, i) => {
            const by = panelY + 110 + i * 55;
            this.createMenuButton(cx, by, panelW - 80, 40, btn.label, btn.color, btn.action);
        });

        // ─── KEYBOARD LISTENER ─────────────────────────
        this.input.keyboard.once('keydown-ESC', () => {
            this.resumeGame();
        });
    }

    drawTacticalBox(g, x, y, w, h, color = 0xf59e0b, alpha = 0.4) {
        g.lineStyle(1, color, alpha);
        g.strokeRect(x, y, w, h);
        g.fillStyle(0x000000, 0.8);
        g.fillRect(x, y, w, h);

        const len = 10;
        g.lineStyle(2, color, 1);
        g.lineBetween(x, y, x + len, y); g.lineBetween(x, y, x, y + len); // TL
        g.lineBetween(x + w, y, x + w - len, y); g.lineBetween(x + w, y, x + w, y + len); // TR
        g.lineBetween(x, y + h, x + len, y + h); g.lineBetween(x, y + h, x, y + h - len); // BL
        g.lineBetween(x + w, y + h, x + w - len, y + h); g.lineBetween(x + w, y + h, x + w, y + h - len); // BR
    }

    createMenuButton(x, y, w, h, label, color, onClick) {
        const container = this.add.container(x, y);

        const bg = this.add.graphics();
        const hexColor = Phaser.Display.Color.HexStringToColor(color).color;
        this.drawTacticalBox(bg, -w / 2, -h / 2, w, h, hexColor, 0.3);
        container.add(bg);

        const text = this.add.text(0, 0, label, {
            fontSize: '11px', fontFamily: 'monospace',
            color: color, fontStyle: 'bold', letterSpacing: 2,
        }).setOrigin(0.5);
        container.add(text);

        container.setSize(w, h);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            text.setColor('#ffffff');
            bg.clear();
            this.drawTacticalBox(bg, -w / 2, -h / 2, w, h, 0xffffff, 0.6);
        });
        container.on('pointerout', () => {
            text.setColor(color);
            bg.clear();
            this.drawTacticalBox(bg, -w / 2, -h / 2, w, h, hexColor, 0.3);
        });
        container.on('pointerup', onClick);

        return container;
    }

    resumeGame() {
        this.scene.stop();
        this.scene.resume('GameScene');
    }

    restartGame() {
        this.scene.stop();
        this.scene.stop('GameScene');
        this.scene.stop('GameHUD');
        this.scene.start('GameScene', { level: this.level, stage: this.stage });
    }

    returnToMenu() {
        this.scene.stop();
        this.scene.stop('GameScene');
        this.scene.stop('GameHUD');
        this.scene.start('MainMenuScene');
    }
}
