import * as Phaser from "phaser";

export class BaseSurvivor extends Phaser.GameObjects.Container {
    constructor(scene, x, y, label, isAgent = true, theme = null) {
        super(scene, x, y);
        this.scene = scene;
        this.isAgent = isAgent;
        this.theme = theme;

        // Visual Layers
        this.visuals = scene.add.container(0, 0);
        this.add(this.visuals);

        this.setupVisuals();
        this.setupHUD(label);

        scene.add.existing(this);
    }

    setupVisuals() {
        this.shadow = this.scene.add.ellipse(0, 15, 24, 8, 0x000000, 0.2);

        const skinColor = this.theme?.skin || (this.isAgent ? 0xfef3c7 : 0xfee2e2);
        const hairColor = this.theme?.hair || (this.isAgent ? 0x713f12 : 0xef4444);
        const bodyColor = this.theme?.body || (this.isAgent ? 0x475569 : 0x991b1b);

        // Character Visuals
        const head = this.scene.add.graphics();
        head.fillStyle(skinColor);
        head.fillCircle(0, 0, 16);
        head.lineStyle(1.5, 0x422006);
        head.strokeCircle(0, 0, 16);

        const hair = this.scene.add.graphics();
        hair.fillStyle(hairColor);
        hair.slice(0, -4, 17, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), true);
        hair.fillPath();

        const body = this.scene.add.graphics();
        body.fillStyle(bodyColor);
        body.fillRoundedRect(-10, 12, 20, 12, 4);

        this.visuals.add([this.shadow, body, head, hair]);

        if (this.isAgent) {
            const ribbon = this.scene.add.graphics();
            ribbon.fillStyle(0xef4444);
            ribbon.fillEllipse(-10, -18, 14, 10);
            ribbon.fillEllipse(10, -18, 14, 10);
            ribbon.fillCircle(0, -18, 4);
            this.visuals.add(ribbon);
        }
    }

    setupHUD(label) {
        this.nameTag = this.scene.add.text(0, -45, label.toUpperCase(), {
            fontSize: '10px',
            fontWeight: '900',
            color: this.isAgent ? '#60a5fa' : '#ef4444'
        }).setOrigin(0.5);
        this.add(this.nameTag);

        this.barBg = this.scene.add.rectangle(0, -32, 40, 4, 0x000000, 0.5);
        this.barFill = this.scene.add.rectangle(-20, -32, 40, 4, 0x22c55e).setOrigin(0, 0.5);
        this.add([this.barBg, this.barFill]);
    }

    updateStats(health) {
        this.barFill.width = (health / 100) * 40;
        this.visuals.y = Math.sin(this.scene.time.now / 200) * 3;
    }
}
