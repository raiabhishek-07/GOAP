let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class PreloadScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;

        // ─── BACKGROUND ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x020617, 0x020617, 0x0a0f0a, 0x0a0f0a, 1);
        bg.fillRect(0, 0, width, height);

        // Subtile scanning line
        this.scanLine = this.add.graphics();
        this.scanLine.fillStyle(0x22c55e, 0.05);
        this.scanLine.fillRect(0, 0, width, 50);

        // ─── CENTRAL HUD ───────────────────────────────
        const hud = this.add.graphics();
        hud.lineStyle(1, 0x22c55e, 0.15);
        hud.strokeCircle(cx, cy, 120);
        hud.lineStyle(0.5, 0x22c55e, 0.05);
        hud.strokeCircle(cx, cy, 140);

        // Title
        this.add.text(cx, cy - 10, 'MINDARENA', {
            fontSize: '28px',
            fontFamily: '"Inter","Segoe UI",sans-serif',
            color: '#ffffff', fontStyle: 'bold',
            letterSpacing: 12,
        }).setOrigin(0.5);

        this.statusText = this.add.text(cx, cy + 25, 'INITIALIZING SYSTEMS...', {
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#4a6a4a',
            letterSpacing: 4
        }).setOrigin(0.5);

        // Progress text
        this.progressPercent = this.add.text(cx, cy + 180, '0%', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#22c55e',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // ─── ANIMATE ───────────────────────────────────
        this.tweens.add({
            targets: this.scanLine,
            y: height,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });

        const statusMessages = [
            'BOOTING CORE...',
            'LOADING RESOURCES...',
            'LINKING TACTICAL NET...',
            'CALIBRATING INTERFACE...',
            'READY'
        ];

        let progress = 0;
        this.time.addEvent({
            delay: 40,
            repeat: 50,
            callback: () => {
                progress += 2;
                this.progressPercent.setText(`${progress}%`);

                const msgIdx = Math.floor((progress / 100) * (statusMessages.length - 1));
                this.statusText.setText(statusMessages[msgIdx]);

                if (progress >= 100) {
                    this.statusText.setColor('#22c55e');
                    this.time.delayedCall(500, () => {
                        this.cameras.main.fadeOut(500, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            // Check if this is a direct gameplay launch (from /game/play/[level]/[stage])
                            const launch = typeof window !== 'undefined' && window.__MINDARENA_LAUNCH__;
                            if (launch && launch.directLaunch) {
                                this.scene.start('DeploymentLoadingScene', {
                                    level: launch.level || 1,
                                    stage: launch.stage || 1
                                });
                            } else {
                                this.scene.start('MainMenuScene');
                            }
                        });
                    });
                }
            }
        });
    }
}
