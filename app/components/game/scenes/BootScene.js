let Phaser;
if (typeof window !== 'undefined') {
    Phaser = require("phaser");
}

export class BootScene extends (Phaser ? Phaser.Scene : Object) {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Generate loading bar textures (used by PreloadScene)
        this.createTexture('loading_bg', 400, 20, 0x1e293b);
        this.createTexture('loading_fill', 400, 20, 0x60a5fa);

        // Simple logo texture (using generateTexture for stability)
        const g = this.add.graphics();
        g.fillStyle(0x60a5fa, 1);
        g.fillCircle(32, 32, 28);
        g.fillStyle(0x020617, 1);
        g.fillCircle(32, 32, 18);
        g.fillStyle(0x00f2ff, 1);
        g.fillCircle(32, 28, 6);
        g.fillStyle(0xf59e0b, 1);
        g.fillTriangle(24, 38, 40, 38, 32, 48);
        g.generateTexture('logo_icon', 64, 64);
        g.destroy();

        this.scene.start('PreloadScene');
    }

    createTexture(key, w, h, color) {
        const g = this.add.graphics();
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, w, h, h / 2);
        g.generateTexture(key, w, h);
        g.destroy();
    }
}
