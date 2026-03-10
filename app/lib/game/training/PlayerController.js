let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class PlayerController {
    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.add.circle(x, y, 16, 0x3b82f6).setDepth(50);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);

        this.health = 100;
        this.ammo = 30;
        this.treasuresCollected = 0;

        // Input
        this.keys = scene.input.keyboard.addKeys('W,A,S,D');
        this.shift = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    }

    get x() { return this.sprite.x; }
    get y() { return this.sprite.y; }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) this.health = 0;
    }

    update() {
        const speed = this.shift.isDown ? 300 : 150;
        let vx = 0;
        let vy = 0;

        if (this.keys.A.isDown) vx = -speed;
        if (this.keys.D.isDown) vx = speed;
        if (this.keys.W.isDown) vy = -speed;
        if (this.keys.S.isDown) vy = speed;

        this.sprite.body.setVelocity(vx, vy);
    }
}
