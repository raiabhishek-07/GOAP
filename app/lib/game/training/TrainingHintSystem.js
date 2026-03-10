let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class TrainingHintSystem {
    constructor(scene) {
        this.scene = scene;
        this.activeHints = [];
    }

    // Displays contextual tooltips floating in the world
    showHint(text, x = 640, y = 100) {
        const bubble = this.scene.add.container(x, y).setDepth(200);

        const textObj = this.scene.add.text(0, 0, text, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#000000',
            backgroundColor: '#fcd34d',
            padding: { x: 10, y: 10 },
            align: 'center'
        }).setOrigin(0.5);

        bubble.add(textObj);

        this.scene.tweens.add({
            targets: bubble,
            alpha: { from: 1, to: 0 },
            y: y - 20,
            delay: 4000,
            duration: 1000,
            onComplete: () => bubble.destroy()
        });
    }
}
