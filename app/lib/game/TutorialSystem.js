import * as Phaser from "phaser";

/**
 * TutorialSystem — Handles in-game educational overlays
 * Active only if stage.showTutorial is true
 */
export class TutorialSystem {
    constructor(scene) {
        this.scene = scene;
        this.active = !!scene.levelConfig.showTutorial;
        this.currentStep = 0;
        this.overlays = [];
        this.hints = [
            {
                trigger: 'start',
                title: 'MOVEMENT',
                text: 'USE [W,A,S,D] TO MOVE THE OPERATOR.\nHOLD [SHIFT] TO DASH THROUGH DANGER.',
                bubble: { x: 200, y: 720 }, // Near player spawn
                arrow: 'down'
            },
            {
                trigger: 'near_task',
                title: 'TERMINALS',
                text: 'GET CLOSE TO A DATA TERMINAL.\nHOLD [SPACE] OR [E] TO START CHANNELING.',
                bubble: { x: 550, y: 440 },
                arrow: 'down'
            },
            {
                trigger: 'plan_phase',
                title: 'PLANNING PHASE',
                text: 'DURING PLAN PHASE, YOU CAN SEE\nENEMY ROUTES AND OBJECTIVE DATA.',
                bubble: { x: 600, y: 300 },
                arrow: 'none'
            },
            {
                trigger: 'extraction',
                title: 'EXTRACTION',
                text: 'ALL TASKS COMPLETE!\nHEAD TO THE EVAC POINT TO FINISH.',
                bubble: { x: 2050, y: 1250 },
                arrow: 'down'
            }
        ];

        this.triggered = new Set();
    }

    init() {
        if (!this.active) return;

        // Show first hint after fade in
        this.scene.time.delayedCall(1500, () => {
            this.showHint('start');
        });
    }

    update() {
        if (!this.active) return;

        // Check proximity for 'near_task'
        if (!this.triggered.has('near_task')) {
            const dist = Phaser.Math.Distance.Between(
                this.scene.player.x, this.scene.player.y,
                600, 500 // Terminal Alpha
            );
            if (dist < 150) {
                this.showHint('near_task');
            }
        }
    }

    /**
     * Show a tutorial hint manually
     */
    showHint(key) {
        if (this.triggered.has(key)) return;
        this.triggered.add(key);

        const hint = this.hints.find(h => h.trigger === key);
        if (!hint) return;

        this.createHintOverlay(hint);
    }

    createHintOverlay(hint) {
        const { x, y } = hint.bubble;
        const container = this.scene.add.container(x, y).setDepth(200).setAlpha(0);

        // Panel
        const bg = this.scene.add.graphics();
        const w = 240, h = 65;
        bg.fillStyle(0x000000, 0.85);
        bg.lineStyle(1.5, 0x60a5fa, 0.7);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
        container.add(bg);

        // Arrow
        if (hint.arrow === 'down') {
            const arrow = this.scene.add.graphics();
            arrow.fillStyle(0x60a5fa, 0.85);
            arrow.fillTriangle(-10, h / 2, 10, h / 2, 0, h / 2 + 12);
            container.add(arrow);
        }

        // Title
        const title = this.scene.add.text(0, -22, `[ TUTORIAL: ${hint.title} ]`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#60a5fa', fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(title);

        // Text
        const text = this.scene.add.text(0, 8, hint.text, {
            fontSize: '8px', fontFamily: 'monospace', color: '#ffffff',
            align: 'center', lineSpacing: 4
        }).setOrigin(0.5);
        container.add(text);

        // Animation
        this.scene.tweens.add({
            targets: container,
            alpha: 1,
            y: y - 10,
            duration: 500,
            ease: 'Power2'
        });

        // Floating effect
        this.scene.tweens.add({
            targets: container,
            y: y - 20,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.overlays.push(container);

        // Auto-dismiss after 8s
        this.scene.time.delayedCall(8000, () => {
            if (container.active) {
                this.scene.tweens.add({
                    targets: container,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => container.destroy()
                });
            }
        });
    }

    clear() {
        this.overlays.forEach(o => o.destroy());
        this.overlays = [];
    }
}
