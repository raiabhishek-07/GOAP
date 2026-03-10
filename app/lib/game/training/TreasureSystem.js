let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class TreasureSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.treasures = [];
    }

    spawn(x, y) {
        const box = this.scene.add.text(x, y, '🎁', { fontSize: '32px' }).setOrigin(0.5).setDepth(15);
        this.scene.physics.add.existing(box);
        this.treasures.push({ sprite: box, active: true });
    }

    update() {
        const eKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        if (Phaser.Input.Keyboard.JustDown(eKey)) {
            this.treasures.forEach(t => {
                if (!t.active) return;

                const dist = Phaser.Math.Distance.Between(t.sprite.x, t.sprite.y, this.player.x, this.player.y);
                if (dist < 60) {
                    t.sprite.destroy();
                    t.active = false;
                    this.player.treasuresCollected++;

                    if (this.player.treasuresCollected < 3) {
                        this.scene.hintSystem.showHint("Good! Now find next treasure.", this.player.x, this.player.y - 40);
                    }
                }
            });
        }
    }
}
