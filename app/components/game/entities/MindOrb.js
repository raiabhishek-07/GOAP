import * as Phaser from "phaser";

export class MindOrb extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);
        this.scene = scene;

        // 🌀 Glow Core
        this.core = scene.add.graphics();
        this.core.fillStyle(0x00f2ff, 1);
        this.core.fillCircle(0, 0, 8);

        // ☢️ Energy Ring
        this.ring = scene.add.graphics();
        this.ring.lineStyle(2, 0x00f2ff, 0.5);
        this.ring.strokeCircle(0, 0, 15);

        this.add([this.core, this.ring]);

        // Animations
        scene.tweens.add({
            targets: this.ring,
            scale: 1.5,
            alpha: 0,
            duration: 1000,
            repeat: -1
        });

        scene.tweens.add({
            targets: this,
            y: y - 10,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        scene.add.existing(this);

        // Circular collider
        scene.physics.add.existing(this);
        this.body.setCircle(15);
    }
}
